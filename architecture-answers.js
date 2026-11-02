// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional sketch or template]
// Sections: Definition, Motivation, Context, Anti-Context, Implementation, Trade-offs, Alternatives.
const SERVICE_ANSWERS = {
  "Hexagonal Architecture (Ports and Adapters)": [
    "Hexagonal architecture puts the domain and application logic at the centre and isolates it from the outside world through ports (interfaces owned by the core) and adapters (implementations for REST, databases, brokers). Dependencies point inward, so the core can be tested without a framework, a database or a network.",
    "Inbound (driving) ports such as use-case interfaces are called by adapters like controllers or message listeners. Outbound (driven) ports such as repositories or payment gateways are defined by the core and implemented by adapters like JPA or an HTTP client.",
    "Business rules tangled with Spring annotations, JPA entities and HTTP details are slow to test and expensive to change when infrastructure changes, for example swapping a database or adding a new entry channel.",
    "Use it for services with real business logic, long lifespans, several entry points (REST, Kafka, batch) or a likely infrastructure change, and as the internal shape of each microservice.",
    "Avoid it for thin CRUD services, scripts and prototypes, where the extra interfaces and mapping layers add code without protecting any logic.",
    "Split packages into domain, application (use cases and ports) and adapter.in and adapter.out, keep the domain free of framework imports, wire adapters with Spring configuration, enforce the dependency rule with ArchUnit, and test the core with plain unit tests and adapters with Testcontainers.",
    "Pros: testable core, swappable infrastructure, clear boundaries. Cons: more classes, mapping between domain and persistence models, and a learning curve that can feel like over-engineering for simple services.",
    "Alternatives are classic layered architecture (simpler, but the domain depends on persistence), clean and onion architecture (same dependency rule with different vocabulary), and a transaction-script style for trivial CRUD.",
    `com.example.orders
  domain            // entities, value objects, domain services (no Spring, no JPA)
  application
    port.in         // PlaceOrderUseCase
    port.out        // OrderRepository, PaymentGateway
    service         // PlaceOrderService implements PlaceOrderUseCase
  adapter
    in.web          // OrderController (REST)
    in.messaging    // OrderEventsListener (Kafka)
    out.persistence // JpaOrderRepositoryAdapter implements OrderRepository
    out.payment     // HttpPaymentGatewayAdapter implements PaymentGateway
  config            // Spring wiring

// ArchUnit rule: domain must not depend on adapters or Spring
noClasses().that().resideInAPackage("..domain..")
    .should().dependOnClassesThat().resideInAnyPackage("..adapter..", "org.springframework..");`
  ],
  "Clean Architecture": [
    "Clean Architecture arranges code in concentric rings (entities, use cases, interface adapters, frameworks and drivers) with one rule: source code dependencies point only inward. Business rules do not know about the web, the database or the framework, which makes them testable and long-lived.",
    "Entities hold enterprise rules, use cases hold application rules, interface adapters convert data to and from the outer formats, and the outermost ring holds frameworks, databases and UI. Data crosses boundaries as simple DTOs, and inversion of dependencies lets inner code call outer code through interfaces.",
    "Frameworks and databases change faster than business rules, and coupling the two means every framework upgrade or storage change touches the core logic.",
    "Use it for complex, long-lived domains where framework independence and test speed pay off, and when several teams need a shared structural convention.",
    "Avoid it for small CRUD apps or short-lived projects, and do not apply it so strictly that every layer needs its own copy of the same DTO.",
    "Define use case classes with input and output boundaries, place repository interfaces in the use case ring, implement them in the outer ring, map between layers deliberately (MapStruct helps), keep Spring and JPA out of inner modules, and enforce dependencies with Maven or Gradle modules plus ArchUnit.",
    "Pros: framework independence, high testability, clear dependency direction. Cons: boilerplate, mapping overhead, and the risk of ceremonial layers with no logic in them.",
    "Alternatives are hexagonal architecture (nearly equivalent in practice), simple layered architecture, and vertical slice architecture, which organises code by feature rather than by technical ring.",
    `// Dependency rule in module form (Maven or Gradle)
entities        <- no dependencies
usecases        -> entities
adapters        -> usecases, entities
app (Spring)    -> adapters, usecases, entities    // composition root

// Use case boundary
public interface PlaceOrderUseCase { OrderResult execute(PlaceOrderCommand cmd); }
public interface OrderGateway      { Optional<Order> find(OrderId id); void save(Order o); }  // owned by use case ring`
  ],
  "Layered and Onion Architecture": [
    "Layered architecture stacks presentation, business and data access layers where each layer calls the one below it. Onion architecture inverts the data dependency by placing the domain at the centre, so infrastructure depends on the domain rather than the other way round.",
    "In classic layering the service layer usually depends on a repository layer and often on JPA entities. In onion style the domain model sits in the middle, application services wrap it, and infrastructure (persistence, messaging, web) sits in the outer ring and implements domain interfaces.",
    "Layering gives teams a simple, widely understood structure, but the downward dependency on persistence lets the database model leak into business logic over time.",
    "Layered suits most CRUD-heavy line-of-business services and small teams. Move toward onion when domain rules grow complex and need to be tested without a database.",
    "Do not skip layers arbitrarily (controllers calling repositories), put business logic in controllers or entities' getters and setters only (anemic model), or adopt onion rings for a three-endpoint CRUD service.",
    "In a Spring Boot layered app use controller, service, repository packages, keep transactions in the service layer and DTOs at the web boundary. For onion, define repository interfaces in the domain, implement them in infrastructure, and enforce direction with ArchUnit layer rules.",
    "Layered pros: simple, familiar, fast to build. Cons: tends toward anemic domain and persistence leakage. Onion pros: protects the domain. Cons: more indirection and mapping.",
    "Alternatives are hexagonal and clean architecture (same inward dependency idea), vertical slices by feature, and a modular monolith that applies a simple layering inside each module.",
    `// ArchUnit: classic layering with enforced direction
layeredArchitecture().consideringAllDependencies()
    .layer("Web").definedBy("..web..")
    .layer("Service").definedBy("..service..")
    .layer("Persistence").definedBy("..persistence..")
    .whereLayer("Web").mayNotBeAccessedByAnyLayer()
    .whereLayer("Service").mayOnlyBeAccessedByLayers("Web")
    .whereLayer("Persistence").mayOnlyBeAccessedByLayers("Service");`
  ],
  "Serverless Architecture": [
    "Serverless runs code as short-lived, event-triggered functions or managed services (such as functions, queues, managed databases and API gateways) where the provider handles servers, scaling and patching, and you pay per use. It trades control and predictable latency for operational simplicity and elastic scaling, including scale to zero.",
    "Function-as-a-Service handles compute, and Backend-as-a-Service covers storage, auth and messaging. Functions are stateless, have execution time and memory limits, and scale by running more concurrent instances.",
    "Running always-on servers for spiky or low-volume workloads wastes money and operations effort, and teams often prefer to focus on business logic rather than capacity planning.",
    "Use it for event-driven glue, webhooks, scheduled jobs, file processing, spiky or unpredictable traffic and early-stage products where operational overhead should be minimal.",
    "Avoid it for steady high-throughput workloads where reserved containers are cheaper, latency-critical paths sensitive to cold starts, long-running jobs, and workloads needing heavy local state or special hardware control.",
    "Keep functions small and idempotent, trigger them from queues, topics or HTTP, externalise state to managed stores, use provisioned concurrency or snapshot start for Java cold starts, prefer lighter runtimes or native images where startup matters, and add tracing and structured logs because debugging is distributed.",
    "Pros: no server management, automatic scaling, pay per use. Cons: cold starts (notable for the JVM), vendor lock-in, time limits, harder local testing, and cost that can surge at sustained high volume.",
    "Alternatives are containers on Kubernetes or managed container services (more control, steady cost), a PaaS, and a plain VM-based monolith for steady predictable load."
  ],
  "Monorepo vs Polyrepo": [
    "A monorepo keeps many projects in one repository for atomic cross-project changes, shared tooling and easy refactoring, while polyrepo gives each service its own repository for independent ownership, access control and release cycles. The choice is mostly about team structure, tooling maturity and how often changes span projects.",
    "In a monorepo, services and shared libraries share history, a single dependency set and common CI. In polyrepo, shared code is published as versioned artifacts and each repository has its own pipeline.",
    "Cross-service changes in polyrepo need coordinated pull requests and version bumps, while monorepos can slow builds and blur ownership without tooling.",
    "Monorepo suits organisations with strong shared libraries, frequent cross-cutting changes and investment in build tooling. Polyrepo suits autonomous teams with stable APIs between services and different technology stacks.",
    "Avoid a monorepo without incremental builds, code owners and selective CI, since every commit would rebuild everything. Avoid polyrepo with many shared libraries and no versioning discipline, which causes dependency drift.",
    "For a monorepo use Maven or Gradle multi-module builds or a build tool with affected-only builds, CODEOWNERS per directory, path-filtered CI pipelines and a single dependency BOM. For polyrepo publish libraries to an artifact repository with semantic versioning, use templates for pipelines and automate dependency updates.",
    "Monorepo pros: atomic changes, shared standards, easy discovery. Cons: build scale, tooling cost, broad access. Polyrepo pros: clear ownership, independent pipelines. Cons: version drift, harder cross-repo refactors and duplicated setup.",
    "Alternatives are a hybrid (one repository per domain or team), and git submodules or published platform libraries, which have their own maintenance cost."
  ],
  "Non-Functional Requirements": [
    "Non-functional requirements (quality attributes) define how well a system performs rather than what it does: performance, scalability, availability, reliability, security, maintainability, observability and cost. They drive architecture more than features do, so they must be made measurable and agreed up front.",
    "A good requirement is testable, for example p99 latency under 300 ms at 2,000 requests per second, 99.95 percent availability, or recovery within 15 minutes. These are expressed as SLIs, SLOs and acceptance criteria.",
    "Vague goals such as fast and scalable lead to over- or under-engineering, and late discovery of a quality gap is the most expensive kind of rework.",
    "Capture them at the start of design, revisit them at each major change, and use them to choose between architecture options and to write fitness functions.",
    "Do not accept adjectives without numbers, treat all attributes as equally critical (they conflict, such as consistency versus availability), or gold-plate low-priority attributes.",
    "Run a quality attribute workshop, write scenarios (stimulus, environment, response, measure), rank them, map each to tactics (caching, redundancy, circuit breakers, encryption), automate checks with load tests and SLO alerts, and record choices in ADRs.",
    "Pros: objective decisions and fewer surprises. Cons: effort to quantify, requirements change, and achieving higher targets raises cost and complexity sharply.",
    "Alternatives are Architecture Tradeoff Analysis Method style reviews, utility trees, and a lightweight checklist when the system is small."
  ],
  "Scalability Patterns": [
    "Scalability patterns let a system handle growing load by adding resources: stateless services behind load balancers, caching, database replication and sharding, asynchronous processing with queues, and partitioning of work. The first step is always to find the real bottleneck, then pick the cheapest pattern that moves it.",
    "Horizontal scaling adds instances, vertical scaling enlarges them. Read scaling uses replicas and caches, write scaling uses sharding or partitioned logs, and queues smooth bursts by decoupling producers from consumers.",
    "Traffic and data growth eventually exceed what a single node or a synchronous design can serve within latency targets.",
    "Apply them when measurements show saturation or when forecasts show load growth that capacity or latency targets cannot absorb.",
    "Do not shard or split into services before simpler fixes (indexes, query tuning, caching, a bigger instance) are exhausted, and do not scale stateful components without a partitioning plan.",
    "Make services stateless with sessions in Redis, add auto-scaling on utilisation or queue depth, cache with TTL and invalidation rules, add read replicas, move slow work to Kafka or a queue, partition data by a well-distributed key, and apply backpressure and rate limits.",
    "Pros: higher capacity and resilience. Cons: consistency challenges, operational complexity, hotspots from poor keys, and cost growth.",
    "Alternatives are serverless auto-scaling, managed scalable databases, CDN and edge caching, and reducing load through better algorithms or data models."
  ],
  "High Availability and Disaster Recovery (RPO, RTO)": [
    "High availability keeps the service running through local failures using redundancy and failover, while disaster recovery restores service after a major loss such as a region outage. RPO is how much data you can afford to lose and RTO is how long you can afford to be down, and these two numbers drive the design and the cost.",
    "HA uses redundant instances across availability zones, health checks and automatic failover. DR uses backups, replication to another region and tested runbooks, in patterns from backup and restore through pilot light and warm standby to active-active.",
    "Outages cost revenue and trust, but each extra nine and each reduction in RPO or RTO multiplies cost, so the targets must come from business impact.",
    "Define RPO and RTO per service tier during design, review them after incidents, and test them regularly with failover drills.",
    "Do not promise more availability than your dependencies provide, keep backups in the same failure domain as the data, or treat an untested DR plan as a plan.",
    "Deploy across at least two zones, remove single points of failure, use synchronous replication in-region and asynchronous across regions (accepting non-zero RPO), automate failover and DNS or traffic switching, back up with point-in-time recovery, and run game days and restore tests.",
    "Pros: resilience and business continuity. Cons: cost, replication lag versus consistency, complexity, and failover itself being a risk if untested.",
    "Alternatives, by increasing cost and speed: backup and restore, pilot light, warm standby, multi-site active-active. Accepting lower targets for internal tools is also valid.",
    `Tier    RPO        RTO        Pattern
Tier 0  ~0         < 1 min    Active-active multi-region, synchronous or conflict-free data
Tier 1  < 1 min    < 15 min   Warm standby, async cross-region replication, automated failover
Tier 2  < 1 hour   < 4 hours  Pilot light, frequent snapshots and log shipping
Tier 3  < 24 hours < 24 hours Backup and restore from another region

Availability of serial dependencies multiplies: 99.95% x 99.95% x 99.9% ~ 99.8%`
  ],
  "Performance Budgets": [
    "A performance budget sets explicit limits for latency, resource use or payload size that every change must respect, for example p95 under 200 ms for an endpoint, or a fixed time allowance per downstream call. It turns performance from a late firefight into a design constraint that is checked continuously.",
    "The end-to-end latency target is broken down into budgets per component (gateway, service, database, external calls), and each budget is enforced with timeouts, tests and alerts.",
    "Without budgets, small regressions accumulate until a user-visible slowdown appears and nobody owns it.",
    "Use it for user-facing and latency-sensitive paths, for critical APIs with SLOs, and in CI as a gate against regressions.",
    "Do not budget on averages only, set numbers without measuring a baseline, or apply tight budgets to low-value internal paths.",
    "Measure baselines with histograms (Micrometer), allocate the budget per hop, set matching timeouts below the caller's budget, run load tests with Gatling or k6 in the pipeline with thresholds, and alert on SLO burn rate.",
    "Pros: early detection, shared accountability, objective trade-offs. Cons: needs good instrumentation, stable test environments and maintenance as the system changes.",
    "Alternatives are SLO and error-budget policies alone, periodic manual load testing, and APM-based anomaly detection without fixed thresholds.",
    `// k6 thresholds act as a CI performance gate
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed:   ['rate<0.01'],
  },
};

// Budget example for a 300 ms p95 target:
// gateway 20 ms + service logic 60 ms + database 80 ms + downstream API 100 ms + slack 40 ms`
  ],
  "Security by Design": [
    "Security by design builds protection into architecture from the first sketch rather than adding it later: least privilege, defence in depth, secure defaults, strong identity, encryption in transit and at rest, and threat modelling. The cost of fixing a design flaw after release is far higher than preventing it.",
    "Core principles include zero trust between services, minimising attack surface, separation of duties, fail-safe defaults, auditability and keeping secrets out of code. Threat modelling methods such as STRIDE find weaknesses before code exists.",
    "Late security fixes are costly and incomplete, and breaches carry legal, financial and reputational damage.",
    "Apply it from the first design review of every system, especially for those handling personal or payment data, public APIs and multi-tenant platforms.",
    "Do not rely on a perimeter alone, roll your own cryptography, log sensitive data, or treat security as a final gate owned by one team.",
    "Run threat modelling workshops, authenticate with OAuth2 and OpenID Connect and mTLS between services, authorise at each service, store secrets in a vault, encrypt data, validate input, scan dependencies and images in CI, rotate credentials, and log security events centrally.",
    "Pros: fewer vulnerabilities, easier compliance. Cons: development friction, performance overhead of encryption and checks, and ongoing effort for patching and key management.",
    "Alternatives are reactive models (penetration test at the end, which finds issues late), and delegating to managed security services and platform guardrails, which complement rather than replace design work.",
    `Threat model template (per data flow)
Asset:            what must be protected
Entry points:     who or what can reach it
STRIDE check:     Spoofing, Tampering, Repudiation, Information disclosure, DoS, Elevation of privilege
Mitigation:       control chosen (authn, authz, encryption, rate limit, audit log)
Residual risk:    accepted by whom, until when`
  ],
  "Architecture Decision Records": [
    "An Architecture Decision Record is a short, immutable document capturing one significant decision: the context, the options considered, the decision and its consequences. ADRs preserve the why behind the architecture, so new team members and your future self do not have to guess or relitigate it.",
    "Each ADR has a title, status (proposed, accepted, superseded), context, decision and consequences, stored in the repository next to the code and numbered sequentially. A reversed decision gets a new ADR that supersedes the old one rather than editing history.",
    "Teams lose the reasoning behind choices as people leave, which leads to repeated debates and accidental reversals of sound decisions.",
    "Write one for decisions that are costly to reverse or affect several teams: database choice, messaging style, service boundaries, authentication approach, build versus buy.",
    "Do not write ADRs for trivial choices, write them after the fact with invented rationale, or turn them into long design documents nobody reads.",
    "Keep them in docs/adr in the repository, use a lightweight template, review them in pull requests, list the alternatives honestly with the reasons they lost, link them from the code or README, and mark superseded ones instead of deleting them.",
    "Pros: shared memory, faster onboarding, better decisions through writing. Cons: discipline needed, can become stale or bureaucratic if mandated for everything.",
    "Alternatives are wiki design pages (drift out of sync), RFC processes for larger cross-team proposals, and decision logs in tickets, which are hard to search.",
    `# ADR-007: Use Kafka for order events

Status: Accepted (supersedes ADR-003)
Date: 2026-02-10

## Context
Order, billing and shipping need to react to order changes. Peak load is 5k events per second and consumers must be able to replay.

## Options considered
1. RabbitMQ - simple routing, no native replay
2. Kafka - partitioned log, replay, higher operational cost
3. Direct REST calls - tight coupling, no buffering

## Decision
Use Kafka with the transactional outbox pattern for publishing.

## Consequences
+ Replay and independent consumer scaling
- Team needs Kafka operations skills; consumers must be idempotent
Revisit when: event volume stays below 500 per second for 6 months.`
  ],
  "Technical Debt Strategy": [
    "Technical debt is the future cost of shortcuts taken today, and a strategy treats it like financial debt: make it visible, classify it, pay the debt that charges the most interest first, and avoid taking reckless debt. The goal is a sustainable pace, not zero debt.",
    "Debt can be deliberate or accidental, prudent or reckless. Interest shows up as slower delivery, more defects and higher onboarding cost, while principal is the effort to fix it properly.",
    "Unmanaged debt slows every feature, increases incident rates and demoralises teams, yet stopping all work to fix it is rarely acceptable to the business.",
    "Use it continuously in planning, and especially before major features, after incidents, and when delivery speed drops noticeably.",
    "Do not hide it from product owners, rewrite wholesale without evidence, or label every disliked piece of code as debt.",
    "Keep a debt register with impact and cost-of-delay estimates, reserve a fixed share of capacity (for example 15 to 20 percent), apply the boy scout rule, tie refactors to upcoming features, track metrics such as change failure rate and cycle time, and use static analysis and quality gates to stop new debt entering.",
    "Pros: sustainable velocity, informed trade-offs with the business. Cons: capacity spent on non-feature work, and estimates of interest are approximate.",
    "Alternatives are dedicated debt sprints (visible but disruptive), continuous refactoring only (can starve large items), and strangler-style replacement for debt too large to refactor in place."
  ],
  "Legacy Modernisation Strategies": [
    "Modernise legacy systems incrementally rather than with a big-bang rewrite: use the strangler fig pattern to route functionality gradually to new components, wrap the old system behind an anti-corruption layer, and retire pieces as they are replaced. Delivery of value early and constant reversibility reduce risk.",
    "Common approaches are rehost (lift and shift), replatform, refactor, rearchitect, replace and retire. The strangler pattern intercepts calls through a facade or gateway and redirects them per feature to new code.",
    "Legacy systems are costly, hard to change and often hold critical business rules that are poorly documented, while big-bang rewrites regularly overrun and lose features.",
    "Use it when change lead time, risk or hosting costs have become unacceptable, or when platform end of life forces migration.",
    "Avoid a full rewrite with feature freeze, modernising without characterisation tests, or splitting into microservices without understanding the domain.",
    "Add characterisation tests, put a facade or gateway in front, extract by seam starting with the lowest-risk, high-value capability, use an anti-corruption layer and change data capture for data sync, run old and new in parallel, compare results, then cut over and decommission.",
    "Pros: incremental risk, continuous value, rollback possible. Cons: long period of running two systems, integration and data synchronisation complexity, and the need for sustained funding.",
    "Alternatives are lift and shift to cloud (fast, little modernisation), full rewrite (high risk), leaving it alone with containment, or replacing it with a commercial product.",
    `Client -> API gateway / facade
              |-- /orders/**   -> NEW order-service   (migrated)
              |-- /billing/**  -> NEW billing-service (migrated)
              |-- /**          -> LEGACY monolith     (remaining)
Legacy DB --CDC--> new service stores   (anti-corruption layer translates legacy models)
Steps: characterise -> route 1% -> compare -> route 100% -> delete legacy code`
  ],
  "Build vs Buy": [
    "Build what differentiates the business and buy what is a commodity, but judge on total cost of ownership, time to market, fit, lock-in and the team's capacity to maintain it. Buying is not free of engineering work, since integration, customisation and vendor management cost real effort.",
    "Evaluation covers capabilities against requirements, licence or usage cost over several years, integration effort, security and compliance, vendor viability, extensibility and exit options.",
    "Building commodity systems wastes engineering effort, while buying a core differentiator hands competitive advantage to a vendor and others.",
    "Decide at the start of any capability that exists in the market: identity, payments, search, observability, workflow, feature flags, e-signature.",
    "Do not build because of not-invented-here, buy based on a demo alone, or ignore the cost of maintenance and on-call for self-built tools.",
    "List must-have criteria, run a time-boxed proof of concept, compare three-year total cost including people, check data export and API quality, wrap the product behind your own interface to limit lock-in, and record the choice in an ADR.",
    "Build pros: perfect fit, control. Cons: slow, ongoing maintenance, opportunity cost. Buy pros: speed, vendor support. Cons: licence cost, lock-in, limited customisation and vendor roadmap risk.",
    "Alternatives are open source with commercial support, managed cloud services, and a hybrid where you buy the platform and build the differentiating layer on top."
  ],
  "Evolutionary Architecture and Fitness Functions": [
    "Evolutionary architecture is designed to change incrementally while keeping its key qualities, guarded by fitness functions: automated checks that continuously verify architectural characteristics such as dependency rules, latency, security and coupling. Instead of enforcing architecture by review meetings, the pipeline fails when it drifts.",
    "A fitness function is any mechanism that gives objective feedback on an architectural property, such as an ArchUnit test, a load test threshold, a cyclomatic complexity limit or a dependency vulnerability scan. They can be atomic (single check) or holistic (system-wide).",
    "Architecture erodes quietly as many people change code, and without automated checks the intended design exists only in diagrams.",
    "Use it in long-lived systems with several teams, during modernisation to protect new boundaries, and for qualities that matter such as performance and security.",
    "Do not write fitness functions for every preference, create brittle checks that fail on harmless changes, or use them as a substitute for design thinking.",
    "Identify the few characteristics that matter, express each as an automated test (ArchUnit for layering and cycles, k6 thresholds for latency, dependency checks for licences and CVEs), run them in CI, track the results over time, and revise them as architecture goals change.",
    "Pros: early drift detection, executable documentation, safer change. Cons: effort to maintain, false positives, and limited coverage for qualities that are hard to measure.",
    "Alternatives are manual architecture reviews and governance boards (slow, inconsistent), periodic audits, and static analysis dashboards without enforced thresholds.",
    `@ArchTest
static final ArchRule no_cycles =
    slices().matching("com.example.(*)..").should().beFreeOfCycles();

@ArchTest
static final ArchRule domain_is_pure =
    noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAnyPackage("org.springframework..", "jakarta.persistence..");`
  ],
  "OLTP vs OLAP": [
    "OLTP systems handle many small, concurrent transactions with strong consistency and low latency on normalised, row-oriented data, while OLAP systems run heavy analytical queries over large, historical, often denormalised column-oriented data. They have opposed workloads, so they are normally separated.",
    "OLTP is optimised for point reads and writes, short transactions and integrity (PostgreSQL, MySQL, Oracle). OLAP is optimised for scans, aggregations and joins across billions of rows (warehouses and column stores), usually loaded in batches or streams.",
    "Running analytics on the transactional database causes locks and resource contention that slow the user-facing system, and schemas good for transactions are poor for reporting.",
    "Separate them when reports or analytics grow beyond a few simple queries, when data from several sources must be combined, or when analytics affects production latency.",
    "Avoid building a warehouse for small data volumes where a read replica or a few materialised views suffice, and do not use an OLAP store for high-rate transactional writes.",
    "Move data from OLTP to OLAP with change data capture or batch ELT, model it as star schemas (facts and dimensions), partition by date, keep the OLTP schema normalised, and expose analytics through a separate store, with freshness expectations stated clearly.",
    "Pros: protected production latency, fast analytics, tailored schemas. Cons: data freshness lag, pipeline cost and complexity, duplicated data and governance overhead.",
    "Alternatives are read replicas, materialised views, HTAP databases that combine both workloads, and a data lake or lakehouse for semi-structured data."
  ],
  "Multi-Region Architecture": [
    "A multi-region architecture runs the system in more than one geographic region to survive regional outages and to serve users with lower latency, using active-passive or active-active designs. The hard part is data: replication across regions brings latency, conflicts and consistency trade-offs.",
    "Active-passive keeps a standby region ready for failover, with simple data flow and non-zero RPO. Active-active serves traffic from all regions, which needs conflict resolution, data partitioning by region or globally replicated stores.",
    "A single region is a single point of failure for severe outages, and distance adds latency for global users or data residency rules.",
    "Use it for tier-0 services with strict availability needs, global user bases, or regulations requiring data to stay in specific locations.",
    "Avoid it when multi-zone redundancy already meets the target, since multi-region multiplies cost, operations and data complexity, and do not adopt active-active if the data model cannot tolerate conflicts.",
    "Route with global DNS or an anycast load balancer and health checks, pin each user or tenant to a home region where possible, replicate data asynchronously with explicit conflict rules, keep configuration and deployments region-aware, avoid cross-region synchronous calls on the hot path, and rehearse failover.",
    "Pros: higher availability, lower latency, compliance options. Cons: high cost, eventual consistency or conflict handling, complex deployments and testing, and cross-region data transfer charges.",
    "Alternatives are multi-zone in one region, warm standby with backup and restore, CDN and edge caching for read-heavy global traffic, and cell-based architecture to limit blast radius."
  ],
  "Cost Optimisation (FinOps)": [
    "FinOps is the practice of making cloud cost visible, attributed and managed as an engineering concern: tag and allocate spend, right-size resources, use commitments and spot capacity, and design for cost as a quality attribute. The aim is value per pound or dollar spent, not simply lower spend.",
    "Main levers are right-sizing, scaling to demand, purchasing commitments (reserved or savings plans), spot or preemptible instances for tolerant work, storage tiering, reducing data transfer and removing idle resources.",
    "Cloud bills grow silently, and elastic infrastructure makes it easy for waste to accumulate with no clear owner.",
    "Use it continuously, with reviews after launches and at least monthly, and in design when comparing architectural options such as serverless against containers.",
    "Do not cut cost at the expense of reliability or SLOs, commit to long reservations before usage is stable, or leave spend unallocated to teams.",
    "Enforce tagging, show cost per team and per service, set budgets and anomaly alerts, right-size from utilisation metrics, autoscale including to zero in non-production, schedule dev environments off-hours, apply storage lifecycle rules, and track unit cost such as cost per thousand requests.",
    "Pros: lower spend and better accountability. Cons: engineering time, risk of over-optimising, commitments that reduce flexibility, and measurement difficulty for shared resources.",
    "Alternatives are central cost control by finance only (slow, no engineering context), reserved capacity everywhere, or moving to on-premises where steady predictable load makes it cheaper.",
    `# Typical optimisation checklist
1. Tag everything: team, service, environment
2. Right-size: p95 CPU < 30% for a week -> downsize
3. Autoscale: scale on requests or queue depth, scale non-prod to zero at night
4. Commit: cover the steady baseline with savings plans, burst on demand or spot
5. Storage: lifecycle hot -> infrequent -> archive; delete orphaned volumes and snapshots
6. Network: keep chatty services in the same zone, use a CDN for egress
7. Track unit cost: cost per 1,000 requests or per active customer`
  ]
};
