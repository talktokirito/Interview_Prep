// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Thread Lifecycle and States": [
    "A Java thread moves through NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING and TERMINATED. Knowing which state a thread is in, and what moves it, is the key to reading thread dumps and diagnosing hangs.",
    "NEW means created but not started; RUNNABLE means running or ready to run (including blocked in native I/O); BLOCKED waits for a monitor lock; WAITING and TIMED_WAITING wait for another thread or a timeout; TERMINATED has finished.",
    "Concurrency problems like deadlock, lock contention and starvation show up as threads stuck in particular states. Understanding transitions lets you explain them.",
    "Use it when debugging with jstack or JFR, explaining wait and notify, join, sleep, park and lock behaviour, and designing cancellation.",
    "Do not rely on the state for program logic; getState is for diagnostics only and can change immediately after reading.",
    "start moves NEW to RUNNABLE; entering a contended synchronized block goes to BLOCKED; Object.wait, Thread.join and LockSupport.park go to WAITING; sleep and timed variants go to TIMED_WAITING; the run method returning goes to TERMINATED.",
    "Pros: a clear model for diagnosis. Cons: RUNNABLE hides real work versus native blocking, and states do not show who owns a lock without extra analysis.",
    "Alternatives are thread dump analysers, JFR thread events and monitoring tools showing thread activity.",
    `Thread t = new Thread(() -> {
    try { Thread.sleep(500); } catch (InterruptedException ignored) {}
});
System.out.println(t.getState());   // NEW
t.start();
System.out.println(t.getState());   // RUNNABLE
Thread.sleep(100);
System.out.println(t.getState());   // TIMED_WAITING
t.join();
System.out.println(t.getState());   // TERMINATED`
  ],
  "Thread vs Runnable vs Callable": [
    "Runnable is a task with no result or checked exception, Callable returns a value and may throw, and Thread is the worker that runs tasks. Implement Runnable or Callable and submit them to an executor instead of extending Thread.",
    "Runnable.run returns void. Callable<V>.call returns V and may throw Exception. A Future represents the pending result. Thread is the unit of execution, while executors manage a pool of them.",
    "Separating the task from the mechanism that runs it allows thread reuse, results, exception propagation and policies.",
    "Use Callable with ExecutorService when you need a result or exception, Runnable for fire-and-forget work, and virtual threads for many blocking tasks.",
    "Do not extend Thread to define behaviour, create raw threads per task in production code, or ignore exceptions inside Runnables since they die silently in a bare thread.",
    "Submit tasks with executor.submit(callable), retrieve results with future.get(timeout), and set an UncaughtExceptionHandler for raw threads. Name threads with a ThreadFactory.",
    "Pros: clean separation, reuse and error handling. Cons: Future.get blocks, and checked exception wrapping in ExecutionException is noisy.",
    "Alternatives are CompletableFuture, virtual threads, parallel streams and reactive frameworks.",
    `ExecutorService pool = Executors.newFixedThreadPool(4);
Callable<Integer> job = () -> expensiveCalculation();
Future<Integer> f = pool.submit(job);
try {
    Integer result = f.get(2, TimeUnit.SECONDS);
} catch (ExecutionException e) {
    // the cause is the exception thrown inside call()
} finally {
    pool.shutdown();
}`
  ],
  "synchronized and Intrinsic Locks": [
    "synchronized gives mutual exclusion and visibility using an object's monitor. It is reentrant and simple, but it cannot time out or be interrupted, so keep critical sections small and avoid holding it across I/O or alien calls.",
    "Every object has a monitor. A synchronized method locks this (or the Class for static), a block locks the specified object. Entering establishes a happens-before relationship with the previous release.",
    "Without synchronisation, threads see stale data and interleave read-modify-write sequences, producing corrupted state.",
    "Use it for short, simple critical sections protecting invariants of one object, where lock features like tryLock are not needed.",
    "Avoid locking on public objects, strings or boxed values, holding locks while calling unknown code, and long-held locks. On virtual threads before Java 24 it can pin the carrier thread during blocking.",
    "Lock on a private final object, keep the block short, always lock in a consistent order, and prefer higher-level utilities. Use synchronized on the smallest region that preserves the invariant.",
    "Pros: simple, reentrant, JVM-optimised. Cons: no timeout, no fairness control, contention hurts throughput, deadlock risk.",
    "Alternatives are ReentrantLock, atomics, concurrent collections, immutable objects and thread confinement.",
    `public class Counter {
    private final Object lock = new Object();
    private int count;

    public void increment() {
        synchronized (lock) { count++; }
    }
    public int get() {
        synchronized (lock) { return count; }   // reads need the lock too
    }
}`
  ],
  "volatile Keyword": [
    "volatile guarantees visibility and ordering of a variable across threads but not atomicity. Use it for flags and safe publication, never for compound operations like count++.",
    "A write to a volatile field happens-before every subsequent read of it, and prevents reordering around the access. Reads and writes of volatile longs and doubles are atomic.",
    "Without it, a thread may never see another thread's update because values can live in registers or caches, and the compiler or CPU may reorder operations.",
    "Use it for a stop flag, a status that is written by one thread and read by others, and for publishing a fully built object reference, as in double-checked locking.",
    "Do not use it for counters or check-then-act logic; use atomics or locks. It does not make an object's internal state thread-safe.",
    "Declare private volatile boolean running = true; and check it in the loop. Combine with immutable objects for safe publication of state.",
    "Pros: lightweight visibility. Cons: no atomicity, easy to misuse, and a small performance cost from memory barriers.",
    "Alternatives are AtomicXxx classes, locks, VarHandle access modes and thread-safe containers.",
    `class Worker implements Runnable {
    private volatile boolean running = true;
    void stop() { running = false; }
    public void run() {
        while (running) { doWork(); }    // sees the update promptly
    }
}
// Not safe: count++ is read, add, write
private volatile int count;
void bad() { count++; }                  // lost updates under contention`
  ],
  "Java Memory Model and Happens-Before": [
    "The Java Memory Model defines when one thread's writes are guaranteed visible to another through happens-before relationships. Without such an edge, reordering and caching make behaviour undefined.",
    "Happens-before edges come from program order, monitor unlock before lock, volatile write before read, thread start and join, final field semantics and executor or concurrent collection actions.",
    "Modern CPUs and compilers reorder and cache aggressively. The JMM gives portable rules so correct synchronisation works on all hardware.",
    "Use it to reason about visibility bugs, safe publication, and why volatile, synchronized and final behave as they do.",
    "Do not rely on timing, sleep or assumptions that code executes in source order across threads.",
    "Establish happens-before using synchronized, volatile, Lock, Atomic classes, Thread.start and join, and concurrent collections. Prefer immutable objects, which are safely shared once published.",
    "Pros: portable correctness rules. Cons: subtle, hard to test, and failures appear rarely and only on some hardware.",
    "Alternatives are higher-level constructs that encapsulate the rules, message passing and actor models.",
    `int data; boolean ready;            // plain fields: no guarantee

// Thread A                    // Thread B
data = 42;                     while (!ready) { }
ready = true;                  print(data);   // may loop forever or print 0

// Fix: declare 'ready' volatile. The volatile write happens-before
// the volatile read, so data = 42 is visible to Thread B.`
  ],
  "wait, notify and notifyAll": [
    "wait, notify and notifyAll are the low-level monitor methods for thread coordination: always call them while holding the lock, wait in a loop checking the condition, and prefer notifyAll or higher-level utilities.",
    "wait releases the monitor and sleeps until notified or interrupted; notify wakes one waiting thread, notifyAll wakes all, and woken threads must reacquire the lock.",
    "Threads often need to wait for a condition set by another thread without busy-spinning.",
    "Know it for interviews and legacy code, and use it when implementing simple blocking structures. Real code should use BlockingQueue, Condition and other utilities.",
    "Do not call them without owning the monitor (IllegalMonitorStateException), use if instead of while, or use notify when several conditions share one monitor.",
    "Use while (!condition) lock.wait(); to guard against spurious wakeups, change state and notifyAll under the same lock, and handle InterruptedException properly.",
    "Pros: fundamental building block. Cons: error-prone, one condition per monitor, easy to miss signals.",
    "Alternatives are BlockingQueue, Condition objects, CountDownLatch, Semaphore and CompletableFuture.",
    `synchronized (lock) {
    while (queue.isEmpty()) {       // loop: spurious wakeups
        lock.wait();
    }
    item = queue.remove();
}
// producer
synchronized (lock) {
    queue.add(item);
    lock.notifyAll();
}`
  ],
  "ThreadLocal": [
    "ThreadLocal gives each thread its own copy of a variable, useful for request context and non-thread-safe helpers. In thread pools you must remove values, or they leak and leak data between requests.",
    "Each Thread holds a map of ThreadLocal to value. get returns the thread's own value, set stores it, and remove clears it. InheritableThreadLocal passes values to child threads at creation.",
    "Some objects, like SimpleDateFormat, are not thread-safe, and passing context such as user or transaction through every method is cumbersome.",
    "Use it sparingly for request-scoped context, MDC logging and per-thread caches in code you control.",
    "Avoid it with thread pools without clean-up, with virtual threads in large numbers, or as hidden global state. Context does not propagate across async boundaries automatically.",
    "Call remove in a finally block at the end of the task, prefer immutable or thread-safe alternatives, and consider scoped values on newer Java versions.",
    "Pros: easy per-thread state. Cons: leaks in pools, hidden dependencies, no automatic propagation and cost with many threads.",
    "Alternatives are ScopedValue, explicit parameters, request-scoped beans and thread-safe objects.",
    `private static final ThreadLocal<String> USER = new ThreadLocal<>();

void handle(Request r) {
    USER.set(r.user());
    try {
        service.process();      // can call USER.get() deep in the stack
    } finally {
        USER.remove();          // essential in thread pools
    }
}`
  ],
  "Thread Interruption and Cancellation": [
    "Interruption is a cooperative cancellation mechanism: interrupt sets a flag and wakes blocking calls with InterruptedException, and your code must respond. Never swallow InterruptedException; restore the flag or propagate it.",
    "interrupt() sets the interrupt status. Blocking methods like sleep, wait and join throw InterruptedException and clear the flag. Code can poll Thread.interrupted or isInterrupted.",
    "Threads cannot be safely stopped forcibly, since stop is unsafe. A cooperative protocol is the only reliable way to cancel work.",
    "Use it to cancel long tasks, shut down executors cleanly, and implement timeouts with Future.cancel(true).",
    "Do not catch InterruptedException and ignore it, and do not rely on interruption for tasks that never check the flag or block interruptibly, such as plain socket reads.",
    "In a catch block either rethrow or call Thread.currentThread().interrupt(). Check the flag in long loops, close resources on cancellation, and use ExecutorService.shutdownNow followed by awaitTermination.",
    "Pros: safe cooperative cancellation. Cons: relies on discipline, and some blocking operations are not interruptible.",
    "Alternatives are volatile stop flags, Future.cancel, structured concurrency and cancellation tokens in libraries.",
    `Runnable task = () -> {
    while (!Thread.currentThread().isInterrupted()) {
        try {
            doStep();
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();   // restore the flag
            break;
        }
    }
};`
  ],

  "ReentrantLock and Condition": [
    "ReentrantLock is an explicit, flexible alternative to synchronized offering tryLock, timed and interruptible locking, optional fairness and multiple Condition objects. Always unlock in finally.",
    "It allows the same thread to acquire the lock repeatedly, tracks a hold count, and creates Condition objects with await and signal for separate wait sets.",
    "synchronized cannot time out, be interrupted while waiting or support several wait conditions on one lock.",
    "Use it when you need tryLock to avoid deadlock, timeouts, interruptible acquisition, fairness or multiple conditions, such as a bounded buffer.",
    "Avoid it when synchronized is enough; forgetting unlock causes permanent blocking, and fair locks reduce throughput.",
    "Pattern: lock.lock(); try { ... } finally { lock.unlock(); }. Use tryLock(timeout) with consistent ordering for multi-lock operations, and conditions for await and signalAll.",
    "Pros: flexible and powerful, and it does not pin virtual threads the way synchronized did before Java 24. Cons: manual unlock and more code.",
    "Alternatives are synchronized, StampedLock, atomics and concurrent collections.",
    `private final ReentrantLock lock = new ReentrantLock();

boolean transfer(Account a, Account b, long amount) throws InterruptedException {
    if (!lock.tryLock(1, TimeUnit.SECONDS)) return false;   // avoid waiting forever
    try {
        a.debit(amount); b.credit(amount);
        return true;
    } finally {
        lock.unlock();
    }
}`
  ],
  "ReadWriteLock and StampedLock": [
    "ReadWriteLock allows many concurrent readers or one writer, which helps read-heavy workloads. StampedLock adds optimistic reads for even better performance but is not reentrant and is easier to misuse.",
    "ReentrantReadWriteLock has separate read and write locks with downgrading support. StampedLock returns stamps, supports writeLock, readLock and tryOptimisticRead, validated after reading.",
    "A single exclusive lock serialises readers even though reading does not conflict.",
    "Use read-write locks for caches and configuration with many reads and rare writes; use StampedLock when profiling shows contention and you can validate reads safely.",
    "Avoid them when writes are frequent or critical sections are tiny, where the extra bookkeeping costs more than it saves, and avoid StampedLock if you need reentrancy or conditions.",
    "Acquire read lock for reads and write lock for modification, release in finally. With StampedLock call tryOptimisticRead, read fields, then validate(stamp) and fall back to a read lock if it fails.",
    "Pros: better read throughput. Cons: complexity, writer starvation risk and no upgrade from read to write in ReentrantReadWriteLock.",
    "Alternatives are ConcurrentHashMap, copy-on-write structures, immutable snapshots and a simple lock.",
    `StampedLock sl = new StampedLock();
double distanceFromOrigin() {
    long stamp = sl.tryOptimisticRead();
    double cx = x, cy = y;
    if (!sl.validate(stamp)) {              // a writer intervened
        stamp = sl.readLock();
        try { cx = x; cy = y; } finally { sl.unlockRead(stamp); }
    }
    return Math.hypot(cx, cy);
}`
  ],
  "Atomic Classes and CAS": [
    "Atomic classes provide lock-free, thread-safe updates using compare-and-swap hardware instructions. They suit counters and single-variable state, with LongAdder preferred under heavy contention.",
    "AtomicInteger, AtomicLong, AtomicReference and others use CAS: read the current value, compute the new one, and swap only if the value is unchanged, retrying otherwise.",
    "Locks block threads and cost context switches, while simple counters and flags need only an atomic read-modify-write.",
    "Use them for counters, sequence numbers, flags and lock-free structures with a single shared variable.",
    "Avoid them for invariants spanning several variables, which need a lock. Beware of the ABA problem and of heavy contention on one hot variable.",
    "Use incrementAndGet, compareAndSet and updateAndGet with a pure function, AtomicReference for immutable state objects, and LongAdder for high-throughput counters.",
    "Pros: non-blocking, scalable, no deadlocks. Cons: retry loops under contention, single-variable scope, and ABA pitfalls.",
    "Alternatives are locks, LongAdder and LongAccumulator, VarHandle and STM-style libraries.",
    `AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();

AtomicReference<Config> ref = new AtomicReference<>(initial);
ref.updateAndGet(c -> c.withTimeout(5));      // retries until CAS succeeds

LongAdder hits = new LongAdder();              // better under contention
hits.increment();
long total = hits.sum();`
  ],
  "Deadlock, Livelock and Starvation": [
    "Deadlock is threads waiting on each other forever, livelock is threads active but making no progress, and starvation is a thread never getting its turn. Prevent deadlock with consistent lock ordering, timeouts and fewer locks.",
    "Deadlock needs four conditions: mutual exclusion, hold and wait, no preemption, and circular wait. Livelock occurs when threads keep reacting to each other, and starvation when others monopolise a resource.",
    "These failures cause hangs that are hard to reproduce, so prevention by design is essential.",
    "Know them to review lock usage, diagnose hangs with thread dumps, and design resource acquisition safely.",
    "Do not nest locks without a documented order, call unknown code while holding a lock, or retry without randomised backoff.",
    "Acquire locks in a global order, use tryLock with timeout, hold locks briefly, avoid calling alien methods under a lock, and detect deadlocks with jstack, which reports found deadlocks.",
    "Pros of prevention: reliability. Cons: ordering discipline and timeouts add complexity and may need retry logic.",
    "Alternatives are lock-free algorithms, message passing, single-threaded owners and database-level deadlock detection.",
    `// Deadlock risk: two threads lock the same accounts in opposite order
void transfer(Account from, Account to) {
    synchronized (from) { synchronized (to) { ... } }
}
// Fix: always lock in a consistent order
void transfer(Account from, Account to) {
    Account first = from.id() < to.id() ? from : to;
    Account second = first == from ? to : from;
    synchronized (first) { synchronized (second) { ... } }
}`
  ],

  "ExecutorService and Thread Pools": [
    "ExecutorService decouples task submission from thread management and reuses a pool of threads. Create pools deliberately, name threads, always shut them down, and avoid the unbounded Executors factory defaults in production.",
    "Executors provide fixed, cached, single and scheduled pools. submit returns a Future, invokeAll runs a batch, and shutdown stops accepting tasks while awaitTermination waits for completion.",
    "Creating a thread per task is expensive and unbounded, which can exhaust memory and CPU.",
    "Use pools for CPU-bound or limited-concurrency work, and virtual-thread-per-task executors for blocking I/O.",
    "Avoid newFixedThreadPool with an unbounded queue and newCachedThreadPool without limits in production, and never forget shutdown, which keeps the JVM alive.",
    "Use a ThreadPoolExecutor with bounded queue and rejection policy, a ThreadFactory for naming, try-with-resources on ExecutorService in Java 19 and later, and metrics for queue size and active threads.",
    "Pros: thread reuse and control. Cons: sizing is hard, queues can hide overload, and exceptions in submitted tasks are captured in Futures.",
    "Alternatives are virtual threads, ForkJoinPool, CompletableFuture with custom executors and reactive schedulers.",
    `ExecutorService pool = Executors.newFixedThreadPool(8,
    r -> { Thread t = new Thread(r, "worker"); t.setDaemon(true); return t; });
List<Future<String>> futures = pool.invokeAll(tasks);
pool.shutdown();
if (!pool.awaitTermination(30, TimeUnit.SECONDS)) pool.shutdownNow();`
  ],
  "ThreadPoolExecutor Tuning and Pool Sizing": [
    "ThreadPoolExecutor is configured by core size, max size, queue, keep-alive and rejection policy. Size CPU-bound pools near the core count and I/O-bound pools larger, using wait-to-compute ratio, and always bound the queue.",
    "Threads up to core size start first, then tasks queue, and only when the queue is full does the pool grow to max size. When both are full the RejectedExecutionHandler runs: abort, caller-runs, discard or discard-oldest.",
    "Wrong sizing causes either idle CPUs or overload, thrashing and memory exhaustion from unbounded queues.",
    "Use it for any server workload with controlled concurrency, with separate pools to isolate slow dependencies (bulkheads).",
    "Avoid one global pool shared by unrelated work, unbounded queues, and sizing by guess without measurement. Blocking tasks in a CPU-sized pool starve it.",
    "Rule of thumb: CPU-bound threads about N cores plus one, I/O-bound about N times (1 plus wait divided by compute). Use CallerRunsPolicy for backpressure, monitor queue depth and test under load.",
    "Pros: control and isolation. Cons: tuning effort and complex interplay of core, queue and max.",
    "Alternatives are virtual threads for I/O-bound work, auto-scaling infrastructure and adaptive concurrency limiters.",
    `ThreadPoolExecutor pool = new ThreadPoolExecutor(
    8, 16,                                  // core, max
    60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),          // bounded queue
    new ThreadPoolExecutor.CallerRunsPolicy());   // backpressure when saturated`
  ],
  "ScheduledExecutorService": [
    "ScheduledExecutorService runs tasks after a delay or periodically, replacing Timer. Know the difference between fixed rate and fixed delay, and that an uncaught exception cancels future runs.",
    "schedule runs once, scheduleAtFixedRate starts runs at fixed intervals regardless of duration, and scheduleWithFixedDelay waits a delay after each run ends.",
    "Timer uses a single thread and dies on exceptions. A pool-based scheduler is more robust.",
    "Use it for polling, cache refresh, heartbeats and periodic clean-up inside a JVM.",
    "Avoid it for distributed scheduling needs where each instance would run the job, or for long drifting cron-like schedules where Quartz fits better.",
    "Catch exceptions inside the task so later runs continue, shut the scheduler down on exit, and use fixed delay for jobs that must not overlap.",
    "Pros: simple and in-process. Cons: no persistence or clustering, and one failure can silently stop the schedule.",
    "Alternatives are Spring @Scheduled, Quartz, Kubernetes CronJobs and cloud schedulers.",
    `ScheduledExecutorService ses = Executors.newScheduledThreadPool(2);
ses.scheduleWithFixedDelay(() -> {
    try { refreshCache(); }
    catch (Exception e) { log.error("refresh failed", e); }   // keep the schedule alive
}, 0, 30, TimeUnit.SECONDS);`
  ],
  "ForkJoinPool and Work Stealing": [
    "ForkJoinPool executes divide-and-conquer tasks with work stealing, where idle workers take tasks from busy workers' queues. It powers parallel streams and the common pool, and suits CPU-bound recursive work, not blocking I/O.",
    "RecursiveTask and RecursiveAction split work with fork, then join the results. Each worker has a deque; idle workers steal from the tail of others.",
    "Fixed pools handle many small recursive subtasks poorly, with threads blocked waiting on children. Work stealing keeps all cores busy.",
    "Use it for parallel divide-and-conquer algorithms, large array or tree processing and parallel streams.",
    "Avoid blocking calls inside tasks, tiny tasks where overhead dominates, and relying on the shared common pool for long-running work.",
    "Split until below a threshold, fork one half, compute the other directly, then join. Use a dedicated pool when you need to isolate work from the common pool.",
    "Pros: efficient CPU use. Cons: threshold tuning, unsuited to blocking work and shared-pool starvation.",
    "Alternatives are parallel streams, executors with manual partitioning and virtual threads for I/O.",
    `class SumTask extends RecursiveTask<Long> {
    final int[] a; final int lo, hi;
    SumTask(int[] a, int lo, int hi) { this.a = a; this.lo = lo; this.hi = hi; }
    protected Long compute() {
        if (hi - lo <= 10_000) { long s = 0; for (int i = lo; i < hi; i++) s += a[i]; return s; }
        int mid = (lo + hi) >>> 1;
        SumTask left = new SumTask(a, lo, mid);
        left.fork();
        return new SumTask(a, mid, hi).compute() + left.join();
    }
}`
  ],

  "Future and CompletableFuture": [
    "Future gives a blocking handle to a result, while CompletableFuture composes asynchronous steps with thenApply, thenCompose, thenCombine and error handling without blocking. Always supply your own executor for blocking work and handle failures.",
    "CompletableFuture can be completed manually or by supplyAsync, chains dependent stages, combines several futures with allOf and anyOf, and handles exceptions with exceptionally, handle and whenComplete.",
    "Future.get blocks and cannot be composed, leading to nested callbacks or blocked threads.",
    "Use it to orchestrate parallel calls, aggregate results and build async pipelines, with orTimeout and completeOnTimeout for time limits.",
    "Avoid blocking join inside async stages, running blocking work on the common pool, swallowing exceptions, and deeply nested chains that obscure flow. With virtual threads, plain blocking code is often simpler.",
    "Use thenApply for sync transforms, thenCompose for chaining async calls, thenCombine for two independent results, allOf for fan-out, and pass a custom Executor to Async methods.",
    "Pros: composable and non-blocking. Cons: readability of long chains, exception wrapping in CompletionException, and thread-context propagation.",
    "Alternatives are virtual threads with structured code, reactive types (Mono, Flux), RxJava and Kotlin coroutines.",
    `CompletableFuture<User> user = CompletableFuture.supplyAsync(() -> userClient.get(id), ioPool);
CompletableFuture<List<Order>> orders = CompletableFuture.supplyAsync(() -> orderClient.list(id), ioPool);

CompletableFuture<Profile> profile = user
    .thenCombine(orders, Profile::new)
    .orTimeout(2, TimeUnit.SECONDS)
    .exceptionally(ex -> Profile.empty());`
  ],
  "Virtual Threads": [
    "Virtual threads are JVM-managed lightweight threads that make blocking cheap, so one thread per request scales to huge concurrency. They help I/O-bound services, not CPU-bound work, and need care with pinning, ThreadLocals and downstream limits.",
    "A virtual thread runs on a carrier thread from a small ForkJoinPool and unmounts when it blocks on supported I/O, locks or sleep. Millions can exist because stacks live on the heap.",
    "Platform threads are costly, forcing pools and async code that is harder to write and debug. Virtual threads restore simple blocking style at scale.",
    "Use them for many concurrent blocking tasks such as request handling, database and HTTP calls, via Executors.newVirtualThreadPerTaskExecutor or the Spring Boot property.",
    "Avoid pooling them, using them for CPU-heavy work, or unbounded fan-out to limited resources like database connections. Watch pinning in synchronized blocks on older versions and in native frames.",
    "Create with Thread.ofVirtual().start(task) or an executor, limit access to scarce resources with a Semaphore, replace ThreadLocal heavy use, and diagnose with JFR jdk.VirtualThreadPinned events.",
    "Pros: simple code, high scalability. Cons: no CPU benefit, pinning risks, tooling and library maturity, and hidden resource exhaustion downstream.",
    "Alternatives are platform thread pools, reactive programming and CompletableFuture.",
    `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> results = urls.stream()
        .map(u -> executor.submit(() -> httpClient.fetch(u)))   // blocking is fine
        .toList();
    for (var f : results) System.out.println(f.get());
}`
  ],
  "Structured Concurrency": [
    "Structured concurrency treats a group of related subtasks as one unit of work with a clear scope, so failures cancel siblings and no thread outlives its parent. In recent Java releases it is still a preview API, so enable preview features to use it.",
    "A StructuredTaskScope forks subtasks as virtual threads, joins them, and applies a policy such as shut down on first failure or first success. The scope bounds the lifetime of all its threads.",
    "Unstructured executors leak threads and orphan tasks when a parent fails, which complicates cancellation and error handling.",
    "Use it for fan-out calls where all results are needed or the first one wins, such as aggregating several service responses.",
    "Avoid relying on it in production without enabling preview and accepting API changes. For long-lived background work, ordinary executors still fit.",
    "Open a scope in try-with-resources, fork subtasks, call join, then read results or propagate exceptions. Combine with scoped values to pass context.",
    "Pros: clear lifecycle, automatic cancellation, better observability. Cons: preview status and a new mental model.",
    "Alternatives are CompletableFuture composition, ExecutorService with manual cancellation and reactive scopes.",
    `// Preview API: run with --enable-preview
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var user  = scope.fork(() -> userClient.get(id));
    var order = scope.fork(() -> orderClient.latest(id));
    scope.join().throwIfFailed();           // cancels the sibling on first failure
    return new Dashboard(user.get(), order.get());
}`
  ],

  "ConcurrentHashMap Internals": [
    "ConcurrentHashMap gives thread-safe map operations without a global lock: Java 8 and later use CAS for empty bins and synchronise only on the head node of a bin, with atomic compute and merge methods. It forbids null keys and values and its size is approximate under contention.",
    "The table is an array of bins. Insertion into an empty bin uses CAS; otherwise it locks the first node. Long chains convert to trees at length 8, and resizing is done cooperatively by several threads. Counting uses striped counters.",
    "A synchronized HashMap serialises all access, and plain HashMap breaks under concurrent writes, including infinite loops in older versions.",
    "Use it as the default shared mutable map and for caches and counters with computeIfAbsent, merge and compute.",
    "Avoid assuming compound operations are atomic when composed from separate calls, doing long work inside compute functions, or relying on size and iteration being consistent snapshots.",
    "Use map.merge(key, 1, Integer::sum) for counters, computeIfAbsent for lazy initialisation with short functions, and never modify the same map recursively inside a compute function.",
    "Pros: high concurrency, atomic bulk operations. Cons: weakly consistent iterators, no null support and subtle compound-operation pitfalls.",
    "Alternatives are Collections.synchronizedMap, ConcurrentSkipListMap for sorted access, Caffeine for caching and immutable snapshots.",
    `ConcurrentHashMap<String, LongAdder> counts = new ConcurrentHashMap<>();
counts.computeIfAbsent(word, k -> new LongAdder()).increment();

ConcurrentHashMap<String, Integer> totals = new ConcurrentHashMap<>();
totals.merge("orders", 1, Integer::sum);       // atomic read-modify-write

// NOT atomic as a pair:
if (!map.containsKey(k)) map.put(k, v);        // use putIfAbsent`
  ],
  "CopyOnWriteArrayList": [
    "CopyOnWriteArrayList copies the whole array on every write, giving cheap, snapshot-based, never-failing iteration. Use it for rarely modified lists with many readers, such as listener lists.",
    "Reads are lock-free over an immutable array reference. Each add or remove creates a new array and swaps it. Iterators see a snapshot and never throw ConcurrentModificationException.",
    "Iterating a synchronized list requires external locking, and listener lists are read often and changed seldom.",
    "Use it for event listeners, configuration lists and small read-mostly collections.",
    "Avoid it for large lists or frequent writes, where copying is expensive in time and memory, and when you need to see the latest data during iteration.",
    "Add and remove through the list methods, iterate freely, and prefer addIfAbsent for set-like behaviour. For read-mostly maps use CopyOnWriteArraySet or an immutable snapshot swapped via AtomicReference.",
    "Pros: simple safe iteration. Cons: write cost, memory churn and stale iteration views.",
    "Alternatives are ConcurrentLinkedQueue, synchronized lists, immutable lists swapped atomically and Collections.synchronizedList.",
    `List<Listener> listeners = new CopyOnWriteArrayList<>();
void fire(Event e) {
    for (Listener l : listeners) l.on(e);    // safe even if a listener unregisters itself
}
void register(Listener l) { listeners.add(l); }`
  ],
  "BlockingQueue and Producer-Consumer": [
    "A BlockingQueue lets producers put and consumers take with built-in waiting and backpressure, the standard way to implement producer-consumer. Use a bounded queue to protect memory and handle shutdown with a poison pill.",
    "Implementations include ArrayBlockingQueue (bounded array), LinkedBlockingQueue, PriorityBlockingQueue and SynchronousQueue (direct handoff). put blocks when full, take blocks when empty, and offer and poll accept timeouts.",
    "Hand-rolled wait and notify queues are error-prone, and unbounded queues hide overload until memory runs out.",
    "Use it for work queues between pipeline stages, thread-pool task queues, buffering bursts and decoupling producers and consumers.",
    "Avoid unbounded queues in production, ignoring interruption, and busy-polling instead of blocking.",
    "Producers call put, consumers call take in a loop, and shutdown by sending a poison pill or interrupting. Choose capacity from latency and memory limits and monitor queue depth.",
    "Pros: simple, safe, backpressure. Cons: capacity tuning, shutdown complexity and potential head-of-line blocking.",
    "Alternatives are message brokers for cross-process queues, Disruptor for ultra-low latency, Flow and reactive streams.",
    `BlockingQueue<Job> queue = new ArrayBlockingQueue<>(100);

// producer
queue.put(job);                           // blocks when full: backpressure

// consumer
while (true) {
    Job j = queue.take();                 // blocks when empty
    if (j == POISON) break;
    process(j);
}`
  ],
  "CountDownLatch, CyclicBarrier and Phaser": [
    "CountDownLatch lets threads wait until a count reaches zero and is single-use, CyclicBarrier makes a fixed group wait for each other and is reusable, and Phaser generalises both with dynamic parties and phases.",
    "A latch is counted down by events and awaited by others. A barrier releases all threads once all parties arrive, optionally running an action. A Phaser coordinates multiple phases with registrations.",
    "Coordinating start, finish and rendezvous points with raw wait and notify is complex and fragile.",
    "Use a latch for waiting on startup tasks or a start signal in tests, a barrier for iterative parallel algorithms, and a Phaser for dynamic participants.",
    "Avoid reusing a latch, forgetting countDown in finally (threads wait forever), and mismatched party counts on barriers.",
    "Call countDown in a finally block, always use await with a timeout where possible, and handle BrokenBarrierException by failing the whole round.",
    "Pros: clear coordination primitives. Cons: easy to hang on a missed signal, and latches are one-shot.",
    "Alternatives are CompletableFuture.allOf, structured concurrency, Semaphore and ExecutorService.invokeAll.",
    `CountDownLatch done = new CountDownLatch(3);
for (int i = 0; i < 3; i++) {
    pool.submit(() -> {
        try { work(); } finally { done.countDown(); }   // always in finally
    });
}
if (!done.await(10, TimeUnit.SECONDS)) throw new TimeoutException();`
  ],
  "Semaphore": [
    "A Semaphore limits concurrent access to a resource by issuing a fixed number of permits. It is the right tool to cap concurrency, for example database connections or downstream calls, especially with virtual threads.",
    "acquire takes a permit, blocking when none are available, and release returns it. A fair mode orders waiters, and tryAcquire offers non-blocking or timed acquisition.",
    "Some resources tolerate only limited parallelism, and unbounded concurrency overloads them.",
    "Use it for rate and concurrency limiting, resource pools, and bulkhead isolation around slow dependencies.",
    "Avoid acquiring without a guaranteed release in finally, and using it as a mutex when a lock is clearer. Permits are not owned by threads, so mistakes go unnoticed.",
    "Acquire before using the resource and release in finally, use tryAcquire with timeout to fail fast, and size permits from the downstream limit.",
    "Pros: simple concurrency cap. Cons: no ownership tracking and risk of leaking permits.",
    "Alternatives are bounded executors, Resilience4j bulkhead, connection pools and rate limiters.",
    `Semaphore limit = new Semaphore(20);       // at most 20 concurrent calls

String call(String url) throws InterruptedException {
    limit.acquire();
    try { return client.get(url); }
    finally { limit.release(); }
}`
  ],

  "Race Conditions and Thread Safety": [
    "A race condition occurs when the result depends on thread timing, typically through check-then-act or read-modify-write on shared mutable state. Fix it by eliminating sharing, making state immutable, or protecting it with proper synchronisation.",
    "Thread-safe code behaves correctly regardless of interleaving. Common races include lazy initialisation, count++ and putIfAbsent done as separate steps.",
    "Races cause intermittent corruption that passes tests and fails in production under load.",
    "Know them to review shared state, design stateless services, and choose between confinement, immutability and synchronisation.",
    "Do not assume synchronising individual methods makes a compound operation atomic, or that a thread-safe collection makes your logic safe.",
    "Prefer stateless beans and immutable data, confine mutable state to one thread, use atomic and concurrent classes for single variables, and one lock for multi-variable invariants.",
    "Pros: correctness. Cons: reduced parallelism and complexity when locks are needed.",
    "Alternatives are actors and message passing, event loops, immutable persistent data and database transactions.",
    `// Race: check-then-act
if (!map.containsKey(key)) {       // another thread may insert here
    map.put(key, compute());
}
// Fix: single atomic operation
map.computeIfAbsent(key, k -> compute());

// Race: read-modify-write
count++;                            // use AtomicInteger.incrementAndGet()`
  ],
  "Safe Publication and Immutability": [
    "Safe publication ensures that other threads see a fully constructed object. Publish through a final field, volatile reference, lock, static initialiser or a concurrent collection, and prefer immutable objects, which are safe once shared.",
    "Without a happens-before edge, another thread may see a reference to an object whose fields are still default values. Final fields get special guarantees if the constructor does not leak this.",
    "Reordering means a reference can become visible before the object's state does.",
    "Know it when sharing configuration, caches and lazily built objects across threads.",
    "Do not leak this from constructors, publish through a plain non-volatile field, or mutate objects after sharing without synchronisation.",
    "Use final fields, volatile references, the initialization-on-demand holder idiom, and store objects in concurrent collections. Prefer immutable value objects.",
    "Pros: correctness without locks. Cons: need discipline and immutable design.",
    "Alternatives are locks around every access and thread confinement.",
    `// Unsafe publication
static Config config;                  // plain field
static void init() { config = new Config(...); }

// Safe: volatile (or final, or a holder class)
static volatile Config config;

// Initialization-on-demand holder: lazy and thread-safe
class Holder { static final Config INSTANCE = new Config(); }`
  ],
  "Double-Checked Locking": [
    "Double-checked locking lazily initialises a singleton with a cheap unsynchronised first check, and is correct only if the field is volatile. Prefer the holder idiom or an enum.",
    "The pattern checks the instance, synchronises, checks again, then creates it. Without volatile, reordering can publish a reference to a partly constructed object.",
    "Synchronising every access to a lazy singleton is slow, so the first check avoids the lock after initialisation.",
    "Know it for interviews and legacy code. For new code use eager initialisation, a static holder, or an enum singleton.",
    "Do not use it without volatile, and avoid it entirely when simpler options exist.",
    "Declare the instance volatile, check twice around the synchronized block, and keep the construction inside the block.",
    "Pros: lazy and fast after init. Cons: subtle, easy to get wrong.",
    "Alternatives are the holder idiom, enum singleton, eager static initialisation and dependency injection.",
    `public final class Registry {
    private static volatile Registry instance;
    private Registry() {}

    public static Registry get() {
        Registry r = instance;
        if (r == null) {
            synchronized (Registry.class) {
                r = instance;
                if (r == null) instance = r = new Registry();
            }
        }
        return r;
    }
}`
  ],
  "Debugging Concurrency Issues": [
    "Diagnose concurrency bugs with thread dumps for hangs and deadlocks, JFR for contention, logging with thread names, and stress tests, and prevent them with design. Reproduce under load and examine states and lock owners.",
    "Typical symptoms are hangs, high CPU spinning, lost updates, corrupted state and intermittent failures. Tools include jstack, jcmd Thread.print, JFR, VisualVM and jcstress.",
    "Concurrency bugs are timing dependent, so you need evidence from live systems rather than guesses.",
    "Use it when a service hangs, threads pile up, latency spikes or results are occasionally wrong.",
    "Do not add sleeps or random synchronisation to hide a bug, since that only moves the timing.",
    "Take several thread dumps a few seconds apart, look for BLOCKED threads and lock owners, check pool queue sizes, add thread names and correlation ids to logs, and write stress tests with jcstress or repeated runs.",
    "Pros: evidence-based diagnosis. Cons: heisenbugs vanish under observation and need patience to reproduce.",
    "Alternatives are static analysis (SpotBugs, Error Prone), formal modelling and designing out shared state.",
    `# three thread dumps, 5 seconds apart
jcmd <pid> Thread.print > dump1.txt
# deadlocks are reported at the bottom of jstack output
jstack <pid> | grep -A 20 "Found one Java-level deadlock"`
  ]
};
