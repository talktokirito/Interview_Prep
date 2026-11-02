// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional Java solution to a representative problem]
const SERVICE_ANSWERS = {
  "Big-O Analysis": [
    "Big-O describes how time or space grows with input size, ignoring constants and lower-order terms. State the complexity of your solution, explain the dominant loop or recursion, and mention space including the recursion stack.",
    "Big-O is an upper bound on growth as n becomes large. Common classes in increasing cost are O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n) and O(n!). Amortised analysis averages cost over a sequence of operations, as for ArrayList.add or a hash table resize.",
    "Interviewers ask for it to check that you can compare solutions objectively and spot the bottleneck, and to judge whether your approach fits constraints such as n up to 10^5.",
    "Use it for every solution you propose, and use constraints to pick a target: n up to 10^5 needs O(n log n) or better, n up to 20 allows O(2^n), n up to 500 allows O(n^3).",
    "Do not ignore hidden costs such as string concatenation in a loop (O(n^2)), substring copies, list remove(0), or recursion depth. Big-O also hides constants, so O(n) with a heavy constant can lose to O(n log n) for small n.",
    "Count nested loops, treat halving as log n, sum geometric series, and apply the master theorem for divide and conquer such as T(n) = 2T(n/2) + O(n) which gives O(n log n). Separate time from auxiliary space and say best, average and worst case where they differ.",
    "Pros: a shared language for comparing algorithms. Cons: asymptotic analysis ignores cache behaviour, constants and input distribution.",
    "Alternatives are benchmarking with JMH, average-case or amortised analysis, and Big-Theta for tight bounds.",
    `// Problem: what is the complexity of each snippet?
// O(n^2): nested loops over the same array
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++) check(i, j);

// O(log n): the range halves each iteration
for (int x = n; x > 1; x /= 2) work();

// O(n log n): n elements, each a log n heap operation
PriorityQueue<Integer> pq = new PriorityQueue<>();
for (int v : data) pq.add(v);

// Hidden O(n^2): String += copies the string every time
String s = "";
for (int i = 0; i < n; i++) s += i;       // use StringBuilder instead: O(n)

// Amortised O(1) per add: ArrayList doubles capacity occasionally
List<Integer> list = new ArrayList<>();
for (int i = 0; i < n; i++) list.add(i);`
  ],
  "Arrays and Strings Essentials": [
    "Arrays give O(1) indexed access and contiguous memory, and most array and string problems reduce to a few moves: iterate with indices, use a hash set or map, sort, two pointers, a sliding window or prefix sums. Strings in Java are immutable, so use StringBuilder or char arrays for modification.",
    "An array is a fixed-size block with O(1) read and write, O(n) insert and delete in the middle. A Java String is an immutable sequence of UTF-16 chars, so concatenation and substring creation copy data, and equals compares content while == compares references.",
    "They are the building blocks of nearly every coding question, so interviewers use them to check fundamentals: edge cases, off-by-one errors, in-place manipulation and complexity.",
    "Use them whenever data is naturally sequential. In-place techniques (swap, overwrite, reverse) give O(1) extra space, and counting arrays of size 26 or 128 beat maps for letters.",
    "Do not build strings with += in loops, call list.remove(0) repeatedly, or forget that char arithmetic returns int. Be careful with empty input, single element, duplicates and negative numbers.",
    "Convert with toCharArray, iterate with indices, use int[26] for lowercase counts, use Arrays.sort or Arrays.fill, and use System.arraycopy for block moves. For in-place compaction keep a write index that trails the read index.",
    "Pros: cache friendly, simple, fast. Cons: fixed size, costly middle insertion, and strings cannot be edited in place.",
    "Alternatives are ArrayList for dynamic size, StringBuilder for mutation, deque for efficient ends and hash-based structures for lookup.",
    `// Problem: move all zeros to the end in place, keeping the order of non-zero values.
// Time O(n), space O(1)
static void moveZeroes(int[] a) {
    int write = 0;
    for (int read = 0; read < a.length; read++) {
        if (a[read] != 0) a[write++] = a[read];
    }
    Arrays.fill(a, write, a.length, 0);
}

// Check anagram with a counting array: O(n) time, O(1) space for 26 letters
static boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] cnt = new int[26];
    for (int i = 0; i < s.length(); i++) {
        cnt[s.charAt(i) - 'a']++;
        cnt[t.charAt(i) - 'a']--;
    }
    for (int c : cnt) if (c != 0) return false;
    return true;
}`
  ],
  "Recursion and the Call Stack": [
    "Recursion solves a problem by reducing it to smaller instances of itself, with a base case to stop and a recursive step. Each call uses a stack frame, so depth costs O(depth) space and Java will throw StackOverflowError for very deep recursion since it does not optimise tail calls.",
    "A recursive function needs a base case, a progress step toward it, and trust that the recursive call returns the right answer for the smaller input. The JVM stack holds each frame's arguments, locals and return address, typically allowing a depth of around 10,000 to 20,000 frames by default.",
    "Recursion expresses trees, graphs, divide and conquer, backtracking and DP naturally, and interviewers use it to test decomposition and the ability to reason about the call stack and complexity.",
    "Use it for tree and graph traversal, permutations and subsets, divide and conquer (merge sort), and memoised DP. Draw the recursion tree to derive complexity.",
    "Avoid recursion where depth can reach 10^5 or more (linked list of a million nodes, skewed tree), or where the same subproblems repeat without memoisation, as with naive Fibonacci in O(2^n).",
    "Define the function signature precisely, write base cases first, combine results from the recursive calls, add memoisation with a map or array if subproblems overlap, and convert to an explicit Deque stack or iteration if depth is a risk.",
    "Pros: short, readable code that mirrors the problem. Cons: stack overflow risk, call overhead and O(depth) space that is easy to forget when stating complexity.",
    "Alternatives are iteration with an explicit stack, dynamic programming bottom-up, and tail-call elimination by hand using a loop.",
    `// Problem: compute n-th Fibonacci number with memoisation.
// Time O(n), space O(n) for the memo table and recursion stack
static long fib(int n, long[] memo) {
    if (n <= 1) return n;                       // base case
    if (memo[n] != 0) return memo[n];
    return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
}

// Problem: reverse a string recursively (depth n, so use only for short strings).
static String reverse(String s) {
    if (s.length() <= 1) return s;
    return reverse(s.substring(1)) + s.charAt(0);   // O(n^2) because of substring copies
}`
  ],
  "Bit Manipulation": [
    "Bit tricks operate directly on the binary representation for O(1) operations: n & (n - 1) clears the lowest set bit, n & -n isolates it, XOR cancels equal values and shifts multiply or divide by powers of two. Typical uses are single-number, power of two, counting bits and subset masks.",
    "Operators are & (and), | (or), ^ (xor), ~ (not), << (left shift), >> (arithmetic right shift keeping sign) and >>> (logical right shift). Java ints are 32-bit two's complement, so -1 has all bits set and shifts mask the shift count to 5 bits for int and 6 for long.",
    "Bit tricks give O(1) memory and constant-time solutions to problems that otherwise need a set or counting, and they are the basis of bitmask DP and compact flags.",
    "Use for finding the unique element with XOR, checking power of two with n > 0 and (n & (n - 1)) == 0, counting set bits with Integer.bitCount, representing subsets of up to about 20 elements as a mask, and toggling flags.",
    "Do not use them when they harm readability for no gain, and be careful with sign: use >>> for unsigned shifts, use 1L << k when k can reach 32 or more, and note that Math.abs(Integer.MIN_VALUE) is negative.",
    "Set bit: n | (1 << i). Clear: n & ~(1 << i). Toggle: n ^ (1 << i). Test: (n >> i) & 1. Iterate subsets of a mask with sub = (sub - 1) & mask. Use Integer.bitCount, Integer.highestOneBit and Integer.numberOfTrailingZeros instead of loops.",
    "Pros: very fast and compact. Cons: easy to introduce sign and overflow bugs, and less readable.",
    "Alternatives are boolean arrays or BitSet for larger sets, hash sets for uniqueness and plain arithmetic for clarity.",
    `// Problem: every element appears twice except one; find the single one.
// Time O(n), space O(1)
static int singleNumber(int[] nums) {
    int x = 0;
    for (int v : nums) x ^= v;          // equal pairs cancel out
    return x;
}

// Problem: count set bits in n (Kernighan). Time O(set bits), space O(1)
static int countBits(int n) {
    int count = 0;
    while (n != 0) { n &= n - 1; count++; }
    return count;
}

// Enumerate all subsets of an array of size k using a mask: O(k * 2^k)
static List<List<Integer>> subsets(int[] a) {
    List<List<Integer>> out = new ArrayList<>();
    for (int mask = 0; mask < (1 << a.length); mask++) {
        List<Integer> cur = new ArrayList<>();
        for (int i = 0; i < a.length; i++) if ((mask & (1 << i)) != 0) cur.add(a[i]);
        out.add(cur);
    }
    return out;
}`
  ],
  "Sorting Algorithms": [
    "Know the main sorts: merge sort and heap sort are O(n log n) worst case, quicksort is O(n log n) average but O(n^2) worst, and insertion sort is O(n^2) but fast on small or nearly sorted data. Java uses dual-pivot quicksort for primitives and TimSort (stable, a merge sort and insertion sort hybrid) for objects.",
    "A sort is stable if equal elements keep their relative order, and in-place if it uses O(1) extra space. Merge sort is stable and uses O(n) space, quicksort is in-place but not stable, heap sort is in-place and not stable, and counting or radix sorts run in O(n + k) for bounded integer keys.",
    "Sorting is the first step of many solutions (intervals, two pointers, greedy), and interviewers ask for the algorithms to check complexity analysis and the ability to implement divide and conquer.",
    "Use Arrays.sort or Collections.sort for real code, and write merge sort or quicksort by hand when asked. Use counting sort when values fall in a small range and use a partition (quickselect) when only the k-th element is needed.",
    "Do not sort when a hash map or heap gives a better bound, and do not use a Comparator that subtracts ints, since a - b can overflow. Sorting objects with a comparator that is inconsistent can throw IllegalArgumentException in TimSort.",
    "Merge sort: split, sort halves recursively, merge with a temp array in O(n). Quicksort: choose a pivot (randomised), partition, recurse on both sides. Use Comparator.comparingInt(...).thenComparing(...) for multi-key sorting of objects.",
    "Pros: well-understood bounds, library support. Cons: comparison sorts cannot beat O(n log n), and quicksort needs a good pivot choice to avoid the worst case.",
    "Alternatives are heap-based partial sort for top k, quickselect for the k-th element (average O(n)), counting sort and radix sort for integers, and bucket sort for uniform data.",
    `// Problem: sort an array with merge sort.
// Time O(n log n), space O(n)
static void mergeSort(int[] a, int lo, int hi, int[] tmp) {
    if (hi - lo < 2) return;
    int mid = (lo + hi) >>> 1;
    mergeSort(a, lo, mid, tmp);
    mergeSort(a, mid, hi, tmp);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];   // <= keeps it stable
    while (i < mid) tmp[k++] = a[i++];
    while (j < hi) tmp[k++] = a[j++];
    System.arraycopy(tmp, lo, a, lo, hi - lo);
}
// usage: mergeSort(a, 0, a.length, new int[a.length]);

// Comparator pitfall: (a, b) -> a - b can overflow. Use Integer.compare(a, b).`
  ],
  "Two Pointers": [
    "Two pointers use two indices that move through a sequence, either from both ends toward each other (sorted array, palindromes) or in the same direction (partitioning, removing duplicates). They turn many O(n^2) pair searches into O(n) with O(1) space.",
    "Opposite-direction pointers rely on a monotonic property: in a sorted array, moving the left pointer increases the sum and moving the right pointer decreases it. Same-direction pointers use a slow write index and a fast read index.",
    "It is a staple pattern: pair sum in a sorted array, 3Sum, container with most water, remove duplicates, valid palindrome and merging sorted arrays all use it.",
    "Use it when the input is sorted or can be sorted, when you search for a pair or triplet with a target, or when you need to compact or partition an array in place.",
    "Do not use it on unsorted data where order cannot be changed and no monotonic property exists, where a hash map is the better fit, or when the problem needs all pairs rather than the existence or best of them.",
    "Initialise left and right, loop while left < right, compare the current value with the target and move the pointer that can improve it, skipping duplicates when unique results are needed. For 3Sum, fix one element and run two pointers on the rest.",
    "Pros: O(n) time and O(1) space after sorting. Cons: sorting costs O(n log n) and destroys the original indices, so it is awkward when indices must be returned.",
    "Alternatives are a hash map for unsorted pair sum (O(n) time, O(n) space), binary search for each element (O(n log n)), and sliding window for contiguous subarrays.",
    `// Problem: 3Sum - find all unique triplets in nums that sum to zero.
// Time O(n^2), space O(1) extra (ignoring output and sort)
static List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> out = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;          // skip duplicate anchors
        int l = i + 1, r = nums.length - 1;
        while (l < r) {
            int sum = nums[i] + nums[l] + nums[r];
            if (sum == 0) {
                out.add(List.of(nums[i], nums[l], nums[r]));
                while (l < r && nums[l] == nums[l + 1]) l++;
                while (l < r && nums[r] == nums[r - 1]) r--;
                l++; r--;
            } else if (sum < 0) l++;
            else r--;
        }
    }
    return out;
}`
  ],
  "Sliding Window": [
    "A sliding window maintains a contiguous range [left, right] and adjusts it as it moves, updating state incrementally instead of recomputing. Fixed-size windows slide by one, variable-size windows expand right and shrink left while a condition is violated, both in O(n).",
    "The window state is typically a sum, a count map or a distinct count. Each element enters once when right advances and leaves once when left advances, so total work is O(n) even with a nested while loop.",
    "It is the standard answer for longest or shortest substring or subarray with a constraint, such as no repeats, at most k distinct, sum at least target, or a fixed-length maximum average.",
    "Use it for contiguous subarray or substring problems where the constraint is monotonic: expanding makes it worse (or better) and shrinking reverses that. Positive numbers are usually required for sum-based windows.",
    "Do not use it when the subarray need not be contiguous, or when negative numbers break monotonicity of the sum (use prefix sums with a hash map instead).",
    "Move right and add the element to the state; while the window is invalid, remove nums[left] and increment left; record the best length after each step. Use an int[128] or HashMap for character counts.",
    "Pros: linear time and small memory. Cons: only works for contiguous windows with a monotonic condition, and the shrink condition is easy to get subtly wrong.",
    "Alternatives are prefix sums with a hash map (handles negatives), two pointers on sorted data, brute force O(n^2), and monotonic deque for window maximum.",
    `// Problem: length of the longest substring without repeating characters.
// Time O(n), space O(min(n, alphabet))
static int lengthOfLongestSubstring(String s) {
    int[] lastSeen = new int[128];
    Arrays.fill(lastSeen, -1);
    int best = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (lastSeen[c] >= left) left = lastSeen[c] + 1;   // jump left past the previous copy
        lastSeen[c] = right;
        best = Math.max(best, right - left + 1);
    }
    return best;
}`
  ],
  "Prefix Sum": [
    "A prefix sum array stores cumulative totals so any range sum is prefix[r + 1] - prefix[l] in O(1) after O(n) preprocessing. Combined with a hash map of seen prefix values, it counts subarrays with a given sum even when values are negative.",
    "Define prefix[0] = 0 and prefix[i + 1] = prefix[i] + a[i]. The sum of a[l..r] is prefix[r + 1] - prefix[l]. The same idea extends to 2D grids with inclusion-exclusion and to difference arrays for range updates.",
    "It converts repeated range queries from O(n) each to O(1), and the hash map variant is the key to subarray-sum-equals-K and many counting problems.",
    "Use it for many range sum queries on static data, subarrays summing to K, equal zeros and ones (map 0 to -1), and range add operations with a difference array.",
    "Do not use it when the array is updated frequently between queries (use a Fenwick tree or segment tree), and watch for overflow, since prefix sums can exceed int and need long.",
    "Build the array in one pass. For counting, keep a map from prefix value to count, seed it with {0: 1}, and for each running sum add map.get(sum - k) to the answer before recording the sum. For range updates add v at l and subtract v at r + 1 in a difference array, then prefix-sum it.",
    "Pros: O(1) queries and simple. Cons: O(n) extra space and static data only; each update invalidates the structure.",
    "Alternatives are Fenwick tree or segment tree for dynamic updates (O(log n) both), sliding window for non-negative arrays, and sqrt decomposition.",
    `// Problem: count subarrays whose sum equals k (values may be negative).
// Time O(n), space O(n)
static int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, 1);                       // empty prefix
    int sum = 0, count = 0;
    for (int v : nums) {
        sum += v;
        count += seen.getOrDefault(sum - k, 0);
        seen.merge(sum, 1, Integer::sum);
    }
    return count;
}

// Range sum query with a prefix array: O(1) per query
static long[] buildPrefix(int[] a) {
    long[] p = new long[a.length + 1];
    for (int i = 0; i < a.length; i++) p[i + 1] = p[i] + a[i];
    return p;                              // sum(l..r) = p[r + 1] - p[l]
}`
  ],
  "Binary Search (and Search on Answer)": [
    "Binary search halves a sorted or monotonic search space each step for O(log n). Search on answer applies it to a value range: if you can test in O(n) whether answer x is feasible and feasibility is monotonic, you binary search on x for O(n log range).",
    "Maintain lo and hi, compute mid = lo + (hi - lo) / 2 to avoid overflow, and shrink to the half that can contain the answer. Variants find the first or last occurrence (lower and upper bound) or the smallest value satisfying a predicate.",
    "It appears directly (search in a rotated array, first bad version) and indirectly (minimum capacity to ship packages in D days, Koko eating bananas, split array largest sum).",
    "Use it when data is sorted, when the answer lies in a numeric range with a monotonic yes or no check, or when you can discard half the options by comparing with mid.",
    "Do not use it on unsorted data without a monotonic property. Beware of infinite loops from lo = mid, and of off-by-one errors from mixing inclusive and exclusive bounds.",
    "Pick one invariant and stick to it. For the first true in a monotonic predicate: lo = 0, hi = n, while (lo < hi) { mid = lo + (hi - lo) / 2; if (ok(mid)) hi = mid; else lo = mid + 1; } and the answer is lo. Use Arrays.binarySearch or Collections.binarySearch for plain lookups.",
    "Pros: O(log n) and applicable to many hidden-monotonic problems. Cons: subtle boundary bugs, and requires sorted or monotonic structure.",
    "Alternatives are hash lookup for exact search (O(1)), a TreeMap for floor and ceiling with updates, ternary search for unimodal functions, and linear scan for small n.",
    `// Problem: minimum ship capacity so all packages ship within 'days' days (order kept).
// Time O(n log(sum)), space O(1)
static int shipWithinDays(int[] weights, int days) {
    int lo = 0, hi = 0;
    for (int w : weights) { lo = Math.max(lo, w); hi += w; }   // answer is in [max, sum]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (feasible(weights, days, mid)) hi = mid;            // capacity works, try smaller
        else lo = mid + 1;
    }
    return lo;
}
private static boolean feasible(int[] w, int days, int cap) {
    int used = 1, load = 0;
    for (int x : w) {
        if (load + x > cap) { used++; load = 0; }
        load += x;
    }
    return used <= days;
}

// First index with a[i] >= target (lower bound)
static int lowerBound(int[] a, int target) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= target) hi = mid; else lo = mid + 1;
    }
    return lo;
}`
  ],
  "Hash Map Frequency Patterns": [
    "A HashMap or int[] counter gives O(1) average lookup and insert, which replaces nested loops for frequency counting, grouping, complement lookup and duplicate detection. Typical problems are two sum, group anagrams, first unique character and subarray sums with a prefix map.",
    "HashMap stores key-value pairs by hash with O(1) average get and put, O(n) worst case on heavy collisions (treeified to O(log n) for buckets over 8 entries since Java 8). Useful methods are getOrDefault, merge, computeIfAbsent and entrySet iteration.",
    "It is the most common way to trade O(n) space for time, so interviewers expect you to reach for it, and they probe on key design, collisions and the equals and hashCode contract.",
    "Use it for counting, grouping by a canonical key (sorted string, tuple of counts), finding complements, detecting duplicates, caching and remembering the first index of a value.",
    "Do not use mutable objects as keys, arrays as keys (identity hash) or rely on iteration order of HashMap. Prefer an int[26] array for lowercase letters, and TreeMap or LinkedHashMap when ordering is needed.",
    "Count with map.merge(key, 1, Integer::sum), group with computeIfAbsent(key, k -> new ArrayList<>()).add(x), and for complement search check the map before inserting the current element. For anagrams build the key from a sorted char array or a count signature.",
    "Pros: simple and linear. Cons: extra memory, boxing overhead for Integer keys, and hash-flooding or poor hashCode can degrade performance.",
    "Alternatives are counting arrays for small alphabets, sorting then scanning (O(n log n), O(1) space), TreeMap for ordered queries and bitsets for dense integers.",
    `// Problem: group anagrams together.
// Time O(n * k log k) for n words of length k, space O(n * k)
static List<List<String>> groupAnagrams(String[] words) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String w : words) {
        char[] chars = w.toCharArray();
        Arrays.sort(chars);
        groups.computeIfAbsent(new String(chars), k -> new ArrayList<>()).add(w);
    }
    return new ArrayList<>(groups.values());
}

// Problem: two sum - return indices of two numbers adding up to target. Time O(n), space O(n)
static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> idx = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        Integer j = idx.get(target - nums[i]);
        if (j != null) return new int[] { j, i };
        idx.put(nums[i], i);
    }
    return new int[0];
}`
  ],
  "Top K Elements (Heap)": [
    "For the k largest or most frequent elements, keep a min-heap of size k: each element costs O(log k), total O(n log k), and the heap root is always the k-th largest. It beats full sorting when k is much smaller than n and also works on streams.",
    "A heap is a complete binary tree stored in an array where each parent is smaller (min-heap) or larger than its children, with O(log n) insert and remove and O(1) peek. Java's PriorityQueue is a binary min-heap, and a max-heap needs Comparator.reverseOrder().",
    "Top-k is among the most common patterns: k-th largest, top k frequent words, k closest points and merge k sorted lists all use a heap, and the follow-ups cover streaming and complexity trade-offs.",
    "Use it when you need only the best k items, when data arrives as a stream, or when you must merge k sorted sources. For frequency problems count first with a map and then push entries into the heap.",
    "Do not use it when k is close to n (sorting is simpler), when quickselect's average O(n) is acceptable, or when you need random access into the heap, since PriorityQueue.remove(Object) is O(n) and iteration order is not sorted.",
    "For the k largest, maintain a min-heap: add each element, and if size exceeds k, poll the smallest. At the end the heap holds the k largest. Provide a comparator for custom ordering, and use Integer.compare, not subtraction.",
    "Pros: O(n log k) time, O(k) space, streaming friendly. Cons: slower than quickselect on average for a one-off k-th element, and results come out in heap order, not sorted.",
    "Alternatives are sorting (O(n log n)), quickselect (average O(n), worst O(n^2)), bucket sort for frequency (O(n)), and a TreeMap or TreeSet for sorted windows.",
    `// Problem: return the k most frequent elements.
// Time O(n log k), space O(n)
static int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int v : nums) freq.merge(v, 1, Integer::sum);

    PriorityQueue<Map.Entry<Integer, Integer>> heap =
        new PriorityQueue<>(Comparator.comparingInt(Map.Entry::getValue));   // min-heap by count
    for (var e : freq.entrySet()) {
        heap.offer(e);
        if (heap.size() > k) heap.poll();                                    // drop the least frequent
    }
    int[] out = new int[k];
    for (int i = k - 1; i >= 0; i--) out[i] = heap.poll().getKey();
    return out;
}`
  ],
  "Fast and Slow Pointers": [
    "Fast and slow pointers move at different speeds, usually one and two steps, to find a cycle, the middle of a list, or a cycle start in O(n) time and O(1) space. If there is a cycle the fast pointer eventually meets the slow one (Floyd's algorithm).",
    "In a list with a cycle, the gap between fast and slow shrinks by one each step, so they must meet. To find the cycle start, reset one pointer to the head after the meeting and advance both one step at a time until they meet again. When fast reaches the end, slow is at the middle.",
    "It solves cycle detection, finding the middle node, the k-th from the end, happy number, palindrome linked list and finding a duplicate number, and shows that you can avoid extra memory.",
    "Use it on linked lists and on sequences defined by a function x -> f(x), such as digit-square sums or the array-as-linked-list duplicate problem.",
    "Do not use it when a hash set is acceptable and clearer, or when nodes are not linked in a single direction. Always null-check fast and fast.next to avoid a NullPointerException.",
    "Start both at the head, loop while fast != null and fast.next != null, advance slow by 1 and fast by 2, and compare for equality. For the cycle start, after meeting set a pointer to head and move both by one step until they coincide.",
    "Pros: O(1) space and a single pass. Cons: the reasoning behind finding the cycle start is subtle and the solution is harder to explain than a visited set.",
    "Alternatives are a HashSet of visited nodes (O(n) space), marking nodes, and Brent's cycle detection algorithm.",
    `class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

// Problem: return the node where a cycle begins, or null if there is none.
// Time O(n), space O(1)
static ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {                     // meeting point inside the cycle
            ListNode p = head;
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;                           // cycle start
        }
    }
    return null;
}

// Middle of the list: when fast hits the end, slow is at the middle
static ListNode middle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
    return slow;
}`
  ],
  "Merge Intervals": [
    "Sort intervals by start, then sweep once, merging each interval into the last one if it overlaps (start is at most the last end). This gives O(n log n) time dominated by sorting, and a single linear pass.",
    "Two intervals overlap when a.start <= b.end and b.start <= a.end. After sorting by start, an interval can only overlap with the most recent merged one, so keeping the current merged interval is enough.",
    "Interval problems are common: merge intervals, insert interval, meeting rooms, non-overlapping intervals and the minimum number of rooms or arrows. They test sorting plus a sweep and careful boundary handling.",
    "Use it for calendar and scheduling problems, range union, and overlap counts. For counting simultaneous intervals use a sweep over sorted starts and ends or a min-heap of end times.",
    "Do not forget to decide whether touching intervals like [1,2] and [2,3] overlap, and do not sort by end for a merge. Sorting with a - b can overflow, so use Integer.compare.",
    "Sort by start, add the first interval to the result, then for each next interval, if next.start <= last.end set last.end = max(last.end, next.end), else append it. For rooms, sort starts and use a min-heap of end times: reuse a room if the earliest end is at most the next start.",
    "Pros: simple and O(n log n). Cons: needs sorting first, and mutating the input arrays can surprise callers.",
    "Alternatives are a sweep line with events (+1 at start, -1 at end), an interval tree or TreeMap for dynamic insertion, and a difference array for small coordinate ranges.",
    `// Problem: merge all overlapping intervals.
// Time O(n log n), space O(n) for the output
static int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> out = new ArrayList<>();
    for (int[] cur : intervals) {
        if (out.isEmpty() || out.get(out.size() - 1)[1] < cur[0]) {
            out.add(new int[] { cur[0], cur[1] });          // no overlap with the last merged
        } else {
            int[] last = out.get(out.size() - 1);
            last[1] = Math.max(last[1], cur[1]);            // extend the last merged interval
        }
    }
    return out.toArray(new int[0][]);
}`
  ],
  "Monotonic Stack": [
    "A monotonic stack keeps elements in increasing or decreasing order so each element is pushed and popped once, solving next greater element, daily temperatures, largest rectangle in a histogram and trapping rain water in O(n). Pop while the new element breaks the order, and the popped elements have found their answer.",
    "Maintain a stack of indices whose values are monotonic. When a new value is greater than the top (for next greater), pop the top and record the new value as its answer, then push the new index. Each index enters and leaves once, so the total is O(n).",
    "It turns O(n^2) nearest greater or smaller searches into a linear pass, and it is the key technique behind the histogram and stock span problems.",
    "Use it for the next or previous greater or smaller element, spans, and area problems where each bar needs its nearest smaller neighbours on both sides.",
    "Do not use it when the answer depends on non-adjacent ordering that a stack cannot capture, or for window-limited queries where a monotonic deque is needed. Store indices rather than values if you need distances.",
    "Iterate once; while stack is not empty and the current value is greater than the value at the stack top, pop and resolve it; then push the current index. After the loop, anything left has no greater element. For histograms, pop when the current bar is lower and compute width from the new stack top.",
    "Pros: O(n) time and O(n) space with simple code. Cons: it takes practice to choose increasing versus decreasing order and strict versus non-strict comparison.",
    "Alternatives are brute force O(n^2), a segment tree or sparse table for range queries, and a monotonic deque for sliding window maximum.",
    `// Problem: for each day, how many days until a warmer temperature (0 if none).
// Time O(n), space O(n)
static int[] dailyTemperatures(int[] t) {
    int[] ans = new int[t.length];
    Deque<Integer> stack = new ArrayDeque<>();       // indices with decreasing temperatures
    for (int i = 0; i < t.length; i++) {
        while (!stack.isEmpty() && t[i] > t[stack.peek()]) {
            int j = stack.pop();
            ans[j] = i - j;
        }
        stack.push(i);
    }
    return ans;
}

// Problem: largest rectangle in a histogram. Time O(n), space O(n)
static int largestRectangle(int[] h) {
    Deque<Integer> st = new ArrayDeque<>();
    int best = 0;
    for (int i = 0; i <= h.length; i++) {
        int cur = i == h.length ? 0 : h[i];
        while (!st.isEmpty() && cur < h[st.peek()]) {
            int height = h[st.pop()];
            int left = st.isEmpty() ? -1 : st.peek();
            best = Math.max(best, height * (i - left - 1));
        }
        st.push(i);
    }
    return best;
}`
  ],
  "Reverse a Linked List": [
    "Reverse in place by walking the list and flipping each next pointer, keeping prev, current and next references, in O(n) time and O(1) space. The recursive version is equally O(n) time but uses O(n) stack.",
    "A singly linked list node holds a value and a next pointer. Reversal re-points every node's next to its predecessor and returns the old tail as the new head.",
    "It is a warm-up that tests pointer manipulation and null handling, and it is the base for harder problems such as reverse in groups of k, reverse between positions, palindrome list and reorder list.",
    "Use iterative reversal as the default. Combine with fast and slow pointers to find the middle and reverse the second half, for example in the palindrome check.",
    "Do not use the recursive form on very long lists, since it risks StackOverflowError, and do not lose the next pointer before overwriting it. Handle empty and single-node lists.",
    "Iterate with prev = null and curr = head. In each step save next = curr.next, set curr.next = prev, move prev = curr, then curr = next. Return prev. For partial reversal use a dummy node before the segment.",
    "Pros: O(1) extra space and a single pass. Cons: mutates the list, which may be unacceptable, and one slip in the pointer order breaks the list.",
    "Alternatives are the recursive approach, pushing nodes into a stack (O(n) space), copying values into an array and writing them back, and a doubly linked list where reversal swaps next and prev.",
    `class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

// Problem: reverse a singly linked list.
// Time O(n), space O(1)
static ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;   // save before overwriting
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

// Recursive version: time O(n), space O(n) for the stack
static ListNode reverseRec(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode newHead = reverseRec(head.next);
    head.next.next = head;
    head.next = null;
    return newHead;
}`
  ],
  "Binary Tree Traversals": [
    "Depth-first traversals visit nodes as preorder (root, left, right), inorder (left, root, right) and postorder (left, right, root), and level order uses a queue. All run in O(n) time, with O(h) stack space for DFS and O(w) for BFS where h is height and w is the maximum width.",
    "Inorder on a binary search tree yields sorted values, preorder is used to serialise and copy a tree, and postorder processes children before the parent, as in computing height or deleting a tree. Level order groups nodes by depth.",
    "Almost every tree problem is a traversal plus some state, so it tests recursion, iterative stack usage and the ability to choose the right order.",
    "Use recursion for clarity, an explicit stack for iterative inorder or to avoid deep recursion, a queue with a level-size loop for level order, and Morris traversal when O(1) space is required.",
    "Do not use recursion on a degenerate tree of hundreds of thousands of nodes without considering stack depth. Check for a null root and remember that h is n for a skewed tree.",
    "Recursion: handle null, process or recurse in the required order. Iterative inorder: push left nodes until null, pop, visit, then move to the right child. Level order: record queue.size() at the start of each level and poll that many nodes.",
    "Pros: simple and linear. Cons: recursive depth equals tree height, and iterative postorder is trickier than the other two.",
    "Alternatives are Morris traversal (O(1) space, mutates temporarily), parent pointers, and Euler tour arrays for subtree queries.",
    `class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }

// Problem: return the level order traversal of a binary tree.
// Time O(n), space O(w) where w is the maximum width
static List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Queue<TreeNode> q = new ArrayDeque<>();
    q.add(root);
    while (!q.isEmpty()) {
        int size = q.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left != null) q.add(n.left);
            if (n.right != null) q.add(n.right);
        }
        out.add(level);
    }
    return out;
}

// Iterative inorder: time O(n), space O(h)
static List<Integer> inorder(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    Deque<TreeNode> st = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !st.isEmpty()) {
        while (cur != null) { st.push(cur); cur = cur.left; }
        cur = st.pop();
        out.add(cur.val);
        cur = cur.right;
    }
    return out;
}`
  ],
  "BFS and DFS": [
    "BFS explores a graph level by level with a queue and finds shortest paths in unweighted graphs, while DFS goes deep with recursion or a stack and suits connectivity, cycle detection, components and path enumeration. Both run in O(V + E) with a visited set.",
    "BFS visits nodes in increasing distance from the source, so the first time it reaches a node is the shortest path in edges. DFS follows one path to its end before backtracking and records entry and exit order, which is useful for topological order and cycle detection.",
    "Graph and grid questions (number of islands, word ladder, shortest path in a maze, clone graph) reduce to these two, and interviewers check that you pick the correct one and avoid revisiting nodes.",
    "Use BFS for the shortest number of steps, levels or nearest target, and multi-source problems like rotting oranges. Use DFS for exploring all possibilities, counting components, flood fill and detecting cycles.",
    "Do not use DFS for shortest paths in unweighted graphs, or BFS where memory for a wide frontier is a problem. Always mark visited when enqueuing (not when dequeuing) to avoid duplicates, and consider stack depth for recursive DFS on large grids.",
    "Represent the graph as List<List<Integer>> adjacency lists or use grid directions {{1,0},{-1,0},{0,1},{0,-1}}. BFS: add the start, mark visited, poll, and push unvisited neighbours with distance + 1. DFS: recurse into unvisited neighbours, or use an ArrayDeque as an explicit stack.",
    "Pros: linear time and simple. Cons: O(V) memory for visited and the frontier, and neither handles weighted edges (use Dijkstra).",
    "Alternatives are Dijkstra for weighted edges, 0-1 BFS with a deque for weights 0 and 1, A* with a heuristic, bidirectional BFS to cut the search space, and Union-Find for connectivity only.",
    `// Problem: count the number of islands in a grid of '1' (land) and '0' (water).
// Time O(R * C), space O(R * C) worst-case recursion depth
static int numIslands(char[][] grid) {
    int count = 0;
    for (int r = 0; r < grid.length; r++)
        for (int c = 0; c < grid[0].length; c++)
            if (grid[r][c] == '1') { count++; sink(grid, r, c); }
    return count;
}
private static void sink(char[][] g, int r, int c) {
    if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
    g[r][c] = '0';                                     // mark visited
    sink(g, r + 1, c); sink(g, r - 1, c); sink(g, r, c + 1); sink(g, r, c - 1);
}

// BFS shortest path in an unweighted graph: time O(V + E), space O(V)
static int shortestPath(List<List<Integer>> adj, int src, int dst) {
    int[] dist = new int[adj.size()];
    Arrays.fill(dist, -1);
    Queue<Integer> q = new ArrayDeque<>();
    q.add(src); dist[src] = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        if (u == dst) return dist[u];
        for (int v : adj.get(u)) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.add(v); }
    }
    return -1;
}`
  ],
  "Binary Search Tree Operations": [
    "A BST keeps left subtree values smaller and right subtree values larger than the node, giving O(h) search, insert and delete, which is O(log n) when balanced and O(n) when skewed. Inorder traversal gives sorted order, and deleting a node with two children replaces it with its inorder successor.",
    "The BST property must hold for the whole subtree, not just for direct children, so validation needs min and max bounds. Self-balancing variants such as red-black trees (used by TreeMap) and AVL trees guarantee O(log n).",
    "BST questions test recursion on trees and use of the ordering invariant: validate BST, k-th smallest, lowest common ancestor, insert and delete a node, and convert a sorted array to a balanced BST.",
    "Use it when you need ordered data with floor, ceiling and range queries, and use TreeMap or TreeSet in real Java code instead of writing your own.",
    "Do not assume balance: inserting sorted data into a plain BST creates a linked list. Do not validate by comparing only with the parent, and remember duplicates need a policy.",
    "Search: go left or right by comparison. Insert: recurse to a null link and attach a new node. Delete: leaf is removed, one child is replaced by that child, two children copy the minimum of the right subtree then delete that minimum. Validate with recursion passing (low, high) bounds, using long to avoid overflow with Integer.MIN_VALUE.",
    "Pros: ordered operations in O(log n) if balanced. Cons: worst case O(n) when unbalanced, and pointer-heavy memory layout is not cache friendly.",
    "Alternatives are TreeMap (red-black tree), AVL or B-tree, skip lists (ConcurrentSkipListMap), sorted arrays with binary search and hash maps when ordering is not needed.",
    `class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }

// Problem: validate that a binary tree is a BST.
// Time O(n), space O(h)
static boolean isValidBST(TreeNode root) {
    return valid(root, Long.MIN_VALUE, Long.MAX_VALUE);
}
private static boolean valid(TreeNode n, long lo, long hi) {
    if (n == null) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return valid(n.left, lo, n.val) && valid(n.right, n.val, hi);
}

// Problem: delete a key from a BST. Time O(h), space O(h)
static TreeNode delete(TreeNode root, int key) {
    if (root == null) return null;
    if (key < root.val) root.left = delete(root.left, key);
    else if (key > root.val) root.right = delete(root.right, key);
    else {
        if (root.left == null) return root.right;
        if (root.right == null) return root.left;
        TreeNode min = root.right;
        while (min.left != null) min = min.left;       // inorder successor
        root.val = min.val;
        root.right = delete(root.right, min.val);
    }
    return root;
}`
  ],
  "Topological Sort": [
    "A topological order lists the nodes of a directed acyclic graph so every edge goes from earlier to later. Kahn's algorithm repeatedly removes nodes with in-degree zero using a queue, runs in O(V + E), and detects a cycle if fewer than V nodes are produced.",
    "It exists only for DAGs. Kahn's BFS approach tracks in-degrees, while the DFS approach appends a node after all its descendants have been visited and reverses the result, with a three-state visited array to detect cycles.",
    "Dependency ordering shows up as course schedule, build order, task scheduling and alien dictionary, and interviewers use it to test graph modelling and cycle detection.",
    "Use it whenever there are prerequisites or precedence constraints, to check feasibility of a schedule, or to process a DAG in dependency order for DP on a DAG.",
    "Do not use it on undirected graphs or graphs with cycles (no valid order exists). Remember that the order is usually not unique, so check the problem for tie-breaking, such as lexicographically smallest, which needs a PriorityQueue.",
    "Build adjacency lists and an int[] indegree. Push all zero in-degree nodes into a queue. Poll a node, append it to the order, decrement the in-degree of each neighbour and enqueue when it hits zero. If the result size is not V, there is a cycle.",
    "Pros: linear time and handles cycle detection naturally. Cons: needs the full graph in memory, and the order is not unique.",
    "Alternatives are DFS with post-order and reversal, a PriorityQueue instead of a queue for lexicographic order, and Union-Find if only cycle detection in undirected graphs is needed.",
    `// Problem: given numCourses and prerequisites [course, prereq], return a valid order or empty if impossible.
// Time O(V + E), space O(V + E)
static int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
    int[] indegree = new int[numCourses];
    for (int[] p : prerequisites) {
        adj.get(p[1]).add(p[0]);                 // prereq -> course
        indegree[p[0]]++;
    }
    Queue<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (indegree[i] == 0) q.add(i);

    int[] order = new int[numCourses];
    int idx = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[idx++] = u;
        for (int v : adj.get(u)) if (--indegree[v] == 0) q.add(v);
    }
    return idx == numCourses ? order : new int[0];    // fewer nodes means a cycle
}`
  ],
  "Dijkstra's Shortest Path": [
    "Dijkstra finds the shortest path from a source to all nodes in a graph with non-negative weights using a min-heap on distance, in O((V + E) log V). It repeatedly settles the closest unsettled node and relaxes its outgoing edges.",
    "Keep dist[] initialised to infinity with dist[source] = 0. Pop the node with the smallest distance, skip it if the popped distance is stale, and for each edge (u, v, w) update dist[v] if dist[u] + w is smaller and push the new pair.",
    "Weighted shortest path is a staple for network delay time, cheapest flights, path with minimum effort and routing, and the question tests heaps, graph representation and the negative edge restriction.",
    "Use it for single-source shortest paths with non-negative weights. Applies to grids too, where the cost of moving between cells is the edge weight.",
    "Do not use it with negative edges (use Bellman-Ford), for unweighted graphs (BFS is simpler and faster), or for all-pairs on small dense graphs (Floyd-Warshall). Use long for distances if sums can overflow int.",
    "Build adjacency lists of int[]{to, weight}, use a PriorityQueue of int[]{node, dist} ordered by dist, and ignore entries whose dist is greater than dist[node]. Since Java's PriorityQueue has no decrease-key, push duplicates and skip stale ones. Track parents to reconstruct the path.",
    "Pros: efficient, well-known, and gives all shortest distances at once. Cons: fails on negative weights, and the lazy-deletion heap holds up to E entries.",
    "Alternatives are BFS or 0-1 BFS for unit and zero-one weights, Bellman-Ford (O(VE), negative edges), Floyd-Warshall (O(V^3), all pairs), A* with a heuristic, and Fibonacci heap for the theoretical best bound.",
    `// Problem: network delay time - signals travel along directed weighted edges times[i] = {u, v, w};
// find the time for all n nodes to receive a signal sent from k, or -1.
// Time O((V + E) log V), space O(V + E)
static int networkDelayTime(int[][] times, int n, int k) {
    List<List<int[]>> adj = new ArrayList<>();
    for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
    for (int[] t : times) adj.get(t[0]).add(new int[] { t[1], t[2] });

    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
    pq.add(new int[] { k, 0 });
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int u = cur[0];
        if (cur[1] > dist[u]) continue;                 // stale entry
        for (int[] e : adj.get(u)) {
            int nd = dist[u] + e[1];
            if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.add(new int[] { e[0], nd }); }
        }
    }
    int max = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        max = Math.max(max, dist[i]);
    }
    return max;
}`
  ],
  "Union-Find (Disjoint Set)": [
    "Union-Find tracks a partition of elements into sets with find (which set) and union (merge sets) in nearly O(1) amortised time, using path compression and union by rank or size. It is ideal for connectivity, counting components and detecting cycles in undirected graphs.",
    "Each element has a parent pointer, and the root represents the set. Path compression flattens the tree during find, and union by size attaches the smaller tree under the larger, giving amortised O(alpha(n)), which is effectively constant.",
    "It is the clean solution for connected components under incremental edges, accounts merge, redundant connection, number of provinces and Kruskal's minimum spanning tree.",
    "Use it when edges arrive over time and you need repeated 'are these connected' queries, or when grouping items by equivalence relations, and for Kruskal's algorithm.",
    "Do not use it when you need the actual path between nodes, deletions of edges (it does not support splitting sets), or directed connectivity. A single DFS is enough for a one-time static component count.",
    "Initialise parent[i] = i and size[i] = 1. find(x) follows parents to the root and compresses the path. union(a, b) finds both roots, returns false if they are equal (a cycle), otherwise attaches the smaller root to the larger and decrements the component count.",
    "Pros: near-constant operations and tiny code. Cons: no support for deletion or path queries, and it only answers connectivity.",
    "Alternatives are DFS or BFS for static components, a link-cut tree for dynamic connectivity with deletions, and Kruskal versus Prim for spanning trees.",
    `// Problem: given edges of a graph that started as a tree plus one extra edge, return the edge that forms a cycle.
// Time O(n * alpha(n)), space O(n)
static class DSU {
    private final int[] parent, size;
    int components;
    DSU(int n) {
        parent = new int[n]; size = new int[n]; components = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];     // path halving
            x = parent[x];
        }
        return x;
    }
    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;            // already connected
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
        components--;
        return true;
    }
}
static int[] findRedundantConnection(int[][] edges) {
    DSU dsu = new DSU(edges.length + 1);
    for (int[] e : edges) if (!dsu.union(e[0], e[1])) return e;
    return new int[0];
}`
  ],
  "Trie": [
    "A trie stores strings character by character along tree paths, giving O(L) insert, search and prefix lookup where L is the word length, independent of how many words are stored. It is the go-to structure for autocomplete, prefix counting and word-search problems.",
    "Each node has children (an array of 26 or a map) and an end-of-word flag or count. Shared prefixes share nodes, so memory is proportional to the total number of distinct prefixes, and prefix queries just walk down from the root.",
    "Prefix problems such as implement trie, word search II, longest common prefix, autocomplete and the maximum XOR pair (binary trie) are common, and they test tree construction and DFS on top of it.",
    "Use it when you have many strings and repeated prefix queries, or when you must search for many words in a grid at once, since the trie prunes the search when no word has the current prefix.",
    "Do not use it for a few lookups where a HashSet is simpler, or for huge alphabets with array nodes, which waste memory. For exact-match only a HashMap is faster and smaller.",
    "Create a TrieNode with TrieNode[26] children and boolean end. insert walks and creates missing nodes, search walks and checks end, startsWith just checks the walk succeeds. Use a HashMap<Character, TrieNode> for large alphabets, and store a count for prefix frequency.",
    "Pros: O(L) operations, prefix queries and ordered iteration. Cons: high memory per node with array children, and poor cache locality.",
    "Alternatives are HashSet for exact matches, a sorted array with binary search for prefixes, a compressed radix tree, and a ternary search tree.",
    `// Problem: implement a trie with insert, search and startsWith.
// Time O(L) per operation, space O(total characters)
static class Trie {
    private static class Node {
        final Node[] next = new Node[26];
        boolean end;
    }
    private final Node root = new Node();

    void insert(String word) {
        Node cur = root;
        for (char ch : word.toCharArray()) {
            int i = ch - 'a';
            if (cur.next[i] == null) cur.next[i] = new Node();
            cur = cur.next[i];
        }
        cur.end = true;
    }
    boolean search(String word) {
        Node n = find(word);
        return n != null && n.end;
    }
    boolean startsWith(String prefix) { return find(prefix) != null; }

    private Node find(String s) {
        Node cur = root;
        for (char ch : s.toCharArray()) {
            cur = cur.next[ch - 'a'];
            if (cur == null) return null;
        }
        return cur;
    }
}`
  ],
  "Backtracking": [
    "Backtracking builds a solution incrementally, choosing one option at a time, recursing, and undoing the choice if it leads nowhere. It enumerates permutations, subsets, combinations, N-Queens and Sudoku, and pruning invalid branches early is what keeps it practical.",
    "The template is choose, explore, un-choose over a shared path. The search tree has a branching factor b and depth d, so the worst case is exponential, such as O(n!) for permutations and O(2^n) for subsets, and pruning reduces the visited part.",
    "It tests recursion, state management and complexity reasoning, and these problems show whether you can generate all valid configurations without duplicates.",
    "Use it for generating all arrangements, selections or partitions, constraint satisfaction (N-Queens, Sudoku, word search), and when no polynomial algorithm is expected and the input is small, typically n up to about 20.",
    "Do not use it when overlapping subproblems make DP possible, when a greedy choice is provably correct, or when n is large. Do not forget to copy the path when adding to results, or to skip duplicates with sorting and a same-level check.",
    "Write dfs(start, path): if the path is complete, add new ArrayList<>(path) to the results; for each candidate from start, skip invalid or duplicate ones, add it, recurse with the updated index, then remove the last element. Sort the input first to handle duplicates and to prune early.",
    "Pros: general and simple to write, and it finds all solutions. Cons: exponential time, and it needs careful duplicate handling and pruning.",
    "Alternatives are dynamic programming or memoisation for overlapping subproblems, bitmask enumeration for subsets, greedy for provably optimal choices, and constraint solvers.",
    `// Problem: generate all subsets of an array that may contain duplicates (no duplicate subsets).
// Time O(n * 2^n), space O(n) recursion plus output
static List<List<Integer>> subsetsWithDup(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> out = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), out);
    return out;
}
private static void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> out) {
    out.add(new ArrayList<>(path));                       // copy the current path
    for (int i = start; i < nums.length; i++) {
        if (i > start && nums[i] == nums[i - 1]) continue; // skip duplicates at the same level
        path.add(nums[i]);                                 // choose
        backtrack(nums, i + 1, path, out);                 // explore
        path.remove(path.size() - 1);                      // un-choose
    }
}`
  ],
  "Dynamic Programming Basics": [
    "Dynamic programming solves problems with overlapping subproblems and optimal substructure by storing sub-results. Define the state, write the recurrence, set base cases, and choose top-down memoisation or bottom-up tabulation, often with space optimisation from O(n) to O(1).",
    "DP replaces exponential recursion with polynomial work by computing each distinct state once: number of states times work per state gives the complexity. Classic 1D examples are Fibonacci, climbing stairs, house robber, coin change and longest increasing subsequence.",
    "DP is a frequent hard-round topic, and interviewers look for how you define the state and recurrence, not only the final code.",
    "Use it when a problem asks for a count, a minimum, a maximum or feasibility, and brute force recursion recomputes the same arguments. Ask what the minimum information is that describes a subproblem.",
    "Do not use it when there are no overlapping subproblems (use plain recursion or divide and conquer), when a greedy rule is provably correct, or when the state space is too large to store.",
    "Steps: define dp[i] in words, write the transition from smaller states, initialise base cases, fix the iteration order so dependencies are computed first, and return the right cell. Check that answers for dp[0] and tiny inputs make sense, and compress space when dp[i] only needs the last one or two values.",
    "Pros: turns exponential into polynomial time and is systematic. Cons: finding the right state is hard, and tables can use a lot of memory.",
    "Alternatives are memoised recursion (easier to derive, with stack depth risk), greedy, backtracking with pruning and BFS over states for shortest-step problems.",
    `// Problem: fewest coins to make 'amount' (coin change), or -1 if impossible.
// Time O(amount * coins), space O(amount)
static int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];            // dp[x] = fewest coins to make x
    Arrays.fill(dp, amount + 1);               // infinity marker
    dp[0] = 0;
    for (int x = 1; x <= amount; x++) {
        for (int c : coins) {
            if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}

// House robber with O(1) space: dp[i] = max(dp[i-1], dp[i-2] + nums[i])
static int rob(int[] nums) {
    int take = 0, skip = 0;
    for (int v : nums) {
        int newTake = skip + v;
        skip = Math.max(skip, take);
        take = newTake;
    }
    return Math.max(take, skip);
}`
  ],
  "Knapsack and LCS Patterns": [
    "Knapsack and LCS are the two core 2D DP families. 0/1 knapsack picks items under a capacity in O(n * W), and LCS and edit distance fill a table over two prefixes in O(m * n); many problems such as subset sum, partition and word break are knapsack or LCS in disguise.",
    "0/1 knapsack: dp[w] is the best value for capacity w, and iterating w downward ensures each item is used once. LCS: dp[i][j] is the LCS of the first i and j characters, equal to dp[i-1][j-1] + 1 on a match, otherwise the max of dp[i-1][j] and dp[i][j-1].",
    "Interviewers ask these to see whether you recognise a template and adapt it: partition equal subset sum, target sum, longest common subsequence, edit distance, longest palindromic subsequence and unbounded coin problems.",
    "Use knapsack when you choose items with weights toward a capacity or target, and LCS-style when comparing two sequences with match, insert, delete or substitute decisions.",
    "Do not iterate capacity upward in 0/1 knapsack, which allows reusing an item (that is the unbounded version). Do not confuse subsequence (not contiguous) with substring, and remember pseudo-polynomial time is not polynomial in the size of W.",
    "Define the table, set the first row and column (empty prefix or zero capacity), fill in dependency order, and compress to one or two rows when each row depends only on the previous. For subset sum use a boolean dp and loop the target downward; to reconstruct the answer trace back through the table.",
    "Pros: general templates that cover many problems. Cons: O(m * n) memory unless compressed, and the pseudo-polynomial bound can be too large for big capacities.",
    "Alternatives are meet in the middle for small n with huge weights, greedy for the fractional knapsack, memoised recursion, and Hirschberg's algorithm for LCS in linear space.",
    `// Problem: can the array be split into two subsets with equal sum? (0/1 knapsack as subset sum)
// Time O(n * sum/2), space O(sum/2)
static boolean canPartition(int[] nums) {
    int total = Arrays.stream(nums).sum();
    if (total % 2 != 0) return false;
    int target = total / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;
    for (int v : nums) {
        for (int w = target; w >= v; w--) {        // downward so each item is used once
            dp[w] = dp[w] || dp[w - v];
        }
    }
    return dp[target];
}

// Problem: length of the longest common subsequence of a and b.
// Time O(m * n), space O(m * n)
static int lcs(String a, String b) {
    int[][] dp = new int[a.length() + 1][b.length() + 1];
    for (int i = 1; i <= a.length(); i++) {
        for (int j = 1; j <= b.length(); j++) {
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[a.length()][b.length()];
}`
  ],
  "Greedy Algorithms": [
    "A greedy algorithm makes the locally best choice at each step and never reconsiders, which is correct only when the problem has the greedy-choice property and optimal substructure. Typical wins are interval scheduling, jump game, gas station, Huffman coding and minimum spanning trees.",
    "Greedy correctness is usually proved by an exchange argument: any optimal solution can be transformed to include the greedy choice without getting worse. Most greedy solutions sort by a key first, so they are O(n log n), or use a heap.",
    "Greedy is asked to see if you can recognise when a simple rule is enough and defend it, as opposed to over-engineering with DP, and to see if you can find counterexamples.",
    "Use it for scheduling (earliest end time first), activity selection, minimum arrows to burst balloons, assigning cookies, fractional knapsack, and shortest paths with non-negative weights (Dijkstra) or spanning trees (Prim, Kruskal).",
    "Do not use it when a locally best choice can block a better global result: 0/1 knapsack, coin change with arbitrary denominations (greedy fails for coins 1, 3, 4 and amount 6), and longest path. If you cannot argue why it works, test small counterexamples or use DP.",
    "Identify the quantity to optimise, guess a rule (sort by end, by ratio, by deadline, take the largest remaining), try to break it with small cases, then implement it with a sort or a PriorityQueue. For jump game, track the furthest reachable index and fail if the current index exceeds it.",
    "Pros: simple, fast, low memory. Cons: easy to apply wrongly, and correctness needs a proof or counterexample search.",
    "Alternatives are dynamic programming when greedy fails, backtracking for small inputs, and exhaustive search to verify a greedy rule on random tests.",
    `// Problem: minimum number of intervals to remove so the rest do not overlap (activity selection).
// Greedy: sort by end time and keep the interval that ends earliest.
// Time O(n log n), space O(1) extra
static int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
    int kept = 0;
    int lastEnd = Integer.MIN_VALUE;
    for (int[] in : intervals) {
        if (in[0] >= lastEnd) {          // does not overlap with the last kept interval
            kept++;
            lastEnd = in[1];
        }
    }
    return intervals.length - kept;
}

// Jump game: can we reach the last index? Time O(n), space O(1)
static boolean canJump(int[] nums) {
    int furthest = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > furthest) return false;
        furthest = Math.max(furthest, i + nums[i]);
    }
    return true;
}`
  ],
  "How to Solve Coding Questions": [
    "Follow a fixed routine: clarify the problem and constraints, work an example, state a brute-force solution with its complexity, improve it by identifying the pattern, code it cleanly, then test with edge cases and state the final complexity. Narrate your thinking throughout.",
    "The routine is: restate the problem, ask about input size, duplicates, negatives and empty input; walk through a small example; give brute force first; optimise using a pattern (hash map, two pointers, sliding window, heap, DP); then implement, dry run and analyse.",
    "Interviewers evaluate communication, structured problem solving and code quality as much as the final answer, and a clear process recovers from a missed insight.",
    "Use it on every problem. Constraints hint at the target complexity: n up to 10^5 suggests O(n log n) or O(n), n up to 20 suggests exponential, n up to 1000 allows O(n^2). Map keywords to patterns: sorted array to two pointers or binary search, contiguous subarray to sliding window or prefix sum, k-th or top k to heap, dependencies to topological sort, optimal count over choices to DP.",
    "Do not start coding silently, jump to the first idea without checking edge cases, or hide when stuck. Avoid premature optimisation before a correct solution exists, and avoid unreadable variable names.",
    "Talk first, code second. Write helper methods for clarity, use meaningful names, handle null and empty input up front, and after coding trace the example by hand. Test with: empty, single element, duplicates, all equal, negatives, maximum size and overflow values.",
    "Pros: a repeatable approach reduces panic and shows maturity. Cons: spending too long on talk or brute force leaves little time to code, so timebox each phase.",
    "Alternatives are pattern-first recognition for experienced candidates, and test-driven approach where you write examples as tests before the solution.",
    `// Checklist to say out loud
// 1. Clarify: input size? duplicates? negatives? sorted? can input be empty or null?
// 2. Example: walk through a small case and one edge case by hand.
// 3. Brute force: describe it and its complexity (for example O(n^2)).
// 4. Optimise: which pattern fits? hash map, two pointers, sliding window, heap, BFS, DP?
// 5. Complexity target from constraints: n=10^5 -> O(n log n); n=20 -> O(2^n); n=500 -> O(n^3).
// 6. Code: small helpers, clear names, early returns for edge cases.
// 7. Dry run: trace the example and one edge case through the code.
// 8. Analyse: state final time and space, and mention trade-offs and follow-ups.

// Typical structure
static int solve(int[] nums) {
    if (nums == null || nums.length == 0) return 0;     // edge cases first
    // ... core pattern ...
    return 0;
}`
  ],
  "Java Tips for Coding Rounds": [
    "Know the collections cold: ArrayDeque for stacks and queues, PriorityQueue for heaps, HashMap.merge and computeIfAbsent for counting and grouping, and Arrays and Collections utilities. Avoid common traps: int overflow, comparator subtraction, Integer comparison with ==, and modifying a list while iterating.",
    "Key facts: Stack and Vector are legacy, so prefer Deque<Integer> stack = new ArrayDeque<>(). PriorityQueue is a min-heap and its iteration order is not sorted. Integer caches values from -128 to 127, so == on boxed values is unreliable. Arrays.asList returns a fixed-size list, List.of is immutable and rejects nulls.",
    "Small Java details cost time or cause wrong answers in interviews, and knowing them shows fluency in the language you code in.",
    "Use them throughout: Arrays.fill, Arrays.sort with Comparator on object arrays (not primitives), Arrays.stream, String.valueOf(char[]), StringBuilder.reverse and insert, Character.isDigit and getNumericValue, Math.floorMod for non-negative modulo, and Long for sums and products.",
    "Avoid recursion deeper than about 10,000 frames, string concatenation in loops, Math.abs(Integer.MIN_VALUE), mid = (lo + hi) / 2 overflow, (a, b) -> a - b comparators, removing from an ArrayList by value when the element type is Integer (remove(int index) versus remove(Object)), and using arrays as map keys.",
    "For input, use BufferedReader with StringTokenizer, and for output build a StringBuilder and print once. Convert lists with list.toArray(new int[0][]) for 2D or stream().mapToInt(Integer::intValue).toArray() for int arrays. Use new ArrayList<>(path) to copy before storing results, and Integer.compare for comparators.",
    "Pros: fewer silly bugs and faster typing. Cons: memorising details does not replace understanding, so focus on the ones you actually use.",
    "Alternatives are writing small helper methods for tricky conversions, and using the IDE or language features in take-home settings rather than interview whiteboards.",
    `// Fast input and output
BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
StringTokenizer st = new StringTokenizer(br.readLine());
int n = Integer.parseInt(st.nextToken());
StringBuilder sb = new StringBuilder();
sb.append(n).append(System.lineSeparator());
System.out.print(sb);

// Overflow-safe midpoint and long accumulation
int mid = lo + (hi - lo) / 2;
long sum = 0;
for (int v : nums) sum += v;

// Comparator pitfalls
Arrays.sort(boxed, (a, b) -> Integer.compare(a, b));      // never a - b
Arrays.sort(pairs, Comparator.comparingInt((int[] p) -> p[0]).thenComparingInt(p -> p[1]));

// Boxed equality and list removal
Integer x = 1000, y = 1000;
boolean same = x.equals(y);                               // == would be false
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
list.remove(Integer.valueOf(2));                          // remove by value, not index

// Conversions
int[] arr = list.stream().mapToInt(Integer::intValue).toArray();
int[][] grid = listOfPairs.toArray(new int[0][]);
Arrays.fill(dp, Integer.MAX_VALUE);
int mod = Math.floorMod(-7, 5);                           // 3, not -2

// Stack and queue
Deque<Integer> stack = new ArrayDeque<>();                // push, pop, peek
Queue<int[]> queue = new ArrayDeque<>();                  // add, poll`
  ]
};
