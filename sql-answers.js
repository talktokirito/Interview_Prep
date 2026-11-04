// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, example]
const SERVICE_ANSWERS = {
  "Partition Key Selection": [
    "Cosmos DB spreads data across logical partitions by partition key, and each partition has its own storage and throughput ceiling. I choose a high-cardinality key that appears in most queries and spreads writes evenly, and I avoid low-cardinality fields such as status or country that create hot spots.",
    "The partition key is a property every item carries. Items with the same key live in one logical partition (up to 20 GB), and the service maps logical partitions onto physical ones.",
    "A bad key caps throughput for the whole container, makes some partitions hot and turns queries into expensive cross-partition fan-outs.",
    "Choose the key at design time for any container expected to grow, and check it against the top read and write queries.",
    "Do not default to id when queries filter by another field, and do not use a low-cardinality field like status or a timestamp as the key.",
    "List the top queries, pick a property used in their filters, verify the cardinality against sample data, and make the hot queries target one partition key value.",
    "Pros: linear scale and cheap point reads. Cons: the key is hard to change later (new container or migration), and cross-partition queries cost more RUs.",
    "Synthetic keys (tenant plus a suffix) for very large tenants, hierarchical partition keys for multi-tenant data, or PostgreSQL with native partitioning.",
    `// Multi-tenant orders partitioned by tenantId, so tenant queries stay in one partition
// Point read: container.readItem(orderId, new PartitionKey(tenantId), Order.class)
// Bad choice: /status has few values, so all new writes hit the same partition`
  ],
  "Request Units and Cost Control": [
    "Every Cosmos DB operation costs Request Units (RUs), so both the bill and throttling (HTTP 429) depend on the RU charge per operation, not just the request count. I measure the charge, reduce it with point reads and selective queries, and size throughput to the measured load.",
    "RUs are a normalised cost covering CPU, IO and memory. A point read of a 1 KB item costs about 1 RU, and queries cost more with the number of items scanned and indexed.",
    "Unmeasured RU consumption causes throttling and surprise bills, and the RU charge is the feedback loop for design decisions.",
    "When reviewing a new access pattern, when seeing 429s, or before setting provisioned throughput.",
    "Do not raise RU/s to hide 429s before fixing expensive queries; that only pays for waste.",
    "Log the RequestCharge from each SDK response, use point reads where possible, project only the fields needed, check the indexing policy for the query paths, and let the SDK retry 429s with back-off.",
    "Pros: predictable performance once tuned. Cons: needs constant measurement, and cross-partition queries can be expensive.",
    "Autoscale to absorb peaks, serverless for spiky low traffic, or a cache such as Redis for hot reads.",
    `// Java SDK v4: point read costs roughly 1 RU for a small item
CosmosItemResponse<Order> r = container.readItem(orderId, new PartitionKey(tenantId), Order.class);
double charge = r.getRequestCharge();   // log this per operation
// Projection with the partition key filter
// SELECT c.id, c.total FROM c WHERE c.tenantId = @t AND c.status = 'OPEN'`
  ],
  "Consistency Levels": [
    "Cosmos DB offers five consistency levels (strong, bounded staleness, session, consistent prefix and eventual) that trade read freshness against latency, availability and RU cost. Session is the default and fits most apps because a client always reads its own writes.",
    "Strong gives linearisability, but only with a single write region. Bounded staleness limits lag by time or versions. Session gives read-your-writes and monotonic reads for one session token. Consistent prefix keeps write order. Eventual gives no ordering guarantee.",
    "Global apps must choose how fresh a read needs to be, because stronger levels cost more latency and RUs.",
    "Session for user-facing apps, strong for critical reads in a single region, and bounded staleness for globally distributed reads with a known lag limit.",
    "Strong is not available with multi-region writes, and eventual is wrong where users must see their own writes.",
    "Set the account default at creation, override per request only where safe in the SDK, and pass the session token between calls from the same user.",
    "Pros: a clear freshness choice. Cons: stronger levels reduce availability and raise cost; eventual can show stale data.",
    "A single write region with read replicas, a relational database with synchronous commits, or read-your-writes caching in the application.",
    `Account default: Session
Critical read override (only where needed): Strong, single write region, higher latency and RU cost`
  ],
  "Data Modelling: Embed vs Reference": [
    "In Cosmos DB I model data around the access patterns, not around normalised entities. I embed data that is read together and bounded in size, and reference data that is shared, large or unbounded, keeping each item well under the 2 MB limit.",
    "Embedding stores child data inside the parent document, so one read returns everything. Referencing stores an id and fetches the related item separately, like a foreign key without joins.",
    "Cosmos DB has no server-side joins, so the document model decides how many round trips and RUs a use case costs.",
    "Embed one-to-few relations such as order lines. Reference one-to-many or many-to-many relations such as customers and orders.",
    "Do not embed unbounded lists such as every event for a user, or data that many writers update independently.",
    "List the main reads and writes, embed for the common read, copy a few stable display fields, and keep a reference id to the authoritative item.",
    "Pros: single-item reads and fewer RUs. Cons: duplicated data needs update logic, and documents can grow.",
    "Separate containers with references, or PostgreSQL with JSONB and joins for highly relational data.",
    `// Embedded: one read returns the order with its lines
{ "id": "o-1", "tenantId": "t1", "customerName": "Acme", "lines": [ { "sku": "A1", "qty": 2 } ] }
// Referenced: the customer lives in its own item, the order keeps the id
{ "id": "o-1", "tenantId": "t1", "customerId": "c-9" }`
  ],
  "Throughput Modes": [
    "Cosmos DB offers provisioned throughput (manual RU/s), autoscale (RU/s that scale between 10 percent and 100 percent of a maximum) and serverless (pay per RU consumed). I choose by traffic shape: provisioned for steady load, autoscale for variable production load, and serverless for development or low, spiky traffic.",
    "Provisioned RU/s is reserved per container or database and billed hourly. Autoscale bills the highest RU/s used in each hour, with a floor of 10 percent of the maximum. Serverless has no reservation and only a single region.",
    "Matching throughput to load controls cost and prevents 429s during peaks.",
    "Autoscale for production with peaks, serverless for prototypes or infrequent use, and provisioned for predictable high steady load.",
    "Serverless is not for large steady production load or multi-region writes. Provisioned throughput without monitoring wastes money.",
    "Start with autoscale at a measured maximum, monitor normalised RU consumption, alert on 429s, and share database-level throughput only across containers with similar access.",
    "Pros: right-sized cost. Cons: autoscale has a 10 percent floor, and serverless has size and region limits.",
    "Reserved capacity for steady workloads, or a relational store with fixed instance sizing.",
    `Autoscale max 4000 RU/s: scales between 400 and 4000 RU/s
Billed on the highest RU/s used in each hour`
  ],
  "Change Feed": [
    "The Cosmos DB change feed is a persistent, ordered log of inserts and updates per partition. I use it to drive projections, search index updates and event-driven integration without polling.",
    "Change feed processors (or an Azure Functions Cosmos DB trigger) read changes in partition order and store progress in a lease container, so each consumer resumes after failure.",
    "Polling the database for changes is costly and misses deletes. The change feed gives a resumable, low-latency stream.",
    "Materialised views, cache invalidation, search index updates, audit trails and publishing downstream events.",
    "Do not rely on it for global ordering across partitions, or for deletes unless you use a soft-delete flag or TTL.",
    "Create a lease container, run a processor with idempotent handlers, let the leases store checkpoints, and handle retries so that reprocessing is harmless.",
    "Pros: near real-time, no polling, resumable. Cons: delivery is at least once, so handlers must be idempotent, and the lease container costs RUs.",
    "Outbox pattern with Kafka or Event Hubs, database triggers, or the analytical store with Synapse Link.",
    `// Consumer: change feed processor with lease container "leases"
// Handler upserts into the search index by item id (idempotent)
// Deletes: write a soft-delete flag or use TTL so the change appears in the feed`
  ],
  "Global Distribution and Multi-Region Writes": [
    "Cosmos DB replicates data to any number of Azure regions. I design for low latency near users, and I choose single-region or multi-region writes with automatic failover, then test the failover path.",
    "Read and write regions are configured per account. Multi-region writes accept writes in every region and resolve conflicts with last writer wins or a custom stored procedure. Automatic failover promotes a region by priority.",
    "Global apps need low-latency reads and writes near users, and continuity when a region fails.",
    "Users spread across continents, or availability targets that need multi-region writes (99.999 percent SLA).",
    "Single-region apps should not pay for extra regions without a need, and multi-region writes add conflict handling.",
    "Add regions in the portal or CLI, enable automatic failover with priorities, set preferred locations in the SDK, and rehearse failover in a non-production account.",
    "Pros: low latency and high availability. Cons: cost per region, conflict handling and consistency trade-offs.",
    "A single write region with read replicas, Azure Front Door routing to regional deployments, or geo-replicated Azure SQL or PostgreSQL.",
    `Regions: East US (write, priority 0), West Europe (read, priority 1)
Automatic failover: on
SDK preferredLocations: nearest region first`
  ],
  "Clustered vs Nonclustered Indexes": [
    "A clustered index stores table rows in key order, so a table has only one. Nonclustered indexes are separate structures that point back to the row, which I use for selective lookups. I keep the clustered key narrow, unique and ever-increasing where possible.",
    "The clustered index is the leaf level of the table's B-tree. Nonclustered indexes store key columns plus a row locator (the clustering key, or a RID on a heap), and INCLUDE adds extra columns for covering queries.",
    "The right index turns scans into seeks. A wide or random clustered key slows inserts and fragments pages.",
    "Clustered on a primary key or narrow ascending column. Nonclustered on foreign keys and WHERE or JOIN columns, with INCLUDE for covering queries.",
    "Avoid many overlapping indexes on write-heavy tables, and avoid wide random GUID clustered keys because they cause page splits.",
    "Pick a narrow ascending clustered key (IDENTITY or a sequence), add nonclustered indexes that match the top queries, and review sys.dm_db_index_usage_stats to drop unused indexes.",
    "Pros: fast seeks and covering queries. Cons: write overhead, storage and fragmentation maintenance.",
    "Columnstore for analytics, filtered indexes for subsets, or indexed views for pre-aggregated data.",
    `CREATE NONCLUSTERED INDEX IX_Orders_Customer_Date
ON dbo.Orders (CustomerId, OrderDate)
INCLUDE (TotalAmount);`
  ],
  "Execution Plans and Query Store": [
    "I read actual execution plans in SSMS to compare estimated and actual rows and to find scans, key lookups and spills. Query Store (available since SQL Server 2016, so present in 2017) keeps query history and plan changes, which helps me find regressions and pin a known good plan.",
    "Query Store records query text, runtime statistics and plans over time. Its reports show top consumers and regressed queries, and a forced plan pins the chosen plan.",
    "Plans change after statistics updates or with parameter values. Without history, a regression is hard to prove or undo.",
    "When investigating slow queries, after a deployment, or to find plan regressions in production.",
    "Do not force plans before understanding why the optimiser changed. A forced plan can go stale as data changes.",
    "Enable Query Store on the database, open the Regressed Queries report, compare the plans, and force the good one with sp_query_store_force_plan. Review forced plans regularly.",
    "Pros: evidence and quick rollback of plans. Cons: some storage and overhead, and a forced plan can become a liability.",
    "Hints such as OPTION (RECOMPILE) or OPTIMIZE FOR, statistics updates with FULLSCAN, or query rewrites.",
    `ALTER DATABASE SalesDb SET QUERY_STORE = ON;
-- after identifying the good plan, pin it
EXEC sys.sp_query_store_force_plan @query_id = 42, @plan_id = 7;`
  ],
  "Parameter Sniffing": [
    "SQL Server compiles a plan using the parameter values it sees first and caches it. When later values have very different selectivity, the cached plan is wrong, which is parameter sniffing. I confirm it from plan variance and fix it per query, not by clearing the whole plan cache.",
    "The optimiser uses parameter values at compile time to estimate row counts. A plan that suits a rare customer can be terrible for a customer with millions of rows.",
    "Intermittent slowness that depends on the parameter is the classic symptom, often appearing after index maintenance or a restart.",
    "Procedures with parameters on skewed data, where the same query is fast sometimes and very slow at other times.",
    "Do not add OPTION (RECOMPILE) to every query, because the compile cost hurts frequent calls.",
    "Confirm two different plans for the same query in Query Store. Then use OPTION (RECOMPILE) for rare heavy calls, OPTIMIZE FOR for typical values, or copy parameters into local variables for an average plan.",
    "Pros: targeted fixes per query. Cons: recompiles cost CPU, and local variable plans can be mediocre for every value.",
    "Split the procedure by value range, or use dynamic SQL with sp_executesql for value-specific plans.",
    `CREATE PROCEDURE dbo.GetOrders @CustomerId INT
AS
SELECT OrderId, OrderDate FROM dbo.Orders
WHERE CustomerId = @CustomerId
OPTION (RECOMPILE);   -- compile per call for skewed customers`
  ],
  "Read Committed Snapshot and Snapshot Isolation": [
    "The default Read Committed level uses locks, so readers can block writers. Read Committed Snapshot Isolation (RCSI) and Snapshot Isolation use row versions in tempdb, so readers do not block writers. I enable RCSI for most OLTP systems to cut blocking, and I know the write conflict cost of Snapshot.",
    "RCSI gives each statement the committed data as of its start. Snapshot isolation gives each transaction a consistent view from its start and raises update conflicts (error 3960) on write-write conflicts.",
    "Reader and writer blocking is a common cause of slowness in OLTP, and row versioning removes most of it.",
    "OLTP with a heavy mix of reads and writes where blocking is measured. Snapshot for consistent multi-statement reports.",
    "RCSI does not fix write-write contention or long transactions, and a long transaction makes the version store grow in tempdb.",
    "Check sys.databases for the current setting, size tempdb for the version store, enable RCSI in a quiet window, and retry on conflicts if you use Snapshot.",
    "Pros: far less blocking. Cons: tempdb and version store overhead, extra I/O, and conflicts that need retries under Snapshot.",
    "NOLOCK hints (dirty reads, avoid them), pessimistic UPDLOCK hints in one place, or optimistic concurrency with a rowversion column.",
    `ALTER DATABASE SalesDb SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
ALTER DATABASE SalesDb SET ALLOW_SNAPSHOT_ISOLATION ON;`
  ],
  "Blocking and Deadlocks": [
    "Blocking happens when one session holds a lock another needs. A deadlock is a cycle where neither session can proceed, so SQL Server kills one victim. I find them with the system_health Extended Events session, then fix the lock order, shorten transactions and add indexes so fewer rows are locked.",
    "SQL Server takes row, page or table locks and escalates when many accumulate. The lock manager detects cycles and rolls back the cheapest victim with error 1205.",
    "Deadlocks fail requests and force retries, and blocking causes latency spikes.",
    "Random failures with error 1205, or long waits under concurrency.",
    "Do not put NOLOCK everywhere to hide blocking, because it can return inconsistent data.",
    "Read the deadlock graph from system_health, make every transaction touch tables in the same order, keep transactions short, add the index the UPDATE or DELETE needs, and retry the victim in the application.",
    "Pros: fixes the root cause. Cons: lock ordering is hard to enforce across teams, and rare cases still need retries.",
    "RCSI to remove reader blocking, lower isolation only where it is correct, or a single writer queue.",
    `-- Recent deadlock reports from the built-in system_health session
SELECT XEvent.query('(event/data/value/deadlock)[1]') AS DeadlockGraph
FROM (SELECT CAST(st.target_data AS XML) AS TargetData
      FROM sys.dm_xe_session_targets st
      JOIN sys.dm_xe_sessions s ON s.address = st.event_session_address
      WHERE s.name = 'system_health' AND st.target_name = 'ring_buffer') AS Data
CROSS APPLY TargetData.nodes('RingBufferTarget/event[@name="xml_deadlock_report"]') AS XEventData(XEvent);`
  ],
  "Temp Tables vs Table Variables": [
    "Temp tables (#t) have statistics and can be indexed, so they suit larger row sets and complex joins. Table variables (@t) have no statistics in SQL Server 2017, so the optimiser assumes one row, which makes them risky for large or joined sets.",
    "A #temp table lives in tempdb for the session and supports indexes, constraints and statistics. A table variable is scoped to the batch and gets a fixed one-row estimate in 2017.",
    "Wrong row estimates produce poor join choices and slow queries.",
    "Table variables for small fixed lists, or when transaction rollback must not undo the rows. Temp tables for large intermediate results.",
    "Do not use table variables for large sets joined to other tables in SQL Server 2017.",
    "Use a #temp table with a supporting index for intermediate results, create it inside a stored procedure so plans are reused, and drop it when finished.",
    "Pros: good plans from statistics. Cons: tempdb contention, and recompilation when temp tables change.",
    "CTEs for single-statement reuse, table-valued parameters for passing lists, or memory-optimised tables.",
    `CREATE TABLE #Recent (CustomerId INT PRIMARY KEY, Total MONEY);
INSERT INTO #Recent
SELECT CustomerId, SUM(TotalAmount) FROM dbo.Orders
WHERE OrderDate >= '2025-01-01' GROUP BY CustomerId;`
  ],
  "What Is New in SQL Server 2017": [
    "SQL Server 2017 added Linux and Docker support, graph tables, adaptive query processing, automatic plan correction based on Query Store, and string functions such as STRING_AGG and TRIM. In interviews I name what it adds and what it lacks compared with 2019, such as table variable deferred compilation and Accelerated Database Recovery.",
    "Linux and container support, graph tables with NODE and EDGE, adaptive query processing (interleaved execution for multi-statement table-valued functions and adaptive joins), automatic tuning, STRING_AGG, TRIM and CONCAT_WS, and Python in Machine Learning Services.",
    "Knowing version features shapes the fix you pick for an older estate.",
    "Maintaining a 2017 estate or planning an upgrade.",
    "Do not assume 2019 or later features such as Accelerated Database Recovery or UTF-8 collations are available.",
    "Check the version with SELECT @@VERSION, enable automatic tuning with FORCE_LAST_GOOD_PLAN, and test with compatibility level 140 before upgrading.",
    "Pros: modern features on-premises and on Linux. Cons: mainstream support has ended and extended support ends in October 2027, so plan the migration.",
    "SQL Server 2019 or 2022, or Azure SQL Database and Managed Instance.",
    `SELECT STRING_AGG(Name, ', ') AS Names FROM dbo.Products;   -- new in 2017
ALTER DATABASE SalesDb SET AUTOMATIC_TUNING (FORCE_LAST_GOOD_PLAN = ON);`
  ],
  "MVCC and VACUUM": [
    "PostgreSQL keeps old row versions so readers never block writers. Dead versions must be removed by VACUUM. Autovacuum usually handles it, but long transactions and heavy updates cause table bloat, which I monitor and tune.",
    "Each update writes a new tuple version and marks the old one dead. VACUUM reclaims space and updates the visibility map, ANALYZE refreshes statistics, and freezing prevents transaction ID wraparound.",
    "Bloat slows scans and index lookups, and wraparound can force the database into read-only emergency mode.",
    "Tables with heavy UPDATE or DELETE, and any investigation of a long-running transaction.",
    "Do not run VACUUM FULL casually, because it rewrites the table under an exclusive lock.",
    "Watch n_dead_tup in pg_stat_user_tables, tune autovacuum thresholds per hot table, avoid idle-in-transaction sessions, and use pg_repack for severe bloat.",
    "Pros: readers never block writers. Cons: dead tuples, vacuum I/O, and sensitivity to long transactions.",
    "Partitioning to drop old data quickly, append-only designs, or a lower fillfactor for update-heavy tables.",
    `SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;
ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.02);`
  ],
  "Index Types: B-tree, GIN, GiST and BRIN": [
    "B-tree is the default index for equality and range predicates. I use GIN for JSONB and full-text search, GiST for geometric and range types, and BRIN for very large tables that grow in a fixed order, where a small index is enough.",
    "B-tree handles =, <, > and ORDER BY. GIN indexes each element of a value, which suits containment queries. GiST supports overlap and nearest-neighbour searches. BRIN stores the min and max per block range.",
    "Choosing the right access method is the difference between an index lookup and a full scan on specialised data.",
    "B-tree for typical columns, GIN for jsonb containment and tsvector, BRIN for time-series rows inserted in order.",
    "BRIN is poor when physical order is random, and GIN makes writes slower.",
    "Create the index with USING gin or USING brin, add partial indexes for hot subsets, and confirm the planner uses it with EXPLAIN.",
    "Pros: the right tool per data type. Cons: each index adds write cost and maintenance, and GIN updates can be slow.",
    "Expression indexes, partial indexes, or a separate search engine for full-text search at scale.",
    `CREATE INDEX idx_orders_created_brin ON orders USING brin (created_at);
CREATE INDEX idx_products_attrs_gin ON products USING gin (attributes jsonb_path_ops);
CREATE INDEX idx_orders_open ON orders (customer_id) WHERE status = 'OPEN';`
  ],
  "EXPLAIN ANALYZE and Statistics": [
    "I use EXPLAIN (ANALYZE, BUFFERS) to compare estimated and actual rows, find sequential scans and sorts, and see buffer hits. Bad estimates usually mean stale statistics, so I run ANALYZE or raise the statistics target on skewed columns.",
    "The planner uses pg_statistic to estimate selectivity. EXPLAIN ANALYZE executes the query and reports real timings and row counts for each node.",
    "Plans depend on statistics, and large estimate mismatches explain most slow queries.",
    "Any slow query, and after a large bulk load.",
    "Do not run EXPLAIN ANALYZE on data-changing statements in production without wrapping them in a transaction you roll back.",
    "Run EXPLAIN (ANALYZE, BUFFERS), compare estimated and actual rows, run ANALYZE on the table, raise the statistics target on skewed columns, and add extended statistics for correlated columns.",
    "Pros: evidence-based tuning. Cons: ANALYZE samples the data, so it can miss skew.",
    "Query rewrites, materialised views, or pg_hint_plan for rare cases.",
    `EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42 AND status = 'OPEN';
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 500;
ANALYZE orders;`
  ],
  "JSONB Columns": [
    "JSONB stores parsed JSON in binary form with indexing support. I use it for flexible attributes that vary per row, and keep stable, frequently queried fields as typed columns.",
    "jsonb supports operators such as ->, ->>, @> and ? and works with GIN indexes. The json type keeps the original text.",
    "Flexible attributes without a separate document database, and fewer tables for sparse data.",
    "Product attributes, event payloads and settings where keys vary between rows.",
    "Do not store core relational data in JSON, because you lose constraints and typed columns.",
    "Use jsonb, add an expression or generated column for frequently filtered keys, and validate the shape with CHECK constraints or the application schema.",
    "Pros: flexibility inside SQL. Cons: weaker typing, larger rows and less accurate estimates for nested data.",
    "Normalised columns, EAV tables (usually worse), or a document store such as Cosmos DB.",
    `CREATE INDEX idx_products_attrs ON products USING gin (attributes);
SELECT id FROM products WHERE attributes @> '{"color": "red"}';
SELECT attributes->>'size' AS size FROM products WHERE id = 7;`
  ],
  "Isolation Levels and SERIALIZABLE": [
    "PostgreSQL defaults to Read Committed, implements Repeatable Read as snapshot isolation, and implements Serializable with predicate locks (SSI). I choose the lowest level that prevents the anomalies the business cares about, and I retry serialisation failures.",
    "Read Committed sees the latest committed data for each statement. Repeatable Read keeps one snapshot per transaction. Serializable detects dangerous read-write patterns and aborts one transaction with SQLSTATE 40001.",
    "Race conditions such as double booking or lost updates need stronger isolation or explicit locks.",
    "Financial or inventory rules where a check-then-write race exists.",
    "Do not use Serializable everywhere, because retries and CPU use rise.",
    "For simple rules use SELECT ... FOR UPDATE or unique constraints. For complex rules use Serializable with retries on 40001 and 40P01.",
    "Pros: strong correctness guarantees. Cons: aborts and retries, and more CPU.",
    "Explicit row locks, advisory locks, or unique constraints that enforce the rule in the database.",
    `BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT balance FROM accounts WHERE id = 1;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;  -- may fail with 40001, so the application retries`
  ],
  "Connection Pooling with PgBouncer": [
    "PostgreSQL starts one process per connection, so many application connections use a lot of memory and slow the server. I keep the application pool small with HikariCP, and I put PgBouncer in front in transaction mode when many instances connect.",
    "PgBouncer multiplexes many client connections over a smaller set of server connections. In transaction pooling, a server connection goes back to the pool after each transaction.",
    "Too many connections cause memory pressure, context switching and refused connections.",
    "Many application instances, or serverless functions, connecting to PostgreSQL.",
    "Transaction pooling breaks session features such as session-level prepared statements, SET and session advisory locks unless configured.",
    "Size each HikariCP pool to a few times the database cores (about 10 is a common start), set max_connections with headroom, deploy PgBouncer in transaction mode, and disable server-side prepared statements if the driver requires it.",
    "Pros: many clients share few server connections. Cons: feature limits in transaction mode and one more component to run.",
    "Managed pooling offered by the cloud provider, or fewer application instances with larger pools.",
    `[databases]
appdb = host=pg-primary port=5432 dbname=appdb

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20`
  ],
  "Choosing Cosmos DB or PostgreSQL": [
    "I start from the access patterns, the consistency needs and the scale. Cosmos DB fits globally distributed, key-based, high-throughput workloads with a clear partition key. PostgreSQL fits relational data, complex queries and transactions across entities.",
    "A product catalogue with millions of items, search by attributes, stock per warehouse and orders that need transactions.",
    "The interviewer tests trade-off thinking and whether you ask clarifying questions, not whether you know a favourite database.",
    "Read and write ratio, query shapes, need for joins and multi-row transactions, expected growth and regions.",
    "Picking Cosmos DB because it scales without modelling partition keys, or PostgreSQL without any plan for scale-out.",
    "List the top queries and transactions. Use PostgreSQL with JSONB for attributes when stock and orders need ACID. Use Cosmos DB for the read-heavy, key-based, globally distributed browse path, with the partition key matching the main read.",
    "PostgreSQL: strong transactions and joins, harder to scale out. Cosmos DB: horizontal scale and global reads, weaker joins, an RU cost model and careful key design.",
    "Keep PostgreSQL as the source of truth and feed a Cosmos DB read model with the change feed or CDC.",
    `Orders and stock need multi-row ACID  -> PostgreSQL
Global product browse at scale        -> Cosmos DB read model fed by change feed or CDC`
  ],
  "Hot Partition in Cosmos DB": [
    "A hot partition shows 429 errors for one partition key while the container still has spare throughput. I confirm it with partition-level metrics, then fix the key or spread the load instead of raising RU/s.",
    "One logical partition receives most of the reads or writes, for example one large tenant or one date value, so it reaches its per-partition throughput cap.",
    "Raising the container's RU/s does not help one partition, because each partition has its own cap. The cost grows and the problem stays.",
    "429s with uneven consumption across partition key ranges, or one tenant or timestamp dominating the traffic.",
    "Do not scale throughput up to fix a hot partition. You pay for capacity that the hot partition cannot use.",
    "Find the top partition key values in Insights, check the query patterns, then use a synthetic key for the hot tenant, cache the hot reads, batch the writes, or redesign the key in a new container with a migration.",
    "Synthetic keys spread the load but make queries fan out across suffixes. Caching adds staleness.",
    "A separate container or account for very large tenants, or a queue to smooth write bursts.",
    `// Hot: partitionKey = '2026-11-04' receives every write for the day
// Better: partitionKey = 'sensor-17' (high cardinality, evenly spread)`
  ],
  "Cosmos DB Cost Spike": [
    "I start from the cost analysis by meter (RU/s, storage, egress), then check the largest RU consumers in the query metrics. Most spikes come from autoscale peaks, cross-partition queries or a new query that is not covered by the index.",
    "The monthly bill jumps after a release, with more RU consumption and possibly a higher request charge per operation.",
    "Cost follows RU consumption, so one bad query can multiply the spend.",
    "The autoscale maximum sits at its ceiling for long periods, cross-partition query counts rise, or a new index or query shape appeared.",
    "Do not cut throughput first without knowing the real peak, because you may cause a 429 incident.",
    "Use Cosmos DB Insights and diagnostic logs (QueryRuntimeStatistics) to find the top RU queries. Add partition key filters, exclude unused paths in the indexing policy, set the autoscale maximum to the measured peak, and add budget alerts.",
    "Indexing changes lower write RUs but can slow ad-hoc queries. Lowering the maximum risks throttling.",
    "Reserved capacity for steady load, serverless for low traffic, or analytics moved to Synapse Link.",
    `// Diagnostic logs: group RequestCharge by OperationName and partition key filter
// The top three queries usually account for most of the RUs`
  ],
  "Slow Report Query on SQL Server": [
    "I confirm the plan first, check statistics and missing index hints, then choose between an index, a query rewrite, a columnstore index or moving the report to a readable replica. I never add indexes blindly.",
    "A nightly report scans a 300 million row sales table, takes 40 minutes and blocks the OLTP workload.",
    "Reporting queries on OLTP tables compete for locks and memory, and the plan shows whether the schema fits the query.",
    "Scans on the large table, sorts spilling to tempdb, or estimates far from the actual row counts.",
    "Do not add many nonclustered indexes that slow down the OLTP writes.",
    "Capture the actual plan, check sys.dm_db_missing_index_details as a hint, add a nonclustered columnstore index or a targeted covering index, update statistics, and run the report against a readable secondary of an Always On availability group.",
    "Columnstore speeds scans and aggregates but adds write overhead. A replica adds lag.",
    "Partitioned tables, a warehouse loaded by ETL, or pre-aggregated summary tables.",
    `CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_Sales
ON dbo.Sales (SaleDate, StoreId, ProductId, Amount);`
  ],
  "Deadlocks in Production on SQL Server": [
    "I collect the deadlock graph, identify the two statements and their lock order, then fix the access order, shorten the transactions and add the missing index. Retrying the victim is the safety net, not the fix.",
    "Intermittent error 1205 in the order-processing service during peak hours, with the cheaper transaction chosen as the victim.",
    "Each deadlock fails a user request, and retries can cascade into a retry storm.",
    "The graph shows two sessions locking the same rows in opposite order, key lookups under an update, or missing indexes that cause scans with locks.",
    "Do not enable NOLOCK everywhere to make the errors go away.",
    "Read the graph from system_health, make both procedures update tables in one agreed order, add the index that the UPDATE WHERE clause needs to lock fewer rows, keep transactions short, enable RCSI for readers, and retry error 1205 with back-off in the code.",
    "A consistent lock order is effective but needs team discipline. RCSI uses tempdb.",
    "Queue writes per aggregate, use UPDLOCK in one place, or optimistic concurrency with a rowversion column.",
    `-- Agreed order in every procedure that touches both tables: Inventory, then Orders
UPDATE dbo.Inventory SET Qty = Qty - 1 WHERE Sku = @sku AND Qty > 0;`
  ],
  "Migrating SQL Server to PostgreSQL": [
    "I treat it as a staged migration: map the schema and types, move the data with a tool such as AWS DMS, Azure DMS or pgloader, convert T-SQL logic deliberately, and cut over after a dual-run period with a rollback plan.",
    "Moving an order system from SQL Server 2017 to PostgreSQL, including stored procedures, identity columns and SQL Server-specific functions.",
    "The reasons are usually licensing, cloud cost or platform standards, not raw performance.",
    "Stored procedures that use T-SQL features, identity columns, MERGE statements and collation differences.",
    "Do not port T-SQL procedures line by line. Move the business logic to the application where it is clearer, or redesign it.",
    "Inventory the objects and features, convert types (IDENTITY to GENERATED ALWAYS AS IDENTITY, DATETIME2 to timestamp), convert the schema, replicate data with CDC until the cutover, validate row counts and checksums, then switch the application with a rollback path.",
    "Pros: lower licence cost and open standards. Cons: procedure rewrites, behaviour differences such as NULL ordering, case sensitivity and transaction handling, and a large testing effort.",
    "Keep SQL Server on Azure SQL Managed Instance, or move only new services to PostgreSQL.",
    `-- SQL Server
CREATE TABLE dbo.Orders (OrderId INT IDENTITY(1,1) PRIMARY KEY, CreatedAt DATETIME2 NOT NULL);
-- PostgreSQL
CREATE TABLE orders (order_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at TIMESTAMP NOT NULL);`
  ],
  "Read Replica Lag Shows Stale Data": [
    "I measure the lag first, then send read-your-writes traffic to the primary and accept staleness only where the business allows. The fix is usually routing and waiting for the replica to catch up, not making the replica faster.",
    "After a user places an order, the order page served by a read replica shows the old status for several seconds.",
    "Replicas apply changes asynchronously, so users can see data older than their own last write.",
    "Replication lag rises under load, there are long-running transactions on the primary, or large batch writes run.",
    "Do not send every read to a replica by default if the screen depends on the latest write.",
    "Measure lag with pg_stat_replication (replay_lag) or the managed service metric. Route reads right after a write to the primary for a short window or with a session token. Fix root causes such as long transactions, heavy batch writes and an undersized replica.",
    "Routing to the primary adds load, and sticky sessions add complexity.",
    "Synchronous replication for critical data (more latency), cache invalidation on write, or keeping the written state in the client.",
    `SELECT client_addr, state, replay_lag FROM pg_stat_replication;
-- app rule: read from the primary for 5 seconds after a write`
  ],
  "Joins": [
    "A join combines rows from two or more tables on a condition. INNER returns only matches, LEFT keeps every row from the left table, RIGHT and FULL do the same for the other side, and CROSS produces every pair. I write the join condition explicitly and check that it cannot multiply rows unexpectedly.",
    "INNER JOIN keeps matching pairs. LEFT JOIN keeps all left rows and fills the right side with NULL where nothing matches. FULL OUTER keeps unmatched rows from both sides. A self join relates a table to itself. EXISTS and NOT EXISTS express semi and anti joins without duplicates.",
    "Normalised data lives in several tables, so queries must combine them correctly and efficiently.",
    "Use INNER for required relationships, LEFT for optional ones, and NOT EXISTS to find rows with no related row.",
    "Do not join without a condition, which gives a Cartesian product. Do not filter the optional side of a LEFT JOIN in WHERE, because that turns it into an INNER JOIN. Avoid joining on unindexed columns for large tables.",
    "Join on indexed keys, put filters on the optional table in the ON clause, check the plan for the join operator (nested loop, hash or merge), and use EXISTS for existence checks instead of joins that create duplicates.",
    "Pros: flexible and expressive. Cons: costly on large unindexed tables, and one-to-many joins can duplicate rows.",
    "Denormalised tables, application-side joins for small data, or pre-computed views.",
    `-- customers with their paid order counts, including customers with none
SELECT c.CustomerId, c.Name, COUNT(o.OrderId) AS OrderCount
FROM dbo.Customers c
LEFT JOIN dbo.Orders o ON o.CustomerId = c.CustomerId AND o.Status = 'PAID'
GROUP BY c.CustomerId, c.Name;`
  ],
  "Indexing": [
    "An index is a sorted structure, usually a B-tree, that lets the database find rows without scanning the whole table. I index the columns used in joins, WHERE and ORDER BY, design composite indexes around the common query shape, and avoid indexing everything because each index slows writes.",
    "A clustered index defines the physical row order (one per table). Nonclustered indexes are separate structures that point to the row. A composite index works for its leftmost prefix. A covering index contains every column a query needs, so the table is not read at all.",
    "Without an index, the database scans every row, which does not scale as tables grow.",
    "Foreign keys, columns in frequent filters and joins, and ORDER BY columns of hot queries.",
    "Low-selectivity columns alone (such as a boolean), tables that are mostly written, and columns wrapped in functions in the WHERE clause, because the index cannot be used.",
    "Order composite columns with equality predicates first and the range column last, use INCLUDE for extra output columns, check the actual plan for seeks versus scans, and drop indexes that are never used.",
    "Pros: much faster reads. Cons: slower writes, extra storage and maintenance, and the optimiser may still choose a scan.",
    "Filtered indexes for a subset, columnstore indexes for analytics, or partitioning for very large tables.",
    `CREATE INDEX IX_Orders_Customer_Date ON dbo.Orders (CustomerId, OrderDate) INCLUDE (TotalAmount);

-- Index-friendly (SARGable): the column is compared directly with a range
SELECT OrderId FROM dbo.Orders
WHERE CustomerId = 42 AND OrderDate >= '2026-01-01' AND OrderDate < '2026-02-01';

-- Index-unfriendly: the function hides the column from the index
-- WHERE YEAR(OrderDate) = 2026`
  ],
  "Stored Procedures": [
    "A stored procedure is a named, precompiled batch of SQL stored in the database and run with EXEC. I use them for multi-step operations that must run as one unit with transactions and error handling, and I keep them set-based and parameterised.",
    "A stored procedure takes input and output parameters, can run several statements, can control transactions, and can handle errors with TRY and CATCH. Callers need only the EXEC permission, not table access.",
    "They reduce network round trips, keep a multi-step change in one transaction, enforce a consistent access path, and protect against SQL injection when parameters are used.",
    "Multi-step writes that need one transaction, batch jobs, and reporting queries shared by several services.",
    "Do not put complex business logic or large loops in procedures, because they are hard to test, version and scale. Avoid dynamic SQL built from strings.",
    "Use SET NOCOUNT ON, validate inputs, wrap writes in BEGIN TRANSACTION inside TRY, roll back in CATCH and rethrow, and keep the procedure set-based rather than row by row.",
    "Pros: one round trip, transactional, secure and reusable. Cons: harder to unit test, deployment is coupled to the database, and plan caching can cause parameter sniffing.",
    "Application-level transactions with an ORM or repository, or functions for read-only calculations.",
    `CREATE OR ALTER PROCEDURE dbo.PlaceOrder @CustomerId INT, @Amount MONEY, @OrderId INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.Orders (CustomerId, TotalAmount, OrderDate)
    VALUES (@CustomerId, @Amount, SYSUTCDATETIME());
    SET @OrderId = SCOPE_IDENTITY();
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END;`
  ],
  "Triggers": [
    "A trigger is code that runs automatically when rows are inserted, updated or deleted. I use triggers sparingly, mainly for audit trails and enforcing rules that must hold whatever application writes the data, because they add hidden side effects.",
    "In SQL Server, AFTER and INSTEAD OF triggers fire per statement and expose the inserted and deleted pseudo tables. PostgreSQL triggers are row or statement level and use NEW and OLD inside a trigger function.",
    "Some rules must apply to every writer, including batch scripts and other services, which application code cannot guarantee.",
    "Audit logging, maintaining denormalised summaries, and rules that cannot be expressed as constraints.",
    "Do not hide business workflows or cross-service calls in triggers, and avoid triggers on bulk-load tables where they slow every row.",
    "Write the trigger set-based using inserted and deleted joins, keep it short, avoid calling other triggers in a chain, document it, and test with multi-row updates.",
    "Pros: enforced everywhere and cannot be bypassed by a forgetful caller. Cons: hidden logic, harder debugging, slower bulk writes, and recursion risk.",
    "Constraints and computed columns, application-level auditing, or change data capture (CDC).",
    `CREATE OR ALTER TRIGGER dbo.trg_Orders_Audit ON dbo.Orders
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.OrderAudit (OrderId, OldStatus, NewStatus, ChangedAt)
  SELECT d.OrderId, d.Status, i.Status, SYSUTCDATETIME()
  FROM inserted i
  JOIN deleted d ON d.OrderId = i.OrderId
  WHERE i.Status <> d.Status;
END;`
  ]
};
