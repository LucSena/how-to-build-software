# Search, object storage, and vector stores

When Postgres search is enough and which engine to add after it; how to store files; when pgvector is enough and what a dedicated vector store buys. Analytics engines are in `databases.md`; RAG pipeline design is in `ai-native-architecture`. Prices, licenses, and project status are as of 2026-09 — re-verify before quoting them to a user.

## Search

### Default: Postgres full-text + `pg_trgm`
- A generated `tsvector` column with a GIN index; language dictionaries for stemming; `websearch_to_tsquery` for user input; `pg_trgm` GIN/GiST indexes for fuzzy matching and `ILIKE '%foo%'`; `unaccent`.
- Good enough for admin search, in-app search over up to a few million rows, and keyword search combined with relational filters — tenant filters and row-level security apply naturally, a real advantage over an external engine.
- **Limits:** `ts_rank` is not BM25 (no IDF, no term-frequency saturation) and must score every matching row (no efficient top-k), so relevance and speed degrade on large corpora; weak facets, typo tolerance, synonyms, and highlighting at scale.
- **In-Postgres BM25 extensions:** ParadeDB `pg_search`, Tiger Data `pg_textsearch`, VectorChord-BM25. They avoid a second system but are not available on every managed Postgres — check your host.

### When to add a search engine
Add one when you need **several** of: typo-tolerant search-as-you-type under ~50 ms, BM25 relevance tuning and boosting, facets with counts, synonyms, multi-language analyzers, highlighting, geo + text, tens of millions of documents, log/observability search, or hybrid lexical + vector ranking at scale.

| Engine | Pick when | Notes (as of 2026-09) |
|---|---|---|
| Meilisearch | Instant, typo-tolerant app, e-commerce, or docs search; small team | Community Edition MIT; disk-based memory-mapped index, so data can exceed RAM |
| Typesense | Same niche; lowest latency when the index fits in RAM; built-in Raft HA | GPL-3.0; whole index in RAM (the docs suggest planning ~2–3× data size) |
| Elasticsearch | Large-scale search and analytics, logs, complex aggregations, mature ecosystem | Apache 2.0 → SSPL/Elastic License (2021) → AGPLv3 added as an option (August 2024); JVM, Lucene, and shard operations are real work |
| OpenSearch | Same use cases; AWS-managed option | Forked from Elasticsearch 7.10 (2021); Apache 2.0; governed by the OpenSearch Software Foundation under the Linux Foundation since September 2024 |
| Algolia | Fully managed instant search and merchandising, budget available | Proprietary SaaS priced by records and searches; lock-in |
| Vespa / Solr | Large-scale ranking and recommendation (Vespa); existing Lucene estates (Solr) | Specialist |

Search as a sidecar is normal even in boring architectures: Stack Overflow ran 3 Elasticsearch servers next to SQL Server in 2016.

### Keeping the index in sync
- The database is the source of truth; the index is derived and **rebuildable**. Keep a full reindex job and swap via index aliases for zero downtime.
- Sync via outbox or CDC (Debezium, Sequin → queue → indexer), or an after-commit job per change. Never dual-write synchronously in the request path.
- Handle deletes; filter by tenant and ACL fields at query time — facets and counts can leak data too.
- Tell users about lag where it shows ("results may take a few seconds to update"); track index lag as a metric.

## Object storage and files

### Default: S3-compatible storage for every user file and blob
- The database stores key, content type, size, checksum, owner, and status. Blobs in the database bloat backups and replicas and waste buffer cache. Exception (rule of thumb): tiny blobs that must be transactionally consistent, or SQLite apps where one file is the point.
- **Uploads:** the client uploads directly with a short-lived **presigned PUT or POST** (POST policies can constrain content type and size), confirms, then a job validates (malware scan, image processing, metadata). Never stream large uploads through app servers; use multipart upload for big files.
- **Downloads:** private buckets with short-lived presigned GETs, or a CDN with signed URLs/cookies; public immutable assets behind a CDN with content-hashed keys and long max-age.
- **Conditional writes:** S3 supports `If-None-Match` (August 2024) and `If-Match` (late 2024), enabling create-if-absent and optimistic concurrency on objects.
- **Lifecycle rules:** abort incomplete multipart uploads after N days, expire temp objects, tier old objects to infrequent-access/archive classes, enable versioning + object lock for backups, expire old versions.
- **Security:** block public access by default; least-privilege bucket policies; server-side encryption; no secrets in object keys; validate content type server-side; serve user uploads from a separate domain so an uploaded HTML/SVG file cannot script your main origin (see `application-security`).

### Provider choice (as of 2026-09; prices change — verify on the pricing page)
| Provider | Pricing notes | Pick when |
|---|---|---|
| AWS S3 | Internet egress about $0.09/GB for the first 10 TB after 100 GB free (us-east-1 list price) | You are on AWS; you need the richest feature set (events, S3 Tables, S3 Vectors, IAM) |
| Cloudflare R2 | $0.015/GB-month; **no egress fees**; Class A ops $4.50/M, Class B $0.36/M; 10 GB free | Egress-heavy media, downloads, public assets |
| Backblaze B2 | Low storage price; free egress up to 3× stored data, then $0.01/GB; free egress via CDN partners | Cheap bulk storage and backups |
| Tigris | $0.02/GB-month, no egress fees; globally distributed | Multi-region reads; Fly.io apps |
| GCS / Azure Blob | Comparable to S3 | You are on that cloud |

Egress drives the bill for media-heavy apps; inside one cloud, keep compute and storage in the same region to avoid transfer fees.

### Self-hosted S3: not MinIO
MinIO removed the admin console from its Community Edition (May 2025), stopped publishing community binaries and images (October 2025), moved the repository to maintenance mode (December 2025), and marked it no longer maintained / archived (February 2026) — no security fixes. Do not recommend it for new deployments; plan migrations for existing ones. Alternatives: **Garage** (AGPL, lightweight, geo-distributed), **SeaweedFS** (Apache 2.0), **Ceph RGW** (heavyweight, mature), or community forks (evaluate maturity first). For local development and tests, use a maintained S3 emulator (for example LocalStack) or a cheap cloud bucket per developer.

## Vector stores

### Default: pgvector in your existing Postgres
- Types: `vector` (index up to 2,000 dimensions), `halfvec` (up to 4,000), `bit` (up to 64,000), `sparsevec`. Distances: L2, inner product, cosine, L1, Hamming, Jaccard.
- Indexes: **HNSW** (default: better speed/recall, no training step, slower build, more memory) or **IVFFlat** (faster build, less memory, lower recall/speed).
- **Filtering gotcha (from the pgvector README):** with approximate indexes, the filter runs *after* the index scan. With the default `hnsw.ef_search` of 40 and a filter matching 10% of rows, you get about 4 results. Fix: iterative index scans (pgvector 0.8+: `SET hnsw.iterative_scan = strict_order`, or `relaxed_order` for better recall), partial indexes for a few distinct filter values, or partitioning (for example per tenant).
- Advantages: vectors sit next to the rows they describe — joins, transactions, row-level security, one backup. Hybrid search = Postgres FTS/BM25 + vector similarity combined with Reciprocal Rank Fusion in SQL.
- Capacity: community reports put comfortable HNSW use in the low tens of millions of vectors on a well-sized instance; beyond that, index memory and build time dominate. This is not a hard limit. Reduce memory with `halfvec`, binary quantization plus re-ranking, smaller embedding dimensions, or partitioning.
- Extensions: pgvectorscale (Tiger Data) adds a disk-based StreamingDiskANN index and quantization; Tiger Data's own 2024 benchmark claims large latency and cost wins over Pinecone — a vendor claim to reproduce, not a fact. VectorChord is another option.

### When a dedicated vector store earns its place
| Signal | Consider |
|---|---|
| Hundreds of millions to billions of vectors, heavy real-time upserts, very high QPS with strict recall | Qdrant (strong filtering), Milvus/Zilliz (distributed), Weaviate (hybrid built in) — open-source cores; check each license |
| Many tenants, mostly cold data (a namespace per user or workspace), cost-sensitive | turbopuffer (object-storage-first; the vendor reports Cursor and Notion as users); Amazon S3 Vectors (GA December 2025; AWS states up to 2B vectors per index and much lower cost than specialized vector databases, at higher latency) |
| Zero operations, fully managed | Pinecone serverless (usage-based storage + read/write units; plan minimums) |
| Embedded, local, or files-first | LanceDB, sqlite-vec, DuckDB's vector extension |
| Already running Elasticsearch/OpenSearch, Redis, or MongoDB Atlas | Their vector features before adding a system |

- The expensive part at scale is RAM-resident HNSW; disk- or object-storage-backed designs trade latency for much lower storage cost (vendor framing; the direction is robust, the multipliers are not). Model cost per million vectors *and* per thousand queries at your target recall.
- The source text and metadata stay in the primary database; the vector index is derived. Store `embedding_model` and its version per row, and budget for full re-embedding when the model changes.
- Benchmarks: use ann-benchmarks or VectorDBBench-style methodology with your dimensions, filters, and recall target; treat vendor comparisons as hypotheses.

## Sources

- Postgres search and BM25 — https://www.paradedb.com/learn/search-in-postgresql/bm25 ; https://neon.com/blog/postgres-full-text-search-vs-elasticsearch ; pg_textsearch (vendor) — https://www.tigerdata.com/blog/pg-textsearch-bm25-full-text-search-postgres ; ParadeDB — https://github.com/paradedb/paradedb
- Meilisearch storage — https://www.meilisearch.com/docs/learn/engine/storage ; Typesense requirements — https://typesense.org/docs/guide/system-requirements.html
- Elasticsearch AGPL — https://simonwillison.net/2024/Aug/29/elasticsearch-is-open-source-again/ ; OpenSearch Foundation — https://en.wikipedia.org/wiki/OpenSearch_(software)
- Stack Overflow architecture — https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/
- S3 conditional writes — https://simonwillison.net/2024/Aug/30/leader-election-with-s3-conditional-writes/ , https://simonwillison.net/2024/Nov/26/s3-conditional-writes/
- S3 pricing — https://aws.amazon.com/s3/pricing/ ; R2 — https://www.cloudflare.com/products/r2/ ; B2 — https://www.backblaze.com/cloud-storage/pricing ; Tigris — https://www.tigrisdata.com/pricing/
- MinIO status — https://blocksandfiles.com/2025/06/19/minio-removes-management-features-from-basic-community-edition-object-storage-code/ , https://github.com/minio/minio/issues/21714 , https://blog.vonng.com/en/db/minio-is-dead/
- pgvector README — https://github.com/pgvector/pgvector
- pgvectorscale benchmark (vendor) — https://www.tigerdata.com/blog/pgvector-is-now-as-fast-as-pinecone-at-75-less-cost
- "You probably don't need a vector database" — https://encore.dev/blog/you-probably-dont-need-a-vector-database
- turbopuffer (vendor) — https://turbopuffer.com/blog/turbopuffer ; S3 Vectors GA — https://aws-news.com/article/2025-12-02-amazon-s3-vectors-now-generally-available-with-increased-scale-and-performance ; Pinecone pricing — https://www.pinecone.io/pricing/estimate/
