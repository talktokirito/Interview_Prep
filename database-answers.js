// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Joins": [
    "Joins combine rows from tables on a condition: inner returns matches only, left outer keeps all left rows, right and full outer keep unmatched rows from one or both sides, and cross produces a Cartesian product. Know them, and know that the optimiser picks nested loop, hash or merge join algorithms.",
    "INNER JOIN keeps matching pairs, LEFT JOIN keeps every left row with NULLs where there is no match, FULL OUTER keeps all rows from both sides, and a self join relates a table to itself. EXISTS and NOT EXISTS express semi and anti joins.",
    "Normalised data lives in several tables, and queries need to combine it efficiently and correctly.",
    "Use inner joins for required relationships, left joins for optional ones, and anti joins to find missing relations.",
    "Avoid unintended Cartesian products from missing join conditions, filtering a left-joined table in WHERE (which turns it into an inner join) and joining on unindexed columns for large tables.",
    "Index the join columns, put filters on the outer table in WHERE and on the optional table in the ON clause, check the plan with EXPLAIN, and prefer EXISTS over IN for correlated checks on large sets.",
    "Pros: flexible and powerful. Cons: expensive on large unindexed tables and easy to get duplicated rows from one-to-many joins.",
    "Alternatives are denormalised tables, application-side joins for small data and materialised views.",
    `-- customers with their order counts, including customers with no orders
SELECT c.id, c.name, COUNT(o.id) AS orders
FROM customer c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'PAID'   -- filter in ON
GROUP BY c.id, c.name;

-- customers who never ordered (anti join)
SELECT c.* FROM customer c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);`
  ],
  "Indexes and B-Trees": [
    "Most indexes are B+trees that keep keys sorted so lookups, ranges and ordering take logarithmic time, at the cost of slower writes and extra storage. Design composite indexes by the leftmost-prefix rule, selectivity and covering queries, and do not index everything.",
    "A B+tree stores keys in sorted order with leaf pages linked for range scans. Clustered indexes define physical row order (InnoDB primary key), secondary indexes point to the row. A covering index contains all needed columns.",
    "Without an index, the database scans the whole table, which does not scale.",
    "Use indexes on foreign keys, columns in WHERE, JOIN and ORDER BY, and composite indexes matching common query patterns.",
    "Avoid indexing low-selectivity columns alone, wrapping indexed columns in functions, leading wildcards in LIKE and too many indexes on write-heavy tables.",
    "Order composite columns by equality first then range, create covering indexes with INCLUDE where supported, check usage with EXPLAIN, and remove unused indexes.",
    "Pros: huge read speed-ups. Cons: write overhead, storage and maintenance, and the optimiser may ignore them.",
    "Alternatives are hash indexes for equality, bitmap indexes, full-text and GIN indexes, partitioning and caching.",
    `-- supports WHERE customer_id = ? AND created_at > ? ORDER BY created_at
CREATE INDEX idx_orders_customer_created ON orders (customer_id, created_at);

-- index cannot be used: function on the column
SELECT * FROM orders WHERE DATE(created_at) = '2025-01-01';
-- rewrite as a range
SELECT * FROM orders WHERE created_at >= '2025-01-01' AND created_at < '2025-01-02';`
  ],
  "Execution Plans and Query Tuning": [
    "Use EXPLAIN (ANALYZE) to see the plan: scan types, join algorithms, estimated versus actual rows and costs. Tune by adding or fixing indexes, rewriting queries, updating statistics and reducing data early, always measuring before and after.",
    "The optimiser estimates cost from table statistics and chooses among sequential scans, index scans and join orders. Big gaps between estimated and actual rows point to stale statistics or correlated columns.",
    "Slow queries are a top cause of production incidents, and guessing at fixes wastes time.",
    "Use it whenever a query is slow, after schema changes, and when reviewing queries on large tables.",
    "Avoid tuning from the plan of tiny test data, or adding indexes without checking write costs.",
    "Run EXPLAIN ANALYZE on production-like data, look for sequential scans on big tables, sorts spilling to disk and nested loops with many rows, update statistics (ANALYZE), and select only needed columns.",
    "Pros: evidence-based tuning. Cons: plans vary by data and version, and reading them takes experience.",
    "Alternatives are query hints (sparingly), materialised views, caching and denormalisation.",
    `EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;
-- Index Scan using idx_orders_customer_created ... actual time=0.03..0.05 rows=20
-- vs: Seq Scan on orders ... rows=2000000  (missing index)`
  ],
  "Normalization and Denormalization": [
    "Normalisation removes redundancy by splitting data into related tables (1NF, 2NF, 3NF, BCNF) to avoid update anomalies, while denormalisation deliberately duplicates data to speed up reads. Normalise by default and denormalise measured hot paths.",
    "1NF means atomic values, 2NF removes partial dependency on a composite key, 3NF removes transitive dependencies, and BCNF tightens determinants. Denormalised designs store computed or copied values.",
    "Redundant data gets out of sync and wastes space, but heavy joins on large data can be slow.",
    "Use normalised schemas for transactional systems and denormalise for reporting, read models, caches and NoSQL.",
    "Avoid denormalising without evidence of a bottleneck, and avoid over-normalising into tables joined on every query.",
    "Design to 3NF first, measure, then add duplicated columns, summary tables or materialised views with a clear update mechanism such as triggers or events.",
    "Pros of normalised: consistency and smaller writes. Cons: more joins. Denormalised: faster reads but harder to keep consistent.",
    "Alternatives are materialised views, CQRS read models and document stores."
  ],
  "Pagination: OFFSET vs Keyset": [
    "OFFSET pagination is simple but slows down with deep pages because the database must scan and discard skipped rows and results shift when data changes; keyset (seek) pagination uses the last seen key and stays fast and stable. Use keyset for large or infinite-scroll data.",
    "OFFSET n LIMIT m skips n rows. Keyset uses a condition like WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT m, relying on an index.",
    "Deep OFFSET queries get slower linearly and produce duplicates or gaps when rows are inserted between pages.",
    "Use OFFSET for small admin lists and page-number UIs, keyset for feeds, APIs and large tables.",
    "Avoid keyset when users must jump to arbitrary page numbers, and avoid non-unique sort keys without a tiebreaker.",
    "Sort by a unique, indexed column combination, return a cursor token containing the last values, and use Spring Data's ScrollPosition or custom queries.",
    "Pros of keyset: constant time and stable results. Cons: no random page access and more complex queries.",
    "Alternatives are search-engine pagination with search_after and cached result sets.",
    `-- OFFSET: slow for large offsets
SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET 100000;

-- Keyset: pass the last row's (created_at, id) as the cursor
SELECT * FROM orders
WHERE (created_at, id) < (:lastCreatedAt, :lastId)
ORDER BY created_at DESC, id DESC
LIMIT 20;`
  ],
  "SQL Injection and Prepared Statements": [
    "SQL injection happens when user input is concatenated into SQL; prevent it with parameterised queries (PreparedStatement or ORM parameters), never string building, with least-privilege database accounts and input validation as extra layers.",
    "A prepared statement sends the SQL structure and the parameters separately, so input is always treated as data. ORMs use parameters too, unless you concatenate JPQL or native strings.",
    "Injection lets attackers read, change or delete data, and is among the most common and severe vulnerabilities.",
    "Apply it everywhere queries include external input, including sorting columns and dynamic filters.",
    "Do not rely on escaping or blacklists, and remember that identifiers such as column names cannot be parameterised and must be whitelisted.",
    "Use PreparedStatement with ? placeholders, JPA named parameters, Spring Data derived queries, whitelist sort fields, and give the application user only the permissions it needs.",
    "Pros: complete protection for values and often plan reuse. Cons: dynamic identifiers need separate handling.",
    "Alternatives are stored procedures (still need parameters), query builders such as jOOQ and ORMs with safe APIs.",
    `// Vulnerable
String sql = "SELECT * FROM users WHERE name = '" + name + "'";   // name = ' OR '1'='1

// Safe
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE name = ?");
ps.setString(1, name);

// JPA
em.createQuery("select u from User u where u.name = :name", User.class)
  .setParameter("name", name);`
  ],
  "GROUP BY, HAVING and Aggregation": [
    "GROUP BY groups rows to compute aggregates (COUNT, SUM, AVG, MIN, MAX), WHERE filters rows before grouping and HAVING filters groups after aggregation. Every selected column must be grouped or aggregated.",
    "Aggregates collapse rows per group. COUNT(*) counts rows, COUNT(col) ignores NULLs, and DISTINCT can be used inside aggregates. ROLLUP and GROUPING SETS add subtotals.",
    "Reports and analytics need summaries of data rather than raw rows.",
    "Use it for totals, counts per category, and filtering groups such as customers with more than five orders.",
    "Avoid putting row-level conditions in HAVING, which is slower, and avoid aggregating huge data without supporting indexes or pre-aggregation.",
    "Filter early with WHERE, group by indexed columns where possible, use HAVING only for aggregate conditions, and consider summary tables for heavy reports.",
    "Pros: concise analytics. Cons: can be expensive on large tables and easily misread with NULLs and duplicates.",
    "Alternatives are window functions, materialised views and analytic databases.",
    `SELECT customer_id, COUNT(*) AS orders, SUM(total) AS revenue
FROM orders
WHERE status = 'PAID'                  -- row filter first
GROUP BY customer_id
HAVING COUNT(*) > 5                    -- group filter
ORDER BY revenue DESC;`
  ],
  "Window Functions": [
    "Window functions compute values across a set of related rows without collapsing them, using OVER with PARTITION BY and ORDER BY: ROW_NUMBER, RANK, LAG, LEAD and running totals. They solve top-N per group and running aggregates cleanly.",
    "A window defines partition, ordering and frame. ROW_NUMBER assigns a unique sequence, RANK leaves gaps on ties, DENSE_RANK does not, and SUM OVER with an ordered frame gives running totals.",
    "GROUP BY loses row detail, and self joins or correlated subqueries for rankings are slow and awkward.",
    "Use it for top-N per group, running totals, moving averages, deduplication and comparing a row with the previous one.",
    "Avoid it where a simple aggregate suffices, and be aware windows are computed after WHERE and cannot be filtered in the same query level.",
    "Wrap the windowed query in a subquery or CTE and filter on the computed rank, and add indexes matching PARTITION BY and ORDER BY.",
    "Pros: expressive and often faster than alternatives. Cons: syntax learning curve and memory use for large partitions.",
    "Alternatives are correlated subqueries, self joins and application-side processing.",
    `-- latest order per customer
SELECT * FROM (
  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
  FROM orders o
) t WHERE rn = 1;

-- running total
SELECT created_at, total, SUM(total) OVER (ORDER BY created_at) AS running FROM orders;`
  ],
  "Subqueries and CTEs": [
    "Subqueries nest a query inside another, and CTEs (WITH) name intermediate results for readability and recursion. Correlated subqueries run per outer row and can be slow, so prefer joins or EXISTS where suitable.",
    "A scalar subquery returns one value, an IN subquery a set, and EXISTS tests for rows. A recursive CTE walks hierarchies such as org charts. Some databases inline CTEs, others materialise them.",
    "Complex queries become unreadable without structure, and hierarchical data needs recursion.",
    "Use CTEs to break complex queries into steps, recursive CTEs for trees, and EXISTS for existence checks.",
    "Avoid correlated subqueries on large tables when a join is possible, and do not assume CTEs are optimisation fences; behaviour depends on the database.",
    "Name each step clearly, check the plan, use EXISTS instead of IN for large correlated sets, and add depth limits to recursive CTEs.",
    "Pros: readability and recursion. Cons: possible performance pitfalls and database-specific behaviour.",
    "Alternatives are temporary tables, views and joins.",
    `WITH RECURSIVE reports AS (
  SELECT id, manager_id, name, 1 AS depth FROM employee WHERE id = 1
  UNION ALL
  SELECT e.id, e.manager_id, e.name, r.depth + 1
  FROM employee e JOIN reports r ON e.manager_id = r.id
)
SELECT * FROM reports;`
  ],
  "Constraints and Keys": [
    "Constraints enforce data integrity in the database: primary key, foreign key, unique, not null and check. Let the database guarantee invariants, since application checks alone fail under concurrency.",
    "A primary key uniquely identifies rows, a foreign key enforces references, unique prevents duplicates, and check enforces conditions. Surrogate keys are generated ids, natural keys come from the domain.",
    "Applications and bugs can write bad data, and race conditions defeat check-then-insert logic.",
    "Use them on every table, including unique constraints for business uniqueness and foreign keys for relationships.",
    "Avoid skipping foreign keys for convenience, or relying on natural keys that may change.",
    "Declare constraints in migrations, index foreign keys, choose ON DELETE behaviour deliberately, and handle constraint violations as expected domain errors.",
    "Pros: guaranteed integrity. Cons: slight write overhead and stricter migrations.",
    "Alternatives are application-level validation (additional, not a replacement) and NoSQL stores with looser guarantees."
  ],

  "ACID Properties": [
    "ACID means Atomicity (all or nothing), Consistency (valid state to valid state), Isolation (concurrent transactions do not interfere improperly) and Durability (committed data survives crashes). Relational databases guarantee them through logging, locking and MVCC.",
    "Atomicity uses undo or rollback, durability uses write-ahead logs flushed to disk, isolation uses locks or snapshots according to the isolation level, and consistency relies on constraints and application rules.",
    "Business operations such as transfers must not leave data half-updated or lose committed changes.",
    "Relevant whenever correctness matters, in financial, inventory and order systems, and when comparing databases with BASE systems.",
    "Avoid assuming full isolation by default; the default isolation level is often weaker than serializable.",
    "Wrap related changes in one transaction, keep transactions short, choose an appropriate isolation level and design for retry on conflicts.",
    "Pros: strong correctness. Cons: cost in throughput and scalability, especially across nodes.",
    "Alternatives are BASE and eventual consistency with sagas for distributed systems."
  ],
  "Isolation Levels and Anomalies": [
    "Isolation levels trade consistency for concurrency: read uncommitted, read committed, repeatable read and serializable, preventing dirty reads, non-repeatable reads and phantoms progressively. Defaults differ: PostgreSQL uses read committed, MySQL InnoDB uses repeatable read.",
    "Dirty read sees uncommitted data, non-repeatable read sees changed values on re-read, phantom read sees new rows matching a query, and write skew occurs when two transactions make decisions on overlapping reads. Snapshot-based databases handle some of these differently.",
    "Concurrent transactions can otherwise produce results that no serial order could.",
    "Know it for explaining bugs such as lost updates and double booking and for choosing levels per use case.",
    "Avoid serializable everywhere by default because of contention and retries, and avoid relying on weaker levels for invariants spanning rows.",
    "Use read committed for general work, add optimistic locking or SELECT FOR UPDATE for conflicting updates, use serializable with retry for strict invariants, and test concurrency scenarios.",
    "Pros: tunable correctness versus performance. Cons: subtle behaviour differences across databases.",
    "Alternatives are application-level locking, unique constraints and optimistic versioning.",
    `Level               Dirty  Non-repeatable  Phantom
READ UNCOMMITTED    yes    yes             yes
READ COMMITTED      no     yes             yes
REPEATABLE READ     no     no              yes (no in PostgreSQL / InnoDB gap locks)
SERIALIZABLE        no     no              no

@Transactional(isolation = Isolation.REPEATABLE_READ)`
  ],
  "Optimistic vs Pessimistic Locking": [
    "Optimistic locking assumes conflicts are rare, uses a version column and fails the update if the row changed (retry on failure), while pessimistic locking locks rows up front with SELECT FOR UPDATE. Use optimistic for low contention and pessimistic for high contention or critical sections.",
    "Optimistic: UPDATE ... WHERE id = ? AND version = ? and check the affected rows. Pessimistic: the database holds a row lock until commit, blocking other writers.",
    "Concurrent updates to the same row cause lost updates unless detected or prevented.",
    "Use optimistic locking with @Version for typical web applications, and pessimistic locks for hot rows such as inventory counters or queue claiming with SKIP LOCKED.",
    "Avoid optimistic locking under heavy conflict, where retries storm, and pessimistic locking with long transactions, which cause blocking and deadlocks.",
    "Add @Version in JPA and handle OptimisticLockException with retries, use LockModeType.PESSIMISTIC_WRITE or FOR UPDATE with short transactions, and consistent lock order.",
    "Pros of optimistic: no locks, scalable. Cons: retries. Pessimistic: simple correctness but contention and deadlocks.",
    "Alternatives are atomic updates (UPDATE stock SET qty = qty - 1 WHERE qty > 0), serializable isolation and queues.",
    `-- optimistic
UPDATE account SET balance = :b, version = version + 1 WHERE id = :id AND version = :v;

-- pessimistic: claim jobs without blocking other workers
SELECT * FROM job WHERE status = 'NEW' ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED;`
  ],
  "Database Deadlocks": [
    "A database deadlock occurs when transactions hold locks the other needs; the database detects it and aborts one with an error, so applications must retry. Prevent it with consistent access order, short transactions and appropriate indexes.",
    "For example, transaction A updates row 1 then row 2 while B updates row 2 then row 1. The engine's detector picks a victim and rolls it back.",
    "Concurrent updates that touch rows in different orders are common in real systems.",
    "Know it when seeing deadlock errors in logs, especially under load and with bulk updates.",
    "Do not ignore the error or retry endlessly without backoff, and avoid long transactions holding locks across remote calls.",
    "Access rows in a consistent order, keep transactions short, add indexes so updates lock fewer rows, lower isolation if appropriate, and retry with a limit on deadlock exceptions.",
    "Pros of detection: the system recovers automatically. Cons: aborted work must be retried.",
    "Alternatives are optimistic locking, queues that serialise conflicting work and single-writer designs."
  ],
  "MVCC": [
    "MVCC keeps multiple versions of rows so readers see a consistent snapshot without blocking writers, and writers do not block readers. It underpins PostgreSQL, InnoDB and Oracle, at the cost of cleaning up old versions (vacuum or undo purge).",
    "Each transaction sees data as of its snapshot. Updates create new row versions, and old versions are removed when no snapshot needs them.",
    "Lock-based reading makes readers and writers block each other and hurts concurrency.",
    "Know it to explain why long-running transactions cause bloat, why reads rarely block, and how isolation levels are implemented.",
    "Avoid long-lived transactions or idle-in-transaction sessions, which prevent cleanup and bloat tables.",
    "Keep transactions short, monitor autovacuum (PostgreSQL) or history list length (InnoDB), and tune vacuum for write-heavy tables.",
    "Pros: high read concurrency. Cons: storage bloat, cleanup overhead and write skew under snapshot isolation.",
    "Alternatives are lock-based concurrency control and single-version in-memory stores."
  ],

  "Connection Pooling (HikariCP)": [
    "A connection pool reuses database connections because creating them is expensive, and HikariCP is the Spring Boot default. Keep the pool small (often tens, not hundreds), set timeouts, and size it from database capacity rather than request count.",
    "The pool holds open connections, hands them to threads on demand, validates them, and recycles them. Key settings are maximumPoolSize, connectionTimeout, maxLifetime and leakDetectionThreshold.",
    "Opening a connection per request is slow and can overwhelm the database with connections.",
    "Use it in every application using a relational database, and size across all application instances.",
    "Avoid oversized pools, which cause contention inside the database, and avoid holding connections during slow remote calls or long processing.",
    "Set maximumPoolSize from database cores and workload (start around 10), keep maxLifetime below database or firewall timeouts, enable leak detection in testing, and watch pool metrics such as pending threads.",
    "Pros: speed and protection of the database. Cons: pool exhaustion if connections are held too long, and per-instance sizing multiplies in scale-out.",
    "Alternatives are database proxies (PgBouncer, RDS Proxy), per-request connections for rare jobs and virtual threads with limits.",
    `spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      connection-timeout: 3000
      max-lifetime: 1500000        # below the database/firewall idle timeout
      leak-detection-threshold: 20000`
  ],
  "Batch Inserts and Bulk Operations": [
    "Send many rows in few round trips using JDBC batching, multi-row inserts or bulk loaders (COPY), and in Hibernate enable batch_size, order_inserts and avoid IDENTITY generation which disables batching. Round trips, not SQL, are usually the bottleneck.",
    "JDBC addBatch and executeBatch group statements. Some drivers need flags such as reWriteBatchedInserts (PostgreSQL) or rewriteBatchedStatements (MySQL) to rewrite them into multi-row statements.",
    "Row-by-row inserts cost one network round trip each, making large loads very slow.",
    "Use it for imports, migrations, ETL and large saveAll operations.",
    "Avoid loading huge batches into one transaction or the persistence context without flushing and clearing.",
    "Use batches of 500 to 1000, set hibernate.jdbc.batch_size, use sequences instead of IDENTITY, flush and clear the EntityManager periodically, and use JdbcTemplate batchUpdate or COPY for very large loads.",
    "Pros: orders of magnitude faster. Cons: larger transactions, memory use and error handling for partial failures.",
    "Alternatives are bulk loaders (COPY, LOAD DATA), Spring Batch and streaming ETL tools.",
    `jdbcTemplate.batchUpdate(
    "INSERT INTO event (id, payload) VALUES (?, ?)",
    events, 1000,
    (ps, e) -> { ps.setLong(1, e.id()); ps.setString(2, e.payload()); });`
  ]
};
