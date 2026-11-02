// Each feature: { name, answer: [interview summary, what, why, when, when not, how, trade-offs, alternatives] }
const VERSIONS = [
  {
    name: "Java 5", year: 2004, features: [
      { name: "Generics", answer: [
        "Generics add compile-time type safety to collections and APIs through type parameters, implemented with type erasure so the bytecode stays compatible. They remove casts and ClassCastExceptions, at the price of quirks like no new T() and no primitive type arguments.",
        "Generics let a class, interface or method be parameterised by type, for example List<String> or <T extends Comparable<T>> T max(T a, T b). The compiler checks the types and inserts casts; at runtime the type arguments are erased to their bounds.",
        "Before Java 5, collections held Object, so every read needed a cast and mistakes only showed up as ClassCastException in production. Generics move that whole class of bugs to compile time and make APIs self-documenting.",
        "Use them for any reusable container, utility or API where the element type varies: repositories, result wrappers, event handlers, comparators. Use bounded wildcards (PECS: producer extends, consumer super) on method parameters.",
        "Do not add type parameters just to look flexible; a class with one concrete use does not need <T>. Avoid raw types and unchecked casts, and do not expect to inspect T at runtime, because erasure removed it.",
        "Declare type parameters on the class or method, bound them with extends when you need methods of the bound, and use wildcards for flexible parameters: void copy(List<? extends Number> src, List<? super Number> dst). To get the type at runtime, pass a Class<T> token or use a super type token.",
        "Pros: compile-time safety, fewer casts, better tooling and documentation. Cons: erasure means no generic arrays, no instanceof List<String>, and heap pollution is still possible with unchecked code; wildcard signatures can become hard to read.",
        "Alternatives are raw Object plus casts (unsafe), code generation per type as in C++ templates (not in Java), or reified generics as in C# (not possible on the JVM without breaking compatibility). Erasure won because existing libraries kept working."
      ] },
      { name: "Annotations", answer: [
        "Annotations are typed metadata attached to code that tools, the compiler or frameworks read at compile time or runtime. They are the backbone of Spring, JPA, JUnit and Lombok, trading explicit code for declarative configuration.",
        "An annotation is declared with @interface and applied to classes, methods, fields, parameters and more. Meta-annotations such as @Retention and @Target control whether it is kept in source, class files or at runtime, and where it may appear.",
        "Before annotations, metadata lived in XML files or naming conventions, away from the code it described and easy to desync. Annotations keep the metadata next to the element it configures and let the compiler validate it.",
        "Use them when behaviour should be declared rather than coded: transaction boundaries, validation constraints, REST mappings, test markers, and compile-time checks like @Override and @FunctionalInterface.",
        "Avoid stacking so many annotations that the actual behaviour becomes invisible magic. Do not use them for logic that needs runtime conditions or complex configuration; plain code or external config is clearer there.",
        "Define one with @Retention(RUNTIME) @Target(METHOD) public @interface Audited { String value() default \"\"; }, then read it through reflection with method.getAnnotation(Audited.class), or process it at compile time with an annotation processor (JSR 269, Java 6).",
        "Pros: concise, co-located, tool friendly. Cons: reflection cost and startup time, hidden behaviour that is hard to debug, and tight coupling to a framework. Frameworks like Spring now scan at build time (AOT) to reduce the runtime cost.",
        "Alternatives are XML or YAML configuration (explicit but remote from the code), fluent Java configuration (type-safe and debuggable), and naming conventions (no tooling needed but fragile)."
      ] },
      { name: "Enums", answer: [
        "Enums are type-safe, fixed sets of constants that are full classes: they can have fields, constructors, methods and abstract per-constant behaviour. They replace int and String constants and are the safest way to model a closed set of values.",
        "An enum declares a finite list of instances, each a singleton created at class load. It extends java.lang.Enum, so it has name(), ordinal(), values(), valueOf(), and works in switch, EnumSet and EnumMap.",
        "The old pattern of public static final int constants had no type safety, no namespace, and printed as meaningless numbers. Enums give compile-time checking, readable output and behaviour attached to each constant.",
        "Use them for a known closed set: order status, HTTP method, day of week, strategy selection, state machine states. EnumMap and EnumSet are fast and compact for keys and flags.",
        "Do not use enums for values that change at runtime or are defined in a database table and edited by users. Avoid persisting ordinal() because reordering constants silently corrupts data; persist the name instead.",
        "Write enum Status { NEW(\"N\"), SHIPPED(\"S\"); private final String code; Status(String c) { code = c; } } and compare with ==. For behaviour, declare an abstract method and implement it per constant, or implement an interface. Singleton via a single-constant enum is serialisation-safe.",
        "Pros: type-safe, switch exhaustiveness checks, thread-safe singletons, compact EnumSet. Cons: cannot extend another class, set is fixed at compile time, and adding a constant may break exhaustive switches elsewhere.",
        "Alternatives are int or String constants (no safety), the typesafe enum pattern with a private constructor (what enums replaced), and sealed interfaces with records from Java 17 when constants need different data shapes."
      ] },
      { name: "Autoboxing", answer: [
        "Autoboxing automatically converts between primitives and wrapper types, so list.add(5) just works. It is convenient but hides allocations, == pitfalls and NullPointerExceptions on unboxing.",
        "The compiler inserts Integer.valueOf(int) when a primitive is used as a wrapper (boxing) and intValue() when a wrapper is used as a primitive (unboxing). It applies to all eight primitive types in assignments, method arguments and arithmetic.",
        "Generics only work with reference types, so List<int> is illegal. Without autoboxing, every use of a collection of numbers would need manual wrapping and unwrapping.",
        "It is fine in normal business code and collections of modest size, and it is unavoidable with Map<String, Integer> or streams of wrapper types.",
        "Avoid it in hot loops and large numeric structures: a boxed Long sum variable allocates on every iteration. Never compare wrappers with ==, and watch for NPE when a nullable Integer is unboxed.",
        "Prefer primitive streams and specialised types: IntStream, mapToInt, long[] instead of List<Long>. Remember that Integer.valueOf caches -128 to 127, so == works there by accident and fails above it; use equals or compare the primitives.",
        "Pros: much less boilerplate and cleaner generic code. Cons: hidden object creation and GC pressure, subtle == bugs, NPE on unboxing, and slower arithmetic than primitives.",
        "Alternatives are primitive arrays and specialised collections (Eclipse Collections, fastutil, Trove) for large numeric data, and Project Valhalla's value classes, which are intended to remove the cost of boxing in future Java releases."
      ] }
    ]
  },
  {
    name: "Java 6", year: 2006, features: [
      { name: "Compiler API", answer: [
        "The javax.tools Compiler API lets a program invoke javac in-process, compile source from memory, and load the result. It underlies annotation processing, code generators, REPL-style tools and dynamic plugin systems.",
        "ToolProvider.getSystemJavaCompiler() returns a JavaCompiler. You give it JavaFileObjects (source in memory or on disk), a file manager that controls where output goes, and a DiagnosticCollector to read errors and warnings.",
        "Previously you had to spawn a javac process or use internal com.sun.tools classes. A standard API made embedding compilation portable and gave structured diagnostics instead of parsed console text.",
        "Use it for tools that generate and compile code at runtime: rule engines, template compilers, online judges, test frameworks that compile snippets, and build tooling.",
        "Do not use it where a scripting language, expression language or precompiled rules would do. It needs a JDK rather than just a JRE, and compiling arbitrary user code is a serious security risk without a sandbox.",
        "Wrap the source in a SimpleJavaFileObject subclass, call compiler.getTask(null, fileManager, diagnostics, null, null, units).call(), then load the classes with a custom ClassLoader fed from an in-memory file manager.",
        "Pros: standard, in-process, structured diagnostics. Cons: requires JDK at runtime, compile and class-loading cost, metaspace growth if classloaders leak, and security exposure.",
        "Alternatives are the Scripting API or Groovy for dynamic behaviour, expression languages such as SpEL or MVEL, bytecode libraries like ByteBuddy or ASM for generation without source, and the Java 9+ Lookup.defineClass for loading."
      ] },
      { name: "Scripting API", answer: [
        "JSR 223 gives Java a common interface to run scripting languages through ScriptEngine. It is a good pluggable design, but the built-in JavaScript engine (Nashorn) was removed, so today you add an engine such as Groovy or GraalJS yourself.",
        "ScriptEngineManager discovers engines through the ServiceLoader. You call engine.eval(String), put Java objects in Bindings, and can invoke script functions through the Invocable interface or compile them with Compilable.",
        "Applications wanted users to customise behaviour with scripts without being tied to one language's API. JSR 223 standardised the plumbing: evaluation, variable binding and function invocation.",
        "Use it for user-defined rules, formulas, or lightweight extension points where non-developers need to change logic without a deploy.",
        "Avoid it for untrusted scripts without a sandbox, for performance-critical paths, or when a plain Java strategy or a rules engine would be safer and easier to test.",
        "Obtain an engine with new ScriptEngineManager().getEngineByName(\"groovy\"), set variables via engine.put(\"order\", order), then call eval. On modern JDKs add the engine dependency first, since none is bundled.",
        "Pros: language-neutral API, easy extensibility. Cons: weaker type safety, hard to debug, security risk, per-engine behaviour differences, and no bundled engine since Nashorn's removal in Java 15.",
        "Alternatives are embedding Groovy or GraalVM Polyglot directly, expression languages like SpEL, rules engines such as Drools, or simply configuration and plugins loaded with ServiceLoader."
      ] },
      { name: "JDBC 4.0 driver auto-loading", answer: [
        "With JDBC 4.0, drivers on the classpath register themselves through the ServiceLoader mechanism, so Class.forName(\"...Driver\") is no longer needed. DriverManager.getConnection just works.",
        "Driver jars contain META-INF/services/java.sql.Driver naming their driver class. DriverManager scans these at first use and registers every driver found.",
        "Manually loading driver classes was boilerplate that tied code to a specific vendor class name and failed at runtime if the name was misspelled.",
        "It is relevant for plain JDBC applications, small tools and tests; the driver jar on the classpath is all you need.",
        "In container environments and connection pools you still configure the driver or URL explicitly, and in modular or classloader-isolated deployments (app servers, plugins) auto-discovery can pick the wrong driver or leak one.",
        "Add the driver dependency, then call DriverManager.getConnection(url, user, password). Prefer a pooled DataSource such as HikariCP for real applications and let it select the driver from the JDBC URL.",
        "Pros: less boilerplate, vendor-neutral code. Cons: implicit magic, startup scan cost, and classloader leaks in redeployed web apps if the driver is registered by a parent loader.",
        "Alternatives are explicit Class.forName (pre-4.0 style), a DataSource configured by the container or Spring Boot, and higher-level libraries like JdbcTemplate, jOOQ or JPA on top."
      ] },
      { name: "@Override on interface methods", answer: [
        "From Java 6, @Override can be used on methods that implement an interface method, not just on superclass overrides. It makes the compiler flag typos and signature drift that would otherwise silently create an unrelated method.",
        "@Override is a marker annotation checked at compile time: if the annotated method does not override or implement something in a supertype, compilation fails.",
        "In Java 5 the annotation was only legal for class overrides, so interface implementations had no protection. A renamed or re-typed interface method left implementers compiling but broken.",
        "Use it on every method that overrides or implements anything, including equals, hashCode, toString and all interface methods; many teams enforce it through checkstyle or IDE inspections.",
        "There are no real anti-cases. The one trap is that it cannot detect overloading mistakes you intended, such as equals(MyType) instead of equals(Object); it will correctly reject those, which is the point.",
        "Write @Override public int compare(Item a, Item b) { ... } when implementing Comparator<Item>. If the interface later changes, the compiler points out every stale implementation.",
        "Pros: zero cost, catches bugs early, documents intent. Cons: slight verbosity and nothing else worth noting.",
        "Alternatives are relying on code review and tests, or IDE warnings; none give the guarantee of a compiler error."
      ] }
    ]
  },
  {
    name: "Java 7", year: 2011, features: [
      { name: "Try-with-resources", answer: [
        "Try-with-resources closes any AutoCloseable automatically when the block ends, normally or by exception, and records secondary failures as suppressed exceptions. It replaced error-prone finally blocks and is the standard way to manage connections, streams and locks-like resources.",
        "Resources are declared in the try header, try (var in = Files.newInputStream(p)) { ... }. They are closed in reverse order of declaration, and if both the body and close() throw, the body's exception wins and the close exception is added through addSuppressed.",
        "Hand-written try/finally was frequently wrong: a failing close() could hide the original exception, nested resources needed nested finally blocks, and leaks of connections and file handles were a common production incident.",
        "Use it for anything that holds an external resource: JDBC Connection, Statement and ResultSet, files, sockets, HTTP responses, and custom classes that implement AutoCloseable.",
        "Do not use it for resources whose lifetime outlives the method, such as a pooled connection you return to a caller or a shared long-lived client. There you manage ownership explicitly.",
        "Implement AutoCloseable with an idempotent close(), declare multiple resources separated by semicolons, and since Java 9 you can reference an effectively final variable directly: try (conn). Inspect e.getSuppressed() when diagnosing.",
        "Pros: guaranteed cleanup, shorter code, no lost exceptions. Cons: close() may still throw a checked exception that you must handle, and it does not help with asynchronous resources.",
        "Alternatives are try/finally with manual null checks (verbose and error-prone), Lombok's @Cleanup, Spring's JdbcTemplate which handles resources for you, and Execute-Around style helper methods taking lambdas."
      ] },
      { name: "Diamond operator", answer: [
        "The diamond <> lets the compiler infer generic type arguments in a constructor call, so you write new HashMap<>() instead of repeating the types. It is purely a readability feature with no runtime effect.",
        "In a declaration such as Map<String, List<Order>> m = new HashMap<>();, the compiler infers the arguments from the target type. Java 9 extended this to anonymous inner classes.",
        "Generic types had to be repeated on both sides of the assignment, which made declarations long and noisy without adding any information.",
        "Use it everywhere you construct a generic object where the target type is clear: fields, locals, return statements and method arguments.",
        "Be careful where inference chooses something surprising, such as passing new ArrayList<>() into an overloaded method, or when you actually want a more specific type than the declaration.",
        "Just write new ArrayList<>(). With var in Java 10 you must keep the type arguments on the right side, because there is no target type to infer from: var list = new ArrayList<String>();.",
        "Pros: less noise, same type safety. Cons: inference can occasionally produce Object or fail to compile in complex generic chains.",
        "Alternatives are spelling types out (verbose), static factory methods such as List.of or Map.of, and var combined with explicit type arguments."
      ] },
      { name: "Multi-catch", answer: [
        "Multi-catch handles several unrelated exception types in one catch block, catch (IOException | SQLException e), removing duplicated handler code. The exception variable is effectively final.",
        "The alternatives are separated with a pipe and must not be subclasses of each other, since that would be redundant. The static type of e is the nearest common supertype, so you can call only shared methods on it.",
        "Without it, identical handling for different exceptions was copied across several catch blocks, or developers caught Exception broadly and swallowed too much.",
        "Use it when different failures need the same response: log and wrap, retry, translate to a domain exception, or map to the same HTTP status.",
        "Do not combine exceptions that deserve different handling, and do not use it as a reason to catch broad types. If you need to know which type occurred, use separate catch blocks.",
        "Write catch (IOException | TimeoutException e) { throw new ServiceException(\"call failed\", e); }. Always keep the cause when wrapping so the stack trace is preserved.",
        "Pros: less duplication, narrower than catching Exception. Cons: e is final, the common-supertype restriction limits what you can do, and a long list of alternatives hints at a design problem.",
        "Alternatives are separate catch blocks, a shared private handler method, catching a common parent type, or unchecked exceptions with a global handler such as Spring's @ControllerAdvice."
      ] },
      { name: "Strings in switch", answer: [
        "Java 7 allows switch on String values, compiled to hashCode and equals checks. It makes command and state dispatch readable compared with long if/else chains.",
        "The compiler generates a switch on the string's hashCode, then verifies with equals to handle collisions, and falls into the matching case. Comparison is case-sensitive.",
        "Switches were limited to ints and enums, so string-based dispatch from configuration, commands or protocol messages needed chained equals calls that were noisy and easy to get wrong.",
        "Use it for parsing a small set of known keywords: command-line options, message types, file extensions, and simple state names.",
        "A null selector throws NullPointerException, so check first. For large or growing sets, or when the values are really a closed set, prefer an enum or a map of handlers.",
        "Write switch (command) { case \"start\": ... break; case \"stop\": ... break; default: ... }, or use the Java 14 arrow form with a switch expression that returns a value.",
        "Pros: readable, efficient (hash-based), no boilerplate. Cons: NPE on null, case-sensitive, strings are prone to typos, and no exhaustiveness check.",
        "Alternatives are an enum with valueOf, a Map<String, Handler> for dispatch (open for extension), and sealed types with pattern matching when each case carries data."
      ] }
    ]
  },
  {
    name: "Java 8", year: 2014, features: [
      { name: "Lambda expressions", answer: [
        "A lambda is a concise anonymous function that implements a functional interface, written (a, b) -> a + b. It lets you pass behaviour as data, and it is the foundation for streams, CompletableFuture and modern callback APIs.",
        "Lambdas are compiled using invokedynamic, not anonymous inner classes, and can capture effectively final local variables. Their target type is a functional interface such as Comparator, Runnable or Function.",
        "Passing behaviour used to require anonymous inner classes with five lines of boilerplate per callback, which hid the intent and discouraged functional-style APIs.",
        "Use them for short, stateless behaviour: comparators, predicates, event handlers, callbacks, and stream pipelines. Method references are even clearer when a lambda only calls an existing method.",
        "Avoid long multi-line lambdas; extract a named method instead. Avoid lambdas that mutate shared state, and remember that checked exceptions do not fit the standard functional interfaces.",
        "Write list.sort((a, b) -> a.getName().compareTo(b.getName())) or, better, list.sort(Comparator.comparing(Person::getName)). Captured variables must be effectively final, and this inside a lambda refers to the enclosing instance.",
        "Pros: concise, enables functional style, efficient via invokedynamic. Cons: harder stack traces, temptation to write dense code, no checked-exception support, and capturing mutable state invites bugs.",
        "Alternatives are anonymous inner classes (verbose, own this), named classes or strategy objects (more testable for complex logic), and method references."
      ] },
      { name: "Stream API", answer: [
        "A Stream is a lazy pipeline of filter, map and collect operations over a data source that describes what to compute, not how to loop. It is consumed once, and parallel streams are available but should be used carefully.",
        "A pipeline has a source, zero or more intermediate operations that are lazy, and one terminal operation that triggers execution. Streams do not store data and do not modify the source.",
        "Data processing with loops mixes iteration, filtering and accumulation, making code long and mutable. Streams express transformations declaratively and fuse operations in one pass.",
        "Use them for collection transformations, grouping and aggregation: orders.stream().filter(...).collect(groupingBy(Order::getCustomer, summingInt(...))). Primitive streams (IntStream) avoid boxing.",
        "Avoid them for simple loops with side effects, when you need index access, or in deeply performance-sensitive code. Do not use parallel() on small data, blocking I/O, or the shared common pool without measurement.",
        "Chain operations, finish with collect, reduce, toList (Java 16) or forEach. Keep lambdas pure. Use flatMap for nested collections and Collectors for grouping, partitioning and joining.",
        "Pros: readable, composable, easy parallelisation. Cons: harder debugging, overhead for tiny data, single use, and a learning curve around laziness and collectors.",
        "Alternatives are for-loops (faster in hot paths and easier to debug), Guava or Apache Commons helpers, reactive libraries (Reactor, RxJava) for asynchronous streams, and Kotlin-style sequences in other languages."
      ] },
      { name: "Functional interfaces and method references", answer: [
        "A functional interface has exactly one abstract method, so a lambda or method reference can implement it. The java.util.function package provides Predicate, Function, Supplier and Consumer, and method references like String::length are shorthand for lambdas.",
        "@FunctionalInterface makes the compiler enforce the single abstract method rule; default and static methods do not count. There are four method reference forms: static, bound instance, unbound instance and constructor.",
        "Java needed a typed way to pass behaviour without adding function types to the language. Reusing interfaces kept compatibility with existing APIs like Runnable and Comparator.",
        "Use the standard interfaces whenever possible, and define your own only when a domain name adds clarity or you need a checked exception. Use method references whenever a lambda just forwards to an existing method.",
        "Do not invent a custom interface when Function or Supplier already fits, and do not use a method reference when it reduces clarity, for example with overloaded methods.",
        "Write Function<String, Integer> len = String::length; Supplier<List<String>> s = ArrayList::new; and compose with andThen, compose, negate or Comparator.thenComparing.",
        "Pros: reuse, composition, minimal syntax. Cons: type inference sometimes needs help, overloaded method references can be ambiguous, and no support for checked exceptions.",
        "Alternatives are anonymous inner classes, the strategy pattern with named classes, and libraries like Vavr that add richer function types."
      ] },
      { name: "Optional", answer: [
        "Optional is a container for a value that may be absent, designed for return types so callers cannot ignore the empty case. Use map, orElse and orElseThrow instead of get, and do not use it for fields or parameters.",
        "Optional<T> is either empty or holds a non-null value. It offers map, flatMap, filter, ifPresent, orElse, orElseGet and orElseThrow, and since Java 9, ifPresentOrElse, or and stream.",
        "Returning null pushed the burden of remembering null checks onto every caller and was the source of countless NullPointerExceptions; the type system could not express absence.",
        "Use it as a method return type when a result may legitimately not exist, such as findById, first match in a stream, or lookups in a map-like store.",
        "Avoid it for entity fields, constructor or method parameters, collections (return an empty collection instead), and serialisation models. Do not call get() without checking, and never return null from a method that returns Optional.",
        "Write repo.findById(id).map(User::getEmail).orElseThrow(() -> new NotFoundException(id)). Use orElseGet for expensive defaults because orElse evaluates its argument eagerly.",
        "Pros: explicit absence, fluent chaining, fewer NPEs. Cons: extra allocation, not serialisable, tempting to overuse, and primitives need OptionalInt and friends.",
        "Alternatives are returning null with annotations (@Nullable), the null object pattern, throwing exceptions, and Kotlin-style nullable types in other languages."
      ] },
      { name: "Default and static interface methods", answer: [
        "Default methods let interfaces add concrete behaviour without breaking existing implementers, which is how Java added stream() to Collection. Static interface methods allow helper methods to live next to the interface.",
        "A default method has a body and is inherited by implementers, who may override it. If two interfaces supply conflicting defaults, the class must resolve it explicitly with Iface.super.method().",
        "Adding a method to a published interface would break every implementation. Defaults enabled interface evolution, which the Collections and Streams additions in Java 8 needed.",
        "Use them to evolve public interfaces compatibly, to supply convenience methods built on abstract ones (Comparator.reversed()), and to provide utility factories (List.of, Comparator.comparing).",
        "Do not use defaults to hold state or large logic; that belongs in an abstract class or collaborator. Avoid them for core behaviour that implementers should consciously provide.",
        "Declare default void log(String m) { System.out.println(m); } and call Iface.super.log(m) to resolve diamond conflicts. Static methods are called on the interface itself and are not inherited.",
        "Pros: backward-compatible evolution, mixin-like reuse, cleaner utility placement. Cons: blurs the line between interfaces and abstract classes, creates the diamond problem, and can hide behaviour.",
        "Alternatives are abstract base classes (single inheritance only), companion utility classes such as Collections, and the template method pattern."
      ] },
      { name: "New date and time API", answer: [
        "java.time replaces Date and Calendar with immutable, thread-safe types such as LocalDate, Instant, ZonedDateTime and Duration, and separates human time from machine time. Always prefer it, and avoid mixing in legacy types.",
        "Key types: Instant (a point on the timeline), LocalDate/LocalTime/LocalDateTime (no zone), ZonedDateTime and OffsetDateTime (with zone or offset), Duration (time-based amount) and Period (date-based amount), plus DateTimeFormatter.",
        "The old API was mutable, not thread-safe, zero-indexed for months, mixed date and time concepts, and made time zones painful. SimpleDateFormat was a famous thread-safety bug source.",
        "Use Instant for timestamps and storage in UTC, ZonedDateTime for user-facing times, LocalDate for birthdays and business dates, and Duration for timeouts. Inject a Clock to make time testable.",
        "Do not use LocalDateTime for something that needs an exact instant, since it has no zone. Avoid converting back and forth with java.util.Date except at legacy boundaries.",
        "Write Instant.now(), LocalDate.of(2025, 1, 31).plusMonths(1), ZonedDateTime.now(ZoneId.of(\"Asia/Kolkata\")), and format with DateTimeFormatter.ISO_OFFSET_DATE_TIME. Map to databases through JDBC 4.2 or JPA 2.2 support.",
        "Pros: immutable, thread-safe, clear semantics, rich arithmetic. Cons: more types to learn, conversions to legacy APIs, and daylight-saving edge cases remain inherent to the problem.",
        "Alternatives are Joda-Time (its design became java.time), java.util.Date and Calendar (legacy), and epoch milliseconds as raw longs, which are compact but lose meaning."
      ] }
    ]
  },
  {
    name: "Java 11", year: 2018, features: [
      { name: "HTTP Client", answer: [
        "java.net.http.HttpClient is the standard modern HTTP client with HTTP/2, WebSocket support, and synchronous and asynchronous APIs returning CompletableFuture. It replaces HttpURLConnection and removes the need for a third-party library for simple calls.",
        "You build an immutable HttpClient (version, timeout, redirect policy, proxy, executor), create HttpRequest objects with a builder, and send them with send() or sendAsync() using a BodyHandler such as ofString().",
        "HttpURLConnection was clumsy, blocking and lacked HTTP/2, so most teams brought in Apache HttpClient or OkHttp even for trivial calls.",
        "Use it for service-to-service calls in plain Java, command-line tools, and tests, where you want no extra dependency, and for async calls composed with CompletableFuture.",
        "For production microservices you often still want richer features: declarative clients (Feign, Spring's RestClient), retries, circuit breakers, connection-pool tuning, interceptors and metrics.",
        "Write HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build(); then client.send(HttpRequest.newBuilder(URI.create(url)).GET().build(), BodyHandlers.ofString()). Reuse a single client instance.",
        "Pros: standard, HTTP/2, async support, no dependency. Cons: fewer features than mature libraries, limited built-in retry and observability, and mocking requires a wrapper.",
        "Alternatives are Apache HttpClient, OkHttp, Spring RestTemplate, RestClient or WebClient, Feign or Retrofit, and JAX-RS clients."
      ] },
      { name: "New String methods", answer: [
        "Java 11 added isBlank, strip, stripLeading, stripTrailing, lines and repeat, covering common string chores that used to need trim, regex or StringUtils. strip is Unicode-aware, unlike trim.",
        "isBlank returns true for empty or whitespace-only strings, strip removes Unicode whitespace as defined by Character.isWhitespace, lines splits into a Stream<String> by line terminators, and repeat(n) concatenates a string n times.",
        "Developers constantly pulled in Apache Commons or wrote regex for blank checks, trimming and splitting text; trim only removed characters up to U+0020 and missed Unicode spaces.",
        "Use them for input validation, parsing multi-line text blocks, building separators, and cleaning user input. Pair lines() with streams to process large text lazily.",
        "Do not use isBlank on null (NPE), and keep using StringUtils or a library when you need null-safe helpers and richer utilities.",
        "Write if (name == null || name.isBlank()) throw ..., text.lines().map(String::strip).filter(s -> !s.isEmpty()).toList(), and \"-\".repeat(20) for a divider.",
        "Pros: standard, Unicode-correct, no dependency. Cons: not null-safe, limited compared with Commons Lang, and behaviour differs subtly from trim.",
        "Alternatives are trim() with length checks, regex, Apache Commons Lang StringUtils, and Guava's Strings and CharMatcher."
      ] },
      { name: "Files.readString and writeString", answer: [
        "Files.readString(path) and Files.writeString(path, text) read or write a whole text file in one call with a charset (UTF-8 by default). They replace the reader, stream and buffer boilerplate for small files.",
        "Both are static methods on java.nio.file.Files. readString decodes the entire file into a String and throws a checked IOException; writeString accepts OpenOptions such as APPEND or CREATE.",
        "Reading a small file previously needed Files.readAllBytes plus new String(..., charset), or a BufferedReader loop; the charset was easy to forget, causing platform-dependent bugs.",
        "Use them for configuration, templates, fixtures, small JSON files and scripts where the whole content comfortably fits in memory.",
        "Do not use them for large or unbounded files, since the whole content is loaded at once. Use Files.lines or a buffered stream for that, and do not forget that writeString replaces existing content by default.",
        "Write String json = Files.readString(Path.of(\"config.json\")); and Files.writeString(out, text, StandardOpenOption.APPEND). Malformed input for the charset throws MalformedInputException.",
        "Pros: one line, explicit charset, less code. Cons: memory use for large files and checked exceptions.",
        "Alternatives are Files.readAllLines, Files.lines (lazy streaming), BufferedReader, memory-mapped files for huge data, and Commons IO's FileUtils."
      ] },
      { name: "Single-file source launch", answer: [
        "Java 11 lets you run a single source file directly with java Hello.java, compiling in memory without producing a .class file. It is great for scripts and demos but not for production builds.",
        "The launcher compiles the first class in the file and runs its main method. Command-line arguments pass through, and a shebang line makes the file executable on Unix systems.",
        "Running a tiny program required javac followed by java, which was a barrier for scripts, experiments, teaching and quick utilities compared with scripting languages.",
        "Use it for ad hoc scripts, reproducing bugs, quick experiments, and interview-style coding demos. JBang builds on the same idea with dependency support.",
        "Do not use it for multi-file projects, anything needing dependencies without extra tooling, or production deployment. There is no build reproducibility, testing or packaging.",
        "Run java Hello.java arg1 arg2. Add --class-path for dependencies. In Java 22 the feature was extended to launch multi-file programs, and Java 25 simplified the entry point further.",
        "Pros: instant feedback, no build step, scripting feel. Cons: compiled on each run, restricted to a single file in 11, and no dependency management.",
        "Alternatives are javac plus java, JShell for interactive snippets, JBang for dependency-aware scripts, and build tools such as Maven or Gradle for real projects."
      ] },
      { name: "var in lambda parameters", answer: [
        "Java 11 allows var in lambda parameters, (var x, var y) -> x + y. Its main purpose is to let you add annotations or modifiers to inferred parameters without writing the explicit type.",
        "The type is inferred exactly as if you omitted it. The rule is all-or-nothing: you cannot mix var with explicit types or with implicit untyped parameters in the same lambda.",
        "Annotations such as @NonNull could only be applied to lambda parameters if an explicit type was written. var lets you annotate while keeping inference.",
        "Use it when you need an annotation or final modifier on a lambda parameter, typically with validation or null-checking frameworks. Otherwise plain (x, y) is shorter.",
        "Do not use it just for style; without annotations it adds nothing over the implicit form. It is also not allowed to mix forms, which makes it awkward in code that was not designed for it.",
        "Write (@NonNull var a, @NonNull var b) -> a.compareTo(b). The same var keyword introduced for locals in Java 10 applies here with the same inference rules.",
        "Pros: enables annotations and modifiers with inference. Cons: tiny use case, can confuse readers, and gives no benefit by itself.",
        "Alternatives are explicit types (verbose), implicit untyped parameters (no annotation), or extracting the lambda to a method where parameters can be annotated normally."
      ] }
    ]
  },
  {
    name: "Java 17", year: 2021, features: [
      { name: "Sealed classes (standard)", answer: [
        "Sealed classes and interfaces restrict which types may extend or implement them, using sealed and permits. Together with records and pattern matching they model closed hierarchies with compile-time exhaustiveness.",
        "A sealed type lists its permitted subtypes, each of which must be final, sealed or non-sealed. The compiler and runtime enforce the closed set, and switch can check that all cases are covered.",
        "Public inheritance was all-or-nothing: either anyone could extend a class, or it was final. Domain models wanted a controlled set, such as a Payment that is only Card, Upi or Cash, and the compiler could not help.",
        "Use them for domain models with a known set of variants, ASTs, command and event hierarchies, and result types such as Success or Failure, particularly with pattern matching for switch.",
        "Avoid them for extension points where third parties are meant to subclass, such as plugin APIs, and avoid them if the set of variants changes frequently across modules.",
        "Write sealed interface Shape permits Circle, Square {} with record Circle(double r) implements Shape {}. A switch over Shape then needs no default, and adding a new permitted type breaks compilation wherever the switch is incomplete, which is the point.",
        "Pros: precise domain modelling, exhaustive switches, safer evolution. Cons: less extensibility, all permitted types must be in the same module or package, and added modifiers on subclasses.",
        "Alternatives are enums (fixed constants only), abstract classes with package-private constructors, the visitor pattern (verbose but extensible), and final classes with a type field."
      ] },
      { name: "Strong encapsulation by default", answer: [
        "From Java 17, the JDK's internal APIs are strongly encapsulated, and deep reflection into java.* internals fails unless explicitly opened. It is the change that most often breaks libraries and frameworks during upgrades from Java 8 or 11.",
        "The module system, introduced in Java 9, hides non-exported packages. Java 16 and 17 removed the --illegal-access escape hatch, so setAccessible on JDK internals throws InaccessibleObjectException unless you pass --add-opens.",
        "Frameworks and applications had grown to depend on internals like sun.misc.Unsafe and private fields, which locked the JDK into its implementation and made evolution, security and performance work risky.",
        "It matters for any upgrade to 17 and beyond: older versions of Lombok, Mockito, Spring, Hibernate, Jackson modules, serialisers and agents may need upgrading, and tests often reveal the problems first.",
        "Do not paper over it permanently with --add-opens flags; treat them as temporary. Avoid writing new code that reflects into JDK internals.",
        "Read the error message, which names the package to open, then first upgrade the dependency. If you must, add --add-opens java.base/java.lang=ALL-UNNAMED to JVM args, and use jdeps --jdk-internals to find offenders.",
        "Pros: a safer, more maintainable platform and room for JDK optimisations. Cons: upgrade friction, legacy dependencies break, and workarounds add launch flags.",
        "Alternatives are staying on an older JDK (which loses security updates), using supported replacements such as VarHandle, MethodHandles.Lookup and the Foreign Function API, or moving to maintained libraries."
      ] },
      { name: "Random number generator API", answer: [
        "JEP 356 added the RandomGenerator interface and a service for creating generators by algorithm name, such as L64X128MixRandom. It unifies Random, ThreadLocalRandom, SplittableRandom and SecureRandom behind one interface.",
        "RandomGenerator defines nextInt, nextLong, nextDouble and streams. RandomGeneratorFactory.of(\"L64X128MixRandom\").create(seed) makes instances, and splittable and jumpable variants support parallel use.",
        "The old classes shared no common interface, so code could not accept any generator, and new algorithms with better statistical quality and speed could not be added cleanly.",
        "Use it for simulations, Monte Carlo methods, sampling, tests with reproducible seeds, and parallel streams where splittable generators avoid contention.",
        "For anything security-sensitive such as tokens, keys or passwords, you still need SecureRandom. Do not choose a fast generator for cryptographic purposes.",
        "Write RandomGenerator rng = RandomGenerator.of(\"L64X128MixRandom\"); int n = rng.nextInt(100); or RandomGenerator.getDefault(). Use the interface in method signatures so callers can supply their own generator.",
        "Pros: one interface, better algorithms, easy swapping and testing. Cons: little benefit for casual code and risk of misusing non-secure generators.",
        "Alternatives are java.util.Random (legacy, poor quality), ThreadLocalRandom (simple and fast for concurrent use), SplittableRandom, SecureRandom, and libraries like Apache Commons RNG."
      ] }
    ]
  },
  {
    name: "Java 21", year: 2023, features: [
      { name: "Virtual threads", answer: [
        "Virtual threads are lightweight threads managed by the JVM, so you can write simple blocking code with one thread per request and still handle huge concurrency. They became standard in Java 21 and improve throughput for I/O-bound workloads, not CPU-bound ones.",
        "A virtual thread is mounted on a small pool of carrier platform threads and is unmounted when it blocks on I/O, locks or sleep, so thousands or millions can exist cheaply. They are created with Thread.ofVirtual() or Executors.newVirtualThreadPerTaskExecutor().",
        "Platform threads are expensive, so servers capped concurrency with thread pools or switched to reactive code to scale, which is harder to write, debug and profile. Virtual threads bring scalability back to the thread-per-request style.",
        "Use them for I/O-heavy services with many concurrent blocking calls: HTTP backends, database access, microservice fan-out. Spring Boot 3.2 enables them with spring.threads.virtual.enabled=true.",
        "Do not use them for CPU-bound work, and do not pool them. Be careful with pinning inside synchronized blocks or native calls (largely fixed in Java 24), with ThreadLocal-heavy code, and with downstream limits such as database connection pools that become the new bottleneck.",
        "Write try (var executor = Executors.newVirtualThreadPerTaskExecutor()) { executor.submit(() -> callService()); }. Replace synchronized with ReentrantLock on old versions, limit concurrency with a Semaphore, and monitor with JFR events like jdk.VirtualThreadPinned.",
        "Pros: simple code, high concurrency, compatible with existing blocking APIs. Cons: no gain for CPU work, pinning risk, harder to reason about limits, and tools and libraries still catching up.",
        "Alternatives are platform thread pools, reactive programming (WebFlux, Reactor), CompletableFuture chains, and Kotlin coroutines; virtual threads win on simplicity, reactive wins in backpressure-centric streaming."
      ] },
      { name: "Pattern matching for switch", answer: [
        "Pattern matching for switch lets a switch test types, deconstruct records and use guards, and it must be exhaustive for sealed types. It replaces long instanceof chains with a single checked construct.",
        "Case labels can be type patterns (case Circle c), record patterns, and can include a guard with when (case Circle c when c.r() > 10). The selector can be any reference type, and null can be handled with case null.",
        "Branching on type used instanceof ladders with casts, which were verbose, error-prone and never checked for completeness.",
        "Use it for sealed hierarchies, algebraic data types, interpreters, event handling, and mapping domain variants to results, typically as a switch expression returning a value.",
        "Avoid it for simple value switches that an enum or polymorphism handles better, and do not use a default branch on sealed types if you want the compiler to flag newly added subtypes.",
        "Write double area = switch (shape) { case Circle c -> Math.PI * c.r() * c.r(); case Square s -> s.side() * s.side(); }; order cases from specific to general, since dominated patterns are compile errors.",
        "Pros: concise, exhaustive and safe, with no casts. Cons: encourages type-switching over polymorphism in places where methods would be cleaner, and evolving a sealed hierarchy breaks switches by design.",
        "Alternatives are instanceof chains, polymorphic methods on the types, and the visitor pattern, which stays extensible but is verbose."
      ] },
      { name: "Record patterns", answer: [
        "Record patterns deconstruct a record into its components inside instanceof and switch, including nested patterns. They extract data in one step without calling accessors.",
        "A record pattern such as Point(int x, int y) matches a Point and binds its components. Patterns can nest, for example Line(Point(var x1, var y1), Point(var x2, var y2)), and var can infer component types.",
        "Pulling values out of nested data meant instanceof checks, casts and chained getter calls; the structure of the data was not reflected in the code.",
        "Use them with records and sealed interfaces to process structured data: ASTs, messages, API responses, geometry, and result types.",
        "Avoid them for classes that are not records, and avoid deeply nested patterns that are harder to read than a small helper method. Remember a null component matches only if the pattern allows it.",
        "Write if (obj instanceof Point(int x, int y)) { use(x, y); } or case Success(var value) -> handle(value) in a switch. Combine with guards using when.",
        "Pros: declarative, concise, compile-time checked. Cons: only works with records, can become dense with deep nesting, and adds a language concept to learn.",
        "Alternatives are accessor calls after instanceof and cast, Lombok's @Value with getters, and visitor-based decomposition."
      ] },
      { name: "Sequenced collections", answer: [
        "Java 21 added SequencedCollection, SequencedSet and SequencedMap, giving collections with a defined encounter order a uniform API for first, last and reversed views. It fixes the long-standing inconsistency of getting the last element across List, Deque and LinkedHashSet.",
        "New methods include getFirst, getLast, addFirst, addLast, removeFirst, removeLast and reversed(), which returns a view. List, Deque, LinkedHashSet, LinkedHashMap and SortedSet now implement the interfaces.",
        "Getting the last element of a List used list.get(list.size() - 1), a Deque used peekLast, a LinkedHashSet needed iteration, and a SortedSet used last(); there was no common type for ordered collections.",
        "Use them when order matters: most-recent-first views, LRU style structures with LinkedHashMap, and algorithms that need both ends.",
        "Do not use them for unordered collections like HashSet. Be aware that getFirst on an empty collection throws NoSuchElementException, and reversed() is a live view, not a copy.",
        "Write list.getLast(), deque.reversed(), and map.firstEntry() or map.sequencedKeySet().reversed() on a LinkedHashMap. Use the interface type in parameters where only ordering is needed.",
        "Pros: consistent API, less boilerplate, and reversed views without copying. Cons: new interfaces may collide with custom collection classes, and older Java versions lack it.",
        "Alternatives are index arithmetic, Guava's Iterables.getLast or Lists.reverse, Apache Commons Collections, and manually iterating."
      ] },
      { name: "Generational ZGC", answer: [
        "Generational ZGC splits the heap into young and old generations, so short-lived objects are collected cheaply while keeping sub-millisecond pauses. In Java 21 you enable it with -XX:+UseZGC -XX:+ZGenerational, and it became the default ZGC mode in Java 23.",
        "ZGC is a concurrent, region-based, low-pause collector using coloured pointers and load barriers. Adding generations lets it focus on young objects, reducing CPU, memory and allocation-stall costs compared with the single-generation version.",
        "Single-generation ZGC collected the whole heap each cycle, which wasted work on long-lived data and could stall under high allocation rates, so some applications could not benefit from its low latency.",
        "Use it for latency-sensitive services with large heaps, such as trading, real-time APIs, and in-memory caches, where pause time matters more than raw throughput.",
        "Skip it for small heaps, batch jobs where throughput is the goal, or when G1 already meets your latency targets. Tune with measurements, because ZGC trades some throughput and memory for low pauses.",
        "Run with java -XX:+UseZGC -XX:+ZGenerational -Xmx16g -jar app.jar on 21, and just -XX:+UseZGC on 23 and later. Verify with GC logs (-Xlog:gc*) and compare p99 latency with G1.",
        "Pros: very short pauses at large heap sizes, lower overhead than the original ZGC, and little tuning. Cons: slightly lower peak throughput than ParallelGC, higher memory overhead, and a requirement to benchmark real workloads.",
        "Alternatives are G1 (the balanced default), ParallelGC (throughput), Shenandoah (also low-pause, concurrent), and Epsilon (no-op collector for tests)."
      ] }
    ]
  },
  {
    name: "Java 25", year: 2025, features: [
      { name: "Scoped values (standard)", answer: [
        "Scoped values share immutable data within a bounded scope and with child threads, and became standard in Java 25. They are the modern, cheaper and safer alternative to ThreadLocal, especially with virtual threads.",
        "A ScopedValue is bound for the duration of a call using ScopedValue.where(KEY, value).run(...) or call(...). Code inside reads KEY.get(); the binding is immutable, automatically removed at the end, and inherited by structured concurrency subtasks.",
        "ThreadLocal is mutable, easy to leak, has an unbounded lifetime, and is costly when you create millions of virtual threads. Scoped values give a defined lifetime and a simple model for request context.",
        "Use them for request-scoped context: user identity, trace id, tenant, security context and transaction information passed implicitly down a call tree.",
        "Do not use them when you need to mutate the value or when the data must outlive the scope; use explicit parameters or other state holders instead. Do not hide business inputs in implicit context; it harms readability.",
        "Define private static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance(); bind with ScopedValue.where(CURRENT_USER, user).run(() -> handle()), and read CURRENT_USER.get() deep in the call stack. Rebinding in a nested scope shadows only within it.",
        "Pros: immutable, bounded lifetime, low cost with virtual threads, and no leaks. Cons: read-only, a new idiom to adopt, and frameworks need to integrate it.",
        "Alternatives are ThreadLocal and InheritableThreadLocal (mutable and costly), explicit method parameters (clearest), dependency injection with request scope, and context objects such as MDC for logging."
      ] },
      { name: "Compact source files and instance main (standard)", answer: [
        "Java 25 finalised compact source files and instance main methods, so a beginner can write void main() { ... } in a single file without a class declaration or static. It lowers the entry barrier while remaining fully compatible with normal Java.",
        "A compact source file implicitly declares an unnamed top-level class, and the launcher can start a non-static, non-public main with or without args. A new java.lang.IO class offers println and readln for simple console I/O.",
        "Hello world required a public class, public static void main(String[] args) and System.out, which introduced five concepts before a learner printed a line, and made Java feel heavy compared with scripting languages.",
        "Use it for teaching, scripts, small utilities, and quick experiments, and it combines with java File.java source launching, introduced in Java 11.",
        "Do not use it for production services, libraries or multi-class projects, where explicit classes, packages and build tooling are needed. Interview answers should note that it is a convenience, not a new language.",
        "Write a file with void main() { IO.println(\"Hello\"); } and run java Hello.java. As the program grows you can add methods, then fields, then explicit classes without rewriting anything.",
        "Pros: gentle learning curve, scripting feel, and no lost power. Cons: unnamed class cannot be referenced from other code, and tooling and conventions favour explicit classes for real projects.",
        "Alternatives are the classic main method, JShell for interactive use, JBang for scripts with dependencies, and scripting languages like Python."
      ] },
      { name: "Module import declarations (standard)", answer: [
        "Module import declarations let you write import module java.base; to import every public top-level type exported by a module in one line. It is mostly a convenience for scripts and learning, and was finalised in Java 25.",
        "The statement imports all packages exported by the named module and those exported transitively by modules it requires, so java.util, java.io, java.nio.file and others are available at once.",
        "Short programs needed long lists of imports before doing anything useful, which added noise for beginners and for quick scripts that touch many standard APIs.",
        "Use it in compact source files, prototypes, demos and teaching code, where convenience matters more than strictness.",
        "In large production code, explicit imports document dependencies, avoid ambiguity and are easier to review. Ambiguous names, such as java.util.List and java.awt.List, require a single-type import to resolve.",
        "Write import module java.base; then use List, Map, Path and Stream directly. If two imported modules export the same simple name, add an explicit single-type import to disambiguate.",
        "Pros: far fewer import lines, convenient for scripts, and easy to learn. Cons: hides which classes you use, can introduce name clashes, and does not suit team conventions that forbid wildcards.",
        "Alternatives are explicit single-type imports (clearest), on-demand package imports such as java.util.*, and IDE-managed imports."
      ] },
      { name: "Compact object headers", answer: [
        "Compact object headers shrink the per-object header on 64-bit HotSpot from 12 bytes to 8, and became a product feature in Java 25. They cut heap use and improve cache behaviour for applications with many small objects, and you enable them with -XX:+UseCompactObjectHeaders.",
        "Every Java object carries a header with a mark word and a class pointer. The compact layout merges them into a single 64-bit word, encoding the class in fewer bits, which saves memory for every allocated object.",
        "Typical heaps are dominated by small objects such as strings, boxed values and nodes, so the header is a significant fraction of heap size. Reducing it lowers memory footprint, GC work and cloud costs without code changes.",
        "Use it for large services with many small objects, memory-constrained containers, and cost-sensitive deployments, after benchmarking against your workload.",
        "It is opt-in, so test before enabling in production. Limits on the number of loadable classes and some tools or agents that depend on the old header layout may matter, and gains are small for heaps of large arrays.",
        "Run java -XX:+UseCompactObjectHeaders -jar app.jar, then compare heap size, GC time and throughput using JFR and GC logs. No source change is required.",
        "Pros: lower memory, better cache locality, less GC pressure, and no code changes. Cons: still opt-in, compatibility caveats with native agents, and real gains vary by allocation patterns.",
        "Alternatives are compressed class pointers and compressed oops (already default), data-structure redesign with primitive arrays, off-heap storage, and Project Valhalla value classes for the longer term."
      ] }
    ]
  }
];
