// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
// For the classic designs, the sections read as: requirements, motivation, scale, pitfalls, architecture, trade-offs, alternatives.
const SERVICE_ANSWERS = {
  "Scalability: Vertical vs Horizontal": [
    "Vertical scaling adds resources to one machine, which is simple but capped and a single point of failure; horizontal scaling adds more machines, which scales further and improves availability but needs stateless services, load balancing and data partitioning.",
    "Scale up means bigger CPU, memory or disks. Scale out means more nodes behind a load balancer, with state moved to shared stores, caches and partitioned databases.",
    "Traffic and data grow beyond one machine, and a single machine is a failure risk.",
    "Scale vertically first for simplicity and databases at modest size, and scale horizontally when you hit hardware limits, need high availability or have spiky load.",
    "Do not scale out prematurely, since distributed systems add complexity, and do not scale stateful components horizontally without a partitioning plan.",
    "Make services stateless (externalise sessions to Redis), put them behind a load balancer with health checks, add auto-scaling on CPU or request metrics, then scale data with replication, caching and sharding.",
    "Pros of horizontal: near-linear scale, resilience. Cons: complexity, consistency issues, operational overhead. Vertical is simple but has a ceiling and downtime on resize.",
    "Alternatives are serverless auto-scaling, managed databases with read replicas and caching to reduce load before scaling."
  ],
  "Latency, Throughput and Percentiles": [
    "Latency is time per request, throughput is requests per second, and you should measure latency by percentiles (p50, p95, p99), because averages hide tail latency that users and fan-out systems feel. Throughput and latency trade off under load.",
    "Percentile p99 means 99 percent of requests are faster than this value. Little's Law relates concurrency, throughput and latency. Tail latency amplifies when a request fans out to many services.",
    "A fast average can still hide slow outliers that break SLOs and user experience.",
    "Use them to define SLOs, size capacity, compare designs and find bottlenecks.",
    "Do not report only averages, test with unrealistic load, or ignore coordinated omission in load tests.",
    "Instrument histograms (Micrometer), set SLOs on p95 and p99, use timeouts and hedged requests to cut tails, and load test to find the knee of the latency curve.",
    "Pros: honest performance picture. Cons: needs good instrumentation and data volume for meaningful percentiles.",
    "Alternatives are apdex scores and error budgets based on SLOs."
  ],
  "Availability and Reliability (SLA, SLO, SLI)": [
    "Availability is the share of time a system works, expressed in nines; SLI is the measured indicator, SLO the internal target and SLA the contractual promise with penalties. Redundancy, health checks, failover and graceful degradation raise availability, and error budgets balance reliability against change speed.",
    "99.9 percent allows about 8.8 hours of downtime a year, 99.99 about 53 minutes. Serial dependencies multiply availability downward, redundant parallel components improve it.",
    "Users and businesses need predictable reliability, and teams need a shared way to decide how much risk is acceptable.",
    "Use it when defining targets, designing redundancy, and writing postmortems.",
    "Do not promise more nines than your dependencies provide, or design for 100 percent.",
    "Remove single points of failure, deploy across zones, use health checks and automatic failover, apply timeouts, retries and circuit breakers, practise chaos testing, and track error budgets.",
    "Pros: clear targets and trade-offs. Cons: higher availability costs much more and increases complexity.",
    "Alternatives are accepting lower availability for internal tools, and multi-region active-active for the highest tiers."
  ],
  "CAP Theorem and PACELC": [
    "CAP says during a network partition a distributed system must choose between consistency and availability; partition tolerance is not optional. PACELC adds that even without partitions you trade latency against consistency.",
    "Consistency means every read sees the latest write, availability means every request gets a non-error response, and partition tolerance means the system works despite lost messages. CP systems refuse requests to stay consistent, AP systems answer with possibly stale data.",
    "It frames the unavoidable trade-offs in designing replicated data stores.",
    "Use it to choose and justify databases and designs: banking ledgers lean CP, social feeds and carts lean AP.",
    "Do not use it as a simplistic label for databases, since many systems are tunable per operation, and consistency in CAP is linearizability, not ACID.",
    "Decide per use case, tune quorum settings (R plus W greater than N) in stores like Cassandra, use idempotent writes and reconciliation for AP, and consensus-backed stores such as etcd or Spanner-style systems for CP.",
    "Pros: clear reasoning about failure. Cons: oversimplifies real systems with tunable consistency.",
    "Alternatives are PACELC and consistency model taxonomies, and CRDTs for conflict-free AP designs."
  ],
  "Consistency Models": [
    "Models range from strong (linearizable) through sequential and causal to eventual consistency. Choose the weakest model that keeps the business correct, because stronger guarantees cost latency and availability.",
    "Strong consistency means reads see the latest write. Read-your-writes, monotonic reads and causal consistency are intermediate guarantees. Eventual consistency means replicas converge if writes stop.",
    "Replicated and cached data can be stale, and users and code must know what to expect.",
    "Use strong consistency for money, inventory reservations and uniqueness, and eventual consistency for feeds, counters, search indexes and caches.",
    "Do not assume read replicas are consistent with the primary, or build workflows that need immediate consistency on top of eventually consistent stores.",
    "Route read-after-write to the primary, use version numbers and idempotency, design for compensating actions, and use quorum reads or consensus where strong guarantees are needed.",
    "Pros: right-sized guarantees. Cons: eventual consistency pushes complexity to application code.",
    "Alternatives are distributed transactions (costly), sagas and CRDTs."
  ],
  "Back-of-the-Envelope Estimation": [
    "Estimate quickly: convert users into requests per second, storage, bandwidth and memory, using round numbers and powers of two or ten. The goal is the order of magnitude to choose between designs, not exact figures.",
    "Typical steps: daily active users times actions per user gives requests per day, divide by about 100,000 seconds for average QPS, multiply by peak factor of two to five, then estimate storage per record times retention.",
    "Estimates reveal whether one machine, a cache or sharding is needed before you invest in a design.",
    "Use it at the start of every system design interview and capacity planning.",
    "Do not chase false precision or skip stating assumptions.",
    "State assumptions, do the arithmetic aloud: for example 100 million DAU times 10 requests is 1 billion a day, about 12,000 QPS average and 50,000 at peak. Know latency numbers: memory about 100 ns, SSD 100 microseconds, same-region network 0.5 ms.",
    "Pros: guides design with minimal effort. Cons: sensitive to assumptions.",
    "Alternatives are load testing prototypes and production metrics when available.",
    `100M DAU, 10 reads/user/day  = 1B reads/day  -> 1e9 / 1e5 s  ~ 10,000 QPS average, ~50,000 peak
Write ratio 1:100             -> ~100 write QPS
500 bytes/record * 100 writes/s * 86,400 * 365 ~ 1.5 TB/year
Cache hit 90% of 10,000 QPS    -> ~1,000 QPS reach the database`
  ],
  "How to Approach a System Design Interview": [
    "Use a repeatable flow: clarify requirements and scope, estimate scale, define APIs and data model, sketch a high-level design, deep dive into bottlenecks, then discuss trade-offs, failure handling and evolution. Drive the conversation and justify each choice.",
    "Typical structure is about 5 minutes on requirements, 5 on estimates, 10 on high-level design, 15 to 20 on deep dives and the rest on trade-offs, monitoring and wrap-up.",
    "Open-ended problems reward structure and communication more than a single right answer.",
    "Use it for every design round, especially at senior levels where trade-off reasoning is evaluated.",
    "Do not jump to technologies, name-drop tools without reasons, or ignore non-functional requirements.",
    "Ask about functional and non-functional requirements, estimate load, draw components and data flow, pick storage with reasons, identify bottlenecks, discuss caching, partitioning, replication, failure modes, consistency and observability, and summarise decisions.",
    "Pros: clear, convincing answers. Cons: needs practice to stay within time.",
    "Alternatives are depth-first on one component if the interviewer steers there."
  ],

  "Load Balancing": [
    "A load balancer distributes requests across servers for scalability and availability, using algorithms like round robin, least connections or consistent hashing, with health checks to remove bad nodes. Layer 4 balances TCP, layer 7 understands HTTP.",
    "L4 balancers forward connections quickly; L7 balancers inspect headers and paths to route, terminate TLS and apply policies. They can be hardware, software (NGINX, HAProxy, Envoy) or cloud services (ALB, NLB).",
    "A single server is a bottleneck and a single point of failure.",
    "Use it in front of any horizontally scaled service, at the edge and between internal tiers.",
    "Avoid sticky sessions as a crutch for stateful services, and do not make the balancer itself a single point of failure.",
    "Run balancers redundantly, configure health checks and connection draining, choose least connections for uneven request cost, and use consistent hashing for caches. Enable autoscaling integration.",
    "Pros: scalability, availability, central TLS and routing. Cons: another component, uneven load with poor algorithms, and sticky-session coupling.",
    "Alternatives are DNS round robin, client-side load balancing (Spring Cloud LoadBalancer), service mesh and anycast."
  ],
  "Caching Strategies": [
    "Common strategies are cache-aside, read-through, write-through, write-behind and refresh-ahead. Cache-aside is the default, and the hard parts are invalidation, stampedes, TTLs and consistency.",
    "Cache-aside has the app check the cache, then load from the database and populate. Write-through writes to cache and store together, write-behind writes to the cache and persists asynchronously.",
    "Caches reduce latency and database load by serving hot data from memory.",
    "Use it for read-heavy, repeated or expensive data: product catalogs, profiles, computed results and sessions.",
    "Avoid caching highly volatile data requiring strict consistency, and avoid unbounded caches or missing TTLs.",
    "Choose eviction (LRU, LFU) and TTL, prevent stampedes with locking or request coalescing, use jittered expiry, invalidate on writes, and monitor hit rate. Layer local (Caffeine) and distributed (Redis) caches.",
    "Pros: big latency and cost savings. Cons: stale data, invalidation complexity and added infrastructure.",
    "Alternatives are CDN caching, database read replicas, materialised views and precomputation.",
    `public User getUser(long id) {                        // cache-aside
    User u = cache.get(id);
    if (u != null) return u;
    u = repository.findById(id).orElseThrow();
    cache.put(id, u, Duration.ofMinutes(10).plusSeconds(random.nextInt(60))); // jitter
    return u;
}
public void updateUser(User u) { repository.save(u); cache.evict(u.id()); }`
  ],
  "CDN": [
    "A CDN caches static and cacheable content at edge locations near users, cutting latency and origin load. Control it with cache headers, versioned URLs and purge mechanisms.",
    "Edge servers serve cached copies and fetch from the origin on a miss. They also absorb DDoS traffic, terminate TLS and can run edge logic.",
    "Serving all content from one region is slow for distant users and expensive at the origin.",
    "Use it for images, scripts, video, downloads and cacheable API responses.",
    "Avoid it for highly personalised or private content without proper cache keys, and do not forget invalidation strategy.",
    "Set Cache-Control and ETag headers, use content-hashed filenames, configure origin shielding, purge selectively, and use signed URLs for protected content.",
    "Pros: low latency, offload, resilience. Cons: staleness, invalidation delay and cost.",
    "Alternatives are regional caching, multi-region deployment and edge compute platforms."
  ],
  "Database Sharding and Partitioning": [
    "Partitioning splits data across tables or nodes; sharding spreads it over multiple servers by a shard key (hash, range or directory). It scales writes and storage but complicates joins, transactions and rebalancing, so choose the key carefully.",
    "Hash sharding spreads load evenly, range sharding supports range queries but risks hotspots, and directory sharding uses a lookup table. Cross-shard queries need scatter-gather.",
    "A single database eventually hits limits of storage, write throughput and connections.",
    "Use it when vertical scaling, indexing, caching and read replicas are exhausted and data is large and growing.",
    "Avoid it early, since it brings operational and application complexity. Avoid shard keys with skew, such as country or a timestamp.",
    "Pick a high-cardinality key aligned with access patterns, route requests by key, use consistent hashing for resharding, avoid cross-shard transactions, and consider managed distributed databases.",
    "Pros: horizontal scaling of data and writes. Cons: cross-shard joins and transactions, rebalancing pain and hotspots.",
    "Alternatives are read replicas, caching, NewSQL databases (CockroachDB, Spanner) and NoSQL stores with built-in partitioning."
  ],
  "Replication": [
    "Replication copies data to multiple nodes for availability and read scaling, using leader-follower, multi-leader or leaderless models, with synchronous or asynchronous propagation that trades durability against latency and consistency.",
    "Leader-follower sends writes to a leader and replicates to followers. Synchronous replication waits for acknowledgements, asynchronous does not and may lose recent writes on failover. Leaderless systems use quorums.",
    "A single copy is a single point of failure, and one node cannot serve all reads.",
    "Use it for high availability, read scaling, disaster recovery and geo-distribution.",
    "Avoid assuming followers are up to date and avoid multi-leader setups unless conflict resolution is planned.",
    "Use a primary with replicas, send read-after-write traffic to the primary, monitor replication lag, plan failover with promotion and fencing, and use quorum settings in leaderless stores.",
    "Pros: availability and read throughput. Cons: lag and stale reads, failover complexity and conflict handling in multi-leader.",
    "Alternatives are backups only, consensus-replicated stores (Raft) and sharding for write scale."
  ],
  "Consistent Hashing": [
    "Consistent hashing maps keys and nodes onto a ring so adding or removing a node moves only a small fraction of keys, unlike modulo hashing which remaps almost everything. Virtual nodes smooth the distribution.",
    "Each node is placed at one or many points on a hash ring, and a key belongs to the first node clockwise from its hash. Virtual nodes give each server many points to balance load.",
    "With hash(key) mod N, changing N reshuffles nearly all keys, invalidating caches and causing mass data movement.",
    "Use it for distributed caches, sharded databases, load balancing with affinity and partitioned message systems.",
    "Avoid it when the node set is fixed and small, where simple hashing works, or when range queries are required.",
    "Build a sorted map of hash points to nodes with 100 to 200 virtual nodes each, find the key's position with ceiling lookup, and replicate to the next distinct nodes for durability.",
    "Pros: minimal key movement and easy scaling. Cons: more complex than modulo, and uneven load without virtual nodes.",
    "Alternatives are rendezvous hashing, modulo hashing with rebalancing, and directory-based lookup.",
    `class ConsistentHash<N> {
    private final SortedMap<Integer, N> ring = new TreeMap<>();
    void add(N node, int vnodes) {
        for (int i = 0; i < vnodes; i++) ring.put(hash(node + "#" + i), node);
    }
    void remove(N node, int vnodes) {
        for (int i = 0; i < vnodes; i++) ring.remove(hash(node + "#" + i));
    }
    N nodeFor(String key) {
        SortedMap<Integer, N> tail = ring.tailMap(hash(key));
        return ring.get(tail.isEmpty() ? ring.firstKey() : tail.firstKey());
    }
}`
  ],
  "SQL vs NoSQL Selection": [
    "Choose by access patterns and guarantees: relational databases for structured data, joins and strong transactions, and NoSQL (key-value, document, wide-column, graph) for scale, flexible schema or specific access patterns. Many systems use both.",
    "Relational systems offer ACID, SQL and referential integrity. Key-value stores give very fast lookups, document stores flexible nested data, wide-column stores massive write throughput and graph databases relationship traversal.",
    "No single database fits all workloads, and wrong choices are expensive to reverse.",
    "Use SQL by default for business data. Use key-value for cache and sessions, document for catalogs, wide-column for time series or huge write loads, graph for relationship queries.",
    "Avoid NoSQL only for hype, or SQL for use cases that need extreme horizontal write scaling without the operational plan.",
    "List queries and consistency needs, estimate scale, pick the simplest store that meets them, and use polyglot persistence with clear ownership and synchronisation.",
    "Pros: right tool per workload. Cons: operational variety and data synchronisation complexity.",
    "Alternatives are NewSQL databases that combine SQL and horizontal scale, and PostgreSQL with JSONB for mixed needs."
  ],
  "Message Queues and Event Streaming": [
    "Queues decouple producers and consumers and absorb bursts; streaming platforms like Kafka keep an ordered, replayable log. Key topics are delivery guarantees, ordering by partition, consumer groups, retries and dead-letter queues.",
    "A queue delivers each message to one consumer in a group, while a log retains messages so many consumers can read at their own pace. Delivery can be at-most-once, at-least-once or effectively exactly-once with idempotency.",
    "Synchronous coupling propagates failures and limits throughput, and spikes overload downstream systems.",
    "Use it for asynchronous workflows, event-driven integration, buffering, fan-out and audit logs.",
    "Avoid it for simple request-response needs where latency and simplicity matter, or when ordering and delivery semantics are not understood.",
    "Choose partition keys for ordering, make consumers idempotent, configure retries with backoff and a DLQ, monitor lag, and size partitions for parallelism.",
    "Pros: decoupling, resilience, scalability. Cons: eventual consistency, operational complexity, duplicates and debugging difficulty.",
    "Alternatives are synchronous calls, database polling, outbox with CDC and managed services such as SQS, SNS and Pub/Sub."
  ],
  "API Gateway and Reverse Proxy": [
    "A reverse proxy forwards client requests to backend servers, and an API gateway adds API-specific concerns: routing, authentication, rate limiting, request transformation and aggregation. It is the single entry point for clients.",
    "The gateway terminates TLS, authenticates, throttles, routes by path or version, and may aggregate several backend calls. Reverse proxies like NGINX and Envoy handle the networking core.",
    "Clients should not know internal service topology, and cross-cutting policies should be enforced once.",
    "Use it for microservice and public API deployments with many clients.",
    "Avoid putting business logic in the gateway or making it a bottleneck without scaling.",
    "Run it redundantly, keep routing config in version control, offload auth to an identity provider, and add observability headers such as correlation ids.",
    "Pros: central policy, simpler clients. Cons: single point of failure risk, added latency and potential bottleneck.",
    "Alternatives are service mesh ingress, direct service exposure with shared libraries and BFF layers."
  ],
  "Rate Limiting Algorithms": [
    "Common algorithms are token bucket (allows bursts), leaky bucket (smooths output), fixed window (simple but bursty at edges), sliding window log (accurate but costly) and sliding window counter (a good compromise). Distributed limiting needs a shared store such as Redis with atomic operations.",
    "A token bucket refills tokens at a steady rate and each request consumes one. Fixed window counts per time slice. Sliding window counter weights the previous and current windows.",
    "Rate limiting protects services from abuse, overload and noisy neighbours, and enforces fair use.",
    "Use it at gateways, per user, IP or API key, and around expensive operations.",
    "Avoid limiting by IP alone behind NAT, and avoid in-memory limits when several instances serve the same user.",
    "Implement token bucket in Redis with a Lua script for atomicity, return 429 with Retry-After headers, differentiate tiers, and monitor rejects.",
    "Pros: protection and fairness. Cons: complexity in distributed setups, and choosing algorithm trade-offs between accuracy, memory and burst handling.",
    "Alternatives are load shedding, concurrency limits, queue-based throttling and cloud gateway quotas.",
    `class TokenBucket {
    private final long capacity; private final double refillPerSec;
    private double tokens; private long last = System.nanoTime();
    TokenBucket(long capacity, double refillPerSec) { this.capacity = capacity; this.refillPerSec = refillPerSec; tokens = capacity; }

    synchronized boolean tryAcquire() {
        long now = System.nanoTime();
        tokens = Math.min(capacity, tokens + (now - last) / 1e9 * refillPerSec);
        last = now;
        if (tokens >= 1) { tokens -= 1; return true; }
        return false;                       // respond 429
    }
}`
  ]
};
