// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives]
const SERVICE_ANSWERS = {
  "IoC and Dependency Injection": [
    "Inversion of Control means the container, not your code, creates objects and wires their dependencies. In Spring that is dependency injection: prefer constructor injection, keep beans stateless, and let the ApplicationContext manage lifecycle.",
    "The Spring IoC container (ApplicationContext) instantiates beans from configuration, resolves their dependencies by type or qualifier, and injects them through constructors, setters or fields.",
    "Hard-wired new calls and static singletons couple classes together, make testing difficult and spread object creation everywhere. DI makes dependencies explicit and swappable.",
    "Use it for every service, repository and component in an application. It matters most when you have many collaborators, multiple implementations, or need mocks in tests.",
    "Do not turn every plain value object or entity into a bean, and avoid field injection and circular dependencies, which hide design problems and hurt testability.",
    "Declare a class with @Service and a final field set through a single constructor; Spring injects it without @Autowired. Use @Qualifier or @Primary when several beans of one type exist, and ObjectProvider for optional or lazy lookups.",
    "Pros: loose coupling, testability, central configuration. Cons: runtime wiring errors instead of compile-time, startup reflection cost, and magic that can be hard to trace.",
    "Alternatives are manual constructor wiring (clear, no framework), service locators (hidden dependencies), and other containers such as Guice, Dagger (compile-time) and Quarkus or Micronaut CDI."
  ],
  "Bean Lifecycle and Scopes": [
    "A bean is created, populated, initialised, used and destroyed under container control. The default scope is singleton, one instance per container, so beans must be thread-safe and stateless; prototype, request and session scopes cover other cases.",
    "Lifecycle: instantiate, inject dependencies, run Aware callbacks and BeanPostProcessors, call @PostConstruct or afterPropertiesSet, serve requests, then @PreDestroy on shutdown. Scopes define how many instances exist and for how long.",
    "Resources such as pools and caches need setup and cleanup at defined points, and different objects need different lifetimes, for example per request.",
    "Use @PostConstruct for initialisation after injection, @PreDestroy to release resources, and @Scope(request) or ObjectProvider for request-bound or per-use objects.",
    "Do not store mutable per-request state in a singleton. Avoid injecting a prototype into a singleton directly, because it is created only once; use ObjectProvider or a scoped proxy instead.",
    "Annotate a method with @PostConstruct, mark the bean @Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS), or use @Lazy to defer creation. @Bean(initMethod, destroyMethod) covers third-party classes.",
    "Pros: managed resources and flexible lifetimes. Cons: singleton thread-safety is the developer's job, scoped proxies add indirection, and lifecycle order can surprise when many callbacks are used.",
    "Alternatives are manual construction and try-with-resources for short-lived objects, factory methods, and Jakarta CDI scopes."
  ],
  "Java Configuration and @Bean": [
    "@Configuration classes with @Bean methods define beans in plain Java, giving type-safe, refactorable configuration. It is the standard way to register third-party objects and conditional beans.",
    "A @Configuration class is a source of bean definitions; each @Bean method returns an object that the container registers. Spring proxies the class (CGLIB) so calls between @Bean methods return the same singleton.",
    "XML configuration was verbose and unchecked by the compiler. Java configuration brings IDE support, conditions and ordinary code to wiring.",
    "Use it for classes you do not own (a DataSource, ObjectMapper, RestClient), for conditional wiring with @ConditionalOnProperty or @Profile, and for importing groups of beans with @Import.",
    "Do not use @Bean for your own classes when component scanning with @Service or @Component is simpler, and do not put business logic in configuration classes.",
    "Write @Configuration class AppConfig { @Bean RestClient restClient(RestClient.Builder b) { return b.baseUrl(url).build(); } }. Use proxyBeanMethods = false when methods do not call each other, which speeds startup.",
    "Pros: type-safe, flexible, testable. Cons: can become a long wiring class, and proxying has a small cost.",
    "Alternatives are component scanning with stereotype annotations, XML configuration (legacy), and Spring Boot auto-configuration for common infrastructure."
  ],
  "Spring AOP": [
    "Spring AOP applies cross-cutting behaviour such as transactions, security and logging by wrapping beans in proxies at method boundaries. It only intercepts calls that go through the proxy, so self-invocation and private or final methods are not advised.",
    "An aspect declares advice (@Before, @After, @Around) attached to pointcut expressions. Spring creates a JDK or CGLIB proxy around matching beans and runs the advice when methods are called from outside.",
    "Repeating logging, timing, auditing or transaction code in every method clutters business logic. AOP separates those concerns and applies them declaratively.",
    "Use it for transactions, security checks, metrics, auditing, retry and caching, typically through annotations like @Transactional and @Cacheable that rely on AOP internally.",
    "Do not use it for fine-grained logic that belongs in the code, or when you need to intercept private methods, constructors or field access, which needs full AspectJ weaving.",
    "Write @Aspect @Component class TimingAspect { @Around(execution(* com.app.service..*(..))) Object time(ProceedingJoinPoint p) throws Throwable { ... p.proceed() ... } } and enable it with @EnableAspectJAutoProxy, which Boot does automatically.",
    "Pros: removes duplication, declarative. Cons: proxy limitations (self-invocation), hidden behaviour that is hard to debug, and extra stack frames.",
    "Alternatives are decorators or explicit wrappers, servlet filters and interceptors for web concerns, and AspectJ compile-time or load-time weaving for full power."
  ],
  "Application Events": [
    "Spring's event mechanism lets beans publish and listen to events inside one application context, decoupling producers from consumers. By default listeners run synchronously on the publisher's thread, and @TransactionalEventListener ties them to transaction phases.",
    "ApplicationEventPublisher publishes any object as an event, and @EventListener methods receive it. The framework also publishes its own events such as ContextRefreshedEvent and ApplicationReadyEvent.",
    "Direct calls make one service know about every reaction to something happening. Events let new reactions be added without changing the publisher.",
    "Use them for in-process side effects like sending email after an order is saved, cache eviction, auditing, and starting work when the application is ready.",
    "Do not use them as a message broker: they are in-memory, not durable and not cross-service. Avoid hiding core business flow behind events, which makes it hard to follow.",
    "Inject ApplicationEventPublisher and call publishEvent(new OrderPlaced(id)). Listen with @EventListener, add @Async for asynchronous handling, and use @TransactionalEventListener(phase = AFTER_COMMIT) to avoid acting on rolled-back data.",
    "Pros: loose coupling, simple. Cons: synchronous by default, flow is implicit, no persistence or retry, and exceptions can affect the publisher.",
    "Alternatives are direct method calls, Kafka or RabbitMQ for cross-service events, the outbox pattern for reliable events, and Spring Modulith's event publication registry."
  ],
  "Spring Retry": [
    "Spring Retry adds declarative retry with backoff around methods that fail transiently, using @Retryable and @Recover. Use it for idempotent calls and always bound attempts and add backoff.",
    "The library intercepts annotated methods through AOP and re-invokes them according to a RetryPolicy and BackOffPolicy. RetryTemplate offers the same programmatically.",
    "Network calls, brokers and databases fail transiently, and hand-written retry loops are repetitive and often unbounded or lack backoff.",
    "Use it for idempotent operations such as calling an external API, acquiring a lock or sending to a flaky broker, combined with exponential backoff and jitter.",
    "Do not retry non-idempotent operations such as payments without idempotency keys, and do not retry on every exception, because permanent failures will just repeat. Beware multiplying retries across layers.",
    "Add @EnableRetry, then annotate with @Retryable(retryFor = IOException.class, maxAttempts = 3, backoff = @Backoff(delay = 200, multiplier = 2)) and provide a @Recover fallback. Newer Spring Framework versions add built-in retry support in the core.",
    "Pros: simple, declarative. Cons: proxy limitations such as self-invocation, retries amplify load during outages, and it lacks circuit-breaker features.",
    "Alternatives are Resilience4j Retry with circuit breaker and bulkhead, Failsafe, message-queue retries with dead-letter queues, and client-library built-in retry."
  ],
  "Spring Expression Language (SpEL)": [
    "SpEL is Spring's expression language for evaluating object graphs and logic at runtime, used in @Value, @Cacheable conditions, security annotations and bean definitions. It is powerful but should be used sparingly and never with untrusted input.",
    "SpEL supports property access, method calls, operators, collections, bean references and type operations, written between hash-brace delimiters or in annotation attributes.",
    "Configuration and annotations need small dynamic expressions, such as a cache key built from method arguments or a security rule referencing the current user.",
    "Use it in @Value(#{...}), @Cacheable(key = #id), @PreAuthorize(hasRole(ADMIN) and #user.id == authentication.principal.id), and @ConditionalOnExpression.",
    "Do not embed business logic in strings, since they are not type-checked or refactor-safe. Never evaluate expressions built from user input, which is a code-injection risk.",
    "Write @Value(#{systemProperties[user.region] ?: eu}) or use ExpressionParser parser = new SpelExpressionParser(); parser.parseExpression(name.length()).getValue(context). Use StandardEvaluationContext carefully and prefer SimpleEvaluationContext for untrusted data.",
    "Pros: concise and flexible. Cons: stringly typed, hard to debug, and a security risk if misused.",
    "Alternatives are plain Java code, @ConfigurationProperties for configuration, and custom key generators or security evaluators."
  ],

  "Spring Boot": [
    "Spring Boot is an opinionated layer over Spring that gives you auto-configuration, starter dependencies, an embedded server and production features like Actuator, so you can run a service with a single main method. It removes boilerplate, not Spring itself.",
    "A Boot application is started by SpringApplication.run, which creates the ApplicationContext, applies auto-configuration based on the classpath and properties, starts an embedded Tomcat, Jetty or Undertow, and produces an executable jar.",
    "Classic Spring needed large amounts of XML or Java configuration, separate server deployment and version management for dozens of libraries. Boot gives sensible defaults and a curated dependency set.",
    "Use it for virtually all new Spring services, microservices and APIs, and for any team that wants fast setup and consistent conventions.",
    "Be careful when you need extreme startup or memory limits (consider native image) or very custom container setups. Do not rely on auto-configuration you do not understand; read the conditions report when something surprises you.",
    "Create a class with @SpringBootApplication, add spring-boot-starter-web, configure with application.yml, and package with the Maven or Gradle plugin. Use --debug or the conditions report to see why beans were or were not created. Boot 3 needs Java 17 or later.",
    "Pros: fast development, convention over configuration, production-ready features. Cons: hidden magic, large dependency trees, and upgrade effort between major versions such as the javax to jakarta change in Boot 3.",
    "Alternatives are plain Spring Framework, Quarkus and Micronaut (faster startup, compile-time DI), Jakarta EE and MicroProfile, and Helidon."
  ],
  "Auto-configuration": [
    "Auto-configuration registers beans automatically when certain classes or properties are present, using conditions such as @ConditionalOnClass and @ConditionalOnMissingBean. Your own beans always win because most auto-configured beans back off.",
    "Boot reads a list of auto-configuration classes from META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports. Each class is a @Configuration guarded by conditions that inspect the classpath, properties and existing beans.",
    "Manual wiring of DataSource, Jackson, web servers and others was repetitive. Auto-configuration provides working defaults that you override only when needed.",
    "It applies whenever you add a starter. Know how to exclude one with @SpringBootApplication(exclude = ...) or spring.autoconfigure.exclude, and how to write your own for shared libraries.",
    "Do not fight it with copy-pasted configuration; define the bean you want and let the condition back off. Avoid writing company libraries that rely on component scanning instead of proper auto-configuration.",
    "Run with --debug to print the conditions evaluation report. To create your own, add an @AutoConfiguration class with @ConditionalOnMissingBean beans and list it in the imports file, with a @ConfigurationProperties class for settings.",
    "Pros: minimal configuration and consistent defaults. Cons: hard to trace when something is unexpectedly active or missing, and it can bloat startup.",
    "Alternatives are explicit Java configuration, @Import of chosen configurations, and compile-time frameworks like Micronaut."
  ],
  "Starters": [
    "Starters are curated dependency descriptors such as spring-boot-starter-web or -data-jpa that bring in a compatible set of libraries with one line. Boot's dependency management pins versions so they work together.",
    "A starter is a POM with no code that declares transitive dependencies, usually paired with an auto-configuration module. The Boot BOM manages versions of hundreds of libraries.",
    "Teams used to hunt for matching versions of Spring, Jackson, Hibernate and a driver by hand, which caused conflicts and subtle bugs.",
    "Use official starters for web, JPA, security, validation, test, actuator, and messaging, and create an internal starter to share company-wide configuration.",
    "Do not add a starter just in case; each one adds beans and startup time. Avoid overriding managed versions without reason, since it may break compatibility.",
    "Add spring-boot-starter-data-jpa and a driver, then configure spring.datasource.* properties. Exclude a transitive dependency such as Tomcat when you want Jetty: exclude spring-boot-starter-tomcat and add spring-boot-starter-jetty.",
    "Pros: easy, consistent, compatible. Cons: pulls in more libraries than you may need, and version overrides are risky.",
    "Alternatives are choosing individual dependencies manually with the Spring Boot BOM, and Gradle or Maven platforms for custom dependency sets."
  ],
  "Externalized Configuration": [
    "Boot loads configuration from many sources in a defined precedence: command line, environment variables, config files, then defaults. Bind it into typed @ConfigurationProperties classes, use profiles for environment differences, and keep secrets out of the repository.",
    "Properties come from application.properties or application.yml, profile-specific files, environment variables, system properties, command-line arguments, and config data imports. Relaxed binding maps names like MY_APP_URL to my.app.url.",
    "One build artifact must run in dev, test and production with different settings, without recompiling or editing the jar.",
    "Use @ConfigurationProperties for groups of settings, spring.profiles.active for environments, spring.config.import for external sources, and environment variables or secret managers in containers.",
    "Do not scatter @Value across the codebase for many settings, and never commit passwords. Avoid profile-specific logic in code; keep differences in configuration.",
    "Declare @ConfigurationProperties(prefix = app.mail) record MailProperties(String host, int port) {}, enable with @ConfigurationPropertiesScan, validate with @Validated, and override at runtime with SPRING_PROFILES_ACTIVE or --app.mail.host=....",
    "Pros: one artifact for all environments, typed and validated settings. Cons: precedence rules can confuse, many sources make debugging harder, and secrets need a separate solution.",
    "Alternatives are Spring Cloud Config, Kubernetes ConfigMaps and Secrets, HashiCorp Vault, AWS Parameter Store or Secrets Manager, and Azure App Configuration."
  ],
  "Actuator": [
    "Actuator exposes production endpoints for health, metrics, info, environment and more over HTTP or JMX, integrates with Micrometer and Kubernetes probes, and must be secured and limited to the endpoints you need.",
    "Adding spring-boot-starter-actuator registers endpoints such as /actuator/health, /metrics, /info, /loggers, /env, /prometheus (with the registry) and /heapdump. Health groups support liveness and readiness.",
    "Operating a service needs visibility: is it up, are dependencies healthy, what are the metrics, can log levels change without a restart.",
    "Use it in every production service for readiness and liveness probes, Prometheus scraping, dynamic log levels, and diagnostics.",
    "Do not expose all endpoints publicly: env, heapdump and loggers can leak data or allow changes. Do not make health checks slow or dependent on non-critical services.",
    "Set management.endpoints.web.exposure.include=health,info,prometheus, secure the rest with Spring Security, enable probes with management.endpoint.health.probes.enabled=true, and write custom HealthIndicator beans for dependencies.",
    "Pros: production visibility with little code. Cons: security risk if misconfigured, and extra overhead if too many checks.",
    "Alternatives are custom endpoints, Kubernetes native probes only, APM agents such as Datadog or New Relic, and OpenTelemetry."
  ],
  "GraalVM Native Image": [
    "Spring Boot can compile an application ahead-of-time into a native executable with GraalVM, giving very fast startup and low memory at the cost of long builds, closed-world limits on reflection and proxies, and some peak throughput.",
    "Spring AOT processing analyses the application at build time and generates code and hints for reflection, resources and proxies. The native-image tool then produces a standalone binary without a JVM.",
    "Serverless, scale-to-zero and dense container deployments suffer from slow JVM warm-up and larger memory footprint.",
    "Use it for functions and short-lived services, CLI tools, and workloads where startup time and memory cost dominate, after confirming library support.",
    "Avoid it when you rely heavily on dynamic features such as unregistered reflection or runtime class generation, when build time or debugging ease matters more, or when peak throughput is critical, where the JIT can be faster.",
    "Build with mvn -Pnative native:compile or spring-boot:build-image with BP_NATIVE_IMAGE=true, register extra hints with RuntimeHints or @RegisterReflectionForBinding, and test the native binary in CI with the native test support.",
    "Pros: milliseconds startup, lower memory, smaller attack surface. Cons: long slow builds, library compatibility hurdles, harder debugging and often lower peak performance than a warmed JVM.",
    "Alternatives are the regular JVM with CDS or AppCDS, Project Leyden improvements, CRaC checkpoint and restore, and Quarkus or Micronaut native builds."
  ],
  "Containerisation (Buildpacks and Docker)": [
    "Boot can build container images with Cloud Native Buildpacks (spring-boot:build-image) or a Dockerfile using layered jars. Layering and a lean JRE give fast, cacheable images.",
    "The Boot plugin produces layered jars that separate dependencies, loader and application code. Buildpacks create an optimised OCI image with a suitable JVM and memory settings without a Dockerfile.",
    "Naively copying a fat jar creates large images that rebuild completely on every code change and ignore container memory limits.",
    "Use buildpacks for simple standardised builds and a Dockerfile when you need full control, hardened base images or special tooling.",
    "Do not run as root, bake secrets into images, or ignore JVM container awareness. Avoid huge base images when slim ones exist.",
    "Run ./mvnw spring-boot:build-image, or in a Dockerfile extract layers with java -Djarmode=tools extract --layers and copy each layer separately. Set resource limits and use health probes from Actuator.",
    "Pros: reproducible, cached, and easy images. Cons: buildpacks are less transparent and customisation is more limited than a Dockerfile.",
    "Alternatives are Jib (no Docker daemon), plain Dockerfiles, Podman and Buildah, and native image containers."
  ],
  "Spring Boot DevTools": [
    "DevTools improves the development loop with automatic restart on classpath change, LiveReload and sensible dev defaults. It is excluded from production by design.",
    "It uses two classloaders so only your changed classes restart, applies development property defaults such as disabling template caching, and can enable remote update.",
    "Restarting a full application by hand after each change wastes time during development.",
    "Use it locally in the IDE or with a build watcher for web applications.",
    "Do not ship it in production; it is not packaged in repackaged jars by default. Avoid relying on it in CI. Classloader restarts can break libraries that hold onto classes.",
    "Add spring-boot-devtools as an optional or developmentOnly dependency, rebuild in the IDE to trigger a restart, and configure triggers or exclusions through spring.devtools.restart properties.",
    "Pros: fast feedback. Cons: classloader quirks and an occasional stale state requiring a manual restart.",
    "Alternatives are JRebel and HotswapAgent, IDE hot-swap, and frontend dev servers with hot reload."
  ],

  "Spring MVC": [
    "Spring MVC is the servlet-based web framework built around the DispatcherServlet front controller, which maps requests to controller methods, binds data, invokes handlers and renders views or message-converted bodies.",
    "A request goes through filters, the DispatcherServlet, HandlerMapping, HandlerAdapter and the controller method, with argument resolvers, validation and HttpMessageConverters, then back through interceptors and the response writer.",
    "Raw servlets mix routing, parsing and rendering. MVC separates them, handles content negotiation and gives annotation-driven controllers.",
    "Use it for blocking, thread-per-request web applications and REST APIs, which is the majority of enterprise services, now also with virtual threads.",
    "Choose WebFlux instead for very high concurrency non-blocking streaming workloads. Avoid heavy logic in controllers; they should delegate to services.",
    "Write @Controller or @RestController classes with @GetMapping and @PostMapping methods, use @RequestParam, @PathVariable and @RequestBody for input, and add interceptors or filters for cross-cutting web concerns.",
    "Pros: mature, simple blocking model, rich ecosystem. Cons: one thread per request without virtual threads, and a large API surface.",
    "Alternatives are Spring WebFlux, JAX-RS (Jersey, RESTEasy), Micronaut or Quarkus web layers, and Javalin."
  ],
  "REST Controllers": [
    "A @RestController combines @Controller and @ResponseBody, returning objects serialised to JSON. Good REST design uses proper HTTP verbs and status codes, DTOs instead of entities, validation, and versioning.",
    "Handler methods map HTTP methods and paths with @GetMapping, @PostMapping and similar, take typed inputs, and return values written by HttpMessageConverters (Jackson for JSON) or a ResponseEntity for full control.",
    "Services need a consistent way to expose resources over HTTP without manual servlet code.",
    "Use it for public and internal APIs: resource-oriented paths, pagination, proper status codes (201 with Location, 204, 404, 409) and idempotent PUT and DELETE.",
    "Do not expose JPA entities directly, put business logic in controllers, or return 200 with an error body. Avoid verbs in URLs and breaking changes without versioning.",
    "Write @RestController @RequestMapping(/api/orders) class OrderController { @PostMapping ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrder req) { ... return ResponseEntity.created(uri).body(dto); } }. Document with springdoc-openapi.",
    "Pros: simple and widely understood. Cons: over-fetching and chatty APIs, and manual versioning discipline.",
    "Alternatives are GraphQL, gRPC for internal calls, Spring Data REST for quick CRUD, and RPC-style endpoints."
  ],
  "Exception Handling and ProblemDetail": [
    "Centralise error handling with @RestControllerAdvice and @ExceptionHandler, and return the RFC 7807 ProblemDetail format so clients get consistent structured errors. Never leak stack traces.",
    "@ControllerAdvice classes apply handlers across controllers. ProblemDetail (Spring 6) is a standard JSON error body with type, title, status, detail and instance, produced by ResponseEntityExceptionHandler for built-in exceptions.",
    "Without it, each controller catches exceptions differently, status codes are inconsistent and internal details leak to clients.",
    "Use it in every API: map domain exceptions to 404, 409 or 422, validation failures to 400 with field errors, and unexpected ones to 500 with a correlation id.",
    "Do not use exceptions for normal control flow, swallow exceptions silently, or return exception messages that reveal internals.",
    "Create @RestControllerAdvice class ApiErrors extends ResponseEntityExceptionHandler { @ExceptionHandler(OrderNotFound.class) ProblemDetail notFound(OrderNotFound e) { return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage()); } }, and enable spring.mvc.problemdetails.enabled=true.",
    "Pros: consistent errors and clean controllers. Cons: handler ordering and precedence need care, and a custom schema may still be needed for client contracts.",
    "Alternatives are per-controller try/catch, ResponseStatusException for simple cases, and custom error DTOs."
  ],
  "Validation (Bean Validation)": [
    "Spring integrates Jakarta Bean Validation so you declare constraints like @NotNull, @Size and @Email on DTOs and trigger them with @Valid or @Validated. Validate at the boundary and return structured 400 responses.",
    "Constraint annotations are checked by a Validator (Hibernate Validator). In controllers @Valid on a request body validates it, @Validated on a class enables method validation, and groups allow different rule sets.",
    "Manual null and range checks are repetitive and inconsistent. Declarative constraints keep rules next to the data.",
    "Use it for request DTOs, configuration properties, and service method parameters, with custom constraint annotations for domain rules.",
    "Do not rely on it for rules needing database state or cross-aggregate checks, which belong in the service layer. Do not validate JPA entities as the only input check.",
    "Write record CreateUser(@NotBlank String name, @Email String email, @Min(18) int age) {} and use @Valid @RequestBody. Handle MethodArgumentNotValidException in the advice, and add @Constraint with a ConstraintValidator for custom rules.",
    "Pros: declarative and reusable. Cons: error messages need work, groups can get complex, and runtime-only checks.",
    "Alternatives are manual validation in services, Spring Validator interface, and domain value objects that validate in their constructors."
  ],
  "RestClient and WebClient": [
    "RestClient (Spring 6.1) is the modern synchronous HTTP client with a fluent API, replacing RestTemplate, and WebClient is the reactive, non-blocking one. Configure timeouts, retries and error handling explicitly.",
    "Both build requests fluently, send them through a pluggable HTTP library, and decode responses with message converters. RestClient blocks, WebClient returns Mono and Flux.",
    "RestTemplate was in maintenance mode with a clumsy API. Newer clients give a fluent style, better error handling and, for WebClient, non-blocking calls.",
    "Use RestClient in normal blocking services (including with virtual threads) and WebClient in reactive pipelines or when fanning out many calls concurrently.",
    "Do not call block() on WebClient inside reactive code, and do not skip timeouts, which causes hanging threads. Avoid creating a new client per request.",
    "Create one client from RestClient.Builder with baseUrl and a request factory with connect and read timeouts, then call restClient.get().uri(/users/{id}, id).retrieve().body(User.class). Handle errors with onStatus.",
    "Pros: fluent, flexible, testable. Cons: timeouts, retries and resilience must be added, and reactive types have a learning curve.",
    "Alternatives are declarative HTTP interfaces (@HttpExchange), OpenFeign, RestTemplate (legacy), Apache HttpClient and java.net.http.HttpClient."
  ],
  "Spring WebFlux": [
    "WebFlux is the reactive, non-blocking web stack built on Reactor, using Mono and Flux over Netty or other reactive servers. It shines for high concurrency streaming I/O but requires non-blocking code end to end.",
    "Requests are handled by a small event-loop thread pool, handlers return Mono or Flux, and operators describe data flow with backpressure support. It supports annotated controllers and functional routes.",
    "Thread-per-request limits scalability for large numbers of slow or streaming connections. Reactive code uses few threads to handle many concurrent operations.",
    "Use it for streaming APIs, server-sent events, gateways, and services calling many remote systems with reactive drivers.",
    "Avoid it when you use blocking JDBC or libraries, when the team is not experienced in reactive programming, or when virtual threads with MVC meet your needs. One blocking call can stall an event loop.",
    "Return Mono<User> or Flux<Event> from controllers, use WebClient and reactive drivers (R2DBC, reactive Mongo), test with StepVerifier, and detect blocking calls with BlockHound.",
    "Pros: high concurrency with few threads, streaming and backpressure. Cons: steep learning curve, harder debugging and stack traces, and a fully reactive stack is required.",
    "Alternatives are Spring MVC with virtual threads (simpler), Vert.x, Quarkus reactive, Kotlin coroutines and Akka HTTP."
  ],
  "Spring GraphQL": [
    "Spring for GraphQL provides schema-first GraphQL support on top of graphql-java, with annotated controllers and batch loading. It lets clients ask for exactly the fields they need, but you must handle the N+1 problem and query cost.",
    "You define a schema file, and @QueryMapping, @MutationMapping and @SchemaMapping methods resolve fields. @BatchMapping and DataLoader batch child lookups, and subscriptions stream updates.",
    "REST can over-fetch or under-fetch for varied clients such as mobile and web. GraphQL gives one flexible endpoint with typed queries.",
    "Use it when many client types need different shapes of related data, or for a backend-for-frontend layer aggregating services.",
    "Avoid it for simple CRUD APIs, file transfer, or when caching by URL is important. Unbounded queries can overload the server without depth and complexity limits.",
    "Add spring-boot-starter-graphql, place schema.graphqls under src/main/resources/graphql, write @Controller methods with @QueryMapping, use @BatchMapping to avoid N+1, and secure with Spring Security and query depth limits.",
    "Pros: precise queries, strong typing, one endpoint. Cons: caching is harder, N+1 and abuse risks, and more complexity than REST.",
    "Alternatives are REST with sparse fieldsets, gRPC, OData, and Netflix DGS framework."
  ],
  "WebSocket and STOMP": [
    "WebSocket gives a persistent two-way connection, and STOMP adds a simple messaging protocol with destinations and subscriptions on top. Use it for live updates, with a broker relay when scaling out.",
    "Spring supports raw WebSocket handlers and STOMP over WebSocket with @MessageMapping controllers and a simple in-memory or external broker such as RabbitMQ.",
    "HTTP polling is wasteful and slow for chat, dashboards and notifications. Persistent connections push data as it happens.",
    "Use it for live dashboards, chat, collaborative editing and notifications, with SockJS fallback only where needed.",
    "Avoid it when server-sent events or simple polling are enough, and be careful with scaling, since connections are stateful and need sticky sessions or an external broker.",
    "Add spring-boot-starter-websocket, configure @EnableWebSocketMessageBroker with endpoints and broker prefixes, handle messages with @MessageMapping and @SendTo, and secure the handshake and channels.",
    "Pros: low latency two-way communication. Cons: stateful connections, scaling and security complexity, and proxies or timeouts may drop connections.",
    "Alternatives are Server-Sent Events, long polling, Kafka or MQTT for devices, and managed services such as AWS API Gateway WebSockets."
  ],
  "Spring HATEOAS": [
    "Spring HATEOAS helps build hypermedia-driven REST APIs where responses carry links to related actions. It is rarely used in practice, but good to know as the top level of REST maturity.",
    "It provides RepresentationModel, EntityModel and CollectionModel types plus a WebMvcLinkBuilder to produce links, and supports formats such as HAL.",
    "True REST says clients should discover actions from links instead of hardcoding URLs, reducing coupling to server URL structure.",
    "Use it when an API has long-lived varied clients that benefit from navigable links and state transitions.",
    "Avoid it for typical internal APIs or when clients already know the URL contract; it adds payload and complexity that many teams never exploit.",
    "Return EntityModel.of(order, linkTo(methodOn(OrderController.class).get(id)).withSelfRel()) and add links for allowed actions such as cancel.",
    "Pros: discoverability and loose URL coupling. Cons: extra complexity and payload, with low practical adoption.",
    "Alternatives are plain JSON with documented URLs and OpenAPI, GraphQL, and JSON:API."
  ],

  "Transaction Management": [
    "Spring manages transactions declaratively with @Transactional, implemented through AOP proxies. Know propagation, isolation, rollback rules (runtime exceptions only by default) and the self-invocation trap.",
    "A transaction manager (JpaTransactionManager, DataSourceTransactionManager) is bound to the thread. @Transactional wraps the method in a proxy that begins, commits or rolls back, with propagation controlling joining or creating transactions.",
    "Manual commit and rollback code is repetitive and error-prone, and mixing it with business logic hurts clarity.",
    "Use it on service methods that must treat several operations atomically, with readOnly = true for queries to enable optimisations.",
    "Do not call a @Transactional method from within the same class and expect the proxy to apply, do not put it on private methods, and avoid long transactions spanning remote calls. Checked exceptions do not roll back unless you say so.",
    "Annotate service methods, for example @Transactional(rollbackFor = Exception.class, propagation = REQUIRED, isolation = READ_COMMITTED). Use REQUIRES_NEW for independent audit writes, and TransactionTemplate for programmatic control.",
    "Pros: declarative, consistent. Cons: proxy pitfalls, accidental long transactions, lazy-loading and open-session issues, and no distributed transaction support by default.",
    "Alternatives are TransactionTemplate, JTA and XA for distributed cases, saga or outbox patterns across services, and database stored procedures."
  ],
  "Spring Data JPA": [
    "Spring Data JPA generates repository implementations from interfaces, giving CRUD, derived queries, paging and projections on top of Hibernate. Watch for N+1 queries, lazy loading outside transactions and exposing entities.",
    "You extend JpaRepository<Entity, Id>, and Spring creates a proxy implementing it. Method names, @Query, Specifications and Querydsl define queries, and Pageable and Sort add paging.",
    "Writing DAO boilerplate for every entity is repetitive. Repositories remove it while still allowing custom queries.",
    "Use it for relational CRUD-heavy applications with a domain model, with projections or DTO queries for read-heavy screens.",
    "Avoid it when you need complex reporting or bulk operations (use SQL, jOOQ or JdbcTemplate), and do not let entities leak into the API layer or rely on open-in-view.",
    "Declare interface OrderRepository extends JpaRepository<Order, Long> { List<Order> findByStatusOrderByCreatedDesc(Status s); @Query(select o from Order o join fetch o.items where o.id = :id) Optional<Order> withItems(Long id); }. Use @EntityGraph and batch fetching to avoid N+1.",
    "Pros: productivity and less boilerplate. Cons: hidden SQL, N+1 problems, lazy-loading surprises and tuning needs.",
    "Alternatives are JdbcTemplate or JdbcClient, jOOQ, MyBatis, Spring Data JDBC (simpler aggregate model), and plain Hibernate."
  ],
  "Spring Cache": [
    "Spring's cache abstraction caches method results with @Cacheable, @CachePut and @CacheEvict over a pluggable provider such as Caffeine or Redis. Decide keys, TTL, eviction and consistency deliberately.",
    "Annotated methods are proxied. On a call the cache is checked by a key (from arguments or SpEL), and on a miss the method runs and the result is stored. CacheManager supplies the provider.",
    "Repeating expensive database or remote calls costs latency and load. Caching reduces both with minimal code.",
    "Use it for read-heavy, rarely changing data like reference data, configuration and computed results, with local Caffeine for speed or Redis for sharing across instances.",
    "Avoid caching data that changes constantly or needs strict consistency, large uncontrolled objects, or user-specific data without proper keys. Self-invocation bypasses the proxy.",
    "Add @EnableCaching, annotate @Cacheable(cacheNames = products, key = #id) on a method, evict with @CacheEvict on updates, and configure Caffeine with maximumSize and expireAfterWrite in properties.",
    "Pros: simple and fast. Cons: stale data, cache stampede, memory use, invalidation complexity and proxy limitations.",
    "Alternatives are manual caching with Caffeine or Guava, Redis directly, Hibernate second-level cache, HTTP caching and CDNs."
  ],
  "Database Migrations (Flyway and Liquibase)": [
    "Flyway and Liquibase version the database schema as code, run automatically at startup and track what has been applied. They give repeatable, reviewable and consistent schema changes across environments.",
    "Flyway runs ordered SQL or Java migrations and records them in a history table; Liquibase uses changelogs in XML, YAML or SQL with changesets. Boot auto-configures either when found on the classpath.",
    "Manual schema scripts drift between environments and are easily forgotten. Hibernate ddl-auto update is unsafe for production.",
    "Use one in every service with a relational database, running migrations in the pipeline or at startup, with backward-compatible changes for zero-downtime deploys.",
    "Do not edit applied migrations, rely on ddl-auto in production, or make destructive changes in one step. Avoid long locking migrations on large tables without a plan.",
    "Add the flyway-core dependency, place V1__init.sql, V2__add_index.sql under db/migration, set spring.jpa.hibernate.ddl-auto=validate, and use the expand and contract pattern for breaking changes.",
    "Pros: reproducible schema, audit trail, team workflow. Cons: rollbacks are manual, ordering conflicts in branches, and long migrations can block.",
    "Alternatives are manual DBA scripts, Hibernate schema generation (development only), and tools such as dbmate or Atlas."
  ],
  "JdbcTemplate and JdbcClient": [
    "JdbcTemplate and the newer fluent JdbcClient (Spring 6.1) run SQL directly while handling connections, statements and exceptions. They are ideal when you want full SQL control without an ORM.",
    "They acquire connections from the DataSource, execute parameterised SQL, map rows with RowMapper, and translate SQLExceptions into the DataAccessException hierarchy.",
    "Plain JDBC needs verbose try, catch and close code. These helpers remove it and keep SQL visible.",
    "Use them for reporting queries, bulk updates, simple services and performance-sensitive paths where ORM overhead or magic is unwanted.",
    "Avoid hand-writing large amounts of mapping code for complex object graphs; an ORM or jOOQ may fit better. Never concatenate user input into SQL.",
    "Write jdbcClient.sql(select * from users where id = :id).param(id).query(User.class).optional(). For batches use batchUpdate, and combine with @Transactional.",
    "Pros: control, performance, transparent SQL. Cons: manual mapping and SQL maintenance, and no relationship management.",
    "Alternatives are Spring Data JPA, jOOQ, MyBatis, Spring Data JDBC and Hibernate native queries."
  ],
  "Spring Data MongoDB": [
    "Spring Data MongoDB provides repositories, MongoTemplate and mapping for document databases. Model documents for access patterns, and remember transactions and joins differ from relational systems.",
    "Documents are mapped to classes with @Document, repositories derive queries from method names, and MongoTemplate offers a fluent query and aggregation API. Reactive support is also available.",
    "Some data is hierarchical or schema-flexible and fits poorly into tables. A document store keeps it together and evolves easily.",
    "Use it for aggregates read as a whole, content or catalogue data, event or log style data, and rapidly changing schemas.",
    "Avoid it when you need rich multi-entity transactions and joins, strict relational integrity, or complex reporting across collections.",
    "Declare @Document class Product { @Id String id; ... }, interface ProductRepository extends MongoRepository<Product, String>, and use indexes via @Indexed and aggregation pipelines through MongoTemplate.",
    "Pros: flexible schema, natural aggregates. Cons: weaker relationships, duplicated data, and consistency trade-offs.",
    "Alternatives are relational databases with JSONB (PostgreSQL), DynamoDB, Cosmos DB, Couchbase and Elasticsearch."
  ],
  "Spring Data Redis": [
    "Spring Data Redis wraps Redis clients (Lettuce by default) with RedisTemplate, repositories and pub/sub support. Common uses are caching, sessions, rate limiting and distributed locks, with attention to serialisation and TTL.",
    "RedisConnectionFactory manages connections, RedisTemplate and StringRedisTemplate perform operations on strings, hashes, lists, sets and sorted sets, and a RedisCacheManager backs Spring Cache.",
    "Applications need a fast shared in-memory store for cache, counters and transient state across instances.",
    "Use it for distributed caching, session storage, leaderboards with sorted sets, rate limiting and short-lived data.",
    "Avoid using it as a primary durable database without a persistence plan, or storing huge values. Do not forget TTLs, which cause memory growth.",
    "Configure spring.data.redis.host, use StringRedisTemplate.opsForValue().set(key, value, ttl), choose JSON serialisers, and use RedisCacheManager with per-cache TTL. Use Redisson for advanced locks.",
    "Pros: very fast, versatile data structures. Cons: memory cost, durability and consistency limits, and cluster complexity.",
    "Alternatives are Caffeine for local cache, Memcached, Hazelcast, Ignite, and managed caches such as ElastiCache and Azure Cache."
  ],
  "Spring Data R2DBC": [
    "R2DBC offers non-blocking relational database access for reactive applications, with repositories returning Mono and Flux. It has fewer ORM features than JPA and only makes sense in an end-to-end reactive stack.",
    "R2DBC drivers provide a reactive SPI; Spring Data R2DBC maps rows to simple entities and supports repositories and DatabaseClient without lazy loading or relationships.",
    "Blocking JDBC cannot be used in a reactive stack without stalling event loops, so a non-blocking driver is needed.",
    "Use it with WebFlux when the whole path is reactive and the data model is simple.",
    "Avoid it with MVC or when you need complex mappings; JPA with virtual threads is often simpler now. It has limited tooling and driver maturity compared with JDBC.",
    "Add spring-boot-starter-data-r2dbc and a driver, define interface UserRepository extends ReactiveCrudRepository<User, Long>, and use TransactionalOperator for transactions.",
    "Pros: non-blocking end to end. Cons: no relationships or lazy loading, smaller ecosystem and complexity.",
    "Alternatives are JPA or JDBC with virtual threads, jOOQ with reactive support, and reactive NoSQL drivers."
  ],
  "Spring Data REST": [
    "Spring Data REST exposes repositories automatically as hypermedia REST endpoints. It is quick for prototypes but risky for production, since it exposes the persistence model directly.",
    "It scans Spring Data repositories and creates endpoints for CRUD, search and relationships, using HAL for links.",
    "Writing controllers for pure CRUD is repetitive and Data REST generates them.",
    "Use it for internal tools, admin back-ends and prototypes where the API can mirror the domain model.",
    "Avoid it for public or long-lived APIs, where you need to control the contract, hide fields, apply business rules and version independently from the database model.",
    "Add spring-boot-starter-data-rest, annotate repositories with @RepositoryRestResource, and restrict exposure with @RestResource(exported = false) and projections.",
    "Pros: no controller code. Cons: leaks internal model, limited control, and coupling to persistence.",
    "Alternatives are hand-written REST controllers with DTOs, GraphQL, and code generation from OpenAPI."
  ]
};
