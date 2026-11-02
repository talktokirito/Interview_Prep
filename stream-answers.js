// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives]
const SERVICE_ANSWERS = {
  "Stream vs Collection": [
    "A Collection stores data; a Stream describes a computation over data. Collections are eager, finite and reusable, while streams are lazy, can be infinite, and are consumed once.",
    "A Collection is an in-memory data structure whose elements all exist. A Stream is a pipeline of operations over a source that does not store elements and never modifies the source.",
    "Loops over collections mix iteration, filtering and accumulation in mutable code. Streams separate what to compute from how to iterate and allow fusion and parallelism.",
    "Use a collection to hold and look up data. Use a stream to transform, filter, group or aggregate it, usually once, ending in a result.",
    "Do not use a stream as storage or pass it around as a data holder. Avoid it for trivial loops, indexed access, or when you need to traverse the data several times.",
    "Call collection.stream() to go from storage to computation and collect() or toList() to go back. Ask yourself whether you need the data again later; if yes, keep the collection.",
    "Pros: declarative and composable. Cons: single-use, harder to debug, and some overhead on tiny data sets.",
    "Alternatives are plain for-loops and iterators (faster in hot paths), Iterable.forEach, and reactive streams (Reactor, RxJava) when data arrives asynchronously."
  ],
  "Lazy evaluation": [
    "Intermediate operations such as filter and map do nothing until a terminal operation runs. Elements then flow one at a time through the whole pipeline, which makes short-circuiting and fusion possible.",
    "Calling filter or map only records a stage in the pipeline. The terminal operation triggers a single traversal in which each element passes through every stage before the next element starts.",
    "Eager processing would build an intermediate collection after every step, wasting memory and work. Laziness avoids that and lets infinite sources work.",
    "It matters whenever you chain operations, work with very large or infinite data, or use limit, findFirst or anyMatch to stop early.",
    "Laziness surprises you when you rely on side effects: a pipeline without a terminal operation does nothing, and peek may not run if the engine can skip the traversal.",
    "Write Stream.of(1, 2, 3).filter(n -> { log(n); return n > 1; }) and observe that nothing is logged until you add collect or forEach. Keep lambdas free of side effects so order and timing do not matter.",
    "Pros: efficient, supports infinite streams, fewer allocations. Cons: execution order is not obvious, debugging is harder, and side effects behave unexpectedly.",
    "Alternatives are eager collection transformations (each step builds a new list), loops, and Guava's Iterables, which are also lazy views."
  ],
  "Short-circuiting": [
    "Short-circuiting operations can stop processing before all elements are visited, even on infinite streams. Examples are limit, findFirst, findAny, anyMatch, allMatch, noneMatch and takeWhile.",
    "A short-circuiting operation may produce a result without consuming the whole source. Combined with laziness, only the elements needed to reach the answer are processed.",
    "Without it, searching for the first match in a large or infinite source would still traverse everything, or never finish at all.",
    "Use it for existence checks, finding the first match, bounding infinite streams, and reading only the head of large inputs such as files.",
    "Do not assume it saves work when the pipeline contains stateful operations like sorted, which must see all elements first, or on a parallel stream where several elements may already be in flight.",
    "Write Stream.iterate(1, n -> n + 1).filter(n -> n % 7 == 0).limit(5).toList(). Put cheap filters before expensive ones, and avoid sorted before limit when you can restructure.",
    "Pros: saves CPU and memory, makes infinite sources usable. Cons: behaviour with side effects and parallelism can be surprising.",
    "Alternatives are loops with break, Iterator with early return, and Optional-returning search helpers."
  ],
  "Stateless vs stateful operations": [
    "Stateless operations like filter and map process each element independently, while stateful ones like sorted, distinct, limit and skip must remember other elements. Stateful operations can need buffering and hurt parallel performance.",
    "A stateless operation's result for an element does not depend on any other element. A stateful operation depends on previously seen elements or on the whole stream, so it may create a barrier in the pipeline.",
    "The distinction explains performance: stateless stages fuse into one pass and parallelise easily, while stateful stages may buffer the entire input before continuing.",
    "Know it when tuning pipelines or reviewing parallel code: place stateless filters first to shrink data before a stateful sorted or distinct.",
    "Do not write lambdas that carry mutable state, such as a counter incremented inside map; they are stateful lambdas and break with parallel streams or reordering.",
    "Reorder to stream.filter(...).map(...).sorted().limit(10) so that sorted sees less data. Keep lambdas pure and non-interfering, and use collectors rather than external mutable variables.",
    "Pros: understanding it avoids slow pipelines and race bugs. Cons: stateful stages cost memory and limit parallel speedups.",
    "Alternatives are using collectors that carry the state safely, or loops when the logic really is stateful."
  ],
  "Single use of streams": [
    "A stream can be traversed only once. A second terminal operation throws IllegalStateException, so if you need to run it again, create a new stream or keep a Supplier of streams.",
    "After a terminal operation the stream is marked as consumed or closed. Intermediate operations also return a new stream and invalidate the one they were called on.",
    "Streams are meant to be one-pass pipelines, which lets them avoid buffering and process large or generated data without storing it.",
    "Be aware of it whenever you store a stream in a variable or return it from a method: callers can consume it only once.",
    "Do not cache a stream in a field or reuse it for several results; collect the result into a collection instead.",
    "Use Supplier<Stream<String>> supplier = () -> list.stream(); and call supplier.get() each time. Or collect into a List once and stream from that list repeatedly.",
    "Pros: no hidden buffering, simple semantics. Cons: easy to reuse by mistake and the error appears only at runtime.",
    "Alternatives are keeping the source collection, returning a List or Collection from APIs, and Iterable lambdas that produce a new iterator per call."
  ],

  "Collection.stream()": [
    "collection.stream() creates a sequential stream backed by the collection, and parallelStream() requests a parallel one. It is the usual starting point for stream pipelines.",
    "Collection defines the default methods stream() and parallelStream(). The stream reads the collection lazily when the terminal operation runs and does not copy the elements.",
    "Before Java 8, processing a collection meant external iteration. Putting stream() on Collection made the whole collections framework usable with pipelines without changing existing classes.",
    "Use it whenever the data is already in a List, Set or Queue and you want to filter, transform or aggregate it. For a Map, stream over entrySet(), keySet() or values().",
    "Do not modify the source collection while the stream is being processed; that is interference and can throw ConcurrentModificationException. Avoid it for a single simple lookup that a method like contains does better.",
    "Write orders.stream().filter(Order::isPaid).map(Order::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add). For maps, map.entrySet().stream().sorted(Map.Entry.comparingByValue()).",
    "Pros: simple, no copying, works with every Collection. Cons: sequential unless requested, and the source must not change during traversal.",
    "Alternatives are for-each loops, Iterator, Collection.removeIf and replaceAll for in-place changes, and Guava or Eclipse Collections."
  ],
  "Stream.of and Arrays.stream": [
    "Stream.of builds a stream from given values, and Arrays.stream builds one from an array or a range of it. Primitive arrays need Arrays.stream or IntStream.of, because Stream.of on an int[] gives a stream with one element.",
    "Stream.of(T...) accepts varargs and Stream.of(T) a single element. Arrays.stream(array, from, to) streams a slice, and Stream.empty() and Stream.ofNullable (Java 9) cover edge cases.",
    "Tests, constants and arrays needed a quick path into the stream API without creating a collection first.",
    "Use it for fixed small sets of values, arrays from legacy APIs, and unit tests, and to merge sources with Stream.concat.",
    "Avoid Stream.of(intArray) expecting a stream of ints; you will get Stream<int[]>. Avoid it for large dynamic data; use the real source instead.",
    "Write Stream.of(\"a\", \"b\"), Arrays.stream(names), Arrays.stream(numbers, 2, 5) and IntStream.of(1, 2, 3). Use Stream.concat(a, b) or flatMap to join streams.",
    "Pros: convenient and cheap. Cons: primitive array pitfall and varargs create an array.",
    "Alternatives are List.of(...).stream(), Collections.singleton, and Stream.builder() for building streams programmatically."
  ],
  "Stream.iterate and Stream.generate": [
    "Stream.iterate produces a sequence from a seed and a function, and Stream.generate produces values from a Supplier. Both are infinite unless bounded, so you pair them with limit, takeWhile or a predicate form.",
    "iterate(seed, f) yields seed, f(seed), f(f(seed)) and so on, and the Java 9 overload iterate(seed, hasNext, next) behaves like a for loop. generate(supplier) calls the supplier for each element and is unordered.",
    "Some data is naturally generated rather than stored: counters, Fibonacci, random values, polling results. Streams make these sequences composable.",
    "Use iterate for sequences where each value depends on the previous one, and generate for independent values such as random test data or UUIDs.",
    "Never terminate an unbounded stream with collect or forEach without a limit. Avoid stateful suppliers in generate when running in parallel.",
    "Write Stream.iterate(1, n -> n * 2).limit(10).toList(), or Stream.iterate(0, n -> n < 100, n -> n + 10). For random data use Stream.generate(() -> random.nextInt(100)).limit(5).",
    "Pros: expressive for generated data. Cons: infinite by default, so one mistake hangs the program, and parallelising iterate is poor because each element depends on the last.",
    "Alternatives are IntStream.range for numeric ranges, for-loops, random.ints(n) for random numbers, and Stream.builder."
  ],
  "Files.lines and BufferedReader.lines": [
    "Files.lines and BufferedReader.lines expose a text file as a lazy stream of lines, so large files can be processed without loading them fully into memory. The stream holds an open resource and must be closed with try-with-resources.",
    "Files.lines(path) reads lines lazily using a charset (UTF-8 by default). IOExceptions during iteration are wrapped in UncheckedIOException, and the stream is closed through close() or try-with-resources.",
    "Reading everything with readAllLines needs memory proportional to the file. A lazy stream processes logs and CSV files that are far larger than the heap.",
    "Use it for log analysis, CSV or text parsing, filtering large files and counting matches, ideally ending with a short-circuiting or aggregating operation.",
    "Do not leave the stream unclosed or return it from a method that closed the resource. Avoid it when you need random access or multiple passes over the file.",
    "Write try (Stream<String> lines = Files.lines(Path.of(\"app.log\"))) { return lines.filter(l -> l.contains(\"ERROR\")).count(); }. Handle charset errors explicitly with a charset argument if needed.",
    "Pros: memory efficient, expressive. Cons: resource handling is easy to forget and parsing is single-threaded unless parallelised carefully.",
    "Alternatives are Files.readAllLines or readString (small files), BufferedReader loops, Scanner, and libraries like OpenCSV or Jackson for structured files."
  ],

  "filter": [
    "filter keeps only the elements that satisfy a Predicate. It is stateless and lazy, and should come early in a pipeline to reduce the data for later stages.",
    "filter takes a Predicate<T> and returns a stream of the elements for which it returns true. The element type does not change.",
    "Selecting elements used loops with if statements and mutable result lists. filter makes selection a declarative, composable step.",
    "Use it for any subset selection: active users, paid orders, non-null values, items matching a business rule. Combine predicates with and, or and negate.",
    "Avoid expensive or side-effecting predicates, and do not put a large number of rules in one lambda; extract named predicates for clarity.",
    "Write users.stream().filter(User::isActive).filter(u -> u.getAge() > 18).toList(), or Objects::nonNull to drop nulls. Keep predicates pure and cheap.",
    "Pros: simple, stateless, fuses well. Cons: nothing special, but long lambdas hurt readability.",
    "Alternatives are Collection.removeIf (in place), loops with continue, and database-side filtering when the data comes from a query."
  ],
  "map": [
    "map transforms each element into another using a Function, producing a stream of the results. It is one-to-one, stateless and lazy, and the primitive variants mapToInt, mapToLong and mapToDouble avoid boxing.",
    "map takes a Function<T, R> and returns Stream<R>. The number of elements stays the same.",
    "Transforming elements used loops that built new collections. map expresses the transformation directly and chains with other operations.",
    "Use it to extract fields, convert types, build DTOs from entities, or normalise values: users.stream().map(User::getEmail).",
    "Avoid map when each element should produce zero or many results; use flatMap. Do not use map for side effects; that is what forEach is for. Avoid it in hot numeric paths when mapToInt would avoid boxing.",
    "Write orders.stream().map(OrderMapper::toDto).toList(), and for numbers use .mapToInt(Order::getQuantity).sum() to avoid creating Integer objects.",
    "Pros: concise, composable. Cons: unnecessary object creation, and a lambda that throws checked exceptions needs wrapping.",
    "Alternatives are loops, MapStruct or similar mappers for large object graphs, and Optional.map for single values."
  ],
  "flatMap": [
    "flatMap maps each element to a stream and flattens all those streams into one, handling one-to-many and nested structures. Typical uses are flattening List<List<T>>, splitting text into words, and merging optional results.",
    "flatMap takes a Function<T, Stream<R>> and concatenates the resulting streams. Each inner stream is closed after its contents have been placed into the result.",
    "map would give you a Stream<Stream<R>> or Stream<List<R>>, which is awkward. flatMap removes one level of nesting in the pipeline.",
    "Use it to flatten nested collections, expand one record into several, parse lines into tokens, and drop empty results by returning Stream.empty().",
    "Do not use it where map is enough, and be careful with large inner streams; flatMap in older JDKs was not fully lazy for short-circuiting (fixed in Java 10).",
    "Write departments.stream().flatMap(d -> d.getEmployees().stream()).toList(), lines.flatMap(l -> Arrays.stream(l.split(\" \"))), and optional.stream() to flatten Optionals into a stream.",
    "Pros: elegant flattening. Cons: harder for beginners to read and can allocate many small streams.",
    "Alternatives are nested loops, mapMulti (Java 16, avoids creating small streams), and Collectors.flatMapping inside a collector."
  ],
  "peek": [
    "peek runs an action on each element as it flows past, and exists mainly for debugging. It is not guaranteed to run in every case and should not carry business logic.",
    "peek takes a Consumer and returns the same stream. The action is applied lazily, only when elements are pulled by a terminal operation.",
    "Developers needed a way to inspect the intermediate values of a pipeline without breaking the chain.",
    "Use it to log or debug while developing a pipeline, and remove it before committing in most cases.",
    "Do not rely on it for side effects: since Java 9, count() may skip the pipeline when the size is known, and in that case peek never runs. It is also unsafe with parallel streams unless the action is thread-safe.",
    "Write stream.peek(x -> log.debug(\"before filter {}\", x)).filter(...).peek(x -> log.debug(\"after {}\", x)).toList(). For real side effects use forEach at the end.",
    "Pros: easy inspection. Cons: may be skipped, ordering is hard to reason about, and misuse hides logic in the middle of a pipeline.",
    "Alternatives are a debugger breakpoint inside a lambda, forEach at the end, and logging inside map where it is explicit."
  ],
  "distinct": [
    "distinct removes duplicates using equals and hashCode, keeping the first occurrence in encounter order. It is a stateful operation that remembers every element seen.",
    "Internally it uses a set to remember elements. On ordered streams it keeps the first of each duplicate set, and on parallel ordered streams this is costly.",
    "Removing duplicates manually meant building a LinkedHashSet or checking contains in a loop.",
    "Use it for deduplicating IDs, tags or values when the element type has correct equals and hashCode.",
    "Avoid it on classes without equals and hashCode, or on huge streams where memory for the seen set matters. Use a key-based approach if you need distinct by a field.",
    "Write ids.stream().distinct().toList(). For distinct by field, collect to a map with toMap(User::getEmail, u -> u, (a, b) -> a).values(), or use a Set of keys inside a filter only with care.",
    "Pros: one-liner. Cons: memory grows with the number of unique elements and it depends on correct equals and hashCode.",
    "Alternatives are collecting into a LinkedHashSet or TreeSet, Collectors.toMap with a merge function, and database DISTINCT."
  ],
  "sorted": [
    "sorted orders elements by natural order or a Comparator. It is stateful and has to buffer all elements before emitting any, so it blocks short-circuiting and costs O(n log n).",
    "sorted() requires Comparable elements and throws ClassCastException otherwise; sorted(comparator) uses the given order. The sort is stable for ordered streams.",
    "Sorting a collection with Collections.sort changes it in place; sorted gives an ordered view in a pipeline without touching the source.",
    "Use it near the end of a pipeline to order results for display, reports and top-N queries, combined with Comparator.comparing and thenComparing.",
    "Avoid it early in a pipeline before filters, and avoid sorting on infinite streams since it never completes. Do not sort just to find the max; use max.",
    "Write people.stream().sorted(Comparator.comparing(Person::getLastName).thenComparing(Person::getFirstName)).toList(), and use Comparator.reverseOrder() or reversed() for descending.",
    "Pros: declarative ordering without mutating the source. Cons: buffering the whole stream, O(n log n), and a barrier in the pipeline.",
    "Alternatives are Collections.sort or List.sort in place, a PriorityQueue for top-k, and database ORDER BY."
  ],
  "limit and skip": [
    "limit keeps the first n elements and skip discards the first n. Together they implement simple paging, and limit short-circuits an otherwise infinite stream.",
    "limit(n) truncates the stream to n elements, and skip(n) drops the first n. Both depend on encounter order and are cheap on sequential streams but expensive on ordered parallel ones.",
    "Taking the head or a page of data needed index loops or sublist calls. These operations express it within the pipeline.",
    "Use limit to bound infinite or large streams, to get top-N after sorted, and skip plus limit for in-memory paging.",
    "Avoid in-memory paging for big data sets; page in the database instead. Avoid on parallel ordered streams where they force coordination between threads.",
    "Write items.stream().sorted(byScore.reversed()).limit(10).toList() for top 10, and items.stream().skip(page * size).limit(size).toList() for a page.",
    "Pros: simple, short-circuits. Cons: skip must still traverse the discarded elements, and parallel performance is poor on ordered data.",
    "Alternatives are List.subList, database LIMIT and OFFSET or keyset pagination, and takeWhile for condition-based cutoffs."
  ],
  "takeWhile and dropWhile": [
    "takeWhile keeps elements until the predicate first fails, and dropWhile discards elements until it first fails. Both arrived in Java 9 and are intended for ordered streams, unlike filter which tests every element.",
    "takeWhile(p) stops at the first element that does not match, ending the stream. dropWhile(p) skips the matching prefix and passes everything after, including later elements that would match.",
    "filter and limit could not express stop when a condition breaks, which is common on sorted or time-ordered data and infinite streams.",
    "Use them on sorted or ordered data, for parsing a header section of lines, or for stopping an infinite sequence once a threshold is reached.",
    "Do not use them on unordered data; the result is nondeterministic. Choose filter when you want every matching element rather than a prefix.",
    "Write Stream.iterate(1, n -> n + 1).takeWhile(n -> n * n < 100), and lines.dropWhile(String::isBlank) to skip leading blank lines.",
    "Pros: clear prefix semantics and short-circuiting. Cons: only meaningful for ordered streams and easy to confuse with filter.",
    "Alternatives are filter, a loop with break, and iterate with a hasNext predicate."
  ],

  "forEach": [
    "forEach is a terminal operation that applies a Consumer to every element, used for side effects such as printing or saving. It does not guarantee order on parallel streams and should not be used to build results.",
    "forEach(Consumer) consumes each element. On parallel streams the order and thread are unspecified, and forEachOrdered is the ordered alternative.",
    "At the end of a pipeline you often need to do something with the results rather than return them, like logging, sending messages or writing to a store.",
    "Use it for final side effects: printing, publishing events, writing rows, after the transformation is done.",
    "Do not use it to fill a list or update shared variables, because that is unsafe in parallel and unclear; use collect. Avoid it when the action throws checked exceptions without wrapping.",
    "Write orders.stream().filter(Order::isPaid).forEach(this::sendReceipt). If you need results, use collect, toList or reduce instead.",
    "Pros: simple and direct. Cons: side effects, unordered in parallel, and tempting to abuse for accumulation.",
    "Alternatives are collect or reduce for results, Iterable.forEach on collections, and a plain for-loop, which allows break and checked exceptions."
  ],
  "collect": [
    "collect is the general terminal operation that gathers elements into a container, such as a list, map or string, using a Collector. It is a mutable reduction and is safe for parallel streams when the collector is well-behaved.",
    "collect(Collector) accepts a ready-made collector from Collectors, or you can supply a supplier, accumulator and combiner. A Collector defines how to create, accumulate, merge and finish the result.",
    "Hand-written loops that add to a list or map are mutable and not thread-safe. collect packages that accumulation so streams can run it in parallel.",
    "Use it whenever you need a collection, map, grouping, summary statistics or a joined string as the pipeline result.",
    "Do not add to an external list inside forEach, and do not write a custom collector when Collectors already has one. Remember that collectors on a parallel stream need concurrent-safe or properly combined containers.",
    "Write stream.collect(Collectors.groupingBy(Order::getCustomer, Collectors.counting())), or the three-argument form collect(StringBuilder::new, StringBuilder::append, StringBuilder::append).",
    "Pros: flexible, parallel-safe, and reusable collectors. Cons: advanced collectors can be hard to read, and custom collectors are complex.",
    "Alternatives are toList and toArray for simple cases, reduce for immutable reduction, and loops."
  ],
  "reduce": [
    "reduce combines all elements into one value using an associative operation, such as a sum or maximum. It is an immutable reduction, in contrast to collect, which mutates a container.",
    "The forms are reduce(identity, accumulator), reduce(accumulator) returning Optional, and reduce(identity, accumulator, combiner) for when the result type differs, which is what parallel execution needs.",
    "Aggregation by loops with a running variable is mutable and cannot be parallelised. reduce expresses it as a pure operation that can be split and merged.",
    "Use it for sums, products, concatenation and custom folding, where the operation is associative and has a natural identity.",
    "Avoid it for building collections or strings (use collect), and with non-associative operations such as subtraction, which give wrong results in parallel. Prefer sum() on primitive streams.",
    "Write numbers.stream().reduce(0, Integer::sum), prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add). The identity must be neutral for the operation.",
    "Pros: pure, parallel-friendly. Cons: easy to misuse with non-associative functions, and inefficient for building mutable containers.",
    "Alternatives are collect, IntStream.sum, average and summaryStatistics, and Collectors.summingInt or reducing."
  ],
  "count": [
    "count returns the number of elements as a long. It is a simple terminal operation, but since Java 9 it may skip the pipeline entirely when the size is known, so side effects in peek or map may not execute.",
    "count() is a reduction that counts elements after the intermediate operations. If the source is SIZED and no operation changes the size, the JVM can return the size without traversing.",
    "Counting matching items is among the most common aggregations, and doing it with a manual counter is verbose and not parallel-safe.",
    "Use it after filter to count matches: orders.stream().filter(Order::isLate).count().",
    "Do not rely on side effects of intermediate operations running because of count. Avoid it on infinite streams. For grouped counts use Collectors.counting.",
    "Write long n = names.stream().filter(s -> s.startsWith(\"A\")).count(). Be aware of the long return type when assigning to int.",
    "Pros: simple and sometimes constant time. Cons: skips the pipeline in some cases and returns long.",
    "Alternatives are collection.size() (when no filtering), Collectors.counting() for grouping, and a database COUNT query."
  ],
  "min and max": [
    "min and max return the smallest or largest element according to a Comparator, wrapped in an Optional. On primitive streams they return OptionalInt, OptionalLong or OptionalDouble.",
    "Both are reductions that take a Comparator and return an Optional that is empty for an empty stream. IntStream.max() needs no comparator.",
    "Finding extremes by sorting is O(n log n) and wasteful; min and max find them in one pass.",
    "Use them for finding the cheapest product, latest event, longest string or highest score: items.stream().max(Comparator.comparing(Item::getScore)).",
    "Do not sort and take the first element for this. Handle the empty Optional; do not call get() blindly. For ties, only one of the equal elements is returned.",
    "Write people.stream().min(Comparator.comparingInt(Person::getAge)).orElseThrow(), and for numbers mapToInt(...).max().getAsInt() after checking presence.",
    "Pros: single pass, no sorting. Cons: Optional handling and arbitrary choice among ties.",
    "Alternatives are Collections.min and max, sorted().findFirst(), Collectors.maxBy, and summaryStatistics for min, max and average together."
  ],
  "anyMatch, allMatch and noneMatch": [
    "These short-circuiting terminal operations answer yes or no questions about the elements, returning a boolean. On an empty stream anyMatch returns false while allMatch and noneMatch return true.",
    "anyMatch is true if at least one element matches, allMatch if all do, and noneMatch if none do. Each stops as soon as the answer is known.",
    "Existence checks written as loops with flags are verbose. These operations state the question directly and stop early.",
    "Use them for validation and rules: users.stream().anyMatch(User::isAdmin), orders.stream().allMatch(Order::isValid).",
    "Do not forget the empty-stream behaviour, which commonly surprises people: allMatch on an empty stream is true. Avoid filter plus count for existence checks.",
    "Write boolean ok = items.stream().noneMatch(i -> i.getPrice() < 0). Put them directly in conditions and keep predicates cheap.",
    "Pros: readable and short-circuiting. Cons: empty-stream semantics and, on parallel streams, which element triggered the stop is not defined.",
    "Alternatives are Collection.contains, loops with early return, filter with findAny, and database EXISTS queries."
  ],
  "findFirst and findAny": [
    "findFirst returns the first element in encounter order, and findAny returns any element, which is cheaper on parallel streams. Both return an Optional and short-circuit.",
    "Both are terminal short-circuit operations returning Optional<T>. findFirst respects order, findAny is free to return any element and is the same as findFirst in practice for sequential streams.",
    "Searching for one element used loops with early return. These operations express the search and handle the not-found case with Optional.",
    "Use findFirst when order matters, such as the first match after sorting, and findAny when any match will do in a parallel search.",
    "Do not call get() without checking the Optional. findFirst throws NullPointerException if the selected element is null. Avoid findFirst on parallel streams when any element would do.",
    "Write users.stream().filter(u -> u.getEmail().equals(email)).findFirst().orElseThrow(() -> new NotFoundException(email)).",
    "Pros: short-circuiting and null-safe results. Cons: Optional boilerplate, and findFirst limits parallel speed.",
    "Alternatives are loops, Map lookups for key-based search, a database query, and Collectors.minBy and maxBy."
  ],
  "toList": [
    "Stream.toList() was added in Java 16 as a short way to collect into a List. It returns an unmodifiable list, unlike Collectors.toList, which makes no promise about the list type or mutability.",
    "toList() is a terminal operation that returns an unmodifiable list containing the elements in encounter order, and it permits null elements.",
    "collect(Collectors.toList()) was extremely common, verbose, and returned an ArrayList that people then mutated by accident.",
    "Use it as the default when you just need a list and do not plan to modify it.",
    "Do not use it if the caller needs to add or remove elements; use collect(Collectors.toCollection(ArrayList::new)) or wrap the result. Remember it is a Java 16 feature.",
    "Write List<String> names = users.stream().map(User::getName).toList(). Calling add on the result throws UnsupportedOperationException.",
    "Pros: concise and safe by default. Cons: immutable, requires Java 16 or later, and differs from Collectors.toUnmodifiableList in null handling.",
    "Alternatives are Collectors.toList, toUnmodifiableList, toCollection for a specific type, and Stream.toArray."
  ],
  "toArray": [
    "toArray collects the elements into an array. Pass an array constructor such as String[]::new to get a properly typed array, otherwise you get Object[].",
    "toArray() returns Object[], and toArray(IntFunction<A[]>) returns a typed array. Primitive streams return int[], long[] or double[] directly.",
    "Legacy APIs and varargs methods still need arrays, and collecting to a list then converting wastes effort.",
    "Use it when handing results to array-based APIs, building primitive arrays from IntStream, or for varargs.",
    "Do not use the no-argument version and then cast to a typed array, which fails with ClassCastException. Prefer lists when you do not need an array.",
    "Write String[] names = stream.toArray(String[]::new) and int[] squares = IntStream.range(0, 5).map(i -> i * i).toArray().",
    "Pros: direct and efficient. Cons: arrays are fixed-size and covariant, and generics support is poor.",
    "Alternatives are toList, collecting to ArrayList, and System.arraycopy or Arrays.copyOf for existing arrays."
  ],

  "toList, toSet and toMap": [
    "These collectors gather elements into a List, Set or Map. toMap throws IllegalStateException on duplicate keys unless you pass a merge function, and rejects null values.",
    "Collectors.toList and toSet return general-purpose collections without guarantees about the type. toMap(keyMapper, valueMapper[, mergeFunction[, mapSupplier]]) builds a map from the elements.",
    "Building maps from lists by hand needs loops and containsKey checks. The collectors express it in one step and cope with merging policies.",
    "Use toMap for lookup tables, such as ID to entity, and toSet for uniqueness. Use LinkedHashMap or TreeMap as the supplier when order matters.",
    "Avoid toMap when keys may repeat and you have not planned for it; consider groupingBy instead. Remember that toMap fails on null values and the default map is a HashMap.",
    "Write users.stream().collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new)). Use toUnmodifiableList and toUnmodifiableMap when immutability is wanted.",
    "Pros: concise and flexible. Cons: duplicate key exceptions, null restrictions, and no type guarantees by default.",
    "Alternatives are groupingBy for multi-valued maps, loops, toList() on the stream (Java 16), and Guava's ImmutableMap.toImmutableMap."
  ],
  "groupingBy": [
    "groupingBy classifies elements into a Map by a key function and applies a downstream collector to each group, like SQL GROUP BY. By default it builds a HashMap of Lists.",
    "groupingBy(classifier[, mapFactory], downstream) groups elements by key. Downstream collectors such as counting, summingInt, mapping and averagingDouble compute per-group results.",
    "Manual grouping used maps of lists with computeIfAbsent, which is repetitive and not parallel-friendly. groupingBy gives a declarative, composable alternative.",
    "Use it for reports and aggregations: orders by customer, count by status, total amount per month, and nested groups.",
    "Avoid it when you need only a yes or no split (use partitioningBy) or when the database can do the grouping more efficiently on big data.",
    "Write orders.stream().collect(Collectors.groupingBy(Order::getStatus, TreeMap::new, Collectors.summingDouble(Order::getAmount))). Nest groupingBy for multi-level groups.",
    "Pros: powerful, declarative, composable. Cons: nested collectors become hard to read, the default is an unordered HashMap, and counting returns Long.",
    "Alternatives are loops with computeIfAbsent, partitioningBy for two groups, database GROUP BY, and Collectors.toMap with merge."
  ],
  "partitioningBy": [
    "partitioningBy splits elements into exactly two groups, true and false, using a Predicate. Unlike groupingBy, the map always has both keys, even if one group is empty.",
    "partitioningBy(predicate[, downstream]) returns a Map<Boolean, ...>. The downstream collector can transform each partition, for example by counting.",
    "Splitting a list into matching and non-matching items needed two filter passes or a loop.",
    "Use it for pass or fail splits, valid and invalid records, and processing each group differently.",
    "Do not use it for more than two categories; use groupingBy. Avoid it when you need only one of the groups; filter suffices.",
    "Write Map<Boolean, List<Order>> parts = orders.stream().collect(Collectors.partitioningBy(Order::isPaid)); and use parts.get(true) and parts.get(false).",
    "Pros: single pass, both keys always present. Cons: limited to two groups.",
    "Alternatives are two filter calls, groupingBy with a Boolean classifier, and loops."
  ],
  "joining": [
    "Collectors.joining concatenates CharSequence elements into one String, with an optional delimiter, prefix and suffix. It uses a StringBuilder internally.",
    "joining(), joining(delimiter) and joining(delimiter, prefix, suffix) work on streams of CharSequence, so non-string elements must be mapped with String::valueOf first.",
    "Building a delimited string by hand needs a loop with an if for the last separator and is easy to get wrong.",
    "Use it for CSV lines, log messages, SQL IN lists and display text: ids.stream().map(String::valueOf).collect(Collectors.joining(\",\", \"[\", \"]\")).",
    "Avoid it for building structured formats such as JSON or SQL from user input; use proper libraries and parameters. Do not forget to map non-strings.",
    "Write names.stream().sorted().collect(Collectors.joining(\", \")). For collections that are already strings, String.join is simpler.",
    "Pros: concise and efficient. Cons: only for CharSequence and not suitable for complex formatting.",
    "Alternatives are String.join, StringJoiner, a StringBuilder loop, and Apache Commons StringUtils.join."
  ],
  "summarizing and averaging": [
    "Collectors like summingInt, averagingDouble and summarizingInt aggregate numeric fields, and summarizing returns count, sum, min, average and max in one object. They are best used as downstream collectors inside groupingBy.",
    "summingX returns the total, averagingX returns a Double average (0 for an empty stream), and summarizingX returns an IntSummaryStatistics, LongSummaryStatistics or DoubleSummaryStatistics.",
    "Computing several statistics needed multiple passes over the data or manual accumulators.",
    "Use them for dashboards and reports: average order value per customer, statistics of response times, totals per category.",
    "Avoid summingDouble where exact decimal results matter, since floating point error accumulates; use BigDecimal with reduce. Do not run many separate passes when summarizing gives everything at once.",
    "Write IntSummaryStatistics stats = orders.stream().collect(Collectors.summarizingInt(Order::getQuantity)); stats.getAverage(); or groupingBy(Order::getCity, averagingDouble(Order::getAmount)).",
    "Pros: one pass, many metrics, composable with grouping. Cons: floating point accuracy and boxed results in downstream positions.",
    "Alternatives are IntStream.summaryStatistics, reduce with BigDecimal, and database aggregate queries."
  ],
  "teeing": [
    "teeing, added in Java 12, runs two collectors over the same elements in one pass and merges their results with a function. It computes things such as min and max or sum and count together.",
    "Collectors.teeing(collector1, collector2, merger) feeds each element to both collectors and applies the merger to the two results.",
    "Computing two aggregates used two passes over the stream, which is impossible for single-use streams, or a custom collector class.",
    "Use it for paired results: average and count, min and max, matching and non-matching counts, then combine them into a record or object.",
    "Do not use it when a single standard collector such as summarizingInt already gives all the values. Avoid combining more than two results this way; the nesting gets unreadable.",
    "Write stream.collect(Collectors.teeing(Collectors.counting(), Collectors.summingInt(Item::getQty), (count, sum) -> new Stats(count, sum))).",
    "Pros: single pass, no custom collector. Cons: needs Java 12 or later, and merge logic can be hard to read.",
    "Alternatives are summaryStatistics, a custom Collector, two passes over a collected list, and reduce into a holder object."
  ],

  "IntStream, LongStream and DoubleStream": [
    "Primitive streams work directly on int, long and double values without boxing, and add numeric operations such as sum, average, max and summaryStatistics. They give better performance and cleaner code for numeric work.",
    "IntStream, LongStream and DoubleStream have specialised methods and return primitive-specialised results like OptionalInt. mapToInt, mapToLong and mapToDouble convert from object streams.",
    "A Stream<Integer> allocates wrapper objects and lacks sum and average, forcing reduce calls with boxing overhead.",
    "Use them for numeric aggregation, counters, ranges, and large numerical data: orders.stream().mapToInt(Order::getQty).sum().",
    "Avoid them when you need to hold the values as objects, such as in generic collections. Beware of overflow with int sums; use mapToLong when totals may be large.",
    "Write IntStream.rangeClosed(1, 5).sum(), DoubleStream.of(1.5, 2.5).average().orElse(0), and chars with \"text\".chars(). Convert back with boxed() or mapToObj.",
    "Pros: no boxing, rich numeric API, faster. Cons: limited to three primitive types, plus less composable with generic APIs.",
    "Alternatives are Stream<Integer> with reduce, loops over primitive arrays, and numeric libraries like Eclipse Collections or fastutil."
  ],
  "boxed and mapToObj": [
    "boxed converts a primitive stream into a stream of wrapper objects, and mapToObj maps each primitive to an object. Both bridge IntStream and friends back to the generic Stream API.",
    "IntStream.boxed() returns Stream<Integer>. mapToObj(IntFunction) applies a function and returns Stream<R>, which allows direct conversion in one step.",
    "Many APIs, including collectors and generic collections, work only with objects, so primitive streams must be converted to use them.",
    "Use boxed when you need Integer values for collect or sorted with a comparator, and mapToObj to build strings or objects from numbers.",
    "Avoid boxing in hot paths when a primitive operation exists; sum and max on primitive streams need no boxing. Do not call boxed and then map when mapToObj does it in one step.",
    "Write IntStream.range(0, 5).boxed().toList(), or IntStream.range(0, names.size()).mapToObj(i -> i + \": \" + names.get(i)).toList().",
    "Pros: easy bridge. Cons: allocation of wrapper objects and extra GC.",
    "Alternatives are primitive collections (fastutil), IntStream.toArray, and staying in primitive operations."
  ],
  "range and rangeClosed": [
    "IntStream.range generates a sequence from start up to but excluding end, and rangeClosed includes the end. They are the stream version of a counting for-loop, and exist for LongStream as well.",
    "range(a, b) produces a, a+1, up to b-1. rangeClosed(a, b) includes b. The stream is ordered, sized and splits well for parallel processing.",
    "Index-based loops with mutable counters do not compose with pipelines. A range stream lets you map indices to values in a declarative way.",
    "Use them to generate indices, run something n times, build test data, and process array slices.",
    "Avoid them for simple loops where a for statement is clearer, and mind the off-by-one difference between range and rangeClosed.",
    "Write IntStream.rangeClosed(1, 10).filter(n -> n % 2 == 0).sum(), or IntStream.range(0, list.size()).filter(i -> i % 2 == 0).mapToObj(list::get).toList().",
    "Pros: composable, splittable and fast with primitive operations. Cons: off-by-one confusion and sometimes less readable than a loop.",
    "Alternatives are classic for-loops, Stream.iterate with a predicate, and Collections.nCopies."
  ],

  "parallel streams": [
    "parallelStream or parallel() splits the work across multiple threads using the common ForkJoinPool. It helps CPU-bound work on large, easily split data, and hurts or breaks things with blocking I/O, small data, shared state or non-associative operations.",
    "The stream's source is split into chunks by a Spliterator, each chunk runs through the pipeline on a pool thread, and partial results are combined. Characteristics like ORDERED and SIZED influence cost.",
    "Multi-core machines were idle during sequential processing, and manual threading code is hard to get right. Parallel streams promise easy data parallelism.",
    "Use them for CPU-intensive, stateless operations on large collections with a good splitting source such as ArrayList, arrays and IntStream.range, after measuring a real speedup.",
    "Avoid them for small data, blocking I/O calls, LinkedList or iterate sources, ordered limit and skip, operations with side effects or shared mutable state, and in web servers where the common pool is shared.",
    "Write list.parallelStream().mapToLong(this::expensiveCompute).sum(). Use associative, stateless, non-interfering functions. Benchmark with JMH, and measure against the sequential version before adopting.",
    "Pros: easy to enable, possible big speedups on CPU-bound work. Cons: overhead, hidden shared pool, nondeterministic order of side effects, hard-to-debug races and often no gain.",
    "Alternatives are sequential streams, ExecutorService with a dedicated pool, CompletableFuture for I/O parallelism, virtual threads for blocking calls, and reactive frameworks."
  ],
  "Common ForkJoinPool": [
    "Parallel streams run on ForkJoinPool.commonPool(), a JVM-wide shared pool sized around the number of cores minus one. A slow or blocking task can starve every other parallel stream and CompletableFuture in the application.",
    "The common pool is a static work-stealing pool shared by parallel streams, CompletableFuture async methods without an executor, and other fork-join tasks. Its size can be changed with java.util.concurrent.ForkJoinPool.common.parallelism.",
    "A shared pool avoids creating threads per stream, but it means unrelated parts of an application compete for the same few threads.",
    "It matters on servers and services where several requests may run parallel streams at once, or where a stage blocks on I/O.",
    "Do not run blocking calls such as HTTP or database access inside parallel streams, since they occupy the limited threads. Do not assume a custom pool is officially supported for streams.",
    "A common workaround is to submit the whole pipeline to a dedicated pool, new ForkJoinPool(8).submit(() -> list.parallelStream()...).get(), though this relies on implementation behaviour. Better options for I/O are an ExecutorService or virtual threads.",
    "Pros: no pool management and good CPU utilisation. Cons: shared contention, no direct pool choice, and risk of starvation.",
    "Alternatives are dedicated ExecutorService pools, CompletableFuture with a custom executor, virtual threads for blocking work, and structured concurrency."
  ],
  "forEachOrdered": [
    "forEachOrdered processes elements in encounter order even on a parallel stream, at the cost of reducing parallel benefit. Plain forEach on a parallel stream makes no ordering guarantee.",
    "Like forEach it takes a Consumer, but guarantees that actions happen in the order of the source, one at a time with a happens-before relationship between elements.",
    "Parallel processing is fast but unordered. Sometimes the work can be parallel while the final output, such as printing, must stay in order.",
    "Use it with parallel streams when the final side effect must respect order, such as writing results in sequence.",
    "Avoid it when order does not matter, since it removes the benefit. On sequential streams forEach already preserves order, so forEachOrdered adds nothing.",
    "Write list.parallelStream().map(this::transform).forEachOrdered(System.out::println). The map runs in parallel, while printing happens in order.",
    "Pros: deterministic output on parallel streams. Cons: reduces parallelism and adds waiting.",
    "Alternatives are collecting to a list then iterating, sequential streams, and sorting results by index before output."
  ]
};

// Worked examples for the intermediate and terminal operations, shown as a ninth section.
const STREAM_EXAMPLES = {
  "filter": `record User(String name, int age, boolean active) {}

List<User> users = List.of(
    new User("Asha", 34, true),
    new User("Ben", 17, true),
    new User("Chen", 41, false));

List<String> adults = users.stream()
    .filter(User::active)
    .filter(u -> u.age() >= 18)
    .map(User::name)
    .toList();
// [Asha]`,

  "map": `List<String> names = List.of("asha", "ben", "chen");

List<String> upper = names.stream()
    .map(String::toUpperCase)
    .toList();
// [ASHA, BEN, CHEN]

// primitive variant avoids boxing
int totalLength = names.stream()
    .mapToInt(String::length)
    .sum();
// 12`,

  "flatMap": `List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3), List.of(4, 5));

List<Integer> flat = nested.stream()
    .flatMap(List::stream)
    .toList();
// [1, 2, 3, 4, 5]

// split sentences into distinct words
List<String> words = Stream.of("to be or", "not to be")
    .flatMap(s -> Arrays.stream(s.split(" ")))
    .distinct()
    .toList();
// [to, be, or, not]`,

  "peek": `List<Integer> result = Stream.of(1, 2, 3, 4)
    .peek(n -> System.out.println("before filter: " + n))
    .filter(n -> n % 2 == 0)
    .peek(n -> System.out.println("after filter: " + n))
    .toList();
// elements pass one at a time:
// before filter: 1, before filter: 2, after filter: 2, before filter: 3, ...
// result = [2, 4]`,

  "distinct": `List<Integer> ids = List.of(3, 1, 3, 2, 1);

List<Integer> unique = ids.stream()
    .distinct()
    .toList();
// [3, 1, 2]  (first occurrence kept, order preserved)

// distinct by a field: keep the first user per email
Collection<User> byEmail = users.stream()
    .collect(Collectors.toMap(User::email, u -> u, (a, b) -> a, LinkedHashMap::new))
    .values();`,

  "sorted": `record Person(String first, String last, int age) {}

List<Person> sorted = people.stream()
    .sorted(Comparator.comparing(Person::last)
        .thenComparing(Person::first)
        .thenComparing(Person::age, Comparator.reverseOrder()))
    .toList();

// natural order
List<Integer> asc = Stream.of(5, 2, 9).sorted().toList();   // [2, 5, 9]`,

  "limit and skip": `// top 3 scores
List<Integer> top3 = scores.stream()
    .sorted(Comparator.reverseOrder())
    .limit(3)
    .toList();

// page 2 with page size 10 (zero-based page index 1)
int page = 1, size = 10;
List<Item> pageItems = items.stream()
    .skip((long) page * size)
    .limit(size)
    .toList();

// bound an infinite stream
Stream.iterate(1, n -> n + 1).limit(5).toList();   // [1, 2, 3, 4, 5]`,

  "takeWhile and dropWhile": `List<Integer> sortedData = List.of(1, 3, 5, 8, 10, 11);

List<Integer> head = sortedData.stream()
    .takeWhile(n -> n < 8)
    .toList();
// [1, 3, 5]

List<Integer> tail = sortedData.stream()
    .dropWhile(n -> n < 8)
    .toList();
// [8, 10, 11]  (11 is kept because the drop stopped at 8)`,

  "forEach": `orders.stream()
    .filter(Order::isPaid)
    .forEach(o -> System.out.println("Receipt for " + o.id()));

// Anti-pattern: do not accumulate results this way
List<String> out = new ArrayList<>();
names.stream().forEach(out::add);   // unsafe if the stream becomes parallel
// Better:
List<String> better = names.stream().toList();`,

  "collect": `// standard collectors
Map<String, Long> countByStatus = orders.stream()
    .collect(Collectors.groupingBy(Order::status, Collectors.counting()));

String csv = names.stream().collect(Collectors.joining(","));

// choose the exact collection type
Set<String> sortedSet = names.stream()
    .collect(Collectors.toCollection(TreeSet::new));

// three-argument form: supplier, accumulator, combiner
StringBuilder sb = names.stream()
    .collect(StringBuilder::new, StringBuilder::append, StringBuilder::append);`,

  "reduce": `int sum = Stream.of(1, 2, 3, 4).reduce(0, Integer::sum);        // 10

Optional<Integer> max = Stream.of(3, 9, 4).reduce(Integer::max);   // Optional[9]

BigDecimal total = orders.stream()
    .map(Order::amount)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

// three-argument form when the result type differs from the element type
int totalChars = Stream.of("ab", "cde")
    .reduce(0, (acc, s) -> acc + s.length(), Integer::sum);   // 5`,

  "count": `long late = orders.stream()
    .filter(Order::isLate)
    .count();

// Java 9+: the pipeline may be skipped when the size is known,
// so this peek prints nothing:
long n = List.of(1, 2, 3).stream()
    .peek(System.out::println)
    .count();   // 3`,

  "min and max": `Optional<Person> youngest = people.stream()
    .min(Comparator.comparingInt(Person::age));

Person oldest = people.stream()
    .max(Comparator.comparingInt(Person::age))
    .orElseThrow();

// primitive stream: no comparator needed
int highest = IntStream.of(4, 8, 2).max().getAsInt();   // 8`,

  "anyMatch, allMatch and noneMatch": `boolean hasAdmin = users.stream().anyMatch(User::isAdmin);
boolean allAdults = users.stream().allMatch(u -> u.age() >= 18);
boolean noneNegative = prices.stream().noneMatch(p -> p < 0);

// empty-stream behaviour
Stream.<Integer>empty().anyMatch(n -> n > 0);    // false
Stream.<Integer>empty().allMatch(n -> n > 0);    // true
Stream.<Integer>empty().noneMatch(n -> n > 0);   // true`,

  "findFirst and findAny": `User user = users.stream()
    .filter(u -> u.email().equals(email))
    .findFirst()
    .orElseThrow(() -> new NoSuchElementException("No user " + email));

// any match is fine, cheaper on parallel streams
Optional<Task> anyFailed = tasks.parallelStream()
    .filter(Task::hasFailed)
    .findAny();`,

  "toList": `List<String> names = users.stream()
    .map(User::name)
    .toList();            // Java 16+, unmodifiable

names.add("x");           // throws UnsupportedOperationException

// need a mutable list instead
List<String> mutable = users.stream()
    .map(User::name)
    .collect(Collectors.toCollection(ArrayList::new));`,

  "toArray": `String[] names = users.stream()
    .map(User::name)
    .toArray(String[]::new);

int[] squares = IntStream.rangeClosed(1, 5)
    .map(i -> i * i)
    .toArray();
// [1, 4, 9, 16, 25]

Object[] raw = Stream.of("a", "b").toArray();   // untyped Object[]`
};

Object.entries(STREAM_EXAMPLES).forEach(([name, example]) => SERVICE_ANSWERS[name].push(example));
