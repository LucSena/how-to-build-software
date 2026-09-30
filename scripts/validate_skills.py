#!/usr/bin/env python3
"""Validate every skill in skills/ against the Agent Skills spec and STYLE.md.

Usage: python3 scripts/validate_skills.py [--strict]

Errors fail the run. Warnings fail only with --strict.
Standard library only (a tiny frontmatter parser is included) so it runs anywhere.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"

ALLOWED_KEYS = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}
CATEGORIES = {"meta", "engineering", "design", "mobile"}
REQUIRED_SECTIONS = [
    "## Before you start",
    "## Core principles",
    "## Workflow",
    "## Gotchas",
    "## Output format",
    "## Related skills",
]
CONTEXT_MARKER = ".agents/project-context.md"
CLAUDE_ONLY = [re.compile(r"!`[^`]+`"), re.compile(r"\$ARGUMENTS"), re.compile(r"^context:\s*fork", re.M)]
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
LINK_RE = re.compile(r"\]\((?!https?://|#|mailto:)([^)\s]+)\)")
BACKTICK_REF_RE = re.compile(r"`((?:references|scripts|assets)/[^`\s]+)`")


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse the small YAML subset used by skills: scalars plus one nested map."""
    if not text.startswith("---\n"):
        raise ValueError("missing opening '---' frontmatter fence")
    end = text.find("\n---", 4)
    if end == -1:
        raise ValueError("missing closing '---' frontmatter fence")
    raw, body = text[4:end], text[end + 4 :]
    data: dict = {}
    current_map: dict | None = None
    for lineno, line in enumerate(raw.splitlines(), start=2):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.startswith((" ", "\t")):
            if current_map is None:
                raise ValueError(f"line {lineno}: indented value outside a map")
            key, _, value = line.strip().partition(":")
            current_map[key.strip()] = unquote(value.strip())
            continue
        key, sep, value = line.partition(":")
        if not sep:
            raise ValueError(f"line {lineno}: expected 'key: value'")
        key, value = key.strip(), value.strip()
        if value == "":
            current_map = {}
            data[key] = current_map
        else:
            current_map = None
            data[key] = unquote(value)
    return data, body


def unquote(value: str) -> str:
    value = value.split(" #", 1)[0].strip() if not value.startswith(("'", '"')) else value
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
        return value[1:-1]
    return value


def load_skills() -> dict[str, tuple[Path, dict, str]]:
    skills = {}
    for skill_md in sorted(SKILLS.glob("*/SKILL.md")):
        text = skill_md.read_text(encoding="utf-8")
        try:
            meta, body = parse_frontmatter(text)
        except ValueError as exc:
            meta, body = {"__error__": str(exc)}, text
        skills[skill_md.parent.name] = (skill_md, meta, body)
    return skills


def main() -> int:
    strict = "--strict" in sys.argv
    errors: list[str] = []
    warnings: list[str] = []
    skills = load_skills()
    if not skills:
        errors.append("no skills found under skills/")

    for folder in sorted(p for p in SKILLS.iterdir() if p.is_dir()):
        if not (folder / "SKILL.md").exists():
            errors.append(f"{folder.name}: folder has no SKILL.md")

    for folder, (path, meta, body) in skills.items():
        rel = path.relative_to(ROOT)
        err = lambda msg: errors.append(f"{rel}: {msg}")  # noqa: E731
        warn = lambda msg: warnings.append(f"{rel}: {msg}")  # noqa: E731

        if "__error__" in meta:
            err(meta["__error__"])
            continue

        extra = set(meta) - ALLOWED_KEYS
        if extra:
            err(f"non-spec top-level keys {sorted(extra)} (move them under metadata)")

        name = meta.get("name", "")
        if not name:
            err("missing name")
        elif name != folder:
            err(f"name '{name}' does not match folder '{folder}'")
        elif len(name) > 64 or not NAME_RE.match(name):
            err(f"invalid name '{name}'")

        desc = meta.get("description", "")
        if not desc:
            err("missing description")
        else:
            if len(desc) > 1024:
                err(f"description is {len(desc)} chars (max 1024)")
            if "<" in desc or ">" in desc:
                err("description must not contain '<' or '>'")
            if not desc.startswith("Use when"):
                warn("description should start with 'Use when'")

        if meta.get("license") != "MIT":
            warn("license should be MIT")

        md = meta.get("metadata")
        if not isinstance(md, dict):
            err("missing metadata map")
        else:
            if not re.match(r"^\d+\.\d+\.\d+$", md.get("version", "")):
                err("metadata.version must be x.y.z")
            if md.get("category") not in CATEGORIES:
                err(f"metadata.category must be one of {sorted(CATEGORIES)}")
            for ref in md.get("related", "").split():
                if ref not in skills:
                    err(f"metadata.related names unknown skill '{ref}'")

        lines = body.count("\n") + 1
        if lines > 500:
            err(f"SKILL.md body is {lines} lines (max 500)")

        if not re.search(r"^# \S", body, re.M):
            err("missing '# Title' heading")
        positions = []
        for section in REQUIRED_SECTIONS:
            idx = body.find("\n" + section)
            if idx == -1:
                err(f"missing required section '{section}'")
            positions.append(idx)
        found = [p for p in positions if p != -1]
        if found != sorted(found):
            warn("required sections are out of order")
        if CONTEXT_MARKER not in body:
            err("missing shared project-context block")

        for pattern in CLAUDE_ONLY:
            if pattern.search(body):
                err(f"Claude-Code-only syntax found: {pattern.pattern}")

        refs = set(LINK_RE.findall(body)) | set(BACKTICK_REF_RE.findall(body))
        for target in refs:
            target = target.split("#", 1)[0]
            if target and not (path.parent / target).exists():
                err(f"broken relative reference '{target}'")

        for ref_file in sorted((path.parent / "references").glob("*.md")):
            ref_lines = ref_file.read_text(encoding="utf-8").count("\n") + 1
            if ref_lines > 400:
                warn(f"{ref_file.name} is {ref_lines} lines (target ≤ 400)")
            if ref_file.name not in body:
                warn(f"references/{ref_file.name} is never mentioned in SKILL.md")
        for sub in (path.parent / "references").glob("*/"):
            err(f"nested reference folder '{sub.name}' (keep references one level deep)")

        for mentioned in set(re.findall(r"`([a-z0-9]+(?:-[a-z0-9]+)+)`", body.split("## Related skills")[-1])):
            if mentioned not in skills:
                warn(f"Related skills mentions unknown skill '{mentioned}'")

        evals = path.parent / "evals" / "evals.json"
        if not evals.exists():
            err("missing evals/evals.json")
        else:
            try:
                data = json.loads(evals.read_text(encoding="utf-8"))
                if data.get("skill_name") != folder:
                    err("evals.json skill_name does not match folder")
                if len(data.get("evals", [])) < 3:
                    err("evals.json needs at least 3 evals")
            except json.JSONDecodeError as exc:
                err(f"evals.json is invalid JSON: {exc}")

    for w in warnings:
        print(f"warning: {w}")
    for e in errors:
        print(f"error:   {e}")
    print(f"\n{len(skills)} skills checked · {len(errors)} errors · {len(warnings)} warnings")
    if errors or (strict and warnings):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
