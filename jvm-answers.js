// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code or command example]
const SERVICE_ANSWERS = {
  "JVM Architecture Overview": [
    "The JVM loads classes through class loaders, keeps data in runtime memory areas, and executes bytecode with an interpreter and JIT compilers while a garbage collector reclaims memory. Knowing these three subsystems explains most performance and memory behaviour.",
    "Main parts: the class loader subsystem, runtime data areas (heap, thread stacks, metaspace, program counters, native stacks), the execution engine (interpreter, C1 and C2 JIT, GC) and the native interface (JNI).",
    "Java compiles to portable bytecode, so a virtual machine must load, verify, run and manage it on any platform while hiding memory management.",
    "Use this model when explaining why startup is slow, why code gets faster after warm-up, where memory goes, and when diagnosing OutOfMemoryError or latency spikes.",
    "Do not treat the JVM as a black box when tuning; blind flag changes without measuring cause regressions.",
    "Source compiles to .class files, class loaders load and link them, the interpreter starts executing, hot methods are compiled by the JIT into native code, and the GC reclaims unreachable objects on the heap.",
    "Pros: portability and managed memory. Cons: warm-up time, memory overhead, GC pauses and extra layers to understand.",
    "Alternatives are ahead-of-time compiled native images (GraalVM), other VMs such as the CLR or V8, and AOT or CDS features within the JDK."
  ],
  "Memory Areas: Heap, Stack and Metaspace": [
    "Objects live on the heap, each thread has its own stack for frames and locals, class metadata lives in native-memory metaspace, and there are also code cache and direct buffers. Different OutOfMemoryErrors map to different areas.",
    "The heap holds objects and arrays, split into young (eden and survivor spaces) and old generations. Stacks hold frames with local variables and references. Metaspace (replacing PermGen in Java 8) stores class metadata and grows in native memory.",
    "Separating areas allows different lifetimes and collection strategies: short-lived objects are cheap to collect, per-thread stacks need no GC, and class metadata is managed separately.",
    "Know it to size memory correctly (-Xmx, -Xss, MaxMetaspaceSize), understand StackOverflowError versus OutOfMemoryError, and explain container memory use beyond heap.",
    "Do not set heap equal to the container limit; the JVM also needs native memory for metaspace, thread stacks, code cache and direct buffers.",
    "Set -Xms and -Xmx (often equal), use -XX:MaxRAMPercentage in containers, cap metaspace if you load many classes dynamically, tune -Xss only when deep recursion or many threads require it, and inspect with jcmd GC.heap_info and NMT.",
    "Pros: automatic memory and clear regions. Cons: total process memory is larger than heap, and several limits must be sized together.",
    "Alternatives are off-heap storage, native memory APIs (FFM), and native images that avoid a conventional heap layout.",
    `# Inspect memory areas of a running JVM
jcmd <pid> GC.heap_info
jcmd <pid> VM.native_memory summary     # needs -XX:NativeMemoryTracking=summary
java -Xms2g -Xmx2g -XX:MaxMetaspaceSize=256m -Xss512k -jar app.jar`
  ],
  "ClassLoaders and Delegation": [
    "Class loaders load classes on demand using parent-first delegation: bootstrap, platform, then application loader, with custom loaders for plugins and containers. Class identity is class name plus loader, which explains ClassCastException across loaders and classloader leaks.",
    "The bootstrap loader loads core JDK modules, the platform loader other JDK modules, and the application loader the classpath. A loader asks its parent first, and only loads the class itself if the parent cannot.",
    "Parent-first delegation prevents applications from replacing core classes such as java.lang.String and provides a consistent type universe.",
    "Know it for application servers, plugin systems, hot reload, OSGi, and for diagnosing NoClassDefFoundError, ClassNotFoundException, linkage errors and metaspace leaks in redeployments.",
    "Avoid writing custom class loaders unless needed, and avoid sharing static state across loaders by accident. Child-first loading must be done carefully.",
    "Extend ClassLoader and override findClass to define classes from bytes, use the thread context class loader for frameworks, and ensure loaders can be garbage collected by dropping all references on undeploy.",
    "Pros: isolation, modularity and dynamic loading. Cons: complexity, leaks and confusing errors.",
    "Alternatives are JPMS layers, OSGi bundles, ServiceLoader and Spring Boot's fat jar loader.",
    `ClassLoader cl = Main.class.getClassLoader();
System.out.println(cl);                         // app class loader
System.out.println(cl.getParent());             // platform class loader
System.out.println(String.class.getClassLoader()); // null: bootstrap loader`
  ],
  "Class Loading Lifecycle": [
    "A class goes through loading, linking (verification, preparation, resolution) and initialisation, and initialisation runs static initialisers exactly once on first active use. Initialisation-order bugs and deadlocks come from this step.",
    "Loading reads the bytes and creates the Class object. Verification checks bytecode safety, preparation allocates statics with default values, resolution turns symbolic references into direct ones, and initialisation runs static blocks and assigns static values.",
    "The JVM must ensure bytecode is valid and classes are initialised once and in a thread-safe way.",
    "Know it for questions on static init order, lazy singletons, and class init deadlocks.",
    "Avoid heavy work and cross-class dependencies in static initialisers, which can deadlock or fail with ExceptionInInitializerError.",
    "Initialisation triggers on new, static method or field access, and Class.forName; keep static blocks small, and use the holder idiom for lazy init.",
    "Pros: safe, lazy loading. Cons: slower startup with many classes and subtle init failures.",
    "Alternatives are AppCDS to speed loading, and AOT features to preload and link classes."
  ],
  "JIT Compilation (C1, C2 and Tiered)": [
    "The JVM starts interpreting bytecode, profiles it, and compiles hot methods to native code with C1 (fast, light optimisation) and then C2 (aggressive optimisation). Tiered compilation explains warm-up: performance improves as code gets hot.",
    "Tiered compilation moves code from interpreter to C1 with profiling to C2 based on invocation and loop counters. The JIT performs inlining, escape analysis, loop optimisation and speculative optimisations, with deoptimisation if assumptions break.",
    "Pure interpretation is slow and ahead-of-time compilation cannot use runtime profile data. JIT gets near-native speed using observed behaviour.",
    "Know it to explain warm-up, benchmark pitfalls, slow first requests, and why long-running services reach peak performance after a while.",
    "Do not benchmark cold code or microbenchmarks without warm-up, and do not disable tiered compilation without measurements.",
    "Warm up before measuring, use JMH, inspect with -XX:+PrintCompilation, size the code cache (ReservedCodeCacheSize) if it fills up, and consider CDS, CRaC or native image for fast startup.",
    "Pros: excellent peak performance. Cons: warm-up delay, compile CPU cost, and memory for the code cache.",
    "Alternatives are GraalVM native image (AOT), the Graal JIT, and AOT cache features in newer JDKs.",
    `java -XX:+PrintCompilation -jar app.jar | head
# 'made not entrant' lines indicate deoptimisation
java -XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining -jar app.jar`
  ],
  "Escape Analysis and Inlining": [
    "Inlining replaces a call with the callee's body, enabling further optimisation, and escape analysis detects objects that never leave a method so they can be stack-allocated in effect (scalar replaced) or have locks removed. Small, simple methods help the JIT.",
    "Hot small methods are inlined within size limits. If an object does not escape, the JIT can replace its fields with locals, avoiding allocation, and remove synchronisation on thread-confined objects.",
    "Method calls and allocation have overhead, and many temporary objects would otherwise burden the GC.",
    "Know it to explain why short-lived allocations are cheap, why small methods are fine, and why microbenchmarks can mislead.",
    "Do not contort code to avoid allocation without profiling, and do not assume escape analysis always applies; large methods and megamorphic calls block it.",
    "Keep hot methods small, avoid megamorphic call sites in hot paths, measure with JMH and allocation profilers, and check inlining with PrintInlining.",
    "Pros: free speed-ups from clean code. Cons: opaque and fragile optimisations, varying by JVM version.",
    "Alternatives are manual object reuse and primitive specialisation, which usually are premature."
  ],
  "Object Memory Layout": [
    "A Java object has a header (mark word and class pointer, typically 12 bytes with compressed pointers, 8 with compact headers in newer JDKs), then fields, padded to 8-byte alignment. Many small objects therefore carry significant overhead.",
    "The header stores hash, GC age, lock state and a class reference. References are 4 bytes with compressed oops up to roughly 32 GB heap, and fields are aligned and reordered by the JVM.",
    "Understanding the layout explains memory footprints and why boxed collections cost much more than primitive arrays.",
    "Use it when estimating memory for large collections, caches and when choosing primitive arrays or specialised collections.",
    "Do not guess object sizes; measure with tools. Do not cross the compressed oops threshold accidentally with a heap just over 32 GB.",
    "Use the JOL (Java Object Layout) tool to print layouts, prefer primitive arrays for large numeric data, and consider fewer, larger objects over many small ones.",
    "Pros: predictable estimates. Cons: JVM-specific and changing between versions.",
    "Alternatives are off-heap data, primitive collections like fastutil and, in future, value classes from Project Valhalla.",
    `// Using JOL (org.openjdk.jol:jol-core)
System.out.println(ClassLayout.parseInstance(new Object()).toPrintable());
System.out.println(GraphLayout.parseInstance(list).toFootprint());`
  ],

  "Garbage Collection Basics": [
    "Garbage collection automatically reclaims objects that are no longer reachable from GC roots, using algorithms such as mark-sweep-compact and copying. The trade-off is among throughput, pause latency and memory footprint.",
    "Roots include thread stacks, static fields and JNI references. The collector marks reachable objects, then reclaims the rest, optionally compacting to reduce fragmentation. Stop-the-world pauses happen when the collector needs a consistent view.",
    "Manual memory management causes leaks and dangling pointers. GC removes these classes of bugs at the cost of runtime overhead.",
    "Know it to reason about pauses, allocation rate, heap sizing and choosing a collector.",
    "Do not call System.gc, or assume that setting references to null helps in ordinary code.",
    "Measure with GC logs, watch allocation rate, promotion rate and pause times, and pick a collector for the goal: throughput, latency or footprint.",
    "Pros: safe memory management. Cons: pauses, CPU overhead and tuning needs.",
    "Alternatives are manual management (native code), reference counting languages and region-based or arena allocation.",
    `# Enable unified GC logging
java -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar app.jar`
  ],
  "Generational Heap and Reachability": [
    "Most objects die young, so the heap is split into a young generation collected often and cheaply, and an old generation for long-lived objects. Survivors are copied between survivor spaces and promoted after surviving enough collections.",
    "New objects are allocated in eden. A minor GC copies live objects to a survivor space or promotes them to old after reaching the tenuring threshold. A full GC collects everything and is the most expensive.",
    "The weak generational hypothesis says collecting only the young region reclaims most garbage with little work.",
    "Know it to interpret GC logs, explain premature promotion, and tune young size or survivor behaviour.",
    "Avoid tuning generation sizes by hand with modern collectors that adapt. Do not allow large short-lived objects to be promoted early.",
    "Watch promotion rate and old-generation growth, avoid creating large temporary collections, and use -Xmn or G1 settings only after measuring.",
    "Pros: efficient collection of short-lived objects. Cons: cross-generation references need card tables and old-gen collections can still pause.",
    "Alternatives are non-generational collectors (older ZGC) and generational ZGC, now the default for ZGC in newer JDKs."
  ],
  "Serial and Parallel GC": [
    "Serial GC uses one thread and suits tiny heaps and containers, while Parallel GC uses many threads to maximise throughput at the cost of longer pauses. They suit batch jobs where total time matters more than pause time.",
    "Both are stop-the-world generational collectors. Parallel (the default up to Java 8) copies the young generation and compacts old with multiple threads. The JVM picks Serial automatically for small machines.",
    "Not every workload needs low pauses. Simple collectors have little overhead and the best throughput.",
    "Use Parallel for batch processing and data jobs, and Serial for small containers, CLIs and tests.",
    "Avoid them for latency-sensitive services with large heaps, where full GC pauses can last seconds.",
    "Enable with -XX:+UseParallelGC or -XX:+UseSerialGC, set -XX:ParallelGCThreads where needed, and size the heap to limit full collections.",
    "Pros: high throughput, low overhead. Cons: long stop-the-world pauses on big heaps.",
    "Alternatives are G1, ZGC and Shenandoah for latency goals."
  ],
  "G1 GC": [
    "G1 is the default collector since Java 9: it divides the heap into regions, collects the regions with the most garbage first, and targets a pause time with -XX:MaxGCPauseMillis. It balances throughput and latency for most services.",
    "G1 uses equal-size regions with remembered sets, does concurrent marking, and runs young and mixed collections incrementally. Humongous objects (half a region or more) are allocated specially.",
    "Large heaps made full-heap pauses of older collectors unacceptable. G1 bounds pauses by collecting incrementally.",
    "Use it as the default for general server applications with heaps of a few GB to tens of GB.",
    "Avoid it when you need sub-millisecond pauses or have a very large heap and strict latency, where ZGC fits better. Watch for humongous allocations and to-space exhaustion.",
    "Set heap sizes (Xms equal to Xmx), keep the pause target realistic, avoid huge temporary arrays, tune IHOP only if needed and inspect with GC logs for evacuation failures and mixed collection behaviour.",
    "Pros: good defaults, predictable pauses. Cons: higher overhead than Parallel, tuning complexity at extremes and occasional full GCs.",
    "Alternatives are ZGC, Shenandoah, Parallel GC and Serial GC.",
    `java -XX:+UseG1GC -Xms8g -Xmx8g \\
     -XX:MaxGCPauseMillis=200 \\
     -Xlog:gc*:file=gc.log -jar app.jar`
  ],
  "ZGC and Shenandoah": [
    "ZGC and Shenandoah are low-pause collectors that do most work, including compaction, concurrently with the application, keeping pauses in the sub-millisecond to few-millisecond range regardless of heap size. They trade some throughput and memory for latency.",
    "ZGC uses coloured pointers and load barriers; its generational mode (default in Java 23 and later) collects young objects separately. Shenandoah uses Brooks-style forwarding with concurrent evacuation, available in OpenJDK builds.",
    "Pause times of stop-the-world collectors grow with heap size, which breaks latency targets for large in-memory services.",
    "Use them for latency-critical systems and large heaps such as trading, real-time APIs and big caches.",
    "Avoid them for throughput-oriented batch jobs, very small heaps, or when G1 already meets latency goals. Benchmark before switching.",
    "Enable with -XX:+UseZGC (and -XX:+ZGenerational on Java 21) or -XX:+UseShenandoahGC, leave headroom in the heap for concurrent collection, and compare p99 and p999 latencies and CPU use.",
    "Pros: very short pauses at any heap size. Cons: lower peak throughput, extra memory and CPU, and fewer tuning options.",
    "Alternatives are G1, Parallel GC and commercial collectors such as Azul C4.",
    `java -XX:+UseZGC -Xmx16g -Xlog:gc -jar app.jar          # Java 23+: generational by default
java -XX:+UseZGC -XX:+ZGenerational -Xmx16g -jar app.jar  # Java 21`
  ],
  "GC Tuning and Flags": [
    "Tune GC only after measuring: choose the collector that fits your goal, size the heap sensibly, find the cause of long pauses or high allocation rates in the logs, and change one thing at a time. Fixing allocation hot spots usually beats flag tweaking.",
    "Tuning levers include collector choice, heap size (Xms and Xmx), pause targets, region and generation sizing, and container-aware percentages. Goals are throughput, latency and footprint, and you can optimise only two well.",
    "Defaults are good but not universal, and poor tuning can degrade performance or waste memory.",
    "Use it when GC logs show long pauses, frequent full GCs, allocation stalls or high GC CPU time against SLOs.",
    "Avoid cargo-cult flag lists copied from the internet, and avoid tuning before profiling the application's own allocation behaviour.",
    "Process: enable GC logging, define the SLO, analyse pause distribution and promotion, adjust heap or collector, load test, and keep only changes that helped. Reduce garbage first by avoiding needless allocation.",
    "Pros: better latency or throughput when done properly. Cons: environment specific, easily wrong and a maintenance burden.",
    "Alternatives are scaling out, reducing allocation, using a different collector and upgrading the JDK.",
    `# Typical starting point for a latency-sensitive service
java -XX:+UseG1GC -Xms4g -Xmx4g \\
     -XX:MaxGCPauseMillis=100 \\
     -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps \\
     -Xlog:gc*:file=gc.log:time,uptime -jar app.jar`
  ],
  "Reference Types: Strong, Soft, Weak and Phantom": [
    "Strong references prevent collection, soft references are cleared under memory pressure (good for caches), weak references are cleared at the next GC (used by WeakHashMap and canonicalising maps), and phantom references signal that an object is finalised, with Cleaner as the modern use.",
    "java.lang.ref provides SoftReference, WeakReference and PhantomReference, optionally registered with a ReferenceQueue to be notified when referents are collected.",
    "Some structures need to hold objects without preventing collection, such as caches and listener registries.",
    "Use WeakHashMap for metadata keyed by objects you do not own, and Cleaner for releasing native resources.",
    "Avoid SoftReference for general caching, since eviction is unpredictable; use Caffeine with size or time bounds. Do not rely on weak references for program logic.",
    "Wrap with WeakReference, call get and check for null, register with a ReferenceQueue for clean-up, and use Cleaner instead of finalizers.",
    "Pros: memory-sensitive structures. Cons: nondeterministic timing and extra GC work.",
    "Alternatives are bounded caches (Caffeine), explicit close with try-with-resources and Cleaner.",
    `WeakReference<Image> ref = new WeakReference<>(loadImage());
Image img = ref.get();                    // may be null after a GC
if (img == null) { img = loadImage(); ref = new WeakReference<>(img); }

Map<Key, Meta> meta = new WeakHashMap<>(); // entry vanishes when Key is unreachable`
  ],
  "Finalization and Cleaner": [
    "Finalizers are deprecated for removal because they are unpredictable, slow and a security risk. Use try-with-resources for deterministic cleanup and java.lang.ref.Cleaner as a safety net.",
    "Object.finalize ran before reclamation at an unspecified time on a finalizer thread, and could resurrect objects. Cleaner registers a cleaning action that runs after the owner becomes phantom reachable.",
    "Resources like native memory and file handles needed cleanup tied to object lifetime, but finalizers delayed collection and could block.",
    "Know it for legacy code and interviews. Use Cleaner only as a backup for AutoCloseable resources.",
    "Never rely on finalize or Cleaner for correctness or timely release, and do not capture the owner in the cleaning action.",
    "Implement AutoCloseable with an idempotent close, register a Cleaner action holding only the resource state, and use try-with-resources at call sites.",
    "Pros: backup cleanup. Cons: nondeterministic and costly if overused.",
    "Alternatives are try-with-resources, explicit lifecycle management and arenas in the FFM API."
  ],

  "OutOfMemoryError Types": [
    "OutOfMemoryError has distinct causes: Java heap space, GC overhead limit exceeded, Metaspace, unable to create native thread, Direct buffer memory and others. The message tells you which area to investigate, and in containers a separate OOMKilled can occur with no Java error at all.",
    "Heap space means live data exceeds the heap or a leak. Metaspace means too many classes or a classloader leak. Native thread means the OS limit or too many threads. Direct buffer memory means off-heap buffers are exhausted. Container OOM is the kernel killing the process.",
    "Each exhausted resource needs a different fix; treating all as heap problems wastes time.",
    "Know it for production incident questions and when sizing and monitoring JVMs.",
    "Do not simply raise -Xmx without investigating the cause, and do not catch OutOfMemoryError to continue as if nothing happened.",
    "Enable -XX:+HeapDumpOnOutOfMemoryError, read the exact message, analyse the dump, check thread count and metaspace, and compare process RSS with heap to find native usage.",
    "Pros: clear classification speeds diagnosis. Cons: leaks can take days to manifest, and containers hide some failures.",
    "Alternatives are memory limits with alerts, load testing for capacity and restart policies as a stopgap only.",
    `java.lang.OutOfMemoryError: Java heap space              -> leak or heap too small
java.lang.OutOfMemoryError: GC overhead limit exceeded   -> GC thrashing near full heap
java.lang.OutOfMemoryError: Metaspace                    -> classloader leak or dynamic class generation
java.lang.OutOfMemoryError: unable to create native thread -> too many threads / OS limits
java.lang.OutOfMemoryError: Direct buffer memory         -> off-heap buffers (Netty, NIO)`
  ],
  "Memory Leaks in Java": [
    "A Java leak means objects stay reachable through some reference although they are no longer needed. Typical causes are static collections, unbounded caches, listeners never removed, ThreadLocals in pools, unclosed resources and classloader leaks.",
    "Garbage collection frees only unreachable objects, so forgotten references to unneeded objects accumulate, causing steady heap growth and eventual OutOfMemoryError.",
    "Leaks cause slow degradation, long GC pauses and crashes that appear days after deployment.",
    "Suspect a leak when old generation usage grows after full GCs, GC time rises steadily, or the heap does not return to a baseline.",
    "Do not mistake high but stable usage, or a big legitimate cache, for a leak without checking the trend after GC.",
    "Monitor heap after GC, take two heap dumps over time, compare with MAT dominator trees and histograms, find the GC path to roots, then fix by bounding caches, removing listeners, calling ThreadLocal.remove and closing resources.",
    "Pros of systematic analysis: reliable root cause. Cons: dumps are large, and capture can pause the application.",
    "Alternatives are bounded caches (Caffeine), weak references where appropriate, and periodic restarts as a temporary mitigation.",
    `// Classic leak: unbounded static map
private static final Map<String, Session> CACHE = new HashMap<>();
void onLogin(Session s) { CACHE.put(s.id(), s); }   // never removed

// Fix: bounded cache with eviction
private static final Cache<String, Session> CACHE =
    Caffeine.newBuilder().maximumSize(10_000).expireAfterAccess(30, TimeUnit.MINUTES).build();`
  ],
  "Heap Dump Analysis": [
    "A heap dump is a snapshot of all live objects. Capture it with jcmd or on OutOfMemoryError, then analyse it in Eclipse MAT or VisualVM using the histogram, dominator tree and paths to GC roots to find what retains memory.",
    "The dump contains object instances, class data and references. Retained size shows how much memory would be freed if an object were collected, and the dominator tree groups objects by what they keep alive.",
    "Guessing causes of memory problems is slow. A dump shows exactly which objects dominate and who holds them.",
    "Use it for suspected leaks, large memory footprints and OutOfMemoryError investigations.",
    "Avoid taking dumps casually on huge heaps in production, since they pause the application and may contain sensitive data.",
    "Capture with jcmd GC.heap_dump or -XX:+HeapDumpOnOutOfMemoryError, open in MAT, run Leak Suspects, inspect the dominator tree, then follow paths to GC roots excluding weak references. Protect or delete dumps because they contain data.",
    "Pros: precise evidence. Cons: large files, pauses, and the need for tool experience.",
    "Alternatives are JFR old-object sampling, allocation profiling, and continuous monitoring of heap trends.",
    `jcmd <pid> GC.heap_dump /dumps/heap.hprof
# or automatically
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps -jar app.jar
# open heap.hprof in Eclipse MAT -> Leak Suspects -> Dominator Tree`
  ],
  "Thread Dump Analysis": [
    "A thread dump lists every thread's state and stack. Take several dumps a few seconds apart and look for blocked threads, lock owners, pools full of waiting threads, and many threads at the same frame to find deadlocks, contention and stuck calls.",
    "Capture with jstack or jcmd Thread.print. Each entry shows name, state, held and awaited monitors and a stack trace. jstack also reports detected Java-level deadlocks.",
    "Hangs and slowness need a view of what every thread is doing right now.",
    "Use it when requests hang, CPU is high, thread pools are exhausted or latency spikes.",
    "Avoid drawing conclusions from one dump; patterns across several dumps matter.",
    "Take three dumps at intervals, group threads by identical stacks, find BLOCKED threads and the thread holding the lock, check pool threads waiting on slow dependencies, and use tools like fastThread to summarise.",
    "Pros: fast, low overhead, and very informative. Cons: a snapshot only, and native or JIT issues need other tools.",
    "Alternatives are JFR, async-profiler and APM thread views.",
    `jcmd <pid> Thread.print > dump.txt
grep -c "BLOCKED" dump.txt
# find who holds the lock a blocked thread waits for:
#   - waiting to lock <0x000000076ab62208>
#   - locked <0x000000076ab62208>`
  ],
  "High CPU Troubleshooting": [
    "To debug high CPU, find the busiest threads with top -H, convert the thread id to hex, and match it to the nid in a thread dump. The cause is usually a busy loop, excessive GC, regex backtracking, or hot code, and a profiler confirms it.",
    "High CPU can come from application threads, GC threads or JIT compiler threads. Per-thread CPU identifies which category dominates.",
    "CPU saturation causes latency and cost, and the cause must be found quickly during incidents.",
    "Use it when a service shows sustained CPU usage beyond expected load.",
    "Do not restart before capturing evidence, and do not assume GC or application code without checking per-thread data.",
    "Run top -H -p pid, convert the TID to hex with printf, find the matching nid in jstack output, inspect the stack, check GC logs for GC thrashing, and confirm with async-profiler or JFR CPU samples.",
    "Pros: a quick path to the cause. Cons: needs shell access and good timing.",
    "Alternatives are continuous profiling tools, APM and JFR recordings.",
    `top -H -p <pid>                  # find the hottest thread id, e.g. 12345
printf "%x\\n" 12345              # -> 3039
jstack <pid> | grep -A 15 "nid=0x3039"`
  ],
  "GC Log Analysis": [
    "Read GC logs for pause durations, frequency, heap after GC and promotion trends. Rising post-GC usage suggests a leak, frequent young collections mean a high allocation rate, and long pauses or full GCs show sizing or collector problems.",
    "Unified logging (-Xlog:gc*) records each collection with type, cause, pause time and before and after sizes. Tools like GCeasy or GCViewer visualise them.",
    "GC behaviour is the main source of JVM latency problems, and logs are cheap and always-on evidence.",
    "Use it for latency investigations, capacity planning and validating tuning changes.",
    "Avoid reading single pauses in isolation; look at distributions, causes and trends.",
    "Enable logging with rotation in production, review pause percentiles, allocation and promotion rates, check causes such as Allocation Failure or Humongous Allocation, and compare before and after tuning.",
    "Pros: low overhead, detailed. Cons: format differs by collector and requires interpretation.",
    "Alternatives are JFR GC events, JMX metrics and Micrometer GC metrics.",
    `java -Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=5,filesize=20m -jar app.jar
# Look for: Pause Young / Pause Full, 'To-space exhausted', Humongous allocations`
  ],
  "Off-heap and Direct Memory": [
    "Off-heap memory (direct ByteBuffers, native libraries, thread stacks, metaspace, code cache) is not governed by -Xmx, so a process can be OOM-killed with a healthy heap. Track it with Native Memory Tracking and bound direct memory.",
    "Direct buffers are allocated outside the heap with ByteBuffer.allocateDirect and freed when their owning object is collected. Netty and NIO use them for zero-copy I/O. The FFM API gives safe native memory access.",
    "Off-heap avoids GC cost for large or long-lived buffers and enables efficient I/O.",
    "Use it for high-performance networking, large caches and native interoperability.",
    "Avoid it for ordinary data, and do not forget limits. Leaks do not show in heap dumps and can end in container kills.",
    "Set -XX:MaxDirectMemorySize, enable -XX:NativeMemoryTracking=summary and use jcmd VM.native_memory, use pooled buffers (Netty) and release ByteBufs, and leave container memory headroom beyond heap.",
    "Pros: less GC pressure and fast I/O. Cons: manual management, leaks invisible to heap tools and harder debugging.",
    "Alternatives are on-heap byte arrays, memory-mapped files and the FFM API with arenas.",
    `java -XX:MaxDirectMemorySize=512m -XX:NativeMemoryTracking=summary -jar app.jar
jcmd <pid> VM.native_memory summary`
  ],

  "Java Flight Recorder and Mission Control": [
    "JFR is a low-overhead, always-on event recorder built into the JVM that captures CPU samples, allocations, locks, GC and I/O, and JDK Mission Control analyses the recordings. It is the first tool to use for production profiling.",
    "JFR records timestamped events into a ring buffer or file with typically one to two percent overhead. Custom events can be added. Recordings open in JMC or can be parsed programmatically.",
    "Production issues need evidence without heavy tools. JFR gives it safely with the default profile.",
    "Use it for investigating latency, allocation hot spots, lock contention, GC and virtual thread pinning in production.",
    "Avoid enabling the most detailed settings continuously, and do not expect it to replace distributed tracing.",
    "Start with jcmd JFR.start duration and filename, or -XX:StartFlightRecording at launch, open the file in JMC, check hot methods, allocation by site, locks and GC pauses.",
    "Pros: built in, low overhead and rich events. Cons: sampling limits and a learning curve in JMC.",
    "Alternatives are async-profiler, VisualVM, APM agents and eBPF profilers.",
    `jcmd <pid> JFR.start name=perf settings=profile duration=120s filename=/tmp/perf.jfr
java -XX:StartFlightRecording=filename=startup.jfr,duration=60s -jar app.jar
jfr print --events jdk.GarbageCollection /tmp/perf.jfr`
  ],
  "VisualVM, JConsole and async-profiler": [
    "JConsole and VisualVM give a quick live view of memory, threads and CPU, while async-profiler produces accurate CPU, allocation and lock flame graphs with low overhead and no safepoint bias. Use flame graphs to find hot paths.",
    "VisualVM and JConsole attach via JMX for monitoring and basic sampling. async-profiler uses AsyncGetCallTrace and perf events to sample stacks, generating flame graphs.",
    "Visual evidence of where time and allocations go beats guessing about performance.",
    "Use VisualVM for quick local checks and async-profiler for production-grade CPU and allocation profiling.",
    "Avoid safepoint-biased profilers for hot code analysis, and avoid profiling without realistic load.",
    "Run ./asprof -e cpu -d 30 -f flame.html pid for CPU, -e alloc for allocations and -e lock for contention, then read the widest frames in the flame graph.",
    "Pros: precise, low overhead. Cons: needs native access and permissions, and flame graph reading takes practice.",
    "Alternatives are JFR, commercial profilers (YourKit, JProfiler) and APM continuous profilers.",
    `./asprof -e cpu   -d 30 -f cpu.html   <pid>
./asprof -e alloc -d 30 -f alloc.html <pid>
./asprof -e lock  -d 30 -f lock.html  <pid>`
  ],
  "JMH Microbenchmarking": [
    "JMH is the standard harness for Java microbenchmarks, handling warm-up, forking, dead-code elimination and statistics. Naive timing loops are almost always wrong because of JIT effects.",
    "Benchmarks are annotated methods with @Benchmark, run in forked JVMs with warm-up and measurement iterations. Blackhole consumes results so the JIT cannot remove the work.",
    "Microbenchmarks mislead without handling warm-up, inlining, constant folding and GC noise.",
    "Use it to compare small algorithms or data-structure choices, and to validate optimisation claims.",
    "Avoid micro-optimising without a profile showing the code is hot, and do not extrapolate microbenchmark results to whole-system behaviour.",
    "Add the jmh dependencies, annotate with @State and @Benchmark, return values or use Blackhole, use several forks, and run with realistic inputs and parameters.",
    "Pros: reliable measurements. Cons: setup effort and narrow scope.",
    "Alternatives are load tests (Gatling, k6, JMeter), profiling in production and simple timing for rough checks.",
    `@State(Scope.Thread)
@BenchmarkMode(Mode.AverageTime) @OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 3) @Measurement(iterations = 5) @Fork(2)
public class ConcatBench {
    String a = "hello", b = "world";
    @Benchmark public String plus()    { return a + b; }
    @Benchmark public String builder() { return new StringBuilder().append(a).append(b).toString(); }
}`
  ],
  "Important JVM Flags": [
    "Know a short list of flags: heap size (-Xms, -Xmx, -XX:MaxRAMPercentage), collector selection, GC logging, heap dump on OOM, metaspace limit, stack size and diagnostic flags. Prefer a few well-understood flags over long copied lists.",
    "Flags fall into standard (-D, -X), advanced (-XX:+Name or -XX:Name=value) and diagnostic or experimental groups, some requiring unlock options.",
    "The right few flags make JVMs predictable in production and diagnosable after failure.",
    "Use them when configuring production services and containers, and when diagnosing issues.",
    "Avoid obsolete flags and cargo-culted lists, since defaults change between versions. Check java -XX:+PrintFlagsFinal to see actual values.",
    "Set heap and collector explicitly, enable GC logging and OOM heap dumps, use MaxRAMPercentage in containers, and verify with -XX:+PrintFlagsFinal.",
    "Pros: control and observability. Cons: version dependence and risk of wrong tuning.",
    "Alternatives are JAVA_TOOL_OPTIONS in the environment, JDK_JAVA_OPTIONS and container-aware defaults.",
    `-Xms4g -Xmx4g                      # fixed heap
-XX:MaxRAMPercentage=75            # container-aware sizing
-XX:+UseG1GC                       # or -XX:+UseZGC
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps
-Xlog:gc*:file=gc.log:time,uptime
-XX:+ExitOnOutOfMemoryError        # let the orchestrator restart the pod`
  ],

  "Performance Tuning Methodology": [
    "Tune performance scientifically: define a target (SLO, p99 latency, throughput), measure under realistic load, profile to find the real bottleneck, change one thing, and re-measure. Most gains come from fixing the top hotspot, usually I/O, queries or allocation, not from flags.",
    "The loop is measure, profile, hypothesise, change, verify. Use percentiles rather than averages, test with production-like data and load, and watch resource saturation (CPU, memory, I/O, connections).",
    "Guesswork and premature optimisation waste effort and often make code worse without improving what users experience.",
    "Use it when latency or throughput goals are missed, before capacity purchases and after releases that regress performance.",
    "Avoid optimising without a measured problem, using averages that hide tail latency, or benchmarking on unrealistic hardware or data.",
    "Establish a baseline, load test with k6 or Gatling, profile with JFR or async-profiler, inspect database and downstream latency, fix the largest contributor, and add regression tests and dashboards.",
    "Pros: durable, evidence-based improvements. Cons: needs infrastructure and discipline.",
    "Alternatives are scaling out or up, caching, and architectural changes when software tuning is exhausted."
  ],
  "Common Performance Pitfalls": [
    "Frequent culprits are N+1 queries, missing indexes, chatty remote calls, blocking in the wrong pool, excessive allocation and boxing, string concatenation in loops, synchronisation hot spots, unbounded caches and logging overhead. Fix I/O and algorithmic issues first.",
    "Most latency in services comes from waiting on I/O: databases, networks and locks. CPU-level problems include needless object creation, inefficient algorithms and regex backtracking.",
    "Knowing the usual suspects speeds up diagnosis and code review.",
    "Use it as a checklist in reviews and when investigating slow endpoints.",
    "Avoid micro-optimisations while ignoring big issues like an N+1 query that costs hundreds of milliseconds.",
    "Check query counts per request, add indexes, batch and cache remote calls, use primitive streams and presized collections, avoid synchronising hot paths, parametrise logging and bound all queues and caches.",
    "Pros: big wins for little work. Cons: requires profiling to confirm each suspicion.",
    "Alternatives are architectural changes such as async processing, read replicas and caching layers.",
    `// Logging: avoids building the string when DEBUG is off
log.debug("order {} total {}", id, total);          // good
log.debug("order " + id + " total " + total);       // builds string always

// N+1: one query per order
for (Order o : orders) o.getItems().size();         // triggers a query each time`
  ],
  "JVM in Containers": [
    "Modern JVMs read container limits (cgroups), but you must size memory for heap plus native overhead, set MaxRAMPercentage instead of a fixed Xmx, watch CPU limits that shrink thread pools, and avoid heap equal to the memory limit to prevent OOMKilled.",
    "The JVM detects CPU and memory limits from cgroups and derives available processors and default heap size (a quarter of memory unless configured). CPU throttling with low limits can cause latency spikes.",
    "Early JVMs ignored limits and were killed by the kernel; teams must still size and observe memory correctly.",
    "Use it for any Java workload on Kubernetes or Docker, including requests and limits, probes and graceful shutdown.",
    "Avoid tiny CPU limits that throttle GC and JIT, heap set to 100 percent of the limit, and ignoring native memory.",
    "Set -XX:MaxRAMPercentage around 70 to 75, give memory limit headroom, set requests equal to limits for predictability, tune GC threads for CPU limits, handle SIGTERM for graceful shutdown, and monitor RSS and throttling.",
    "Pros: portable, repeatable deployments. Cons: more variables and subtle throttling issues.",
    "Alternatives are native images with smaller footprints, and CRaC or CDS to speed startup.",
    `# Kubernetes container
resources:
  requests: { cpu: "2", memory: "2Gi" }
  limits:   { cpu: "2", memory: "2Gi" }
env:
  - name: JAVA_TOOL_OPTIONS
    value: "-XX:MaxRAMPercentage=70 -XX:+ExitOnOutOfMemoryError"`
  ],
  "CDS, AOT and Startup Time": [
    "Class Data Sharing (AppCDS) maps pre-parsed classes from an archive to speed startup and cut memory, newer JDKs add AOT class loading and linking caches, and CRaC or native image go further. Choose by startup, peak performance and operational cost.",
    "CDS stores class metadata in a shared archive created at build or first run. AOT cache features pre-load and link classes, and Spring Boot supports CDS and AOT processing. CRaC restores a checkpointed process.",
    "Serverless and autoscaling workloads suffer from slow JVM startup and warm-up.",
    "Use AppCDS for a cheap startup win, CRaC where supported for near-instant restart, and native image for tiny footprints and fast cold starts.",
    "Avoid native image if you rely on heavy reflection or need peak throughput, and avoid complexity if startup is not a problem.",
    "Create an archive with -XX:ArchiveClassesAtExit=app.jsa, run with -XX:SharedArchiveFile=app.jsa, and in Spring Boot use the CDS support in the build. Measure startup before and after.",
    "Pros: faster startup, lower memory. Cons: build steps, archive tied to JDK and classpath, and checkpoint security considerations for CRaC.",
    "Alternatives are GraalVM native image, lazy initialisation, fewer dependencies and keeping instances warm.",
    `java -XX:ArchiveClassesAtExit=app.jsa -jar app.jar          # create archive
java -XX:SharedArchiveFile=app.jsa -jar app.jar              # use it`
  ],
  "Future JVM Projects (Valhalla, Panama, Leyden)": [
    "Valhalla brings value classes to remove object overhead, Panama provides the Foreign Function and Memory API for safe native interop, Leyden improves startup and warm-up through ahead-of-time caching, and Loom delivered virtual threads. Know the direction, not the details.",
    "Valhalla aims for flat, identity-free value objects and specialised generics. Panama's FFM API (final in Java 22) replaces JNI. Leyden adds AOT caches and condensers. Amber delivers language features like records and pattern matching.",
    "The platform needs better memory density, native access, startup and developer ergonomics to compete with newer runtimes.",
    "Mention them to show awareness when asked about the future of Java or modernising large systems.",
    "Do not depend on preview or incubating features in production without a plan for API changes.",
    "Track JEPs, try early-access builds in non-production, and adopt features when they become final in an LTS release.",
    "Pros: significant gains ahead. Cons: timelines vary and some pieces are still evolving.",
    "Alternatives are existing workarounds: primitive arrays, JNI, GraalVM and manual caching."
  ]
};
