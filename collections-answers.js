// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "ArrayList": [
    "ArrayList is a resizable array: O(1) indexed access, amortised O(1) append, and O(n) insertion or removal in the middle. It is the default List unless you have a specific reason to choose something else.",
    "It wraps an Object[] with a size field. The array is allocated lazily with a default capacity of 10 on the first add, and when full it grows by about 1.5x (oldCapacity + oldCapacity / 2) using Arrays.copyOf. It allows nulls and duplicates and implements RandomAccess.",
    "Programs need an ordered, index-addressable sequence that grows dynamically. Contiguous storage gives excellent cache locality, which is why it beats LinkedList for nearly all workloads.",
    "Use it for general-purpose lists, read-heavy access by index, appending then iterating, and sorting with Collections.sort or List.sort. Pre-size with new ArrayList<>(n) or ensureCapacity when you know the size.",
    "Avoid it for frequent inserts or removals at the head (use ArrayDeque), for concurrent modification without external synchronisation, and where you need stable memory after shrinking (call trimToSize). Modifying it during a for-each loop throws ConcurrentModificationException.",
    "add(e) appends, add(i, e) and remove(i) shift elements with System.arraycopy, contains and indexOf are O(n), and the iterator is fail-fast through modCount. Remember remove(int) versus remove(Object) for List<Integer>, and that subList returns a view backed by the parent list.",
    "Pros: fast reads, compact memory, cache friendly, simple. Cons: O(n) middle edits, occasional O(n) copy on growth, not thread-safe, and capacity never shrinks automatically.",
    "Alternatives are LinkedList (rarely better), ArrayDeque for queues and stacks, CopyOnWriteArrayList for read-mostly concurrent use, List.of for immutable lists, and Collections.synchronizedList for simple locking.",
    `List<String> names = new ArrayList<>(1000);        // pre-size to avoid regrowth
names.add("Ada");
names.add(0, "Linus");                              // O(n): shifts everything right
String first = names.getFirst();                    // Java 21 SequencedCollection

List<Integer> nums = new ArrayList<>(List.of(10, 20, 30));
nums.remove(1);                                     // removes index 1 (value 20)
nums.remove(Integer.valueOf(30));                   // removes the value 30

nums.removeIf(n -> n > 5);                          // single pass, safer than looping

for (String n : names) {
    if (n.startsWith("A")) {
        // names.remove(n);   // would throw ConcurrentModificationException
    }
}`
  ],
  "LinkedList": [
    "LinkedList is a doubly linked list that implements both List and Deque. It has O(1) add and remove at the ends but O(n) get by index, and with its per-node overhead and poor cache locality it is rarely the best choice in modern Java.",
    "Each element lives in a Node with item, next and prev references, and the list keeps first and last pointers. get(i) walks from the nearer end, it allows nulls, and its iterator supports O(1) add and remove at the current position.",
    "It was designed so insertions and removals do not shift elements. In practice, node allocation, pointer chasing and garbage collection overhead usually cost more than the array copies of ArrayList.",
    "Use it when you need a List and a Deque in one object, or when you do many structural changes through a ListIterator at the current position of a very large list. Even then, measure first.",
    "Avoid it for index-based access (get(i) in a loop is O(n squared)), as a general List, as a stack or queue (ArrayDeque is faster and smaller), and when memory matters, since each node costs roughly 24 bytes of overhead beyond the element.",
    "Use addFirst, addLast, pollFirst, removeLast and peek for deque behaviour, and iterate with an Iterator or ListIterator and remove or add through it. Do not call get(i) or indexOf in loops.",
    "Pros: O(1) ends, O(1) removal via iterator, no resizing. Cons: O(n) random access, high memory overhead, bad cache behaviour, extra GC pressure.",
    "Alternatives are ArrayList for lists, ArrayDeque for queues and stacks, and a LinkedHashMap or a custom structure when you need O(1) removal by key with order.",
    `LinkedList<String> list = new LinkedList<>(List.of("a", "b", "c", "d"));

// Good: O(1) removal while iterating, no shifting
for (Iterator<String> it = list.iterator(); it.hasNext(); ) {
    if (it.next().equals("b")) it.remove();
}

// Bad: get(i) is O(n) per call, so this loop is O(n squared)
for (int i = 0; i < list.size(); i++) {
    System.out.println(list.get(i));
}

// If you only need queue or stack behaviour, prefer ArrayDeque
Deque<String> stack = new ArrayDeque<>();
stack.push("x");
String top = stack.pop();`
  ],
  "CopyOnWriteArrayList": [
    "CopyOnWriteArrayList is a thread-safe list where every mutation copies the underlying array, so reads and iteration are lock-free and never throw ConcurrentModificationException. It suits small, read-mostly lists such as listener registries.",
    "It keeps a volatile Object[] and replaces it with a fresh copy on each add, set or remove under a lock. Iterators capture the array at creation time and give a stable snapshot, and they do not support remove.",
    "Plain ArrayList fails under concurrent modification and synchronizedList forces readers to lock and still throws during iteration. Copy-on-write trades expensive writes for safe, cheap reads.",
    "Use it for observer or listener lists, configuration lists read constantly and changed rarely, and cases where iterating while other threads modify must be safe. Also available as CopyOnWriteArraySet.",
    "Do not use it for write-heavy or large lists, since each write is O(n) in time and allocation, and not where readers need to see the latest changes mid-iteration because they see a snapshot.",
    "Create it, use add, addIfAbsent, remove and iteration as normal, and use addAllAbsent or replaceAll for bulk changes to avoid multiple copies. Batch writes into a single call where possible.",
    "Pros: lock-free reads, safe iteration, simple. Cons: O(n) writes, memory churn and GC pressure, snapshot semantics, and iterator.remove throws UnsupportedOperationException.",
    "Alternatives are Collections.synchronizedList (locks on every access), ConcurrentLinkedQueue or ConcurrentLinkedDeque for queues, ConcurrentHashMap with key set for sets, and immutable lists swapped through a volatile or AtomicReference.",
    `CopyOnWriteArrayList<Runnable> listeners = new CopyOnWriteArrayList<>();
listeners.add(() -> System.out.println("first"));

// Safe even if another thread adds or removes listeners during the loop
for (Runnable l : listeners) {
    l.run();                       // iterates over a snapshot
}

listeners.addIfAbsent(myListener); // atomic check-then-add

// iterator.remove() is not supported:
// listeners.iterator().remove();  // UnsupportedOperationException`
  ],
  "Vector": [
    "Vector is a legacy, fully synchronised dynamic array from Java 1.0. It is functionally an ArrayList with a lock on every method, and it is almost never the right choice today.",
    "It stores elements in an Object[] and by default doubles its capacity when full (or adds capacityIncrement if set). Every public method is synchronized, it exposes legacy methods such as elementAt and Enumeration, and it allows nulls.",
    "It predates the Collections Framework and was retrofitted to implement List. Per-method locking looked like an easy way to get thread safety.",
    "You meet it in old code and APIs such as Stack, Hashtable-era code, and some Swing models. You can still use it when an old API requires one.",
    "Avoid it in new code: method-level synchronisation does not make compound operations atomic (check-then-act), it adds uncontended lock overhead, and iterators remain fail-fast so concurrent modification still throws ConcurrentModificationException.",
    "When maintaining legacy code, replace it with ArrayList if single-threaded, or with CopyOnWriteArrayList or a properly locked list when shared. If you must keep it, wrap compound actions in synchronized (vector) blocks.",
    "Pros: simple thread-safe individual operations. Cons: slower than ArrayList, false sense of safety, doubles memory growth, legacy API.",
    "Alternatives are ArrayList, CopyOnWriteArrayList, Collections.synchronizedList, and explicit locks around an ArrayList.",
    `Vector<Integer> v = new Vector<>();
v.add(1);

// Each call is synchronised, but this compound action is NOT atomic:
if (!v.contains(2)) {
    v.add(2);                       // another thread may add 2 in between
}

// Correct: hold the Vector's monitor for the whole check-then-act
synchronized (v) {
    if (!v.contains(2)) v.add(2);
}

// Modern replacement for a read-mostly shared list
List<Integer> safe = new CopyOnWriteArrayList<>();`
  ],
  "Stack": [
    "java.util.Stack is a legacy LIFO class that extends Vector. Use ArrayDeque as a stack instead, because Stack is synchronised, exposes index-based Vector methods that break the stack abstraction, and is slower.",
    "It adds push, pop, peek, empty and search to Vector. It is backed by Vector's array, pop and peek throw EmptyStackException when empty, and the top of the stack is the end of the list.",
    "It was the original stack in Java 1.0, before the Deque interface existed in Java 6.",
    "You will see it in older code and interview questions about LIFO. Use it only when an existing API requires it.",
    "Do not use it for new code, since you can call add(0, x) or get(i) on it and it pays for synchronisation even when single-threaded. Stack also iterates from bottom to top, while Deque push-based iteration goes from top to bottom.",
    "Use Deque<Integer> stack = new ArrayDeque<>() with push, pop and peek (pop throws NoSuchElementException on empty, poll and peekFirst return null). For a thread-safe version use ConcurrentLinkedDeque or a LinkedBlockingDeque.",
    "Pros: familiar API. Cons: synchronised overhead, leaky abstraction, legacy design, different exception type than Deque.",
    "Alternatives are ArrayDeque (default), LinkedList (rarely), ConcurrentLinkedDeque and LinkedBlockingDeque for concurrent use.",
    `Stack<Integer> old = new Stack<>();
old.push(1); old.push(2);
old.add(0, 99);                       // allowed, but violates the LIFO abstraction
System.out.println(old);              // [99, 1, 2] bottom to top

Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); stack.push(2);
System.out.println(stack.peek());     // 2
System.out.println(stack);            // [2, 1] top first
int top = stack.pop();                // 2
Integer none = new ArrayDeque<Integer>().poll();   // null instead of an exception`
  ],
  "HashSet": [
    "HashSet stores unique elements using a HashMap internally, giving O(1) average add, remove and contains with no ordering guarantee. Elements must have consistent equals and hashCode.",
    "It is a HashMap whose keys are the elements and whose values are a shared dummy object. It allows one null, has a default capacity of 16 and load factor of 0.75, resizes by doubling, and its iterator is fail-fast.",
    "A fast membership test and duplicate elimination are needed constantly, and hashing delivers constant time on average without keeping order.",
    "Use it for deduplication, membership checks, visited sets in graph algorithms, and set algebra with retainAll, addAll and removeAll.",
    "Avoid it when you need ordering (LinkedHashSet or TreeSet), when elements are mutable in a way that changes hashCode while in the set, or when iteration order must be stable across runs. Do not use it concurrently without synchronisation.",
    "add returns false if the element already exists, so use its result to detect duplicates. Pre-size with HashSet.newHashSet(n) (Java 19) to avoid the capacity arithmetic mistake, and make element classes override equals and hashCode together.",
    "Pros: fast, simple, memory lighter than a map. Cons: unordered, performance depends on hashCode quality, mutated elements get lost, and each element costs a map entry.",
    "Alternatives are LinkedHashSet (insertion order), TreeSet (sorted), EnumSet for enums, BitSet for dense ints, ConcurrentHashMap.newKeySet() for concurrency, and Set.of for immutable sets.",
    `Set<String> seen = new HashSet<>();
for (String word : words) {
    if (!seen.add(word)) {                 // add returns false for duplicates
        System.out.println("duplicate: " + word);
    }
}

Set<Integer> a = new HashSet<>(List.of(1, 2, 3));
Set<Integer> b = Set.of(2, 3, 4);
a.retainAll(b);                            // intersection -> [2, 3]

// pitfall: mutating a key after insertion breaks lookups
record Point(int x, int y) {}              // records are safe: components are final
Set<Point> points = HashSet.newHashSet(100);`
  ],
  "LinkedHashSet": [
    "LinkedHashSet is a HashSet that also keeps a doubly linked list through its entries, so iteration follows insertion order while add, remove and contains stay O(1). Re-inserting an existing element does not change its position.",
    "It extends HashSet and is backed by a LinkedHashMap. It allows one null and costs extra memory for the before and after pointers on each entry. In Java 21 it implements SequencedSet, giving getFirst, getLast, reversed, addFirst and addLast.",
    "HashSet gives no predictable iteration order, which makes output, tests and APIs non-deterministic. LinkedHashSet gives predictable order without the O(log n) cost of a sorted set.",
    "Use it to deduplicate while preserving order, for stable output and reproducible tests, and when the order of first occurrence matters, such as the distinct words of a document in order.",
    "Avoid it when order does not matter (HashSet is lighter) or when you need sorted order (TreeSet). Unlike LinkedHashMap, it has no access-order mode, so it cannot be an LRU structure directly.",
    "Create it from a list to deduplicate: new LinkedHashSet<>(list). Use Java 21 methods such as getFirst, getLast and reversed for the ends, and addFirst or addLast to reposition an existing element.",
    "Pros: predictable order, O(1) operations. Cons: more memory than HashSet, slightly slower iteration setup, and insertion order only.",
    "Alternatives are HashSet, TreeSet, a List plus a Set for index access, and Stream.distinct, which also keeps encounter order.",
    `List<String> raw = List.of("b", "a", "b", "c", "a");
Set<String> unique = new LinkedHashSet<>(raw);
System.out.println(unique);                   // [b, a, c]

unique.add("b");                              // already present, order unchanged
String last = unique.getLast();               // "c" (Java 21)
SequencedSet<String> backwards = unique.reversed();
System.out.println(backwards);                // [c, a, b]

List<String> same = raw.stream().distinct().toList();   // [b, a, c]`
  ],
  "TreeSet": [
    "TreeSet keeps elements sorted using a red-black tree and offers O(log n) add, remove and contains plus navigation methods such as floor, ceiling, higher, lower and subSet. Ordering comes from Comparable or a Comparator and defines equality for the set.",
    "It is a NavigableSet backed by a TreeMap. Nulls are rejected with natural ordering, the iterator returns elements in ascending order, and headSet, tailSet, subSet and descendingSet are live views of the same tree.",
    "Many problems need sorted data or range queries on a changing set, which a HashSet cannot do and re-sorting a list does inefficiently.",
    "Use it for sorted unique values, leaderboards, finding the nearest value to a target, range counting, and scheduling windows where you need first, last, floor and ceiling.",
    "Avoid it when you only need membership tests (HashSet is faster) or when the comparator is inconsistent with equals in a way that matters, since the comparator alone decides duplicates. Elements that are not Comparable throw ClassCastException.",
    "Pass a Comparator such as Comparator.comparing(Person::name).thenComparing(Person::id) so distinct objects do not compare as equal. Use pollFirst and pollLast to consume, and the navigation methods to avoid scanning.",
    "Pros: always sorted, range operations, O(log n) bounded worst case. Cons: slower than hashing, more memory per element, comparator mistakes silently drop elements, and not thread-safe.",
    "Alternatives are HashSet plus sorting when needed, ConcurrentSkipListSet for concurrent sorted sets, PriorityQueue when you only need the smallest element, and a sorted ArrayList with binary search for read-mostly data.",
    `TreeSet<Integer> scores = new TreeSet<>(List.of(10, 40, 70, 90));
System.out.println(scores.first());          // 10
System.out.println(scores.floor(50));        // 40  (greatest <= 50)
System.out.println(scores.ceiling(50));      // 70  (smallest >= 50)
System.out.println(scores.headSet(70));      // [10, 40]  live view, exclusive
System.out.println(scores.subSet(40, true, 90, true));  // [40, 70, 90]

// pitfall: comparator decides equality
TreeSet<String> byLength = new TreeSet<>(Comparator.comparingInt(String::length));
byLength.add("cat");
byLength.add("dog");                         // "dog" has length 3 too, so it is dropped
System.out.println(byLength.size());         // 1`
  ],
  "EnumSet": [
    "EnumSet is a specialised, very fast Set for enum constants, stored as a bit vector. It iterates in ordinal order and is the standard replacement for int bit flags.",
    "It is abstract with two implementations: RegularEnumSet, which uses a single long for enums with up to 64 constants, and JumboEnumSet, which uses a long array. It is created through factories such as noneOf, allOf, of, range, copyOf and complementOf, and nulls are not permitted.",
    "Sets of flags and options used to be bit masks with manual shifting. EnumSet gives the same compactness and speed with type safety and readability.",
    "Use it for permissions, options, day-of-week sets, feature flags and state machines, wherever the elements come from a single enum type.",
    "Avoid it for non-enum elements and where you need thread safety, since it is not synchronised. Do not rely on it for constants added later without recompiling assumptions, though ordinal order follows declaration order.",
    "Create it with EnumSet.of(A, B), allOf(Type.class), noneOf(Type.class), range(A, C) or complementOf(set). Use contains, containsAll, retainAll and addAll, which compile to bit operations.",
    "Pros: O(1) operations, tiny memory, type safe, ordered. Cons: only for one enum type, not thread-safe, weakly consistent iterators.",
    "Alternatives are HashSet of enums (slower, larger), int bit masks, BitSet, and EnumMap when a value per constant is needed.",
    `enum Permission { READ, WRITE, DELETE, ADMIN }

EnumSet<Permission> user = EnumSet.of(Permission.READ, Permission.WRITE);
EnumSet<Permission> all = EnumSet.allOf(Permission.class);
EnumSet<Permission> missing = EnumSet.complementOf(user);   // [DELETE, ADMIN]

boolean canWrite = user.contains(Permission.WRITE);          // bit test
EnumSet<Permission> mid = EnumSet.range(Permission.WRITE, Permission.DELETE);

System.out.println(missing);        // iteration follows declaration order`
  ],
  "ArrayDeque": [
    "ArrayDeque is a resizable circular array that implements Deque. It is the default choice for both stacks and queues, with O(1) operations at both ends, and it is faster and leaner than LinkedList and Stack. It forbids null elements.",
    "It stores elements in an Object[] with head and tail indices that wrap around, so no shifting is needed at either end. It grows when full (roughly doubling for small arrays and 1.5x for larger ones), it is not thread-safe, and its iterator is fail-fast.",
    "A queue or stack needs cheap insertion and removal at the ends. A circular array gives this with contiguous memory and no per-element node objects.",
    "Use it for BFS queues, DFS stacks, sliding window algorithms with monotonic deques, undo stacks, and task queues in a single thread.",
    "Avoid it when you need nulls (it throws NullPointerException; null is used as the empty signal for poll and peek), index access (no get(i)), concurrent access (use ConcurrentLinkedDeque or a BlockingDeque), or priority order (PriorityQueue).",
    "Use offer, poll and peek for queues and push, pop and peek for stacks, and prefer the null-returning methods (poll, peekFirst) when emptiness is normal. remove(Object) and contains are O(n).",
    "Pros: O(1) amortised ends, cache friendly, small memory. Cons: no nulls, no indexed access, middle removal is O(n), not thread-safe.",
    "Alternatives are LinkedList (more memory, allows nulls), Stack (legacy), PriorityQueue, ArrayBlockingQueue and LinkedBlockingQueue for producer-consumer, and ConcurrentLinkedDeque.",
    `// BFS using ArrayDeque as a FIFO queue
Deque<Node> queue = new ArrayDeque<>();
Set<Node> visited = new HashSet<>();
queue.offer(start);
visited.add(start);
while (!queue.isEmpty()) {
    Node n = queue.poll();                 // head, null if empty
    for (Node next : n.neighbours()) {
        if (visited.add(next)) queue.offer(next);
    }
}

// Stack usage: the head is the top
Deque<Character> stack = new ArrayDeque<>();
stack.push('(');
char top = stack.pop();`
  ],
  "PriorityQueue": [
    "PriorityQueue is an unbounded binary min-heap: peek is O(1), offer and poll are O(log n), and remove(Object) and contains are O(n). Iteration order is not sorted, and tie order between equal priorities is not stable.",
    "It stores elements in an Object[] organised as a binary heap with siftUp and siftDown, ordered by Comparable or a Comparator, so the head is the smallest element. It rejects nulls, throws ClassCastException for non-comparable elements, and building from a collection heapifies in O(n).",
    "Many algorithms repeatedly need the smallest or largest item from a changing set. A heap does that more cheaply than re-sorting or maintaining a fully sorted structure.",
    "Use it for scheduling, Dijkstra and A*, top-K problems (keep a min-heap of size K), merging sorted streams, and event simulation.",
    "Avoid it when you need sorted iteration (poll repeatedly or sort instead), concurrent use without locking (use PriorityBlockingQueue), a fixed order for equal priorities, or priority updates of existing elements, which require remove and re-add in O(n).",
    "Pass Comparator.reverseOrder() for a max-heap, include a sequence number in the comparator for FIFO among equals, and do not mutate the fields that decide ordering while an element is inside. Use poll in a loop to drain in order.",
    "Pros: efficient top element access, simple API, O(n) heapify. Cons: no sorted iteration, O(n) arbitrary removal, not thread-safe, not stable.",
    "Alternatives are TreeSet or TreeMap (sorted and navigable, O(log n) removal, no duplicates in a set), sorting a list once, PriorityBlockingQueue, DelayQueue, and indexed heaps from libraries when priorities change often.",
    `// top 3 largest numbers using a min-heap of size 3
PriorityQueue<Integer> heap = new PriorityQueue<>();
for (int n : numbers) {
    heap.offer(n);
    if (heap.size() > 3) heap.poll();      // drop the smallest
}
System.out.println(heap);                  // contains the top 3, not in sorted order

PriorityQueue<Task> tasks = new PriorityQueue<>(
        Comparator.comparingInt(Task::priority).thenComparingLong(Task::sequence));
tasks.offer(new Task(2, 1L, "b"));
tasks.offer(new Task(1, 2L, "a"));
Task next = tasks.poll();                  // lowest priority number first

PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());`
  ],
  "Queue and Deque Interfaces": [
    "Queue models a collection that holds elements before processing (usually FIFO) and Deque is a double-ended queue that also works as a stack. Each operation comes in two flavours: one that throws on failure and one that returns a special value.",
    "Queue offers add or remove or element (throw an exception) and offer or poll or peek (return false or null). Deque adds addFirst, addLast, offerFirst, pollLast and so on, plus push and pop for stack use. BlockingQueue, TransferQueue and BlockingDeque add waiting and timeouts for producer-consumer use.",
    "Different algorithms need different access patterns: FIFO tasks, LIFO backtracking, priority ordering, and hand-off between threads. A common interface lets implementations vary.",
    "Use ArrayDeque for single-threaded queues and stacks, PriorityQueue for priority order, LinkedBlockingQueue or ArrayBlockingQueue for bounded or unbounded producer-consumer, ConcurrentLinkedQueue for lock-free non-blocking queues, and DelayQueue or SynchronousQueue for special cases.",
    "Avoid using LinkedList as a queue by default, using exceptions-based methods when emptiness is normal, unbounded queues in front of slow consumers (memory risk), and non-thread-safe queues across threads.",
    "Choose the null-returning methods (offer, poll, peek) for normal control flow and the throwing ones to assert invariants. For concurrent use choose bounded blocking queues for backpressure and use put and take, or offer and poll with timeouts.",
    "Pros: clear, consistent contract, many implementations. Cons: easy to mix up the two method families, null handling differs by implementation, and the full set of concurrent queue variants is large.",
    "Alternatives are List for index access, Stack (legacy), Flow or reactive libraries for asynchronous backpressure, and message brokers such as Kafka or RabbitMQ across processes.",
    `Queue<String> q = new ArrayDeque<>();
q.offer("a");
String head = q.poll();               // "a"
String none = q.poll();               // null: empty, no exception
// q.remove();                        // would throw NoSuchElementException

Deque<Integer> d = new ArrayDeque<>();
d.addFirst(1);
d.addLast(2);
d.pollFirst();                        // 1
d.push(9);                            // same as addFirst
d.pop();                              // same as removeFirst

BlockingQueue<Job> jobs = new ArrayBlockingQueue<>(100);   // bounded, gives backpressure
jobs.put(job);                        // blocks when full
Job j = jobs.take();                  // blocks when empty`
  ],
  "HashMap": [
    "HashMap is the default Map: a hash table with O(1) average get, put and remove, no ordering, one null key and any number of null values. Keys need correct equals and hashCode, and it is not thread-safe.",
    "It holds a Node[] table whose length is a power of two (16 by default) with a load factor of 0.75. Collisions are chained in a bucket, and since Java 8 a bucket with 8 or more nodes in a table of at least 64 slots becomes a red-black tree. It doubles on resize when size exceeds capacity times load factor.",
    "Applications constantly look things up by key. Hashing gives constant time on average regardless of size, without requiring keys to be comparable.",
    "Use it for lookup tables, caches without eviction needs, counting and grouping (merge, computeIfAbsent), and indexing objects by id.",
    "Avoid it when you need ordering (LinkedHashMap, TreeMap), concurrent updates (ConcurrentHashMap), mutable keys whose hashCode changes, or keys with poor hash distribution. Concurrent unsynchronised use can lose entries or corrupt the table.",
    "Use getOrDefault, putIfAbsent, computeIfAbsent, merge and compute for atomic-style update patterns in single-threaded code. Pre-size with HashMap.newHashMap(n) (Java 19), use immutable keys such as String, records or enums, and never modify a map while iterating except through the iterator.",
    "Pros: fast, flexible, standard. Cons: no order, resize cost, depends on hashCode quality, memory per entry, not thread-safe, and iteration visits capacity plus size.",
    "Alternatives are LinkedHashMap, TreeMap, ConcurrentHashMap, EnumMap for enum keys, IdentityHashMap for reference identity, and Map.of for small immutable maps.",
    `Map<String, Integer> counts = new HashMap<>();
for (String w : words) {
    counts.merge(w, 1, Integer::sum);                  // count occurrences
}

Map<String, List<String>> groups = new HashMap<>();
groups.computeIfAbsent("fruit", k -> new ArrayList<>()).add("apple");

int n = counts.getOrDefault("missing", 0);
counts.put(null, 1);                                   // allowed: one null key
counts.putIfAbsent("a", 5);

Map<String, Integer> sized = HashMap.newHashMap(500);  // Java 19: avoids resizes

for (Map.Entry<String, Integer> e : counts.entrySet()) {
    System.out.println(e.getKey() + "=" + e.getValue());
}`
  ],
  "LinkedHashMap": [
    "LinkedHashMap is a HashMap plus a doubly linked list through its entries, so iteration follows insertion order, or access order if you choose it. Override removeEldestEntry to build a simple LRU cache.",
    "Each entry has before and after links on top of the hash table node. By default order is insertion order and re-putting an existing key does not move it; with accessOrder = true, get and put move the entry to the end. In Java 21 it implements SequencedMap with firstEntry, lastEntry, putFirst, putLast, reversed and pollFirstEntry.",
    "HashMap iteration order is unpredictable, which makes serialisation, output and tests unstable. A linked list through the entries fixes that at O(1) cost.",
    "Use it for deterministic iteration (JSON-like output, configuration), preserving the order of parsing, and for LRU caches of modest size in a single thread or behind a lock.",
    "Avoid it when order does not matter (more memory than HashMap), for concurrent access (not thread-safe, and even get mutates in access-order mode), and for production caches needing size by weight, expiry or statistics (use Caffeine).",
    "For an LRU cache, call super(capacity, 0.75f, true) and override removeEldestEntry to return size() > capacity. Wrap with Collections.synchronizedMap for thread safety. Use Java 21 reversed, firstEntry and lastEntry for ends.",
    "Pros: predictable order, O(1) operations, simple LRU. Cons: more memory per entry, access order makes reads structural modifications that can break iteration, no concurrency support.",
    "Alternatives are HashMap, TreeMap for sorted order, Caffeine or Guava Cache for real caching, and ConcurrentSkipListMap for concurrent ordered maps.",
    `class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LruCache(int capacity) {
        super(16, 0.75f, true);            // true = access order
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;          // evict least recently used
    }
}

LruCache<String, String> cache = new LruCache<>(2);
cache.put("a", "1"); cache.put("b", "2");
cache.get("a");                            // a becomes most recent
cache.put("c", "3");                       // evicts b
System.out.println(cache.keySet());        // [a, c]`
  ],
  "TreeMap": [
    "TreeMap is a sorted map backed by a red-black tree, giving O(log n) get, put and remove and navigation methods like floorKey, ceilingKey, headMap, tailMap and subMap. Ordering comes from the keys' Comparable or a Comparator, which also defines key equality.",
    "Each Entry node stores key, value, left, right, parent and a colour bit, and the tree is rebalanced with rotations and recolouring after inserts and deletes. Natural ordering rejects null keys with NullPointerException, values may be null, and iteration is in ascending key order. Range views are live.",
    "Some problems need sorted keys, range queries and nearest-key lookup on mutable data. A hash map cannot do these, and re-sorting after every change is too slow.",
    "Use it for sorted reports, range lookups (price bands, time windows), floor and ceiling queries, interval and schedule maps, and ordered iteration with first and last entry access.",
    "Avoid it for plain key lookup (HashMap is faster), for keys with a comparator inconsistent with equals when you rely on equals semantics, and for concurrent access without external locking (use ConcurrentSkipListMap).",
    "Pass a Comparator for custom order, use floorEntry or ceilingEntry for nearest lookups, headMap, tailMap and subMap for ranges (live views), descendingMap for reverse order, and pollFirstEntry to consume in order.",
    "Pros: always sorted, rich navigation, worst-case O(log n). Cons: slower than HashMap, more memory per entry, comparator bugs make keys vanish or collide, not thread-safe.",
    "Alternatives are HashMap with sorting at read time, LinkedHashMap for insertion order, ConcurrentSkipListMap for concurrent sorted maps, and a sorted array with binary search for static data.",
    `TreeMap<Integer, String> grades = new TreeMap<>();
grades.put(0, "F");
grades.put(60, "D");
grades.put(70, "C");
grades.put(80, "B");
grades.put(90, "A");

int score = 83;
String grade = grades.floorEntry(score).getValue();   // "B" (greatest key <= 83)

System.out.println(grades.headMap(70));               // {0=F, 60=D}  live view
System.out.println(grades.subMap(60, true, 80, false)); // {60=D, 70=C}
System.out.println(grades.firstKey() + " " + grades.lastKey());

TreeMap<String, Integer> ci = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
ci.put("Apple", 1);
ci.put("apple", 2);                                   // same key under this comparator
System.out.println(ci.size());                        // 1`
  ],
  "ConcurrentHashMap": [
    "ConcurrentHashMap is the standard thread-safe hash map: reads are lock-free, writes lock only the affected bucket or use CAS, and compound operations such as compute and merge are atomic. It rejects null keys and null values, and its iterators are weakly consistent.",
    "Since Java 8 there are no segments: a Node[] table is updated by CAS when the bucket is empty, and otherwise by synchronizing on the first node of the bucket. Long bins become trees, size is tracked by striped counters, resizing is helped by multiple threads, and size() is only an estimate under concurrent change.",
    "Hashtable and synchronizedMap serialise all access behind one lock and still throw ConcurrentModificationException during iteration. A concurrent design keeps throughput high with many threads.",
    "Use it for shared caches, registries, counters and per-key state, with merge, compute, computeIfAbsent and putIfAbsent for atomic updates. It also offers bulk operations (forEach, search, reduce with a parallelism threshold) and newKeySet for a concurrent set.",
    "Avoid it when single-threaded (HashMap is lighter), when you need null keys or values, when you need a consistent multi-key view or transaction (it does not give one), and inside mapping functions that run long, block, or modify the same map, which can stall or throw IllegalStateException.",
    "Prefer the atomic methods over check-then-act sequences, keep compute functions short and side-effect free, use LongAdder values for hot counters, call mappingCount for large maps, and use newKeySet for a set. Pre-size to limit resizing.",
    "Pros: high concurrent throughput, atomic compound operations, non-failing iteration. Cons: no nulls, weak consistency, approximate size, and no atomic operations across multiple keys.",
    "Alternatives are Collections.synchronizedMap, Hashtable (legacy), ConcurrentSkipListMap for sorted concurrent maps, a HashMap guarded by a ReadWriteLock, and Caffeine for caching.",
    `ConcurrentHashMap<String, LongAdder> hits = new ConcurrentHashMap<>();

// atomic and lock-free for the common case
hits.computeIfAbsent("home", k -> new LongAdder()).increment();

ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();
counts.merge("a", 1, Integer::sum);          // atomic read-modify-write

// WRONG: check-then-act race
if (!counts.containsKey("b")) {
    counts.put("b", 1);                      // another thread may have put it already
}
counts.putIfAbsent("b", 1);                  // correct

Set<String> keys = ConcurrentHashMap.newKeySet();
keys.add("x");

// counts.put(null, 1);   // NullPointerException: no null keys or values`
  ],
  "Hashtable": [
    "Hashtable is the legacy synchronised hash map from Java 1.0. Every method locks the whole table, it forbids null keys and values, and it has been superseded by ConcurrentHashMap for concurrency and HashMap otherwise.",
    "It extends Dictionary and implements Map, uses an array of chained entries with default capacity 11, and grows to old capacity times 2 plus 1 at a 0.75 load factor. It exposes legacy Enumeration methods (keys, elements) and Properties extends it.",
    "It was the only hash map in early Java, and synchronising every method seemed a simple route to thread safety.",
    "You meet it in old code and through java.util.Properties. Use it only if an API requires it.",
    "Avoid it in new code: a single lock limits concurrency, compound operations such as check-then-put are still not atomic, iteration can still fail, null keys and values throw NullPointerException, and it lacks modern methods and treeification performance.",
    "Replace with ConcurrentHashMap for shared access or HashMap for local use. For configuration use Properties or a typed configuration class. When migrating, check for code relying on null rejection or on Hashtable lock semantics.",
    "Pros: simple synchronised access. Cons: coarse locking, no nulls, legacy API, slower than alternatives.",
    "Alternatives are ConcurrentHashMap, HashMap, Collections.synchronizedMap, and Properties for string configuration.",
    `Hashtable<String, Integer> table = new Hashtable<>();
table.put("a", 1);
// table.put(null, 1);   // NullPointerException
// table.put("b", null); // NullPointerException

// compound action is still not atomic
if (!table.containsKey("b")) {
    table.put("b", 2);   // race condition between the two calls
}

// preferred replacement
ConcurrentHashMap<String, Integer> modern = new ConcurrentHashMap<>();
modern.putIfAbsent("b", 2);`
  ],
  "EnumMap": [
    "EnumMap is a compact, fast Map specialised for keys of a single enum type, stored as an array indexed by the enum ordinal. It iterates in declaration order and is the best map for enum keys.",
    "Its internals are an Object[] vals sized to the number of enum constants, with null values masked internally, so get and put are array lookups with no hashing. Null keys are not permitted but null values are, and iterators are weakly consistent.",
    "A HashMap with enum keys works, but hashing and Node objects add cost. The key set is known and small, so a direct array is smaller and faster.",
    "Use it for per-state or per-type data: counters by status, handlers by command type, configuration by environment, and any lookup keyed by an enum.",
    "Avoid it for keys that are not enums, for thread-safe use without external synchronisation, and when the enum is huge and the map is almost empty (array size equals constant count).",
    "Create it with new EnumMap<>(Type.class), use the normal Map API, and use Collectors.groupingBy with an EnumMap factory to group into an enum-keyed map in stream code.",
    "Pros: O(1), minimal memory, predictable order, type safe. Cons: single enum type only, not thread-safe, no null keys.",
    "Alternatives are HashMap with enum keys, a switch expression for fixed mapping logic, an array indexed by ordinal (fragile), and EnumSet for sets.",
    `enum Status { NEW, ACTIVE, CLOSED }

Map<Status, Integer> counts = new EnumMap<>(Status.class);
counts.merge(Status.ACTIVE, 1, Integer::sum);
counts.merge(Status.NEW, 1, Integer::sum);
System.out.println(counts);      // {NEW=1, ACTIVE=1} in declaration order

// group a stream into an EnumMap
Map<Status, List<Order>> byStatus = orders.stream()
        .collect(Collectors.groupingBy(
                Order::status,
                () -> new EnumMap<>(Status.class),
                Collectors.toList()));`
  ],
  "WeakHashMap": [
    "WeakHashMap holds its keys through weak references, so an entry becomes eligible for removal once its key is no longer strongly reachable elsewhere. It suits maps of metadata attached to objects whose lifetime you do not control, not general caches.",
    "Entries extend WeakReference to the key and are registered with a ReferenceQueue. After the garbage collector clears a key, the map expunges the stale entries lazily on later calls such as get, put and size. Keys are compared with equals, values are held strongly, and it is not thread-safe.",
    "A normal map keeps keys alive and so leaks memory when you attach side data to objects that would otherwise be collected. A weak key lets the entry disappear with its key.",
    "Use it for canonicalising or annotating objects (class metadata, listener registrations, per-object caches keyed by identity-like objects) where the key's owner has its own lifetime.",
    "Avoid it for value caches: entries vanish at any GC, values that reference their own key keep the entry alive forever, and keys such as string literals, interned strings or cached boxed integers are never collected. Do not use it for deterministic eviction.",
    "Ensure the key objects are held elsewhere by their real owners and that values do not strongly reference keys. Wrap with Collections.synchronizedMap if shared, and test cleanup with care since System.gc is only a hint.",
    "Pros: automatic cleanup, prevents certain leaks. Cons: nondeterministic eviction, subtle leaks through values, no concurrency support, poor fit for caching.",
    "Alternatives are Caffeine or Guava caches with weak or soft references and size or time limits, explicit removal, SoftReference-based caches, IdentityHashMap for identity keys, and ClassValue or ThreadLocal for per-class or per-thread data.",
    `Map<Object, String> meta = new WeakHashMap<>();
Object key = new Object();
meta.put(key, "attached data");

System.out.println(meta.size());       // 1
key = null;                            // drop the only strong reference
System.gc();                           // a hint, not a guarantee
// after a GC the entry is usually gone (nondeterministic):
System.out.println(meta.size());       // often 0

// pitfall: the value strongly references its key, so the entry is never removed
Map<Object, Object> leak = new WeakHashMap<>();
Object k = new Object();
leak.put(k, k);`
  ],
  "IdentityHashMap": [
    "IdentityHashMap compares keys with reference equality (==) and uses System.identityHashCode, ignoring equals and hashCode. It intentionally violates the general Map contract and is for object-graph work where identity matters.",
    "It uses open addressing with linear probing in a single Object[] that stores keys and values in adjacent slots, instead of buckets of nodes. It permits null keys and values, and its views and iterators work on identity.",
    "Algorithms such as deep copy, serialisation, graph traversal and proxies need to treat two equal-but-distinct objects as different, and must not call user-defined equals or hashCode.",
    "Use it for visited sets in object graph traversals, topology-preserving object transformations, serialisation frameworks, and tracking instances by reference, often via Collections.newSetFromMap(new IdentityHashMap<>()).",
    "Avoid it for normal lookups, as a drop-in HashMap replacement, or with value types such as strings and boxed numbers, where identity is unreliable. It is not thread-safe.",
    "Create it with new IdentityHashMap<>(expectedMaxSize), and build an identity set through newSetFromMap. Be aware that put with an equal but different key creates a second entry.",
    "Pros: fast, immune to bad equals or hashCode and mutation of keys, memory compact. Cons: surprising semantics, breaks Map contract, niche use.",
    "Alternatives are HashMap with records or value-based keys, WeakHashMap, and external identifiers assigned to objects.",
    `Map<String, Integer> equalsMap = new HashMap<>();
Map<String, Integer> identityMap = new IdentityHashMap<>();

String a = new String("key");
String b = new String("key");          // equal but a different instance

equalsMap.put(a, 1);
equalsMap.put(b, 2);
System.out.println(equalsMap.size());  // 1

identityMap.put(a, 1);
identityMap.put(b, 2);
System.out.println(identityMap.size()); // 2

// identity-based visited set for graph traversal
Set<Object> visited = Collections.newSetFromMap(new IdentityHashMap<>());
visited.add(a);`
  ],
  "HashMap Internals": [
    "A HashMap spreads the key hash, picks a bucket with (n - 1) and hash, and stores colliding entries in a linked list that becomes a red-black tree at 8 entries when the table has at least 64 slots. It resizes by doubling when size exceeds 0.75 times capacity.",
    "The hash is h ^ (h >>> 16), which mixes high bits into low bits because the index uses only the low bits of a power-of-two table. A bin is converted to a tree when it reaches 8 nodes and the table length is at least 64 (otherwise the table is resized instead), and reverts to a list at 6 nodes on resize.",
    "Hash tables degrade to O(n) per lookup when many keys collide, either by accident or by attack. Treeification (Java 8) bounds the worst case at O(log n), and tail insertion with order-preserving resize fixed the concurrent resize infinite loop of Java 7.",
    "Interviewers ask about it to test your understanding of put and get flow, resize cost, the effect of bad hashCode, and why initial capacity and immutable keys matter.",
    "Do not rely on internal constants or iteration order, and do not assume that treeification rescues a bad hashCode: tree bins order by hash, then by compareTo if the key class is Comparable, and otherwise rely on a tie-break, so Comparable keys perform best. HashMap itself remains unsafe for concurrent use.",
    "put computes the index, creates a node if the bucket is empty, otherwise compares hash and then equals along the chain or tree, replaces the value on a match, or appends at the tail. After the insert, if size exceeds the threshold it resizes. Resize splits each bin into low and high lists, preserving relative order. The table is allocated lazily, and capacity is rounded up to a power of two.",
    "Pros: amortised O(1), robust worst case O(log n). Cons: resizing causes latency spikes, memory per node (about 32 to 48 bytes with headers), and extra work for iteration over sparse tables.",
    "Alternatives are open addressing maps from third-party libraries (fastutil, Eclipse Collections, Koloboke) for primitives and lower memory, ConcurrentHashMap internals for concurrency, and TreeMap for guaranteed O(log n).",
    `// A good key: immutable, consistent equals and hashCode
record UserId(long id) {}

// A bad key: constant hashCode puts everything in one bin
class BadKey implements Comparable<BadKey> {
    final int v;
    BadKey(int v) { this.v = v; }
    @Override public int hashCode() { return 42; }
    @Override public boolean equals(Object o) { return o instanceof BadKey k && k.v == v; }
    @Override public int compareTo(BadKey o) { return Integer.compare(v, o.v); }
}
// Comparable lets the tree bin stay O(log n); without it lookups approach O(n)

// pre-size to avoid repeated resizes: capacity must exceed expected / 0.75
Map<String, String> m = HashMap.newHashMap(1_000);   // Java 19
Map<String, String> older = new HashMap<>((int) (1_000 / 0.75f) + 1);`
  ],
  "Fail-fast vs Fail-safe Iterators": [
    "Fail-fast iterators (ArrayList, HashMap) detect structural modification through modCount and throw ConcurrentModificationException on a best-effort basis. Fail-safe is an informal term for concurrent collections whose iterators never throw and are either weakly consistent (ConcurrentHashMap) or snapshots (CopyOnWriteArrayList).",
    "A fail-fast iterator records the collection's modCount as expectedModCount and compares them on next(); a mismatch throws ConcurrentModificationException, which can happen even in a single thread. A weakly consistent iterator reflects the state at or after its creation and may or may not show later changes. A snapshot iterator iterates over a copy of the array taken when it was created.",
    "It is better to fail visibly on a bug than to produce silent corruption. Concurrent collections, on the other hand, are designed for concurrent change and cannot fail on it.",
    "Know it to explain why removing inside a for-each loop throws, how to remove safely, and which collection to choose when other threads modify while you iterate.",
    "Do not catch ConcurrentModificationException as flow control, and do not rely on it for thread safety: detection is best effort and may be missed. Do not treat weakly consistent or snapshot iterators as a transactionally consistent view or expect them to support remove (snapshot iterators do not).",
    "Remove through Iterator.remove, or use removeIf, removeAll or a new collection built with streams. For concurrent use choose ConcurrentHashMap, ConcurrentLinkedQueue, ConcurrentSkipListMap or CopyOnWriteArrayList depending on the access pattern.",
    "Pros of fail-fast: quick bug detection, no overhead. Cons: not guaranteed and not thread safety. Pros of weakly consistent and snapshot: no exceptions, concurrent progress. Cons: stale or partial views, and snapshots cost a copy per write.",
    "Alternatives are copying before iterating (new ArrayList<>(list)), immutable collections with copy-on-update, explicit locking while iterating, and Java streams over a concurrent source.",
    `List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));

// Fails fast: for-each uses the iterator, remove changes modCount
try {
    for (Integer n : list) {
        if (n == 2) list.remove(n);
    }
} catch (ConcurrentModificationException e) {
    System.out.println("CME");
}

// Safe options
list.removeIf(n -> n == 2);
for (Iterator<Integer> it = list.iterator(); it.hasNext(); ) {
    if (it.next() == 3) it.remove();       // updates expectedModCount
}

// Weakly consistent: never throws
Map<String, Integer> chm = new ConcurrentHashMap<>(Map.of("a", 1, "b", 2));
for (String k : chm.keySet()) {
    chm.put("c", 3);                       // allowed, may or may not be seen
}

// Snapshot: iterates the array as it was when the iterator was created
List<Integer> cow = new CopyOnWriteArrayList<>(List.of(1, 2, 3));
for (Integer n : cow) cow.add(99);         // loop sees only 1, 2, 3`
  ],
  "Immutable Collections": [
    "List.of, Set.of, Map.of and the copyOf methods (Java 9 and 10) return truly immutable collections that reject nulls, while Collections.unmodifiableList only wraps a mutable list in a read-only view. Immutable collections are shallow: the elements themselves can still be mutable.",
    "The factory collections are separate immutable implementations with no mutators, so any change throws UnsupportedOperationException. They throw NullPointerException on null elements (including contains(null)), reject duplicates in Set.of and Map.of with IllegalArgumentException, and Set.of and Map.of iterate in an unspecified order that is randomised per JVM run. List.copyOf returns the same instance if the argument is already immutable.",
    "Shared mutable collections cause defensive copying, aliasing bugs and thread-safety problems. Immutable values are safe to publish and share freely.",
    "Use them for constants, return values from APIs, defensive copies in constructors (List.copyOf(param)), configuration, and as keys or values that must not change. Stream.toList also returns an unmodifiable list but allows nulls.",
    "Avoid Collections.unmodifiableList when you think you have immutability: if someone holds the backing list, changes show through the view. Avoid the factory methods when you must store nulls or need a stable iteration order for Set and Map (use LinkedHashSet or LinkedHashMap).",
    "Take defensive copies at boundaries with List.copyOf, Set.copyOf and Map.copyOf, use Map.ofEntries for more than 10 pairs, and use Collectors.toUnmodifiableList, toUnmodifiableSet or toUnmodifiableMap in streams. Use immutable element types such as records for deep immutability.",
    "Pros: thread-safe, compact, no defensive copying afterwards, clear intent. Cons: null-hostile, randomised order for sets and maps can reveal hidden ordering assumptions in tests, and updates need a new collection.",
    "Alternatives are Collections.unmodifiableXxx views, Arrays.asList (fixed-size, writes through to the array), Guava ImmutableList and ImmutableMap (null-hostile but order-preserving), and persistent collections from libraries such as Vavr or Eclipse Collections.",
    `List<String> source = new ArrayList<>(List.of("a", "b"));

List<String> view = Collections.unmodifiableList(source);   // a read-only VIEW
List<String> copy = List.copyOf(source);                    // a true immutable snapshot

source.add("c");
System.out.println(view);    // [a, b, c]  change shows through the view
System.out.println(copy);    // [a, b]

// view.add("x");            // UnsupportedOperationException
// copy.add("x");            // UnsupportedOperationException

// List.of("a", null);       // NullPointerException
// Set.of("a", "a");         // IllegalArgumentException: duplicate element
// Set.of(...) and Map.of(...) iteration order can differ between JVM runs

List<String> fromStream = Stream.of("x", "y").toList();     // unmodifiable, nulls allowed`
  ],
  "Big-O Cheat Sheet": [
    "Typical complexities: ArrayList get O(1), add amortised O(1), add or remove in the middle O(n), contains O(n); LinkedList get O(n), ends O(1); HashMap and HashSet O(1) average with O(log n) worst case after treeification; TreeMap and TreeSet O(log n); PriorityQueue offer and poll O(log n), peek O(1); ArrayDeque ends O(1).",
    "Table: ArrayList get O(1), add(end) O(1) amortised, add(i) O(n), contains O(n). LinkedList get(i) O(n), addFirst or addLast O(1), contains O(n). HashMap, HashSet and LinkedHashMap get, put and contains O(1) average. TreeMap and TreeSet O(log n) for all key operations. PriorityQueue offer and poll O(log n), peek O(1), remove(Object) O(n). ArrayDeque offer, poll and push at ends O(1). CopyOnWriteArrayList add O(n), get O(1). ConcurrentHashMap O(1) average.",
    "Complexity bounds explain why one collection scales and another does not, and interviewers expect you to reason about it rather than recite it.",
    "Use it when choosing a collection, reviewing code for performance, and estimating behaviour on large inputs, together with memory and cache effects.",
    "Do not treat Big-O as the whole story: constants, cache locality, resizing, boxing, GC and hash quality matter, and an O(n) ArrayList scan can beat an O(1) hash lookup for small n. Average case for hashing assumes a decent hashCode.",
    "Write down the operations your code actually performs and their frequency, pick the collection that makes the dominant operations cheap, pre-size where possible, and measure with JMH or a profiler when it matters.",
    "Pros: a shared language for trade-offs. Cons: hides constants and memory, amortised bounds hide latency spikes (resize), and worst case differs from average case.",
    "Alternatives and complements are measuring with JMH, profiling real workloads, and memory analysis with heap dumps or tools such as JOL to see the real object cost.",
    `// Pitfall 1: LinkedList.get(i) in a loop is O(n squared)
LinkedList<Integer> linked = new LinkedList<>(data);
long sum = 0;
for (int i = 0; i < linked.size(); i++) {
    sum += linked.get(i);                  // O(n) each time
}
for (int x : linked) sum += x;             // O(n) total, use the iterator

// Pitfall 2: contains on a List inside a loop is O(n * m)
List<String> allowed = loadAllowed();
for (String s : inputs) {
    if (allowed.contains(s)) { /* O(n) per call */ }
}
Set<String> allowedSet = new HashSet<>(allowed);   // O(1) per lookup

// Pitfall 3: inserting at the front of an ArrayList is O(n)
List<Integer> arr = new ArrayList<>();
for (int i = 0; i < 100_000; i++) arr.add(0, i);   // O(n squared) overall
Deque<Integer> deque = new ArrayDeque<>();
for (int i = 0; i < 100_000; i++) deque.addFirst(i);   // O(1) each`
  ],
  "Choosing the Right Collection": [
    "Decide by answering four questions in order: do you need key-value pairs, do you need uniqueness, what ordering do you need, and is it accessed concurrently. Then default to ArrayList, HashSet, HashMap or ArrayDeque and move to a specialised collection only for a clear reason.",
    "Procedure: 1) Key to value lookup means a Map, otherwise a Collection. 2) Unique elements means a Set, a sequence with duplicates means a List, processing order means a Queue or Deque. 3) Ordering: none gives HashMap or HashSet, insertion order gives LinkedHashMap or LinkedHashSet, sorted or range queries give TreeMap or TreeSet, priority gives PriorityQueue, enum keys give EnumMap or EnumSet. 4) Concurrency gives ConcurrentHashMap, CopyOnWriteArrayList, ConcurrentLinkedQueue, BlockingQueue or ConcurrentSkipListMap. 5) Read-only data uses List.of, Set.of or Map.of.",
    "Wrong choices cause quadratic loops, memory bloat, nondeterministic output and race conditions, and picking by habit makes those mistakes common.",
    "Apply it at design time, in code review, and in interviews when asked to justify a data structure. Program to the interface (List, Map, Deque) and choose the implementation in one place.",
    "Do not optimise before knowing sizes and access patterns, and do not choose LinkedList, Vector, Stack or Hashtable for new code. Do not use a concurrent collection as a substitute for correct compound operations or multi-step invariants.",
    "Write the dominant operations (lookup, insert at end, insert at front, range query, remove while iterating), size and thread access, map them to the table, and confirm with a benchmark if performance is critical. Declare variables with interface types so you can swap implementations.",
    "Pros: a repeatable approach that avoids premature complexity. Cons: real systems mix several needs, and sometimes you need two structures kept in sync, such as a Map plus a PriorityQueue.",
    "Alternatives are third-party collections (Guava Multimap and BiMap, Eclipse Collections, fastutil for primitives, Caffeine for caches) and databases or caches when data outgrows memory.",
    `// Interface on the left, the decision on the right
List<Order> orders = new ArrayList<>();                      // default sequence
Set<String> ids = new HashSet<>();                           // uniqueness, no order
Map<String, User> users = new HashMap<>();                   // lookup by key
Deque<Node> work = new ArrayDeque<>();                       // stack or queue
Map<String, Config> ordered = new LinkedHashMap<>();         // stable iteration order
NavigableMap<Instant, Event> timeline = new TreeMap<>();     // range queries
Queue<Task> byPriority = new PriorityQueue<>();              // smallest first
Map<Status, Integer> perStatus = new EnumMap<>(Status.class);

Map<String, Session> sessions = new ConcurrentHashMap<>();   // shared across threads
List<Listener> listeners = new CopyOnWriteArrayList<>();     // read-mostly, shared
List<String> constants = List.of("a", "b");                  // never changes`
  ],
  "Collections Utility Class": [
    "java.util.Collections is a utility class of static algorithms and wrappers: sort, binarySearch, reverse, shuffle, min and max, frequency, plus unmodifiable, synchronized and checked wrappers and empty or singleton collections. Wrappers are views and the synchronized ones do not make compound operations atomic.",
    "It provides algorithms (sort, reverse, rotate, swap, shuffle, binarySearch, frequency, disjoint, nCopies), factories (emptyList, singletonList, newSetFromMap), and wrappers (unmodifiableList and friends, synchronizedList and friends, checkedList). Since Java 21 it also has unmodifiableSequencedCollection and related methods.",
    "The interfaces define data structures but not common algorithms, and wrappers let you add behaviour such as read-only access or locking without new classes.",
    "Use it for sorting and searching lists, quickly reversing or shuffling, creating empty or singleton collections for APIs, wrapping a map as a set, and giving callers a read-only view of internal state.",
    "Avoid synchronizedList and synchronizedMap for new concurrent designs (prefer concurrent collections); you must still synchronise manually when iterating them. Avoid unmodifiableXxx when you need true immutability, since the backing collection can still change, and use List.copyOf instead. binarySearch requires a sorted list.",
    "Call Collections.sort(list) or list.sort(null), binarySearch on sorted lists, Collections.max(coll, comparator), frequency for counts, and reverseOrder for descending comparators. When iterating a synchronized wrapper, hold synchronized (wrapper) around the loop.",
    "Pros: well-tested, concise helpers. Cons: wrappers add indirection, synchronized wrappers have coarse locking, and some methods (emptyList, singletonList) return immutable objects that throw on modification.",
    "Alternatives are List.sort and Stream operations, List.of and copyOf for immutability, concurrent collections instead of synchronized wrappers, and Guava or Apache Commons Collections for extra utilities.",
    `List<Integer> nums = new ArrayList<>(List.of(5, 3, 9, 1));
Collections.sort(nums);                          // [1, 3, 5, 9]
int idx = Collections.binarySearch(nums, 5);     // 2, requires sorted input
Collections.reverse(nums);                       // [9, 5, 3, 1]
Collections.shuffle(nums, new Random(42));       // reproducible shuffle
int max = Collections.max(nums);
int freq = Collections.frequency(nums, 3);

List<String> none = Collections.emptyList();     // immutable
List<String> zeros = Collections.nCopies(3, "0");

List<Integer> sync = Collections.synchronizedList(new ArrayList<>());
synchronized (sync) {                            // required while iterating
    for (int n : sync) { /* ... */ }
}

Set<String> idSet = Collections.newSetFromMap(new ConcurrentHashMap<>());`
  ]
};
