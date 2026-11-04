// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, example]
const SERVICE_ANSWERS = {
  "Reverse a String": [
    "I reverse a string with StringBuilder in one line, or with two pointers on a char array when I want to show the in-place approach. Both run in O(n) time, and I mention that Java strings are immutable, so a new object is always created.",
    "Given a string, return it with the characters in reverse order.",
    "It checks that you know string immutability and the cost of building new strings.",
    "Any time you need a reversed copy, such as palindrome checks.",
    "Do not concatenate with plus in a loop, because that creates many temporary strings and is O(n squared).",
    "Use new StringBuilder(s).reverse().toString() for the short answer, or swap characters from both ends of a char array for the explicit version.",
    "Pros: StringBuilder is short and fast. Cons: the two pointer version is longer but shows the algorithm clearly.",
    "Recursion, which is elegant but uses O(n) stack space.",
    `// Short version
String reversed = new StringBuilder(s).reverse().toString();

// Two pointers on a char array
char[] chars = s.toCharArray();
for (int i = 0, j = chars.length - 1; i < j; i++, j--) {
    char tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
}
String result = new String(chars);`
  ],
  "Check Anagram": [
    "Two strings are anagrams when they contain the same characters with the same counts. I count characters in an int array of size 26 for lowercase letters, which is O(n) time and O(1) extra space.",
    "Given two strings, return true if one is a rearrangement of the other.",
    "It tests counting and early exit, and whether you can avoid sorting.",
    "Matching words, duplicate detection and simple text checks.",
    "Do not forget the length check first, and do not assume only lowercase letters unless the question says so.",
    "Return false if the lengths differ, increment a count for each character of the first string, decrement for the second, and check that no count is negative.",
    "Pros: linear time. Cons: an int array only fits a known alphabet, so a HashMap is needed for Unicode.",
    "Sorting both strings and comparing, which is O(n log n) but very short.",
    `public static boolean isAnagram(String a, String b) {
    if (a.length() != b.length()) return false;
    int[] counts = new int[26];
    for (int i = 0; i < a.length(); i++) {
        counts[a.charAt(i) - 'a']++;
        counts[b.charAt(i) - 'a']--;
    }
    for (int c : counts) {
        if (c != 0) return false;
    }
    return true;
}`
  ],
  "Find Duplicate Elements": [
    "I find duplicates by adding each element to a HashSet. If add returns false, the element was already seen. This is O(n) time and O(n) space.",
    "Given an array or list, return the values that appear more than once.",
    "It shows the trade-off between a set based check and a nested loop.",
    "Validation of input data and finding repeated IDs.",
    "Do not use nested loops for large inputs, because that is O(n squared).",
    "Use a HashSet for seen values and a second set for duplicates, so each duplicate is reported once.",
    "Pros: fast and simple. Cons: uses extra memory proportional to the input.",
    "Sorting first and checking neighbours, which is O(n log n) and uses less extra memory.",
    `public static Set<Integer> findDuplicates(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    Set<Integer> duplicates = new HashSet<>();
    for (int n : nums) {
        if (!seen.add(n)) duplicates.add(n);
    }
    return duplicates;
}`
  ],
  "Two Sum": [
    "For each number I check whether its complement (target minus the number) is already in a HashMap. This finds the pair in one pass with O(n) time and O(n) space.",
    "Given an array and a target, return the indexes of two numbers that add up to the target.",
    "It is the most common array question and tests hashing.",
    "Finding pairs with a required sum, such as matching payments to invoices.",
    "Do not use the same element twice, and do not return values when the question asks for indexes.",
    "Store each value with its index in a map, check for the complement before inserting the current value, and return the two indexes when found.",
    "Pros: one pass and fast. Cons: extra memory for the map.",
    "Sorting with two pointers, which is O(n log n) but needs the original indexes kept.",
    `public static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> indexOf = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        Integer j = indexOf.get(target - nums[i]);
        if (j != null) return new int[] { j, i };
        indexOf.put(nums[i], i);
    }
    return new int[0];
}`
  ],
  "Maximum Subarray (Kadane)": [
    "Kadane's algorithm keeps the best sum ending at the current position and the best overall sum. It runs in O(n) time and O(1) space, and it handles negative numbers correctly.",
    "Given an integer array, find the contiguous subarray with the largest sum and return that sum.",
    "It is a classic dynamic programming question that interviewers use to test thinking about optimal substructure.",
    "Finding the best period in profit or sensor data.",
    "Do not reset the running sum to zero when the array is all negative, because the answer is then the largest single element.",
    "Start both values with the first element, for each next value choose between starting fresh or extending the current sum, and update the best sum.",
    "Pros: linear and constant space. Cons: returning the subarray boundaries needs a few extra variables.",
    "Divide and conquer, which is O(n log n) and useful to discuss.",
    `public static int maxSubArray(int[] nums) {
    int current = nums[0];
    int best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);
        best = Math.max(best, current);
    }
    return best;
}`
  ],
  "Move Zeros to End": [
    "I move all non-zero values to the front, keeping their order, with a write pointer. Then I fill the rest with zeros. This is O(n) time and O(1) extra space.",
    "Given an integer array, move all zeros to the end while keeping the relative order of the other values.",
    "It tests the two pointer pattern and in-place updates.",
    "Compacting arrays and filtering data in place.",
    "Do not use a new list if the question asks for in-place changes, and do not swap every element, because that breaks the order.",
    "Use a write index that moves forward each time a non-zero value is copied to it, then set the remaining positions to zero.",
    "Pros: in place and linear. Cons: the logic is slightly harder to read than building a new list.",
    "Building a new list with the non-zero values, which uses extra memory.",
    `public static void moveZeros(int[] nums) {
    int write = 0;
    for (int n : nums) {
        if (n != 0) nums[write++] = n;
    }
    while (write < nums.length) {
        nums[write++] = 0;
    }
}`
  ],
  "First Non-Repeating Character": [
    "I count each character with a LinkedHashMap, which keeps insertion order, then return the first key with a count of one. This is O(n) time and O(k) space, where k is the number of distinct characters.",
    "Given a string, return the first character that appears exactly once, or a sentinel if none exists.",
    "It combines hashing with the need to keep order, which is the point of the question.",
    "Simple text analysis and character frequency tasks.",
    "Do not use a plain HashMap when order matters, because iteration order is not guaranteed.",
    "Count occurrences into a LinkedHashMap, then loop over its entries in order and return the first entry with a count of one.",
    "Pros: one clear pass for counts and one for the answer. Cons: more memory than a two pass array method for ASCII.",
    "An int array of size 256 for ASCII, which is faster but limited to the character set.",
    `public static Character firstUnique(String s) {
    Map<Character, Integer> counts = new LinkedHashMap<>();
    for (char c : s.toCharArray()) {
        counts.merge(c, 1, Integer::sum);
    }
    for (Map.Entry<Character, Integer> e : counts.entrySet()) {
        if (e.getValue() == 1) return e.getKey();
    }
    return null;
}`
  ],
  "Group Anagrams": [
    "I group words by a key that is the same for all anagrams, such as the sorted characters of the word. A HashMap from key to list gives the groups in O(n k log k) time, where k is the word length.",
    "Given a list of strings, return groups of strings that are anagrams of each other.",
    "It tests choosing a good hash key and the collections API.",
    "Grouping records by a derived key, such as normalised names or categories.",
    "Do not compare every pair of words, because that is O(n squared) comparisons.",
    "For each word, sort its characters to make a key, use computeIfAbsent to get or create the list for that key, and add the word.",
    "Pros: simple and readable. Cons: sorting each word costs O(k log k).",
    "A count array of 26 letters as the key, which avoids sorting.",
    `public static List<List<String>> groupAnagrams(List<String> words) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String w : words) {
        char[] chars = w.toCharArray();
        Arrays.sort(chars);
        groups.computeIfAbsent(new String(chars), k -> new ArrayList<>()).add(w);
    }
    return new ArrayList<>(groups.values());
}`
  ],
  "LRU Cache": [
    "An LRU cache evicts the least recently used item when it is full. In Java I can build it on LinkedHashMap with access order and removeEldestEntry, which gives O(1) get and put.",
    "Build a cache with a fixed capacity that supports get and put, and drops the least recently used entry when a new key is added to a full cache.",
    "It is a common design question that tests knowledge of hashing and linked structures.",
    "Caching database or API results with a memory limit.",
    "Do not use a plain HashMap, because it has no order and cannot track recency.",
    "Create a LinkedHashMap with accessOrder set to true, override removeEldestEntry to return true when the size exceeds the capacity, and wrap it in a class with get and put.",
    "Pros: short and correct in Java. Cons: it is not thread safe, so a lock or ConcurrentHashMap based design is needed for concurrent use.",
    "A HashMap with a doubly linked list written by hand, which is the classic interview answer in other languages.",
    `class LRUCache<K, V> {
    private final int capacity;
    private final Map<K, V> map;

    LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<K, V>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > LRUCache.this.capacity;
            }
        };
    }

    V get(K key) { return map.get(key); }
    void put(K key, V value) { map.put(key, value); }
}`
  ],
  "Reverse a Linked List": [
    "I reverse a singly linked list iteratively by changing each node's next pointer to the previous node. This is O(n) time and O(1) space.",
    "Given the head of a singly linked list, return the new head after reversing all the links.",
    "It tests pointer handling, which is common in interviews.",
    "Any problem that needs the list in reverse order.",
    "Do not lose the rest of the list before changing next, and do not forget to handle an empty list.",
    "Keep three references (previous, current and next), point current.next to previous, then move all three forward.",
    "Pros: constant space. Cons: pointer logic is easy to get wrong without drawing it.",
    "Recursion, which is shorter but uses O(n) stack space.",
    `static class Node {
    int val;
    Node next;
    Node(int val) { this.val = val; }
}

static Node reverse(Node head) {
    Node prev = null;
    Node current = head;
    while (current != null) {
        Node next = current.next;
        current.next = prev;
        prev = current;
        current = next;
    }
    return prev;
}`
  ],
  "Detect Cycle in a Linked List": [
    "I use Floyd's cycle detection with a slow pointer that moves one step and a fast pointer that moves two steps. If they meet, the list has a cycle. This is O(n) time and O(1) space.",
    "Given the head of a linked list, return true if following next pointers eventually returns to a node already visited.",
    "It is a classic two pointer question that avoids extra memory.",
    "Checking data structures for loops, and the same idea is used in cycle detection in other graphs.",
    "Do not use a HashSet unless the question asks for simplicity and extra memory is acceptable.",
    "Move slow by one and fast by two in a loop, return true if they are ever the same node, and return false when fast reaches the end.",
    "Pros: constant space and linear time. Cons: it only detects the cycle unless extended to find the start node.",
    "A HashSet of visited nodes, which is simpler to explain but uses O(n) space.",
    `static boolean hasCycle(Node head) {
    Node slow = head;
    Node fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}`
  ],
  "Binary Tree Level Order Traversal": [
    "I traverse the tree breadth first with a queue, processing all nodes at each level before moving to the next. The result is a list of lists, one per level. This is O(n) time and O(n) space.",
    "Given the root of a binary tree, return the values grouped by level from top to bottom.",
    "It tests queues and tree traversal, and it is often asked as a follow-up to depth first search.",
    "Level based output, shortest path in an unweighted tree, and printing a tree by level.",
    "Do not use recursion without tracking depth, because the levels become hard to separate.",
    "Add the root to a queue, then for each level read the current queue size, poll that many nodes, add their values to the level list, and offer their children.",
    "Pros: simple and iterative. Cons: the queue can hold a full level of nodes.",
    "Depth first recursion that passes the depth and adds values to the list for that depth.",
    `public static List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> levels = new ArrayList<>();
    if (root == null) return levels;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        List<Integer> level = new ArrayList<>();
        for (int i = queue.size(); i > 0; i--) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        levels.add(level);
    }
    return levels;
}`
  ],
  "Validate Binary Search Tree": [
    "A tree is a valid binary search tree when every node lies within a range defined by its ancestors. I pass the allowed minimum and maximum down the recursion. This is O(n) time and O(h) space, where h is the height.",
    "Given the root of a binary tree, return true if it satisfies the binary search tree rules.",
    "It is a common tree question that tests recursion with bounds, and a frequent trap is checking only the immediate children.",
    "Checking data loaded from storage or verifying tree logic in an interview.",
    "Do not compare only the parent and child values, because a right grandchild can be smaller than the root.",
    "Write a recursive helper with low and high bounds, return false if the node value is outside the bounds, and recurse with updated bounds for each child.",
    "Pros: correct and linear. Cons: the recursion depth equals the tree height.",
    "An in-order traversal that checks values are strictly increasing, which is also O(n).",
    `public static boolean isValidBST(TreeNode root) {
    return isValid(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private static boolean isValid(TreeNode node, long low, long high) {
    if (node == null) return true;
    if (node.val <= low || node.val >= high) return false;
    return isValid(node.left, low, node.val) && isValid(node.right, node.val, high);
}`
  ],
  "Word Frequency Count": [
    "I count how often each word appears. With streams I group the words and count them in one pipeline. With collections I use a HashMap and merge each word into its count. Both are O(n) time.",
    "Given a list of words, return a map from each word to the number of times it appears.",
    "This is one of the most common stream questions, and it shows groupingBy with counting.",
    "Text analysis, log processing and tag counts.",
    "Do not use a HashMap with get and put separately when merge is simpler, and do not forget the Long type that counting returns.",
    "Streams: group by the identity function with the counting collector. Collections: loop over the words and merge each one with Integer sum.",
    "Streams are short and declarative. Collections are explicit and easier to debug step by step.",
    "A TreeMap if the output must be sorted by word.",
    `List<String> words = List.of("java", "stream", "java", "code", "stream", "java");

// Streams
Map<String, Long> freq = words.stream()
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

// Collections
Map<String, Integer> counts = new HashMap<>();
for (String w : words) {
    counts.merge(w, 1, Integer::sum);
}
// {java=3, stream=2, code=1}`
  ],
  "Second Highest Number": [
    "I remove duplicates, sort in descending order, and take the element at position two. With streams I use distinct, sorted and skip. With collections I put the values in a set, copy them to a list and sort. Both return an empty result when there is no second value.",
    "Given a list of integers, return the second largest distinct value, or nothing when it does not exist.",
    "It tests handling duplicates and the Optional type in streams.",
    "Ranking and leaderboard questions.",
    "Do not return the second element of a sorted list that still has duplicates, because the same maximum would be returned twice.",
    "Streams: distinct, sorted in reverse order, skip one, then findFirst. Collections: a HashSet to remove duplicates, a list sorted in reverse order, and a size check.",
    "Streams are concise and lazy. Collections make the duplicate removal and bounds check explicit.",
    "A single pass that tracks the two largest values, which is O(n) with no sorting.",
    `List<Integer> nums = List.of(4, 9, 9, 2, 7);

// Streams
Optional<Integer> second = nums.stream()
        .distinct()
        .sorted(Comparator.reverseOrder())
        .skip(1)
        .findFirst();   // Optional[7]

// Collections
Set<Integer> unique = new HashSet<>(nums);
List<Integer> sorted = new ArrayList<>(unique);
sorted.sort(Collections.reverseOrder());
Integer secondLoop = sorted.size() > 1 ? sorted.get(1) : null;   // 7`
  ],
  "Group Employees by Department": [
    "I group a list of employees into a map from department name to the list of employees in it. With streams I use groupingBy. With collections I use computeIfAbsent so each key starts with an empty list when first seen.",
    "Given a list of employee objects with a department field, return a map from each department to its employees.",
    "Grouping is one of the most used stream operations, and this question checks that you know both approaches.",
    "Reports, dashboards and any summary by category.",
    "Do not use put in a loop without creating the list first, because that overwrites the previous employees.",
    "Streams: collect with groupingBy on the department getter. Collections: loop over employees and add each one to the list returned by computeIfAbsent.",
    "Streams express the grouping in one line. Collections are clearer to a beginner and give more control.",
    "groupingBy with a downstream collector such as counting or averagingDouble to summarise each group.",
    `// Streams
Map<String, List<Employee>> byDept = employees.stream()
        .collect(Collectors.groupingBy(Employee::getDepartment));

// Collections
Map<String, List<Employee>> byDeptLoop = new HashMap<>();
for (Employee e : employees) {
    byDeptLoop.computeIfAbsent(e.getDepartment(), k -> new ArrayList<>()).add(e);
}`
  ],
  "Flatten a List of Lists": [
    "I turn a list of lists into one flat list. With streams I use flatMap to stream each inner list and collect the results. With collections I use nested loops and add every element to a new list.",
    "Given a list where each element is itself a list of integers, return one list with all the values in order.",
    "flatMap is a key stream operation that is often confused with map, so this question tests that difference.",
    "Combining results from several pages, batches or groups.",
    "Do not use map here, because map returns a stream of lists rather than a stream of values.",
    "Streams: flatMap with List::stream, then collect. Collections: loop over the outer list and then over each inner list, adding values to a result list.",
    "flatMap is concise and lazy. Nested loops are simple and avoid stream overhead for small inputs.",
    "Recursion for lists nested to any depth, which needs a different approach than one level of flatMap.",
    `List<List<Integer>> lists = List.of(List.of(1, 2), List.of(3), List.of(4, 5));

// Streams
List<Integer> flat = lists.stream()
        .flatMap(List::stream)
        .toList();   // [1, 2, 3, 4, 5]

// Collections
List<Integer> flatLoop = new ArrayList<>();
for (List<Integer> inner : lists) {
    for (Integer n : inner) {
        flatLoop.add(n);
    }
}`
  ],
  "Top N Highest Salaries": [
    "I sort employees by salary in descending order and take the first N names. With streams I use sorted with a reversed comparator, limit and map. With collections I copy the list, sort it and copy the first N names. Sorting costs O(n log n) in both.",
    "Given a list of employees, return the names of the N people with the highest salaries.",
    "It tests comparators, reversing order and limiting results, which are very common in interviews.",
    "Leaderboards, top sellers and reports that show the highest values.",
    "Do not sort the original list if it must stay unchanged, and do not forget to handle a list shorter than N.",
    "Streams: use Comparator.comparingDouble with reversed, limit to N, then map to the name. Collections: copy the list, sort it with the same comparator, then loop to N and add names.",
    "Streams keep the pipeline in one place. Collections make the copy and bounds handling explicit.",
    "A min heap of size N, which is O(n log N) and better for very large inputs.",
    `// Streams
List<String> top = employees.stream()
        .sorted(Comparator.comparingDouble(Employee::getSalary).reversed())
        .limit(3)
        .map(Employee::getName)
        .toList();

// Collections
List<Employee> copy = new ArrayList<>(employees);
copy.sort(Comparator.comparingDouble(Employee::getSalary).reversed());
List<String> topLoop = new ArrayList<>();
for (int i = 0; i < Math.min(3, copy.size()); i++) {
    topLoop.add(copy.get(i).getName());
}`
  ],
  "Partition Even and Odd Numbers": [
    "I split a list into two groups, even and odd. With streams I use partitioningBy, which returns a map with two keys, true and false. With collections I loop once and add each number to one of two lists.",
    "Given a list of integers, return the even numbers and the odd numbers separately.",
    "partitioningBy is a useful stream collector that always has both keys, which is a subtle point to mention.",
    "Splitting valid and invalid records, or separating work into two queues.",
    "Do not check the sign of negative numbers with n % 2 == 1, because -3 % 2 is -1 in Java. Use n % 2 != 0.",
    "Streams: partitioningBy with a predicate, then read the true and false keys. Collections: create two lists and add each number to the matching list in one loop.",
    "partitioningBy always returns both groups even when one is empty. Collections give the same result with more lines.",
    "groupingBy with a classifier function when there are more than two groups.",
    `List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);

// Streams
Map<Boolean, List<Integer>> parts = nums.stream()
        .collect(Collectors.partitioningBy(n -> n % 2 == 0));
List<Integer> evens = parts.get(true);   // [2, 4, 6]
List<Integer> odds = parts.get(false);   // [1, 3, 5]

// Collections
List<Integer> evenList = new ArrayList<>();
List<Integer> oddList = new ArrayList<>();
for (int n : nums) {
    if (n % 2 == 0) evenList.add(n);
    else oddList.add(n);
}`
  ],
  "First Non-Repeated Element in a Stream": [
    "I count each element with a LinkedHashMap so the order is kept, then return the first element with a count of one. Streams make the counting one collector, and collections use a loop for both steps.",
    "Given a list of values, return the first value that appears exactly once, or an empty Optional when none exists.",
    "It combines groupingBy, ordering and Optional, which are the core ideas of streams.",
    "Finding the first unique item in a feed or the first valid code in a list.",
    "Do not use a plain groupingBy with HashMap when the question asks for the first element, because the map loses the order.",
    "Streams: group with LinkedHashMap::new and counting, then filter entries with a count of one and take the first key. Collections: count with merge into a LinkedHashMap, then loop until the first count of one.",
    "The stream version is concise but reads counts twice. The collections version is easier to step through.",
    "Two passes over the list with a set of seen and a set of repeated values.",
    `List<String> items = List.of("b", "a", "b", "c", "a", "d");

// Streams
Optional<String> unique = items.stream()
        .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()))
        .entrySet().stream()
        .filter(e -> e.getValue() == 1)
        .map(Map.Entry::getKey)
        .findFirst();   // Optional[c]

// Collections
Map<String, Integer> counts = new LinkedHashMap<>();
for (String item : items) {
    counts.merge(item, 1, Integer::sum);
}
String uniqueLoop = null;
for (Map.Entry<String, Integer> e : counts.entrySet()) {
    if (e.getValue() == 1) { uniqueLoop = e.getKey(); break; }
}`
  ],
  "Sum of Squares of Odd Numbers": [
    "I keep the odd numbers, square each one and add them up. Streams do this as filter, map and sum in one pipeline. Collections do it with a loop and an accumulator. Both are O(n) time and O(1) extra space.",
    "Given a list of integers, return the sum of the squares of the odd values.",
    "It is a simple question that checks filter, mapToInt and sum, and the difference between boxed and primitive streams.",
    "Aggregate calculations on filtered data such as totals of eligible amounts.",
    "Do not use map to Integer when sum is needed, because mapToInt avoids boxing and gives sum directly.",
    "Streams: filter for odd values, mapToInt to square, sum. Collections: loop, check odd, add the square to a running total.",
    "Streams are declarative and easy to change. Collections are plain and fast to read for beginners.",
    "IntStream.rangeClosed for generated numbers instead of a list.",
    `List<Integer> nums = List.of(1, 2, 3, 4, 5);

// Streams
int sumStream = nums.stream()
        .filter(n -> n % 2 != 0)
        .mapToInt(n -> n * n)
        .sum();   // 1 + 9 + 25 = 35

// Collections
int sumLoop = 0;
for (int n : nums) {
    if (n % 2 != 0) sumLoop += n * n;
}`
  ],
  "Full CRUD with REST Controller and Database Query": [
    "A complete CRUD API maps each operation to an HTTP method: GET for reading a list and one item, POST to create, PUT or PATCH to update, and DELETE to remove. The controller delegates to a Spring Data repository, which runs the database queries, and it returns correct status codes.",
    "Build a Product API with GET for all products or filtered by category, GET by id, POST to create, PUT to replace, DELETE to remove, and a query endpoint that uses a derived repository method.",
    "Interviewers expect you to know the mapping between HTTP verbs, status codes and the repository methods behind them.",
    "Any resource-based API that stores data in a relational database.",
    "Do not put SQL or business rules in the controller, and do not return 200 OK for everything.",
    "Annotate the entity, extend JpaRepository, add a derived query method, then map each endpoint with GetMapping, PostMapping, PutMapping and DeleteMapping. Return 201 Created with a location for POST, 404 for missing items, and 204 No Content for DELETE. Validate input with @Valid.",
    "Pros: a clear, standard REST design with little code. Cons: a full replace with PUT can drop fields that the client did not send, so PATCH is better for partial updates.",
    "Spring Data REST for automatic endpoints, or GraphQL when clients need flexible queries.",
    `// Entity
@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private BigDecimal price;
    private String category;
    // getters and setters
}

// Repository with derived queries
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(String category);
    List<Product> findByCategoryAndPriceLessThan(String category, BigDecimal max);
}

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository repo;

    public ProductController(ProductRepository repo) { this.repo = repo; }

    @GetMapping                                  // READ list, optional query
    public List<Product> list(@RequestParam(required = false) String category) {
        return category == null ? repo.findAll() : repo.findByCategory(category);
    }

    @GetMapping("/{id}")                         // READ one
    public ResponseEntity<Product> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping                                 // CREATE
    public ResponseEntity<Product> create(@Valid @RequestBody Product p) {
        Product saved = repo.save(p);
        return ResponseEntity.created(URI.create("/api/products/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}")                         // UPDATE (full replace)
    public ResponseEntity<Product> update(@PathVariable Long id, @Valid @RequestBody Product p) {
        return repo.findById(id).map(existing -> {
            existing.setName(p.getName());
            existing.setPrice(p.getPrice());
            existing.setCategory(p.getCategory());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")                      // DELETE
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}`
  ],
  "POST Request from Angular to REST Controller": [
    "The Angular service sends a POST with HttpClient and a typed body, and the Spring controller receives it with @RequestBody and validates it. The component handles success and error responses and shows the result. This is the full path from a form to the database.",
    "Create a product form in Angular that posts the form value to /api/products, and a Spring endpoint that validates the JSON, saves it and returns 201 Created with the saved product.",
    "The question tests both sides of the call, JSON mapping, validation and error handling across the network.",
    "Any form that creates a resource on the server.",
    "Do not send the form object with extra fields, do not ignore 400 and 500 errors, and do not skip validation on the server because the client validated.",
    "In Angular, create a typed method that calls http.post, call it from the component with getRawValue, and handle next and error. In Spring, mark the body with @RequestBody and @Valid, return ResponseEntity with 201, and add a @RestControllerAdvice to return 400 with field errors. During development, use a proxy so /api calls go to the backend without CORS problems.",
    "Pros: a typed contract between the two sides. Cons: the DTO must be kept in sync on both sides, which OpenAPI generation can help with.",
    "Use a form library with server-side errors mapped to fields, or GraphQL mutations.",
    `// Angular: typed service
export interface Product { id?: number; name: string; price: number; category: string; }

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private http = inject(HttpClient);
  create(product: Product) {
    return this.http.post<Product>('/api/products', product);
  }
}

// Angular: component
export class ProductFormComponent {
  private api = inject(ProductApi);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['', Validators.required]
  });
  saved = signal<Product | null>(null);
  error = signal('');

  save() {
    if (this.form.invalid) return;
    this.api.create(this.form.getRawValue()).subscribe({
      next: p => this.saved.set(p),
      error: (e: HttpErrorResponse) => this.error.set(e.error?.message ?? 'Save failed')
    });
  }
}

// Spring Boot: controller
@RestController
@RequestMapping("/api/products")
public class ProductController {
    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody Product p) {
        Product saved = repo.save(p);
        return ResponseEntity.created(URI.create("/api/products/" + saved.getId())).body(saved);
    }
}

// proxy.conf.json (Angular dev server): forward /api to Spring on port 8080
// { "/api": { "target": "http://localhost:8080", "secure": false } }`
  ],
  "Microservice Communication Methods": [
    "Services communicate synchronously, where the caller waits for an answer through REST, gRPC or OpenFeign, or asynchronously, where the caller publishes a message through Kafka or RabbitMQ and continues. I use synchronous calls when I need the answer now, and asynchronous events when other services can react later.",
    "The main methods are REST over HTTP (RestClient, WebClient or OpenFeign), gRPC for fast binary calls, message brokers such as Kafka or RabbitMQ for events and commands, request-reply over messaging, and an API gateway that routes client calls to services.",
    "Services must talk to each other, but direct coupling makes failures spread and deployments risky.",
    "Synchronous for queries that must return now, and asynchronous for commands, notifications and workflows that can finish later.",
    "Do not chain many synchronous calls in one request, because latency adds up and one failure breaks the whole chain.",
    "Use REST or OpenFeign for simple queries with a timeout and a circuit breaker such as Resilience4j. Use Kafka or RabbitMQ for events, make consumers idempotent, and find services with Eureka or Kubernetes service names.",
    "REST is simple and easy to debug but couples availability. Messaging is decoupled and resilient but eventually consistent and harder to trace.",
    "gRPC for high-throughput internal calls, GraphQL at the gateway for client-driven queries, or the outbox pattern for reliable event publishing.",
    `// Synchronous: OpenFeign client, wrapped with a timeout and circuit breaker
@FeignClient(name = "inventory-service")
public interface InventoryClient {
    @GetMapping("/api/inventory/{sku}")
    StockDto stock(@PathVariable String sku);
}

// Asynchronous: publish an event and do not wait for a reply
kafkaTemplate.send("orders.placed", String.valueOf(order.getId()), new OrderPlaced(order.getId(), order.getSku()));

// Consumer in the inventory service
@KafkaListener(topics = "orders.placed", groupId = "inventory")
public void onOrderPlaced(OrderPlaced event) {
    inventoryService.reserve(event.sku());   // must be idempotent
}`
  ],
  "Ways to Receive a Request in a Controller": [
    "A Spring controller receives data from the URL path, query string, headers, cookies, the request body, form fields, uploaded files, the logged-in user or the raw servlet request. I choose the annotation that matches where the client put the data, and I use @RequestBody with a DTO and @Valid for JSON.",
    "The main annotations are @PathVariable, @RequestParam, @RequestBody, @RequestHeader, @CookieValue, @ModelAttribute, @RequestPart for files, @AuthenticationPrincipal for the user, @RequestAttribute for values set by a filter, and HttpServletRequest or HttpEntity for low-level access.",
    "Interviewers check that you know where each part of a request lives and which annotation reads it.",
    "Every controller method that takes client input.",
    "Do not use @RequestBody with GET requests, do not take entities directly from the body, and do not read raw request streams unless you must.",
    "Put identifiers in the path, filters and paging in query parameters, and bodies in @RequestBody with a DTO. Add @Valid for validation, use defaultValue for optional parameters, and use @RequestPart for multipart uploads.",
    "Pros: each source is explicit and easy to test. Cons: many small annotations can clutter a method, so a request DTO or a parameter object helps.",
    "Pass a single request object with @ModelAttribute for many query parameters, or use HttpEntity to read both the body and headers together.",
    `@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // 1. Path variable: GET /api/orders/42
    @GetMapping("/{id}")
    public Order byId(@PathVariable Long id) { return service.find(id); }

    // 2. Query parameters: GET /api/orders?status=OPEN&page=0&size=20
    @GetMapping
    public Page<Order> search(@RequestParam(defaultValue = "OPEN") String status, Pageable pageable) {
        return service.search(status, pageable);
    }

    // 3. JSON body, validated: POST /api/orders
    @PostMapping
    public ResponseEntity<Order> create(@Valid @RequestBody OrderRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    // 4. Headers and cookies
    @GetMapping("/tenant")
    public String tenant(@RequestHeader("X-Tenant-Id") String tenant,
                         @CookieValue(value = "session", required = false) String session) {
        return tenant;
    }

    // 5. Form fields (application/x-www-form-urlencoded) bound to an object
    @PostMapping(path = "/form", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String form(@ModelAttribute OrderForm form) { return "ok"; }

    // 6. File upload (multipart/form-data)
    @PostMapping(path = "/{id}/invoice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> upload(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return ResponseEntity.accepted().build();
    }

    // 7. The logged-in user from the security context
    @GetMapping("/mine")
    public List<Order> mine(@AuthenticationPrincipal Jwt jwt) { return service.forUser(jwt.getSubject()); }

    // 8. Values set by a filter or interceptor
    @GetMapping("/trace")
    public String trace(@RequestAttribute("requestId") String requestId) { return requestId; }

    // 9. Low-level access when the annotations are not enough
    @PutMapping("/raw")
    public void raw(HttpServletRequest request, HttpEntity<byte[]> entity) { }
}`
  ]
};
