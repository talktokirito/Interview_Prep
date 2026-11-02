// Continuation of database-answers.js: JPA and Hibernate.
// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
Object.assign(SERVICE_ANSWERS, {
  "Entity Lifecycle and Persistence Context": [
    "Entities are transient (new), managed (tracked by the persistence context), detached (no longer tracked) or removed. The persistence context is the first-level cache and unit of work: it guarantees one instance per id, tracks changes and flushes them at commit.",
    "persist makes an entity managed, find loads one into the context, merge copies detached state onto a managed instance, and remove schedules deletion. The context flushes SQL at commit or before queries.",
    "Understanding the lifecycle explains surprising behaviour such as updates without save, LazyInitializationException and stale data.",
    "Know it when debugging Hibernate behaviour, designing transaction boundaries and explaining why save is often unnecessary inside a transaction.",
    "Avoid keeping the persistence context open for long conversations or loading huge numbers of entities into one context.",
    "Keep transactions in the service layer, modify managed entities and let dirty checking write them, use merge only for detached input, and clear or detach in batch jobs.",
    "Pros: transparent change tracking and identity guarantees. Cons: hidden SQL and memory growth with large contexts.",
    "Alternatives are JDBC or jOOQ with explicit SQL, and stateless sessions for bulk work.",
    `@Transactional
public void rename(Long id, String name) {
    Customer c = em.find(Customer.class, id);   // managed
    c.setName(name);                            // no save() needed
}                                               // flush + UPDATE at commit`
  ],
  "Lazy vs Eager Loading": [
    "Lazy loading defers loading associations until accessed (proxies), eager loads them immediately with the owner. Default to lazy, fetch what you need per use case with join fetch or entity graphs, and beware LazyInitializationException outside a transaction.",
    "JPA defaults: @OneToMany and @ManyToMany are lazy, @ManyToOne and @OneToOne are eager. Lazy associations are proxies or collections that load on first access inside an open session.",
    "Eager loading everywhere pulls large object graphs unnecessarily, while naive lazy loading triggers extra queries and errors outside the session.",
    "Use lazy by default and explicit fetch strategies in queries for the use case.",
    "Avoid EAGER on collections and global eager mappings, and avoid relying on open-session-in-view to hide lazy access.",
    "Mark associations LAZY (including @ManyToOne), use JOIN FETCH or @EntityGraph in the repository method that needs the data, or project to DTOs.",
    "Pros: efficient loading when used well. Cons: LazyInitializationException and N+1 risk when misused.",
    "Alternatives are DTO projections, separate queries per use case and batch fetching.",
    `@ManyToOne(fetch = FetchType.LAZY)
private Customer customer;

@Query("select o from Order o join fetch o.items where o.id = :id")
Optional<Order> findWithItems(Long id);

@EntityGraph(attributePaths = "customer")
List<Order> findByStatus(Status status);`
  ],
  "N+1 Select Problem": [
    "The N+1 problem is one query to load N parents and then N extra queries to load each one's lazy association, causing huge query counts. Detect it by counting queries per request and fix it with join fetch, entity graphs, batch fetching or DTO projections.",
    "Iterating over orders and touching order.getItems() triggers a separate select per order when the collection is lazy.",
    "It turns a single fast query into hundreds, which kills latency and the database under load.",
    "Look for it in any list endpoint or loop touching associations, and in tests with query counters.",
    "Do not fix it by making everything eager, which creates other problems, and do not join fetch multiple collections in one query (Cartesian explosion or MultipleBagFetchException).",
    "Use JOIN FETCH or @EntityGraph for the needed association, @BatchSize or default_batch_fetch_size for several collections, DTO projections for read models, and assert query counts in tests.",
    "Pros of fixing: orders of magnitude fewer queries. Cons: per-use-case fetch tuning and join size trade-offs.",
    "Alternatives are separate queries with IN clauses, caching and read models.",
    `// N+1: 1 query for orders + N queries for items
List<Order> orders = orderRepository.findAll();
orders.forEach(o -> o.getItems().size());

// Fix 1: fetch join
@Query("select distinct o from Order o join fetch o.items")
List<Order> findAllWithItems();

// Fix 2: batch fetching (application.properties)
// spring.jpa.properties.hibernate.default_batch_fetch_size=50`
  ],
  "First and Second Level Cache": [
    "The first-level cache is the per-session persistence context and is always on; the second-level cache is shared across sessions (Ehcache, Caffeine through JCache) and is opt-in per entity, with a separate query cache. Use L2 only for read-mostly data, and mind invalidation across nodes.",
    "L1 guarantees repeated find calls in one transaction return the same instance without another query. L2 stores entity state by id across sessions and invalidates on updates made through Hibernate.",
    "Reducing repeated database reads for stable reference data improves latency and load.",
    "Use L2 for reference data such as countries and configuration, with sensible TTL and region settings.",
    "Avoid L2 for frequently updated entities or in clusters without a coherent invalidation strategy, and avoid expecting it to cache arbitrary queries.",
    "Enable the cache provider, annotate entities with @Cache and a concurrency strategy, set expiry, monitor hit ratios, and prefer an application-level cache for fine control.",
    "Pros: fewer database hits. Cons: stale data, memory use, cluster invalidation complexity and bulk updates bypassing it.",
    "Alternatives are Spring Cache with Caffeine or Redis, database caching and read replicas.",
    `@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
public class Country { ... }

// spring.jpa.properties.hibernate.cache.use_second_level_cache=true
// spring.jpa.properties.hibernate.cache.region.factory_class=jcache`
  ],
  "Association Mappings and Owning Side": [
    "In a bidirectional association the owning side holds the foreign key and controls persistence, while the inverse side uses mappedBy. Keep both sides in sync with helper methods, prefer unidirectional or ManyToOne where possible, and use Set for ManyToMany.",
    "@ManyToOne is the owning side of a one-to-many pair, since the FK is in the many table. @OneToMany(mappedBy = ...) is inverse. @ManyToMany uses a join table, with one side owning it.",
    "Mapping errors produce extra join tables, missing foreign key updates or stale in-memory graphs.",
    "Use it when modelling relationships and reviewing entity mappings.",
    "Avoid bidirectional associations without need, cascading REMOVE on ManyToMany, and unidirectional @OneToMany without @JoinColumn, which generates extra join tables and statements.",
    "Make the many side own the relation, add addItem and removeItem helpers that set both sides, use fetch LAZY, and exclude associations from toString and equals.",
    "Pros: navigable object model. Cons: synchronisation burden and performance pitfalls with large collections.",
    "Alternatives are unidirectional mappings with repository queries and modelling relationships by id references in aggregates.",
    `@Entity class Order {
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    void addItem(OrderItem item) { items.add(item); item.setOrder(this); }   // keep both sides in sync
}
@Entity class OrderItem {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "order_id")
    private Order order;                                                      // owning side (FK)
}`
  ],
  "Optimistic Locking with @Version": [
    "A @Version field makes Hibernate add a version check to updates, throwing OptimisticLockException if another transaction changed the row, which prevents lost updates without database locks. Handle the exception with a retry or by informing the user.",
    "Hibernate increments the version on each update and issues UPDATE ... WHERE id = ? AND version = ?. If zero rows match, someone else updated first.",
    "Without it the last writer silently overwrites earlier changes, a lost update.",
    "Use it on entities edited concurrently, such as orders and profiles, particularly across user think time in web forms.",
    "Avoid it for hot rows with constant contention, where retries storm; use atomic updates or pessimistic locks there.",
    "Add @Version Long version, catch ObjectOptimisticLockingFailureException, retry the unit of work or return 409 Conflict, and include the version in DTOs for cross-request protection.",
    "Pros: no locks, scalable. Cons: conflicts surface as exceptions, and retry logic is required.",
    "Alternatives are pessimistic locking, atomic SQL updates and serializable isolation.",
    `@Entity
public class Account {
    @Id Long id;
    long balance;
    @Version Long version;      // incremented on every update
}
// concurrent update -> ObjectOptimisticLockingFailureException`
  ],
  "Open Session in View": [
    "Open Session in View keeps the Hibernate session open for the whole web request so lazy loading works in controllers and views. Spring Boot enables it by default, but it hides N+1 queries and holds connections longer, so most teams disable it and use DTOs.",
    "An interceptor or filter binds an EntityManager to the request thread until the response is rendered. Lazy associations can then load anywhere, including serialisation.",
    "It prevents LazyInitializationException in simple apps without explicit fetching.",
    "Acceptable in small server-rendered applications or prototypes.",
    "Avoid it in APIs and larger systems: queries happen outside transaction boundaries, connections are held during rendering and performance problems stay hidden.",
    "Set spring.jpa.open-in-view=false, fetch what you need in the service layer using fetch joins or projections, and map entities to DTOs before leaving the transaction.",
    "Pros: convenience. Cons: hidden queries, longer connection holding and blurred layer boundaries.",
    "Alternatives are explicit fetching, DTO projections and entity graphs.",
    `# application.properties
spring.jpa.open-in-view=false`
  ],
  "Cascade and orphanRemoval": [
    "Cascade propagates operations (persist, merge, remove) from a parent to its associated entities, and orphanRemoval deletes children removed from the parent collection. Use them only for true parent-owned children, such as order items, and never cascade REMOVE across shared entities.",
    "CascadeType.ALL combines persist, merge, remove, refresh and detach. orphanRemoval = true deletes a child when it is removed from the parent's collection or its reference is nulled.",
    "Managing children manually with explicit saves and deletes is repetitive and error-prone.",
    "Use it for composition relationships where the child cannot exist without the parent.",
    "Avoid cascading across independent aggregates, on @ManyToMany with REMOVE (deletes shared rows), and orphanRemoval with collections replaced wholesale.",
    "Apply cascade only on the parent side of owned collections, modify the collection in place using helper methods, and test deletion behaviour.",
    "Pros: simple lifecycle management. Cons: accidental deletes and unexpected extra statements.",
    "Alternatives are explicit repository calls and database-level ON DELETE CASCADE."
  ],
  "Inheritance Mapping Strategies": [
    "JPA offers SINGLE_TABLE (one table with a discriminator, fast but nullable columns), JOINED (a table per class with joins, normalised) and TABLE_PER_CLASS (separate tables, awkward polymorphic queries), plus @MappedSuperclass for shared fields. SINGLE_TABLE or JOINED is typical.",
    "SINGLE_TABLE stores all subclasses in one table. JOINED stores common fields in a base table and subclass fields in child tables joined by key. @MappedSuperclass shares mapping without a polymorphic entity.",
    "Object hierarchies must be mapped to relational tables with different trade-offs in speed, integrity and storage.",
    "Use SINGLE_TABLE for performance with few subclass columns, JOINED for integrity with many subclass-specific fields, and @MappedSuperclass for audit fields.",
    "Avoid TABLE_PER_CLASS with polymorphic queries and deep hierarchies, which are slow and complex.",
    "Annotate the root with @Inheritance(strategy = ...), define @DiscriminatorColumn when needed, and consider composition instead of deep inheritance in the domain.",
    "Pros: model reuse. Cons: query complexity, nullable columns or joins, and rigid hierarchies.",
    "Alternatives are composition with separate tables and JSON columns for variant data.",
    `@MappedSuperclass
abstract class Auditable { Instant createdAt; Instant updatedAt; }

@Entity @Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type")
abstract class Payment extends Auditable { @Id Long id; BigDecimal amount; }
@Entity @DiscriminatorValue("CARD") class CardPayment extends Payment { String last4; }`
  ],
  "Entity equals and hashCode": [
    "Entity equality is tricky: using a generated id fails before persist and changes hash codes, while default identity breaks with detached copies. Use a stable business key when one exists, or id-based equals with a constant hashCode, and avoid Lombok @Data and associations in equals.",
    "Hibernate proxies subclass entities, so getClass comparisons can fail, and ids are null until the entity is saved. Sets and maps use hashCode and need stability.",
    "Poor implementations cause entities to vanish from HashSets, duplicate in collections or trigger lazy loading inside equals.",
    "Know it when entities are placed in Sets or compared across sessions.",
    "Avoid including mutable fields, lazy associations or the generated id (without null handling) in hashCode.",
    "Implement equals using instanceof with a natural key or non-null id, return a constant hashCode such as getClass().hashCode(), and never call lazy collections inside.",
    "Pros: predictable collection behaviour. Cons: subtle and a constant hashCode reduces hash performance for huge sets.",
    "Alternatives are comparing by id in code, using Lists, or using UUIDs assigned at construction.",
    `@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Customer other)) return false;      // works with proxies
    return id != null && id.equals(other.id);
}
@Override public int hashCode() { return getClass().hashCode(); }  // stable across persist`
  ],
  "Dirty Checking and Flush Modes": [
    "Hibernate keeps a snapshot of each managed entity and, at flush time, compares it to detect changes and generate UPDATEs, so no explicit save is needed inside a transaction. Flush happens before queries in AUTO mode and at commit, and bulk JPQL updates bypass the persistence context.",
    "FlushModeType.AUTO flushes before queries that might be affected and at commit. COMMIT flushes only at commit. Bulk update and delete statements run directly on the database without updating managed entities.",
    "Developers are often surprised by automatic updates or stale entities after bulk operations.",
    "Know it when debugging unexpected updates, performance with many managed entities and ordering of statements.",
    "Avoid bulk updates mixed with managed entities in the same context without clearing it, and avoid loading huge numbers of entities just to update them.",
    "Use read-only transactions or projections for reads, clear the context after bulk operations, use @DynamicUpdate for wide tables if needed, and call flush explicitly only when ordering matters.",
    "Pros: automatic change tracking. Cons: snapshot memory and CPU cost, and hidden writes.",
    "Alternatives are explicit update statements, stateless sessions and JdbcTemplate for bulk changes.",
    `@Transactional
void raisePrices() {
    List<Product> products = repo.findAll();
    products.forEach(p -> p.setPrice(p.getPrice().multiply(BigDecimal.valueOf(1.1))));
}   // UPDATE statements issued automatically at flush

@Modifying(clearAutomatically = true)
@Query("update Product p set p.price = p.price * 1.1")   // bulk: bypasses the context
int raiseAll();`
  ],
  "JPQL, Criteria and Native Queries": [
    "JPQL queries entities in an object-oriented, database-independent way, Criteria and Specifications build queries programmatically and type-safely, and native SQL gives full database power. Choose JPQL for most queries, Criteria for dynamic filters and native SQL for database-specific features and reports.",
    "JPQL refers to entity names and fields. The Criteria API builds a query object tree. Native queries run SQL directly and can map to entities or DTOs.",
    "Different queries need different trade-offs among portability, dynamism and expressiveness.",
    "Use derived queries for simple cases, @Query JPQL for custom, Specifications for dynamic search, and native SQL for window functions, CTEs and tuning.",
    "Avoid string concatenation for dynamic JPQL, and avoid native SQL when portability matters unless wrapped.",
    "Use named parameters, Spring Data Specifications or QueryDSL for dynamic criteria, and map native results with projections or @SqlResultSetMapping.",
    "Pros: flexibility at each level. Cons: JPQL has limited SQL features, Criteria is verbose and native queries bind you to a database.",
    "Alternatives are jOOQ, QueryDSL and MyBatis.",
    `@Query("select o from Order o where o.status = :status and o.total > :min")
List<Order> findBig(@Param("status") Status status, @Param("min") BigDecimal min);

Specification<Order> spec = (root, q, cb) -> cb.equal(root.get("status"), Status.PAID);
orderRepository.findAll(spec, PageRequest.of(0, 20));

@Query(value = "select * from orders where ... ", nativeQuery = true)
List<Order> reportQuery();`
  ],
  "Projections and DTO Queries": [
    "Projections load only the columns you need into interfaces, records or DTOs instead of full entities, which avoids loading unneeded data and lazy-loading problems. Use them for read-only list and report endpoints.",
    "Spring Data supports interface-based (closed) projections, class or record based DTO projections, and dynamic projections. JPQL constructor expressions and native queries can fill DTOs directly.",
    "Loading full entities for list views wastes memory, triggers N+1 queries and exposes more than needed.",
    "Use them for read-heavy endpoints, searches, reports and any query where entity behaviour is not needed.",
    "Avoid them for write flows that need managed entities and dirty checking, and avoid open projections that load the entity anyway.",
    "Declare an interface with getters or a record and return it from the repository method, or use select new com.app.OrderSummary(...) in JPQL.",
    "Pros: efficient, decoupled read models. Cons: more types and mapping for different views.",
    "Alternatives are full entities with entity graphs, jOOQ and CQRS read models.",
    `public record OrderSummary(Long id, String customerName, BigDecimal total) {}

@Query("select new com.app.OrderSummary(o.id, c.name, o.total) from Order o join o.customer c")
List<OrderSummary> summaries();

interface OrderView { Long getId(); BigDecimal getTotal(); }   // interface projection
List<OrderView> findByStatus(Status s);`
  ],
  "ID Generation Strategies": [
    "IDENTITY relies on auto-increment columns but disables JDBC batching, SEQUENCE preallocates ids in blocks (allocationSize) and keeps batching, and UUIDs avoid central coordination at the cost of index locality. Prefer SEQUENCE on databases that support it.",
    "GenerationType.IDENTITY needs an insert to obtain the id. SEQUENCE asks the database for the next value, with pooled optimisers reducing round trips. UUIDs can be assigned in the application.",
    "The generation strategy affects insert performance, batching and sharding.",
    "Use SEQUENCE for most relational cases, UUID or time-ordered ids (UUIDv7, ULID) for distributed generation, and IDENTITY for simple or MySQL setups.",
    "Avoid IDENTITY for bulk-insert workloads and random UUIDv4 primary keys in clustered indexes for large tables.",
    "Use @GeneratedValue(strategy = SEQUENCE) with @SequenceGenerator and a matching allocationSize and database increment, and consider time-ordered UUIDs.",
    "Pros: tuned ids for the workload. Cons: strategy-specific limitations and sequence gaps.",
    "Alternatives are application-assigned natural keys, Snowflake ids and database-specific generators.",
    `@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
@SequenceGenerator(name = "order_seq", sequenceName = "order_seq", allocationSize = 50)
private Long id;`
  ],
  "Hibernate Batch Processing": [
    "For large writes, enable hibernate.jdbc.batch_size and order_inserts, avoid IDENTITY, and flush and clear the persistence context every batch to prevent memory growth. For huge volumes use StatelessSession or JDBC.",
    "Hibernate groups statements into JDBC batches when configured and when the id strategy allows. The persistence context otherwise retains every entity in memory.",
    "Saving thousands of entities in one transaction gets slow and eventually runs out of memory.",
    "Use it for imports, migrations and nightly jobs processing many entities.",
    "Avoid saveAll on huge lists without batching or clearing, and avoid mixing batching with IDENTITY ids or cascades that break grouping.",
    "Set the batch size property, loop with a counter, flush and clear every N entities, keep transactions chunked, and consider Spring Batch for restartability.",
    "Pros: much faster and bounded memory. Cons: more complex code and error handling per chunk.",
    "Alternatives are JdbcTemplate batch updates, COPY loaders and Spring Batch.",
    `// spring.jpa.properties.hibernate.jdbc.batch_size=50
// spring.jpa.properties.hibernate.order_inserts=true
for (int i = 0; i < entities.size(); i++) {
    em.persist(entities.get(i));
    if (i % 50 == 0) { em.flush(); em.clear(); }   // release memory, send the batch
}`
  ],
  "Auditing and Soft Delete": [
    "Spring Data auditing fills createdAt, updatedAt and user fields automatically, and soft delete marks rows as deleted instead of removing them using Hibernate annotations. Both need discipline: filter deleted rows everywhere and think about unique constraints and data retention.",
    "@EnableJpaAuditing with @CreatedDate, @LastModifiedDate and an AuditorAware bean populate fields. Soft delete uses @SQLDelete to turn deletes into updates and a restriction filter to hide deleted rows.",
    "Teams need to know who changed what and when, and sometimes must retain or recover deleted data.",
    "Use auditing for most business entities, and soft delete where recovery or legal retention matters.",
    "Avoid soft delete when data must truly be erased (privacy rules) or where unique constraints will clash with deleted rows without partial indexes.",
    "Add an auditing base class with @EntityListeners(AuditingEntityListener.class), configure AuditorAware from the security context, and add partial unique indexes that include the deleted flag.",
    "Pros: traceability and recoverability. Cons: query filter complexity, growth of data and privacy considerations.",
    "Alternatives are Hibernate Envers for history, database triggers and event sourcing.",
    `@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
abstract class Auditable {
    @CreatedDate Instant createdAt;
    @LastModifiedDate Instant updatedAt;
    @CreatedBy String createdBy;
}
@Entity
@SQLDelete(sql = "UPDATE customer SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")
class Customer extends Auditable { ... }`
  ],
  "JPA vs Hibernate vs Spring Data": [
    "JPA is the specification, Hibernate is the most common implementation with extra features, and Spring Data JPA is a repository abstraction on top that generates queries and DAOs. Spring Data uses JPA, which uses Hibernate underneath.",
    "JPA defines annotations and EntityManager APIs. Hibernate implements them and adds extras such as @BatchSize and Envers. Spring Data JPA provides repository interfaces, derived queries and pagination.",
    "A standard API avoids vendor lock-in, and repositories remove DAO boilerplate.",
    "Use Spring Data JPA for most CRUD, Hibernate-specific features where needed, and EntityManager directly for complex or bulk operations.",
    "Avoid treating Spring Data as magic: know the SQL it generates and the entity lifecycle underneath.",
    "Use repositories for common cases, inject EntityManager for custom logic, enable SQL logging and statistics in development, and use Hibernate extensions deliberately.",
    "Pros: productivity and portability. Cons: leaky abstractions, hidden SQL and performance pitfalls.",
    "Alternatives are jOOQ, MyBatis, Spring Data JDBC and JdbcClient."
  ],
  "Multi-tenancy": [
    "Multi-tenancy serves several customers from one application using separate databases, separate schemas or a shared schema with a tenant discriminator column. Choose based on isolation, cost and operational effort, and enforce tenant filtering centrally.",
    "Hibernate supports schema and database multi-tenancy with a tenant identifier resolver and connection provider, and discriminator-based approaches with filters.",
    "SaaS products need to isolate customer data while sharing infrastructure to control cost.",
    "Use database-per-tenant for strong isolation and compliance, schema-per-tenant for balance, and shared schema for many small tenants.",
    "Avoid ad hoc tenant filtering scattered in queries, which risks data leaks, and avoid thousands of schemas without an operational plan.",
    "Resolve the tenant from the request or token, route the connection or schema through Hibernate's multi-tenancy hooks, add tenant ids to every table in shared schemas, and test cross-tenant isolation.",
    "Pros: cost efficiency and scalability. Cons: complexity, noisy neighbours and migration management across tenants.",
    "Alternatives are separate deployments per tenant and row-level security in the database."
  ],
  "Hibernate Envers": [
    "Envers automatically keeps a history of entity changes by writing revisions to audit tables, enabling queries such as what did this record look like last month. It adds storage and write cost and suits audit requirements, not high-volume data.",
    "Annotating an entity with @Audited creates a mirror table plus a revision table. Each commit records a revision number, timestamp and change type, and the AuditReader queries history.",
    "Compliance and debugging need a reliable change history without hand-written audit code.",
    "Use it for regulated data, important business entities and when point-in-time views are required.",
    "Avoid it for high-write tables, large blobs or when events are already the source of truth.",
    "Add the hibernate-envers dependency, annotate entities with @Audited, use AuditReaderFactory to fetch revisions, and archive old audit data.",
    "Pros: automatic history with little code. Cons: storage growth, slower writes and queries across revisions that need care.",
    "Alternatives are Spring Data auditing for who and when only, database temporal tables, event sourcing and triggers."
  ]
});
