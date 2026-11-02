// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
// Version status is accurate as of Java 25 LTS (September 2025). LTS releases: 17, 21, 25.
const SERVICE_ANSWERS = {
  "Text Blocks": [
    "Text blocks are multi-line string literals delimited by triple quotes, final since Java 15 (JEP 378). The compiler strips incidental indentation and normalises line endings, so embedded JSON, SQL and HTML read naturally without concatenation or escapes.",
    "A text block starts with three double quotes followed by a line terminator and ends with three double quotes. Indentation is removed relative to the least-indented content line or the closing delimiter, trailing spaces are stripped, and the escapes \\s (space) and a backslash at line end (suppress newline) were added for them.",
    "Embedding multi-line JSON, SQL, XML or HTML as concatenated strings needs quote escaping and newline noise, which hides the content and invites mistakes.",
    "Use them for any multi-line literal: SQL, JSON fixtures in tests, HTML snippets, GraphQL queries, and expected output in assertions. Combine with String.formatted for simple parameter substitution.",
    "Do not use them for single-line strings, and never build SQL by inserting user input into a text block, since that is still SQL injection. Be careful that moving the closing delimiter changes the stripped indentation and the trailing newline.",
    "Place the closing delimiter on its own line to keep a final newline and control indentation, call formatted or String.format for placeholders, and use stripIndent and translateEscapes only when processing strings at runtime. Use PreparedStatement parameters for SQL values.",
    "Pros: readable, fewer escapes, stable across editors once the indentation rule is understood. Cons: whitespace rules surprise people, the content is not validated by the compiler, and there is no built-in interpolation because string templates were withdrawn after preview.",
    "Alternatives are string concatenation, String.join, resource files loaded from the classpath for large content, and templating engines. The string templates preview (JEP 430, 459, 465) was removed in Java 23 and has no final replacement.",
    `String name = "Ada";
int age = 36;

String json = """
    {
      "name": "%s",
      "age": %d
    }
    """.formatted(name, age);

String sql = """
    SELECT id, email
    FROM users
    WHERE status = ?
    ORDER BY created_at DESC
    """;
// the leading 4 spaces are incidental and are stripped`
  ],
  "var Local Type Inference": [
    "var lets the compiler infer the type of a local variable from its initialiser (Java 10, JEP 286). It is still statically typed, applies only to locals, and should be used when the type is obvious from the right-hand side.",
    "var is a reserved type name, not a keyword, and is allowed for local variables with initialisers, for-loop variables, try-with-resources variables, and (since Java 11) implicitly typed lambda parameters. It cannot be used for fields, method parameters, return types, or without an initialiser.",
    "Long generic types on both sides of an assignment add noise, for example Map<String, List<Order>> repeated twice, without adding information.",
    "Use it when the initialiser makes the type clear (constructor calls, factory methods named clearly, loops over a known collection) and for non-denotable types such as anonymous classes or intersection types.",
    "Avoid it when the inferred type is not evident, for example var result = service.process(data), or when you intend a wider type than the initialiser gives. Remember var x = new ArrayList<>() infers ArrayList<Object>, and var with a literal like 1 infers int.",
    "Choose descriptive variable names since the type is no longer written, keep the scope short, and declare against an interface when it matters by writing List<String> explicitly. Add annotations on lambda parameters with (var x, var y) when needed.",
    "Pros: less boilerplate, easier refactoring of return types. Cons: can hurt readability in code reviews without an IDE, and it can silently change the type if the right-hand side method changes.",
    "Alternatives are explicit types, which remain the better choice for public contracts and ambiguous initialisers, and the diamond operator, which only removes the type arguments on the right side.",
    `var orders = new HashMap<String, List<Order>>();   // type is obvious
for (var entry : orders.entrySet()) {
    var customer = entry.getKey();                   // String
    var list = entry.getValue();                     // List<Order>
    System.out.println(customer + " -> " + list.size());
}

var list2 = new ArrayList<>();       // ArrayList<Object>, probably not what you want
List<String> names = new ArrayList<>();   // explicit when the interface type matters

BiFunction<Integer, Integer, Integer> add = (var a, var b) -> a + b;`
  ],
  "Switch Expressions": [
    "Switch expressions, final in Java 14 (JEP 361), make switch return a value using arrow labels, with no fall-through and compiler-checked exhaustiveness. Combined with sealed types and pattern matching for switch (final in 21) they replace most if-else chains and visitor code.",
    "A switch expression uses case X -> value labels, may list several constants per case, and uses yield inside a block to produce a value. For enums and sealed types the compiler requires exhaustiveness without a default, and a statement-form arrow switch also has no fall-through.",
    "The old switch statement needed break, allowed accidental fall-through, used shared mutable variables to carry results, and could not prove all cases were covered.",
    "Use it to map an enum, string or sealed hierarchy to a value, and with pattern matching (Java 21) to branch on type, record components and guards using when.",
    "Avoid it for long side-effect-heavy branches that belong in separate methods, and avoid a default branch on sealed or enum switches, because it hides the compile error you want when a new constant is added.",
    "Write case A, B -> expr; use blocks with yield for multi-statement branches; use case Circle c -> ... for type patterns, case null -> ... when null must be handled (otherwise it throws NullPointerException), and when guards after a pattern.",
    "Pros: concise, safe, exhaustive, and an expression so it can be assigned or returned. Cons: the old colon form still exists and can be mixed up, and pattern dominance rules and ordering of cases need care.",
    "Alternatives are if-else chains, polymorphism with virtual methods, the visitor pattern, and EnumMap lookup tables. Prefer a virtual method when behaviour belongs to the type, and switch when you operate on a closed data hierarchy from outside.",
    `sealed interface Shape permits Circle, Rect, Square {}
record Circle(double r) implements Shape {}
record Rect(double w, double h) implements Shape {}
record Square(double side) implements Shape {}

static double area(Shape s) {
    return switch (s) {                       // exhaustive, no default needed
        case Circle c -> Math.PI * c.r() * c.r();
        case Rect(double w, double h) -> w * h;
        case Square sq when sq.side() < 0 -> throw new IllegalArgumentException("negative");
        case Square sq -> sq.side() * sq.side();
    };
}

int days = switch (month) {
    case FEBRUARY -> 28;
    case APRIL, JUNE, SEPTEMBER, NOVEMBER -> 30;
    default -> 31;
};`
  ],
  "Pattern Matching for instanceof": [
    "Pattern matching for instanceof, final in Java 16 (JEP 394), tests a type and binds a typed variable in one expression, removing the separate cast. It is the base of record patterns and pattern matching for switch (both final in 21).",
    "The form obj instanceof String s tests the type and, when true, introduces s as a String. The binding is scoped by flow analysis, so it is in scope wherever the compiler can prove the match succeeded, including after an early return on the negated test.",
    "The instanceof-then-cast idiom repeats the type name, is easy to get wrong, and clutters equals methods and visitors.",
    "Use it in equals implementations, handling heterogeneous inputs, and as a lead-in to record deconstruction such as obj instanceof Point(int x, int y) (record patterns, Java 21).",
    "Do not use long chains of instanceof where a polymorphic method or a switch over a sealed hierarchy is clearer. A pattern whose type is always matched by the static type is a compile error until Java 21 relaxed rules, and null never matches an instanceof pattern.",
    "Write if (o instanceof String s && !s.isEmpty()) { ... }, or if (!(o instanceof String s)) return; and use s afterwards. The binding variable is not final by default unless you declare it so, and it cannot shadow an in-scope local.",
    "Pros: shorter, safer, no duplicate cast. Cons: scope rules of bindings are subtle, and over-use pushes type switching out of the types themselves.",
    "Alternatives are the classic cast after instanceof, polymorphism, the visitor pattern, and switch with patterns, which is better for more than two or three types. Primitive type patterns for instanceof and switch are still preview in Java 25 (third preview, JEP 507).",
    `@Override
public boolean equals(Object o) {
    return o instanceof Money m
            && amount == m.amount
            && currency.equals(m.currency);
}

static String describe(Object o) {
    if (!(o instanceof CharSequence cs)) {
        return "not text";
    }
    return "text of length " + cs.length();     // cs is in scope here
}

// record pattern, Java 21
if (obj instanceof Point(int x, int y) && x == y) {
    System.out.println("on the diagonal");
}`
  ],
  "Unnamed Variables and Patterns": [
    "Unnamed variables and patterns use the underscore to say a variable or pattern component is intentionally unused. They are final in Java 22 (JEP 456) after previews in 21, and are a small readability gain for catch blocks, lambdas and record patterns.",
    "A single underscore can replace the name of a local variable, a for-loop variable, a try-with-resources resource, a catch parameter, a lambda parameter, or a pattern variable, and a bare underscore as a pattern (case Point(int x, _)) matches any component without binding it.",
    "Unused names trigger lint warnings and mislead readers into looking for a use. Record patterns made it common to care about only some components.",
    "Use it for ignored exceptions, lambda parameters you must accept but not use (map.computeIfAbsent(key, _ -> new ArrayList<>())), loops that only count iterations, and record patterns that need only some fields.",
    "Do not use it to swallow exceptions without a good reason; an empty catch with an underscore is still a code smell. It requires source level 22 or later, and on Java 9 to 21 a lone underscore as an identifier is a compile error (a preview feature in 21).",
    "Replace the unused name with _. In switch patterns, several patterns can share a case only if none of them bind named variables, for example case Circle _, Square _ -> ... , and the underscore can appear multiple times in one scope.",
    "Pros: clearer intent, fewer warnings, and less naming noise. Cons: minor, and projects stuck on older Java versions cannot use it.",
    "Alternatives are conventional names such as ignored or unused, which work on all versions and are recognised by many linters.",
    `try {
    Integer.parseInt(input);
} catch (NumberFormatException _) {
    return false;
}

var cache = new HashMap<String, List<String>>();
cache.computeIfAbsent("k", _ -> new ArrayList<>()).add("v");

int count = 0;
for (var _ : items) {
    count++;
}

// only the x component matters
if (obj instanceof Point(int x, _)) {
    System.out.println(x);
}`
  ],
  "Flexible Constructor Bodies": [
    "Flexible constructor bodies, final in Java 25 (JEP 513), allow statements before an explicit super(...) or this(...) call as long as they do not use the instance under construction. It lets you validate and compute arguments in the constructor body instead of in static helper methods.",
    "A constructor now has a prologue (code before super or this) and an epilogue. The prologue may validate and transform arguments and may assign fields of the same class, but it cannot read this, call instance methods, or refer to the superclass instance.",
    "Previously the super call had to be the first statement, so argument checks required static helpers or tricks, and a superclass constructor calling an overridden method could see subclass fields still at default values.",
    "Use it for fail-fast argument validation before calling super, for deriving values to pass up, and for initialising subclass fields before the superclass constructor runs so overridden methods see them.",
    "It does not remove the need to avoid calling overridable methods from constructors, and prologue code cannot touch this. It was preview in Java 22 (as statements before super), 23 and 24, so it needs Java 25 or later without preview flags.",
    "Put checks and local computations before super(...), for example Objects.requireNonNull and range checks, and then pass the computed values. Assign subclass fields in the prologue if the superclass constructor may call an overridden method that reads them.",
    "Pros: validation fails before any superclass work, less boilerplate, safer initialisation order. Cons: another rule about what the prologue may do, and builds on older Java versions cannot compile it.",
    "Alternatives are static factory or helper methods that compute arguments, builders, and validating factory methods.",
    `class PositiveAmount extends Amount {
    PositiveAmount(long cents, String currency) {
        if (cents <= 0) {                           // runs before super(...)
            throw new IllegalArgumentException("amount must be positive: " + cents);
        }
        var normalized = currency.trim().toUpperCase();
        super(cents, normalized);                   // Java 25 and later
    }
}

class Base {
    Base() { init(); }                  // overridable call from the constructor
    void init() {}
}
class Derived extends Base {
    private final String name;
    Derived(String name) {
        this.name = name;               // allowed in the prologue in Java 25
        super();
    }
    @Override void init() { System.out.println(name); }   // sees the real value
}`
  ],
  "Optional in Depth": [
    "Optional is a return-type container that makes the possible absence of a result explicit and chainable. Use it for method return values only, not for fields, parameters or collections, and prefer orElseGet over orElse when the default is expensive.",
    "Optional<T> holds a value or is empty. It offers map, flatMap, filter, or, ifPresent, ifPresentOrElse, orElse, orElseGet, orElseThrow, and stream (Java 9), plus isEmpty (11) and a no-argument orElseThrow (10). Optional.of throws on null while ofNullable converts it to empty.",
    "Returning null forces every caller to remember a null check and causes NullPointerExceptions far from the cause. Optional puts absence in the type signature.",
    "Use it as the return type of finders and lookups, for example repository.findById, and in stream pipelines (findFirst, max, reduce) and chained transformations on possibly absent values.",
    "Do not use Optional for fields, method parameters, collection elements, or JavaBean properties, and never return null from a method returning Optional. Do not call get without checking, and do not wrap collections; return an empty collection instead. It is not Serializable.",
    "Chain map and flatMap instead of isPresent plus get; use orElseGet(() -> compute()) when the default has a cost because orElse evaluates its argument eagerly; use orElseThrow for required values; use ifPresentOrElse when both branches have side effects.",
    "Pros: expressive API, forces handling, composes with streams. Cons: an extra object allocation, boxing for primitives (use OptionalInt, OptionalLong, OptionalDouble), and misuse as a general null replacement clutters code.",
    "Alternatives are returning null with documentation or annotations, throwing an exception, null-object pattern, empty collections, and Result or Either types from libraries such as Vavr.",
    `Optional<User> user = repo.findById(id);

String city = user
        .map(User::address)            // Optional<Address>
        .map(Address::city)
        .filter(c -> !c.isBlank())
        .orElse("unknown");

User u = user.orElseThrow(() -> new NotFoundException(id));

// orElse evaluates its argument even when a value is present
User bad  = user.orElse(createDefaultUser());         // always runs createDefaultUser
User good = user.orElseGet(() -> createDefaultUser()); // only runs when empty

user.ifPresentOrElse(
        x -> log.info("found {}", x.id()),
        () -> log.warn("missing"));

List<String> emails = users.stream()
        .map(User::email)               // Optional<String>
        .flatMap(Optional::stream)      // drop empty ones
        .toList();`
  ],
  "Immutable Collection Factories": [
    "List.of, Set.of and Map.of (Java 9) and the copyOf methods (Java 10) create compact unmodifiable collections that reject null. Set and Map iteration order is deliberately unspecified and varies between JVM runs, so never depend on it.",
    "The factories return immutable instances with specialised small implementations. Duplicate elements in Set.of or duplicate keys in Map.of throw IllegalArgumentException, Map.of supports up to 10 pairs while Map.ofEntries and Map.entry handle more, and copyOf returns the argument itself when it is already an immutable collection of that kind.",
    "Before Java 9, building a small constant collection required Arrays.asList, a double-brace initialiser or a static block, and the results were mutable or only fixed-size.",
    "Use them for constants, test data, return values you do not want callers to modify, and defensive copies of constructor arguments through List.copyOf.",
    "Do not use them when you must store null, when you need a specific iteration order for sets or maps (use LinkedHashSet or a sorted collection), or when you need to mutate afterwards. Calling contains(null) on List.of or Set.of throws NullPointerException.",
    "Call List.of(a, b, c), Set.of(...), Map.of(k1, v1, ...), Map.ofEntries(Map.entry(k, v), ...), and List.copyOf(source) for a snapshot. Collectors.toUnmodifiableList and Stream.toList (Java 16) give unmodifiable results; Stream.toList allows nulls while the factories do not.",
    "Pros: genuinely immutable (not a view), memory efficient, thread-safe for safe publication. Cons: null-hostile, element immutability is shallow, and the randomised Set and Map iteration order can break tests that assume a fixed order.",
    "Alternatives are Collections.unmodifiableList (a read-only view whose backing collection can still change), Guava ImmutableList, persistent collections in functional libraries, and Arrays.asList (fixed-size but writable through set).",
    `List<String> roles = List.of("admin", "user", "guest");
Set<Integer> primes = Set.of(2, 3, 5, 7);
Map<String, Integer> limits = Map.of("small", 10, "large", 100);
Map<String, Integer> big = Map.ofEntries(Map.entry("a", 1), Map.entry("b", 2));

try {
    roles.add("root");
} catch (UnsupportedOperationException e) {
    System.out.println("immutable");
}

// Set.of(1, 1) throws IllegalArgumentException (duplicate element)
// List.of("a", null) throws NullPointerException

class Order {
    private final List<String> items;
    Order(List<String> items) {
        this.items = List.copyOf(items);   // defensive immutable snapshot
    }
}`
  ],
  "Helpful NullPointerExceptions": [
    "Since Java 14 (JEP 358, on by default from Java 15) the JVM describes exactly what was null in a NullPointerException message, such as which method call or field access failed and which expression was null. It makes production NPEs far quicker to diagnose.",
    "When the JVM itself throws an NPE, it computes a message from the bytecode, for example: Cannot invoke String.length() because the return value of Customer.getName() is null. Local variable names appear only if the class was compiled with -g, otherwise placeholders such as local1 are used.",
    "A plain NullPointerException with no message forced you to guess which of several chained calls or array accesses was null, usually by adding debug logging and redeploying.",
    "It applies automatically to implicit NPEs: method invocation, field access, array access and length, synchronized and unboxing on a null reference. No code change is needed beyond running on a modern JDK.",
    "It does not apply to NPEs you throw explicitly (use Objects.requireNonNull with a message) and the message is computed lazily on the first getMessage call. Be mindful that the message may reveal variable and field names in logs exposed to users.",
    "Run on Java 15 or later, compile with -g if you want real local variable names, and log the full exception with its message. For explicit checks write Objects.requireNonNull(arg, 'arg must not be null') style validation in public APIs.",
    "Pros: no cost on the normal path, immediate diagnostic value. Cons: still only a symptom, may leak internal names, and chained calls on separate lines are still easier to read in traces.",
    "Alternatives are Optional for absence in return types, nullness annotations checked by tools such as NullAway or the Checker Framework, and the planned null-restricted types in Project Valhalla, which are not available yet.",
    `public class NpeDemo {
    record Address(String city) {}
    record Customer(Address address) {}

    public static void main(String[] args) {
        Customer c = new Customer(null);
        // Message on Java 15+:
        // Cannot invoke "String.length()" because the return value of
        // "NpeDemo$Address.city()" is null ... or: because "address" is null
        int n = c.address().city().length();
    }
}

// explicit checks still need your own message
Objects.requireNonNull(config, "config must not be null");`
  ],
  "Stream Gatherers": [
    "Stream gatherers, final in Java 24 (JEP 485), let you add custom intermediate operations to a Stream through Stream.gather(Gatherer). The JDK ships built-ins in java.util.stream.Gatherers such as windowFixed, windowSliding, fold, scan and mapConcurrent.",
    "A Gatherer has an optional initializer, an integrator that receives each element and a downstream, an optional combiner for parallel streams, and an optional finisher. It can emit zero, one or many elements per input and keep state, which map, filter and flatMap cannot do cleanly.",
    "Collectors only handle terminal operations, so stateful intermediate steps like sliding windows, batching or running totals needed awkward custom Spliterators or breaking out of the pipeline.",
    "Use it for batching with windowFixed, moving averages with windowSliding, prefix sums with scan, and bounded concurrent mapping with mapConcurrent (virtual threads, preserves encounter order).",
    "Do not write a custom gatherer when map, filter, flatMap, mapMulti or a loop is simpler. It was preview in Java 22 and 23 (JEP 461, 473), so Java 21 cannot use it without migrating, and gatherers that keep state need care in parallel pipelines.",
    "Chain stream.gather(Gatherers.windowFixed(3)), or build your own with Gatherer.ofSequential(initializer, integrator, finisher) or Gatherer.of(...) when a combiner supports parallel use. Call downstream.push(element) to emit and return false to stop early.",
    "Pros: composable, lazy, supports short-circuiting and state. Cons: new API with a learning curve, and mapConcurrent is not a general parallel stream replacement because it is bounded by a concurrency limit you pass.",
    "Alternatives are Collectors with collectingAndThen, mapMulti, plain loops, custom Spliterators, and libraries such as StreamEx, jOOL or Vavr.",
    `List<List<Integer>> batches = Stream.of(1, 2, 3, 4, 5, 6, 7)
        .gather(Gatherers.windowFixed(3))
        .toList();                         // [[1,2,3],[4,5,6],[7]]

List<List<Integer>> sliding = Stream.of(1, 2, 3, 4)
        .gather(Gatherers.windowSliding(2))
        .toList();                         // [[1,2],[2,3],[3,4]]

List<Integer> running = Stream.of(1, 2, 3, 4)
        .gather(Gatherers.scan(() -> 0, Integer::sum))
        .toList();                         // [1, 3, 6, 10]

// fetch up to 20 URLs at a time using virtual threads, results stay in order
List<String> bodies = urls.stream()
        .gather(Gatherers.mapConcurrent(20, url -> fetch(url)))
        .toList();`
  ],
  "Flow API and Reactive Streams": [
    "java.util.concurrent.Flow (Java 9) contains four nested interfaces, Publisher, Subscriber, Subscription and Processor, that standardise the Reactive Streams contract with backpressure. It is an interoperability spec rather than a full reactive library.",
    "A Subscriber receives onSubscribe, onNext, onError and onComplete signals, and calls Subscription.request(n) to say how many items it can handle, which is the backpressure mechanism. SubmissionPublisher is the only implementation in the JDK, and it uses an executor and per-subscriber buffers.",
    "Fast producers can overwhelm slow consumers in asynchronous pipelines. Reactive Streams defined a standard asynchronous protocol with demand signalling, and Flow brought the same four interfaces into the JDK so libraries could interoperate.",
    "Know it to explain how Reactor, RxJava, Akka Streams and Spring WebFlux relate, to bridge them via FlowAdapters or the Flow-compatible adapters, and for simple in-JVM publish and subscribe with SubmissionPublisher.",
    "Do not hand-write Publisher implementations, since the spec has many rules that are easy to violate. Do not choose reactive streams just for scalability on blocking I/O now that virtual threads (Java 21) give a simpler thread-per-request model.",
    "Implement a Subscriber that stores the Subscription, requests one or a batch of items, and requests more after processing. Use SubmissionPublisher with a bounded buffer and a suitable executor, and use Reactor or RxJava for operators like map, flatMap, retry and windowing.",
    "Pros: standard, backpressure-aware, no extra dependency. Cons: minimal API with no operators, only one publisher implementation, and reactive code is harder to debug and trace than blocking code.",
    "Alternatives are Reactor and RxJava (full operator libraries), blocking queues for simple producer-consumer, virtual threads with structured code, Kafka consumers, and Java streams for synchronous in-memory pipelines.",
    `try (SubmissionPublisher<String> publisher = new SubmissionPublisher<>()) {
    publisher.subscribe(new Flow.Subscriber<String>() {
        private Flow.Subscription subscription;

        public void onSubscribe(Flow.Subscription s) {
            this.subscription = s;
            s.request(1);                      // ask for one item
        }
        public void onNext(String item) {
            System.out.println("got " + item);
            subscription.request(1);           // backpressure: ask for the next one
        }
        public void onError(Throwable t) { t.printStackTrace(); }
        public void onComplete() { System.out.println("done"); }
    });
    publisher.submit("a");
    publisher.submit("b");
}   // close() signals onComplete after items are delivered`
  ],
  "Foreign Function and Memory API": [
    "The Foreign Function and Memory API, final in Java 22 (JEP 454), calls native libraries and manages off-heap memory safely without JNI or C glue code. It replaces JNI and most uses of sun.misc.Unsafe and direct ByteBuffers for new code.",
    "Key types are Arena (controls memory lifetime), MemorySegment (bounds-checked region of memory), ValueLayout and MemoryLayout (describe structure), Linker with FunctionDescriptor and SymbolLookup (create method handles to native functions), and the jextract tool to generate bindings from C headers.",
    "JNI needs C code, is error prone, and is hard to maintain. Unsafe and direct buffers lack lifetime safety and 64-bit addressing, causing crashes or leaks that the JVM cannot prevent.",
    "Use it for binding to C libraries (SQLite, OpenSSL, BLAS), high-performance off-heap data structures, memory-mapped files larger than 2 GB, and replacing JNI in libraries.",
    "Do not use it for ordinary application code since off-heap memory and native calls bypass JVM safety guarantees. It is a restricted API, so Java 24 and later warn unless the app uses --enable-native-access (JEP 472), and misuse can still crash the JVM.",
    "Open an Arena (confined or shared, usually in try-with-resources), allocate segments from it, look up the function with Linker.nativeLinker().defaultLookup() or SymbolLookup.libraryLookup, create a downcall handle with a FunctionDescriptor, and invoke it. Use jextract for larger APIs.",
    "Pros: pure Java, deterministic lifetime, bounds checking, better performance than JNI in many cases, and portable across platforms. Cons: verbose without jextract, restricted-access flags, and native code still sits outside the safety net.",
    "Alternatives are JNI, JNA and JNR (libraries that wrap native access), direct ByteBuffers for off-heap memory, Unsafe (being phased out), and running native code as a separate process.",
    `// calls the C library function strlen from Java; the method must handle Throwable
Linker linker = Linker.nativeLinker();
MethodHandle strlen = linker.downcallHandle(
        linker.defaultLookup().find("strlen").orElseThrow(),
        FunctionDescriptor.of(ValueLayout.JAVA_LONG, ValueLayout.ADDRESS));

try (Arena arena = Arena.ofConfined()) {
    MemorySegment cString = arena.allocateFrom("Hello, FFM");
    long length = (long) strlen.invokeExact(cString);
    System.out.println(length);                // 10
}   // native memory freed here, accessing cString afterwards would throw`
  ],
  "Vector API": [
    "The Vector API expresses SIMD computations that the JIT compiles to CPU vector instructions. It is still an incubator module in Java 25 (tenth incubation, JEP 508), because it waits for Project Valhalla value classes, so it requires --add-modules jdk.incubator.vector and may change.",
    "It lives in jdk.incubator.vector and provides types like FloatVector, IntVector and DoubleVector with VectorSpecies, VectorMask and lane-wise operations. Loop code loads chunks of arrays, applies operations on whole vectors, and handles the tail with masks or a scalar loop.",
    "Auto-vectorisation by the JIT is unreliable and cannot be directly requested. The API gives developers an explicit, portable way to write SIMD code with graceful fallback when hardware lacks support.",
    "Consider it for numeric kernels, signal processing, machine learning inference, image processing and vector similarity search where profiling shows hot loops on large arrays.",
    "Do not use it in ordinary business code, and do not depend on it in libraries meant for production without accepting incubator status, since the API can change between releases. Always benchmark with JMH, because small arrays or memory-bound work see no gain.",
    "Pick a VectorSpecies such as FloatVector.SPECIES_PREFERRED, loop in steps of species.length(), use fromArray, lanewise operations like add and mul, and intoArray, and process the remainder with a scalar loop or masks. Add the module flag to javac and java.",
    "Pros: significant speed-ups for data-parallel loops with no native code. Cons: incubating, verbose, performance varies by CPU and JIT, and needs compiler and runtime flags.",
    "Alternatives are relying on JIT auto-vectorisation with simple loops, native libraries through FFM or JNI, GPU libraries such as TornadoVM or Aparapi, and libraries like ND4J or Panama-based BLAS bindings.",
    `// compile and run with: --add-modules jdk.incubator.vector
static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;

static void add(float[] a, float[] b, float[] result) {
    int i = 0;
    int upper = SPECIES.loopBound(a.length);
    for (; i < upper; i += SPECIES.length()) {
        FloatVector va = FloatVector.fromArray(SPECIES, a, i);
        FloatVector vb = FloatVector.fromArray(SPECIES, b, i);
        va.add(vb).intoArray(result, i);
    }
    for (; i < a.length; i++) {            // scalar tail
        result[i] = a[i] + b[i];
    }
}`
  ],
  "Class-File API": [
    "The Class-File API, final in Java 24 (JEP 484), is a standard API in java.lang.classfile for parsing, generating and transforming class files. It lets tools and frameworks stop bundling and chasing ASM versions for each new Java release.",
    "It models classes as immutable trees of elements (ClassModel, MethodModel, CodeModel, instructions) and offers builders and transforms to produce new class files. The JDK itself is migrating its internal ASM usage to it.",
    "The class-file format changes every six months, and libraries like ASM, ByteBuddy and CGLIB need an update for each release, which delayed adoption of new Java versions. A JDK-owned API keeps pace with the format automatically.",
    "Use it for building bytecode tools: agents, instrumentation, code generators, static analysers and framework proxies, and for reading class metadata without loading classes.",
    "Application developers rarely need it directly, and it is not a replacement for reflection or dynamic proxies. It was preview in Java 22 and 23 (JEP 457, 466), so earlier JDKs do not have the final API.",
    "Parse bytes or a Path with ClassFile.of().parse, iterate over the model, or use ClassFile.of().transformClass with a ClassTransform to rewrite methods, and build new classes with ClassFile.of().build.",
    "Pros: always matches the JDK's class-file version, no extra dependency, immutable and easy to reason about. Cons: only available from Java 24, a different programming model from ASM visitors, and the ecosystem will take time to migrate.",
    "Alternatives are ASM, ByteBuddy, Javassist, CGLIB, and for read-only inspection javap and reflection.",
    `import java.lang.classfile.*;
import java.nio.file.Path;

ClassModel model = ClassFile.of().parse(Path.of("build/classes/Foo.class"));
System.out.println("class " + model.thisClass().asInternalName());

for (MethodModel method : model.methods()) {
    System.out.println(method.methodName().stringValue()
            + method.methodType().stringValue());
}

// list only the public methods
model.methods().stream()
        .filter(m -> (m.flags().flagsMask() & ClassFile.ACC_PUBLIC) != 0)
        .forEach(m -> System.out.println(m.methodName().stringValue()));`
  ],
  "Java 21 LTS Highlights": [
    "Java 21 (September 2023) is an LTS release whose headline features are virtual threads, sequenced collections, record patterns and pattern matching for switch, all final, plus generational ZGC. Unnamed patterns, scoped values, structured concurrency and string templates were still preview.",
    "Final in 21: virtual threads (JEP 444), sequenced collections (JEP 431), record patterns (JEP 440), pattern matching for switch (JEP 441), generational ZGC (JEP 439, enabled with -XX:+ZGenerational), the Key Encapsulation Mechanism API, and dynamic agent loading warnings. Preview in 21: string templates, unnamed patterns and variables, unnamed classes, scoped values, structured concurrency; FFM was a third preview.",
    "It consolidated a series of preview features from 17 to 20 and gave many shops a target for Spring Boot 3.2 and beyond, with virtual threads for blocking I/O workloads.",
    "Adopt it as the baseline when you want virtual threads for request-per-thread servers, exhaustive switch over sealed hierarchies, and the new List, Deque, LinkedHashSet and LinkedHashMap methods getFirst, getLast, reversed and others.",
    "Do not use the preview features in production, and avoid heavy synchronized blocks around blocking calls with virtual threads on 21, since they pin the carrier thread (fixed in Java 24, JEP 491). Generational ZGC is not the default in 21; it became the default in Java 23.",
    "Use Executors.newVirtualThreadPerTaskExecutor for blocking tasks, replace instanceof chains with pattern matching switch, use SequencedCollection methods instead of get(size() - 1), and test with -XX:+ZGenerational for low latency heaps. Replace ThreadLocal heavy designs carefully with virtual threads.",
    "Pros: major concurrency and language modernisation with long-term support. Cons: virtual threads change profiling and pooling assumptions, the pinning limitation, and frameworks must support them. Java 25 is the next LTS.",
    "Alternatives are staying on 17 (fewer features, still supported), jumping to 25 LTS, or using Kotlin coroutines or reactive frameworks for scalable I/O.",
    `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));    // blocking is cheap on a virtual thread
            return fetch();
        });
    }
}

List<String> list = new ArrayList<>(List.of("a", "b", "c"));
String last = list.getLast();                 // SequencedCollection, new in 21
List<String> reversed = list.reversed();      // a reversed view

static String describe(Object o) {
    return switch (o) {
        case Integer i when i > 100 -> "big int " + i;
        case Integer i -> "int " + i;
        case String s -> "string " + s;
        case Point(int x, int y) -> "point " + x + "," + y;   // record pattern
        case null, default -> "other";
    };
}`
  ],
  "Java 25 LTS Highlights": [
    "Java 25 (September 2025) is the LTS after 21 and finalises scoped values, module import declarations, compact source files with instance main, and flexible constructor bodies. Structured concurrency, primitive patterns and stable values are still preview, and the Vector API is still incubating.",
    "Final in 25: scoped values (JEP 506), module import declarations (JEP 511), compact source files and instance main methods (JEP 512), flexible constructor bodies (JEP 513), compact object headers as a product option (JEP 519, -XX:+UseCompactObjectHeaders), generational Shenandoah (JEP 521), AOT command-line ergonomics and method profiling (JEP 514, 515), and the Key Derivation Function API (JEP 510). Preview or incubator: structured concurrency (fifth preview, JEP 505), primitive patterns (JEP 507), stable values (JEP 502), PEM encodings, Vector API (JEP 508).",
    "Since 21 the platform also finalised stream gatherers and the Class-File API (24), the FFM API and unnamed variables (22), virtual thread pinning fix for synchronized (24, JEP 491), and made generational ZGC the only ZGC mode (non-generational removed in 24).",
    "Move to 25 as the new baseline for long-support projects, to reduce heap use with compact object headers, to get better startup with AOT cache improvements, and to teach or script with simpler programs.",
    "Do not rely on preview features (structured concurrency, primitive patterns, stable values) in production, since they need --enable-preview and can change. Compact object headers are opt-in, and the 32-bit x86 port is gone. Check that libraries and agents support the class-file version 69.",
    "Upgrade the toolchain and CI, run with --release 25, try -XX:+UseCompactObjectHeaders on a staging load test, prefer ScopedValue over ThreadLocal for per-request context with virtual threads, and start with a simple void main in scripts. Verify frameworks (Spring Boot, Hibernate, Mockito) support Java 25.",
    "Pros: more language convenience, memory and startup wins, and long-term support for several years. Cons: migration effort for libraries and bytecode tools, and the preview features still require flags.",
    "Alternatives are staying on 21 LTS (the Spring Boot ecosystem is well-tested there) or on 17, and non-LTS releases such as 24 or 26 for earlier access to features, with a six-month support window.",
    `// compact source file with an instance main (final in 25). File: Hello.java
// module import declaration also final in 25
import module java.base;

void main() {
    List<String> names = List.of("Ada", "Linus");   // java.util via the module import
    IO.println("Hello " + String.join(", ", names));
}

// scoped values (final in 25): immutable per-scope context, good with virtual threads
static final ScopedValue<String> USER = ScopedValue.newInstance();

static void handleRequest(String user) {
    ScopedValue.where(USER, user).run(() -> service());
}
static void service() {
    System.out.println("user = " + USER.get());
}`
  ],
  "Upgrading from Java 8 to 17 to 21": [
    "Moving from Java 8 to 17 and 21 is mostly about strong encapsulation of JDK internals, removed APIs and modules, the javax to jakarta namespace change for Spring Boot 3, and updating libraries and build tools. Upgrade in steps (8 to 11 to 17 to 21) with tests as the safety net, and use jdeps and jdeprscan to find problems.",
    "Java 9 introduced modules and the module path; Java 16 and 17 enforce strong encapsulation (JEP 396, 403) so illegal reflective access to JDK internals fails unless you add --add-opens or --add-exports. Java EE and CORBA modules were removed in 11, Nashorn in 15, and JavaFX was split out; the Security Manager is deprecated for removal (17) and permanently disabled in 24.",
    "Java 8 receives only limited update support (mostly paid or vendor-specific), and newer Java gives better GC (G1 is default since 9, ZGC and Shenandoah production ready), container awareness, records, sealed classes, pattern matching, text blocks and virtual threads. Spring Boot 3 and Spring Framework 6 require Java 17 as a minimum.",
    "Plan it as a project when you need security patches, Spring Boot 3, newer library versions, or language features, and when frameworks or cloud runtimes drop Java 8 support.",
    "Do not jump straight to the newest version without first making the build run on 11 or 17, and do not ship long-term --add-opens flags as a fix without tracking the underlying libraries. Watch removed or changed items: JAXB, JAX-WS and javax.annotation (add Jakarta dependencies), sun.misc and internal APIs, default charset UTF-8 in 18, and Thread.stop throwing UnsupportedOperationException.",
    "Upgrade the build tools (Maven or Gradle, compiler and surefire plugins) and key libraries (Lombok, ByteBuddy, Mockito, Hibernate, Jackson, ASM-based agents); fix with jdeps --jdk-internals; use --add-opens as a temporary bridge; for Spring Boot 3 migrate javax.* to jakarta.* using OpenRewrite recipes; re-tune GC (default changed from Parallel to G1) and review container memory flags; compare performance and run the full test suite on each step.",
    "Pros: security updates, performance, memory and startup improvements, modern features, and library support. Cons: effort for reflection-heavy code, old agents and monitoring tools, javax to jakarta changes, and GC and startup behaviour changes that need load testing.",
    "Alternatives are staying on a commercially supported Java 8 (Oracle, Azul, Red Hat extended support) while planning migration, using multi-release JARs to support multiple versions in libraries, or targeting 21 or 25 directly after the build is clean on 17.",
    `// 1. find usage of removed or internal APIs
//    jdeps --jdk-internals --multi-release 17 -cp "libs/*" app.jar
//    jdeprscan --release 17 app.jar
// 2. temporary bridge for reflective access, tracked in a ticket
//    --add-opens java.base/java.lang=ALL-UNNAMED
// 3. Spring Boot 3: javax.* becomes jakarta.*
//    import javax.persistence.Entity;      // before
//    import jakarta.persistence.Entity;    // after

// Java 8 style
Map<String, List<Order>> byCustomer = orders.stream()
        .collect(Collectors.groupingBy(Order::customerId));
List<String> ids = orders.stream().map(Order::id).collect(Collectors.toList());

// Java 17 and 21 style
var byCustomer2 = orders.stream().collect(Collectors.groupingBy(Order::customerId));
var ids2 = orders.stream().map(Order::id).toList();
record Order(String id, String customerId) {}`
  ]
};
