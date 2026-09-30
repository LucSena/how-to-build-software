# Retrieval-augmented generation (RAG)

The default recipe, the decisions around it, and how to debug it. Retrieval quality caps answer quality: measure and fix retrieval before touching the generation prompt.

## Contents

1. Do you need RAG?
2. Ingestion
3. Retrieval
4. Generation and citations
5. Storage
6. Evaluation
7. Debugging table

## 1. Do you need RAG?

| Situation | Default |
|---|---|
| Small, stable corpus (under roughly 200k tokens) queried often | Put it in context and use prompt caching; skip the retrieval stack |
| Large, growing, or permissioned corpus | RAG with the recipe below |
| Users need to browse or compare documents, not get an answer | Ship search with good ranking and filters; an LLM summary is optional |
| The model lacks a *skill* or format, not *knowledge* | Better prompts and examples first; fine-tuning is a later, eval-driven step |
| Questions need several lookups ("compare Q3 to Q1 across regions") | Agentic RAG: give the model a search tool and let it issue multiple queries, with a step cap |

## 2. Ingestion

1. **Parse** with a format-aware parser (PDF layout, HTML structure, tables kept as tables). Garbage parsing is the most common silent failure.
2. **Clean**: drop boilerplate (nav, footers, cookie banners), normalize whitespace, keep headings.
3. **Chunk by structure**: split on headings, sections, and paragraphs to roughly 200–800 tokens with a small overlap. Keep the heading path ("Billing > Refunds > Partial refunds") with each chunk. Never split tables or code blocks mid-way.
4. **Add context to each chunk**: prepend a short, generated description of where the chunk sits in its document. Anthropic reported that contextual embeddings plus BM25 reduced failed retrievals by 49%, and by 67% when reranking was added.
5. **Embed** with a pinned embedding model; record the model and version with every vector.
6. **Store metadata**: `tenant_id`, ACL (groups, users, visibility), source URL/ID, section path, timestamp, document version, content hash.
7. **Re-ingest idempotently** keyed by content hash; propagate deletions and permission changes to the index promptly (a revoked user must stop retrieving the document).

## 3. Retrieval

- **Hybrid search by default**: keyword (BM25) catches exact terms, codes, and names; dense vectors catch paraphrase. Fuse with Reciprocal Rank Fusion: `score(d) = Σ 1 / (k + rank_i(d))` with `k ≈ 60`.
- **Rerank** the top 50–100 fused candidates with a cross-encoder reranker; pass the top 5–20 to the model.
- **Filter in the query, not the prompt**: tenant, ACL, document type, and date filters are applied by the store. Never retrieve unauthorized chunks and ask the model to ignore them.
- **Rewrite conversational follow-ups** ("and for Germany?") into standalone queries before searching.
- **Deduplicate** near-identical chunks and cap chunks per document so one long document cannot crowd out the rest.
- Log the query, filters, candidate IDs, scores, and the final context for every request; you will need them for evals and debugging.

## 4. Generation and citations

- Instruct the model to answer only from the provided context, cite chunk IDs for each claim, and say plainly when the context does not contain the answer.
- **Verify citations deterministically**: every cited ID must be one that was in the context; drop or flag answers that cite nothing or cite unknown IDs.
- Render citations as links to the exact passage (document + section anchor), with a preview. See `ai-interface-design` for the UI.
- Put retrieved text inside clear delimiters marked as untrusted data; retrieved documents are an indirect prompt-injection vector (see `security.md`).
- Order: stable instructions first, then retrieved context, then the question, to keep the cacheable prefix stable.

## 5. Storage

- **Default: `pgvector` in the existing Postgres** with an HNSW index. It handles up to tens of millions of vectors for most workloads, and keeps ACL joins, transactions, and backups in one system.
- Move to a dedicated vector database (Qdrant, Weaviate, Pinecone, Turbopuffer, LanceDB, Vespa, among others) only for measured needs: scale beyond what Postgres handles comfortably, very high query rates, or features such as built-in hybrid ranking or multi-tenancy at large scale.
- **Version embeddings.** Changing the embedding model means re-embedding everything into a new index and switching over; vectors from different models are not comparable.
- Tenant isolation: `tenant_id` filter on every query at minimum; separate namespaces or indexes for regulated or very large tenants.

## 6. Evaluation

Evaluate retrieval and generation separately; a bad answer from good context is a different bug from a good answer attempt over bad context.

| Stage | Metric | What it tells you |
|---|---|---|
| Retrieval | Recall@k | Did the needed chunk make it into the top k? |
| Retrieval | MRR (mean reciprocal rank) | How high did the first relevant chunk rank? |
| Retrieval | Context precision / recall | How much of the context is relevant; how much of the needed information is present |
| Generation | Faithfulness / groundedness | Is every claim supported by the context? |
| Generation | Answer relevance | Does it answer the question asked? |
| Generation | Citation validity | Do citations exist and support the claim? |

Tools that implement these (examples): RAGAS, DeepEval, TruLens, Braintrust. Build the question set from real user queries, labeled with the documents that answer them, and include unanswerable questions.

## 7. Debugging table

| Symptom | Likely cause | Fix |
|---|---|---|
| Right document exists, never retrieved | Bad parsing or chunking; exact term missed by vectors | Inspect chunks; add BM25; contextual chunk headers |
| Retrieved but answer ignores it | Too many chunks, relevant one buried | Rerank; fewer, better chunks; put the best first |
| Confident answer, no support | Model filling gaps | "Not found" instruction; faithfulness eval; citation check |
| Answers from another customer's data | Filtering done in prompt or missing | ACL/tenant filter in the store query; add a cross-tenant test |
| Quality dropped after an "upgrade" | Embedding model changed without re-index, or chunker changed | Version embeddings; re-run retrieval evals on every pipeline change |
| Stale answers | Re-ingestion lag or deletions not propagated | Event-driven re-index; content hashes; freshness metadata |

## Sources

- Anthropic, "Introducing Contextual Retrieval": https://www.anthropic.com/news/contextual-retrieval
- Anthropic, "Building Effective Agents": https://www.anthropic.com/engineering/building-effective-agents
- Advanced RAG techniques overview: https://atlan.com/know/advanced-rag-techniques/ ; RAG evaluation: https://atlan.com/know/how-to-evaluate-rag-systems-explained/
- Cormack, Clarke, Büttcher, "Reciprocal Rank Fusion outperforms Condorcet and individual rank learning methods" (SIGIR 2009): https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf
- pgvector: https://github.com/pgvector/pgvector
- RAGAS: https://docs.ragas.io/
