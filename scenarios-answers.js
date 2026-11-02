// Each entry: [interview summary, situation, why asked, first checks and signals, common mistakes, step-by-step approach, short vs long term, other options, example command or snippet]
const SECTION_LABELS = ["Definition (The situation)", "Motivation (Why it is asked)", "Context (First checks and signals)", "Anti-Context (Common mistakes)", "Implementation (Step-by-step approach)", "Trade-offs (Short-term vs long-term)", "Alternatives (Other options)", "Example"];
const SERVICE_ANSWERS = {
  "Service Is Slow in Production": [
    "Scope the problem first (which endpoints, since when, how many users), correlate with deployments and traffic, then follow a trace down the call path to find where the time goes: application, database, downstream call, GC or infrastructure. Mitigate quickly with rollback or scaling if you can, and fix the root cause afterwards with evidence.",
    "Users or alerts report high latency, and p95 or p99 has risen against the baseline. It may be total or only for some endpoints, tenants or times of day.",
    "It tests a methodical, metrics-driven approach to performance problems rather than guessing, and the habit of mitigating before diagnosing.",
    "Check latency percentiles by endpoint, request rate, error rate, saturation (CPU, memory, thread pools, connection pools), recent deployments or config changes, GC pause logs, slow query logs and distributed traces. Compare with the same time last week.",
    "Common mistakes are restarting without capturing evidence, tuning JVM flags at random, adding instances when the database is the bottleneck, trusting averages, and changing several things at once so the effect cannot be attributed.",
    "Define the symptom and blast radius, check dashboards for the four golden signals, look at traces to find the slow span, capture a thread dump or profile (jcmd, async-profiler) while it is slow, check database and downstream metrics, mitigate (rollback, scale, shed load, feature flag), fix the root cause, add a regression test and alert.",
    "Short term: rollback, scale out, raise a limit or add a cache to stop the pain. Long term: fix the query or algorithm, set timeouts and budgets, add SLO alerts and load tests so it is detected before users notice.",
    "Alternatives are continuous profiling in production, canary releases to catch regressions early, and an APM tool with automatic trace analysis.",
    `# Which endpoints are slow right now? (PromQL, p95 by URI)
histogram_quantile(0.95, sum by (le, uri) (rate(http_server_requests_seconds_bucket[5m])))

# Capture evidence on the JVM (repeat 3 times, 10 seconds apart)
jcmd <pid> Thread.print > threads-1.txt
jcmd <pid> GC.heap_info
jcmd <pid> JFR.start duration=60s filename=slow.jfr`
  ],
  "Memory Keeps Growing": [
    "Decide whether it is a real leak, a bounded cache or just a heap sized larger than needed, by looking at the heap after full GCs over time. Then capture a heap dump, find the dominator objects and their GC roots, and fix the retention. Restart or scale as a stopgap.",
    "A JVM service shows steadily rising memory, with frequent or longer GCs and eventually OutOfMemoryError or an OOM kill in the container.",
    "It tests JVM memory knowledge: heap versus off-heap, GC behaviour, tooling for heap analysis and the ability to distinguish leak from misconfiguration.",
    "Check the used heap after GC (not just total usage), old generation growth, GC frequency and pause time, non-heap metrics (metaspace, direct buffers, thread count), container limits versus -Xmx, and recent changes. A sawtooth pattern with a stable baseline is normal.",
    "Common mistakes are increasing -Xmx as the only fix, reading container memory as heap usage, taking a heap dump from a freshly started instance, and ignoring native or off-heap memory and unbounded thread creation.",
    "Enable GC logging and heap dump on OOM, confirm growth in the old generation after full GCs, take a heap dump (or two, to compare), open it in Eclipse MAT or VisualVM, inspect the dominator tree and path to GC roots, find the culprit (unbounded cache, static map, listener, ThreadLocal, unclosed resources), fix with bounds and eviction, then verify with a soak test.",
    "Short term: restart or rolling restarts, raise memory and set heap dump flags to preserve evidence. Long term: fix the leak, bound caches, add memory alerts on post-GC heap and a soak test in the pipeline.",
    "Alternatives are Java Flight Recorder allocation profiling, a native memory check with NMT when heap is stable but RSS grows, and a bounded cache library such as Caffeine in place of hand-made maps.",
    `# JVM flags to preserve evidence
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps -Xlog:gc*:file=gc.log

# Live inspection
jcmd <pid> GC.class_histogram | head -30
jcmd <pid> GC.heap_dump /dumps/heap-1.hprof

# Off-heap suspicion (add -XX:NativeMemoryTracking=summary at start)
jcmd <pid> VM.native_memory summary`
  ],
  "CPU at 100 Percent": [
    "Find out which process and which threads burn the CPU, then map the hot thread to Java code using a thread dump or profiler. Typical culprits are a hot loop, regex backtracking, excessive GC, serialisation, or a traffic spike, and each needs a different fix.",
    "A service instance or all instances show CPU at or near the limit, latency rises, and requests queue or time out.",
    "It tests whether you can go from a symptom to a specific line of code with standard tools, and whether you know that GC can also cause high CPU.",
    "Check whether CPU is user or system time, which threads are hot, GC activity and its share of CPU, request rate versus normal, recent deployment, and whether it affects one instance or all of them.",
    "Common mistakes are adding instances without understanding the cause (a hot loop just burns more CPU), killing the process before capturing a dump, and ignoring that GC threads may be the consumer.",
    "Confirm with top or per-thread view, convert the thread id to hex, take two or three thread dumps a few seconds apart and find the same thread in the same frame, or sample with async-profiler or JFR to get a flame graph. Check GC logs if GC threads dominate. Fix the code (algorithm, regex, cache, batching), then load test.",
    "Short term: scale out, throttle or block the offending traffic, roll back the release. Long term: fix the hot path, add CPU and GC alerts, and performance tests for the known expensive operations.",
    "Alternatives are continuous profiling tools, JFR in production with low overhead, and rate limiting if the cause is a traffic pattern rather than code.",
    `# Hot threads in the JVM process
top -H -p <pid>                       # note the busiest thread id (decimal)
printf '%x\n' <thread-id>             # convert to hex = nid in the thread dump
jstack <pid> | grep -A 15 'nid=0x<hex>'

# Flame graph for 30 seconds
asprof -d 30 -e cpu -f cpu.html <pid>`
  ],
  "Application Hangs": [
    "A hang usually means threads are blocked, not that the CPU is busy. Capture several thread dumps, look for deadlocks, threads waiting on locks, exhausted pools or blocked I/O without timeouts, then restore service and fix the blocking pattern.",
    "The service stops responding or responds only to some calls, health checks may time out, and CPU is often low.",
    "It tests understanding of concurrency problems, thread pools and timeouts, and calm evidence gathering before restarting.",
    "Check CPU (low suggests blocking), thread count, pool usage (Tomcat, database, HTTP client), the state of threads in dumps (BLOCKED, WAITING, TIMED_WAITING), connection pool wait times, and the health of downstream systems.",
    "Common mistakes are restarting at once and losing the evidence, assuming it is a deadlock without verifying, using unbounded thread pools or queues, and having no timeouts on remote calls.",
    "Take three thread dumps about ten seconds apart (jstack or jcmd), check for the deadlock report, group threads by their top frames to find the common wait point, check what holds the lock or which pool is exhausted, restore service by restart or traffic shift after capturing, then fix with timeouts, bulkheads, lock ordering or non-blocking calls.",
    "Short term: restart after capturing dumps, add instances, lower the traffic. Long term: add timeouts everywhere, bound pools and queues, apply bulkheads, and add alerts for pool saturation and blocked thread counts.",
    "Alternatives are JFR to examine lock contention, virtual threads for blocking I/O heavy code (with care for pinning), and circuit breakers to stop a slow dependency from consuming all threads.",
    `# Three dumps, ten seconds apart
for i in 1 2 3; do jcmd <pid> Thread.print -l > dump-$i.txt; sleep 10; done

# Deadlock report and most common wait points
grep -A 20 'Found one Java-level deadlock' dump-1.txt
grep -h 'java.lang.Thread.State' dump-*.txt | sort | uniq -c | sort -rn`
  ],
  "Intermittent Errors Under Load": [
    "Treat it as a saturation or concurrency problem until proven otherwise: find which error, where it starts, and which limit is hit (pool, rate, timeout, memory). Reproduce with a load test, correlate with metrics, then remove the bottleneck or add backpressure.",
    "Errors such as timeouts, 5xx responses or connection resets appear only above a certain load or at certain times, and disappear when traffic falls.",
    "It tests the ability to reason about resource limits, race conditions and capacity, and to build evidence for a problem that is not constantly present.",
    "Check the error type and ratio by endpoint and instance, saturation metrics (pools, queues, file descriptors, CPU), retry storms, load balancer and gateway timeouts, database locks and deadlocks, GC pauses and DNS or network errors.",
    "Common mistakes are blaming the network without data, adding retries that multiply load, ignoring errors that affect only one instance, and testing only at low load where the problem does not occur.",
    "Group errors by cause and by instance, find the first failing component, line up error spikes with pool and queue metrics, reproduce with a load test that ramps up (k6 or Gatling), identify the limit, fix it (pool sizes, timeouts, indexes, async processing), add backpressure and rate limiting, and then re-test above the expected peak.",
    "Short term: scale out, raise a limit, shed load. Long term: capacity planning, load tests in CI, circuit breakers with sensible retries and jitter, and saturation alerts that fire before errors begin.",
    "Alternatives are chaos and fault-injection testing, traffic shadowing in production, and autoscaling on queue depth or saturation rather than CPU.",
    `# Error rate and saturation side by side (PromQL)
sum(rate(http_server_requests_seconds_count{status=~"5.."}[1m])) / sum(rate(http_server_requests_seconds_count[1m]))
hikaricp_connections_pending
tomcat_threads_busy_threads / tomcat_threads_config_max_threads

# Spring Boot limits worth checking
server.tomcat.threads.max=200
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=2000`
  ],
  "Database Is the Bottleneck": [
    "Find the expensive queries from real data (slow query log, pg_stat_statements), check their plans, and fix with indexes, query changes or batching. Then reduce load through caching, read replicas and connection management, and only shard when simpler steps are exhausted.",
    "Database CPU, I/O or connections are saturated, queries are slow, and application latency follows the database.",
    "It tests practical database skills: reading query plans, indexing, locking, connection pooling and knowing the scaling ladder.",
    "Check top queries by total time, execution plans, missing or unused indexes, lock waits, connection counts versus limits, cache hit ratio, replication lag, table bloat and recent schema or query changes. Look for N+1 queries from the ORM.",
    "Common mistakes are scaling the app tier (more connections to a busy database), adding indexes blindly, caching without an invalidation plan, tuning the database before fixing a bad query, and raising pool sizes beyond what the database can serve.",
    "Rank queries by total time, run EXPLAIN (ANALYZE, BUFFERS) on the worst, add or fix indexes, remove N+1 patterns with fetch joins or batching, paginate with keyset pagination, size the connection pool sensibly, cache read-mostly data, move reads to replicas where staleness is acceptable, archive old data, and consider partitioning or sharding last.",
    "Short term: add an index, kill a runaway query, scale the instance vertically. Long term: fix access patterns, introduce caching and replicas, partition large tables, and track query performance regressions.",
    "Alternatives are materialised views, a search engine or column store for analytical queries, CQRS read models, and a different data store when the access pattern does not suit relational storage.",
    `-- PostgreSQL: top queries by total time
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

-- Inspect one plan
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42 AND status = 'OPEN' ORDER BY created_at DESC LIMIT 20;

-- Supporting index built without blocking writes
CREATE INDEX CONCURRENTLY idx_orders_customer_status_created
  ON orders (customer_id, status, created_at DESC);`
  ],
  "Cascading Failure Across Services": [
    "Stop the spread first: shed load, open circuit breakers, disable the failing feature and cut retries. Then find the originating service from traces and dependency graphs, and harden the call paths with timeouts, bulkheads, retries with backoff and limits, and graceful degradation.",
    "One slow or failing service causes its callers to pile up threads and retries, which overload other services until much of the system is degraded.",
    "It tests resilience engineering knowledge and the ability to prioritise containment over diagnosis during a wide outage.",
    "Check the dependency graph and traces to find the first service to degrade, thread and connection pool saturation in callers, retry rates, queue depths, error rates, and what changed (deployment, traffic spike, dependency slowdown).",
    "Common mistakes are restarting everything at once (a thundering herd on recovery), increasing timeouts or retries, scaling healthy services into an unhealthy dependency, and diagnosing before containing.",
    "Declare an incident, shed non-critical traffic or enable maintenance mode, disable or isolate the failing dependency with feature flags or breakers, roll back recent changes, restore the origin service, ramp traffic back gradually, and run a blameless review. Fix permanently with timeouts, circuit breakers, bulkheads, retry budgets with jitter, rate limits, and fallbacks.",
    "Short term: shed load and isolate the failing component. Long term: resilience patterns on every remote call, load shedding by priority, dependency tiers, chaos tests and game days.",
    "Alternatives are asynchronous messaging to decouple callers, cell-based architecture to limit blast radius, and a service mesh that applies timeouts and retries consistently.",
    `# Resilience4j: breaker, bulkhead and timeout on a remote call (application.yml)
resilience4j:
  circuitbreaker:
    instances:
      inventory:
        failure-rate-threshold: 50
        sliding-window-size: 20
        wait-duration-in-open-state: 30s
  bulkhead:
    instances:
      inventory:
        max-concurrent-calls: 25
  timelimiter:
    instances:
      inventory:
        timeout-duration: 800ms`
  ],
  "Third-Party API Is Unreliable": [
    "Treat the third party as a failure-prone dependency: put strict timeouts, retries with backoff and jitter on idempotent calls, a circuit breaker, and a fallback or queue around it. Add monitoring of its SLA from your side and decouple critical flows from its availability.",
    "A vendor API is slow, rate limits you, or fails intermittently, and your own service suffers because it depends on it synchronously.",
    "It tests resilience design, idempotency, and pragmatic vendor management beyond just add a retry.",
    "Check failure patterns (timeouts, 5xx, 429), latency percentiles for the dependency alone, retry amplification, whether calls are idempotent, quota usage, and what your service does when the call fails.",
    "Common mistakes are unbounded or immediate retries, no timeouts, retrying non-idempotent operations without idempotency keys, blocking user requests on slow calls, and ignoring rate limit headers.",
    "Wrap calls in a client with connect and read timeouts, a circuit breaker and a bulkhead; retry only idempotent calls with exponential backoff and jitter; use idempotency keys for payments; cache results where valid; queue work for later where the user does not need an immediate answer; respect rate limits; monitor and alert on dependency health; and agree support channels or SLAs with the vendor.",
    "Short term: tighten timeouts, open the breaker, switch to a fallback or queue. Long term: reduce critical-path coupling, consider a second provider, negotiate an SLA, and add contract tests and synthetic checks.",
    "Alternatives are an asynchronous integration using a queue and webhook callbacks, a secondary vendor with failover, a cached or stale-while-revalidate response, and an anti-corruption layer that isolates the vendor model.",
    `// Spring Boot + Resilience4j: idempotent call with timeout, retry and fallback
@CircuitBreaker(name = "rates", fallbackMethod = "cachedRate")
@Retry(name = "rates")
public Rate fetchRate(String currency) {
    return restClient.get().uri("/rates/{c}", currency)
        .retrieve().body(Rate.class);   // client configured with 500 ms connect and 1 s read timeout
}
private Rate cachedRate(String currency, Throwable t) {
    return rateCache.getStale(currency);
}`
  ],
  "Duplicate Payments Happened": [
    "Contain the damage first by stopping duplicate processing and refunding affected customers, then find the cause, typically retries or redelivered messages without idempotency. The permanent fix is idempotency keys with a unique constraint, plus reconciliation to detect any remaining duplicates.",
    "Customers were charged more than once for the same order, usually after a timeout, a retry or a message redelivery.",
    "It tests understanding of at-least-once delivery, idempotency and money-handling discipline, and how you handle a customer-impacting data incident.",
    "Check payment provider logs against internal records, find duplicates by order id and amount, look at where retries happen (client, gateway, service, message consumer), timeouts shortly before the second charge, and whether any idempotency key is sent.",
    "Common mistakes are only issuing refunds without fixing the cause, removing retries entirely, relying on check-then-insert without a unique constraint (race conditions), and a double-submit protection only in the UI.",
    "Stop the bleeding (pause the retrying path or consumer), list affected transactions through reconciliation, refund and notify customers, identify the duplication path, add an idempotency key per business operation stored with a unique constraint, pass the key to the payment provider, make consumers idempotent by event id, and add a daily reconciliation job with alerts.",
    "Short term: pause the path, refund and communicate. Long term: idempotent design throughout the payment flow, reconciliation as a safety net, and tests that simulate timeouts and redelivery.",
    "Alternatives are the transactional outbox with a deduplicating consumer, a payment state machine that rejects invalid transitions, and distributed locks, which are weaker than a database constraint.",
    `-- Idempotency enforced by the database, not by application checks
CREATE TABLE payment (
  id              BIGSERIAL PRIMARY KEY,
  idempotency_key VARCHAR(64) NOT NULL,
  order_id        BIGINT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  status          VARCHAR(20) NOT NULL,
  CONSTRAINT uq_payment_idem UNIQUE (idempotency_key)
);

-- Find existing duplicates for reconciliation
SELECT order_id, COUNT(*) FROM payment WHERE status = 'CAPTURED' GROUP BY order_id HAVING COUNT(*) > 1;`
  ],
  "Data Mismatch Between Services": [
    "Quantify and contain the mismatch, find where the data diverged (lost or reordered event, failed dual write, bug, manual change), repair it through a reconciliation job, and then remove the cause with the outbox pattern, idempotent consumers and a defined source of truth.",
    "Two services hold different values for the same business fact, such as order status or stock, and users or reports see inconsistent information.",
    "It tests understanding of eventual consistency, ownership of data and practical reconciliation, rather than blaming the network.",
    "Check which service is the source of truth, the event flow and its lag, dead-letter queues, failed or retried messages, ordering assumptions, dual writes in code, and schema or contract changes around when the mismatch began.",
    "Common mistakes are patching rows by hand without finding the cause, assuming two-phase commit is needed, using the target database as the source of truth, and ignoring ordering and duplicates in consumers.",
    "Measure the scale with a comparison query or script, define the authoritative service, repair using a replay of events or a one-off reconciliation, find the cause (dual write, missing outbox, lost message, non-idempotent consumer, out-of-order events), fix it with transactional outbox, idempotent consumers with versioning, and schedule a continuous reconciliation job with alerts on drift.",
    "Short term: targeted repair and monitoring of the gap. Long term: clear data ownership, reliable event publication, versioned events, and automated reconciliation as a permanent control.",
    "Alternatives are change data capture to feed the other service, event sourcing for a replayable history, synchronous reads from the owner for critical data, and sagas for multi-step business operations.",
    `-- Reconciliation: orders whose status differs between the order and billing databases (after export or via a federated view)
SELECT o.id, o.status AS order_status, b.status AS billing_status
FROM orders o JOIN billing_orders b ON b.order_id = o.id
WHERE o.status <> b.status AND o.updated_at < now() - interval '10 minutes';

-- Alert if event consumer lag grows (Kafka)
kafka-consumer-groups.sh --bootstrap-server broker:9092 --describe --group billing-consumer`
  ],
  "Lost or Duplicate Messages": [
    "Assume at-least-once delivery and design for it: make consumers idempotent to handle duplicates, and prevent loss with producer acknowledgements, a transactional outbox, durable topics and careful offset commits after processing. Use dead-letter queues and reconciliation to find anything that still goes wrong.",
    "Events are sometimes missing for consumers, or processed more than once, causing missing updates or repeated side effects.",
    "It tests deep knowledge of delivery semantics in Kafka or RabbitMQ and the practical design needed because exactly-once is rarely free.",
    "Check producer acks and retry settings, whether the database write and publish happen atomically, consumer offset commit timing, rebalances, poison messages and DLQ contents, consumer lag, and retention settings.",
    "Common mistakes are committing offsets before processing (loss), publishing after the database commit with no outbox (loss on crash), non-idempotent handlers, and treating exactly-once as a given.",
    "On the producer use acks=all, idempotence enabled and the outbox pattern; on the broker use replication and min in-sync replicas; on the consumer commit offsets after processing, deduplicate by event id (unique constraint or processed-events table), handle poison messages with retry topics and a DLQ, and monitor lag. Add a reconciliation check for critical flows.",
    "Short term: replay from the offset or DLQ and dedupe. Long term: idempotent handlers everywhere, outbox publishing, schema and contract discipline, and lag and DLQ alerts.",
    "Alternatives are Kafka transactions for read-process-write within Kafka (exactly-once within that scope), CDC instead of application publishing, and event sourcing as the source from which messages are derived.",
    `# Producer settings (Spring Kafka)
spring.kafka.producer.acks=all
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.consumer.enable-auto-commit=false
spring.kafka.listener.ack-mode=record

// Idempotent consumer
@Transactional
public void handle(OrderEvent e) {
    if (!processedEvents.tryInsert(e.eventId())) return;   // unique constraint on event_id
    applyBusinessChange(e);
}`
  ],
  "Zero-Downtime Schema Change": [
    "Use the expand and contract approach: make backward-compatible changes first, deploy code that works with both old and new schema, migrate data in the background, then remove the old structure later. Each step is deployed and reversible on its own.",
    "A database schema must change (rename a column, add a constraint, split a table) while the service stays up and old and new application versions run at the same time.",
    "It tests understanding of rolling deployments, locking behaviour of DDL and migration discipline, which are everyday seniors' concerns in production systems.",
    "Check the size of the table, the lock the DDL will take, the database version's online DDL capabilities, replication lag tolerance, whether old and new application versions can both run, and the rollback plan.",
    "Common mistakes are renaming or dropping columns in one release, adding a NOT NULL column with a default that rewrites a large table (older versions), long-running migrations that hold locks, and mixing schema and code changes in an irreversible release.",
    "Expand: add the new nullable column or table with an online operation. Deploy code that writes both and reads the old. Backfill in small batches with throttling. Switch reads to the new column behind a flag, verify, then stop writing the old. Contract: drop the old column in a later release. Version migrations with Flyway or Liquibase and rehearse them on production-sized data.",
    "Short term: more releases and temporary dual-write code. Long term: safe, reversible changes and no maintenance windows, with the cost of extra steps and temporary duplication.",
    "Alternatives are a short maintenance window for small systems, online schema change tools (gh-ost, pt-online-schema-change) for MySQL, blue-green databases with replication, and views to hide the physical change.",
    `-- Step 1 (expand): non-blocking, nullable
ALTER TABLE customer ADD COLUMN full_name VARCHAR(200);

-- Step 3 (backfill in batches, repeat until 0 rows updated)
UPDATE customer SET full_name = first_name || ' ' || last_name
WHERE id IN (SELECT id FROM customer WHERE full_name IS NULL LIMIT 5000);

-- Step 6 (contract), only after no code reads the old columns
ALTER TABLE customer DROP COLUMN first_name, DROP COLUMN last_name;`
  ],
  "Migrating a Huge Table": [
    "Move the data online in controlled steps: create the new structure, dual-write new changes, backfill history in throttled batches, verify with checksums, switch reads gradually, and keep the ability to roll back until you are confident. Avoid single large transactions and long locks.",
    "A table with hundreds of millions of rows must be restructured, partitioned, moved to another database or changed in type, without downtime and without overloading the database.",
    "It tests operational care at scale: batching, throttling, verification and rollback planning, which separates reliable migrations from outages.",
    "Check table size and growth, write rate, index and foreign key dependencies, replication lag, available I/O headroom, peak times, and how the application accesses the table (so you can dual-write safely).",
    "Common mistakes are one giant UPDATE or INSERT SELECT that locks and fills the log, no verification of copied data, migrating at peak hours, forgetting indexes and sequences on the target, and no rollback path.",
    "Create the target (partitioned or new schema), start dual-writing or capture changes via CDC or triggers, backfill by primary-key ranges in small batches with sleeps, watch replication lag and database load, verify counts and checksums per range, switch reads behind a flag for a small percentage, then all traffic, stop the old writes and archive the old table after a hold period.",
    "Short term: the migration takes weeks and needs dual-write code and monitoring. Long term: a table that is easier to maintain, and a reusable procedure and tooling for later migrations.",
    "Alternatives are online schema change tools, partition exchange for time-based data, archiving old rows rather than moving them, and logical replication to a new database followed by cut-over.",
    `-- Batched backfill by key range (run from a throttled job, not one statement)
INSERT INTO orders_new (id, customer_id, status, created_at)
SELECT id, customer_id, status, created_at
FROM orders
WHERE id > :last_id AND id <= :last_id + 10000
ON CONFLICT (id) DO NOTHING;

-- Verify a range
SELECT COUNT(*), SUM(id) FROM orders     WHERE id BETWEEN :a AND :b;
SELECT COUNT(*), SUM(id) FROM orders_new WHERE id BETWEEN :a AND :b;`
  ],
  "Handle 10x Traffic Next Month": [
    "Start from measurement: establish the current baseline and limits with a load test, find the first bottleneck, and fix in order of cost and benefit (caching, queries, statelessness, autoscaling, then data scaling). Agree targets, run capacity tests up to 10x plus headroom, and prepare a degradation plan.",
    "A marketing event or launch is expected to bring ten times the normal traffic, and the system must cope without outage or a huge bill.",
    "It tests capacity planning, bottleneck analysis and risk management, rather than just say we will add servers.",
    "Check current peak and average load, headroom per tier (app, database, cache, queue, third parties), current SLOs, autoscaling limits, connection limits, third-party rate limits, and what traffic is cacheable or deferrable.",
    "Common mistakes are scaling only the stateless tier and leaving the database, assuming linear scaling, skipping load tests, forgetting dependency and licence limits, and making risky architecture changes just before the event.",
    "Define the expected profile (peak QPS, read and write mix), load test to find the first bottleneck and repeat, apply fixes (caching with a CDN, indexes, connection pools, async work through queues, read replicas, autoscaling with warm-up), pre-scale before the event, add rate limiting and load shedding for non-critical features, set up dashboards and a runbook, and rehearse with a game day.",
    "Short term: pre-scaling and feature degradation for the event. Long term: structural changes (partitioning, queue-based processing) and ongoing capacity tests, balanced against cost of idle capacity.",
    "Alternatives are serverless or managed autoscaling services, a virtual waiting room to flatten the peak, static pre-generated pages, and reserving capacity for the event only.",
    `# k6 ramp test to 10x of current peak (current peak: 500 rps)
export const options = {
  scenarios: { ramp: { executor: 'ramping-arrival-rate', startRate: 100, timeUnit: '1s',
    preAllocatedVUs: 500, maxVUs: 3000,
    stages: [ { target: 500, duration: '5m' }, { target: 5000, duration: '15m' }, { target: 5000, duration: '10m' } ] } },
  thresholds: { http_req_duration: ['p(95)<400'], http_req_failed: ['rate<0.01'] },
};`
  ],
  "Monolith Is Slowing Teams Down": [
    "First diagnose why teams are slow (build time, merge conflicts, coupling, release coordination, unclear ownership) and fix the cheapest causes. If the structure is the problem, modularise inside the monolith first and then extract services along proven boundaries with the strangler pattern, one at a time, where independent deployment pays off.",
    "A large application makes releases risky and infrequent, changes in one area break another, builds are slow and many teams contend for the same code.",
    "It tests judgement against fashion: whether you jump to microservices or analyse the real constraint and migrate incrementally.",
    "Check lead time and deploy frequency, build and test duration, the dependency graph and coupling hotspots, which modules change together, change failure rate, team ownership of code and where merge conflicts occur.",
    "Common mistakes are a big-bang rewrite, splitting by technical layer or by table, extracting services without owning their data, adopting microservices without CI/CD and observability, and ending with a distributed monolith.",
    "Measure delivery metrics, identify bounded contexts (event storming), enforce module boundaries in the monolith (packages, Spring Modulith, ArchUnit), speed up builds and tests, introduce feature flags and trunk-based development, then extract the module that benefits most from independent scaling or release, behind a gateway, with its own database and an anti-corruption layer.",
    "Short term: build and process fixes plus modularisation give gains quickly. Long term: selected service extractions bring autonomy but cost operational complexity, so only extract where the benefit is clear.",
    "Alternatives are keeping a well-structured modular monolith, a monorepo with strong tooling, and a platform team providing paved roads for services.",
    `// Module boundaries enforced as tests (ArchUnit + Spring Modulith)
@Test
void modulesAreIndependent() {
    ApplicationModules.of(Application.class).verify();   // fails on illegal cross-module access or cycles
}

// Strangler routing at the gateway (Spring Cloud Gateway)
spring.cloud.gateway.routes[0].id=billing-new
spring.cloud.gateway.routes[0].uri=http://billing-service
spring.cloud.gateway.routes[0].predicates[0]=Path=/billing/**`
  ],
  "Secure a Public API": [
    "Apply defence in depth: strong authentication (OAuth2 or OpenID Connect), authorisation on every request, TLS everywhere, input validation, rate limiting, secrets management, logging and monitoring, and protection against the OWASP API Top 10 risks such as broken object-level authorisation. Threat model first to focus effort.",
    "An API will be exposed to the internet, serving external clients or partners, and must resist abuse and attacks.",
    "It tests breadth and practicality in security: identity, authorisation models, common vulnerabilities and operational controls.",
    "Check who the clients are (browser, mobile, partner, machine), data sensitivity, required scopes, existing identity provider, regulatory requirements, expected volume and abuse patterns, and where authorisation decisions must be made.",
    "Common mistakes are authentication without object-level authorisation, trusting client-supplied ids and roles, API keys alone for user data, verbose errors, permissive CORS, long-lived tokens, and logging secrets or personal data.",
    "Put the API behind a gateway with TLS and WAF, authenticate with OAuth2 and short-lived JWT access tokens validated by the resource server, authorise per resource and action in the service, validate and bound all input, rate limit and set payload size limits, use mTLS or signed requests for partners, store secrets in a vault, keep an audit log, scan dependencies, and test with automated and manual security tests.",
    "Short term: gateway controls and token validation give broad protection fast. Long term: fine-grained authorisation, key rotation, regular testing and monitoring, each adding development and operational cost.",
    "Alternatives are API keys with quotas for low-risk public data, mutual TLS for machine clients, a managed API gateway or identity service, and zero-trust service-to-service controls.",
    `// Spring Security resource server with method-level authorisation
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(a -> a.requestMatchers("/actuator/health").permitAll()
                                     .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}
// Object-level check: never trust the id alone
@PreAuthorize("@orderAccess.isOwner(#orderId, authentication)")
public Order get(Long orderId) { ... }`
  ],
  "Choose Between Kafka and RabbitMQ": [
    "Choose by access pattern: Kafka is a durable, partitioned, replayable log for high-throughput streaming and many independent consumers, while RabbitMQ is a flexible broker with rich routing, per-message acknowledgement and work queues for task distribution. State your throughput, ordering, replay and operational needs, then decide.",
    "A team needs asynchronous messaging between services and must choose a broker for the long term.",
    "It tests the ability to compare technologies on requirements rather than popularity, and to discuss operational cost.",
    "Check message volume and size, ordering requirements, need for replay and retention, number of independent consumers, routing complexity, latency needs, team experience and operational capacity, and managed offerings available.",
    "Common mistakes are choosing Kafka for a handful of simple tasks, using RabbitMQ as an event store, assuming either gives exactly-once for free, and ignoring operations such as partition planning and monitoring.",
    "List requirements and score both: replay and event sourcing, high throughput, multiple consumer groups and strict per-key ordering favour Kafka; complex routing, priorities, per-message TTL, request-reply and low-volume work queues favour RabbitMQ. Run a short proof of concept, estimate operating cost (managed or not), record the choice in an ADR and define a revisit trigger.",
    "Short term: the simpler broker gets you live faster. Long term: replay and consumer independence from Kafka versus routing flexibility and simpler operations from RabbitMQ, with migration cost if you pick wrongly.",
    "Alternatives are managed cloud queues and topics (SQS and SNS, Pub/Sub), Pulsar, NATS, Redis Streams for small cases, or the database outbox with polling for modest volumes.",
    `Need                                   Kafka      RabbitMQ
Replay old events / new consumer       strong     weak (queue is consumed)
Very high throughput, large backlog    strong     moderate
Per-key ordering at scale              partitions per-queue only
Complex routing, priorities, TTL       limited    strong (exchanges)
Task queue with ack per message        workable   natural fit
Operational effort                     higher     lower for small setups`
  ],
  "Rate-Limit Abusive Clients": [
    "Identify the abusers from request metrics, then apply limits per client identity (API key, user, IP) using a token bucket or sliding window, enforced at the gateway and backed by a shared store like Redis. Return 429 with Retry-After, tier limits by plan, and add monitoring and blocking for repeat offenders.",
    "A few clients send excessive traffic, scrape data or hammer an endpoint, harming performance for everyone.",
    "It tests practical API protection and knowledge of limiting algorithms, distributed counters and fairness.",
    "Check traffic by client, endpoint and IP, request patterns (bursts, scraping, credential stuffing), error and latency impact, how clients are identified, and whether legitimate clients behind shared IPs would be affected.",
    "Common mistakes are limiting only by IP (shared NATs, rotating IPs), applying one global limit, enforcing limits per instance without shared state, blocking without a clear error response, and no allowance for legitimate bursts.",
    "Analyse logs for the offenders, choose the algorithm (token bucket for bursts, sliding window for accuracy), enforce at the edge or gateway with Redis for shared counters, set limits per identity and endpoint cost, return 429 with Retry-After and rate limit headers, tier limits by plan, add anomaly alerts and temporary blocks, and document limits for clients.",
    "Short term: a coarse limit or block on the worst offenders stops the damage. Long term: per-client quotas, cost-based limits and abuse detection, balanced against false positives and the added dependency on the limiter store.",
    "Alternatives are a CDN or WAF bot protection, concurrency limits instead of rate limits, request queuing and load shedding, and API keys with paid quotas.",
    `# Spring Cloud Gateway with Redis token bucket
spring.cloud.gateway.routes[0].id=orders
spring.cloud.gateway.routes[0].uri=http://order-service
spring.cloud.gateway.routes[0].predicates[0]=Path=/orders/**
spring.cloud.gateway.routes[0].filters[0].name=RequestRateLimiter
spring.cloud.gateway.routes[0].filters[0].args.redis-rate-limiter.replenishRate=20
spring.cloud.gateway.routes[0].filters[0].args.redis-rate-limiter.burstCapacity=40
spring.cloud.gateway.routes[0].filters[0].args.key-resolver=#{@apiKeyResolver}

# Who is hitting us? (PromQL)
topk(10, sum by (client_id) (rate(http_server_requests_seconds_count[5m])))`
  ],
  "Large File Upload Design": [
    "Do not stream big files through your application servers: issue a pre-signed URL so the client uploads directly to object storage, using multipart or resumable uploads, then process asynchronously after an upload-complete event. Validate type and size, scan for malware and keep metadata in your database.",
    "Users need to upload large files, such as videos or datasets, reliably over unreliable networks without overloading the backend.",
    "It tests system design thinking: memory and thread usage, resumability, security and asynchronous processing.",
    "Check file size range, client types, network quality, need for resume, storage and retention, processing needs (virus scan, transcoding), security and privacy requirements, and expected concurrency.",
    "Common mistakes are loading the whole file into memory, proxying every byte through the app tier, no size or type limits, synchronous processing in the request, and trusting the file extension or client-provided content type.",
    "The client requests an upload session, the service authorises and returns pre-signed multipart URLs, the client uploads chunks in parallel with retry and resume, the storage emits an event on completion, a worker validates, scans and processes the file, and the service updates status that the client polls or receives by notification. Use lifecycle rules to clean incomplete uploads and expire old files.",
    "Short term: direct-to-storage uploads remove load from servers quickly. Long term: scanning, processing pipelines and retention policies add components but give safety and scale.",
    "Alternatives are a simple multipart streaming endpoint for small files (limited), the tus resumable upload protocol, a dedicated upload service, or a managed media pipeline.",
    `// 1. Client asks for an upload session: POST /uploads {name, size, contentType}
// 2. Server validates limits and returns pre-signed part URLs
POST /uploads            -> { uploadId, parts: [ { partNumber: 1, url: "https://storage/..." }, ... ] }
// 3. Client PUTs each part to its URL (parallel, retry on failure), then:
POST /uploads/{id}/complete  { parts: [ { partNumber, etag } ] }
// 4. Storage event -> queue -> worker: verify size and checksum, malware scan, process, set status READY
GET  /uploads/{id}       -> { status: PROCESSING | READY | REJECTED }`
  ],
  "Flaky Tests Block Releases": [
    "Quarantine and track flaky tests so they stop blocking the pipeline, then fix the root causes: shared state, timing and sleeps, order dependence, uncontrolled time, random data and external dependencies. Measure flakiness and treat it as a defect with owners and a service level.",
    "Tests fail intermittently without code changes, teams rerun pipelines until green, and trust in the suite and release speed both decline.",
    "It tests engineering discipline and pragmatism: improving delivery without simply disabling tests or ignoring quality.",
    "Check failure history per test, whether failures cluster by environment, time or order, CI resource limits, shared databases or ports, asynchronous waits, time and timezone use, and test data randomness.",
    "Common mistakes are blind retries that hide real bugs, deleting tests, adding sleeps, ignoring the problem until nobody trusts CI, and putting too many slow end-to-end tests at the top of the test pyramid.",
    "Collect data on flaky tests (failure rate per test from CI), quarantine the worst into a non-blocking suite with a ticket and deadline, reproduce by running the test repeatedly and in random order, fix causes (isolate data with Testcontainers and unique ids, replace sleeps with awaits on conditions, inject a Clock, mock external services), and add a rule that new flaky tests are fixed or removed within a week.",
    "Short term: quarantine and limited retry to unblock releases. Long term: isolation, a healthier test pyramid, flakiness dashboards and ownership, which require sustained team effort.",
    "Alternatives are test impact analysis to run fewer tests, contract tests in place of end-to-end suites, and parallel isolated environments per pipeline run.",
    `// Replace sleep with a condition-based wait (Awaitility)
await().atMost(Duration.ofSeconds(5))
       .untilAsserted(() -> assertThat(repository.findStatus(id)).isEqualTo(Status.DONE));

// Control time instead of depending on it
Clock fixed = Clock.fixed(Instant.parse("2025-01-01T10:00:00Z"), ZoneOffset.UTC);
var service = new ExpiryService(fixed);

# Reproduce: run one test many times (Maven Surefire)
mvn -Dtest=OrderIT -Dsurefire.rerunFailingTestsCount=0 -DforkCount=1 test   # loop this 50 times in a script`
  ],
  "Rewrite or Refactor Decision": [
    "Default to incremental refactoring with the strangler pattern, and rewrite only when the platform is truly end-of-life or the architecture cannot meet core needs, and even then in slices. Decide with evidence on cost, risk, business value and the team's knowledge of the current system, not frustration with the old code.",
    "A legacy system is painful to change, and the team or management is considering a full rewrite.",
    "It tests judgement and risk awareness: rewrites often take longer than planned, lose hidden behaviour and stall feature delivery.",
    "Check what is actually painful (build, tests, coupling, platform end of life), how much hidden business logic exists without tests or documentation, the system's change rate, the team's knowledge, business tolerance for a feature freeze, and what a minimum viable replacement would cover.",
    "Common mistakes are a big-bang rewrite with a feature freeze, underestimating undocumented behaviour, rewriting to a new technology as a goal in itself, and refactoring without tests or a clear objective.",
    "Define the problems and goals in measurable terms, add characterisation tests around critical behaviour, refactor the hotspots (high change rate and high defects), extract modules behind interfaces, replace components via the strangler pattern with routing at a facade, run old and new in parallel and compare results, retire the old code piece by piece, and review progress against metrics regularly.",
    "Short term: refactoring keeps features flowing but progress is gradual. Long term: a rewrite can fix fundamental problems but carries a high risk of delay and regression, so slice it and keep the old system alive until proven.",
    "Alternatives are replace with a commercial product, leave the stable parts alone and contain them behind an anti-corruption layer, or rewrite only a single bounded component that has a clear interface.",
    `Decision checklist
1. Is the platform end-of-life or architecturally unable to meet a key requirement?   (if no -> refactor)
2. Can we carve out slices behind a facade?                                             (if yes -> strangler)
3. Do we have tests that describe current behaviour?                                    (if no -> write characterisation tests first)
4. What does the first slice deliver, and when can we ship it to production?            (if > 3 months -> slice smaller)
5. What metric tells us this is working? (lead time, defect rate, cost)                 (review every month)`
  ]
};
