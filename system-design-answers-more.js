// Continuation of system-design-answers.js: remaining building blocks and the classic designs.
// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
Object.assign(SERVICE_ANSWERS, {
  "Idempotency and Retries": [
    "An idempotent operation can be repeated with the same effect as running it once, which makes retries safe. Retries need backoff with jitter and a bound, and payments and writes need idempotency keys.",
    "GET, PUT and DELETE are idempotent by definition, POST is not. An idempotency key lets the server detect a repeated request and return the stored result instead of repeating the action.",
    "Networks fail, timeouts are ambiguous, and message systems deliver at least once, so duplicates and retries are certain.",
    "Use it for payments, order creation, message consumers and any call that may be retried by clients or infrastructure.",
    "Avoid blind retries of non-idempotent calls, retry storms without backoff, and retrying permanent failures.",
    "Accept an Idempotency-Key header, store key plus response atomically with the operation (unique constraint), expire keys after a window, retry with exponential backoff and jitter, and make consumers deduplicate by message id.",
    "Pros: safe retries and correctness under failure. Cons: extra storage, key management and handling of in-flight duplicates.",
    "Alternatives are exactly-once platforms with transactions, natural idempotency through upserts and conditional writes.",
    `@Transactional
public Payment pay(String idemKey, PaymentRequest req) {
    return paymentRepo.findByIdempotencyKey(idemKey)        // seen before: return same result
        .orElseGet(() -> {
            Payment p = gateway.charge(req);
            p.setIdempotencyKey(idemKey);                   // UNIQUE constraint guards races
            return paymentRepo.save(p);
        });
}`
  ],
  "Distributed Locks": [
    "A distributed lock gives mutual exclusion across processes, typically through Redis, ZooKeeper or a database. Always use a lease with expiry and a fencing token, because pauses and clock issues can let two holders believe they own the lock.",
    "Redis locks use SET key value NX PX ttl and release only by the owner token. ZooKeeper and etcd use ephemeral nodes or leases with consensus. Databases can use row locks or advisory locks.",
    "In-process locks do not protect shared resources across several service instances.",
    "Use it for leader tasks, scheduled jobs that must run once, and protecting non-idempotent critical sections.",
    "Avoid them where idempotent operations, database constraints or optimistic locking would do, and never assume a lock is safe across long pauses without fencing.",
    "Acquire with a TTL, renew with a heartbeat if needed, release with compare-and-delete, pass a monotonically increasing fencing token to the resource, and prefer consensus-backed stores for critical correctness.",
    "Pros: coordination across instances. Cons: failure modes, added latency and correctness subtleties.",
    "Alternatives are unique constraints, optimistic locking, queues with single consumers and leader election.",
    `// Redis (Lettuce): acquire
Boolean ok = redis.opsForValue().setIfAbsent("lock:report", token, Duration.ofSeconds(30));
// release only if we still own it (Lua script, atomic)
String lua = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";`
  ],
  "Leader Election and Consensus": [
    "Leader election picks one node to coordinate, and consensus protocols such as Raft and Paxos let nodes agree on a value or log despite failures, requiring a majority quorum. They underpin etcd, ZooKeeper and Kafka's controller.",
    "Raft elects a leader with terms and votes, replicates a log to followers and commits entries once a majority acknowledges. A cluster of 2f+1 nodes tolerates f failures.",
    "Distributed systems need agreement on who leads and on the order of operations even when nodes crash or partitions occur.",
    "Use it for metadata stores, coordination, configuration and anywhere a single authoritative decision is needed.",
    "Avoid implementing consensus yourself; use proven systems. Avoid even-sized clusters and clusters spread across too few failure domains.",
    "Use etcd, ZooKeeper or Consul for leader election, run three or five nodes across zones, use leases and fencing tokens, and handle split-brain by requiring quorum.",
    "Pros: correctness under failure. Cons: latency from quorum writes, operational complexity and unavailability without a majority.",
    "Alternatives are single-primary with manual failover, lease-based election in a database and managed coordination services."
  ],
  "Distributed ID Generation": [
    "Generate unique ids across nodes without a central bottleneck: UUIDs are simple but large and unordered, auto-increment is ordered but centralised, and Snowflake-style ids combine timestamp, machine id and sequence for roughly sortable 64-bit ids.",
    "A Snowflake id packs about 41 bits of timestamp, 10 bits of machine id and 12 bits of sequence, allowing thousands of ids per millisecond per node. UUIDv7 adds time ordering to UUIDs.",
    "Database auto-increment does not scale across shards, and random UUIDs fragment indexes.",
    "Use it for sharded databases, event ids, order numbers and anywhere ids are created on many nodes.",
    "Avoid clock-dependent schemes without handling clock skew, and avoid exposing sequential ids where enumeration is a risk.",
    "Assign unique worker ids, guard against clocks going backwards, use ULID or UUIDv7 for sortable ids when 128 bits is acceptable, or use a ticket server or segment allocation for dense ids.",
    "Pros: no central bottleneck, sortable by time. Cons: clock dependence and worker id management.",
    "Alternatives are database sequences with ranges, UUIDv4, ULID and central id services.",
    `class Snowflake {
    private final long workerId; private long lastTs = -1, seq = 0;
    Snowflake(long workerId) { this.workerId = workerId; }
    synchronized long next() {
        long ts = System.currentTimeMillis();
        if (ts < lastTs) throw new IllegalStateException("clock moved backwards");
        seq = (ts == lastTs) ? (seq + 1) & 0xFFF : 0;
        if (ts == lastTs && seq == 0) { while ((ts = System.currentTimeMillis()) <= lastTs) { } }
        lastTs = ts;
        return ((ts - 1700000000000L) << 22) | (workerId << 12) | seq;
    }
}`
  ],
  "Search and Inverted Indexes": [
    "Search engines use an inverted index mapping terms to documents, with analysis, scoring (BM25) and sharding, as in Elasticsearch and OpenSearch. They provide full-text search and aggregations but are not a primary source of truth.",
    "Documents are analysed into tokens, indexed per field, and queries look up terms and score matches. Indices are split into shards with replicas.",
    "Databases handle full-text, fuzzy and faceted search poorly at scale.",
    "Use it for product search, log analytics, autocomplete and relevance-ranked queries.",
    "Avoid it as the system of record, for transactional workloads or when simple database queries suffice.",
    "Keep the source of truth in the database, index asynchronously through events or CDC, design mappings and analysers, and plan reindexing with aliases.",
    "Pros: fast flexible search. Cons: eventual consistency with the source, operational complexity and reindex effort.",
    "Alternatives are database full-text search (PostgreSQL), Solr, Typesense and vector search for semantic needs."
  ],
  "Object Storage and Blob Handling": [
    "Store large files in object storage (S3-style) and keep only metadata in the database. Use pre-signed URLs for direct client upload and download, multipart upload for big files, and lifecycle rules for cost.",
    "Object storage is flat, durable and cheap, addressing objects by key with high scalability, versioning and lifecycle policies.",
    "Databases and application servers are poor and costly at serving large binary data.",
    "Use it for images, video, documents, backups, exports and data lake files.",
    "Avoid it for low-latency transactional data or frequent small in-place updates.",
    "Generate pre-signed URLs so clients upload directly, store key and metadata in the database, process asynchronously through events, and serve through a CDN.",
    "Pros: durable, scalable and cheap. Cons: eventual consistency semantics in some systems, latency compared with block storage and no in-place modification.",
    "Alternatives are block or file storage, database BLOBs for small items and distributed file systems."
  ],
  "Backpressure and Throttling": [
    "Backpressure lets a slow consumer signal producers to slow down so queues do not grow without bound; throttling and load shedding limit work when overloaded. Use bounded queues, timeouts and rejection rather than unbounded buffering.",
    "Mechanisms include bounded queues that block or reject, reactive streams demand signalling, rate limits, concurrency limits and dropping low-priority work.",
    "Without it overload leads to memory exhaustion, rising latency and cascading failure.",
    "Use it in message pipelines, thread pools, streaming systems and APIs facing bursts.",
    "Avoid unbounded buffers and silent drops that hide data loss.",
    "Bound queues, apply CallerRuns or reject policies, propagate demand in reactive streams, shed load early at the edge, return 429 or 503 with retry hints, and watch queue depth and latency.",
    "Pros: stability under overload. Cons: rejected work must be handled and tuning needs measurement.",
    "Alternatives are autoscaling, bigger buffers (temporary) and priority queues."
  ],
  "Bloom Filters": [
    "A Bloom filter is a compact probabilistic set that can say definitely not present or probably present, with no false negatives and a tunable false-positive rate. It avoids expensive lookups for missing keys.",
    "It uses a bit array and several hash functions. Adding sets bits, and a lookup is positive only if all bits are set. It cannot delete elements (counting variants can).",
    "Checking a disk or remote store for each missing key is slow and wasteful.",
    "Use it for cache or database miss filtering, LSM-tree stores, duplicate detection, and crawler URL checks.",
    "Avoid it when false positives are unacceptable or deletion is needed.",
    "Size from expected items n and false-positive rate p, use a library such as Guava BloomFilter, and fall back to the real lookup on a positive.",
    "Pros: tiny memory, fast. Cons: false positives, no deletes and fixed capacity.",
    "Alternatives are hash sets (exact but large), cuckoo filters and HyperLogLog for counting.",
    `BloomFilter<String> seen = BloomFilter.create(Funnels.stringFunnel(StandardCharsets.UTF_8),
        10_000_000, 0.01);                       // 10M items, 1% false positives
seen.put(url);
if (!seen.mightContain(candidate)) { /* definitely new: skip the database check */ }`
  ],

  "Design a URL Shortener": [
    "Requirements: create short links, redirect with low latency, high read to write ratio, optional expiry and analytics. Generate unique short codes (base62 of an id or random), store mapping in a key-value store, cache hot links and redirect with 301 or 302.",
    "Functional: shorten and resolve URLs. Non-functional: very low read latency, high availability, durable mappings. Estimates: about 100 million new links a year and a 100 to 1 read ratio means thousands of redirects per second.",
    "A classic exercise that touches ids, storage, caching, scaling and abuse prevention.",
    "Scale is read-heavy, so caching and a simple key-value store go far; 7 base62 characters give about 3.5 trillion codes.",
    "Pitfalls include collisions with random codes, hot keys, enumeration of sequential ids, malicious links and 301 caching hiding analytics.",
    "API: POST /urls and GET /{code}. Generate ids with a distributed counter or Snowflake and base62 encode them, store code to URL in a sharded key-value store, front it with Redis and a CDN, return 302 if analytics matter, and log clicks asynchronously through a queue.",
    "Trade-offs: counters are collision-free but need coordination, random codes are simple but need collision checks. 301 reduces load but loses click data.",
    "Alternatives are hash-and-truncate with collision handling and pre-generated key pools.",
    `static final String ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
static String encode(long id) {
    StringBuilder sb = new StringBuilder();
    do { sb.append(ALPHABET.charAt((int) (id % 62))); id /= 62; } while (id > 0);
    return sb.reverse().toString();                  // 1_000_000 -> "4c92"
}`
  ],
  "Design a Notification System": [
    "Requirements: send push, email and SMS reliably at scale with user preferences, templating, rate limiting and retries. Use an API, a queue per channel, workers that call providers, deduplication and delivery tracking.",
    "Functional: trigger notifications from services or schedules and deliver by channel. Non-functional: at-least-once delivery, no duplicates for users, low latency for urgent messages, and provider failure tolerance.",
    "Many services need to notify users without each integrating providers or handling retries.",
    "Scale can reach millions a day with bursts from campaigns; separating channels and priorities prevents bulk messages from blocking urgent ones.",
    "Pitfalls include duplicates, spamming users, provider outages, ignoring opt-outs and time zones.",
    "Services publish events to a notification service, which checks preferences and rate limits, renders templates, and enqueues to Kafka or SQS topics per channel and priority. Workers call providers with retries, backoff and a DLQ, record status, and use idempotency keys.",
    "Trade-offs: at-least-once with deduplication versus complexity, provider fallback versus cost, and immediate versus batched delivery.",
    "Alternatives are direct provider calls from services (simple but duplicated) and managed notification platforms."
  ],
  "Design an E-commerce Order System": [
    "Requirements: browse, cart, place orders with inventory reservation, payment, fulfilment and status tracking, without overselling and with consistency across services. Use an order service with sagas coordinating inventory, payment and shipping, idempotent APIs and an outbox for events.",
    "Core entities: product, cart, order, payment, inventory and shipment. Non-functional: correctness of stock and payments, high availability for browsing, and handling flash-sale spikes.",
    "Orders involve money and stock across several services, so failures must leave consistent states.",
    "Browsing is read-heavy and cacheable, while checkout is write-heavy and consistency-critical; flash sales stress inventory.",
    "Pitfalls include overselling, double charging, lost updates, distributed transactions and inconsistent state after partial failure.",
    "Reserve stock with a conditional update or reservation record with expiry, create the order, charge the payment with an idempotency key, confirm or compensate via a saga (choreography or orchestration), publish events with the outbox pattern, and project order status for queries.",
    "Trade-offs: strong consistency per service with eventual consistency across services, orchestration clarity versus choreography decoupling, and reservation timeouts versus lost sales.",
    "Alternatives are a monolith with local transactions for smaller scale and two-phase commit (rarely suitable)."
  ],
  "Design a Payment System": [
    "Requirements: charge, refund and reconcile payments correctly with no double charges, an audit trail and strong security. Use idempotency keys, a ledger with double-entry records, provider integration with retries, asynchronous webhooks and reconciliation jobs.",
    "Functional: authorise, capture, refund, and report. Non-functional: exactly-once effect, durability, PCI compliance and traceability.",
    "Money errors are costly and regulated, so correctness outranks everything.",
    "Volumes are modest compared with social systems but correctness and reliability requirements are extreme.",
    "Pitfalls include retries causing duplicate charges, mismatched provider and internal states, storing card data, and floating point money.",
    "Use tokenised cards via the provider, store amounts as integers, create a payment record in a transaction before calling the provider, use an idempotency key, handle async webhooks, keep an append-only double-entry ledger, and reconcile daily with provider reports.",
    "Trade-offs: synchronous confirmation versus async resilience, building a ledger versus relying on the provider, and complexity of multi-provider routing.",
    "Alternatives are using a hosted payment page to reduce PCI scope and orchestration platforms."
  ],
  "Design a Chat System": [
    "Requirements: real-time one-to-one and group messaging, delivery and read status, presence and history. Use persistent WebSocket connections to chat servers, a message service with a queue, durable storage by conversation and push notifications for offline users.",
    "Functional: send and receive messages, groups, history, online status. Non-functional: low latency, ordering within a conversation, reliability and scale to millions of connections.",
    "A good test of connection handling, ordering, fan-out and storage choices.",
    "Scale needs many long-lived connections per server and a way to route messages to the server holding a recipient's connection.",
    "Pitfalls include ordering, duplicates, large group fan-out, reconnect storms and unbounded history.",
    "Clients connect via WebSocket through a gateway, a session registry (Redis) maps users to servers, messages are written to a log or queue and storage (Cassandra or similar partitioned by conversation id), assigned sequence numbers for ordering, and delivered or pushed with acknowledgements.",
    "Trade-offs: fan-out on write for small groups versus on read for large ones, strong ordering per conversation versus global, and storage choice for write-heavy access.",
    "Alternatives are long polling or server-sent events for simpler needs and managed real-time services."
  ],
  "Design a News Feed": [
    "Requirements: show a ranked, low-latency feed of posts from followed accounts. Choose fan-out on write (precompute feeds) for most users and fan-out on read for celebrities, with caching and ranking.",
    "Functional: post, follow, view feed. Non-functional: fast reads, tolerable staleness, and handling users with millions of followers.",
    "Naively joining posts across follows at read time is too slow at scale.",
    "Reads vastly outnumber writes, but celebrity posts create massive write fan-out.",
    "Pitfalls include hot accounts, storage of precomputed feeds, ordering, deletions and personalisation costs.",
    "On post, push post ids to followers' feed lists in Redis or a store (fan-out on write) via workers, skip celebrities and merge their recent posts at read time, hydrate posts from a cache, rank with a service, and paginate with cursors.",
    "Trade-offs: write amplification versus read latency, freshness versus cost, and ranking complexity.",
    "Alternatives are pure fan-out on read (simple, slow) and pure fan-out on write (heavy for big accounts)."
  ],
  "Design a Distributed Cache": [
    "Requirements: low-latency key-value access, high hit rate, horizontal scale and resilience. Partition keys with consistent hashing, replicate for availability, use LRU or LFU eviction, TTLs, and handle stampedes and hot keys.",
    "Functional: get, set and delete with TTL. Non-functional: sub-millisecond latency, elasticity, and tolerance of node loss without overwhelming the database.",
    "A shared cache protects the database and cuts latency across many application instances.",
    "Scale is large read throughput with skewed key popularity.",
    "Pitfalls include cache stampedes, hot keys, stale data, inconsistent invalidation and thundering herds after node failure.",
    "Use a client or proxy that maps keys with consistent hashing, replicas for failover, LRU eviction with TTL jitter, request coalescing or locks for misses, local near-caches for hot keys and metrics on hit ratio.",
    "Trade-offs: consistency versus availability on failover, memory cost versus hit rate, and write policies such as write-through versus invalidate.",
    "Alternatives are Redis Cluster, Memcached, Hazelcast and CDN or local caches."
  ],
  "Design a Key-Value Store": [
    "Requirements: put and get at scale with high availability and tunable consistency. Use partitioning with consistent hashing, replication across nodes, quorum reads and writes, versioning or vector clocks, gossip for membership and anti-entropy repair, as in Dynamo-style systems.",
    "Functional: get, put, delete. Non-functional: horizontal scale, low latency, availability during failures and eventual or tunable consistency.",
    "It combines most distributed systems fundamentals in one problem.",
    "Scale means petabytes across many nodes with frequent failures.",
    "Pitfalls include conflict resolution, hinted handoff and repair, hot partitions and rebalancing.",
    "Hash keys onto a ring with virtual nodes, replicate to N successors, use R plus W greater than N for strong reads, store with an LSM-tree and write-ahead log, use Bloom filters for reads, gossip to detect failures, hinted handoff and Merkle trees for repair.",
    "Trade-offs: consistency versus availability, read versus write latency through quorum settings, and storage engine choices.",
    "Alternatives are Raft-based stores for strong consistency and sharded relational databases."
  ],
  "Design a Ride-Sharing Service": [
    "Requirements: match riders with nearby drivers in real time with live location updates, pricing and trip lifecycle. Use geospatial indexing (geohash or quadtree), a location service for frequent updates, a matching service and a trip state machine.",
    "Functional: request a ride, find drivers, track the trip and pay. Non-functional: low latency matching, high write rate of locations and high availability.",
    "Combines geospatial search, real-time updates and state management.",
    "Drivers send location every few seconds, producing very high write throughput, while matching needs fast nearby lookups.",
    "Pitfalls include location write load, hot areas, consistency of driver assignment and surge pricing fairness.",
    "Store driver locations in an in-memory geospatial index (Redis GEO or sharded geohash cells), query nearby drivers, offer the trip with timeouts, track state through a trip service, stream locations to riders, and use events for payments and notifications.",
    "Trade-offs: accuracy versus update frequency, centralised matching versus regional sharding, and precision of geo cells.",
    "Alternatives are simple database geo queries at small scale."
  ],
  "Design a Video Streaming Service": [
    "Requirements: upload, transcode and stream video globally with adaptive quality. Store originals in object storage, transcode into multiple bitrates with a pipeline, segment into HLS or DASH chunks and deliver through a CDN.",
    "Functional: upload, play, search. Non-functional: low startup latency, smooth playback, scalability and cost control for storage and bandwidth.",
    "Video is large and bandwidth-heavy, so processing and delivery architecture dominate.",
    "Scale is dominated by egress bandwidth and storage, with highly skewed popularity.",
    "Pitfalls include transcoding cost, long processing times, cache misses for long-tail content and hot new releases.",
    "Upload to object storage using pre-signed URLs, trigger transcoding via queues and workers into several resolutions, store segments and manifests, serve through a CDN with adaptive bitrate, keep metadata in a database and index for search.",
    "Trade-offs: storing many renditions versus on-demand transcoding, CDN cost versus latency, and DRM complexity.",
    "Alternatives are managed media services."
  ],
  "Design a Web Crawler": [
    "Requirements: fetch and index large numbers of pages politely and without duplicates. Use a URL frontier with priorities, distributed fetchers, DNS caching, duplicate detection (hashing, Bloom filters), robots.txt compliance and per-host rate limiting.",
    "Functional: crawl from seeds, extract links, store content. Non-functional: scale, politeness, freshness and robustness to bad pages.",
    "A good exercise in queues, deduplication and rate limiting.",
    "Scale is billions of pages, so parallel, partitioned crawling is needed.",
    "Pitfalls include crawler traps, duplicate content, hammering a site, and large or malformed responses.",
    "Maintain a frontier partitioned by host so each host is handled by one worker with a politeness delay, deduplicate URLs with a Bloom filter and content with hashes, parse and extract links, store pages in object storage and re-crawl by priority.",
    "Trade-offs: freshness versus load, depth versus breadth, and memory for dedupe structures.",
    "Alternatives are focused crawlers and using existing datasets."
  ],
  "Design Typeahead Autocomplete": [
    "Requirements: return top suggestions within tens of milliseconds as users type. Use a trie or prefix index of popular queries with precomputed top-k per prefix, cached at the edge, updated from aggregated query logs.",
    "Functional: suggest completions for a prefix. Non-functional: very low latency, high availability and fresh enough rankings.",
    "Users expect instant suggestions, and computing them from raw queries per keystroke is far too slow.",
    "Scale is extremely high QPS with short requests, which fits caching and in-memory structures.",
    "Pitfalls include memory for the trie, ranking freshness, personalisation costs and offensive suggestions.",
    "Aggregate query logs offline, build a trie or prefix-to-top-k map storing the top suggestions at each node, shard by prefix, serve from memory and CDN or browser caches, and update periodically with filters for unsafe content.",
    "Trade-offs: freshness versus compute cost, memory versus latency, and personalisation versus cacheability.",
    "Alternatives are Elasticsearch completion suggesters and database prefix queries at small scale."
  ]
});
