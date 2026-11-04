// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, example]
const SERVICE_ANSWERS = {
  "Variables: var, let and const": [
    "I use const by default, let when a value must change, and avoid var. let and const are block scoped and cannot be read before their declaration, while var is function scoped and hoisted with the value undefined.",
    "const prevents reassignment of the binding but does not make objects immutable. let allows reassignment within its block. var ignores blocks and can be redeclared.",
    "Block scope prevents accidental reuse of variables and makes code easier to reason about.",
    "Always, as the default. Use let when the value changes.",
    "Do not use var in new code, and do not assume const freezes an object.",
    "Declare with const, switch to let only when reassignment is needed, and use Object.freeze when immutability is required.",
    "Pros: clear intent and fewer bugs. Cons: the difference from var confuses people coming from older code.",
    "Object.freeze or libraries for deep immutability.",
    `const max = 10;          // binding cannot change
let count = 0;           // can change
count += 1;
// var leaks out of blocks: avoid it`
  ],
  "Scope and Closures": [
    "A closure is a function that remembers the variables from the scope where it was created, even after that scope has finished. I use closures for private state, factory functions and callbacks that need data from outside.",
    "Each function creates a scope. An inner function keeps a reference to its outer variables, so they survive after the outer function returns.",
    "Closures explain how callbacks, event handlers and private counters work in JavaScript.",
    "Private state, configuration in callbacks, and memoisation.",
    "Do not create closures in a tight loop over large data without need, because each one holds memory.",
    "Return an inner function from an outer one, keep the state in the outer variable, and use the returned function to read or change it.",
    "Pros: encapsulation without classes. Cons: captured variables stay in memory while the closure lives.",
    "Classes with private fields (#field) for structured state.",
    `function makeCounter() {
  let count = 0;                       // private to the closure
  return () => ++count;
}
const next = makeCounter();
next(); next();                        // 2`
  ],
  "Hoisting": [
    "Hoisting moves declarations to the top of their scope before code runs. Function declarations are fully hoisted, var is hoisted as undefined, and let and const are hoisted but stay in the temporal dead zone until their line runs.",
    "Declarations are processed in the creation phase of execution. Accessing a let or const before its declaration throws a ReferenceError, while var returns undefined.",
    "It explains surprising undefined values and errors in interviews.",
    "When reading code that uses functions before their definition.",
    "Do not rely on hoisting for readability, because it makes code harder to follow.",
    "Declare variables before use, and define helper functions near where they are used or at the top of the module.",
    "Pros: function declarations can be called before they appear. Cons: hoisting is easy to misread.",
    "Use const and let only, which removes the undefined case.",
    `console.log(a);     // undefined (var hoisted)
var a = 1;

console.log(b);     // ReferenceError (temporal dead zone)
let b = 2;

greet();            // works: function declarations are hoisted
function greet() { console.log('hi'); }`
  ],
  "this and Binding": [
    "The value of this depends on how a function is called, not where it is written. Arrow functions take this from the surrounding scope, while normal functions get it from the call, bind, call or apply.",
    "Method calls set this to the object. Standalone calls use undefined in strict mode. call and apply set it explicitly, bind returns a function with fixed this, and arrow functions have no own this.",
    "Losing this in callbacks is one of the most common JavaScript bugs, and it is a standard interview topic.",
    "Event handlers, callbacks and methods passed as values.",
    "Do not use arrow functions as object methods when they need the object's this, because the this is the outer scope.",
    "Use an arrow function for callbacks inside a class method, or bind the method once in the constructor, and check the call site when this is undefined.",
    "Pros: arrow functions keep context simply. Cons: they cannot be used as constructors or methods that need their own this.",
    "Class fields with arrow functions, which bind this automatically.",
    `const user = {
  name: 'Ana',
  greet() { return this.name; },          // this = user
  later() { setTimeout(() => console.log(this.name)); }  // arrow keeps user
};
const g = user.greet;
g();                                      // this is undefined in strict mode`
  ],
  "Equality and Truthiness": [
    "I always use === and !== because they compare values without type conversion. == converts types first, which gives surprising results such as 0 == '' being true.",
    "Strict equality checks type and value. Loose equality applies coercion rules. Truthy and falsy values determine how conditions behave, and the falsy values are false, 0, -0, 0n, empty string, null, undefined and NaN.",
    "Coercion bugs are common, and the rules are easy to test in interviews.",
    "Almost all comparisons in application code.",
    "Do not rely on loose equality except for an explicit null or undefined check, such as value == null.",
    "Use === by default, use ?? for defaults instead of ||, and check for empty arrays with length rather than truthiness of the array.",
    "Pros: predictable comparisons. Cons: a few cases such as value == null are clearer with loose equality.",
    "Explicit helper functions for type checks, or TypeScript to catch mismatches early.",
    `0 == '';        // true  (coercion)
0 === '';       // false (strict)
null == undefined;   // true
[] ? 'yes' : 'no';   // 'yes' (empty array is truthy)`
  ],
  "Prototypes and Classes": [
    "JavaScript objects inherit from other objects through the prototype chain. Classes are syntax over prototypes, so the behaviour is the same. I know the prototype model because it explains how method lookup works.",
    "Each object has an internal link to a prototype. Property lookup walks the chain until it finds the property or reaches null. class declares methods on the prototype and extends sets up inheritance.",
    "Knowing prototypes explains instanceof, method sharing and why class methods are not copied per instance.",
    "Explaining object creation, inheritance and how classes work under the hood.",
    "Do not modify built-in prototypes such as Array.prototype in application code, because it breaks other libraries.",
    "Use class with methods for shared behaviour, call super in constructors of subclasses, and prefer composition over deep inheritance.",
    "Pros: familiar syntax and shared methods. Cons: deep inheritance chains are hard to follow.",
    "Factory functions and composition for flexible objects without inheritance.",
    `class Animal {
  speak() { return this.name + ' makes a sound'; }
}
class Dog extends Animal {
  constructor(name) { super(); this.name = name; }
}
Object.getPrototypeOf(Dog.prototype) === Animal.prototype;   // true`
  ],
  "Arrow Functions": [
    "Arrow functions are a shorter syntax for functions that do not have their own this, arguments or prototype. I use them for callbacks and short transformations, and normal functions for methods and constructors.",
    "An arrow function takes this, arguments and super from the enclosing scope. It has no prototype, so it cannot be used with new. A single expression is returned without a return keyword.",
    "They keep this predictable inside callbacks.",
    "Callbacks, array methods and functions that should share the outer this.",
    "Do not use them as object methods or constructors, and do not use them for functions that need dynamic this, such as event handlers that use this as the element.",
    "Write (x) => x * 2 for short functions, use block bodies with explicit return for longer ones, and use normal functions when this must come from the call.",
    "Pros: concise and lexical this. Cons: the implicit return of object literals needs parentheses.",
    "Normal function expressions where dynamic this is needed.",
    `const doubled = [1, 2, 3].map(n => n * 2);
const makeUser = (name) => ({ name });   // parentheses return an object
button.addEventListener('click', function () {
  this.classList.toggle('on');           // this is the element here
});`
  ],
  "Promises": [
    "A Promise represents a value that will be available later. It is pending, then fulfilled or rejected, and then() and catch() or the second argument of then handle the result. I chain promises and avoid nesting them.",
    "Promise.resolve and Promise.reject create settled promises. then returns a new promise, so chains flatten. Promise.all waits for all, Promise.allSettled waits for all and reports each outcome, Promise.race takes the first.",
    "Promises replace callback nesting and make async errors easier to handle.",
    "Any asynchronous operation such as HTTP calls, timers and file reads.",
    "Do not nest then calls inside then, and do not forget to return the inner promise.",
    "Return promises from each then, add one catch at the end of the chain, and use finally for cleanup.",
    "Pros: chainable and composable. Cons: errors can be lost if the chain has no catch.",
    "async and await for readable sequential code.",
    `fetch('/api/orders')
  .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(orders => console.log(orders.length))
  .catch(err => console.error(err))
  .finally(() => console.log('done'));`
  ],
  "async and await": [
    "async and await let me write asynchronous code that reads top to bottom while still returning promises underneath. I use try and catch around await for errors, and Promise.all when calls are independent.",
    "An async function always returns a promise. await pauses that function until the promise settles, without blocking the rest of the program.",
    "The code is easier to read and debug than chained promises.",
    "Sequential async steps and error handling for network calls.",
    "Do not await independent calls one by one, because that makes them slower than running them together.",
    "Mark the function async, await each promise, wrap in try and catch for errors, and use Promise.all for parallel work.",
    "Pros: readable and familiar. Cons: awaiting in a loop runs requests sequentially, and unhandled rejections still need catch.",
    "Promise chains for simple one-step operations.",
    `async function loadDashboard() {
  try {
    const [user, orders] = await Promise.all([
      fetch('/api/user').then(r => r.json()),
      fetch('/api/orders').then(r => r.json())
    ]);
    return { user, orders };
  } catch (err) {
    console.error(err);
    return null;
  }
}`
  ],
  "Event Loop and Microtasks": [
    "JavaScript runs one task at a time on the main thread. The event loop picks the next task, then runs all microtasks such as promise callbacks before the next task, which is why a resolved promise runs before setTimeout with zero delay.",
    "The call stack runs synchronous code. Web APIs handle timers and network. Callbacks wait in the task queue, and promise callbacks wait in the microtask queue, which drains completely after each task.",
    "Ordering questions about setTimeout and promises are common, and the model explains UI freezes from long tasks.",
    "Explaining async order, debugging unexpected output order and avoiding blocking the UI.",
    "Do not run heavy loops on the main thread, because they block rendering and input.",
    "Predict output by running the stack first, then microtasks, then the next task. Move heavy work to a Web Worker or split it into chunks.",
    "Pros: a simple single-thread model. Cons: long synchronous work freezes the page.",
    "Web Workers for CPU-heavy tasks.",
    `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2`
  ],
  "Error Handling in Async Code": [
    "I handle async errors with try and catch around await, or with catch on promises, and I never let a rejection go unhandled. For HTTP calls I check response.ok, because fetch only rejects on network failures.",
    "fetch resolves for HTTP error codes such as 404, so the status must be checked. Unhandled promise rejections are reported as errors and can crash some runtimes.",
    "Silent failures confuse users, and unhandled rejections hide bugs.",
    "Any network call, file read or async operation that can fail.",
    "Do not catch an error and do nothing, because it hides the problem.",
    "Check response.ok and throw a clear error, catch in one place, log it, and return a safe value or show a message to the user.",
    "Pros: clear failure paths. Cons: error handling adds code to every call unless centralised.",
    "A shared wrapper function for all API calls.",
    `async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed: ' + res.status);
  return res.json();
}

getJson('/api/items').catch(err => showMessage(err.message));`
  ],
  "Array Methods: map, filter, reduce": [
    "map transforms each item, filter keeps items that match, and reduce combines them into one value. I chain them for readable data pipelines and avoid mutating the original array.",
    "map returns a new array of the same length. filter returns a new array with fewer items. reduce accumulates a value using a callback and an initial value.",
    "These methods express data transformations clearly and are the core of most interview coding tasks.",
    "Transforming and selecting data from lists.",
    "Do not use reduce for everything when a simple loop is clearer, and do not forget the initial value in reduce.",
    "Chain filter then map, pass an initial value to reduce such as an empty object, and keep callbacks small.",
    "Pros: declarative and chainable. Cons: chains with many steps can be slower than one loop on huge data.",
    "for...of loops for simple iteration or early exit.",
    `const orders = [{ total: 40, paid: true }, { total: 15, paid: false }, { total: 60, paid: true }];

const paidTotal = orders
  .filter(o => o.paid)
  .map(o => o.total)
  .reduce((sum, t) => sum + t, 0);   // 100`
  ],
  "Destructuring and Spread": [
    "Destructuring pulls values out of arrays and objects into variables, and spread copies or merges them. I use them for function parameters, updating state immutably and combining options.",
    "const { a, b = 1 } = obj reads properties with defaults. [first, ...rest] = arr splits an array. { ...obj, key: value } creates a new object with changes.",
    "They make code shorter and encourage immutable updates.",
    "Reading props from objects, handling function options and updating state.",
    "Do not spread very large arrays into function arguments, because it can exceed call stack limits.",
    "Destructure in parameters with defaults, and copy with spread before changing values.",
    "Pros: concise and clear. Cons: deep nesting is hard to read, and spread copies only one level deep.",
    "Object.assign for merging, although spread is usually clearer.",
    `function createUser({ name, role = 'viewer', ...rest }) {
  return { name, role, ...rest };
}
const admin = { ...createUser({ name: 'Ana' }), role: 'admin' };`
  ],
  "DOM Manipulation": [
    "I select elements with querySelector, change their content and attributes, and create new nodes only when needed. I minimise DOM changes because each one can trigger layout work, and I batch updates where possible.",
    "The DOM is a tree of nodes. querySelector and getElementById find nodes, textContent and classList change them, and createElement with append inserts new ones.",
    "Direct DOM access is still needed in plain JavaScript and in libraries that wrap it.",
    "Simple interactions or code outside a framework.",
    "Do not use innerHTML with user input, because it can run injected scripts.",
    "Query once and store the element, use textContent for text, classList for classes, and build fragments or append in batches.",
    "Pros: direct control and no library. Cons: manual updates are error prone at scale, which is why frameworks exist.",
    "A framework that updates the DOM from state, such as Angular.",
    `const list = document.querySelector('#items');
const fragment = document.createDocumentFragment();
['Apple', 'Pear'].forEach(name => {
  const li = document.createElement('li');
  li.textContent = name;                 // safe, unlike innerHTML
  fragment.append(li);
});
list.append(fragment);                   // one DOM update`
  ],
  "Event Delegation": [
    "Event delegation attaches one listener to a parent and uses event.target to find which child was clicked. It works for elements added later and uses less memory than one listener per item.",
    "Events bubble from the target up to the document. A listener on the parent receives events from all children, and closest() finds the matching element.",
    "It avoids binding many listeners and handles dynamic lists correctly.",
    "Lists, tables and any container with many clickable children that change over time.",
    "Do not delegate events that do not bubble, such as focus in older code, unless you use focusin.",
    "Add the listener to the container, check event.target.closest with the selector, and act only when it matches.",
    "Pros: efficient and works with dynamic content. Cons: the handler must filter events correctly.",
    "A framework event binding, which does the same work for you.",
    `document.querySelector('#todo-list').addEventListener('click', event => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});`
  ],
  "Fetch API": [
    "fetch sends HTTP requests and returns a promise for the response. I check response.ok, parse with json(), set headers and body explicitly, and handle errors and cancellation with AbortController.",
    "fetch resolves for any HTTP response and rejects only on network failure. The body is read with json(), text() or blob(). Options include method, headers, body and signal.",
    "fetch is built into browsers and is the basis for most modern HTTP code.",
    "Simple API calls in plain JavaScript or where a library is not wanted.",
    "Do not assume a 404 or 500 rejects the promise, and do not forget to send Content-Type for JSON bodies.",
    "Call fetch with the method and body, check response.ok, parse the JSON, and pass an AbortSignal when the user may leave the page.",
    "Pros: built in and promise based. Cons: more code than a library for interceptors, retries and timeouts.",
    "XMLHttpRequest for old code, or Axios and Angular HttpClient for richer features.",
    `const controller = new AbortController();

async function saveItem(item) {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
    signal: controller.signal
  });
  if (!res.ok) throw new Error('Save failed: ' + res.status);
  return res.json();
}`
  ],
  "Storage: localStorage, sessionStorage and Cookies": [
    "localStorage keeps string data after the browser closes, sessionStorage keeps it for one tab, and cookies are sent with every request. I avoid storing secrets in localStorage because any script on the page can read it.",
    "localStorage and sessionStorage store key-value strings with setItem and getItem. Cookies can be HttpOnly, which hides them from JavaScript, and can have expiry, Secure and SameSite flags.",
    "Choosing the right store affects persistence, security and performance.",
    "Preferences and small cached data with localStorage, and session-only data with sessionStorage.",
    "Do not store tokens or personal data in localStorage, and do not store large objects without a size check.",
    "Serialise objects with JSON.stringify, parse with JSON.parse inside try and catch, and use HttpOnly cookies for authentication tokens.",
    "Pros: simple and built in. Cons: synchronous API, size limits, and no protection against scripts.",
    "IndexedDB for large structured data, or server-side sessions with cookies.",
    `localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme') ?? 'light';

// Auth tokens belong in an HttpOnly cookie set by the server, not in localStorage.`
  ],
  "Modules: import and export": [
    "ES modules split code into files with import and export. Each module has its own scope, and I use named exports for most code and a default export only for a single main value.",
    "export makes a binding available to other modules. import reads it. Modules load once and are cached, and in the browser they run in strict mode.",
    "Modules prevent global name clashes and let bundlers remove unused code.",
    "Any project with more than a single script.",
    "Do not create circular imports, because they can leave values undefined at load time.",
    "Export named functions from each file, import what you need, and keep shared utilities in one module.",
    "Pros: clear dependencies and tree shaking. Cons: circular dependencies and older tools need configuration.",
    "CommonJS require in Node.js code, or dynamic import for lazy loading.",
    `// math.js
export function add(a, b) { return a + b; }
export default function multiply(a, b) { return a * b; }

// app.js
import multiply, { add } from './math.js';`
  ],
  "Optional Chaining and Nullish Coalescing": [
    "Optional chaining (?.) stops and returns undefined when a value is null or undefined, and nullish coalescing (??) gives a default only for null or undefined. Together they make safe access to nested data short.",
    "obj?.prop reads a property only if obj is not null or undefined. value ?? fallback uses the fallback for null or undefined, unlike || which also replaces 0, empty strings and false.",
    "They prevent TypeError crashes and wrong defaults from falsy values.",
    "Reading optional API fields and defaults for numbers or booleans.",
    "Do not use || for defaults when 0 or an empty string is valid, because it replaces them.",
    "Write user?.address?.city, use ?? for defaults, and combine with destructuring defaults where it reads better.",
    "Pros: concise and safe. Cons: overuse can hide data that should be required.",
    "Explicit checks when the missing value is a real error to report.",
    `const city = user?.address?.city ?? 'Unknown';

const count = 0;
const shown = count || 10;     // 10  (wrong: 0 is valid)
const shownSafe = count ?? 10; // 0   (correct)`
  ],
  "Implement Debounce": [
    "Debounce delays a call until the calls stop for a set time, and clears the previous timer each time. I use it for search inputs and resize handlers where only the final value matters.",
    "Asked to write debounce from scratch. The function keeps a timer in a closure, clears it on every call, and runs the original function after the delay.",
    "It tests closures, timers and passing arguments through.",
    "Search boxes, window resize and save-on-typing.",
    "Do not use debounce when every call must run, such as logging each click.",
    "Store the timer id, clear it at each call, schedule the function with setTimeout, and forward the arguments with rest and spread.",
    "Pros: simple and no library. Cons: the function runs only after the pause, so it feels late for some uses.",
    "RxJS debounceTime or lodash debounce in larger projects.",
    `function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
const onSearch = debounce(term => console.log(term), 300);`
  ],
  "Implement Throttle": [
    "Throttle runs a function at most once in a given time window. I use it for scroll and mouse move handlers where regular updates are enough.",
    "Asked to write throttle. The function records the last run time and ignores calls until the wait has passed, optionally with a trailing call.",
    "It tests timing, closures and the difference from debounce.",
    "Scroll position tracking, drag handlers and resize updates.",
    "Do not use throttle when the last value must always be processed, because some calls are dropped.",
    "Store the last time in a closure, compare with Date.now() on each call, and run the function only when the wait has passed.",
    "Pros: steady updates with bounded cost. Cons: dropped calls can miss the final position unless a trailing call is added.",
    "requestAnimationFrame for visual updates, which runs once per frame.",
    `function throttle(fn, wait) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}`
  ],
  "Flatten a Nested Array": [
    "Flattening turns a nested array into one level. I use the built-in flat with a depth for most cases, and a recursive function when the depth is unknown or I need to explain the algorithm.",
    "Asked to flatten an array of any depth. The recursive solution checks each item and spreads arrays back into the result. The built-in method is arr.flat(Infinity).",
    "It tests recursion, array methods and whether you know the built-in option.",
    "Data from APIs with nested lists and tree-like structures.",
    "Do not flatten very deep structures recursively without a limit, because the call stack can overflow.",
    "Use reduce with concat for a clear version, or use flat with Infinity for the built-in answer.",
    "Pros: the recursive version is clear. Cons: deep recursion can overflow the call stack.",
    "A stack based loop for unlimited depth without recursion.",
    `function flatten(arr) {
  return arr.reduce((result, item) =>
    Array.isArray(item) ? result.concat(flatten(item)) : result.concat(item), []);
}
flatten([1, [2, [3, 4]], 5]);     // [1, 2, 3, 4, 5]
[1, [2, [3]]].flat(Infinity);     // [1, 2, 3]`
  ],
  "Deep Clone an Object": [
    "A deep clone copies nested objects and arrays so that changing the copy does not change the original. Modern code uses structuredClone, and older code uses a recursive function.",
    "Asked to copy an object with nested values. Shallow copies with spread only copy the top level, so nested objects are still shared.",
    "Shared nested objects cause bugs when one part of the app mutates state used by another.",
    "Copying state or configuration before changing it.",
    "Do not use JSON.parse(JSON.stringify(obj)) when the data has dates, functions, Maps or undefined, because those values are lost or changed.",
    "Use structuredClone for plain data and classes that it supports. For custom needs, write a recursive function that handles arrays and objects.",
    "Pros: independent copies. Cons: deep copies cost time and memory on large data.",
    "Immutable update patterns with spread, so no full copy is needed.",
    `const copy = structuredClone(original);

function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepClone);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepClone(v)]));
}`
  ],
  "Implement Memoize": [
    "Memoize caches the result of a function for the same arguments, so repeated calls return the stored value. I use it for expensive pure calculations.",
    "Asked to write a memoize function. It builds a key from the arguments, returns the cached result when the key exists, and computes and stores it otherwise.",
    "It tests closures, Map and understanding of pure functions.",
    "Expensive calculations that repeat with the same inputs.",
    "Do not memoize functions with side effects or changing results, because the cache returns stale answers.",
    "Create a Map in a closure, use JSON.stringify of the arguments as the key for simple values, call the original when the key is missing, and store the result.",
    "Pros: fast repeated calls. Cons: memory grows with each new key, and JSON keys are slow for large arguments.",
    "A bounded cache such as LRU, or the useMemo and computed patterns in frameworks.",
    `function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
}
const slowSquare = memoize(n => n * n);`
  ],
  "Implement Promise.all": [
    "Promise.all runs several promises together and resolves with an array of results in the same order, or rejects as soon as one rejects. I write my own version to show how promises combine.",
    "Asked to implement Promise.all. The function wraps each input with Promise.resolve, collects results by index, counts completions, and rejects on the first error.",
    "It tests promise behaviour, indexing and handling an empty input.",
    "Running independent async calls in parallel.",
    "Do not return results in completion order, because the order must match the input.",
    "Return a new Promise, handle the empty array, store each result at its index, resolve when the count reaches the length, and reject on the first failure.",
    "Pros: parallel and ordered. Cons: one failure rejects the whole result, which Promise.allSettled avoids.",
    "Promise.allSettled when every outcome is needed.",
    `function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = new Array(promises.length);
    let done = 0;
    if (promises.length === 0) return resolve(results);
    promises.forEach((p, i) => {
      Promise.resolve(p).then(value => {
        results[i] = value;
        if (++done === promises.length) resolve(results);
      }, reject);
    });
  });
}`
  ],
  "Implement Curry": [
    "Currying turns a function that takes many arguments into a chain of functions that take one or a few at a time. I write curry to collect arguments until the function has enough of them.",
    "Asked to implement a curry function. It compares the number of collected arguments with fn.length and either calls fn or returns a new function that keeps the arguments.",
    "It tests closures, rest parameters and the arity of functions.",
    "Creating specialised functions from general ones, such as an add10 from add.",
    "Do not use curry with functions that take optional or variable arguments, because fn.length does not count them correctly.",
    "Return a function that gathers arguments, call fn when the total reaches fn.length, and otherwise return a new function with the gathered arguments.",
    "Pros: reusable partial functions. Cons: the arity rule needs care with defaults and rest parameters.",
    "Partial application with bind or a closure for a fixed argument.",
    `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}
const add = curry((a, b, c) => a + b + c);
add(1)(2)(3);   // 6`
  ],
  "Retry with Exponential Backoff": [
    "Retry with exponential backoff waits longer after each failed attempt, such as 1 second, then 2, then 4, and stops after a maximum number of tries. It protects a struggling service and recovers from temporary errors.",
    "Asked to retry an async call. The function tries the call, catches the failure, waits for the delay, doubles the delay and tries again until the limit is reached.",
    "Network calls fail for short periods, and retries without delay can make outages worse.",
    "Calls to external APIs and any operation that can fail temporarily.",
    "Do not retry non-idempotent writes without a safe key, and do not retry client errors such as 400 or 404.",
    "Loop for the number of attempts, await the call in try and catch, wait with a promise based sleep that doubles each time, and rethrow after the last attempt.",
    "Pros: gentle on the server and simple. Cons: slow for users when the outage is long, so add jitter and a timeout.",
    "Circuit breakers that stop calls after repeated failures.",
    `const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function retry(fn, attempts = 3, delay = 500) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await sleep(delay * 2 ** i);
    }
  }
}`
  ]
};
