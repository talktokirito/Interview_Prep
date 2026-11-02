// Continuation of spring-answers.js. Same entry shape:
// [interview summary, what, why, when, when not, how, trade-offs, alternatives]
Object.assign(SERVICE_ANSWERS, {
  "Spring Security": [
    "Spring Security is a filter-chain based framework for authentication, authorisation and attack protection. You define a SecurityFilterChain bean, use a strong password encoder, secure every endpoint by default, and understand CSRF, CORS and session handling.",
    "A chain of servlet filters (behind DelegatingFilterProxy) authenticates requests through AuthenticationManager and providers, stores the result in the SecurityContext, then authorises access with rules. It also adds protections such as CSRF, headers and session fixation defence.",
    "Hand-rolled security is easy to get wrong and misses subtle attacks. A battle-tested framework provides consistent authentication, authorisation and protection.",
    "Use it for any application that has users or protected resources, from session-based web apps to stateless JWT APIs.",
    "Do not disable CSRF or security without understanding the consequences, store plain-text passwords, or write custom crypto. Avoid the removed WebSecurityConfigurerAdapter style from old tutorials.",
    "Define @Bean SecurityFilterChain filterChain(HttpSecurity http) { http.authorizeHttpRequests(a -> a.requestMatchers(/public/**).permitAll().anyRequest().authenticated()).oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults())); return http.build(); }. Use PasswordEncoder (BCrypt via DelegatingPasswordEncoder) and test with spring-security-test.",
    "Pros: comprehensive, extensible, standards-based. Cons: steep learning curve, deep configuration, and misconfiguration risk.",
    "Alternatives are Apache Shiro, gateway-level or service-mesh security, Keycloak or other identity providers for authentication, and cloud IAM for service-to-service access."
  ],
  "OAuth2 and JWT": [
    "OAuth2 delegates authorisation to an identity provider, and JWTs are signed tokens that APIs verify without calling the provider on every request. Use short-lived access tokens, validate issuer, audience and signature, and never store tokens in places scripts can read.",
    "Spring Security can act as an OAuth2 client (login with a provider), a resource server (validate bearer JWTs from an issuer-uri), or with Spring Authorization Server as the provider. The resource server fetches the provider's keys (JWKS) and checks signature, expiry and claims.",
    "Sharing passwords between systems and keeping server-side sessions does not scale across services. Tokens let a central provider authenticate and services authorise statelessly.",
    "Use it for APIs and microservices behind an identity provider such as Keycloak, Okta, Entra ID or Auth0, and for single sign-on.",
    "Avoid JWTs as long-lived sessions you cannot revoke, putting sensitive data in claims, or building your own provider when a proven one exists. Do not use the implicit flow; use authorization code with PKCE.",
    "Add spring-boot-starter-oauth2-resource-server, set spring.security.oauth2.resourceserver.jwt.issuer-uri, map scopes or roles with a JwtAuthenticationConverter, and use @PreAuthorize(hasAuthority(SCOPE_orders.read)). For login use spring-boot-starter-oauth2-client.",
    "Pros: standard, stateless, single sign-on. Cons: token revocation is hard, claim and scope design needs care, and several flows to understand.",
    "Alternatives are session cookies with server-side state, opaque tokens with introspection, API keys, mutual TLS, and SAML for enterprise federation."
  ],
  "Method Security": [
    "Method security applies authorisation rules directly on service methods with @PreAuthorize and @PostAuthorize, using SpEL against the current user and arguments. It provides defence in depth beyond URL rules.",
    "With @EnableMethodSecurity, calls to annotated beans go through an AOP proxy that evaluates the expression before or after invocation and can filter collections with @PostFilter.",
    "URL-based rules alone miss cases where the same service is reachable by different paths, or where access depends on the data, such as owning the order.",
    "Use it for fine-grained and data-dependent rules, like only the owner or an admin may update an order.",
    "Avoid long, complex expressions in annotations and do not rely on it alone; combine with URL rules. Self-invocation bypasses the proxy, and it adds cost on hot paths.",
    "Write @PreAuthorize(hasRole(ADMIN) or #order.ownerId == authentication.name) on a service method, enable with @EnableMethodSecurity, and extract complex logic to a bean referenced as @orderSecurity.canView(#id).",
    "Pros: close to business logic and expressive. Cons: proxy caveats, stringly-typed expressions, and scattered rules.",
    "Alternatives are URL authorisation in the filter chain, explicit checks in code, and policy engines such as OPA or Cedar."
  ],
  "Spring Authorization Server": [
    "Spring Authorization Server is a framework for building your own OAuth 2.1 and OpenID Connect provider. Use it when you must own the identity layer; otherwise a managed provider such as Keycloak or Okta is usually cheaper to run.",
    "It implements the protocol endpoints (authorize, token, JWKS, introspection, OIDC discovery) on Spring Security, with registered clients, consent and token customisation you configure.",
    "After the original Spring Security OAuth project was retired, there was a need for an officially supported way to build a provider in Spring.",
    "Use it for custom identity requirements, embedded provider in a product, or when you need full control over tokens and flows.",
    "Avoid it for standard login needs where an existing identity provider fits; running your own provider means owning security, upgrades and compliance.",
    "Add the dependency, define a RegisteredClientRepository, configure a SecurityFilterChain for the authorization server endpoints, supply signing keys through a JWKSource, and customise tokens with an OAuth2TokenCustomizer.",
    "Pros: full control and Spring-native. Cons: you are responsible for secure operation, key rotation and protocol conformance.",
    "Alternatives are Keycloak, Okta, Auth0, Entra ID, AWS Cognito and Ory."
  ],
  "Spring Session": [
    "Spring Session externalises HTTP session storage to Redis, JDBC or others so sessions survive restarts and are shared across instances. Prefer stateless tokens for APIs and use it when you need server-side sessions at scale.",
    "A filter replaces the servlet container's session with an implementation backed by a SessionRepository, and the session id is sent through a cookie or header.",
    "In-memory sessions are lost on restart and require sticky load balancing, which hampers scaling and rolling deployments.",
    "Use it for server-rendered applications or APIs relying on sessions behind multiple instances.",
    "Avoid it if you can be stateless with tokens, and do not store large objects in sessions. Remember the shared store becomes a critical dependency.",
    "Add spring-session-data-redis, set spring.session.timeout, and keep session attributes small and serialisable. Secure cookies with HttpOnly, Secure and SameSite settings.",
    "Pros: scalable sessions, survives restarts. Cons: extra infrastructure, serialisation concerns, and latency per request.",
    "Alternatives are stateless JWT, sticky sessions, Hazelcast or Tomcat clustering, and gateway-managed sessions."
  ],

  "Spring Cloud": [
    "Spring Cloud is an umbrella of projects for distributed systems patterns on top of Boot: configuration, discovery, gateway, resilience, messaging and tracing. Many of its original components are now covered by Kubernetes and service meshes.",
    "It provides abstractions and integrations such as Config, Gateway, LoadBalancer, CircuitBreaker, OpenFeign and Stream, versioned as release trains that must match the Boot version.",
    "Distributed systems face repeated problems: central config, finding services, routing, failures and tracing. Spring Cloud packages common solutions for Java services.",
    "Use it when you run Spring microservices, especially outside Kubernetes or when you want application-level control of resilience and routing.",
    "Avoid layering it over a platform that already does the job, for example Eureka on Kubernetes where service DNS exists. Do not start with microservices when a modular monolith would do.",
    "Import the spring-cloud-dependencies BOM matching your Boot version, add the specific starters you need, and configure them through application properties. Check the release train compatibility matrix on upgrade.",
    "Pros: consistent Spring-style tooling for distributed patterns. Cons: version coupling, overlap with platform features, and operational complexity.",
    "Alternatives are Kubernetes plus Istio or Linkerd, Envoy gateways, cloud-native services (API Gateway, App Mesh), Quarkus or Micronaut equivalents, and Dapr."
  ],
  "Spring Cloud Gateway": [
    "Spring Cloud Gateway is the API gateway built on Spring, routing requests to backends using predicates and filters for concerns like authentication, rate limiting, path rewriting and circuit breaking. It is the single entry point for clients.",
    "Routes are defined with an id, a target URI, predicates (path, header, method) and filters (RewritePath, RequestRateLimiter, CircuitBreaker). The reactive version runs on WebFlux and Netty, and a servlet-based MVC variant also exists.",
    "Clients should not know each service's address, and cross-cutting rules like auth, throttling and CORS should not be duplicated in every service.",
    "Use it as the edge for microservices: routing, token validation, rate limiting, request logging and aggregation of cross-cutting concerns.",
    "Avoid putting business logic in the gateway, or adding a gateway when a managed one (AWS API Gateway, Kong, NGINX, Envoy) already fits. Do not block in reactive filters.",
    "Configure spring.cloud.gateway.routes in YAML with predicates Path=/orders/** and filters such as RequestRateLimiter backed by Redis, or define a RouteLocator bean in Java. Add a global filter for correlation ids.",
    "Pros: Spring-native, programmable, reactive. Cons: single point of failure if not scaled, reactive learning curve, and overlap with infrastructure gateways.",
    "Alternatives are Kong, NGINX, Envoy, Traefik, cloud API gateways, Zuul 1 (legacy) and service meshes."
  ],
  "Circuit Breaker (Resilience4j)": [
    "A circuit breaker stops calling a failing dependency after errors cross a threshold, failing fast and then probing for recovery. Resilience4j provides it with retry, rate limiter, bulkhead and time limiter, and replaced Hystrix.",
    "The breaker has closed, open and half-open states driven by a sliding window of call outcomes. When open, calls fail immediately or use a fallback, and after a wait it lets trial calls through.",
    "Without protection, slow or failing downstream services tie up threads, cause timeouts to cascade and bring the whole system down.",
    "Use it around remote calls such as HTTP and messaging, combined with timeouts, bounded retries with backoff and bulkheads to limit concurrency.",
    "Do not use it for local code, treat it as a substitute for fixing the downstream service, or retry non-idempotent calls blindly. Poorly tuned thresholds cause flapping.",
    "Add resilience4j-spring-boot3, annotate @CircuitBreaker(name = payments, fallbackMethod = fallback) and configure failureRateThreshold, slidingWindowSize and waitDurationInOpenState. Or use Spring Cloud CircuitBreaker's abstraction.",
    "Pros: prevents cascading failure and gives graceful degradation. Cons: tuning effort, fallbacks must be meaningful, and it adds states to test.",
    "Alternatives are Spring Cloud CircuitBreaker abstraction, service-mesh level circuit breaking (Istio, Envoy), Failsafe, Polly in .NET, and Hystrix (retired)."
  ],
  "Service Discovery (Eureka)": [
    "Service discovery lets services find each other by logical name instead of fixed addresses. Eureka registers instances and their heartbeats, and clients resolve names through Spring Cloud LoadBalancer. On Kubernetes, built-in DNS usually replaces it.",
    "Instances register with a Eureka server, send heartbeats, and clients fetch and cache the registry. The server has self-preservation mode that stops evicting instances during network trouble.",
    "In dynamic environments addresses change with scaling and deployments, so hard-coded URLs break.",
    "Use it on VM or non-Kubernetes platforms where there is no built-in discovery, or in hybrid setups.",
    "Avoid it on Kubernetes, Consul or cloud platforms that already provide discovery. Do not run a single Eureka instance in production, and remember that clients may use stale data.",
    "Add spring-cloud-starter-netflix-eureka-server to a registry app and eureka-client to services, set eureka.client.service-url.defaultZone, and call services with a load-balanced client using the service name.",
    "Pros: simple client-side discovery. Cons: another component to run, eventual consistency in the registry, and redundant on modern platforms.",
    "Alternatives are Kubernetes services and DNS, Consul, ZooKeeper, cloud service discovery (AWS Cloud Map) and service meshes."
  ],
  "Spring Cloud Config": [
    "Spring Cloud Config Server serves configuration from a Git repository or other backend to services, per application and profile, with refresh at runtime. On Kubernetes, ConfigMaps, Secrets and Vault often take its place.",
    "A config server exposes properties over HTTP from a backend such as Git. Clients import them with spring.config.import=configserver: and can refresh beans annotated @RefreshScope.",
    "Properties in each service's jar or repository are hard to change and audit across many services and environments.",
    "Use it to centralise versioned configuration for many Spring services, especially outside Kubernetes.",
    "Avoid it when the platform already manages config, and never store secrets in plain text in Git; use encryption or Vault. The server is a critical dependency at startup.",
    "Run a server with @EnableConfigServer and spring.cloud.config.server.git.uri, configure clients with spring.config.import=optional:configserver:http://config:8888, and refresh via Actuator or Spring Cloud Bus.",
    "Pros: central, versioned, auditable config. Cons: another critical component, refresh complexity, and secret management concerns.",
    "Alternatives are Kubernetes ConfigMaps and Secrets, HashiCorp Vault and Consul, AWS Parameter Store, Azure App Configuration and environment variables."
  ],
  "OpenFeign and HTTP Interfaces": [
    "OpenFeign and Spring's @HttpExchange interfaces let you declare an HTTP client as an interface and have the framework generate the implementation. Add timeouts and resilience, because the generated client hides the network.",
    "A Feign client is an interface with @FeignClient and Spring MVC-style mapping annotations. Spring 6 offers @HttpExchange proxies built on RestClient or WebClient, which is the direction for new code.",
    "Writing repetitive client code for each remote API is boring and error-prone. Declarative interfaces reduce it to a signature.",
    "Use it for calls between services with stable REST contracts, together with load balancing, circuit breaking and error decoding.",
    "Avoid hiding slow remote calls behind innocent-looking method calls without timeouts, and do not share entity classes across services. Feign is in maintenance, so prefer HTTP interfaces for new work.",
    "Declare @HttpExchange(/users) interface UserClient { @GetExchange(/{id}) User get(@PathVariable long id); } and create it with HttpServiceProxyFactory over a RestClient. For Feign add @EnableFeignClients and configure feign.client.config timeouts.",
    "Pros: concise, readable and testable. Cons: hides network behaviour, and requires error handling and timeouts to be configured explicitly.",
    "Alternatives are RestClient or WebClient directly, Retrofit, gRPC clients and generated OpenAPI clients."
  ],

  "Spring Kafka": [
    "Spring for Apache Kafka provides KafkaTemplate for producing and @KafkaListener for consuming, with error handling, retries, dead-letter topics and transactions. Design for idempotent consumers, careful offset commits and partition keys.",
    "KafkaTemplate sends records to topics, and listener containers run consumer threads in a consumer group, committing offsets according to the ack mode. DefaultErrorHandler with a DeadLetterPublishingRecoverer handles failures.",
    "Raw Kafka clients need substantial boilerplate for threading, deserialisation, error handling and offset management. Spring wraps these with sensible defaults.",
    "Use it for event-driven architectures, streaming pipelines, audit logs and decoupling services with high throughput and replayability.",
    "Avoid it for simple request-reply or small-scale job queues where RabbitMQ or SQS suffices, and do not assume exactly-once without idempotency. Ordering is guaranteed only within a partition.",
    "Write @KafkaListener(topics = orders, groupId = billing) void on(OrderPlaced e) { ... }, send with kafkaTemplate.send(orders, key, event), enable idempotent producers, configure retries with @RetryableTopic or a back-off error handler, and make handlers idempotent.",
    "Pros: throughput, durability, replay and good Spring integration. Cons: operational complexity, ordering and rebalancing subtleties, and at-least-once duplicates.",
    "Alternatives are RabbitMQ, ActiveMQ, AWS SQS, SNS and Kinesis, Google Pub/Sub, Azure Service Bus, Pulsar and Spring Cloud Stream over Kafka."
  ],
  "Spring AMQP (RabbitMQ)": [
    "Spring AMQP wraps RabbitMQ with RabbitTemplate and @RabbitListener, using exchanges, queues and bindings. It suits task queues and routing patterns, with acknowledgements, retries and dead-letter queues for reliability.",
    "Producers publish to exchanges (direct, topic, fanout, headers) that route to bound queues; consumers read from queues. Spring declares topology through Queue, Exchange and Binding beans and manages listener containers.",
    "Applications need reliable asynchronous work distribution and flexible routing without writing low-level channel code.",
    "Use it for background jobs, workflows, and routing messages by type with acknowledgement-based delivery.",
    "Avoid it for huge event streams needing replay and retention (Kafka fits better), and do not leave poison messages retrying forever; use a DLQ.",
    "Declare queues and bindings as beans, send with rabbitTemplate.convertAndSend(exchange, routingKey, payload), consume with @RabbitListener(queues = jobs), set acknowledge mode and prefetch, and configure retry and dead-letter exchanges.",
    "Pros: flexible routing, mature, low latency. Cons: no built-in replay, queue-based scaling limits, and operational tuning.",
    "Alternatives are Kafka, ActiveMQ Artemis, AWS SQS and SNS, Azure Service Bus and Pulsar."
  ],
  "Spring Cloud Stream": [
    "Spring Cloud Stream abstracts messaging behind binders, so you write functional Supplier, Function and Consumer beans and bind them to Kafka, RabbitMQ or others by configuration. It reduces broker lock-in but hides broker-specific features.",
    "Beans of java.util.function types become message handlers, and bindings map their inputs and outputs to destinations through a binder implementation. It supports consumer groups, partitioning and error handling.",
    "Application code tied directly to one broker API is hard to change, and boilerplate repeats across services.",
    "Use it for event-driven microservices where a uniform programming model matters, or to switch brokers across environments.",
    "Avoid it when you need advanced broker-specific features, or when the abstraction hides behaviour you must control. Debugging through the binder layer can be harder.",
    "Define @Bean Function<Order, Invoice> process() and configure spring.cloud.stream.bindings.process-in-0.destination=orders and process-out-0.destination=invoices, with a binder dependency such as spring-cloud-stream-binder-kafka.",
    "Pros: simple functional model, broker portability. Cons: leaky abstraction, extra layer, and naming conventions to learn.",
    "Alternatives are Spring Kafka or Spring AMQP directly, Kafka Streams, Apache Camel and Spring Integration."
  ],
  "Spring JMS": [
    "Spring JMS provides JmsTemplate and @JmsListener over the Java Message Service API for brokers such as ActiveMQ Artemis and IBM MQ. It remains common in enterprise integrations that rely on JMS.",
    "JmsTemplate sends messages with connection and session handling, and listener containers consume messages with transaction and acknowledgement support, using queues or topics.",
    "Raw JMS needs repetitive connection, session and cleanup code. Spring removes it.",
    "Use it when integrating with existing JMS-based enterprise systems and brokers.",
    "Avoid it for new greenfield event streaming where Kafka or cloud messaging fits better, and watch for JMS transaction semantics across resources.",
    "Configure the connection factory (for example spring-boot-starter-artemis), send with jmsTemplate.convertAndSend(queue, payload), and consume with @JmsListener(destination = queue).",
    "Pros: standard API, broker portable within JMS. Cons: dated model, limited streaming features, and vendor-specific behaviour.",
    "Alternatives are Spring AMQP, Spring Kafka, cloud messaging services and Spring Integration adapters."
  ],
  "Spring Integration": [
    "Spring Integration implements Enterprise Integration Patterns with channels, endpoints, routers, transformers and adapters for files, JMS, HTTP, FTP and more. It fits integration-heavy systems, but for simple flows plain code is clearer.",
    "Messages flow through channels between endpoints such as transformers, filters, routers and service activators, defined with Java DSL or XML. Adapters connect to external systems.",
    "Integration code tends to become tangled, and EIP gives a vocabulary and tested components for routing, transforming and aggregating messages.",
    "Use it for file or FTP processing, protocol bridging, content-based routing and enterprise integration flows.",
    "Avoid it for simple point-to-point calls or when Camel or a managed integration platform is already standard. The abstraction is heavy for small tasks.",
    "Build flows with IntegrationFlow.from(...).transform(...).route(...).handle(...).get() in the Java DSL, and monitor channels with Actuator metrics.",
    "Pros: rich patterns and adapters. Cons: steep learning curve and abstraction overhead.",
    "Alternatives are Apache Camel, Mulesoft, plain Java with message listeners, and Spring Cloud Stream."
  ],

  "Scheduling and @Async": [
    "@Scheduled runs methods on a timer and @Async runs methods on a separate thread pool. Configure your own executors, handle exceptions, and use a distributed lock such as ShedLock when running several instances.",
    "@EnableScheduling activates scheduled tasks using fixedRate, fixedDelay or cron, by default on a single thread. @EnableAsync makes calls to @Async methods return immediately and run on a TaskExecutor, optionally returning a CompletableFuture.",
    "Background work and periodic jobs should not block request threads, and manual thread management is error-prone.",
    "Use @Scheduled for cleanup, polling and reports, and @Async for fire-and-forget or parallel work like sending emails.",
    "Do not rely on @Scheduled alone across multiple instances, where every node runs the job. Avoid unbounded executors, and remember @Async has the same proxy self-invocation limitation and does not propagate security or transaction context automatically.",
    "Add @EnableScheduling, write @Scheduled(cron = 0 0 2 * * *) void nightly() { ... }, define a ThreadPoolTaskExecutor bean or enable virtual threads, return CompletableFuture from @Async methods, and add ShedLock for single-run semantics.",
    "Pros: simple. Cons: single default scheduler thread, duplicate runs when scaled out, silent failures of async methods, and context propagation issues.",
    "Alternatives are Quartz, Kubernetes CronJobs, Spring Batch for heavy jobs, cloud schedulers, and message-driven workers."
  ],
  "Spring Batch": [
    "Spring Batch is a framework for reliable bulk processing, built around Job, Step and chunk-oriented reader, processor, writer flows with transactions per chunk, restartability and skip or retry rules. It is for large offline data processing, not request handling.",
    "A Job is a sequence of Steps; a chunk step reads items, processes them and writes them in a transaction every N items. JobRepository stores metadata so failed jobs can restart from the last committed point. Partitioning and remote chunking scale it out.",
    "Large ETL and nightly processing need restartability, transactional safety, monitoring and error policies that plain loops do not provide.",
    "Use it for migration, reporting, reconciliation, file ingestion and other high-volume, scheduled or on-demand batch work.",
    "Avoid it for real-time or small tasks where a @Scheduled method or a message consumer is enough, and for streaming workloads where Kafka Streams or Flink fit better.",
    "Define a Step with new StepBuilder(step, jobRepository).<In, Out>chunk(1000, txManager).reader(reader).processor(processor).writer(writer).faultTolerant().skip(...).build(), compose it in a Job, and launch with JobLauncher. Batch 5 requires Java 17 and no longer needs @EnableBatchProcessing in Boot.",
    "Pros: restart, skip, retry, metrics and scalability options. Cons: heavy framework for simple jobs, metadata tables, and a learning curve.",
    "Alternatives are @Scheduled with plain code, Spark or Flink for big data, Airflow or Step Functions for orchestration, and cloud batch services."
  ],

  "Spring AI": [
    "Spring AI brings Spring-style abstractions to generative AI: portable APIs for chat models, embeddings, vector stores, tool calling and structured output across providers like OpenAI, Anthropic, Azure OpenAI and Ollama. It makes AI a normal part of a Boot application.",
    "It provides ChatModel and ChatClient, EmbeddingModel, VectorStore, document readers and ETL, advisors for cross-cutting behaviour, and Boot auto-configuration and observability for model calls.",
    "Each AI provider has its own SDK, and integrating models, retrieval and tools consistently into Java services required a lot of custom code.",
    "Use it to add chat, summarisation, classification, RAG over company documents and agent-like tool use to Java services, with the ability to switch providers.",
    "Avoid it if you need the newest provider-specific feature not yet exposed, or for tasks a deterministic algorithm solves reliably. Do not send sensitive data to external models without a policy.",
    "Add a model starter (for example spring-ai-starter-model-openai), set the API key through properties or environment, inject ChatClient.Builder, and call chatClient.prompt().user(question).call().content(). Add advisors for memory and retrieval, and test with mock models.",
    "Pros: portable, idiomatic Spring, good integration. Cons: a fast-moving API, provider differences leak through, and model cost, latency and non-determinism remain.",
    "Alternatives are LangChain4j, provider SDKs directly, Semantic Kernel for Java, and calling REST APIs with RestClient."
  ],
  "ChatClient and Prompts": [
    "ChatClient is Spring AI's fluent API for talking to a model: build a prompt with system and user messages and templates, call it, and read the response as text or an object. Advisors add memory and retrieval around the call.",
    "ChatClient.builder(chatModel) creates a reusable client with default system text and advisors. prompt().system(...).user(...).call() sends the request, while stream() returns a Flux of tokens, and PromptTemplate fills variables.",
    "Using raw model APIs means hand-built request payloads and response parsing, and repeating prompt and context logic across a codebase.",
    "Use it for question answering, content generation, summarisation and any LLM call inside a service, with prompts stored as templates.",
    "Avoid building prompts by concatenating untrusted input, since that enables prompt injection, and do not leave prompts unversioned or untested.",
    "Write String answer = chatClient.prompt().system(You are a concise support agent).user(u -> u.text(Summarise {text}).param(text, doc)).call().content(); use stream() for server-sent responses and options to set temperature and model.",
    "Pros: simple fluent API, reusable defaults, streaming. Cons: non-deterministic outputs, cost and latency, and prompts become a maintenance burden.",
    "Alternatives are the lower-level ChatModel API, LangChain4j AI services, and provider SDKs."
  ],
  "RAG and Vector Stores": [
    "Retrieval-augmented generation grounds a model's answer in your own documents: split and embed documents into a vector store, retrieve the most similar chunks for a question, and add them to the prompt. Spring AI supplies VectorStore abstractions and advisors for this.",
    "Documents are read, split into chunks, converted into embeddings by an EmbeddingModel and stored in a VectorStore such as pgvector, Redis, Elasticsearch or Pinecone. At query time a similarity search returns chunks that an advisor injects as context.",
    "Models do not know private or recent data and may hallucinate. Retrieval supplies relevant facts without retraining the model.",
    "Use it for question answering over documentation, support knowledge bases, policies and code or contract search.",
    "Avoid it when the data is small enough to put directly in the prompt, when exact structured lookup is required (use SQL), or when retrieval quality cannot be evaluated. Poor chunking gives poor answers.",
    "Use a DocumentReader and TokenTextSplitter to load documents, call vectorStore.add(documents), and add QuestionAnswerAdvisor or RetrievalAugmentationAdvisor to the ChatClient with a top-k and similarity threshold. Evaluate answers with test questions.",
    "Pros: fresh and private knowledge, fewer hallucinations, no retraining. Cons: chunking and retrieval tuning, extra infrastructure, cost and latency, and risk of leaking restricted documents without access controls.",
    "Alternatives are fine-tuning, long-context prompting, keyword or hybrid search with Elasticsearch, and knowledge graphs."
  ],
  "Tool Calling and MCP": [
    "Tool calling lets the model request that your code run a function, such as querying an order system, and Spring AI exposes methods as tools with @Tool. MCP is a standard protocol for sharing tools and context between AI applications and servers.",
    "Annotated methods or ToolCallbacks are described to the model with names and JSON schemas. The model returns a tool call, Spring AI executes it and feeds the result back. Spring AI has MCP client and server starters.",
    "Models only generate text; to get live data or take actions they need controlled access to functions and systems.",
    "Use it for assistants that look up data, call internal APIs or trigger workflows, and MCP to reuse tools across applications.",
    "Avoid giving a model destructive tools without confirmation, authorisation and audit. Do not trust tool arguments produced by a model without validation.",
    "Annotate @Tool(description = Find an order by id) Order find(@ToolParam(description = id) String id), pass them with chatClient.prompt().tools(orderTools), and validate inputs and permissions inside. For MCP add the spring-ai MCP server starter and expose the tools.",
    "Pros: connects models to real systems and standardises integration. Cons: security and prompt-injection risk, unpredictable call patterns, and cost.",
    "Alternatives are RAG for read-only knowledge, hard-coded workflows, and agent frameworks such as LangChain4j."
  ],
  "Structured Output and Chat Memory": [
    "Structured output maps a model's reply onto a Java type with entity(MyRecord.class), and chat memory stores conversation history so follow-up questions have context. Always validate model output and cap memory size.",
    "Structured output uses a converter, such as BeanOutputConverter, that adds a JSON schema to the prompt and parses the response. Chat memory advisors such as MessageChatMemoryAdvisor load and save messages per conversation id using a ChatMemory implementation.",
    "Free text is hard for programs to consume, and models are stateless, so each request otherwise forgets previous turns.",
    "Use structured output for extraction and classification and chat memory for multi-turn assistants and support bots.",
    "Avoid trusting parsed output without validation, since models can return invalid or incorrect data. Unbounded memory increases cost and can leak data between users if conversation ids are mixed.",
    "Write Invoice invoice = chatClient.prompt().user(Extract invoice data: text).call().entity(Invoice.class); add MessageChatMemoryAdvisor with a conversation id parameter, and use a bounded or persistent ChatMemory repository.",
    "Pros: typed results and natural conversations. Cons: parsing failures, token cost growth with history, and privacy considerations.",
    "Alternatives are manual JSON parsing, provider-native structured output features, summarising history, and external conversation stores."
  ],

  "Micrometer and Observability": [
    "Micrometer is the metrics facade for Spring, and the Observation API unifies metrics, tracing and logging with one instrumentation. Know counters, timers and gauges, watch tag cardinality, and export to Prometheus or similar.",
    "A MeterRegistry records Counter, Timer, Gauge and DistributionSummary values with tags and ships them to a backend. Boot auto-instruments HTTP, JVM, datasource and more, and @Observed or ObservationRegistry creates custom observations.",
    "Teams need consistent, vendor-neutral metrics from applications to detect problems and understand behaviour.",
    "Use it in every production service: request latency percentiles, error rates, queue sizes, business counters, with dashboards and alerts built on them.",
    "Avoid high-cardinality tags such as user ids or full URLs, which explode storage and cost, and do not add metrics nobody monitors.",
    "Add micrometer-registry-prometheus, expose /actuator/prometheus, record with meterRegistry.counter(orders.created, type, web).increment() or Timer.builder(...).publishPercentileHistogram(), and define SLO-based alerts.",
    "Pros: standard, vendor-neutral, rich auto-instrumentation. Cons: cardinality costs and the need to design useful metrics and alerts.",
    "Alternatives are OpenTelemetry metrics, vendor agents (Datadog, New Relic, Dynatrace), and hand-rolled JMX counters."
  ],
  "Distributed Tracing": [
    "Distributed tracing follows a request across services using trace and span ids propagated in headers. In Boot 3, Micrometer Tracing (with OpenTelemetry or Brave bridges) replaced Spring Cloud Sleuth, and the trace id should appear in logs.",
    "Each service creates spans for work it does and propagates the trace context (W3C traceparent) to downstream calls and messages. A backend such as Zipkin, Jaeger or an OTLP collector assembles the full trace.",
    "In a microservice system, logs and metrics alone cannot show where time went for a single request across many services.",
    "Use it for any multi-service system to find latency bottlenecks, failures and dependency paths, with sampling to control cost.",
    "Avoid tracing everything at 100 percent in high-traffic production, and do not forget to propagate context through async and messaging boundaries.",
    "Add micrometer-tracing-bridge-otel and an OTLP exporter, set management.tracing.sampling.probability, include traceId in the log pattern, and use instrumented RestClient, WebClient and Kafka templates so context propagates.",
    "Pros: end-to-end visibility. Cons: overhead and cost, sampling gaps and the need for backend infrastructure.",
    "Alternatives are correlation ids in logs, APM vendor tools, service-mesh tracing and OpenTelemetry auto-instrumentation agents."
  ],

  "Spring Boot Test and Slice Tests": [
    "Spring Boot Test offers @SpringBootTest for full-context tests and slice annotations such as @WebMvcTest, @DataJpaTest and @JsonTest that load only one layer. Prefer fast unit tests and use slices or full context sparingly because they cost startup time.",
    "@SpringBootTest starts the application context, optionally with a random port. Slices configure only the beans relevant to a layer, and @MockitoBean (formerly @MockBean) replaces beans with mocks in the context.",
    "Testing everything with a full context is slow, while testing without Spring misses wiring and configuration bugs. Slices balance speed and realism.",
    "Use plain unit tests for logic, slices for controllers and repositories, and a few full-context integration tests for critical flows.",
    "Avoid @SpringBootTest everywhere, heavy use of mocks that hide integration problems, and context-busting configuration that prevents context caching.",
    "Write @WebMvcTest(OrderController.class) with @MockitoBean OrderService and MockMvc, @DataJpaTest with a real database via Testcontainers, and @SpringBootTest(webEnvironment = RANDOM_PORT) with TestRestClient for end-to-end checks.",
    "Pros: realistic and well integrated. Cons: slower than unit tests, context caching pitfalls, and mock overuse.",
    "Alternatives are plain JUnit with Mockito, Testcontainers-based integration tests, contract tests (Spring Cloud Contract, Pact) and end-to-end suites."
  ],
  "MockMvc and WebTestClient": [
    "MockMvc tests Spring MVC controllers without starting a real server, and WebTestClient does the same for WebFlux or against a running server. Use them to verify routing, validation, serialisation and security rules quickly.",
    "MockMvc drives the DispatcherServlet in memory with built requests and assertions on status, headers and JSON. WebTestClient is a fluent client that can bind to a controller, an application context or a live URL.",
    "Controller behaviour such as mapping, binding and error responses should be tested without the cost and flakiness of real HTTP.",
    "Use them in @WebMvcTest or @WebFluxTest slices to test request and response contracts, validation errors and security.",
    "Avoid them as the only tests for behaviour involving real filters or servers, and do not assert implementation details. Use a real port when you need the full stack.",
    "Write mockMvc.perform(post(/orders).contentType(JSON).content(body)).andExpect(status().isCreated()).andExpect(jsonPath($.id).exists()), and add with(jwt()) from spring-security-test for secured endpoints.",
    "Pros: fast, deterministic. Cons: not a real network stack, and MockMvc misses some servlet container behaviour.",
    "Alternatives are @SpringBootTest with a real port and TestRestTemplate or RestClient, REST Assured, and contract testing."
  ],
  "Testcontainers": [
    "Testcontainers starts real dependencies such as PostgreSQL, Kafka and Redis in Docker for tests, so integration tests run against the real thing. Spring Boot's @ServiceConnection wires container details automatically.",
    "A container class defines an image that starts before tests and stops after. In Boot 3.1 and later, a container bean annotated @ServiceConnection supplies connection properties without manual wiring.",
    "In-memory fakes like H2 behave differently from production databases, hiding bugs. Real containers give realistic tests and disposable environments.",
    "Use it for repository tests, migrations, messaging and any integration test where behaviour depends on the real service.",
    "Avoid it where Docker is not available in CI, for pure unit tests, or by starting a fresh container per test method, which is slow. Share containers across tests.",
    "Add the spring-boot-testcontainers dependency and declare @Bean @ServiceConnection PostgreSQLContainer<?> postgres() { return new PostgreSQLContainer<>(postgres:16); } in a test configuration, then use @DataJpaTest or @SpringBootTest. Reuse containers to speed up local runs.",
    "Pros: realistic, reproducible, disposable. Cons: requires Docker, slower than in-memory, and uses CI resources.",
    "Alternatives are H2 or embedded databases, embedded Kafka, shared test environments, and LocalStack for cloud services."
  ],

  "Spring Modulith": [
    "Spring Modulith helps build well-structured modular monoliths by treating top-level packages as application modules, verifying their dependencies in tests and supporting event-based communication. It is a stepping stone before or instead of microservices.",
    "Modules are packages under the main class package. Tests check for illegal dependencies and cycles, events are published between modules with a persistent event publication registry, and documentation diagrams are generated.",
    "Large monoliths decay into tangled code, while premature microservices add distributed-system cost. Modulith enforces boundaries within a single deployable.",
    "Use it for new or growing monoliths where you want clear module boundaries and a possible later split.",
    "Avoid it if you already have strong module boundaries enforced another way, or when independent deployment and scaling are real requirements now.",
    "Add spring-modulith-starter-core, organise code into packages per module, add a test calling ApplicationModules.of(Application.class).verify(), and use @ApplicationModuleListener for events between modules.",
    "Pros: enforced architecture, simple deployment, event decoupling. Cons: single deployment and scaling unit, and discipline is still needed.",
    "Alternatives are Java modules (JPMS), ArchUnit rules, multi-module Maven or Gradle builds, and microservices."
  ],
  "Spring Shell": [
    "Spring Shell builds interactive or scripted command-line applications with Spring, handling command parsing, help and completion. It suits internal tooling and admin utilities.",
    "Commands are defined with annotations or programmatically, with options, arguments, completion and help generated, and run in an interactive shell or non-interactively.",
    "Admin and developer tools need a friendly CLI without writing a parser from scratch.",
    "Use it for operational tools, data loaders and developer utilities that reuse Spring beans.",
    "Avoid it for simple scripts, or when startup time matters and a native tool (or picocli) fits better.",
    "Add the Spring Shell starter and annotate methods with @Command(name = greet), take parameters with @Option, and run interactively or with arguments. Native image can reduce startup time.",
    "Pros: reuse of Spring services in a CLI. Cons: heavier startup than small CLIs and a smaller community.",
    "Alternatives are picocli, JCommander, Spring Boot CommandLineRunner, and shell scripts."
  ],
  "Spring Web Services (SOAP)": [
    "Spring Web Services supports contract-first SOAP services: you start from the XSD or WSDL and map XML payloads to endpoints. It is mostly used for legacy and enterprise integration.",
    "Endpoints handle XML payloads selected by root element via @PayloadRoot, marshalled with JAXB or similar, and a WSDL can be generated from the schema. WebServiceTemplate calls remote SOAP services.",
    "Many enterprise partners still require SOAP and strict contracts, and code-first approaches produce unstable contracts.",
    "Use it when integrating with or exposing SOAP services, with WS-Security where required.",
    "Avoid it for new internal APIs where REST, gRPC or messaging is simpler and better supported.",
    "Define an XSD, generate classes with JAXB, write an @Endpoint class with @PayloadRoot and @ResponsePayload methods, and expose WSDL with a DefaultWsdl11Definition bean. Use WebServiceTemplate for clients.",
    "Pros: strong contracts and standards support. Cons: verbose XML, heavy tooling, and declining use.",
    "Alternatives are REST, gRPC, Apache CXF, and message-based integration."
  ],
  "Spring LDAP": [
    "Spring LDAP simplifies working with LDAP directories through LdapTemplate and object mapping, and Spring Security can authenticate users against LDAP. It remains relevant in enterprises using Active Directory.",
    "LdapTemplate manages contexts and search, bind and modify operations, mapping entries to objects, and wraps exceptions into Spring's hierarchy.",
    "The JNDI API for LDAP is verbose and error-prone with manual resource handling.",
    "Use it for directory lookups, enterprise login against LDAP or Active Directory, and user and group queries.",
    "Avoid it for application data storage or modern single sign-on where an OIDC provider, federated to LDAP, is better.",
    "Configure a LdapContextSource, use ldapTemplate.search(query().where(uid).is(name), mapper), and configure authentication with http.ldapAuthentication or an authentication provider.",
    "Pros: convenient and standard. Cons: LDAP-specific concepts and injection risks without proper escaping.",
    "Alternatives are OIDC with a federated identity provider, SCIM provisioning, and direct JNDI."
  ],
  "Spring Vault": [
    "Spring Vault integrates applications with HashiCorp Vault for secrets, dynamic credentials and encryption. It keeps secrets out of configuration files and enables short-lived database credentials.",
    "VaultTemplate reads and writes secrets, authentication methods such as Kubernetes, AppRole and token are supported, and Boot can import secrets as properties with spring.config.import=vault://.",
    "Static passwords in files and environment variables are hard to rotate and audit.",
    "Use it where central secret management, rotation and auditing are needed, such as dynamic database credentials and encryption as a service.",
    "Avoid it for small applications where the platform's secret store is enough, and do not make Vault availability a single point of failure without caching and renewal handled.",
    "Add spring-cloud-starter-vault-config, configure the Vault URI and authentication, import secrets via config data, and use the lease renewal support for dynamic credentials.",
    "Pros: central, auditable secrets and rotation. Cons: extra infrastructure to run and secure.",
    "Alternatives are Kubernetes Secrets with external secrets operators, AWS Secrets Manager, Azure Key Vault and Google Secret Manager."
  ],
  "Spring REST Docs": [
    "Spring REST Docs generates accurate API documentation from tests: request and response snippets are produced while tests pass, and are assembled into Asciidoctor documents. The docs fail when the API drifts from the documentation.",
    "Tests using MockMvc, WebTestClient or REST Assured document requests and responses, fields and parameters, producing snippets that you include in hand-written documents.",
    "Hand-written or annotation-based docs go stale. Test-driven docs stay correct because undocumented fields fail the test.",
    "Use it when accuracy and a clean, customisable documentation page matter, such as public or partner APIs.",
    "Avoid it if you want interactive try-it-out documentation generated from annotations; springdoc OpenAPI with Swagger UI is quicker.",
    "Add the REST Docs dependency, configure the extension, call document(index, responseFields(fieldWithPath(id).description(...))) in tests, and render with the Asciidoctor plugin.",
    "Pros: always accurate, no annotations in production code. Cons: more test code and no interactive console by default.",
    "Alternatives are springdoc-openapi with Swagger UI, hand-maintained OpenAPI, Postman collections and Spring Cloud Contract."
  ]
});
