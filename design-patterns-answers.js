// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Single Responsibility Principle": [
    "A class should have one reason to change, meaning it serves one actor or concern. It keeps classes small, cohesive and easy to test, and it is violated by classes that mix business rules, persistence and presentation.",
    "SRP says to group things that change for the same reason and separate things that change for different reasons. Responsibility is about axes of change, not about doing a single tiny action.",
    "Classes with many responsibilities change often, break unrelated features, and are hard to test and understand.",
    "Apply it when a class mixes concerns such as calculating an invoice, saving it and emailing it, or when changes for one stakeholder risk another.",
    "Do not split so aggressively that you create dozens of one-method classes; cohesion matters more than size.",
    "Extract collaborators for each concern, inject them through interfaces, and keep orchestration in a thin service. Check by asking who would request a change to this class.",
    "Pros: testability, clarity, low blast radius. Cons: more classes and wiring, and over-splitting scatters logic.",
    "Alternatives are cohesive modules organised by feature, vertical slices and functional decomposition.",
    `// Violates SRP: calculation, persistence and notification in one class
class InvoiceService { void process(Invoice i) { calc(i); save(i); email(i); } }

// Better: each concern has one reason to change
class InvoiceCalculator { Money total(Invoice i) { ... } }
class InvoiceRepository { void save(Invoice i) { ... } }
class InvoiceNotifier   { void send(Invoice i) { ... } }
class InvoiceService {
    InvoiceService(InvoiceCalculator c, InvoiceRepository r, InvoiceNotifier n) { ... }
}`
  ],
  "Open/Closed Principle": [
    "Software entities should be open for extension but closed for modification: add new behaviour by adding code, not by editing tested code. It is usually achieved with polymorphism and abstractions such as strategies.",
    "New requirements are met by adding implementations of an abstraction, not by editing switch statements or conditionals in existing classes.",
    "Editing working code risks regressions and forces retesting, and long if-else chains grow with every new case.",
    "Apply it where variation is expected and has already happened, such as payment methods, discount rules, exporters and validators.",
    "Do not build extension points speculatively for variations that may never come; that is over-engineering.",
    "Define an interface, implement each case as a class, inject or register implementations (Spring can inject List of beans), and select by type or key.",
    "Pros: safer change, plug-in style growth. Cons: indirection, more types, and the right abstraction is hard to predict.",
    "Alternatives are simple conditionals while variation is small, pattern matching on sealed types, and configuration-driven rules.",
    `interface DiscountRule { boolean applies(Order o); Money discount(Order o); }

class PricingService {
    private final List<DiscountRule> rules;           // Spring injects all beans
    PricingService(List<DiscountRule> rules) { this.rules = rules; }

    Money total(Order o) {
        Money d = rules.stream().filter(r -> r.applies(o))
                       .map(r -> r.discount(o)).reduce(Money.ZERO, Money::plus);
        return o.subtotal().minus(d);                 // new rule = new class, no edit here
    }
}`
  ],
  "Liskov Substitution Principle": [
    "Subtypes must be usable wherever the base type is expected without breaking correctness: they must not strengthen preconditions, weaken postconditions or violate invariants. The classic violation is Square extending Rectangle.",
    "LSP is about behavioural substitutability, not just matching signatures. Overrides must honour the contract of the base type, including exceptions thrown and state guarantees.",
    "Violations make polymorphic code need instanceof checks or special cases, defeating the point of inheritance.",
    "Check it when designing inheritance hierarchies and when an override throws UnsupportedOperationException or changes the meaning of a method.",
    "Do not use inheritance for code reuse where the is-a relationship does not hold in behaviour.",
    "Define clear contracts in documentation and tests, test all subtypes against a shared contract test, prefer composition when the relationship is not truly behavioural, and make types immutable to avoid state surprises.",
    "Pros: reliable polymorphism. Cons: needs careful thinking about contracts that the compiler cannot verify.",
    "Alternatives are composition, separate interfaces for different capabilities and sealed hierarchies.",
    `class Rectangle { void setWidth(int w); void setHeight(int h); }
class Square extends Rectangle {          // breaks LSP
    void setWidth(int w)  { super.setWidth(w); super.setHeight(w); }
}
// Client expects width and height to vary independently:
void resize(Rectangle r) { r.setWidth(5); r.setHeight(10); assert r.area() == 50; } // fails for Square`
  ],
  "Interface Segregation Principle": [
    "Clients should not depend on methods they do not use, so prefer several small, focused interfaces to one fat interface. It reduces coupling and avoids empty or throwing implementations.",
    "A large interface forces implementers to provide irrelevant methods and clients to recompile or break when unrelated methods change.",
    "Fat interfaces create classes with UnsupportedOperationException stubs and make mocking and evolution painful.",
    "Apply it when implementers leave methods empty, when different clients use different slices of an interface, or when an interface grows by accretion.",
    "Do not over-fragment into single-method interfaces everywhere without a reason.",
    "Split by client role, such as Reader and Writer, compose interfaces when needed, and let clients depend only on the slice they use.",
    "Pros: flexible, decoupled, easier testing. Cons: more interfaces to name and manage.",
    "Alternatives are default methods for optional behaviour, adapters, and role interfaces implemented by the same class.",
    `// Fat
interface Worker { void work(); void eat(); }
class Robot implements Worker { public void eat() { /* meaningless */ } }

// Segregated
interface Workable { void work(); }
interface Feedable { void eat(); }
class Robot implements Workable { public void work() { ... } }
class Human implements Workable, Feedable { ... }`
  ],
  "Dependency Inversion Principle": [
    "High-level modules should not depend on low-level modules; both should depend on abstractions, and abstractions should not depend on details. Dependency injection is the usual mechanism, and it makes business logic testable and replaceable.",
    "Instead of a service creating its repository or client, it depends on an interface owned by the high-level code and receives an implementation from outside.",
    "Direct dependencies on concrete infrastructure couple business rules to databases, frameworks and vendors, and make tests slow.",
    "Apply it at architectural boundaries: domain code depending on repository, gateway and clock interfaces implemented in infrastructure.",
    "Do not create an interface for every class without a boundary or second implementation.",
    "Define the interface in the domain, implement it in an adapter, inject through the constructor, and wire with Spring or manually. Use hexagonal or clean architecture layering.",
    "Pros: testability, replaceability, clean architecture. Cons: indirection and wiring overhead.",
    "Alternatives are direct dependencies for small simple code, service locators and static factories (hidden coupling).",
    `// High-level policy owns the abstraction
interface PaymentGateway { Receipt charge(Money amount, Card card); }

class CheckoutService {
    private final PaymentGateway gateway;                 // abstraction
    CheckoutService(PaymentGateway gateway) { this.gateway = gateway; }
}
// Low-level detail implements it
class StripeGateway implements PaymentGateway { ... }
class FakeGateway implements PaymentGateway { ... }       // tests`
  ],
  "DRY, KISS and YAGNI": [
    "DRY avoids duplicating knowledge, KISS prefers the simplest solution that works, and YAGNI says not to build features before they are needed. They pull against over-engineering, and the skill is balancing them.",
    "DRY is about single sources of truth for knowledge, not just identical text. KISS favours clear straightforward design. YAGNI delays speculative generality until a requirement exists.",
    "Duplicated logic drifts apart, while excessive abstraction and unneeded features add cost and bugs.",
    "Use DRY for business rules and configuration, KISS in design reviews, and YAGNI when tempted to add extension points or config options nobody asked for.",
    "Do not apply DRY to code that merely looks alike but changes for different reasons; premature abstraction is worse than small duplication.",
    "Wait for the rule of three before abstracting, extract shared knowledge into one place, remove dead options, and prefer simple code that the next person can read.",
    "Pros: maintainable code, less waste. Cons: wrongly applied DRY couples unrelated things, and YAGNI can postpone needed design.",
    "Alternatives are WET code in early stages, and design up front for known stable requirements."
  ],
  "Coupling and Cohesion": [
    "Good design has high cohesion, where a module's parts belong together, and low coupling, where modules know little about each other. Most principles and patterns are ways to achieve these two.",
    "Cohesion measures how focused a module is on one purpose. Coupling measures how much a module depends on others' internals, from data and stamp coupling to content coupling.",
    "High coupling makes change ripple across the system, and low cohesion makes modules hard to understand and reuse.",
    "Use them as a lens in code review, module design and microservice boundaries.",
    "Do not chase zero coupling, which would make a system unable to do anything; aim for coupling through stable abstractions.",
    "Depend on interfaces, hide internals, keep related behaviour together, avoid shared mutable state and cyclic dependencies, and use events or messages where independence is needed.",
    "Pros: easier change and testing. Cons: needs design effort and some indirection.",
    "Alternatives are measuring with architecture tools like ArchUnit and dependency graphs."
  ],
  "Law of Demeter": [
    "The Law of Demeter says an object should talk only to its immediate collaborators, not reach through them (a.getB().getC().doIt()). It reduces coupling to internal structure.",
    "A method should call methods only on itself, its parameters, objects it creates and its direct fields. Chained calls expose structure that may change.",
    "Long navigation chains couple callers to the entire object graph, so any change deep inside breaks them.",
    "Apply it to domain code and service APIs, and replace chains with intention-revealing methods.",
    "Do not apply it mechanically to fluent builders, streams or data structures, where chaining is not about structure.",
    "Add a method on the nearest object such as order.customerCity() or tell objects what to do instead of asking for their data.",
    "Pros: lower coupling and clearer APIs. Cons: extra delegating methods.",
    "Alternatives are exposing the structure deliberately via DTOs, and allowing fluent APIs.",
    `// Reaches through the object graph
String city = order.getCustomer().getAddress().getCity();

// Tell, don't ask
String city = order.customerCity();      // Order hides how it finds the city`
  ],

  "Singleton": [
    "A Singleton ensures one instance and a global access point. In modern Java prefer a container-managed singleton (Spring bean) or an enum, since hand-rolled singletons hurt testing and hide dependencies.",
    "Implementations include eager static field, lazy holder idiom, double-checked locking with volatile, and enum. Enum singletons are serialisation- and reflection-safe.",
    "Some resources, like configuration, registries and pools, should exist once per application.",
    "Use it for stateless services, shared read-only resources and managed beans where one instance is natural.",
    "Avoid it as a global mutable state container, and avoid when you need per-test or per-tenant instances. Singletons per classloader may still produce multiple instances in app servers.",
    "Use dependency injection with singleton scope, or the holder idiom when you must hand-roll one. Keep singletons stateless or thread-safe.",
    "Pros: single shared instance, controlled access. Cons: hidden dependencies, hard to test, concurrency pitfalls and tight coupling.",
    "Alternatives are dependency injection, static utility classes, factories and scoped beans.",
    `public enum Registry {                 // safest hand-rolled singleton
    INSTANCE;
    private final Map<String, String> data = new ConcurrentHashMap<>();
    public void put(String k, String v) { data.put(k, v); }
}

// Lazy holder idiom
public final class Config {
    private Config() {}
    private static class Holder { static final Config INSTANCE = new Config(); }
    public static Config get() { return Holder.INSTANCE; }
}`
  ],
  "Factory Method": [
    "Factory Method defines an interface for creating an object but lets subclasses or implementations decide which class to instantiate. It decouples callers from concrete types and centralises creation logic.",
    "A creator declares a factory method returning a product interface, and concrete creators override it. Static factory methods are the common lightweight variant.",
    "Direct constructor calls tie code to concrete classes and spread creation logic.",
    "Use it when the exact type depends on input or configuration, such as parsers by file type, notifiers by channel, or when you want named creation methods.",
    "Avoid it when a plain constructor is clear and there is one implementation.",
    "Write a static factory like Notifier.of(channel) with a switch or registry, return the interface, and keep constructors package-private. Spring offers @Bean factory methods and FactoryBean.",
    "Pros: decoupling and flexibility. Cons: extra classes and indirection.",
    "Alternatives are constructors, Abstract Factory, dependency injection and registries of suppliers.",
    `interface Notifier { void send(String msg); }
class EmailNotifier implements Notifier { ... }
class SmsNotifier implements Notifier { ... }

class Notifiers {
    static Notifier of(String channel) {
        return switch (channel) {
            case "email" -> new EmailNotifier();
            case "sms"   -> new SmsNotifier();
            default -> throw new IllegalArgumentException(channel);
        };
    }
}`
  ],
  "Abstract Factory": [
    "Abstract Factory creates families of related objects without specifying concrete classes, ensuring products from one family are used together. It fits cross-platform or themed object sets.",
    "An abstract factory interface declares creation methods for each product in a family, and each concrete factory produces a consistent set.",
    "Clients must not mix incompatible products, such as a Windows button with a macOS checkbox.",
    "Use it for UI toolkits, database or cloud provider abstractions, and test versus production component sets.",
    "Avoid it when there is a single product or the family is unlikely to vary. Adding a new product type forces changes to every factory.",
    "Define the factory interface, implement one factory per family, and select it once at startup, then pass it to clients.",
    "Pros: consistency across families, decoupling. Cons: many classes and rigid when adding new product types.",
    "Alternatives are dependency injection with profiles, Factory Method and configuration-based wiring.",
    `interface UiFactory { Button button(); Checkbox checkbox(); }
class DarkUiFactory implements UiFactory { ... }
class LightUiFactory implements UiFactory { ... }

class Screen {
    Screen(UiFactory f) { Button b = f.button(); Checkbox c = f.checkbox(); }
}`
  ],
  "Builder": [
    "Builder constructs complex or immutable objects step by step with readable, named setters, avoiding telescoping constructors. It is widely used for configuration objects, DTOs and requests.",
    "A builder collects parameters and a build method validates and creates the immutable result. Fluent method chaining makes optional parameters explicit.",
    "Constructors with many parameters are unreadable and error-prone, especially when several are optional.",
    "Use it for objects with many optional fields, immutable value objects and objects needing validation at creation time.",
    "Avoid it for objects with two or three required fields, where a constructor or record is clearer.",
    "Create a static nested Builder with fluent setters and a build method that validates. Lombok @Builder generates it, and records with factory methods often suffice.",
    "Pros: readable, safe immutable creation. Cons: extra boilerplate and a mutable builder object.",
    "Alternatives are constructors, records, static factories and setters (mutable).",
    `HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/orders"))
    .header("Accept", "application/json")
    .timeout(Duration.ofSeconds(5))
    .POST(BodyPublishers.ofString(json))
    .build();

public final class Pizza {
    private final String size; private final List<String> toppings;
    private Pizza(Builder b) { size = b.size; toppings = List.copyOf(b.toppings); }
    public static class Builder {
        private String size = "M"; private final List<String> toppings = new ArrayList<>();
        public Builder size(String s) { size = s; return this; }
        public Builder topping(String t) { toppings.add(t); return this; }
        public Pizza build() { return new Pizza(this); }
    }
}`
  ],
  "Prototype": [
    "Prototype creates new objects by copying an existing instance, useful when construction is expensive or the concrete type is unknown. In Java, prefer copy constructors over clone.",
    "A prototype object provides a copy operation, and clients clone it instead of constructing from scratch, producing a new independent instance.",
    "Creating an object from scratch may require costly setup, and callers may only hold an interface reference.",
    "Use it for templates, default configurations and cloning of complex configured objects, such as game units or document templates.",
    "Avoid it when construction is cheap or the object graph is hard to copy deeply. Object.clone is error-prone.",
    "Provide a copy constructor or a copy method that deep copies mutable state, and keep a registry of prototypes if needed.",
    "Pros: avoids expensive setup, hides concrete classes. Cons: deep copy complexity and clone pitfalls.",
    "Alternatives are factories, builders, serialisation-based copying and immutable objects with withers.",
    `class Report {
    private final List<String> sections;
    Report(List<String> sections) { this.sections = new ArrayList<>(sections); }
    Report(Report other) { this(other.sections); }          // copy constructor
    Report copy() { return new Report(this); }
}
Report monthly = template.copy();`
  ],
  "Object Pool": [
    "An object pool reuses expensive-to-create objects, such as connections and threads, instead of creating and destroying them. It trades memory and complexity for creation cost, and is used by connection and thread pools.",
    "A pool holds idle instances, hands them out on request, validates them, and takes them back on release, with limits and timeouts.",
    "Creating database connections or threads per request is slow and unbounded.",
    "Use it for expensive, reusable resources: JDBC connections (HikariCP), threads, parsers and large buffers.",
    "Avoid pooling cheap objects; modern allocation and GC are fast, and pools add complexity and stale-state risks.",
    "Use proven libraries (HikariCP, Apache Commons Pool), size by workload, validate and reset objects on return, and always release in finally.",
    "Pros: faster acquisition, bounded resource use. Cons: leaks, stale state, contention and tuning needs.",
    "Alternatives are creating on demand, thread-per-task with virtual threads, and ThreadLocal caching.",
    `try (Connection c = dataSource.getConnection()) {      // borrowed from the pool
    // use it
}                                                       // close() returns it to the pool`
  ],

  "Adapter": [
    "Adapter wraps an incompatible interface so it matches the one clients expect, letting existing classes work together without changing them. Common for third-party SDKs and legacy integration.",
    "An adapter implements the target interface and delegates to an adaptee, translating calls and data between them.",
    "You often cannot modify a library or legacy class, but your code expects a different interface.",
    "Use it to integrate vendor APIs, legacy systems, and to isolate external dependencies behind your own interface (ports and adapters).",
    "Avoid it when you can change the original class cleanly, and do not leak the adaptee's types through the adapter.",
    "Define your interface, implement an adapter that holds the third-party client, and map exceptions and models at the boundary.",
    "Pros: reuse without modification, isolation of vendors. Cons: extra layer and mapping code.",
    "Alternatives are changing the source, Facade (simplifies rather than converts) and anti-corruption layers.",
    `interface PaymentGateway { Receipt charge(Money m, Card c); }

class StripeAdapter implements PaymentGateway {
    private final StripeClient stripe;                 // third-party SDK
    StripeAdapter(StripeClient s) { this.stripe = s; }
    public Receipt charge(Money m, Card c) {
        Charge ch = stripe.charges().create(m.cents(), m.currency(), c.token());
        return new Receipt(ch.getId());                // translate to our model
    }
}`
  ],
  "Decorator": [
    "Decorator wraps an object with the same interface to add behaviour dynamically, offering a flexible alternative to subclassing. Java I/O streams and Spring's wrappers are classic examples.",
    "A decorator implements the same interface as the component, holds a reference to one, and adds behaviour before or after delegating. Decorators can be stacked.",
    "Subclassing for every combination of features leads to class explosions and static behaviour.",
    "Use it to add cross-cutting features like logging, caching, retry and compression around a component at runtime.",
    "Avoid it when only one fixed variation exists, and watch for long stacks that are hard to debug.",
    "Implement the interface, wrap the delegate in the constructor, add your behaviour around calls, and compose in configuration.",
    "Pros: composable, open for extension. Cons: many small objects and ordering subtleties.",
    "Alternatives are inheritance, AOP proxies, interceptors and middleware.",
    `interface Repo { User find(long id); }
class JdbcRepo implements Repo { ... }

class CachingRepo implements Repo {
    private final Repo delegate; private final Map<Long, User> cache = new ConcurrentHashMap<>();
    CachingRepo(Repo d) { delegate = d; }
    public User find(long id) { return cache.computeIfAbsent(id, delegate::find); }
}
Repo repo = new CachingRepo(new JdbcRepo());

// JDK: new BufferedReader(new InputStreamReader(in))`
  ],
  "Proxy": [
    "Proxy provides a stand-in with the same interface to control access: lazy loading, security checks, caching, remote access or logging. Spring AOP and Hibernate lazy loading use proxies.",
    "A proxy holds a reference to the real subject and decides when and how to forward calls. Types include virtual (lazy), protection, remote and caching proxies.",
    "Sometimes access to an object should be deferred, restricted or intercepted without callers knowing.",
    "Use it for lazy initialisation, access control, remote stubs, transactions and metrics around calls.",
    "Avoid it when direct access is fine. Proxies break on self-invocation, final classes or methods, and equality or identity checks.",
    "Use JDK dynamic proxies for interfaces or CGLIB subclassing for classes, usually created by frameworks. Hand-write one when you need a specific control point.",
    "Pros: transparent control of access. Cons: indirection, debugging difficulty and framework limits like self-invocation.",
    "Alternatives are Decorator (same structure, different intent), AOP weaving and explicit wrappers.",
    `class LazyImage implements Image {
    private RealImage real;                  // created on first use
    private final String path;
    LazyImage(String path) { this.path = path; }
    public void display() {
        if (real == null) real = new RealImage(path);
        real.display();
    }
}`
  ],
  "Facade": [
    "A Facade offers a simple unified interface to a complex subsystem, hiding its internals. Service layers and SDK wrappers often act as facades.",
    "The facade exposes a few high-level operations that coordinate several subsystem classes, while the subsystem remains accessible if needed.",
    "Clients otherwise must understand and orchestrate many classes and their call order.",
    "Use it to simplify use of a complicated library, to give a clean API to a module, and as an entry point in layered architecture.",
    "Avoid turning it into a god class that does everything, or using it to hide poor subsystem design.",
    "Create a class with intention-revealing methods that call the subsystem in the right order, keep it thin, and keep business logic in the subsystem.",
    "Pros: simplicity and reduced coupling to the subsystem. Cons: can become a bloated catch-all.",
    "Alternatives are Adapter (changes the interface), Mediator, and application services in hexagonal architecture.",
    `class OrderFacade {
    private final Inventory inventory; private final Payment payment; private final Shipping shipping;
    OrderFacade(Inventory i, Payment p, Shipping s) { inventory = i; payment = p; shipping = s; }

    Receipt placeOrder(Cart cart, Card card) {
        inventory.reserve(cart);
        Receipt r = payment.charge(cart.total(), card);
        shipping.schedule(cart);
        return r;
    }
}`
  ],
  "Composite": [
    "Composite lets you treat individual objects and groups uniformly through a common interface, modelling tree structures such as file systems, UI components and organisation charts.",
    "A component interface is implemented by leaves and by composites that hold children and delegate to them recursively.",
    "Client code would otherwise need to distinguish single items from collections everywhere.",
    "Use it for hierarchical data: menus, file trees, expression trees, permissions and bill-of-materials.",
    "Avoid it when the structure is flat, or when leaves and composites differ so much that a common interface becomes awkward.",
    "Define the component interface, implement Leaf and Composite (with add and remove), and call the operation on the root, which recurses.",
    "Pros: uniform treatment and simple clients. Cons: overly general interfaces and harder type restrictions.",
    "Alternatives are plain collections, visitors for external operations, and sealed hierarchies with pattern matching.",
    `interface FileNode { long size(); }
record FileLeaf(String name, long bytes) implements FileNode {
    public long size() { return bytes; }
}
record Folder(String name, List<FileNode> children) implements FileNode {
    public long size() { return children.stream().mapToLong(FileNode::size).sum(); }
}`
  ],
  "Bridge": [
    "Bridge separates an abstraction from its implementation so both can vary independently, replacing a class explosion from combining two dimensions of variation with composition.",
    "The abstraction holds a reference to an implementor interface, and refined abstractions and concrete implementors extend independently.",
    "Inheritance on two axes, such as shape and rendering API, produces a cross product of subclasses.",
    "Use it when two orthogonal dimensions vary, such as notification type and delivery channel, or device and remote control.",
    "Avoid it when only one dimension varies, where a simple strategy is enough.",
    "Define the implementor interface, give the abstraction a field of it, and combine them at construction.",
    "Pros: independent evolution, fewer classes. Cons: more up-front design.",
    "Alternatives are Strategy (similar structure, different intent), inheritance and adapters.",
    `interface Renderer { void drawCircle(double r); }
class VectorRenderer implements Renderer { ... }
class RasterRenderer implements Renderer { ... }

abstract class Shape {
    protected final Renderer renderer;
    Shape(Renderer r) { renderer = r; }
    abstract void draw();
}
class Circle extends Shape {
    double radius;
    Circle(Renderer r, double radius) { super(r); this.radius = radius; }
    void draw() { renderer.drawCircle(radius); }
}`
  ],
  "Flyweight": [
    "Flyweight shares common immutable state among many objects to save memory, separating shared intrinsic state from per-object extrinsic state. String interning and Integer.valueOf caching are examples.",
    "Flyweight objects hold shared data and are obtained from a factory or cache. Context-specific data is supplied by the caller.",
    "Creating huge numbers of objects with duplicated data wastes memory.",
    "Use it for very large numbers of similar objects such as glyphs, map tiles, particles and repeated reference data.",
    "Avoid it when objects are few or mostly unique, since the complexity is not worth it.",
    "Make shared state immutable, manage instances in a factory with a map, and pass extrinsic state in method parameters.",
    "Pros: big memory savings. Cons: complexity and shared-state discipline.",
    "Alternatives are interning, caches, primitive arrays and enums.",
    `class GlyphFactory {
    private static final Map<Character, Glyph> CACHE = new ConcurrentHashMap<>();
    static Glyph get(char c) { return CACHE.computeIfAbsent(c, Glyph::new); }
}
// Glyph holds shared font data; position (x, y) is passed to draw(x, y)`
  ],

  "Strategy": [
    "Strategy encapsulates interchangeable algorithms behind an interface so behaviour can be selected at runtime, replacing conditionals. With lambdas it often becomes a simple functional interface, and it is the heart of the Open/Closed principle.",
    "A context holds a strategy reference and delegates to it, and concrete strategies implement different algorithms for the same task.",
    "Large if or switch blocks choosing between algorithms are hard to extend and test.",
    "Use it for pricing rules, sorting comparators, validation rules, payment methods and routing decisions.",
    "Avoid it when only one algorithm exists or the choice will never change.",
    "Define an interface or use a functional interface, implement variants, inject or register them in a map by key, and select at runtime. Spring can inject a Map of bean names to strategies.",
    "Pros: extensible, testable, no conditionals. Cons: more classes and the client must know about strategies.",
    "Alternatives are simple conditionals, State pattern (similar structure, internal transitions) and lambdas.",
    `interface ShippingCost { Money calculate(Order o); }

Map<String, ShippingCost> strategies = Map.of(
    "standard", o -> Money.of(5),
    "express",  o -> Money.of(15),
    "free",     o -> Money.ZERO);

Money cost = strategies.get(order.shippingType()).calculate(order);

// JDK: Comparator is a strategy
list.sort(Comparator.comparing(Person::age));`
  ],
  "Observer": [
    "Observer lets objects subscribe to events from a subject and be notified automatically, decoupling producers from consumers. It underlies event listeners, Spring application events and reactive streams.",
    "A subject keeps a list of observers and notifies them on state change. Observers register and unregister themselves, and push or pull data.",
    "Without it, the subject must know every dependent object and call each directly.",
    "Use it for UI events, domain events, cache invalidation, auditing and any one-to-many notification.",
    "Avoid it when order and reliability matter across services (use a message broker), and beware memory leaks from listeners that are never removed.",
    "Define a listener interface, keep a thread-safe list such as CopyOnWriteArrayList, notify on change, and unregister in cleanup. Use ApplicationEventPublisher in Spring.",
    "Pros: loose coupling and dynamic subscriptions. Cons: hidden flow, ordering issues, leaks and exceptions in listeners.",
    "Alternatives are direct calls, message brokers, Flow and reactive streams, and callbacks.",
    `interface OrderListener { void onPlaced(Order o); }

class OrderService {
    private final List<OrderListener> listeners = new CopyOnWriteArrayList<>();
    void subscribe(OrderListener l) { listeners.add(l); }
    void place(Order o) {
        save(o);
        listeners.forEach(l -> l.onPlaced(o));
    }
}`
  ],
  "Template Method": [
    "Template Method defines the skeleton of an algorithm in a base class and lets subclasses override specific steps, keeping the overall order fixed. Spring's JdbcTemplate and many framework base classes use the idea.",
    "The base class has a final method calling abstract or hook methods in sequence. Subclasses implement the varying steps.",
    "Several algorithms share the same structure but differ in a few steps, and copying the structure duplicates logic.",
    "Use it when you control a family of classes sharing a workflow, such as import pipelines, report generation and test fixtures.",
    "Avoid it when composition and strategy provide more flexibility, since inheritance couples subclasses to the base class.",
    "Mark the template method final, declare steps as protected abstract or hooks with defaults, and document the contract. Alternatively pass steps as lambdas.",
    "Pros: reuse of structure and enforced order. Cons: inheritance coupling and the fragile base class problem.",
    "Alternatives are Strategy with composition, callbacks and lambdas, as in JdbcTemplate.",
    `abstract class DataImporter {
    public final void run() {            // template: fixed order
        List<String> rows = read();
        rows.stream().map(this::parse).forEach(this::save);
    }
    protected abstract List<String> read();
    protected abstract Record parse(String row);
    protected void save(Record r) { repository.save(r); }   // hook with default
}`
  ],
  "Chain of Responsibility": [
    "Chain of Responsibility passes a request along a chain of handlers until one handles it, decoupling sender from receivers. Servlet filters, Spring Security filter chain and interceptors are examples.",
    "Each handler decides to process the request, pass it on, or both. The chain order defines behaviour.",
    "Hard-coded sequences of checks or processing steps are inflexible and cannot be reordered or extended easily.",
    "Use it for request pipelines, validation steps, authorisation checks, approval workflows and middleware.",
    "Avoid it when exactly one known handler exists, or when the chain becomes hard to reason about with many interdependent handlers.",
    "Define a handler interface with a next reference or a list processed in order, and let each decide to continue. Make the order explicit and testable.",
    "Pros: flexible pipelines, single-responsibility handlers. Cons: no guarantee a request is handled and debugging a long chain is harder.",
    "Alternatives are a list of strategies, Decorator, event buses and pipeline libraries.",
    `interface Handler { void handle(Request r, Chain next); }
class Chain {
    private final Iterator<Handler> it;
    Chain(List<Handler> hs) { it = hs.iterator(); }
    void proceed(Request r) { if (it.hasNext()) it.next().handle(r, this); }
}
class AuthHandler implements Handler {
    public void handle(Request r, Chain next) {
        if (!r.isAuthenticated()) throw new SecurityException();
        next.proceed(r);
    }
}`
  ],
  "Command": [
    "Command turns a request into an object so it can be queued, logged, retried or undone, decoupling the invoker from the receiver. Runnable, undo stacks and job queues apply it.",
    "A command object encapsulates an action and its parameters with an execute method, and optionally undo. An invoker triggers it and a receiver does the work.",
    "Operations sometimes need to be scheduled, stored, audited or reversed, which direct method calls cannot do.",
    "Use it for task queues, undo and redo, transactional scripts, macro recording and message handlers.",
    "Avoid it for simple direct calls where no queuing or undo is needed.",
    "Define a Command interface, implement concrete commands holding receiver and data, and run them through an executor or queue. Store commands for undo.",
    "Pros: decoupling, queueing, undo, auditing. Cons: many small classes.",
    "Alternatives are lambdas and Runnable, event sourcing and message queues.",
    `interface Command { void execute(); void undo(); }
class AddItemCommand implements Command {
    private final Cart cart; private final Item item;
    AddItemCommand(Cart c, Item i) { cart = c; item = i; }
    public void execute() { cart.add(item); }
    public void undo()    { cart.remove(item); }
}
Deque<Command> history = new ArrayDeque<>();
Command c = new AddItemCommand(cart, item); c.execute(); history.push(c);
history.pop().undo();`
  ],
  "State": [
    "State lets an object change behaviour when its internal state changes by delegating to state objects, replacing large state-based conditionals. It models state machines such as order or connection lifecycles.",
    "A context holds a current state object implementing a state interface. Calls delegate to it and states trigger transitions by setting a new state in the context.",
    "Methods filled with switch statements on a status field become unmanageable and error-prone as states grow.",
    "Use it for workflows with defined transitions such as orders, tickets, payments and protocol connections.",
    "Avoid it for two or three simple states where an enum with a switch is clearer.",
    "Create an interface per behaviour, one class per state, and let each handle events and return or set the next state. Enums with abstract methods are a compact form, and Spring Statemachine exists for large cases.",
    "Pros: clear transitions and isolated behaviour. Cons: many classes for small machines.",
    "Alternatives are enums with switch, a transition table and state machine libraries.",
    `enum OrderState {
    NEW      { OrderState next() { return PAID; } },
    PAID     { OrderState next() { return SHIPPED; } },
    SHIPPED  { OrderState next() { return DELIVERED; } },
    DELIVERED{ OrderState next() { throw new IllegalStateException("final"); } };
    abstract OrderState next();
}`
  ],
  "Iterator": [
    "Iterator gives sequential access to a collection's elements without exposing its internal structure. It is built into Java through Iterable and the for-each loop, and custom iterators enable lazy or special traversals.",
    "Iterable returns an Iterator with hasNext and next, and optionally remove. Fail-fast iterators detect concurrent modification.",
    "Clients should traverse collections uniformly regardless of how they store data.",
    "Use it to make custom collections iterable, create lazy sequences and paginated or streaming data sources.",
    "Avoid modifying collections during iteration, except through the iterator's own remove.",
    "Implement Iterable<T>, return an Iterator with state tracking position, and use Iterator.remove to delete safely. For lazy pipelines use Stream.",
    "Pros: uniform traversal, encapsulation. Cons: single-pass, and ConcurrentModificationException risks.",
    "Alternatives are Stream, index loops, Spliterator and reactive streams.",
    `class Range implements Iterable<Integer> {
    private final int from, to;
    Range(int from, int to) { this.from = from; this.to = to; }
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            int cur = from;
            public boolean hasNext() { return cur < to; }
            public Integer next() { return cur++; }
        };
    }
}
for (int i : new Range(0, 5)) System.out.println(i);`
  ],
  "Visitor": [
    "Visitor adds new operations to a class hierarchy without modifying it by moving the operation into a separate visitor object with a method per element type. With sealed types and pattern matching it is often replaced by a switch.",
    "Elements accept a visitor and call back the matching visit method (double dispatch). Each new operation is a new visitor class.",
    "Adding operations to many classes in a stable hierarchy would pollute them with unrelated code.",
    "Use it when the element hierarchy is stable but operations change often, for example compilers, AST processing and document exporters.",
    "Avoid it when new element types are added often, since every visitor must change, and when pattern matching on sealed types is available.",
    "Add accept(Visitor) to elements, define a visitor interface with a visit method per type, and implement visitors. In modern Java prefer a sealed interface with a switch expression.",
    "Pros: new operations without touching elements. Cons: verbose and rigid to new element types.",
    "Alternatives are pattern matching for switch over sealed types, polymorphic methods and Strategy.",
    `sealed interface Expr permits Num, Add {}
record Num(int v) implements Expr {}
record Add(Expr l, Expr r) implements Expr {}

static int eval(Expr e) {
    return switch (e) {                       // modern replacement for Visitor
        case Num n -> n.v();
        case Add a -> eval(a.l()) + eval(a.r());
    };
}`
  ],
  "Mediator": [
    "Mediator centralises communication between objects so they do not refer to each other directly, reducing many-to-many coupling. Chat rooms, UI dialogs and some orchestrators follow it.",
    "Colleagues send messages to a mediator, which decides which others to notify or call, so colleagues only know the mediator.",
    "Direct references between many collaborating objects create a tangle that is hard to change.",
    "Use it for complex interactions among a set of components, such as form controls, workflow coordination and message routing.",
    "Avoid letting the mediator become a god object containing all logic, or using it for simple one-to-one interactions.",
    "Define a mediator interface, have colleagues call it, and implement the coordination logic in the mediator. Event buses are a loose form.",
    "Pros: reduced coupling between components. Cons: the mediator can grow complex.",
    "Alternatives are Observer, event bus and orchestration services.",
    `interface ChatRoom { void send(String from, String msg); }
class SimpleRoom implements ChatRoom {
    private final List<User> users = new ArrayList<>();
    void join(User u) { users.add(u); }
    public void send(String from, String msg) {
        users.stream().filter(u -> !u.name().equals(from)).forEach(u -> u.receive(from, msg));
    }
}`
  ],
  "Memento": [
    "Memento captures an object's internal state in an opaque snapshot so it can be restored later without breaking encapsulation. It is used for undo, checkpoints and rollbacks.",
    "An originator creates a memento of its state, a caretaker stores it, and the originator restores itself from it. The caretaker cannot read the state.",
    "Undo needs saved state, but exposing internals to save it would break encapsulation.",
    "Use it for editors, game save points, transaction rollbacks and wizards.",
    "Avoid it for large states stored many times without limits, which uses a lot of memory.",
    "Return an immutable snapshot object, store snapshots in a bounded history, and restore through the originator. Records make snapshots simple.",
    "Pros: undo without exposing state. Cons: memory cost and snapshot management.",
    "Alternatives are the Command pattern with undo, event sourcing and persistent data structures.",
    `class Editor {
    private String text = "";
    record Snapshot(String text) {}
    void type(String s) { text += s; }
    Snapshot save() { return new Snapshot(text); }
    void restore(Snapshot s) { text = s.text(); }
}
Deque<Editor.Snapshot> history = new ArrayDeque<>();
history.push(editor.save());
editor.type("hello");
editor.restore(history.pop());`
  ]
};
