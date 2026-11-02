// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Monolith vs Microservices vs Modular Monolith": [
    "A monolith is one deployable, microservices are many independently deployable services, and a modular monolith is one deployable with strict internal module boundaries. Start modular, and split into services only when team size, scaling or release independence demands it.",
    "Monoliths are simple to build, test and deploy but scale and release as a unit. Microservices give independent deploys and scaling at the cost of distributed-system complexity. A modular monolith enforces boundaries inside one process.",
    "Choosing too early for microservices brings network failures, data consistency issues and operational overhead, while a tangled monolith slows change.",
    "Use microservices with multiple teams, clear domain boundaries, different scaling needs and mature DevOps. Use a modular monolith for small to mid-size teams or an uncertain domain.",
    "Avoid microservices for small teams, unclear domains or without CI/CD, observability and automation. Avoid a distributed monolith, where services are tightly coupled and deploy together.",
    "Model modules by business capability, enforce boundaries with packages or Spring Modulith and ArchUnit, communicate through interfaces or events, and extract a service when a module needs independent scaling or ownership.",
    "Pros of microservices: independent deployment, scaling, technology freedom. Cons: operational complexity, latency, data consistency, testing difficulty. Monolith: simple but coupled.",
    "Alternatives are serverless functions, service-oriented architecture and a cell-based architecture."
  ],
  "Service Boundaries and Bounded Contexts": [
    "Draw service boundaries around business capabilities and DDD bounded contexts, where a model and language are consistent, not around technical layers or database tables. Good boundaries minimise cross-service calls and shared data.",
    "A bounded context is the scope within which a domain model applies, such as Billing versus Shipping, each with its own definition of Customer. A service typically owns one or a few related contexts.",
    "Wrong boundaries cause chatty calls, distributed transactions and coordinated deployments, which negate the benefits.",
    "Use event storming and domain analysis to find contexts, and check that most changes touch one service.",
    "Avoid splitting by entity (a service per table) or by technical layer, or making services so small that every request crosses many of them.",
    "Identify aggregates and invariants, keep each aggregate and its invariants in one service, share only through APIs and events, and use context maps to describe relationships.",
    "Pros: autonomy and cohesion. Cons: boundaries are hard to get right initially and costly to move later.",
    "Alternatives are starting in a modular monolith to discover boundaries and splitting later."
  ],
  "Domain-Driven Design Essentials": [
    "DDD aligns software with the business through a ubiquitous language, bounded contexts, and tactical building blocks such as entities, value objects, aggregates, repositories and domain events. It is most valuable for complex domains.",
    "Strategic DDD defines contexts and their relationships. Tactical DDD models behaviour: aggregates enforce invariants and are accessed through their root, value objects are immutable, and domain events record facts.",
    "Complex business logic scattered in services and anemic entities becomes hard to change and understand.",
    "Use it for domains with rich rules, such as banking and logistics, and as the basis for microservice boundaries.",
    "Avoid it for simple CRUD applications, where the ceremony adds cost without benefit.",
    "Talk with domain experts, define a glossary, model aggregates small with consistency boundaries, reference other aggregates by id, publish domain events, and keep domain code independent of frameworks.",
    "Pros: shared language and robust models. Cons: learning curve, up-front modelling and overkill for simple systems.",
    "Alternatives are transaction scripts and anemic domain models, fine for simple domains."
  ],
  "Twelve-Factor App": [
    "The twelve-factor methodology describes cloud-native apps: one codebase, explicit dependencies, config in the environment, backing services as attached resources, stateless processes, port binding, logs as streams, disposability and dev and prod parity. Many of its ideas underpin Spring Boot and Kubernetes deployments.",
    "Factors include externalised config, stateless share-nothing processes, treating logs as event streams to stdout, fast startup and graceful shutdown, and admin tasks as one-off processes.",
    "It makes applications portable, scalable and easy to operate in cloud and container platforms.",
    "Use it as a checklist when designing or modernising services for containers.",
    "Do not treat it as dogma; some factors, such as config only in environment variables, are relaxed with config servers and secrets managers.",
    "Externalise configuration, store sessions outside the process, log to stdout, support graceful shutdown on SIGTERM, and keep builds, releases and runs separate.",
    "Pros: portability and scalability. Cons: requires platform support and discipline.",
    "Alternatives are the newer beyond-twelve-factor guidelines and platform-specific best practices."
  ],
  "Microservice Anti-patterns": [
    "Common anti-patterns are the distributed monolith, shared database, chatty services, nano-services, no observability, synchronous call chains, missing versioning and a lack of ownership. They produce all the cost of microservices with few benefits.",
    "A distributed monolith has services that must be deployed together or share a database, so they are coupled but remote. Chatty services make many small remote calls per request.",
    "Teams often adopt microservices without changing design and operations, and end up worse off.",
    "Use this list in architecture reviews and when diagnosing why a microservice system is slow or hard to change.",
    "Do not conclude that microservices failed when the real problem is wrong boundaries or missing practices.",
    "Give each service its own data, prefer asynchronous events for non-critical flows, use API versioning and contract tests, invest in tracing and logging, and align teams to services.",
    "Pros: better decisions and earlier problem detection. Cons: needs honest assessment of the organisation.",
    "Alternatives are consolidating services back into a modular monolith when overhead outweighs benefits."
  ],

  "Database per Service": [
    "Each microservice owns its data and exposes it only through APIs or events, which keeps services decoupled but means no joins or ACID transactions across services. Use events, sagas and read models to handle cross-service data needs.",
    "A service's tables are private. Other services cannot query them directly. Data needed elsewhere is obtained by API calls, replicated through events, or composed in read models.",
    "A shared database couples services at the schema level, preventing independent changes and deployments.",
    "Use it when services are meant to be independently deployable and evolvable, with clear data ownership.",
    "Avoid it when a single team owns tightly related data and consistency requirements are strict, where a modular monolith may serve better.",
    "Separate schemas or databases per service, expose APIs, publish domain events for changes, build local read replicas or caches of needed data, and use sagas for multi-service operations.",
    "Pros: autonomy and independent scaling. Cons: eventual consistency, duplicated data and complex reporting.",
    "Alternatives are shared database with schema ownership (risky), and data mesh or warehouse for analytics."
  ],
  "Saga Pattern": [
    "A saga manages a business transaction spanning services as a sequence of local transactions, each with a compensating action to undo it on failure. It can be choreographed through events or orchestrated by a coordinator, and provides eventual consistency, not isolation.",
    "Each step commits locally and triggers the next. If a step fails, previous steps are compensated, for example refund the payment and release inventory.",
    "Distributed ACID transactions across services are impractical, but business processes still need all-or-nothing outcomes.",
    "Use it for order, booking and payment workflows spanning several services.",
    "Avoid it when a single service can do the work in one local transaction, or where compensation is impossible or hard to define.",
    "Define steps and compensations, make each step idempotent, persist saga state, use the outbox for reliable events, handle timeouts, and consider orchestration engines such as Temporal or Camunda for complex flows.",
    "Pros: no distributed locks, scalable. Cons: complexity, temporary inconsistency, no isolation and compensation design effort.",
    "Alternatives are two-phase commit, a single service boundary and eventually consistent reconciliation.",
    `// Orchestrated saga (simplified)
void placeOrder(Order o) {
    orderService.create(o);                          // step 1
    try {
        inventoryService.reserve(o);                 // step 2
        try {
            paymentService.charge(o);                // step 3
        } catch (PaymentFailed e) {
            inventoryService.release(o);             // compensate step 2
            orderService.cancel(o);                  // compensate step 1
        }
    } catch (OutOfStock e) {
        orderService.cancel(o);
    }
}`
  ],
  "Transactional Outbox": [
    "The outbox pattern writes the business change and an event row in the same local transaction, and a relay publishes the events to the broker afterwards. It solves the dual-write problem and guarantees at-least-once publication, so consumers must be idempotent.",
    "An outbox table lives in the service's database. A poller or change data capture reads new rows, publishes them to Kafka or another broker, and marks or deletes them.",
    "Saving to the database and publishing to a broker are two separate operations. A crash between them loses events or publishes events for rolled-back data.",
    "Use it whenever a service must update its data and reliably emit an event.",
    "Avoid it if you only need best-effort notification, or when the platform already offers transactional messaging.",
    "Insert the outbox row in the same transaction as the business change, run a relay (polling publisher or Debezium CDC), publish with the row id as the key, and mark as sent. Make consumers deduplicate by event id.",
    "Pros: reliable event publication without distributed transactions. Cons: extra table and relay, at-least-once duplicates and slight latency.",
    "Alternatives are transaction log tailing (CDC), event sourcing and two-phase commit with brokers.",
    `@Transactional
public void placeOrder(Order order) {
    orderRepository.save(order);
    outboxRepository.save(new OutboxEvent(
        UUID.randomUUID(), "OrderPlaced", toJson(order)));   // same transaction
}
// relay (scheduled or Debezium): read unsent events, publish to Kafka, mark sent`
  ],
  "CQRS": [
    "CQRS separates the write model (commands) from read models (queries), allowing each to be optimised and scaled independently, often with eventual consistency between them. Use it where read and write needs differ greatly, not as a default.",
    "Commands change state through the domain model, and events update denormalised read stores tailored to queries, which may be different databases.",
    "A single model serving complex writes and varied reads becomes compromised, and reads often outnumber writes by far.",
    "Use it for read-heavy systems with complex queries, reporting views, and with event sourcing or microservices that must compose data.",
    "Avoid it for simple CRUD, where it doubles the moving parts, and where users cannot accept eventual consistency.",
    "Handle commands through application services, publish domain events, build projections that update read models asynchronously, and design UIs for eventual consistency.",
    "Pros: optimised and independently scalable reads and writes. Cons: complexity, eventual consistency and duplicated data.",
    "Alternatives are a single model with read replicas, materialised views and caching."
  ],
  "Event Sourcing": [
    "Event sourcing stores state as an append-only sequence of events and derives current state by replaying them, giving a full audit trail and the ability to rebuild read models. It adds complexity in versioning, snapshots and queries.",
    "Instead of overwriting rows, each change is recorded as an immutable event. Aggregates are reconstructed from events, with snapshots for speed, and projections create query views.",
    "Traditional storage loses history, making audit, debugging and temporal queries hard.",
    "Use it for domains needing full audit, temporal queries or complex behaviour such as finance and ledgers, often combined with CQRS.",
    "Avoid it for simple CRUD domains, teams without the experience, or where event schema evolution cannot be managed.",
    "Define events as facts in the past tense, store them append-only with aggregate id and version, use optimistic concurrency, build projections and snapshots, and plan event upcasting for schema changes.",
    "Pros: audit, replay and flexible read models. Cons: complexity, eventual consistency, event versioning and a steeper learning curve.",
    "Alternatives are audit tables, change data capture and temporal tables."
  ],
  "Two-Phase Commit and Why to Avoid It": [
    "Two-phase commit coordinates a distributed transaction with a prepare phase and a commit phase, giving atomicity across resources but blocking on coordinator failure and limiting availability and scalability. Microservices avoid it and use sagas and outbox instead.",
    "A coordinator asks participants to prepare, and if all agree it tells them to commit, otherwise abort. Participants hold locks while waiting for the decision.",
    "Atomic updates across several databases or brokers seem desirable for consistency.",
    "Use it, via XA, only in tightly controlled environments with few resources, such as a database and a message queue in one application server.",
    "Avoid it across services or through the internet, because of coordinator blocking, lock holding, latency and lack of support in many modern systems.",
    "Prefer local transactions with sagas, the outbox pattern and idempotent consumers to reach eventual consistency.",
    "Pros: strong atomicity. Cons: blocking, poor scalability, availability impact and complexity.",
    "Alternatives are sagas, outbox, TCC (try-confirm-cancel) and eventual consistency with reconciliation."
  ],
  "Change Data Capture": [
    "Change data capture reads a database's transaction log and streams row changes as events, with tools like Debezium and Kafka Connect. It powers outbox relays, cache and search synchronisation and data replication without changing application code.",
    "CDC tails the write-ahead log (MySQL binlog, PostgreSQL WAL), converts inserts, updates and deletes to events, and publishes them to a broker in commit order.",
    "Polling tables or dual writes are slow, missing deletes, or inconsistent. The log is the authoritative record of changes.",
    "Use it for replicating data to search, caches, analytics and other services, and for implementing the outbox pattern.",
    "Avoid exposing raw table changes as a public contract, since schemas leak and change. Do not use it where simple application events suffice.",
    "Deploy Debezium connectors with Kafka Connect, configure the replication slot, filter tables, handle schema changes and monitor lag, and consume events idempotently.",
    "Pros: reliable, low-latency, no application changes. Cons: operational overhead, schema coupling and log retention concerns.",
    "Alternatives are application-level events, polling with timestamps and database triggers."
  ],

  "Synchronous vs Asynchronous Communication": [
    "Synchronous calls (HTTP, gRPC) are simple and give immediate answers but couple availability and latency; asynchronous messaging decouples services and absorbs spikes at the cost of complexity and eventual consistency. Use sync for queries needing an immediate answer and async for workflows and events.",
    "Synchronous request-response blocks the caller until the response. Asynchronous communication uses queues or logs so producers do not wait for consumers.",
    "Long chains of synchronous calls multiply latency and failure probability, and overloaded dependencies cascade.",
    "Use sync for user-facing reads and simple commands, async for background processing, integration events and anything that can tolerate delay.",
    "Avoid deep synchronous chains, and avoid async where users need an immediate definitive result.",
    "Apply timeouts, retries and circuit breakers to sync calls, and idempotent consumers, DLQs and monitoring to async flows. Return 202 Accepted with a status resource for long-running commands.",
    "Pros of async: resilience, scalability. Cons: harder debugging, ordering and eventual consistency. Sync is simple but fragile at scale.",
    "Alternatives are hybrid patterns such as request-reply over messaging and callbacks or webhooks."
  ],
  "REST vs gRPC vs Messaging": [
    "REST is universal and cache-friendly for public and simple APIs, gRPC gives efficient typed contracts for internal service calls, and messaging suits asynchronous events. Choose by clients, performance needs and coupling.",
    "REST uses HTTP and JSON with resource semantics. gRPC uses HTTP/2 and Protocol Buffers with generated clients and streaming. Messaging uses brokers for decoupled, asynchronous delivery.",
    "Different interaction styles have different needs for latency, contracts, browser support and coupling.",
    "Use REST for external and browser-facing APIs, gRPC for low-latency internal calls and streaming, and messaging for events and workflows.",
    "Avoid gRPC for public browser clients without a gateway, and REST for high-volume internal calls where bandwidth and latency matter.",
    "Define contracts with OpenAPI or protobuf, version them, generate clients, and add deadlines, retries and observability to each style.",
    "Pros: each fits a niche. Cons: multiple styles add operational and skill overhead.",
    "Alternatives are GraphQL for flexible client queries and WebSockets for push."
  ],
  "Event-Driven Architecture": [
    "In event-driven architecture services communicate by publishing and reacting to events, which gives loose coupling and scalability but makes flows harder to trace and requires idempotent consumers and careful event design. Distinguish events (facts) from commands (requests).",
    "Producers emit events when something happens, and consumers subscribe independently. Styles include notification events, event-carried state transfer and event sourcing.",
    "Synchronous point-to-point integration creates tight coupling and fragile chains.",
    "Use it for integration between bounded contexts, real-time reactions, audit and analytics pipelines.",
    "Avoid it when strict request-response semantics are needed or the team cannot operate brokers and handle eventual consistency.",
    "Name events in the past tense, version schemas (Avro, Schema Registry), include ids and timestamps, make consumers idempotent, use DLQs, and trace with correlation ids.",
    "Pros: decoupling, extensibility, resilience. Cons: hard to follow flow, eventual consistency and schema governance.",
    "Alternatives are synchronous APIs and orchestrated workflows."
  ],
  "Choreography vs Orchestration": [
    "In choreography services react to each other's events without a central controller, which is decoupled but hard to see end to end; in orchestration a central coordinator tells services what to do, which is clearer but adds a coordinating component. Use orchestration for complex workflows and choreography for simple ones.",
    "Choreographed sagas flow through events, with each service deciding its next action. Orchestrated sagas have an orchestrator holding the process definition and state.",
    "Multi-step business processes need coordination, and the choice affects coupling and visibility.",
    "Use choreography for few steps and independent teams, orchestration for long processes with many steps, branching and timeouts.",
    "Avoid choreography when the flow becomes a tangled web of events, and orchestration when it turns the coordinator into a god service.",
    "For orchestration use a workflow engine (Temporal, Camunda, Step Functions) with persisted state, retries and timers, and for choreography define clear event contracts and monitor flows with tracing.",
    "Pros of orchestration: visibility and control. Cons: central dependency. Choreography: decoupled but implicit.",
    "Alternatives are hybrid approaches with orchestrated cores and choreographed edges."
  ],
  "Idempotent Consumer": [
    "An idempotent consumer handles the same message more than once without changing the outcome, which is essential because brokers deliver at least once. Deduplicate by message id or make operations naturally idempotent.",
    "Techniques include a processed-message table with a unique constraint, natural idempotency through upserts, version checks and conditional updates.",
    "Retries, rebalances and redelivery produce duplicates, which can double charge or double ship without protection.",
    "Use it in every consumer of Kafka, RabbitMQ, SQS and similar systems.",
    "Avoid relying on exactly-once claims alone, and avoid unbounded deduplication stores without cleanup.",
    "Store processed event ids in the same transaction as the side effect, enforce uniqueness, use upsert semantics, expire old ids, and handle out-of-order events with versions.",
    "Pros: safe retries and robust consumers. Cons: additional storage and logic.",
    "Alternatives are transactional exactly-once processing in Kafka (limited scope) and idempotent producers.",
    `@Transactional
public void handle(PaymentCaptured event) {
    if (processedRepo.existsById(event.id())) return;         // duplicate: ignore
    orderService.markPaid(event.orderId());
    processedRepo.save(new ProcessedEvent(event.id()));        // same transaction
}`
  ],
  "API Gateway Pattern": [
    "An API gateway is the single entry point for clients, handling routing, authentication, rate limiting, protocol translation and sometimes aggregation. Keep it thin and avoid business logic.",
    "The gateway routes requests to services, terminates TLS, validates tokens, applies throttling and caching, and can aggregate responses for clients.",
    "Clients should not call dozens of services directly or know their locations, and cross-cutting policies belong in one place.",
    "Use it in front of microservices, especially for public and mobile APIs.",
    "Avoid turning it into a monolithic orchestration layer or a single point of failure without redundancy.",
    "Use Spring Cloud Gateway, Kong, NGINX or a cloud gateway, define routes declaratively, offload auth to the identity provider, enable rate limits and observability, and scale it horizontally.",
    "Pros: simplicity for clients and central policies. Cons: extra hop, bottleneck risk and operational burden.",
    "Alternatives are direct service access with shared libraries, BFFs and service mesh ingress."
  ],
  "Backend for Frontend": [
    "A BFF is a dedicated backend per client type (web, mobile) that aggregates and shapes data for that client, avoiding a one-size-fits-all API. It reduces chattiness and lets frontend teams move independently.",
    "Each BFF calls downstream services, composes and trims the response for its client, and handles client-specific concerns such as formats and pagination.",
    "A generic API forces clients to over-fetch, make many calls or contain orchestration logic.",
    "Use it when different clients have significantly different needs, or when a frontend team wants to own its API layer.",
    "Avoid it for a single simple client, and avoid duplicating business logic across BFFs.",
    "Create a thin service per client type, keep business rules in domain services, use parallel calls with timeouts, and cache where useful. GraphQL is an alternative BFF approach.",
    "Pros: tailored APIs, faster frontend iteration. Cons: more services and risk of duplicated logic.",
    "Alternatives are a general API gateway, GraphQL and client-side composition."
  ],
  "Service Mesh": [
    "A service mesh (Istio, Linkerd) moves service-to-service concerns such as mTLS, retries, timeouts, traffic shifting and telemetry into sidecar proxies or a node-level layer, so applications stay free of that code. It adds operational complexity and latency.",
    "A control plane configures data-plane proxies (Envoy) that intercept traffic between services, enforcing policies and emitting metrics and traces.",
    "Implementing retries, mTLS and observability in every service and language is repetitive and inconsistent.",
    "Use it for large Kubernetes estates needing uniform security, traffic management and observability across many services.",
    "Avoid it for a handful of services, where libraries and ingress are enough, or when the team cannot operate the extra layer.",
    "Install the mesh, inject sidecars, define VirtualServices or equivalent for routing and canaries, enable mTLS, and keep application-level resilience for business-specific logic.",
    "Pros: uniform policy and visibility. Cons: complexity, resource overhead and debugging difficulty.",
    "Alternatives are libraries such as Resilience4j and Spring Cloud, ingress controllers and eBPF-based networking."
  ],

  "Circuit Breaker Pattern": [
    "A circuit breaker stops calls to a failing dependency after a failure threshold, fails fast, and then probes for recovery in a half-open state, preventing cascading failures. Pair it with timeouts, retries and fallbacks.",
    "States are closed (normal), open (calls rejected immediately) and half-open (limited trial calls). A sliding window of results decides transitions.",
    "Waiting on a dead dependency ties up threads, and failures propagate upstream.",
    "Use it around remote calls to services, databases and third-party APIs.",
    "Avoid using it for local calls, and avoid thresholds so sensitive that it flaps.",
    "Configure failure rate, window size and open duration (Resilience4j), define meaningful fallbacks, and monitor breaker state as a metric.",
    "Pros: fast failure and system protection. Cons: tuning, fallback design and added state.",
    "Alternatives are timeouts and bulkheads alone, and mesh-level outlier detection.",
    `@CircuitBreaker(name = "inventory", fallbackMethod = "fromCache")
public Stock check(String sku) { return inventoryClient.get(sku); }

Stock fromCache(String sku, Throwable t) { return stockCache.get(sku); }`
  ],
  "Retry with Backoff and Jitter": [
    "Retry transient failures with exponential backoff and random jitter, bounded attempts and only for idempotent operations, so retries do not create retry storms. Combine with a circuit breaker and timeouts.",
    "Backoff increases the delay between attempts (for example 200 ms, 400 ms, 800 ms). Jitter randomises delays so many clients do not retry in lockstep.",
    "Transient errors are common in distributed systems, but naive immediate retries amplify load on a struggling service.",
    "Use it for network calls, brokers and rate-limited APIs, for errors like timeouts, 503 and 429.",
    "Avoid retrying non-idempotent calls, permanent errors such as 400 or 404, and retries at every layer, which multiply load.",
    "Set maximum attempts and total time, use exponential backoff with full jitter, respect Retry-After, retry in one layer only, and log and measure retries.",
    "Pros: resilience to transient faults. Cons: added latency and potential load amplification.",
    "Alternatives are failing fast, queue-based retry with DLQs and hedged requests.",
    `RetryConfig config = RetryConfig.custom()
    .maxAttempts(4)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(200, 2.0, 0.5))
    .retryOnException(e -> e instanceof IOException || e instanceof TimeoutException)
    .build();`
  ],
  "Timeouts and Deadlines": [
    "Every remote call needs a timeout, because a missing timeout lets a slow dependency hold threads and cascade failure. Propagate an overall deadline so downstream calls do not outlive the caller's budget.",
    "Connect timeouts bound connection setup and read timeouts bound waiting for data. A deadline is an absolute time by which the whole request must finish, passed to downstream services.",
    "Default timeouts are often infinite or very long, so one slow service blocks the entire call chain.",
    "Use it on every HTTP client, database call, queue consumer and thread-pool task.",
    "Avoid one global long timeout for all calls, and timeouts set longer than the caller's own timeout.",
    "Set client timeouts shorter than upstream ones (budgeting), use gRPC deadlines or a header carrying remaining time, and combine with retries limited by the remaining budget.",
    "Pros: bounded latency and resource use. Cons: choosing values needs data, and too short causes false failures.",
    "Alternatives are circuit breakers, bulkheads and cancellation tokens.",
    `RestClient client = RestClient.builder()
    .requestFactory(clientHttpRequestFactory(Duration.ofMillis(500), Duration.ofSeconds(2)))
    .build();
// connect timeout 500 ms, read timeout 2 s: both shorter than the caller's own budget`
  ],
  "Bulkhead": [
    "The bulkhead pattern isolates resources per dependency or workload, using separate thread pools or semaphores, so one slow dependency cannot exhaust capacity for everything. It is named after ship compartments.",
    "Each downstream call uses its own bounded pool or concurrency limit, and excess calls are rejected or queued within that compartment.",
    "A shared pool lets one slow service consume all threads, taking down unrelated functionality.",
    "Use it for calls to dependencies of differing reliability, and to protect critical flows from batch or low-priority traffic.",
    "Avoid too many tiny pools that waste resources, and do not use unbounded queues, which defeat the isolation.",
    "Use Resilience4j Bulkhead or separate ThreadPoolExecutors, size per dependency from latency and throughput, and add metrics on rejected calls.",
    "Pros: failure isolation. Cons: resource fragmentation and tuning.",
    "Alternatives are Kubernetes resource limits per service, separate deployments for critical paths and virtual threads with semaphores."
  ],
  "Rate Limiting and Load Shedding": [
    "Rate limiting caps request rates per client to protect fairness, and load shedding drops excess or low-priority work when the system is overloaded to stay healthy for the rest. Apply them at the edge and near scarce resources.",
    "Rate limits use algorithms like token bucket per user or key. Load shedding rejects requests by priority or when queue and latency thresholds are crossed, returning 429 or 503.",
    "Without limits, a surge or one abusive client degrades the service for everyone.",
    "Use it at gateways, around expensive endpoints, and in services with finite capacity.",
    "Avoid dropping critical traffic first, and avoid silent drops without telling clients when to retry.",
    "Implement limits at the gateway with Redis-backed counters, use adaptive concurrency limits in services, prioritise important requests, and return Retry-After headers.",
    "Pros: stability and fairness. Cons: rejected requests and configuration complexity.",
    "Alternatives are autoscaling, queue buffering and backpressure."
  ],
  "Fallback and Graceful Degradation": [
    "Graceful degradation keeps a system partially useful when dependencies fail, by returning cached data, defaults or reduced features instead of errors. Design fallbacks deliberately and make them visible in metrics.",
    "A fallback provides an alternative result when a call fails, times out or the breaker is open, such as stale cache, static recommendations or a queued request.",
    "Total failure for a non-critical dependency is worse than a slightly degraded experience.",
    "Use it for non-critical features such as recommendations, personalisation and ancillary data.",
    "Avoid fallbacks that hide serious failures or return incorrect data for critical operations, such as payments.",
    "Define per-dependency fallbacks, mark degraded responses, log and meter fallback usage, and test them with chaos experiments.",
    "Pros: better user experience and resilience. Cons: more code paths to test and risk of stale data.",
    "Alternatives are failing fast with clear errors for critical flows and feature flags to disable features."
  ],
  "Health Checks and Self-Healing": [
    "Expose liveness and readiness checks so the platform restarts broken instances and only routes traffic to ready ones. Keep liveness cheap, make readiness reflect dependencies carefully, and handle graceful shutdown.",
    "Liveness answers whether the process should be restarted, readiness answers whether it can serve traffic now, and startup probes protect slow-starting apps.",
    "Orchestrators need signals to automate recovery and rollouts.",
    "Use it for every service in Kubernetes or behind a load balancer, via Spring Boot Actuator health groups.",
    "Avoid making liveness depend on external services, which can cause restart storms, and avoid slow or heavy health checks.",
    "Enable Actuator probes, include only essential dependencies in readiness, set sensible probe timeouts, and implement graceful shutdown with a pre-stop delay.",
    "Pros: automated recovery and safe deployments. Cons: misconfigured probes cause outages.",
    "Alternatives are external monitoring and manual operations.",
    `management:
  endpoint:
    health:
      probes:
        enabled: true      # /actuator/health/liveness and /readiness
server:
  shutdown: graceful`
  ],
  "Sidecar and Ambassador": [
    "A sidecar is a helper process deployed beside the main service to provide cross-cutting capabilities such as proxying, logging or config, and an ambassador is a sidecar acting as a proxy to external services. Service meshes are built on sidecars.",
    "The sidecar shares the pod or host lifecycle and network with the application, handling concerns outside the application code and in any language.",
    "Cross-cutting infrastructure code in each service is duplicated and language specific.",
    "Use it for mesh proxies, log shippers, config agents and secret injectors in Kubernetes.",
    "Avoid it when the added resource use and complexity outweigh the benefit, such as for a few services.",
    "Deploy the helper container in the same pod, route traffic through it, and manage its resources and lifecycle together with the application.",
    "Pros: language-agnostic reuse. Cons: resource overhead and operational complexity.",
    "Alternatives are shared libraries, node-level agents and daemon sets."
  ],

  "Strangler Fig Migration": [
    "The strangler fig pattern migrates a legacy system gradually by routing selected functionality to new services behind a facade, until the old system can be retired. It avoids risky big-bang rewrites.",
    "A routing layer (gateway or proxy) sends some requests to the new implementation and the rest to the legacy system, with the share of new traffic growing over time.",
    "Rewrites take long, delay value and often fail, while legacy systems keep changing.",
    "Use it when modernising monoliths to microservices or replacing legacy platforms incrementally.",
    "Avoid it if the legacy system cannot be intercepted at any seam, or if data coupling makes slicing impossible without major work.",
    "Find seams, put a proxy in front, extract one capability at a time with its data (using CDC or an anti-corruption layer for sync), shift traffic gradually, and remove the old code when unused.",
    "Pros: low risk and continuous delivery of value. Cons: temporary duplication and the complexity of running both systems.",
    "Alternatives are big-bang rewrite, branch by abstraction and leaving the legacy as is."
  ],
  "Blue-Green and Canary Deployments": [
    "Blue-green runs two identical environments and switches traffic at once for instant rollback, while canary releases a new version to a small percentage of traffic and expands as metrics stay healthy. Rolling updates replace instances gradually.",
    "In blue-green, the new version (green) is deployed alongside the live one (blue), tested, then traffic is switched. Canary routes a small share through weighted routing and watches error rate and latency.",
    "Big-bang deployments risk downtime and large blast radius, and rollbacks are slow.",
    "Use blue-green for simple, fast switchovers and rollback, and canary for gradual risk reduction with automated analysis.",
    "Avoid them when database schema changes are not backward compatible, since both versions must work with the same data.",
    "Use backward-compatible migrations (expand and contract), route by weight in the ingress or mesh, automate promotion and rollback on SLO metrics, and keep versions compatible during the transition.",
    "Pros: safer releases and fast rollback. Cons: infrastructure cost and database compatibility constraints.",
    "Alternatives are rolling updates, feature flags and recreate deployments."
  ],
  "Feature Flags": [
    "Feature flags separate deployment from release by turning functionality on or off at runtime, enabling gradual rollouts, A/B tests and kill switches. They must be managed and removed to avoid flag debt.",
    "A flag is a runtime condition, evaluated per user or group, backed by configuration or a service such as LaunchDarkly, Unleash or Togglz.",
    "Merging unfinished work into long-lived branches is risky, and releasing requires redeploying.",
    "Use it for trunk-based development, canary and percentage rollouts, kill switches and experiments.",
    "Avoid leaving flags forever, nesting many flags, or using them for permanent configuration.",
    "Create flags with owners and expiry dates, evaluate close to the decision point, default to safe behaviour if the flag service is unavailable, test both paths, and remove flags after full rollout.",
    "Pros: safer releases and faster feedback. Cons: code complexity, test combinations and stale flags.",
    "Alternatives are branch-based releases and configuration properties with redeploys.",
    `if (flags.isEnabled("new-checkout", user)) {
    return newCheckout.process(cart);
}
return legacyCheckout.process(cart);        // kill switch: flip the flag off to roll back`
  ],
  "Service Discovery and Configuration": [
    "Services find each other by logical name through a registry (Eureka, Consul) or platform DNS (Kubernetes), and externalise configuration through config servers, ConfigMaps or secret managers. On Kubernetes the platform covers most of it.",
    "Client-side discovery has the caller query a registry and load balance; server-side discovery uses a load balancer or platform DNS. Configuration is injected at deploy or fetched at startup, with refresh options.",
    "Instances scale and move, so fixed addresses and baked-in config do not work.",
    "Use platform discovery on Kubernetes, and a registry such as Consul or Eureka elsewhere. Use Vault or cloud secret managers for secrets.",
    "Avoid running your own registry when the platform has one, and avoid storing secrets in plain configuration.",
    "Use Kubernetes Services and DNS names, ConfigMaps and Secrets, spring.config.import for external config, and health checks to keep registries accurate.",
    "Pros: elasticity and central control. Cons: extra components and eventual consistency of registries.",
    "Alternatives are static configuration for small systems and service mesh discovery."
  ],
  "Centralised Logging and Correlation IDs": [
    "Ship structured logs from all services to a central store (ELK, Loki, Splunk) and attach a correlation or trace id to every request so you can follow it across services. Log to stdout in JSON and avoid logging secrets.",
    "A correlation id is generated at the edge, propagated in headers and added to the logging context (MDC). Structured JSON logs make searching and aggregation reliable.",
    "In a distributed system, a request touches many services, and logs scattered on many hosts cannot be correlated.",
    "Use it in every microservice system, together with metrics and tracing.",
    "Avoid logging sensitive data and high-volume debug logs in production, and unstructured messages that cannot be queried.",
    "Use Micrometer Tracing or a filter to set traceId in MDC, log in JSON with a consistent schema, ship with Fluent Bit or the platform agent, and define retention and sampling.",
    "Pros: fast diagnosis and auditability. Cons: storage cost and the need for discipline.",
    "Alternatives are APM platforms with built-in log correlation and OpenTelemetry logging.",
    `// logback pattern with trace id from Micrometer Tracing
<pattern>%d %-5level [%X{traceId:-},%X{spanId:-}] %logger{36} - %msg%n</pattern>`
  ],
  "Kubernetes for Java Developers": [
    "Know the essentials: pods, deployments, services, ingress, ConfigMaps, secrets, probes, resource requests and limits, and rolling updates, plus how the JVM behaves in containers. Set memory and CPU deliberately, use probes and handle SIGTERM for graceful shutdown.",
    "A Deployment manages replicas of pods, a Service gives them a stable address, an Ingress routes external traffic, and the HorizontalPodAutoscaler scales on metrics. Requests influence scheduling and limits enforce caps.",
    "Most Java services now run on Kubernetes, and configuration mistakes cause outages such as OOMKilled pods and failed rollouts.",
    "Use it as the baseline knowledge for deploying and operating Spring Boot services.",
    "Avoid setting the heap to the container limit, no resource limits, liveness probes that depend on downstream services, and ignoring graceful shutdown.",
    "Set requests and limits, use MaxRAMPercentage, add readiness and liveness probes, configure terminationGracePeriodSeconds with Spring graceful shutdown, use ConfigMaps and Secrets, and autoscale on CPU or custom metrics.",
    "Pros: portability, self-healing and scaling. Cons: operational complexity and a learning curve.",
    "Alternatives are managed platforms such as ECS, Cloud Run, App Service and PaaS options.",
    `apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: orders
          image: registry/orders:1.4.2
          resources:
            requests: { cpu: "500m", memory: "1Gi" }
            limits:   { memory: "1Gi" }
          readinessProbe: { httpGet: { path: /actuator/health/readiness, port: 8080 } }
          livenessProbe:  { httpGet: { path: /actuator/health/liveness,  port: 8080 } }`
  ],

  "Consumer-Driven Contract Testing": [
    "In consumer-driven contract testing, consumers define the expectations they have of a provider's API as contracts, and providers verify against them, catching breaking changes without running a full integration environment. Tools are Pact and Spring Cloud Contract.",
    "A contract describes requests and expected responses (or messages). The consumer tests against a stub generated from it, and the provider test replays the contract against the real implementation.",
    "End-to-end tests for many services are slow and flaky, while unit tests with mocks can drift from the real API.",
    "Use it for service-to-service APIs and events owned by different teams.",
    "Avoid it for a single team owning both sides with a monolith, or as a replacement for all integration tests.",
    "Write consumer tests that generate contracts, publish them to a broker (Pact Broker), verify them in the provider's CI, and gate deployment with can-i-deploy checks.",
    "Pros: fast feedback and safe independent releases. Cons: setup effort and contract maintenance.",
    "Alternatives are end-to-end test environments, schema validation (OpenAPI diff) and schema registries for events."
  ],
  "Testing Microservices": [
    "Use a balanced pyramid: many fast unit tests, component tests with Testcontainers and mocked neighbours, contract tests between services, and only a few end-to-end tests. Add production verification with observability and canary releases.",
    "Layers include unit, integration (database, broker), component (one service in isolation with stubs), contract, end-to-end and exploratory or chaos tests.",
    "Distributed systems fail in ways unit tests miss, but a large end-to-end suite is slow, flaky and expensive.",
    "Use it to plan test strategy for services and to decide where each risk is best tested.",
    "Avoid relying mostly on end-to-end tests, or on mocks that never meet the real dependency.",
    "Use Testcontainers for databases and brokers, WireMock for HTTP dependencies, consumer-driven contracts for APIs, a small smoke suite in a shared environment, and monitor production with SLOs.",
    "Pros: fast reliable feedback. Cons: several kinds of tests to maintain.",
    "Alternatives are testing in production with feature flags and canaries, and chaos engineering."
  ]
};
