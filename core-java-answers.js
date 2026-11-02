// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Encapsulation and Abstraction": [
    "Encapsulation hides state behind a small public interface so invariants cannot be broken from outside, and abstraction exposes what something does without how. Together they let you change internals without breaking callers.",
    "Encapsulation means private fields with controlled access through methods that enforce rules. Abstraction means modelling a concept through an interface or abstract type that exposes essential behaviour only.",
    "Public mutable fields let any code put an object into an invalid state and lock the design to its representation. Hiding the representation keeps the class free to evolve.",
    "Apply it to every class: keep fields private, validate in constructors and mutators, expose behaviour rather than raw data, and depend on interfaces across module boundaries.",
    "Do not add getters and setters for every field automatically; that is encapsulation in name only and gives an anemic model. Do not create abstractions for a single implementation with no foreseeable second.",
    "Make fields private final, enforce invariants in the constructor, expose intention-revealing methods such as account.withdraw(amount) instead of setBalance, return unmodifiable views of internal collections, and keep package-private types hidden.",
    "Pros: changeable internals, protected invariants, easier testing. Cons: more code, indirection, and over-abstraction if applied without a reason.",
    "Alternatives are public data structures and records for pure data carriers, procedural code with plain structs, and functional style with immutable data and functions.",
    `public final class Account {
    private long balanceCents;               // hidden state

    public void withdraw(long cents) {       // behaviour, not a setter
        if (cents <= 0 || cents > balanceCents) {
            throw new IllegalArgumentException("invalid amount");
        }
        balanceCents -= cents;
    }

    public long balance() { return balanceCents; }
}`
  ],
  "Inheritance vs Composition": [
    "Inheritance models an is-a relationship and couples a subclass to its parent's implementation; composition models has-a and delegates to collaborators. Favour composition, and use inheritance only for true substitutable subtypes.",
    "Inheritance reuses code by extending a class and overriding methods. Composition holds other objects as fields and forwards calls to them, often behind an interface.",
    "Deep hierarchies are fragile: a change in the base class breaks subclasses (the fragile base class problem), and subclasses inherit behaviour they may not want.",
    "Use inheritance for genuine subtype relationships with a stable base, such as framework extension points. Use composition for reuse, behaviour swapping at runtime, and combining capabilities.",
    "Do not extend a class just to reuse a method or to model things that merely share data. Do not inherit from concrete library classes like ArrayList for convenience.",
    "Hold a collaborator in a final field and delegate: class Cache { private final Map<K, V> store = new HashMap<>(); }. Define behaviour through interfaces, inject implementations, and mark classes final unless designed for extension.",
    "Pros of composition: flexible, testable, no fragile coupling. Cons: more boilerplate for delegation. Pros of inheritance: concise polymorphism. Cons: tight coupling and breakable encapsulation.",
    "Alternatives are interfaces with default methods, decorators, traits via sealed interfaces and records, and mixins in other languages.",
    `// Fragile: inherits all of ArrayList, including methods you do not want
class Stack<E> extends ArrayList<E> { }

// Better: composition exposes only what you intend
class Stack<E> {
    private final Deque<E> items = new ArrayDeque<>();
    void push(E e) { items.push(e); }
    E pop() { return items.pop(); }
}`
  ],
  "Polymorphism: Overloading vs Overriding": [
    "Overriding is runtime polymorphism: a subclass replaces an inherited method and the JVM picks the implementation from the actual object type. Overloading is compile-time: methods share a name with different parameters and the compiler chooses by the declared types.",
    "Overriding needs the same signature (with covariant return allowed), cannot reduce visibility or throw broader checked exceptions, and uses dynamic dispatch. Overloading depends on parameter lists and is resolved statically.",
    "Polymorphism lets code depend on a supertype while behaviour varies by implementation, which is the basis of most extensible designs.",
    "Use overriding to specialise behaviour through a common interface, and overloading to give convenient variants of the same operation.",
    "Avoid overloads that are ambiguous or differ only by boxing or varargs, and never rely on static, private or final methods being overridden; they are hidden, not overridden.",
    "Use @Override so the compiler checks you. Remember that static methods and fields are resolved by the declared type, and that overload resolution picks the most specific applicable method at compile time.",
    "Pros: extensibility and cleaner code. Cons: surprising overload resolution, harder reading of dispatch, and fragile base classes.",
    "Alternatives are pattern matching on sealed types, strategy objects, and function parameters.",
    `class Animal { String sound() { return "..."; } }
class Dog extends Animal { @Override String sound() { return "woof"; } }

Animal a = new Dog();
a.sound();                       // "woof"  (overriding: runtime type)

void print(Object o) { System.out.println("object"); }
void print(String s) { System.out.println("string"); }
Object x = "hi";
print(x);                        // "object" (overloading: declared type)`
  ],
  "Abstract Class vs Interface": [
    "An interface defines a capability contract with no state and allows a class to implement many; an abstract class shares state and partial implementation in a single inheritance line. Prefer interfaces for contracts and abstract classes for shared skeletons.",
    "Interfaces declare abstract, default, static and private methods and constants, with no instance fields. Abstract classes can hold fields, constructors and any mix of abstract and concrete methods, but a class extends only one.",
    "Java needed both a way to define roles that unrelated classes can play and a way to share common implementation among related classes.",
    "Use an interface when many unrelated types share a role (Comparable, Runnable). Use an abstract class when closely related types share state and template logic, as in a template method.",
    "Do not use an abstract class where an interface would keep options open, and do not stuff interfaces with default methods that hold real logic or state.",
    "Define the contract as an interface, then optionally provide an AbstractXxx skeleton implementing common parts (like AbstractList). Use sealed interfaces to restrict implementers, and default methods for backward-compatible evolution.",
    "Interfaces: flexible, multiple inheritance of type. Abstract classes: share code and state, single inheritance. Both can leak implementation if overused.",
    "Alternatives are composition with delegates, sealed hierarchies with records, and functional interfaces with lambdas.",
    `interface Notifier { void send(String msg); }               // contract

abstract class BaseNotifier implements Notifier {           // skeleton
    public final void send(String msg) { log(msg); doSend(msg); }
    private void log(String m) { System.out.println("sending " + m); }
    protected abstract void doSend(String msg);
}`
  ],
  "Access Modifiers and Packages": [
    "Java has four access levels: private, package-private (default), protected and public. Use the narrowest one, and use package structure to hide implementation details.",
    "private is class-only, default is same package, protected is same package plus subclasses, and public is everywhere. Modules (JPMS) add a further layer by controlling which packages are exported.",
    "Narrow visibility limits the surface that other code can depend on, which keeps refactoring cheap and invariants safe.",
    "Default to private, then widen only when needed. Use package-private for implementation classes and expose a small public API.",
    "Do not make fields public for convenience, and do not rely on protected for external extension without designing for it.",
    "Place implementation in a package and expose a factory or interface publicly. Keep tests in the same package to access package-private members. Use module-info exports to hide internal packages.",
    "Pros: strong boundaries, safer evolution. Cons: some boilerplate, and testing hidden classes needs same-package tests.",
    "Alternatives are JPMS strong encapsulation, nested private classes, and ArchUnit rules to enforce layering."
  ],
  "static, final and Initialisation Order": [
    "static belongs to the class, final prevents reassignment, overriding or subclassing, and initialisation follows a strict order: static blocks once at class load, then instance initialisers and constructors per object. Order bugs show up when a superclass constructor calls an overridable method.",
    "final on a variable means it can be assigned once, on a method it cannot be overridden, on a class it cannot be extended. Static members are initialised once when the class is initialised, parent before child.",
    "Class-level state, constants and guaranteed immutability need language support, and object construction needs a predictable sequence.",
    "Use static final for constants, final fields for immutability and thread safety, and static factory methods or holders for lazy singletons.",
    "Avoid mutable static state, which acts as a hidden global and hurts tests and concurrency. Never call overridable methods from constructors.",
    "Order for new Child(): parent static init, child static init (once), parent instance init and constructor, child instance init and constructor. A final field must be assigned in every constructor or initialiser.",
    "Pros: constants, immutability and safe publication via final. Cons: static state is hard to test and reset, and initialisation order is subtle.",
    "Alternatives are dependency-injected singletons, enums for constants, and records for immutable data.",
    `class Parent {
    static { System.out.println("1 parent static"); }
    { System.out.println("3 parent instance"); }
    Parent() { System.out.println("4 parent ctor"); }
}
class Child extends Parent {
    static { System.out.println("2 child static"); }
    { System.out.println("5 child instance"); }
    Child() { System.out.println("6 child ctor"); }
}
new Child();   // prints 1 2 3 4 5 6`
  ],

  "equals and hashCode Contract": [
    "If two objects are equal by equals they must have the same hashCode, and equals must be reflexive, symmetric, transitive, consistent and false for null. Break the contract and HashMap and HashSet silently misbehave.",
    "equals defines logical equality, hashCode returns an int used to place objects into hash buckets. Hash collections use hashCode to find the bucket and equals to confirm the match.",
    "The default Object versions use identity, which is wrong for value objects such as money or ids. Hash-based collections need a consistent pair to find stored keys.",
    "Override both for value-like classes used as map keys, set elements or compared in collections. Use records, which generate them from components.",
    "Do not override one without the other, include mutable fields that change while the object is a key, or use getClass versus instanceof inconsistently with subclasses.",
    "Use Objects.equals and Objects.hash over the same set of immutable fields, prefer final classes or records, and for JPA entities be careful with generated ids and lazy proxies.",
    "Pros: correct collection behaviour. Cons: boilerplate, subtle inheritance problems, and bugs that appear only under hashing.",
    "Alternatives are records, Lombok @EqualsAndHashCode, IDE generation, and Guava helpers.",
    `public final class Money {
    private final long cents; private final String currency;
    Money(long c, String cur) { cents = c; currency = cur; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money m)) return false;
        return cents == m.cents && currency.equals(m.currency);
    }
    @Override public int hashCode() { return Objects.hash(cents, currency); }
}`
  ],
  "Comparable vs Comparator": [
    "Comparable defines a class's natural ordering through compareTo, while Comparator defines an external ordering that can vary. Use Comparable for one obvious order and Comparator for everything else.",
    "Comparable<T> is implemented by the class itself with compareTo(T). Comparator<T> is a separate object with compare(a, b), with helpers such as comparing, thenComparing and reversed.",
    "Sorting needs a defined order, but a type may need different orders in different contexts, and you cannot modify library classes.",
    "Use Comparable for naturally ordered value types like dates and versions, and Comparator for sorting by field, nulls handling, multi-key orders and third-party classes.",
    "Do not make compareTo inconsistent with equals when used in sorted sets and maps, and never subtract ints for comparison, which can overflow.",
    "Use Comparator.comparing(Person::lastName).thenComparing(Person::firstName) and Comparator.nullsLast. Use Integer.compare and Long.compare rather than subtraction.",
    "Pros: flexible ordering. Cons: inconsistency with equals causes subtle TreeSet and TreeMap bugs.",
    "Alternatives are sorting by key extractors in streams, records with comparators defined in one place, and database ORDER BY.",
    `record Person(String first, String last, int age) {}

List<Person> people = ...;
people.sort(Comparator.comparing(Person::last)
        .thenComparing(Person::first)
        .thenComparing(Person::age, Comparator.reverseOrder()));

// WRONG: overflow for large values
// int compare(int a, int b) { return a - b; }
// RIGHT:
int c = Integer.compare(a, b);`
  ],
  "Immutability and Defensive Copies": [
    "An immutable object cannot change after construction, which makes it thread-safe, safe as a map key and easy to reason about. Make classes final, fields private final, and copy mutable inputs and outputs defensively.",
    "Immutable classes have no setters, final fields, no escaping of mutable internals and are not extensible. String, Integer, LocalDate and records are examples.",
    "Shared mutable state is the root of many bugs, including concurrency issues and broken hash keys. Immutability removes whole categories of them.",
    "Use it for value objects, DTOs, configuration, keys and anything shared between threads.",
    "Avoid it for very large objects updated frequently where copying is too costly, or when a mutable builder is more practical.",
    "Declare the class final, fields private final, copy in the constructor with List.copyOf, return unmodifiable views or copies from getters, and use records. Use withX methods or builders to create modified copies.",
    "Pros: thread safety, simpler reasoning, safe sharing and caching. Cons: object creation cost for changes, and awkward with some frameworks.",
    "Alternatives are mutable objects with synchronisation, copy-on-write structures, persistent data structures and Immutables or Lombok @Value.",
    `public final class Order {
    private final String id;
    private final List<String> items;

    public Order(String id, List<String> items) {
        this.id = id;
        this.items = List.copyOf(items);       // defensive copy in
    }
    public List<String> items() { return items; }  // already unmodifiable
}`
  ],
  "Pass by Value vs Reference": [
    "Java is always pass by value: for objects the value passed is a copy of the reference, so a method can mutate the object but cannot make the caller's variable point somewhere else.",
    "Primitives are copied. For objects the reference is copied, so both variables point at the same object until one is reassigned.",
    "Confusion causes real bugs: people expect reassignment inside a method to affect the caller, or mutation of a passed list to be isolated.",
    "Know it when designing APIs that accept collections or mutable objects, and when explaining defensive copying.",
    "Do not return or store mutable arguments directly if callers might change them later, and do not expect a swap method to work.",
    "Mutating through the reference is visible to the caller; reassigning the parameter is not. Copy inputs defensively when the object must stay unchanged.",
    "Pros: simple and predictable model. Cons: shared mutable references create aliasing bugs.",
    "Alternatives are immutable objects, returning new values, and passing copies or unmodifiable views.",
    `static void change(StringBuilder sb, String s, int n) {
    sb.append("!");     // visible to caller (same object)
    s = "changed";       // not visible (reassigns the local copy)
    n = 99;              // not visible
}
StringBuilder sb = new StringBuilder("hi");
String s = "text"; int n = 1;
change(sb, s, n);
// sb = "hi!", s = "text", n = 1`
  ],
  "Integer Cache and == Pitfalls": [
    "== on objects compares references, and Integer.valueOf caches values from -128 to 127, so == works for small values and fails for larger ones. Always compare wrappers with equals or unbox them.",
    "Autoboxing calls valueOf, which returns cached instances for small values in Integer, Short, Byte, Long and Character, and new objects otherwise. Strings behave similarly via the string pool.",
    "Interviewers use it to test understanding of identity versus equality, and real code hits it when comparing Long ids with ==.",
    "Know it whenever comparing wrappers, strings or enums, and when reviewing code using == on objects.",
    "Never rely on the cache for correctness. Do not compare boxed values with == even if tests pass with small numbers.",
    "Use equals, Objects.equals or compare primitives. Beware of unboxing a null wrapper, which throws NullPointerException.",
    "Pros of caching: fewer allocations. Cons: misleading == results and hidden unboxing costs.",
    "Alternatives are using primitives where possible, and records or value classes in future Java versions.",
    `Integer a = 127, b = 127;
System.out.println(a == b);        // true  (cached)

Integer c = 128, d = 128;
System.out.println(c == d);        // false (different objects)
System.out.println(c.equals(d));   // true

Long id1 = 1000L, id2 = 1000L;
System.out.println(id1 == id2);    // false: use equals`
  ],
  "Records": [
    "Records are concise immutable data carriers with a canonical constructor, accessors, equals, hashCode and toString generated from their components. Use them for DTOs, value objects and pattern matching, not for mutable entities.",
    "A record declares its components in the header, is implicitly final, extends java.lang.Record, and may have compact constructors for validation, static methods and implemented interfaces, but no instance fields beyond components.",
    "Plain data classes needed a lot of boilerplate for constructors, getters, equals and hashCode, which obscured intent and invited mistakes.",
    "Use them for DTOs, API responses, map keys, tuples, events, and with sealed interfaces and record patterns for domain modelling.",
    "Avoid them for JPA entities, objects with mutable state or inheritance, or where frameworks require setters and no-arg constructors. Components that are mutable are still mutable.",
    "Write record Point(int x, int y) { Point { if (x < 0) throw new IllegalArgumentException(); } }. Copy mutable components in a compact constructor, and add methods as needed.",
    "Pros: less code, immutability by default, clear intent. Cons: cannot extend classes, limited framework support in some areas, and shallow immutability.",
    "Alternatives are Lombok @Value, hand-written immutable classes, and Kotlin data classes.",
    `public record Money(long cents, String currency) {
    public Money {                                  // compact constructor
        if (cents < 0) throw new IllegalArgumentException("negative");
        currency = currency.toUpperCase();
    }
    public Money plus(Money o) { return new Money(cents + o.cents, currency); }
}`
  ],
  "clone and Copy Constructors": [
    "Object.clone is a flawed, shallow-copy mechanism that is widely discouraged. Prefer copy constructors or static copy factories, or immutable types that need no copying.",
    "clone requires implementing Cloneable (a marker without a method), calls the protected Object.clone to make a shallow field-by-field copy, and does not call constructors.",
    "Copying objects is common, but clone's design has hidden pitfalls: no constructor invocation, shallow copies, checked exceptions and a fragile contract in inheritance.",
    "Know it for interviews and legacy code. For new code, copy via constructors or factory methods, or use records and immutable types.",
    "Avoid implementing Cloneable in new classes. Never use clone on arrays of mutable objects expecting deep copies.",
    "Write a copy constructor like public Order(Order other) { this.id = other.id; this.items = new ArrayList<>(other.items); } for a deep enough copy. For deep graphs consider serialisation frameworks or explicit mapping.",
    "Pros of copy constructors: explicit and type-safe. Cons: manual effort for large graphs. clone is terse but error-prone.",
    "Alternatives are records with withers, serialisation-based copies, MapStruct mappers and persistent data structures."
  ],

  "String Pool and Immutability": [
    "Strings are immutable and string literals are interned in a pool, so identical literals share one object. Immutability enables safe sharing, caching of hash codes and security, at the cost of creating new objects on every change.",
    "The string pool (in the heap since Java 7) stores unique literals. new String creates a distinct object, and intern returns the pooled one. Strings cache their hashCode and are safe as keys.",
    "Immutability makes strings thread-safe, safe for security-sensitive values like class names and file paths, and lets the JVM share instances to save memory.",
    "Know it for explaining == versus equals, memory use with many repeated strings, and why concatenating in loops is slow.",
    "Do not call intern on large volumes of dynamic data, and never compare strings with ==. Do not store passwords in Strings if you need to wipe them; prefer char arrays.",
    "Compare with equals, build with StringBuilder in loops, and consider G1's string deduplication for repeated values. Since Java 9 strings use compact byte arrays.",
    "Pros: safety, sharing, caching. Cons: garbage from repeated modification and memory held by the pool for interned values.",
    "Alternatives are StringBuilder for mutation, char arrays for secrets, and text blocks for multi-line literals.",
    `String a = "java";
String b = "java";
String c = new String("java");

System.out.println(a == b);          // true  (same pooled literal)
System.out.println(a == c);          // false (new object)
System.out.println(a.equals(c));     // true
System.out.println(a == c.intern()); // true`
  ],
  "String vs StringBuilder vs StringBuffer": [
    "String is immutable, StringBuilder is a fast mutable buffer for single-threaded use, and StringBuffer is the synchronised legacy version. Use StringBuilder for building text in loops.",
    "Each String modification creates a new object. StringBuilder and StringBuffer keep a resizable internal array and append in place, with StringBuffer synchronising each method.",
    "Concatenating in a loop with + creates many temporary objects. A builder avoids them.",
    "Use String for constants and values, StringBuilder for assembling text, and StringBuffer only for legacy code that shares a buffer between threads.",
    "Do not use StringBuffer in new code expecting thread safety; compound operations are still not atomic. Do not over-optimise simple one-off concatenations; the compiler handles them.",
    "Presize the builder with a capacity when the size is known, use String.join or Collectors.joining for joins, and let the compiler use invokedynamic-based concatenation for simple cases.",
    "Pros: StringBuilder is fast and memory-friendly. Cons: StringBuffer's locking is slow and rarely useful.",
    "Alternatives are String.join, StringJoiner, text blocks, and formatted strings.",
    `// slow: new String every iteration
String s = "";
for (int i = 0; i < 10_000; i++) s += i;

// fast
StringBuilder sb = new StringBuilder(64_000);
for (int i = 0; i < 10_000; i++) sb.append(i);
String result = sb.toString();`
  ],
  "Unicode and Character Encoding": [
    "Java strings are sequences of UTF-16 code units, so characters outside the Basic Multilingual Plane take two chars. Always specify the charset explicitly, preferably UTF-8, when converting between bytes and text.",
    "char is a 16-bit UTF-16 unit, and supplementary characters like emoji are surrogate pairs. Code points are accessed with codePointAt and codePoints. Encodings convert between text and bytes.",
    "Platform-default charsets caused data corruption between systems. Unicode awareness avoids bugs with length, reverse and substring on international text.",
    "Matters for international text, file and network I/O, databases and any API exchanging text bytes.",
    "Do not assume length equals the number of characters, or rely on the default charset (UTF-8 is the default from Java 18). Do not split strings in the middle of a surrogate pair.",
    "Use new String(bytes, StandardCharsets.UTF_8) and getBytes(UTF_8), use codePoints() for iteration, and configure file.encoding and database and HTTP encodings consistently.",
    "Pros: full international support. Cons: surprises with surrogate pairs and normalisation (composed versus decomposed forms).",
    "Alternatives are ICU4J for advanced text handling, and java.text.Normalizer for comparison of equivalent forms."
  ],

  "Checked vs Unchecked Exceptions": [
    "Checked exceptions must be declared or caught and signal recoverable conditions; unchecked exceptions (RuntimeException and Error) signal programming errors. Modern code mostly uses unchecked exceptions and handles errors at clear boundaries.",
    "Checked exceptions extend Exception but not RuntimeException, and the compiler enforces handling. Unchecked ones extend RuntimeException or Error and need no declaration.",
    "The language wanted to force callers to consider recoverable failures. In practice checked exceptions clutter APIs and push low-level details up layers.",
    "Use checked exceptions for failures the caller can reasonably recover from, and unchecked for bugs such as null arguments, invalid state and for most application-level failures.",
    "Do not catch Exception or Throwable broadly, swallow exceptions, or declare throws Exception. Do not use exceptions for normal control flow.",
    "Wrap low-level checked exceptions into meaningful unchecked ones preserving the cause, translate at layer boundaries, and handle centrally, for example with @ControllerAdvice. Spring translates SQLException into DataAccessException.",
    "Pros of checked: explicit failure handling. Cons: boilerplate and leaking abstractions. Pros of unchecked: cleaner code. Cons: failures can be missed.",
    "Alternatives are Optional or result types for expected absence, and sealed Result types for explicit failure modelling.",
    `try {
    Files.readString(path);
} catch (IOException e) {                          // checked: must handle
    throw new ConfigException("cannot read " + path, e);  // wrap, keep cause
}`
  ],
  "finally and Exception Pitfalls": [
    "finally always runs, even on return or exception, which is why a return or throw inside finally can swallow the original exception. Prefer try-with-resources, preserve causes, and avoid returning from finally.",
    "finally executes after try and catch complete, except on JVM exit or crash. If finally throws or returns, it overrides the earlier exception or return value.",
    "Cleanup needs to happen regardless of the outcome, but misuse hides bugs and loses stack traces.",
    "Use finally or try-with-resources for releasing resources, and know the pitfalls for interviews and code reviews.",
    "Never return, break or throw inside finally, never swallow with empty catch blocks, and do not catch exceptions just to log and rethrow repeatedly.",
    "Use try-with-resources so suppressed exceptions are retained, rethrow with the cause attached, and log once at the boundary where you handle the exception.",
    "Pros: guaranteed cleanup. Cons: tricky control flow and hidden exceptions if misused.",
    "Alternatives are try-with-resources, AutoCloseable helper methods, and framework templates.",
    `static int tricky() {
    try {
        throw new RuntimeException("lost");
    } finally {
        return 1;      // swallows the exception, method returns 1
    }
}`
  ],
  "Designing Custom Exceptions": [
    "Create custom exceptions to express domain failures with enough context to act on, extend RuntimeException for most cases, always keep the cause, and avoid deep hierarchies.",
    "A custom exception is a class extending Exception or RuntimeException, with constructors accepting a message and cause, and optionally fields like error codes or the offending id.",
    "Generic exceptions like RuntimeException give callers no way to distinguish failures or respond appropriately.",
    "Use them for meaningful domain errors such as OrderNotFoundException or InsufficientFundsException, which a central handler can map to HTTP status codes.",
    "Avoid one exception per tiny case or a huge hierarchy. Do not put sensitive data in messages, and do not carry mutable or large payloads.",
    "Provide constructors with message and cause, add structured fields rather than parsing messages, make them serialisable consistently, and map them in an exception handler.",
    "Pros: expressive and handleable errors. Cons: more classes to maintain and risk of overuse.",
    "Alternatives are standard exceptions like IllegalArgumentException and IllegalStateException, error codes in a result type, and ResponseStatusException in Spring.",
    `public class OrderNotFoundException extends RuntimeException {
    private final String orderId;
    public OrderNotFoundException(String orderId) {
        super("Order not found: " + orderId);
        this.orderId = orderId;
    }
    public String orderId() { return orderId; }
}`
  ],

  "Generics and Wildcards (PECS)": [
    "Generics add compile-time type safety, and wildcards make APIs flexible: use extends when a collection produces values you read, and super when it consumes values you write (Producer Extends, Consumer Super).",
    "A type parameter such as T is replaced by a concrete type. ? extends T accepts T or subtypes and is read-only, ? super T accepts T or supertypes and is write-friendly, and unbounded ? is for unknown types.",
    "Generic types are invariant: List<Integer> is not a List<Number>. Wildcards recover flexibility while keeping safety.",
    "Use them on method parameters of utilities, such as copy and sort methods, and when designing library APIs.",
    "Do not use wildcards in return types, which force callers to deal with them, and do not use raw types or unchecked casts.",
    "Follow PECS: copy(List<? super T> dst, List<? extends T> src). Use bounded types like T extends Comparable<? super T> for algorithms that need ordering.",
    "Pros: type-safe flexible APIs. Cons: complex signatures and confusing compiler errors.",
    "Alternatives are plain types for simple cases, overloads, and Object with casts (unsafe).",
    `// Producer Extends: we only read from src
// Consumer Super: we only write to dst
static <T> void copy(List<? super T> dst, List<? extends T> src) {
    for (T item : src) dst.add(item);
}

List<Number> numbers = new ArrayList<>();
copy(numbers, List.of(1, 2, 3));   // Integer list accepted`
  ],
  "Type Erasure and Reification": [
    "Generic type information exists only at compile time and is erased to bounds in bytecode, so you cannot create generic arrays, use instanceof with parameterised types or call new T(). Pass a Class token or use a type token to retain the type.",
    "The compiler checks generics, inserts casts and erases type parameters to Object or their bound, generating bridge methods where needed. Generic information remains in some signatures through reflection.",
    "Erasure kept backward compatibility with pre-generics bytecode so existing libraries kept running.",
    "Know it to explain restrictions, heap pollution, overload clashes like f(List<String>) and f(List<Integer>), and how frameworks capture types, for example Jackson TypeReference.",
    "Do not rely on runtime type of generics, mix raw and generic types, or create arrays of generics without understanding the warnings.",
    "Pass Class<T> for runtime needs, use TypeReference or ParameterizedTypeReference for generic types in deserialisation, and avoid unchecked casts or isolate them with @SuppressWarnings in one place.",
    "Pros: compatibility. Cons: lost runtime types and awkward workarounds.",
    "Alternatives are reified generics (C#, Kotlin inline), code generation and subclass-based type tokens.",
    `List<String> strings = new ArrayList<>();
List<Integer> ints = new ArrayList<>();
System.out.println(strings.getClass() == ints.getClass());   // true

// Retain the type with a token
<T> T read(String json, Class<T> type) { return mapper.readValue(json, type); }

// Generic type needs a type reference
List<User> users = mapper.readValue(json, new TypeReference<List<User>>() {});`
  ],

  "Reflection": [
    "Reflection inspects and manipulates classes, methods and fields at runtime, and powers frameworks like Spring, Hibernate and Jackson. It is flexible but slower, bypasses compile-time checks and is restricted by module encapsulation.",
    "The java.lang.reflect API exposes Class, Method, Field and Constructor objects, allowing instantiation, method invocation and field access, including private members through setAccessible.",
    "Frameworks must work with classes they did not know at compile time: dependency injection, serialisation, ORM mapping, and annotations processing.",
    "Use it in framework or library code, plugin systems, serialisation and test utilities.",
    "Avoid it in application business logic where interfaces and polymorphism work, and avoid it in hot paths. It can break with strong encapsulation and in native image without hints.",
    "Obtain the Class, find members with getDeclaredMethod, call invoke, and cache the lookups. For performance consider MethodHandles or LambdaMetafactory. Use --add-opens only as a last resort.",
    "Pros: very flexible. Cons: slower, loses type safety, hurts refactoring and security, and needs extra configuration for GraalVM native images.",
    "Alternatives are interfaces and polymorphism, MethodHandles and VarHandles, code generation with annotation processors, and ServiceLoader.",
    `Class<?> c = Class.forName("com.app.Greeter");
Object g = c.getDeclaredConstructor().newInstance();
Method m = c.getMethod("greet", String.class);
Object result = m.invoke(g, "world");

Field f = c.getDeclaredField("secret");
f.setAccessible(true);                // may fail under module encapsulation
Object value = f.get(g);`
  ],
  "Annotations and Processors": [
    "Annotations attach metadata that the compiler, tools or runtime reflection read, and annotation processors generate code at compile time. Frameworks use them for declarative configuration, trading explicitness for brevity.",
    "An annotation is declared with @interface and controlled by @Retention (source, class, runtime) and @Target. Processors run during compilation to validate or generate code through the JSR 269 API.",
    "Configuration kept next to the code it affects is easier to maintain than external files, and compile-time generation avoids runtime reflection cost.",
    "Use them for markers and configuration such as @Transactional, validation constraints, and compile-time tools like Lombok, MapStruct and Dagger.",
    "Avoid hiding complex behaviour in annotations or stacking so many that code becomes impossible to follow.",
    "Declare the annotation, read it with getAnnotation at runtime, or write an AbstractProcessor registered via META-INF/services to generate classes at build time.",
    "Pros: concise, declarative, tool friendly. Cons: hidden magic, reflection overhead at runtime, and complex debugging.",
    "Alternatives are explicit Java configuration, XML or YAML, and conventions.",
    `@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Timed { String name() default ""; }

for (Method m : Service.class.getDeclaredMethods()) {
    Timed t = m.getAnnotation(Timed.class);
    if (t != null) System.out.println("timed: " + m.getName());
}`
  ],
  "Dynamic Proxies": [
    "A dynamic proxy creates an object at runtime that implements given interfaces and routes every call to an InvocationHandler. It is the basis of Spring AOP, declarative transactions and many mocking and remoting libraries.",
    "java.lang.reflect.Proxy.newProxyInstance builds a class implementing interfaces and delegates calls to a handler, which can run code before and after the target. CGLIB or ByteBuddy create subclass proxies for classes.",
    "Cross-cutting behaviour such as logging, security and transactions should not be duplicated in every method of every class.",
    "Use it to wrap behaviour around interface calls: logging, timing, caching, remote call stubs and lazy loading.",
    "Avoid it when a plain decorator is clearer. JDK proxies need interfaces, and proxies do not intercept self-invocation or final methods when subclass-based.",
    "Implement InvocationHandler, call method.invoke(target, args) inside, and create the proxy with the class loader and interfaces. Spring chooses JDK or CGLIB proxies automatically.",
    "Pros: transparent cross-cutting behaviour. Cons: reflection overhead, debugging difficulty and limitations with self-calls.",
    "Alternatives are hand-written decorators, AspectJ weaving, and bytecode libraries.",
    `PaymentService real = new PaymentServiceImpl();
PaymentService proxy = (PaymentService) Proxy.newProxyInstance(
    PaymentService.class.getClassLoader(),
    new Class<?>[] { PaymentService.class },
    (p, method, args) -> {
        long start = System.nanoTime();
        try { return method.invoke(real, args); }
        finally { System.out.println(method.getName() + " took " + (System.nanoTime() - start)); }
    });`
  ],
  "ServiceLoader and SPI": [
    "ServiceLoader discovers implementations of an interface at runtime from META-INF/services files or module declarations, enabling plugin architectures without compile-time dependencies. JDBC drivers and logging backends use it.",
    "A service is an interface; providers list their implementation class in META-INF/services/fully.qualified.Interface (or provides in module-info). ServiceLoader.load(Interface.class) instantiates them lazily.",
    "Applications want extension points that third parties can add by dropping a jar on the classpath, without changing core code.",
    "Use it for plugin systems, driver-style APIs and swappable implementations of a library contract.",
    "Avoid it when dependency injection already provides wiring. Provider order is not guaranteed, and classloader issues arise in containers.",
    "Define an interface, create providers with a public no-arg constructor, register them in the services file, and iterate over ServiceLoader. Handle multiple providers and failures explicitly.",
    "Pros: decoupled, standard. Cons: limited lifecycle control, classloader subtleties and no dependency injection.",
    "Alternatives are Spring factories and auto-configuration, OSGi, CDI and explicit registries.",
    `// META-INF/services/com.app.Exporter  contains:  com.app.CsvExporter
ServiceLoader<Exporter> loader = ServiceLoader.load(Exporter.class);
for (Exporter e : loader) {
    System.out.println(e.format());
}`
  ],

  "Nested and Inner Classes": [
    "Java has static nested classes, inner (non-static) classes, local classes and anonymous classes. Inner classes hold a hidden reference to the outer instance, which can cause memory leaks; prefer static nested classes.",
    "A static nested class is just namespaced and independent of an outer instance. An inner class needs an outer instance and can access its members. Anonymous and local classes can capture effectively final variables.",
    "They group helper types with their owner and give access to private members for tight collaborations such as iterators and builders.",
    "Use static nested classes for builders and node types, and inner classes when the object truly belongs to an outer instance, such as an iterator.",
    "Do not use non-static inner classes by default, since the implicit outer reference can leak the outer object, for example in long-lived callbacks or serialization.",
    "Mark helper classes static unless they need the outer instance, use lambdas instead of anonymous classes for functional interfaces, and be careful with Android-style handler leaks.",
    "Pros: encapsulation and locality. Cons: hidden references and more complex class files.",
    "Alternatives are top-level package-private classes, lambdas and records."
  ],

  "Java Serialization and serialVersionUID": [
    "Java serialization turns objects into a byte stream by implementing Serializable, with serialVersionUID guarding version compatibility. It is fragile and a known security risk, so prefer JSON, Protobuf or Avro, and never deserialise untrusted data.",
    "Serializable is a marker interface. ObjectOutputStream writes the object graph, skipping transient fields, and ObjectInputStream rebuilds it without calling constructors. serialVersionUID identifies the class version.",
    "It was built to persist and transmit objects easily, including across JVMs.",
    "Know it for legacy systems, caches, session replication and RMI, and for explaining transient, custom writeObject methods and singletons with readResolve.",
    "Avoid it for new APIs and storage because of security vulnerabilities (deserialisation gadgets), tight coupling to class structure and poor cross-language support.",
    "Declare a stable private static final long serialVersionUID, mark sensitive or derived fields transient, validate in readObject, use serialization filters (ObjectInputFilter), and prefer a serialization proxy for invariants.",
    "Pros: built in and handles object graphs. Cons: security risk, brittle versioning, performance cost and Java-only.",
    "Alternatives are JSON with Jackson, Protocol Buffers, Avro, Kryo and custom DTOs.",
    `public class Session implements Serializable {
    private static final long serialVersionUID = 1L;
    private String user;
    private transient String password;   // not serialised
}

try (ObjectOutputStream out = new ObjectOutputStream(Files.newOutputStream(p))) {
    out.writeObject(session);
}`
  ],
  "IO vs NIO vs NIO.2": [
    "Classic IO is stream-based and blocking, NIO adds buffers, channels and selectors for non-blocking and scalable I/O, and NIO.2 (Java 7) adds Path, Files and file system APIs. Use Files and Path for everyday work and NIO channels for high-performance networking.",
    "IO uses InputStream, OutputStream, Reader and Writer. NIO uses ByteBuffer, Channel and Selector so one thread can manage many connections. NIO.2 provides Path, Files, WatchService and asynchronous channels.",
    "Blocking one thread per connection does not scale, and java.io.File had weak error reporting and missing features.",
    "Use Files.readString, Files.walk and Path for file work. Use channels and memory-mapped files for large data, and Netty or similar for network servers.",
    "Do not hand-write selector loops for network servers when a mature library exists, and with virtual threads the blocking style is scalable again for many cases.",
    "Use try-with-resources, Files.newBufferedReader with an explicit charset, Files.walk for traversal, and FileChannel.map for memory-mapped access. Use WatchService for file change events.",
    "Pros: scalability and richer APIs. Cons: complexity of buffers and selectors.",
    "Alternatives are Netty, virtual threads with blocking IO, Okio and Apache Commons IO.",
    `try (Stream<Path> files = Files.walk(Path.of("logs"))) {
    files.filter(p -> p.toString().endsWith(".log"))
         .forEach(System.out::println);
}
String text = Files.readString(Path.of("config.json"), StandardCharsets.UTF_8);
Files.writeString(Path.of("out.txt"), text);`
  ],
  "JSON Serialization with Jackson": [
    "Jackson is the standard Java JSON library, mapping objects to JSON and back through ObjectMapper with annotations to customise names and shape. Configure one shared ObjectMapper and be careful with polymorphism and unknown properties.",
    "ObjectMapper uses reflection or generated accessors to read and write beans, records and collections. Modules add support for java.time, Optional and Kotlin, and annotations control properties and views.",
    "Services constantly exchange JSON, and hand-writing parsers is slow and error-prone.",
    "Use it for REST payloads, configuration, messaging and persistence of JSON documents.",
    "Avoid enabling default typing on untrusted input, which can lead to remote code execution. Do not create an ObjectMapper per call; it is expensive and thread-safe once configured.",
    "Register JavaTimeModule, disable WRITE_DATES_AS_TIMESTAMPS, configure FAIL_ON_UNKNOWN_PROPERTIES according to your contract, use @JsonProperty, @JsonIgnore and @JsonCreator, and TypeReference for generics.",
    "Pros: mature, flexible, ubiquitous. Cons: reflection cost, configuration pitfalls and security issues with polymorphic types.",
    "Alternatives are Gson, JSON-B, Moshi, Jsonb and binary formats like Protobuf.",
    `ObjectMapper mapper = new ObjectMapper()
    .registerModule(new JavaTimeModule())
    .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

String json = mapper.writeValueAsString(order);
Order back = mapper.readValue(json, Order.class);
List<Order> list = mapper.readValue(json, new TypeReference<List<Order>>() {});`
  ],
  "Java Modules (JPMS)": [
    "JPMS (Java 9) groups packages into modules with explicit requires and exports, giving strong encapsulation and reliable configuration. Most applications still run on the classpath, but the module system shapes the JDK and libraries.",
    "A module-info.java declares the module name, which modules it requires, which packages it exports or opens, and which services it provides or uses. The JDK itself is modular, and jlink can build custom runtime images.",
    "The classpath had no encapsulation and no dependency checks, causing classpath hell and reliance on JDK internals.",
    "Use it for libraries needing strong encapsulation, custom runtime images with jlink, and for understanding illegal reflective access errors on modern JDKs.",
    "Avoid forcing it onto typical Spring applications where the benefits are small and library support is uneven. Many frameworks still rely on deep reflection.",
    "Create module-info.java with requires and exports, use --add-opens for frameworks that need reflection, and use jdeps to analyse dependencies and jlink to shrink the runtime.",
    "Pros: encapsulation, smaller runtimes, explicit dependencies. Cons: migration effort and framework friction.",
    "Alternatives are the classpath with naming conventions, OSGi, ArchUnit and multi-module build tools."
  ]
};
