// Each entry: [interview summary, requirements/entities, why asked, scale and constraints, common mistakes, classes and flow, trade-offs, variations, optional Java skeleton]
const SECTION_LABELS = ["Definition (Requirements)", "Motivation (Why it is asked)", "Context (Scale and constraints)", "Anti-Context (Common mistakes)", "Implementation (Classes and flow)", "Trade-offs (Pros & Cons)", "Alternatives (Variations)", "Example"];
const SERVICE_ANSWERS = {
  "OOD Interview Approach": [
    "Spend the first five minutes clarifying requirements and scope, then identify entities, relationships and behaviours, sketch the class diagram, and code the core flow. Talk through trade-offs and extension points as you go instead of jumping straight into code.",
    "Steps: clarify functional and non-functional requirements, list use cases, extract nouns as entities and verbs as methods, define interfaces and relationships, then implement the main flow and one edge case. Agree explicitly on what is out of scope, such as persistence or UI.",
    "Interviewers test how you handle ambiguity, model a domain, apply SOLID and patterns judiciously, and communicate. The code itself matters less than the structure and reasoning.",
    "Typically 45 to 60 minutes, in-memory, single JVM, and usually the code must compile in spirit rather than run. Concurrency and extensibility are often added as a follow-up.",
    "Common mistakes are coding before clarifying, drawing dozens of classes, forcing patterns where they add nothing, using inheritance where composition fits, and never showing the main flow end to end.",
    "Start with enums and value objects, define interfaces only where you expect variation (strategy, state), keep entities small, put orchestration in a service class, and make dependencies injected. Walk a happy path and one failure path through your classes.",
    "Pros: a repeatable framework reduces panic and shows seniority. Cons: spending too long on requirements or diagrams leaves no time to implement, so timebox each phase.",
    "Variations are whiteboard-only diagram interviews, pair-programming style where code must run with tests, and API-first designs that start from method signatures.",
    `// Step 1: nouns become types, verbs become methods
enum VehicleType { BIKE, CAR, TRUCK }
record Vehicle(String plate, VehicleType type) {}

// Step 2: interface only where variation is expected
interface PricingStrategy { long fee(java.time.Duration stayed); }

// Step 3: a thin service orchestrates the flow
class ParkingService {
    private final PricingStrategy pricing;
    ParkingService(PricingStrategy pricing) { this.pricing = pricing; }
    long checkout(java.time.Instant in, java.time.Instant out) {
        return pricing.fee(java.time.Duration.between(in, out));
    }
}`
  ],
  "Class Diagrams and Relationships": [
    "A class diagram shows types, their fields and methods, and relationships: association, aggregation, composition, inheritance, realisation and dependency. In interviews, show only the key classes, their multiplicity and the relationships that drive the design.",
    "Inheritance is an is-a relationship (solid line, hollow triangle), realisation is a class implementing an interface (dashed line, hollow triangle), association is a has-a reference, aggregation is a weak whole-part, composition is a strong whole-part where parts die with the whole, and dependency is a transient use.",
    "It is the shared language for communicating a design before coding, and interviewers use it to check whether you can model ownership and lifecycle correctly.",
    "Use it at the start of any LLD answer and again when explaining how patterns such as strategy, state or observer connect the classes.",
    "Do not draw every getter, every field or every helper; do not confuse aggregation with composition, and do not use inheritance arrows where composition is intended.",
    "Map to Java as follows: inheritance is extends, realisation is implements, association is a field, composition is a field created and owned by the whole (often final and never exposed), aggregation is a field passed in from outside, and dependency is a parameter or local variable.",
    "Pros: clear communication and early detection of bad coupling. Cons: diagrams drift from code, and heavy UML is slow to draw on a whiteboard.",
    "Alternatives are simple box-and-arrow sketches, sequence diagrams for flows, state diagrams for lifecycles, and plain code skeletons.",
    `interface Payment { void pay(long cents); }               // realisation target
class CardPayment implements Payment {                      // realisation
    public void pay(long cents) { /* charge card */ }
}
class Order {
    private final List<OrderLine> lines = new ArrayList<>();  // composition: lines owned by Order
    private final Customer customer;                          // association/aggregation: passed in
    Order(Customer customer) { this.customer = customer; }
    void checkout(Payment p) { p.pay(total()); }              // dependency on Payment
    long total() { return lines.stream().mapToLong(OrderLine::cents).sum(); }
}
record OrderLine(String sku, int qty, long cents) {}
record Customer(String id) {}`
  ],
  "Concurrency in LLD": [
    "Most LLD problems get a thread-safety follow-up, so identify the shared mutable state, pick the smallest correct locking scope, and prefer immutability and concurrent collections over coarse locks. Atomic check-then-act is the core issue, as in two users booking the same seat.",
    "Identify which objects are shared between threads, which operations must be atomic (check-then-act, read-modify-write), and which invariants must hold. Choose between synchronized, ReentrantLock, ReadWriteLock, atomics, ConcurrentHashMap compound methods and immutable snapshots.",
    "Interviewers want to see that you recognise race conditions, avoid deadlock, and can reason about lock granularity, not only that you know the keywords.",
    "Applies to booking systems, caches, rate limiters, schedulers, brokers and any in-memory store accessed by many request threads. Contention level and read/write ratio drive the choice.",
    "Common mistakes are synchronizing every method, locking on public objects, calling external code under a lock, using a ConcurrentHashMap with get then put instead of compute, and acquiring multiple locks in inconsistent order.",
    "Keep state private, make value objects immutable, use ConcurrentHashMap.compute or putIfAbsent for per-key atomicity, use per-resource locks with consistent ordering for multi-resource operations, and use tryLock with timeouts where blocking is unacceptable.",
    "Pros: per-key or per-resource locks give high throughput. Cons: more complex reasoning, deadlock risk across locks, and lock-free code is easy to get wrong.",
    "Alternatives are single-threaded event loops or actors, optimistic locking with version checks, CAS loops, and delegating atomicity to a database or Redis.",
    `class SeatInventory {
    private final Map<String, ReentrantLock> locks = new ConcurrentHashMap<>();
    private final Set<String> booked = ConcurrentHashMap.newKeySet();

    boolean book(String seatId) {
        ReentrantLock lock = locks.computeIfAbsent(seatId, k -> new ReentrantLock());
        lock.lock();
        try {
            return booked.add(seatId);      // atomic check-then-act under the seat lock
        } finally {
            lock.unlock();
        }
    }
}`
  ],
  "Design a Parking Lot": [
    "Model ParkingLot, Floor, ParkingSpot (by type), Vehicle, Ticket and a pricing strategy. Parking assigns the nearest compatible free spot and issues a ticket, and exit computes the fee through a strategy and frees the spot.",
    "Requirements: multiple floors with spots of different sizes, park and unpark vehicles, issue tickets, calculate fees by duration and vehicle type, and report availability. Entities: ParkingLot, ParkingFloor, ParkingSpot, Vehicle, Ticket, PricingStrategy, Payment.",
    "A classic that tests entity modelling, enums, strategy for pricing and spot allocation, and concurrency on spot assignment.",
    "Hundreds to thousands of spots, multiple entry and exit gates operating concurrently, in-memory state. Allocation must be atomic so one spot is never given to two vehicles.",
    "Mistakes include hard-coding fees with if-else on vehicle type, one giant ParkingLot class, subclassing a Vehicle class per type without behavioural difference, and ignoring concurrent allocation.",
    "ParkingLot holds floors and a SpotAllocationStrategy (nearest, first free). Park: strategy finds a free compatible spot, spot is marked occupied atomically, a Ticket is created with entry time. Unpark: look up the ticket, PricingStrategy computes the fee, spot is released.",
    "Pros: pricing and allocation are pluggable and unit-testable. Cons: a global lock on allocation limits throughput, while per-floor locks or free-spot queues per type add complexity.",
    "Extensions: reservations, EV charging spots, multiple payment methods, display boards per floor, monthly passes, and a distributed lot with a database for state.",
    `enum SpotType { MOTORCYCLE, COMPACT, LARGE }
enum VehicleType { MOTORCYCLE(SpotType.MOTORCYCLE), CAR(SpotType.COMPACT), TRUCK(SpotType.LARGE);
    final SpotType needs; VehicleType(SpotType s) { needs = s; } }
record Vehicle(String plate, VehicleType type) {}
record Ticket(String id, String spotId, Vehicle vehicle, java.time.Instant entry) {}

class ParkingSpot {
    final String id; final SpotType type; private Vehicle current;
    ParkingSpot(String id, SpotType type) { this.id = id; this.type = type; }
    synchronized boolean tryOccupy(Vehicle v) { if (current != null) return false; current = v; return true; }
    synchronized void free() { current = null; }
}
interface PricingStrategy { long fee(Ticket t, java.time.Instant exit); }
class HourlyPricing implements PricingStrategy {
    public long fee(Ticket t, java.time.Instant exit) {
        long hours = Math.max(1, java.time.Duration.between(t.entry(), exit).toHours());
        return hours * 50;
    }
}
class ParkingLot {
    private final List<ParkingSpot> spots; private final PricingStrategy pricing;
    private final Map<String, Ticket> active = new ConcurrentHashMap<>();
    ParkingLot(List<ParkingSpot> spots, PricingStrategy pricing) { this.spots = spots; this.pricing = pricing; }
    Optional<Ticket> park(Vehicle v) {
        for (ParkingSpot s : spots) {
            if (s.type == v.type().needs && s.tryOccupy(v)) {
                Ticket t = new Ticket(UUID.randomUUID().toString(), s.id, v, java.time.Instant.now());
                active.put(t.id(), t);
                return Optional.of(t);
            }
        }
        return Optional.empty();
    }
    long unpark(String ticketId) {
        Ticket t = active.remove(ticketId);
        spots.stream().filter(s -> s.id.equals(t.spotId())).findFirst().orElseThrow().free();
        return pricing.fee(t, java.time.Instant.now());
    }
}`
  ],
  "Design an Elevator System": [
    "Model Elevator as a state machine (IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN) with a request queue, and a Dispatcher that assigns external hall calls to an elevator using a scheduling strategy such as nearest-car or SCAN. Separate internal cabin requests from external requests.",
    "Requirements: multiple elevators and floors, hall calls with a direction, cabin floor selection, door open and close, and a scheduling policy. Entities: ElevatorController or Dispatcher, ElevatorCar, Request, Direction, ElevatorState, Floor.",
    "It tests state modelling, scheduling algorithms, strategy for dispatch, and concurrency between request threads and the car movement loop.",
    "A building with 10 to 100 floors and a few cars, in-memory, with requests arriving concurrently while cars move. Fairness and avoiding starvation matter.",
    "Common mistakes are if-else chains on state instead of a state pattern, a single global queue with no direction awareness, forgetting the door and idle states, and mutating shared stop sets without synchronisation.",
    "Each car keeps sorted sets of up-stops and down-stops. The car loop serves stops in its current direction, then reverses (SCAN). The Dispatcher's strategy picks the car with minimal cost, preferring cars already moving toward the floor in the same direction, and calls car.addStop(floor).",
    "Pros: SCAN reduces direction changes and is simple to reason about. Cons: not optimal for average wait time, and destination dispatch or machine-learned scheduling is more complex.",
    "Extensions: destination-dispatch panels, weight limits, express and maintenance modes, priority floors, and simulating time ticks instead of real threads.",
    `enum Direction { UP, DOWN, IDLE }

class ElevatorCar {
    final int id;
    private int floor = 0;
    private Direction dir = Direction.IDLE;
    private final NavigableSet<Integer> stops = new TreeSet<>();

    ElevatorCar(int id) { this.id = id; }
    synchronized void addStop(int f) {
        stops.add(f);
        if (dir == Direction.IDLE) dir = f > floor ? Direction.UP : Direction.DOWN;
    }
    synchronized void step() {                      // one movement tick
        if (stops.isEmpty()) { dir = Direction.IDLE; return; }
        Integer next = dir == Direction.UP ? stops.ceiling(floor) : stops.floor(floor);
        if (next == null) {                          // reverse direction (SCAN)
            dir = dir == Direction.UP ? Direction.DOWN : Direction.UP;
            return;
        }
        if (next == floor) { stops.remove(next); /* open doors */ return; }
        floor += next > floor ? 1 : -1;
    }
    synchronized int cost(int target) {
        int distance = Math.abs(target - floor);
        return dir == Direction.IDLE ? distance : distance + stops.size();
    }
}

interface DispatchStrategy { ElevatorCar pick(List<ElevatorCar> cars, int floor); }
class NearestCar implements DispatchStrategy {
    public ElevatorCar pick(List<ElevatorCar> cars, int floor) {
        return cars.stream().min(Comparator.comparingInt(c -> c.cost(floor))).orElseThrow();
    }
}`
  ],
  "Design a Vending Machine": [
    "Use the State pattern with states such as Idle, HasMoney, Dispensing and OutOfStock, a Product inventory, and a coin or payment handler. Each state defines which actions (insert money, select product, cancel) are legal and what the next state is.",
    "Requirements: select an item, insert coins or notes, dispense the item, return change, refund on cancel, and track inventory. Entities: VendingMachine, Product, Slot or Inventory, Coin, State, Dispenser.",
    "It is the textbook State pattern question and tests how you eliminate conditional logic on mode and handle invalid transitions.",
    "Single machine, single user at a time, small inventory, in-memory. Money must be handled in integer cents and change-making needs a defined policy.",
    "Mistakes include boolean flags such as hasMoney and isDispensing instead of states, using double for money, no handling of insufficient change, and states that hold their own copy of machine data.",
    "VendingMachine holds the current State and delegates insertMoney, select and cancel to it. Each State implements all operations, throwing or ignoring invalid ones, and calls machine.setState(next). Inventory decrements atomically on dispense.",
    "Pros: new states are new classes and each transition is explicit. Cons: many small classes for a simple machine, and shared data must be accessed through the context.",
    "Extensions: card or UPI payments, multiple coin denominations with a change-making strategy (greedy or DP), restocking admin mode, and remote monitoring.",
    `interface State {
    void insert(VendingMachine m, int cents);
    void select(VendingMachine m, String code);
    void cancel(VendingMachine m);
}
class VendingMachine {
    private State state = new Idle();
    int balance;
    final Map<String, Integer> stock = new HashMap<>();
    final Map<String, Integer> price = new HashMap<>();
    void setState(State s) { state = s; }
    void insert(int c) { state.insert(this, c); }
    void select(String code) { state.select(this, code); }
    void cancel() { state.cancel(this); }
}
class Idle implements State {
    public void insert(VendingMachine m, int cents) { m.balance += cents; m.setState(new HasMoney()); }
    public void select(VendingMachine m, String code) { throw new IllegalStateException("Insert money first"); }
    public void cancel(VendingMachine m) { }
}
class HasMoney implements State {
    public void insert(VendingMachine m, int cents) { m.balance += cents; }
    public void select(VendingMachine m, String code) {
        if (m.stock.getOrDefault(code, 0) == 0) throw new IllegalStateException("Sold out");
        int p = m.price.get(code);
        if (m.balance < p) throw new IllegalStateException("Need " + (p - m.balance) + " more");
        m.stock.merge(code, -1, Integer::sum);
        int change = m.balance - p;                  // return change to the user here
        m.balance = 0;
        m.setState(new Idle());
    }
    public void cancel(VendingMachine m) { m.balance = 0; m.setState(new Idle()); }
}`
  ],
  "Design Tic-Tac-Toe": [
    "Model Board, Player, Move and Game with a status. Make moves O(1) by tracking row, column and diagonal counters per player instead of scanning the board, and keep the board size and win length configurable.",
    "Requirements: an N by N board, two players alternating, validate moves, detect win or draw, and report the winner. Entities: Game, Board, Player, Symbol, Move, GameStatus.",
    "It looks trivial, so it tests clean modelling, O(1) win detection and extensibility to N by N, more players or an undo feature.",
    "Tiny state, single game, in-memory. The follow-ups are generalisation (N by N, K in a row), undo and an AI player, and sometimes multiple concurrent games.",
    "Mistakes include scanning the whole board after every move, hard-coding 3, mixing console input with game logic, and not rejecting moves on occupied cells or after the game has ended.",
    "Game owns the Board and the current player index. makeMove validates bounds, occupancy and game status, places the symbol, updates per-player row, column and two diagonal counters, and if any counter reaches N sets a win, else if moves equal N squared sets a draw, otherwise switches player.",
    "Pros: O(1) per move and simple. Cons: counters only support the full-line win rule, and K-in-a-row on a larger board needs a local scan around the last move.",
    "Extensions: undo with a move stack, AI player strategy (minimax), more than two players, a replayable move history and a game manager for concurrent games.",
    `enum Status { IN_PROGRESS, WON, DRAW }

class Game {
    private final int n;
    private final char[][] grid;
    private final int[][] rows, cols;          // [player][index]
    private final int[] diag, anti;
    private int moves, current;
    private Status status = Status.IN_PROGRESS;

    Game(int n) {
        this.n = n; grid = new char[n][n];
        rows = new int[2][n]; cols = new int[2][n];
        diag = new int[2]; anti = new int[2];
    }
    Status move(int r, int c) {
        if (status != Status.IN_PROGRESS) throw new IllegalStateException("Game over");
        if (r < 0 || c < 0 || r >= n || c >= n || grid[r][c] != 0) throw new IllegalArgumentException("Bad move");
        grid[r][c] = current == 0 ? 'X' : 'O';
        int p = current;
        boolean win = ++rows[p][r] == n | ++cols[p][c] == n;
        if (r == c) win |= ++diag[p] == n;
        if (r + c == n - 1) win |= ++anti[p] == n;
        moves++;
        if (win) status = Status.WON;
        else if (moves == n * n) status = Status.DRAW;
        else current = 1 - current;
        return status;
    }
    int currentPlayer() { return current; }
}`
  ],
  "Design a Movie Ticket Booking System": [
    "Model Movie, Theatre, Screen, Show, Seat, Booking and Payment. The hard part is preventing double booking: lock seats for a show with a short hold, then confirm on payment or release on timeout.",
    "Requirements: browse movies and shows by city, view the seat map, select seats, hold them for a few minutes, pay, and receive a booking, with cancellation. Entities: Movie, Theatre, Screen, Show, ShowSeat (with status), Booking, Payment, User.",
    "It tests modelling of a many-to-many domain and, most importantly, concurrency and state for seat reservation, plus the hold-and-expire flow.",
    "Many users competing for the same popular show, seat holds of 5 to 10 minutes, and payment that can fail or time out. In an interview it is in-memory, but you should mention a database with row locks or optimistic versioning.",
    "Mistakes include checking availability and then booking without atomicity, modelling Seat as shared across shows, no hold expiry, and charging before the seats are held.",
    "A ShowSeat has a status (AVAILABLE, HELD, BOOKED) and holdExpiry. BookingService.hold(show, seats) atomically moves all requested seats from AVAILABLE to HELD or fails entirely, creating a pending Booking. On payment success seats become BOOKED, on failure or expiry they return to AVAILABLE through a scheduled sweeper.",
    "Pros: all-or-nothing holds prevent double booking and partial reservations. Cons: a lock per show limits throughput on hot shows, and holds can be abused to block inventory.",
    "Extensions: seat pricing tiers, coupons, food add-ons, waitlists, per-user hold limits and a distributed implementation with Redis locks or database optimistic versions.",
    `enum SeatStatus { AVAILABLE, HELD, BOOKED }

class ShowSeat {
    final String seatId;
    SeatStatus status = SeatStatus.AVAILABLE;
    java.time.Instant holdUntil;
    ShowSeat(String seatId) { this.seatId = seatId; }
}
record Booking(String id, String userId, List<String> seatIds) {}

class Show {
    private final Map<String, ShowSeat> seats = new LinkedHashMap<>();
    Show(List<String> ids) { ids.forEach(i -> seats.put(i, new ShowSeat(i))); }

    synchronized Optional<Booking> hold(String userId, List<String> ids, java.time.Duration ttl) {
        var now = java.time.Instant.now();
        for (String id : ids) {
            ShowSeat s = seats.get(id);
            boolean expired = s.status == SeatStatus.HELD && s.holdUntil.isBefore(now);
            if (s.status == SeatStatus.BOOKED || (s.status == SeatStatus.HELD && !expired))
                return Optional.empty();           // all or nothing
        }
        for (String id : ids) {
            ShowSeat s = seats.get(id);
            s.status = SeatStatus.HELD;
            s.holdUntil = now.plus(ttl);
        }
        return Optional.of(new Booking(UUID.randomUUID().toString(), userId, ids));
    }
    synchronized void confirm(Booking b) {
        b.seatIds().forEach(id -> seats.get(id).status = SeatStatus.BOOKED);
    }
    synchronized void release(Booking b) {
        b.seatIds().forEach(id -> seats.get(id).status = SeatStatus.AVAILABLE);
    }
}`
  ],
  "Design Splitwise (Expense Sharing)": [
    "Model User, Expense with a split strategy (equal, exact, percent), and a balance sheet of who owes whom. Each expense updates pairwise balances, and an optional simplify step minimises the number of settlements using net balances.",
    "Requirements: add expenses paid by one user and split among others in different ways, show what each user owes or is owed, settle up, and optionally simplify debts. Entities: User, Group, Expense, Split, SplitStrategy, BalanceSheet.",
    "It tests strategy for split types, money handling, validation (splits must sum to the total) and a graph-style debt simplification algorithm.",
    "Small groups, in-memory, correctness of money is critical so use integer cents or BigDecimal and define how to distribute rounding remainders.",
    "Mistakes include double for money, losing cents when splitting equally, not validating that splits sum to the total, and storing only per-expense data so balances must be recomputed each time.",
    "ExpenseService takes the payer, amount and a SplitStrategy that returns a map of user to share. For every participant other than the payer it adds the share to balances[participant][payer] (and the reverse negative). Simplify by computing each user's net balance, then greedily match the largest debtor with the largest creditor using two heaps.",
    "Pros: strategies are easy to add and the pairwise ledger is cheap to query. Cons: greedy simplification minimises neither transfers in all cases (that is NP-hard) nor preserves who originally owed whom.",
    "Extensions: groups, multi-currency, recurring expenses, activity feed, partial settlements, and persistence with an expense ledger table.",
    `interface SplitStrategy { Map<String, Long> split(long totalCents, List<String> users); }

class EqualSplit implements SplitStrategy {
    public Map<String, Long> split(long total, List<String> users) {
        Map<String, Long> out = new LinkedHashMap<>();
        long base = total / users.size(), rem = total % users.size();
        for (int i = 0; i < users.size(); i++)
            out.put(users.get(i), base + (i < rem ? 1 : 0));   // spread leftover cents
        return out;
    }
}

class ExpenseService {
    private final Map<String, Long> net = new HashMap<>();     // positive: is owed, negative: owes

    void addExpense(String payer, long total, List<String> users, SplitStrategy strategy) {
        Map<String, Long> shares = strategy.split(total, users);
        long sum = shares.values().stream().mapToLong(Long::longValue).sum();
        if (sum != total) throw new IllegalArgumentException("Splits must add up");
        net.merge(payer, total, Long::sum);
        shares.forEach((u, share) -> net.merge(u, -share, Long::sum));
    }

    List<String> simplify() {
        PriorityQueue<Map.Entry<String, Long>> debtors = new PriorityQueue<>(Map.Entry.comparingByValue());
        PriorityQueue<Map.Entry<String, Long>> creditors =
            new PriorityQueue<>(Map.Entry.<String, Long>comparingByValue().reversed());
        net.entrySet().forEach(e -> { if (e.getValue() < 0) debtors.add(Map.entry(e.getKey(), e.getValue()));
                                      else if (e.getValue() > 0) creditors.add(Map.entry(e.getKey(), e.getValue())); });
        List<String> out = new ArrayList<>();
        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            var d = debtors.poll(); var c = creditors.poll();
            long amt = Math.min(-d.getValue(), c.getValue());
            out.add(d.getKey() + " pays " + c.getKey() + " " + amt);
            if (d.getValue() + amt < 0) debtors.add(Map.entry(d.getKey(), d.getValue() + amt));
            if (c.getValue() - amt > 0) creditors.add(Map.entry(c.getKey(), c.getValue() - amt));
        }
        return out;
    }
}`
  ],
  "Design an LRU Cache": [
    "Combine a HashMap for O(1) lookup with a doubly linked list ordered by recency, so get and put are O(1) and eviction removes the tail. In Java, LinkedHashMap with accessOrder and removeEldestEntry does it in a few lines, but implement it by hand if asked.",
    "Requirements: fixed capacity, get(key) returns the value and marks it most recently used, put(key, value) inserts or updates and evicts the least recently used entry when full, both in O(1). Entities: Cache, Node, optionally an EvictionPolicy.",
    "It tests data structure composition, pointer manipulation with sentinel nodes, generics and, as a follow-up, thread safety and pluggable eviction policies.",
    "In-memory, single JVM, capacity from hundreds to millions of entries. Concurrent access means either one lock or a striped design, since even get mutates the order.",
    "Mistakes include O(n) removal from a list, forgetting to update the map on eviction, not handling update of an existing key, and assuming ConcurrentHashMap alone makes it thread-safe.",
    "Keep a Map of key to Node and a doubly linked list with dummy head and tail. get moves the node to the head. put updates and moves an existing node, or inserts a new node at the head and, if size exceeds capacity, unlinks tail.prev and removes its key from the map.",
    "Pros: O(1) operations, simple. Cons: a single lock serialises everything, and recency alone ignores frequency so scans can flush the cache (LFU, TinyLFU or segmented LRU resist that).",
    "Variations: LFU, TTL expiry, write-through and write-back, a pluggable EvictionPolicy interface, and concurrent caches such as Caffeine that use striped buffers.",
    `class LRUCache<K, V> {
    private static class Node<K, V> { K key; V val; Node<K, V> prev, next; }

    private final int capacity;
    private final Map<K, Node<K, V>> map = new HashMap<>();
    private final Node<K, V> head = new Node<>(), tail = new Node<>();

    LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail; tail.prev = head;
    }
    synchronized V get(K key) {
        Node<K, V> n = map.get(key);
        if (n == null) return null;
        unlink(n); addFirst(n);
        return n.val;
    }
    synchronized void put(K key, V val) {
        Node<K, V> n = map.get(key);
        if (n != null) { n.val = val; unlink(n); addFirst(n); return; }
        if (map.size() == capacity) {
            Node<K, V> lru = tail.prev;
            unlink(lru); map.remove(lru.key);
        }
        n = new Node<>(); n.key = key; n.val = val;
        map.put(key, n); addFirst(n);
    }
    private void unlink(Node<K, V> n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void addFirst(Node<K, V> n) {
        n.next = head.next; n.prev = head;
        head.next.prev = n; head.next = n;
    }
}
// Shortcut: new LinkedHashMap<>(16, 0.75f, true) { protected boolean removeEldestEntry(Map.Entry e) { return size() > cap; } }`
  ],
  "Design a Rate Limiter (Classes)": [
    "Define a RateLimiter interface with allow(key) and implement algorithms as strategies: token bucket, fixed window, sliding window log or counter. Keep per-key state in a ConcurrentHashMap and make the check-and-update atomic.",
    "Requirements: limit requests per user or API key to N per time window, return allow or reject, support different limits per client, and be thread-safe. Entities: RateLimiter, a strategy per algorithm, RateLimitConfig, a per-key bucket or window.",
    "It tests algorithm knowledge (token bucket versus sliding window), strategy pattern and atomic updates under concurrency, and it leads naturally to the distributed follow-up.",
    "Thousands of requests per second across many keys in one JVM. Memory per key must be bounded, so stale keys need eviction, and the check must be O(1).",
    "Mistakes include fixed windows allowing 2x bursts at boundaries without mention, non-atomic read-then-write on counters, using System.currentTimeMillis where clock changes matter instead of nanoTime, and never evicting idle keys.",
    "TokenBucket stores tokens and lastRefill. On allow, compute elapsed time, add elapsed times refill rate capped at capacity, then if tokens is at least 1 subtract 1 and allow, else reject. Wrap per-bucket logic in synchronized or a CAS loop, and look up buckets via computeIfAbsent.",
    "Pros: token bucket allows controlled bursts with O(1) state. Cons: sliding window log is exact but costs memory, and per-bucket locks are simple but limit hot-key throughput.",
    "Variations: leaky bucket for smoothing, sliding window counter, distributed limiting with Redis Lua scripts, per-tier limits, and returning Retry-After.",
    `interface RateLimiter { boolean allow(String key); }

class TokenBucketLimiter implements RateLimiter {
    private static class Bucket { double tokens; long lastNanos; }

    private final double capacity, refillPerSec;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    TokenBucketLimiter(double capacity, double refillPerSec) {
        this.capacity = capacity; this.refillPerSec = refillPerSec;
    }
    public boolean allow(String key) {
        Bucket b = buckets.computeIfAbsent(key, k -> {
            Bucket nb = new Bucket(); nb.tokens = capacity; nb.lastNanos = System.nanoTime(); return nb;
        });
        synchronized (b) {
            long now = System.nanoTime();
            b.tokens = Math.min(capacity, b.tokens + (now - b.lastNanos) / 1e9 * refillPerSec);
            b.lastNanos = now;
            if (b.tokens >= 1) { b.tokens -= 1; return true; }
            return false;
        }
    }
}`
  ],
  "Design a Library Management System": [
    "Model Book (title) versus BookItem (physical copy), Member, Loan and Reservation, with a catalog search and rules for borrow limits, due dates and fines. The key distinction is the book metadata versus its individually trackable copies.",
    "Requirements: search by title, author or ISBN, borrow and return copies, renew, reserve a book that is out, calculate fines, and limit loans per member. Entities: Library, Book, BookItem, Member, Loan, Reservation, Fine, Catalog.",
    "It tests domain modelling with clear entity relationships, lifecycle status and business rules, and is a good place to show observer for reservation notifications.",
    "Thousands of books and members, in-memory, low concurrency, but two members borrowing the last copy at once should be handled.",
    "Mistakes include merging Book and BookItem, hard-coding fine rules, no limit enforcement, and putting all logic into a single Library class.",
    "Library delegates to Catalog for search and LoanService for borrow. borrow checks member limits and outstanding fines, finds an available BookItem, marks it LOANED, creates a Loan with a due date. Return computes the fine through a FinePolicy, frees the item and notifies the first reservation holder.",
    "Pros: clear separation of metadata, copies and loans. Cons: more entities than a toy solution needs, and searching in memory by several fields needs indexes.",
    "Extensions: digital lending, multiple branches, membership tiers, email notifications, inter-library transfers and audit history.",
    `enum ItemStatus { AVAILABLE, LOANED, RESERVED, LOST }
record Book(String isbn, String title, String author) {}

class BookItem {
    final String barcode; final Book book;
    ItemStatus status = ItemStatus.AVAILABLE;
    BookItem(String barcode, Book book) { this.barcode = barcode; this.book = book; }
}
record Loan(BookItem item, String memberId, java.time.LocalDate due) {}

interface FinePolicy { long fine(java.time.LocalDate due, java.time.LocalDate returned); }
class PerDayFine implements FinePolicy {
    public long fine(java.time.LocalDate due, java.time.LocalDate returned) {
        long late = java.time.temporal.ChronoUnit.DAYS.between(due, returned);
        return Math.max(0, late) * 10;
    }
}
class LoanService {
    private static final int MAX_LOANS = 5;
    private final Map<String, List<Loan>> loansByMember = new HashMap<>();
    private final FinePolicy fines;
    LoanService(FinePolicy fines) { this.fines = fines; }

    synchronized Loan borrow(String memberId, List<BookItem> copies) {
        var loans = loansByMember.computeIfAbsent(memberId, k -> new ArrayList<>());
        if (loans.size() >= MAX_LOANS) throw new IllegalStateException("Limit reached");
        BookItem item = copies.stream().filter(c -> c.status == ItemStatus.AVAILABLE)
                              .findFirst().orElseThrow(() -> new IllegalStateException("No copy available"));
        item.status = ItemStatus.LOANED;
        Loan loan = new Loan(item, memberId, java.time.LocalDate.now().plusDays(14));
        loans.add(loan);
        return loan;
    }
    synchronized long giveBack(Loan loan) {
        loan.item().status = ItemStatus.AVAILABLE;
        loansByMember.get(loan.memberId()).remove(loan);
        return fines.fine(loan.due(), java.time.LocalDate.now());
    }
}`
  ],
  "Design an ATM": [
    "Model ATM as a state machine (Idle, CardInserted, Authenticated, Transaction) with a CashDispenser using a chain of responsibility over denominations, and a BankService abstraction for balance and debit. Operations are Transaction commands such as Withdraw, Deposit and BalanceInquiry.",
    "Requirements: insert card, verify PIN, check balance, withdraw (limited by balance, daily limit and cash in machine), deposit and eject card. Entities: ATM, Card, Account, BankService, CashDispenser, Transaction, ATMState.",
    "It combines state, chain of responsibility for cash dispensing and command for transactions, and tests security-minded flow and failure handling.",
    "Single machine, one user at a time, cash inventory limited by denomination, and communication with a remote bank that can fail, so debit and dispense must be consistent.",
    "Mistakes include dispensing cash before debiting (or the reverse without rollback), storing the PIN in plain text, greedy dispensing that ignores exact-change impossibility, and no retry limit on PIN.",
    "ATM holds a state and the inserted card. The Authenticated state creates Transaction objects. Withdraw validates amount, asks BankService to debit, then asks the CashDispenser chain (2000, 500, 100 handlers) to dispense, and reverses the debit if dispensing fails.",
    "Pros: states and handlers extend cleanly with new denominations or transactions. Cons: greedy dispensing is optimal only for canonical denomination sets, and distributed consistency with the bank needs idempotent operations.",
    "Extensions: cardless withdrawal with OTP, multi-currency, receipts, fraud limits, and an audit log for each transaction.",
    `abstract class DispenseHandler {
    protected DispenseHandler next;
    protected final int denomination;
    protected int count;
    DispenseHandler(int denomination, int count) { this.denomination = denomination; this.count = count; }
    DispenseHandler then(DispenseHandler n) { next = n; return n; }

    boolean dispense(int amount, Map<Integer, Integer> out) {
        int use = Math.min(amount / denomination, count);
        if (use > 0) out.put(denomination, use);
        int rest = amount - use * denomination;
        if (rest == 0) return true;
        return next != null && next.dispense(rest, out);
    }
    void commit(Map<Integer, Integer> out) {
        count -= out.getOrDefault(denomination, 0);
        if (next != null) next.commit(out);
    }
}
class Handler extends DispenseHandler { Handler(int d, int c) { super(d, c); } }

interface BankService { boolean debit(String account, int amount); void credit(String account, int amount); }

class ATM {
    private final DispenseHandler chain;
    private final BankService bank;
    ATM(DispenseHandler chain, BankService bank) { this.chain = chain; this.bank = bank; }

    synchronized Map<Integer, Integer> withdraw(String account, int amount) {
        Map<Integer, Integer> notes = new TreeMap<>(Comparator.reverseOrder());
        if (!chain.dispense(amount, notes)) throw new IllegalStateException("Cannot dispense exact amount");
        if (!bank.debit(account, amount)) throw new IllegalStateException("Insufficient funds");
        chain.commit(notes);
        return notes;
    }
}`
  ],
  "Design a Logging Framework": [
    "Structure it as Logger (named, with a level), Appender or Handler (console, file), Formatter and a level filter, with a hierarchy of loggers like Log4j or SLF4J. Appenders are strategies, the dispatch to appenders is an observer or chain, and async logging uses a queue and background thread.",
    "Requirements: log levels (DEBUG to ERROR), multiple destinations, configurable format, per-logger level, thread safety and optionally asynchronous writes. Entities: Logger, LogLevel, LogRecord, Appender, Formatter, LoggerFactory.",
    "It tests separation of concerns, strategy and chain of responsibility, singleton or factory usage, and thread-safe producer-consumer design.",
    "Many threads logging at high volume, so logging must not block the business thread nor lose messages on shutdown, and disabled levels must cost almost nothing.",
    "Mistakes include string concatenation before the level check, a global synchronized write that serialises the application, an unbounded async queue, and not flushing on shutdown.",
    "LoggerFactory returns a cached Logger by name. Logger.log checks the level first, builds a LogRecord with timestamp, level, thread and message, and passes it to each Appender. AsyncAppender puts records into a bounded BlockingQueue drained by a daemon thread that delegates to the real appender.",
    "Pros: pluggable outputs and formats, async keeps latency low. Cons: async can lose logs on a crash, a bounded queue needs a drop-or-block policy, and hierarchical config adds complexity.",
    "Extensions: MDC context, rolling files, structured JSON logging, sampling, and remote shipping to a log aggregator.",
    `enum LogLevel { DEBUG, INFO, WARN, ERROR }
record LogRecord(java.time.Instant time, LogLevel level, String logger, String thread, String message) {}

interface Appender { void append(LogRecord r); }
class ConsoleAppender implements Appender {
    public void append(LogRecord r) {
        System.out.println(r.time() + " [" + r.thread() + "] " + r.level() + " " + r.logger() + " - " + r.message());
    }
}
class AsyncAppender implements Appender {
    private final BlockingQueue<LogRecord> queue = new ArrayBlockingQueue<>(10_000);
    AsyncAppender(Appender delegate) {
        Thread t = new Thread(() -> {
            try { while (true) delegate.append(queue.take()); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }, "log-writer");
        t.setDaemon(true);
        t.start();
    }
    public void append(LogRecord r) { queue.offer(r); }       // drops when full, never blocks callers
}
class Logger {
    private final String name;
    private volatile LogLevel threshold = LogLevel.INFO;
    private final List<Appender> appenders = new java.util.concurrent.CopyOnWriteArrayList<>();
    Logger(String name) { this.name = name; }
    void addAppender(Appender a) { appenders.add(a); }
    void setLevel(LogLevel l) { threshold = l; }
    void log(LogLevel level, java.util.function.Supplier<String> msg) {
        if (level.compareTo(threshold) < 0) return;           // cheap check before building message
        var r = new LogRecord(java.time.Instant.now(), level, name, Thread.currentThread().getName(), msg.get());
        appenders.forEach(a -> a.append(r));
    }
}`
  ],
  "Design a Notification Service (Classes)": [
    "Define a Notification with a channel-agnostic payload, a NotificationChannel interface (email, SMS, push) as the strategy, a template engine and a NotificationService that resolves user preferences, renders content and dispatches asynchronously with retry. Use observer or events to trigger sends.",
    "Requirements: send notifications over multiple channels, honour user preferences and opt-outs, use templates, retry failures, and support priority. Entities: Notification, Channel, Template, UserPreference, NotificationService, RetryPolicy.",
    "It tests strategy and factory, decoupling of triggers from delivery, and reliability concerns such as retries, idempotency and rate limiting.",
    "High fan-out (one event to many users) and slow third-party providers, so sending must be asynchronous and bounded, with duplicates avoided on retry.",
    "Mistakes include calling providers synchronously on the request thread, hard-coding channels with if-else, infinite retries without backoff, and ignoring user preferences or quiet hours.",
    "NotificationService.notify looks up the user's enabled channels, renders the template, and submits one task per channel to an executor. Each task calls channel.send and on failure retries with exponential backoff up to a limit, then records failure or sends to a dead-letter store. Channels are registered by type in a map.",
    "Pros: new channels are new classes and delivery is isolated per channel. Cons: at-least-once retries can duplicate messages unless you use idempotency keys, and ordering across channels is not guaranteed.",
    "Extensions: batching and digests, scheduled sends, priority queues, per-user rate limits, delivery receipts and a message queue between producer and workers.",
    `enum ChannelType { EMAIL, SMS, PUSH }
record Notification(String userId, String title, String body, String idempotencyKey) {}

interface NotificationChannel {
    ChannelType type();
    void send(Notification n) throws Exception;
}
class NotificationService {
    private final Map<ChannelType, NotificationChannel> channels = new EnumMap<>(ChannelType.class);
    private final Map<String, Set<ChannelType>> preferences = new ConcurrentHashMap<>();
    private final Set<String> sent = ConcurrentHashMap.newKeySet();
    private final ExecutorService pool = Executors.newFixedThreadPool(8);

    NotificationService(List<NotificationChannel> list) { list.forEach(c -> channels.put(c.type(), c)); }
    void setPreferences(String user, Set<ChannelType> types) { preferences.put(user, types); }

    void notify(Notification n) {
        for (ChannelType t : preferences.getOrDefault(n.userId(), Set.of(ChannelType.EMAIL))) {
            String key = n.idempotencyKey() + ":" + t;
            if (!sent.add(key)) continue;                     // skip duplicates
            pool.submit(() -> deliver(channels.get(t), n, key));
        }
    }
    private void deliver(NotificationChannel ch, Notification n, String key) {
        for (int attempt = 1; attempt <= 3; attempt++) {
            try { ch.send(n); return; }
            catch (Exception e) {
                try { Thread.sleep(200L << attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); return; }
            }
        }
        sent.remove(key);                                     // allow a later retry, record in a dead-letter store
    }
}`
  ],
  "Design a Food Delivery App": [
    "Model Customer, Restaurant, Menu, Cart, Order, DeliveryPartner and Payment, with Order driven by a state machine (PLACED, ACCEPTED, PREPARING, PICKED_UP, DELIVERED, CANCELLED). Delivery assignment and search or ranking are strategies, and status updates are published to observers.",
    "Requirements: browse restaurants and menus, add to cart, place an order and pay, restaurant accepts, a delivery partner is assigned, track status, and cancel or rate. Entities: User, Restaurant, MenuItem, Cart, Order, OrderItem, DeliveryPartner, Payment, Address.",
    "A broad domain problem testing prioritisation (what to model first), the order state machine, strategy for assignment, and observer for notifications.",
    "Many concurrent orders, partner location changing continuously, and external payments. In an interview keep it in-memory and focus on the order lifecycle and assignment.",
    "Mistakes include modelling everything at once, no valid-transition checks on Order status, copying menu item price into the cart live instead of snapshotting it into the order, and tightly coupling assignment logic to Order.",
    "OrderService validates the cart, snapshots item prices into an Order, charges payment and publishes OrderPlaced. Restaurant accepting triggers a DeliveryAssignmentStrategy (nearest available partner) and Order.transition(next) enforces the allowed transitions through an enum map. Observers send notifications on each change.",
    "Pros: explicit lifecycle and pluggable assignment make the system testable. Cons: state transitions across services need compensation (cancel after payment, partner rejects), which an in-memory model glosses over.",
    "Extensions: surge pricing, batching multiple orders per rider, ETA estimation, coupons, scheduled orders and a saga for payment and refund.",
    `enum OrderStatus {
    PLACED, ACCEPTED, PREPARING, PICKED_UP, DELIVERED, CANCELLED;
    private static final Map<OrderStatus, Set<OrderStatus>> NEXT = Map.of(
        PLACED, Set.of(ACCEPTED, CANCELLED),
        ACCEPTED, Set.of(PREPARING, CANCELLED),
        PREPARING, Set.of(PICKED_UP),
        PICKED_UP, Set.of(DELIVERED),
        DELIVERED, Set.of(),
        CANCELLED, Set.of());
    boolean canMoveTo(OrderStatus s) { return NEXT.get(this).contains(s); }
}
record OrderItem(String itemId, int qty, long priceCents) {}   // price snapshot

class Order {
    final String id; final List<OrderItem> items;
    private OrderStatus status = OrderStatus.PLACED;
    private final List<java.util.function.Consumer<Order>> listeners = new ArrayList<>();
    Order(String id, List<OrderItem> items) { this.id = id; this.items = items; }
    void onChange(java.util.function.Consumer<Order> l) { listeners.add(l); }
    synchronized void transition(OrderStatus next) {
        if (!status.canMoveTo(next)) throw new IllegalStateException(status + " -> " + next);
        status = next;
        listeners.forEach(l -> l.accept(this));
    }
    OrderStatus status() { return status; }
}
record Partner(String id, double lat, double lon, boolean available) {}
interface AssignmentStrategy { Optional<Partner> assign(Order o, double lat, double lon, List<Partner> partners); }
class NearestPartner implements AssignmentStrategy {
    public Optional<Partner> assign(Order o, double lat, double lon, List<Partner> partners) {
        return partners.stream().filter(Partner::available)
            .min(Comparator.comparingDouble(p -> Math.hypot(p.lat() - lat, p.lon() - lon)));
    }
}`
  ],
  "Design a Hotel Booking System": [
    "Model Hotel, RoomType, Room, Guest, Reservation and Payment, with availability computed as date-range overlaps and a booking operation that atomically checks and reserves. The core is the date-range overlap check and preventing double booking.",
    "Requirements: search hotels by city and dates, check room availability, book for a date range, cancel with a policy, and pay. Entities: Hotel, RoomType, Room, Reservation, Guest, Payment, CancellationPolicy, SearchCriteria.",
    "It tests date-range logic, concurrency on inventory, pricing strategies and the difference between room type inventory and individual rooms.",
    "Many concurrent searches but fewer bookings, and the last room for popular dates is contended. Availability queries over date ranges must be efficient.",
    "Mistakes include an off-by-one in range overlap (check-out day is free), checking availability and booking non-atomically, storing per-day availability for every room when counting per room type suffices, and no cancellation or payment failure path.",
    "A reservation holds a room, check-in and check-out. Two ranges overlap if start1 is before end2 and start2 is before end1. book synchronises per hotel or room, scans the room's reservations for overlaps and adds the new one if none. Pricing uses a PricingStrategy (seasonal, weekend), and cancellation uses a policy to compute refund.",
    "Pros: per-room reservation lists are simple and exact. Cons: scanning gets slow with long histories, so use a TreeMap by start date or per-day counters per room type for fast availability.",
    "Extensions: overbooking policies, multiple room types with upgrade, hold-then-confirm payment, loyalty pricing and distributed inventory with database constraints.",
    `record DateRange(java.time.LocalDate checkIn, java.time.LocalDate checkOut) {
    DateRange {
        if (!checkIn.isBefore(checkOut)) throw new IllegalArgumentException("checkOut must be after checkIn");
    }
    boolean overlaps(DateRange o) {                       // end day is exclusive
        return checkIn.isBefore(o.checkOut) && o.checkIn.isBefore(checkOut);
    }
}
record Reservation(String id, String guestId, DateRange stay) {}

class Room {
    final String number; final String type;
    private final List<Reservation> reservations = new ArrayList<>();
    Room(String number, String type) { this.number = number; this.type = type; }
    synchronized boolean tryReserve(Reservation r) {
        if (reservations.stream().anyMatch(x -> x.stay().overlaps(r.stay()))) return false;
        reservations.add(r);
        return true;
    }
    synchronized boolean cancel(Reservation r) { return reservations.remove(r); }
    synchronized boolean isFree(DateRange range) {
        return reservations.stream().noneMatch(x -> x.stay().overlaps(range));
    }
}
class Hotel {
    private final List<Room> rooms;
    Hotel(List<Room> rooms) { this.rooms = rooms; }
    Optional<Reservation> book(String guestId, String roomType, DateRange stay) {
        var res = new Reservation(UUID.randomUUID().toString(), guestId, stay);
        return rooms.stream().filter(r -> r.type.equals(roomType))
                    .filter(r -> r.tryReserve(res)).findFirst().map(r -> res);
    }
}`
  ],
  "Design an In-Memory File System": [
    "Use the Composite pattern: an abstract Node with File and Directory subclasses, where Directory holds a map of child names to Nodes. Path operations (mkdir, ls, addFile, readFile) walk the path components from a root, in O(path length) per call.",
    "Requirements: create directories and files at a path, list a directory, read and write file content, delete, and optionally move, copy, search and permissions. Entities: FileSystem, Node, Directory, File, Path, and optionally Permission and Metadata.",
    "It is the textbook Composite pattern and tests tree modelling, path parsing and edge cases such as missing parents, duplicates and root.",
    "In-memory, small to moderate tree, single process. Concurrent access needs a read-write lock or per-directory locking if asked.",
    "Mistakes include storing full paths as keys without a tree, a type switch instead of polymorphism, forgetting to handle root and trailing slashes, and returning internal mutable collections.",
    "FileSystem owns the root Directory. A resolve method splits the path by slash and walks children, creating directories when mkdir -p semantics are required. ls on a file returns its name, ls on a directory returns sorted children. Directory uses a TreeMap for sorted listing.",
    "Pros: polymorphic nodes keep the code clean and operations are proportional to path depth. Cons: moves and renames across the tree require relinking, and a single global lock is simple but coarse.",
    "Extensions: file sizes and quotas, permissions, symbolic links, find with a filter (specification pattern), watch events and persistence.",
    `abstract class Node {
    final String name;
    Node(String name) { this.name = name; }
    abstract boolean isFile();
}
class FileNode extends Node {
    private final StringBuilder content = new StringBuilder();
    FileNode(String name) { super(name); }
    boolean isFile() { return true; }
    void append(String s) { content.append(s); }
    String read() { return content.toString(); }
}
class DirNode extends Node {
    final Map<String, Node> children = new TreeMap<>();
    DirNode(String name) { super(name); }
    boolean isFile() { return false; }
}
class FileSystem {
    private final DirNode root = new DirNode("");

    private DirNode walk(String path, boolean create) {
        DirNode cur = root;
        for (String part : path.split("/")) {
            if (part.isEmpty()) continue;
            Node next = cur.children.get(part);
            if (next == null) {
                if (!create) throw new NoSuchElementException(path);
                next = new DirNode(part);
                cur.children.put(part, next);
            }
            if (next.isFile()) throw new IllegalArgumentException("Not a directory: " + part);
            cur = (DirNode) next;
        }
        return cur;
    }
    void mkdir(String path) { walk(path, true); }
    void addContentToFile(String filePath, String text) {
        int i = filePath.lastIndexOf('/');
        DirNode dir = walk(filePath.substring(0, i), true);
        String name = filePath.substring(i + 1);
        FileNode f = (FileNode) dir.children.computeIfAbsent(name, FileNode::new);
        f.append(text);
    }
    List<String> ls(String path) {
        int i = path.lastIndexOf('/');
        DirNode parent = walk(path.substring(0, i), false);
        Node n = path.equals("/") ? root : parent.children.get(path.substring(i + 1));
        if (n == null) throw new NoSuchElementException(path);
        return n.isFile() ? List.of(n.name) : new ArrayList<>(((DirNode) n).children.keySet());
    }
}`
  ],
  "Design a Task Scheduler": [
    "Keep tasks in a PriorityQueue (or DelayQueue) ordered by next run time, with a worker pool executing due tasks. Support one-shot, fixed-rate and cron-like recurring tasks by re-enqueueing after each run, and use a condition wait until the earliest task is due.",
    "Requirements: schedule a task at a time or after a delay, repeat on an interval, cancel, run tasks in parallel with a worker pool and handle failures. Entities: Scheduler, ScheduledTask, Trigger or Schedule, WorkerPool, TaskStatus.",
    "It tests the producer-consumer pattern, time-ordered queues, concurrency primitives (wait, signal, DelayQueue) and thinking about missed runs and failures.",
    "Thousands of tasks with varied schedules, accuracy in milliseconds, in-memory, and one dispatcher thread feeding a worker pool so long tasks do not delay others.",
    "Mistakes include busy-waiting or sleeping a fixed interval, running tasks on the dispatcher thread, losing recurring tasks when one execution throws, and using wall clock time where nanoTime is needed.",
    "A single dispatcher thread takes the head of a time-ordered queue, waits with awaitNanos until it is due, then submits it to an executor and, for recurring tasks, computes the next run and re-inserts it. Adding an earlier task signals the condition so the dispatcher re-evaluates.",
    "Pros: one timer thread is cheap and precise. Cons: a single queue is a lock hotspot, and persistence and recovery are not provided without storage; in production use ScheduledThreadPoolExecutor or Quartz.",
    "Extensions: cron expressions, priorities and dependencies between tasks, persistence for restart, distributed scheduling with leader election, and retries with backoff.",
    `record ScheduledTask(String id, Runnable action, long runAtNanos, long periodNanos) {}

class Scheduler {
    private final PriorityQueue<ScheduledTask> queue =
        new PriorityQueue<>(Comparator.comparingLong(ScheduledTask::runAtNanos));
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition changed = lock.newCondition();
    private final ExecutorService workers = Executors.newFixedThreadPool(4);
    private volatile boolean running = true;

    Scheduler() {
        Thread t = new Thread(this::loop, "dispatcher");
        t.setDaemon(true);
        t.start();
    }
    void schedule(String id, Runnable r, long delayMs, long periodMs) {
        long at = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(delayMs);
        lock.lock();
        try {
            queue.add(new ScheduledTask(id, r, at, TimeUnit.MILLISECONDS.toNanos(periodMs)));
            changed.signal();                               // re-evaluate earliest deadline
        } finally { lock.unlock(); }
    }
    private void loop() {
        lock.lock();
        try {
            while (running) {
                ScheduledTask head = queue.peek();
                if (head == null) { changed.await(); continue; }
                long wait = head.runAtNanos() - System.nanoTime();
                if (wait > 0) { changed.awaitNanos(wait); continue; }
                queue.poll();
                workers.submit(head.action());
                if (head.periodNanos() > 0)
                    queue.add(new ScheduledTask(head.id(), head.action(), head.runAtNanos() + head.periodNanos(), head.periodNanos()));
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally { lock.unlock(); }
    }
}`
  ],
  "Design a Pub-Sub Message Broker": [
    "Model Broker, Topic, Publisher, Subscriber and Message, where each subscriber has its own offset or queue per topic so slow consumers do not block others. Delivery is asynchronous, and the key design choices are ordering, delivery guarantees and backpressure.",
    "Requirements: create topics, publish messages, subscribe and unsubscribe, deliver each message to all subscribers of the topic in order, and let subscribers consume independently. Entities: Broker, Topic, Message, Subscriber, optionally Partition and ConsumerGroup.",
    "It tests observer at scale, producer-consumer, concurrency, and understanding of broker concepts such as offsets, partitions and at-least-once delivery.",
    "Many topics and subscribers in one process, with slow consumers possible. Memory is bounded, so you need retention or bounded queues.",
    "Mistakes include calling subscribers synchronously in the publisher thread, a single shared queue so one slow subscriber stalls all, unbounded buffers, and no ordering guarantee per topic.",
    "Topic stores an append-only list of messages. Each subscription has its own offset and a dedicated worker or task that reads from its offset and calls the subscriber. publish appends under a lock and signals the subscribers, so ordering is per topic and consumers advance independently.",
    "Pros: independent offsets give replay and isolation. Cons: retaining the log costs memory until trimmed, and exactly-once delivery is not achievable without idempotent consumers.",
    "Extensions: partitions with key hashing, consumer groups, acknowledgements and retries, dead-letter topics, persistence and message TTL.",
    `record Message(long offset, String payload) {}
interface Subscriber { void onMessage(Message m); }

class Topic {
    private final List<Message> log = new ArrayList<>();
    private final Map<Subscriber, Thread> consumers = new ConcurrentHashMap<>();

    synchronized void publish(String payload) {
        log.add(new Message(log.size(), payload));
        notifyAll();
    }
    void subscribe(Subscriber s) {
        Thread t = new Thread(() -> consume(s), "sub-" + s.hashCode());
        t.setDaemon(true);
        consumers.put(s, t);
        t.start();
    }
    void unsubscribe(Subscriber s) {
        Thread t = consumers.remove(s);
        if (t != null) t.interrupt();
    }
    private void consume(Subscriber s) {
        int offset;
        synchronized (this) { offset = log.size(); }          // start from new messages
        try {
            while (!Thread.currentThread().isInterrupted()) {
                Message m;
                synchronized (this) {
                    while (offset >= log.size()) wait();
                    m = log.get(offset++);
                }
                try { s.onMessage(m); } catch (RuntimeException ignored) { /* isolate bad subscribers */ }
            }
        } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
class Broker {
    private final Map<String, Topic> topics = new ConcurrentHashMap<>();
    Topic topic(String name) { return topics.computeIfAbsent(name, k -> new Topic()); }
}`
  ],
  "Design a Chess Game": [
    "Model Board, Cell or Position, an abstract Piece with subclasses that implement their own move rules, Player, Move and Game with turn handling and status (active, check, checkmate, stalemate). Each piece generates candidate moves and the Game filters those that leave its own king in check.",
    "Requirements: 8 by 8 board with standard setup, legal moves per piece type, turn alternation, capture, check and checkmate detection, and optionally castling, en passant and promotion. Entities: Game, Board, Piece (King, Queen, Rook, Bishop, Knight, Pawn), Move, Player, Color, GameStatus.",
    "It tests polymorphism for piece behaviour, separation of move generation from rule validation, and handling a rich domain with many special cases.",
    "Tiny state, single game, in-memory. Complexity comes from rules, not scale, so build the core first and discuss special moves as extensions.",
    "Mistakes include a giant switch on piece type in Board, putting check validation inside each piece, not simulating a move to test king safety, and trying to implement every special rule before the basics work.",
    "Piece.possibleMoves(board) returns pseudo-legal moves using direction vectors and sliding rules. Game.makeMove checks turn and that the move is in the legal list, applies it, records it in history, and then evaluates whether the opponent is in check and has any legal move. Legality is tested by making the move on a copy or applying and undoing it.",
    "Pros: new rules and pieces are localised and the history allows undo. Cons: checking legality by simulation costs time per move, and special rules cut across pieces and the board.",
    "Extensions: castling and en passant, promotion, move history and undo, PGN export, an AI player (minimax), a clock and a network multiplayer mode.",
    `enum Color { WHITE, BLACK }
record Pos(int r, int c) {
    boolean inside() { return r >= 0 && r < 8 && c >= 0 && c < 8; }
}
record Move(Pos from, Pos to) {}

abstract class Piece {
    final Color color;
    Piece(Color color) { this.color = color; }
    abstract List<Move> moves(Board board, Pos from);

    protected List<Move> slide(Board board, Pos from, int[][] dirs) {     // for rook, bishop, queen
        List<Move> out = new ArrayList<>();
        for (int[] d : dirs) {
            Pos p = new Pos(from.r() + d[0], from.c() + d[1]);
            while (p.inside()) {
                Piece other = board.at(p);
                if (other == null) out.add(new Move(from, p));
                else { if (other.color != color) out.add(new Move(from, p)); break; }
                p = new Pos(p.r() + d[0], p.c() + d[1]);
            }
        }
        return out;
    }
}
class Rook extends Piece {
    Rook(Color c) { super(c); }
    List<Move> moves(Board b, Pos from) { return slide(b, from, new int[][]{{1,0},{-1,0},{0,1},{0,-1}}); }
}
class Knight extends Piece {
    Knight(Color c) { super(c); }
    List<Move> moves(Board b, Pos from) {
        List<Move> out = new ArrayList<>();
        int[][] jumps = {{1,2},{2,1},{-1,2},{-2,1},{1,-2},{2,-1},{-1,-2},{-2,-1}};
        for (int[] j : jumps) {
            Pos p = new Pos(from.r() + j[0], from.c() + j[1]);
            if (p.inside() && (b.at(p) == null || b.at(p).color != color)) out.add(new Move(from, p));
        }
        return out;
    }
}
class Board {
    private final Piece[][] grid = new Piece[8][8];
    Piece at(Pos p) { return grid[p.r()][p.c()]; }
    void put(Pos p, Piece piece) { grid[p.r()][p.c()] = piece; }
    Piece apply(Move m) {                                                 // returns captured piece for undo
        Piece captured = at(m.to());
        put(m.to(), at(m.from())); put(m.from(), null);
        return captured;
    }
    void undo(Move m, Piece captured) { put(m.from(), at(m.to())); put(m.to(), captured); }
}`
  ],
  "Design Snake and Ladder": [
    "Model Board with a map of jump targets (snakes and ladders), Dice, Player and Game with a turn queue. A turn rolls the dice, moves the player, applies any jump on the destination cell, and the first to reach the final cell wins.",
    "Requirements: a 100-cell board, snakes that move down and ladders that move up, two or more players taking turns, a dice roll of 1 to 6, exact finish or overshoot rule, and a winner. Entities: Game, Board, Cell or Jump, Player, Dice, GameStatus.",
    "A small problem that tests clean modelling, the turn loop, dependency injection of the dice for testing, and extensibility to rules variations.",
    "Tiny state, one game in memory. Validate the board setup (no jump at start or end, no cycles) and make randomness injectable so tests are deterministic.",
    "Mistakes include hard-coding Math.random in the game, representing snakes and ladders as separate classes with duplicated logic, not handling chained jumps or overshoot, and not validating board configuration.",
    "Board holds a Map from start cell to end cell for all jumps. Game keeps players in a Deque, and each turn polls the next player, rolls the Dice, computes position + roll, ignores the move if it overshoots, applies the jump map, checks for the win, and re-queues the player. Dice is an interface, so a fixed dice can be injected in tests.",
    "Pros: a single jump map unifies snakes and ladders. Cons: it treats both as the same, so special effects such as a safe cell or a snake bite penalty would need a richer Jump type.",
    "Extensions: multiple dice, extra turn on six, configurable board size, a crooked dice, a GUI and many concurrent games.",
    `interface Dice { int roll(); }
class RandomDice implements Dice {
    private final Random rnd = new Random();
    public int roll() { return rnd.nextInt(6) + 1; }
}
record Player(String name) {}

class Board {
    final int size;
    private final Map<Integer, Integer> jumps = new HashMap<>();
    Board(int size, Map<Integer, Integer> jumps) {
        this.size = size;
        jumps.forEach((from, to) -> {
            if (from == size || from == 1) throw new IllegalArgumentException("Invalid jump start");
            this.jumps.put(from, to);
        });
    }
    int next(int cell) { return jumps.getOrDefault(cell, cell); }
}
class Game {
    private final Board board; private final Dice dice;
    private final Deque<Player> turns;
    private final Map<Player, Integer> position = new HashMap<>();

    Game(Board board, Dice dice, List<Player> players) {
        this.board = board; this.dice = dice;
        this.turns = new ArrayDeque<>(players);
        players.forEach(p -> position.put(p, 0));
    }
    Player play() {
        while (true) {
            Player p = turns.poll();
            int target = position.get(p) + dice.roll();
            if (target <= board.size) position.put(p, board.next(target));
            if (position.get(p) == board.size) return p;
            turns.add(p);
        }
    }
}`
  ]
};
