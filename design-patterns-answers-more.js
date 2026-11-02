// Continuation of design-patterns-answers.js: enterprise patterns and anti-patterns.
// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
Object.assign(SERVICE_ANSWERS, {
  "Repository and DAO": [
    "A DAO wraps access to a data source with CRUD-style methods, while a Repository presents a collection-like interface for aggregates in domain terms. Spring Data repositories blend both and keep persistence details out of business logic.",
    "A DAO is table or technology oriented. A Repository belongs to the domain layer, returns aggregates, hides query details and often speaks in business language such as findOverdueInvoices.",
    "Scattering SQL and ORM calls through business code couples it to the database and makes tests slow.",
    "Use it for any application with persistence, especially in layered or DDD designs, with one repository per aggregate root.",
    "Avoid a generic repository per table that leaks persistence into the domain, and do not return entities with lazy proxies to controllers.",
    "Define an interface in the domain, implement it with JPA, JDBC or Spring Data, and keep transactions in the service layer. Return domain objects or projections.",
    "Pros: isolation of persistence and testability with fakes. Cons: extra layer, and generic repositories can leak abstractions.",
    "Alternatives are using JPA directly, query objects, CQRS read models and active record.",
    `public interface OrderRepository {                // domain-facing
    Optional<Order> findById(OrderId id);
    List<Order> findOverdue(LocalDate today);
    void save(Order order);
}
interface SpringDataOrders extends JpaRepository<OrderEntity, Long> { ... }
class JpaOrderRepository implements OrderRepository { ... }   // adapter`
  ],
  "DTO and Mapper": [
    "A DTO is a simple data carrier used to move data across boundaries such as API layers, so internal entities are not exposed. Mappers (MapStruct) convert between entities and DTOs, keeping the API contract separate from persistence.",
    "DTOs contain only data, often as records. A mapper converts entity to DTO and back, handling renaming, flattening and conversion.",
    "Exposing entities leaks internal fields, breaks when the schema changes, triggers lazy loading outside transactions and creates security risks.",
    "Use DTOs for API requests and responses, messaging payloads and read projections.",
    "Avoid DTO explosion for trivial internal calls, and avoid copying with hand-written mappers for large objects when a generator can do it.",
    "Define records for request and response, use MapStruct to generate mappers at compile time, and validate request DTOs at the boundary.",
    "Pros: stable contracts, security, decoupling. Cons: mapping boilerplate and duplication.",
    "Alternatives are exposing entities (not recommended), JSON views, projections and GraphQL selection.",
    `public record OrderDto(String id, String customer, BigDecimal total) {}

@Mapper(componentModel = "spring")
interface OrderMapper {
    @Mapping(source = "customer.name", target = "customer")
    OrderDto toDto(Order order);
}`
  ],
  "MVC and Layered Architecture": [
    "MVC separates model, view and controller, and layered architecture separates presentation, service, domain and persistence concerns. Keep dependencies pointing inward, controllers thin, and business rules in the domain or service layer.",
    "In Spring MVC controllers handle HTTP, services hold business operations and transactions, repositories handle persistence, and models and views present data. Layers should depend only downward.",
    "Mixing HTTP, business and database code in one place makes systems untestable and hard to change.",
    "Use it as the default structure for most enterprise applications and APIs.",
    "Avoid anemic services that only pass data through while all rules sit elsewhere, and layer-skipping calls such as controllers calling repositories.",
    "Keep controllers thin, put transactions and orchestration in services, domain rules in domain objects, and enforce layering with ArchUnit tests.",
    "Pros: familiar, clear responsibilities. Cons: can become anemic and rigid, with changes touching all layers.",
    "Alternatives are hexagonal or clean architecture, vertical slices and modular monoliths organised by feature."
  ],
  "Null Object": [
    "Null Object provides a do-nothing implementation instead of null so callers need no null checks. It is useful for optional collaborators, though Optional is better for return values.",
    "A null object implements the same interface as a real one with neutral behaviour, such as an empty list or a no-op logger.",
    "Null checks spread through code and a missed one throws NullPointerException.",
    "Use it for optional strategies, default handlers, no-op listeners and empty collections.",
    "Avoid it when silently doing nothing would hide errors, where failing fast or Optional is better.",
    "Implement the interface with harmless behaviour, supply it as the default, and return empty collections instead of null.",
    "Pros: simpler client code. Cons: may mask missing data and add classes.",
    "Alternatives are Optional, exceptions and Objects.requireNonNull.",
    `interface Logger { void log(String m); }
class NoOpLogger implements Logger { public void log(String m) { } }

class Service {
    private final Logger logger;
    Service(Logger logger) { this.logger = logger != null ? logger : new NoOpLogger(); }
}`
  ],

  "Anti-patterns": [
    "Anti-patterns are common solutions that look reasonable but cause harm: God Object, Spaghetti code, Anemic Domain Model, Golden Hammer, Premature Optimisation, Copy-Paste programming, Singleton abuse and Service Locator. Recognising and naming them is a code-review skill.",
    "An anti-pattern is a recurring, counter-productive practice. God Object concentrates logic in one class, Anemic Domain has data classes with all logic in services, and Golden Hammer applies one tool to every problem.",
    "Teams repeat the same mistakes, and a shared vocabulary helps explain why a design will hurt.",
    "Use it in design discussions and refactoring to name problems and propose remedies.",
    "Do not label every unfamiliar design an anti-pattern; context matters and a pattern can be fine in a small system.",
    "Identify the smell, explain the cost, and refactor stepwise: extract classes from a God Object, move behaviour into the domain model, replace global state with injection, and add tests first.",
    "Pros: better reviews and designs. Cons: risk of dogma.",
    "Alternatives are focusing on principles (SOLID, coupling and cohesion) and metrics such as cyclomatic complexity."
  ],
  "Code Smells and Refactoring": [
    "Code smells such as long methods, large classes, duplicated code, feature envy, primitive obsession and shotgun surgery hint at deeper design problems. Refactor in small, test-protected steps to improve structure without changing behaviour.",
    "Refactoring is restructuring code while preserving behaviour, guided by smells and supported by tests and IDE automation. Examples include Extract Method, Move Method and Replace Conditional with Polymorphism.",
    "Without continuous refactoring, code decays, change slows down and bugs multiply.",
    "Use it when adding a feature to messy code, during code review, and as part of regular maintenance.",
    "Do not refactor without tests, mix refactoring with behaviour changes in one commit, or rewrite everything at once.",
    "Write characterisation tests, make small steps with IDE refactorings, commit often, and measure improvement with static analysis such as SonarQube.",
    "Pros: maintainable code and faster delivery over time. Cons: short-term cost and risk without tests.",
    "Alternatives are rewriting (risky), strangler approaches for large systems and leaving stable code alone."
  ],
  "Patterns in the JDK and Spring": [
    "Know where patterns appear in familiar code: Builder in StringBuilder and HttpRequest, Factory in Calendar.getInstance and List.of, Decorator in java.io wrappers, Strategy in Comparator, Observer in listeners, Proxy and Template Method in Spring. Citing real examples makes pattern answers credible.",
    "The JDK and Spring apply patterns throughout: Singleton scope of beans, Proxy for AOP and transactions, Template Method in JdbcTemplate, Adapter in HandlerAdapter, Chain of Responsibility in filters, and Factory in BeanFactory.",
    "Interviewers want evidence that you recognise patterns in practice and not just definitions.",
    "Use it to anchor explanations of patterns in examples the interviewer already knows.",
    "Do not force a pattern label onto code where it is not really used.",
    "Prepare one JDK and one Spring example per major pattern, and be ready to explain how it works.",
    "Pros: concrete, memorable answers. Cons: examples must be accurate.",
    "Alternatives are describing patterns through your own projects.",
    `Builder              -> StringBuilder, HttpRequest.newBuilder(), Stream.Builder
Factory Method       -> List.of(), Calendar.getInstance(), BeanFactory
Singleton            -> Runtime.getRuntime(), Spring singleton beans
Decorator            -> BufferedReader(new FileReader()), Collections.unmodifiableList
Strategy             -> Comparator, ThreadPoolExecutor rejection handlers
Observer             -> ApplicationEventPublisher, PropertyChangeListener
Proxy                -> JDK dynamic proxy, Spring AOP, Hibernate lazy loading
Template Method      -> JdbcTemplate, AbstractList, HttpServlet.service()
Chain of Resp.       -> Servlet filters, Spring Security filter chain
Adapter              -> Arrays.asList, InputStreamReader, HandlerAdapter`
  ]
});
