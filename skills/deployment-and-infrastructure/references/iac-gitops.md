# Infrastructure as Code and GitOps

Tool choice, state, layout, review, testing, drift, and GitOps. Licensing and product facts are as of 2026-09.

## Contents
1. Landscape and licensing
2. Choosing a tool
3. What goes in code
4. State
5. Layout: environments and modules
6. Operations by pull request
7. Testing and policy
8. Drift and "no manual changes"
9. Protecting stateful resources
10. GitOps
11. Review checklist
12. Rules catalog

## 1. Landscape and licensing

- **Terraform:** HashiCorp relicensed it from MPL 2.0 to the Business Source License 1.1 on 2023-08-10.
- **OpenTofu:** the OpenTF manifesto followed within days; the fork was accepted into the Linux Foundation as OpenTofu on 2023-09-20, under MPL 2.0. OpenTofu added native client-side encryption of state and plan files (since 1.7), whereas Terraform relies on the backend's encryption.
- **IBM** completed its acquisition of HashiCorp on 2025-02-27.
- Other options: **Pulumi** (TypeScript, Python, Go, and others; state in Pulumi Cloud or a self-managed backend), **AWS CDK** (synthesizes CloudFormation), **Bicep** (Azure), **Crossplane** (infrastructure as Kubernetes APIs).

## 2. Choosing a tool

| Tool | Choose when | Trade-offs |
|---|---|---|
| Terraform or OpenTofu (HCL) | Multi-cloud or many SaaS providers; declarative, reviewable plans; OpenTofu when licensing, open governance, or state encryption matter | HCL limits abstraction; state management is yours |
| Pulumi | The team wants real languages, loops, abstractions, and unit tests | More power means more ways to be clever; plans less uniform to review |
| AWS CDK / Bicep | Single-cloud shops deep in AWS or Azure | Lock-in; CloudFormation/ARM speed and limits |
| Crossplane | A platform team exposing infrastructure as Kubernetes APIs | Needs Kubernetes and operator expertise |
| PaaS config files (`fly.toml`, `render.yaml`, `vercel.json`) | Small apps on a PaaS | Limited scope — still version them |

Default for a new product on a major cloud: Terraform or OpenTofu, one state per environment per component, plan-in-PR.

## 3. What goes in code

Everything that would otherwise be clicked: networks, compute, databases, buckets, IAM roles and policy attachments, DNS, secret **containers** (never values), app platform settings, alerts and monitors, dashboards (the Microsoft playbook lists availability alerting and monitoring rules as IaC too), budgets, and tags.

## 4. State

- **Remote, locked, encrypted, versioned, access-restricted.** State can contain sensitive values; treat the state bucket as a secret store.
- **S3 backend locking:** `use_lockfile = true` enables native S3 lock files (conditional writes). It arrived in Terraform 1.10 and is GA in 1.11, where the DynamoDB lock table (`dynamodb_table`) is deprecated.

```hcl
terraform {
  required_version = ">= 1.11"
  backend "s3" {
    bucket       = "acme-tfstate-prod"   # in the prod account; versioning + KMS encryption + public access blocked
    key          = "app/terraform.tfstate"
    region       = "eu-west-1"
    use_lockfile = true                  # native S3 locking; no DynamoDB table
    encrypt      = true
  }
  required_providers {
    aws = { source = "hashicorp/aws", version = "<pin the major you tested>" }
  }
}
```
- Commit `.terraform.lock.hcl`; pin provider and module versions.
- State for production lives in the production account; nonprod state cannot be written with production credentials and vice versa.

## 5. Layout: environments and modules

- **One state per environment per component** keeps blast radius and plan time small:
```
infra/
  modules/            # reusable: network, app-service, database, monitoring
  live/
    staging/
      network/        # backend + module call with staging variables
      app/
    production/
      network/
      app/
```
- Same modules everywhere; environments differ only in variables. Prefer directory separation over workspaces when environments use different accounts and credentials.
- Module conventions (Microsoft playbook Terraform structure guidelines): `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `backend.tf`, `data.tf`; descriptions on every variable and output; `sensitive = true` on secret outputs; generated README (terraform-docs); `examples/` and `tests/`.
- Naming and tags from one shared definition: `env`, `service`, `owner`, `cost-center` on every resource.

## 6. Operations by pull request

1. PR opens → CI runs `fmt -check`, `validate`, policy scans, and `plan` with a **read-only** role; the plan is posted on the PR.
2. A human reviews the plan, not just the code — especially any `destroy` or `replace` of stateful resources and IAM changes.
3. After merge, CI applies **the saved plan file** (`plan -out=tfplan` → `apply tfplan`) with a separate **write** role assumed via OIDC.
4. Production applies require environment approval.

The Microsoft playbook describes this gate: the plan is reviewed by a cloud administrator before the deployment stage, and developer accounts have read-only portal access.

## 7. Testing and policy

- Static: `fmt`, `validate`, and policy/security scanners (e.g., Checkov, Trivy, OPA/Conftest) — no public buckets, encryption on, no `*:*` IAM, tags present.
- Native tests (`terraform test` / `tofu test`) for module behavior; Terratest-style integration tests for critical modules in a sandbox account.
- Test what breaks functionality or security: network paths and access policies, permissions, secret presence in the vault, location and tier (playbook guidance).
- Cost estimation on the plan for expensive changes.

## 8. Drift and "no manual changes"

- Schedule `terraform plan -refresh-only -detailed-exitcode` (or the OpenTofu equivalent); exit code 2 means drift — alert.
- Reconcile by importing the change into code or re-applying; never leave drift to "fix later".
- Humans are read-only in production consoles; break-glass access is time-limited and audited, and anything changed that way is codified within a day.
- Prefer immutable replacement to in-place mutation of servers (OWASP IaC Security Cheat Sheet: if a change is required, provision a new set of infrastructure).

Case — CircleCI, 4 Apr 2025: an IAM gap allowed changes to AWS WAF outside the Terraform pipeline; an operator performing what they believed was read-only investigation modified the WAF and blocked legitimate traffic, and responders could not find the change in IaC. Rules: enforce read-only roles technically, not by convention; detect drift; make IaC the only write path.

## 9. Protecting stateful resources

- `lifecycle { prevent_destroy = true }` on databases, buckets, and key material; provider deletion-protection flags on.
- Backups configured in IaC, stored in a different account with different credentials, and **restore-tested** — GitLab's 2017 outage found several backup mechanisms not working when they were needed.
- Set lifecycle, expiry, and auto-delete parameters explicitly; review any that can delete data.
- Plans that replace a stateful resource require explicit sign-off.

## 10. GitOps

Definition (the Microsoft playbook, quoting GitLab): an operational framework that applies DevOps practices — version control, collaboration, compliance, CI/CD — to infrastructure automation. Git is the source of truth; an in-cluster agent pulls and reconciles; commits are the audit trail; nobody needs direct cluster write access. CNCF tools: Argo CD, Flux.

Pattern:
1. The app repo's CI builds the image and records its digest.
2. A bot or PR updates the digest in an **environment/config repo** (Kustomize overlays or Helm values per environment); image-automation controllers can do this.
3. The controller syncs the cluster to git.
4. Promotion is a PR from the staging overlay to the production overlay; rollback is `git revert`.

| Pros | Cons |
|---|---|
| Drift auto-corrected; easy rollback; cluster credentials never leave the cluster; full audit trail | Another control plane to run; secrets need External Secrets Operator or SOPS; awkward for non-Kubernetes targets; reconciliation reverts manual hotfixes (by design) |

Use GitOps when you run Kubernetes across several clusters or environments. Skip it for a single PaaS app — a pipeline deploy is simpler.

## 11. Review checklist

- [ ] Plan attached to the PR and reviewed; no unexpected destroy or replace of stateful resources.
- [ ] IAM least privilege; no wildcard actions on wildcard resources.
- [ ] Encryption at rest and public-access blocks on storage.
- [ ] Tags present; naming follows the convention.
- [ ] Provider and module versions pinned; lock file committed.
- [ ] Sensitive outputs marked; no secret values in variables files.
- [ ] State backend with locking; production state in the production account.
- [ ] Drift check scheduled.

## 12. Rules catalog

### Apply only the reviewed plan
**Rule.** Save the plan in CI, review it on the PR, and apply that exact plan file after merge.
**Apply when.** Every change to shared or production infrastructure.
**Do / Avoid.** Do `plan -out=tfplan` then `apply tfplan` from CI. Avoid `apply -auto-approve` from a laptop.
**Why.** Infrastructure can change between plan and apply; applying the reviewed plan guarantees you ship what was approved, and laptops skip review and audit.

### Make IaC the only write path
**Rule.** Humans get read-only console roles; writes happen through the pipeline; drift is detected on a schedule.
**Apply when.** Any environment beyond a personal sandbox.
**Do / Avoid.** Do fix incidents by merging an IaC change (break-glass only when minutes matter, then codify). Avoid "quick fixes" in the console.
**Why.** Out-of-band changes are invisible to responders and get silently reverted by the next apply (CircleCI 2025).

## Sources

- OpenTofu — https://opentofu.org/manifesto/ , https://en.wikipedia.org/wiki/OpenTofu
- Terraform (license change, IBM acquisition) — https://en.wikipedia.org/wiki/Terraform_(software)
- OpenTofu state encryption (1.7) — https://www.env0.com/blog/opentofu-v1-7-enhanced-security-with-file-state-encryption
- Terraform S3 backend — https://developer.hashicorp.com/terraform/language/backend/s3 ; AWS Prescriptive Guidance, backend best practices — https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/backend.html
- Terraform drift tutorial — https://developer.hashicorp.com/terraform/tutorials/state/resource-drift
- Microsoft Code-With Engineering Playbook: Continuous Integration (IaC workflow), Terraform structure guidelines, GitOps — https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/CI-CD
- OWASP Infrastructure as Code Security Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Infrastructure_as_Code_Security_Cheat_Sheet.html
- CircleCI post-incident report, 4 Apr 2025 — https://discuss.circleci.com/t/post-incident-report-april-4-2025-circleci-ui-loading-build-triggering-issues/53208
- GitLab database incident postmortem, 2017 — https://about.gitlab.com/2017/02/10/postmortem-of-database-outage-of-january-31/
