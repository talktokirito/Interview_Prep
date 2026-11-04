// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, example]
const SERVICE_ANSWERS = {
  "Components and Templates": [
    "A component is a class with a selector, a template and styles. Components are the building blocks of the UI, and I keep each one focused on a single view responsibility, passing data in with inputs and reporting events with outputs.",
    "A component pairs a TypeScript class with an HTML template. The decorator (or the standalone flag in Angular 17+) declares its selector, imports and metadata. Smart or container components fetch data, presentational components only render inputs.",
    "Splitting the UI into small components makes it reusable, testable and easier to change.",
    "Any reusable piece of UI, such as a card, a table row or a form section.",
    "Do not put business logic, HTTP calls or heavy state inside presentational components.",
    "Create a component with the CLI, declare @Input() and @Output() or the signal-based input() and output() functions, keep the template declarative, and move logic into services.",
    "Pros: clear boundaries and reuse. Cons: too many tiny components add indirection and wiring.",
    "Directives for behaviour without a template, or content projection with ng-content for flexible layouts.",
    `@Component({
  selector: 'app-product-card',
  standalone: true,
  template: \`<h3>{{ product().name }}</h3>\`
})
export class ProductCardComponent {
  product = input.required<Product>();
}`
  ],
  "Data Binding and Directives": [
    "Angular binds data in four ways: interpolation for text, property binding for DOM properties, event binding for user actions, and two-way binding for forms. I use control flow syntax (@if, @for) in modern templates and use directives for reusable DOM behaviour.",
    "[property] sets a value, (event) listens to an event, [(ngModel)] or [(value)] does both ways, and {{ }} interpolates text. Structural directives change the DOM (@if, @for, or *ngIf and *ngFor in older code) and attribute directives change appearance or behaviour.",
    "Bindings keep the view in sync with the component state without manual DOM updates.",
    "Use @for with track for lists, @if for conditional sections, and attribute directives for shared behaviour such as highlighting.",
    "Avoid calling heavy functions in templates, because they run on every change detection cycle.",
    "Use track by id in @for to keep DOM nodes stable, prefer computed values over template method calls, and write custom directives for repeated DOM logic.",
    "Pros: declarative and readable. Cons: template expressions run often, and two-way binding can hide data flow.",
    "Pipes for formatting values, or component methods that run only on events.",
    `@for (order of orders(); track order.id) {
  <app-order-row [order]="order" (cancel)="onCancel($event)" />
} @empty {
  <p>No orders yet</p>
}`
  ],
  "Services and Dependency Injection": [
    "Services hold shared logic and state, such as data access or auth, and Angular injects them where they are needed. I provide app-wide services with providedIn root so they are singletons, and I inject dependencies rather than creating them with new.",
    "A service is a class marked @Injectable. The dependency injection system creates it once per injector and passes it into constructors or with the inject() function. Hierarchical injectors allow a service to be scoped to a route or component.",
    "DI makes services easy to mock in tests and keeps components thin.",
    "Shared state, API access and cross-cutting logic such as logging or auth.",
    "Do not store per-screen state in a root service without clearing it, because it lives for the whole app session.",
    "Mark the class with providedIn root, inject it with inject() or the constructor, and provide a fake version in TestBed for tests. Scope a service to a component by adding it to that component's providers.",
    "Pros: testable, reusable and singleton by default. Cons: hidden shared state if misused and implicit lifetimes.",
    "Passing inputs down the tree for local state, or a signal store for shared state.",
    `@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  getOrders() {
    return this.http.get<Order[]>('/api/orders');
  }
}`
  ],
  "Standalone Components and NgModules": [
    "Standalone components, directives and pipes declare their own imports and no longer need an NgModule. Since Angular 17 new projects are standalone by default, so I know how to work in both styles and how to migrate an NgModule app.",
    "A standalone component lists its dependencies in its imports array. NgModules group declarations and providers, and older code still uses them for feature areas and shared modules.",
    "Standalone code is simpler, tree-shakes better and makes dependencies explicit.",
    "New code and new features. Standalone is the default in current Angular.",
    "Do not mix patterns randomly inside one feature without a reason, and do not declare the same component in two NgModules.",
    "Add standalone: true, move imports into the component, use provideRouter and provideHttpClient in the bootstrap config, and migrate one feature at a time with the Angular schematic.",
    "Pros: less boilerplate, clear dependencies. Cons: migration effort for older apps.",
    "Keeping NgModules for legacy code, or lazy loading feature routes with loadComponent.",
    `@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html'
})
export class OrdersComponent {}`
  ],
  "Signals": [
    "Signals are reactive values that notify consumers when they change, so Angular knows exactly which views to update. I use signal for local state, computed for derived values and effect sparingly for side effects, and I prefer them over manual change tracking.",
    "A signal is read by calling it, for example count(). Writing with set or update notifies dependents. computed derives a value lazily and caches it, and effect runs when its dependencies change.",
    "Signals give fine-grained updates and simpler code than mutating fields and relying on zone.js.",
    "Component state, derived view models and inputs. Signals are the modern default in Angular 17 and later.",
    "Do not use effect to copy one signal into another, because computed or a direct read is clearer.",
    "Create state with signal(), derive with computed(), update immutably with update() or set(), and use toSignal() to convert an Observable when the template needs a value.",
    "Pros: precise change detection, simpler mental model. Cons: mixing signals and RxJS needs care, and effects can hide dependencies.",
    "RxJS observables with the async pipe, or plain fields with OnPush.",
    `export class CartComponent {
  items = signal<CartItem[]>([]);
  total = computed(() => this.items().reduce((sum, i) => sum + i.price * i.qty, 0));

  add(item: CartItem) {
    this.items.update(list => [...list, item]);
  }
}`
  ],
  "Change Detection and OnPush": [
    "Angular checks component views to update the DOM. By default every component is checked on each event. I use ChangeDetectionStrategy.OnPush so a component is checked only when its inputs change, an event happens inside it, or a signal it reads changes.",
    "The default strategy re-checks the whole tree after zone.js reports an async event. OnPush skips a subtree unless an input reference changes or markForCheck is called. Immutable updates make OnPush work reliably.",
    "Fewer checks mean faster screens, especially in large trees with many rows.",
    "Presentational components and any component rendering large lists or tables.",
    "Do not mutate an object input in place and expect OnPush to notice it.",
    "Set changeDetection to OnPush, pass new object references on updates, use signals or the async pipe, and call markForCheck or detectChanges only when unavoidable.",
    "Pros: better performance and predictable rendering. Cons: mutations are silently missed if the team forgets immutability.",
    "Zoneless change detection in newer Angular versions, or moving frequent updates into a child component.",
    `@Component({
  selector: 'app-order-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`{{ order().total }}\`
})
export class OrderRowComponent {
  order = input.required<Order>();
}`
  ],
  "Lifecycle Hooks": [
    "Lifecycle hooks let me run code at known points in a component's life. I use ngOnInit for setup that needs inputs, ngOnChanges to react to input changes, and ngOnDestroy to clean up subscriptions and timers.",
    "ngOnChanges runs before ngOnInit and on every input change. ngOnInit runs once after the first input binding. ngAfterViewInit runs after the view is ready, and ngOnDestroy runs before removal.",
    "Knowing the order prevents bugs such as reading an input before it is set or leaking subscriptions.",
    "Initial data loading in ngOnInit, reacting to input changes, and cleanup in ngOnDestroy.",
    "Do not do heavy work in constructors or in ngDoCheck, which runs on every check.",
    "Put constructor code to a minimum, load data in ngOnInit, use takeUntilDestroyed or DestroyRef for cleanup, and use ngAfterViewInit only when the DOM must exist.",
    "Pros: clear points for setup and teardown. Cons: scattered logic, and too many hooks make code hard to follow.",
    "Effects and inject(DestroyRef) for cleanup, or signal inputs with computed values.",
    `export class ReportComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(tick);
  }
}`
  ],
  "Routing and Lazy Loading": [
    "The Angular Router maps URLs to components. I split the app into feature routes and lazy load them, so the browser downloads a feature only when the user opens it, which keeps the first load small.",
    "Routes are defined as an array of path and component pairs. Lazy routes use loadComponent or loadChildren with a dynamic import. Route parameters, child routes and the router outlet structure the layout.",
    "Large apps with many screens would otherwise ship one huge bundle, which makes the first load slow.",
    "Feature areas such as admin, reports or checkout that most users never open.",
    "Do not lazy load small shared pieces that every page needs, because the extra requests add delay.",
    "Create a route per feature, use loadComponent or loadChildren, read parameters with input binding (withComponentInputBinding), and use RouterLink in templates instead of hard-coded hrefs.",
    "Pros: smaller bundles and faster first load. Cons: a short delay on first navigation and more route configuration.",
    "Preloading strategies for likely next routes, or eager routes for the core shell.",
    `export const routes: Routes = [
  { path: 'orders', loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent) },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) }
];`
  ],
  "Route Guards and Resolvers": [
    "Guards decide whether a navigation is allowed, and resolvers load data before a route activates. I use guards for authentication and role checks, and resolvers when a page must not render without its data.",
    "A guard function such as canActivate or canMatch returns true, false, a UrlTree for redirection, or an Observable or Promise of these. A resolver returns data that the route can read from ActivatedRoute.",
    "Guards protect screens in the browser, and resolvers avoid empty pages while data loads.",
    "Login-only pages, role-based admin areas, and unsaved-changes warnings with canDeactivate.",
    "Do not rely on guards for security, because the server must enforce every rule. Do not use a resolver for slow data, because navigation blocks until it completes.",
    "Write functional guards with inject() inside the function, return a UrlTree for redirects, and use canMatch with lazy routes so the bundle is not loaded for users who cannot access it.",
    "Pros: central, declarative access control. Cons: client checks are not secure, and resolvers add delay to navigation.",
    "Showing a loading state in the component, or fetching data in the component with the async pipe.",
    `export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};`
  ],
  "Reactive Forms": [
    "Reactive forms define the form model in TypeScript with FormGroup, FormControl and FormArray. I prefer them for complex forms because the model is typed, testable and easy to extend with validators.",
    "A FormControl holds a value and its validation state, and a FormGroup combines controls. Validators are functions, and valueChanges and statusChanges are observables. Typed forms add compile-time checks on the model.",
    "They scale well for dynamic fields, cross-field validation and unit testing.",
    "Multi-step forms, dynamic lists of fields, and forms with complex validation.",
    "Do not use reactive forms for a simple one-field search box where a plain input is enough.",
    "Build the FormGroup in the component with the nonNullable typed builder, add validators per control, bind with formControlName, show errors only after touched or submitted, and submit using getRawValue when needed.",
    "Pros: explicit model, easy testing and dynamic behaviour. Cons: more code than template-driven forms.",
    "Template-driven forms for very simple forms, or signal forms in newer Angular versions.",
    `form = new FormGroup({
  email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  password: new FormControl('', { nonNullable: true, validators: [Validators.minLength(8)] })
});`
  ],
  "Template-Driven Forms": [
    "Template-driven forms use directives such as ngModel in the template and let Angular build the model. I use them for small forms with simple validation and avoid them for complex logic.",
    "The template holds the form state, with ngModel for two-way binding and validation attributes such as required. Angular creates the NgForm and control objects behind the scenes.",
    "They are quick to write for a simple contact or login form.",
    "A few fields with basic validation and no dynamic structure.",
    "Do not use them for dynamic field lists, cross-field validation or heavy testing needs.",
    "Import FormsModule or the standalone equivalent, add ngModel with a name attribute, use required and pattern attributes, and read validity from the template reference.",
    "Pros: little code for simple forms. Cons: logic lives in the template, and testing is harder.",
    "Reactive forms, which scale better and keep the model in TypeScript.",
    `<form #f="ngForm" (ngSubmit)="save(f.value)">
  <input name="email" [(ngModel)]="email" required email>
  <button [disabled]="f.invalid">Save</button>
</form>`
  ],
  "Custom Validators": [
    "A custom validator is a function that checks a control or a group and returns an error object or null. I write them for rules that the built-in validators do not cover, such as matching passwords or a business code format.",
    "A sync validator takes a control and returns ValidationErrors or null. An async validator returns an Observable or Promise, often for checks against the server, such as an email that is already registered.",
    "Validation rules belong in one reusable place, and tests can cover them directly.",
    "Cross-field checks, format rules, and server-side uniqueness checks.",
    "Do not do heavy async validation on every keystroke. Use debounce and only validate on blur or submit where needed.",
    "Write a ValidatorFn that returns an error key, add it to the control or group, and for async checks use updateOn blur and switchMap to cancel stale requests.",
    "Pros: reusable and testable. Cons: async validators add network traffic and need debouncing.",
    "Built-in validators with pattern, or server-side validation that returns errors on submit.",
    `export const passwordsMatch: ValidatorFn = (group: AbstractControl) => {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
};`
  ],
  "HttpClient and Interceptors": [
    "HttpClient is Angular's typed HTTP service that returns Observables. I put cross-cutting concerns such as adding auth headers, logging and error mapping into HTTP interceptors, so each service stays focused on its API calls.",
    "HttpClient methods such as get and post return cold Observables that send the request on subscribe. An interceptor is a function that receives each request and can modify it or handle its response, and interceptors run in the order they are provided.",
    "Interceptors keep auth and error handling in one place instead of every service.",
    "Adding tokens, retrying transient errors, showing a global loader, and translating server errors.",
    "Do not put business logic or navigation rules that depend on the screen inside a global interceptor.",
    "Provide the interceptor with provideHttpClient(withInterceptors([...])), add the bearer token in one function, and map errors to a consistent shape.",
    "Pros: central, consistent behaviour. Cons: global side effects are harder to trace, and order matters.",
    "Per-request headers with HttpContext, or a base API service that wraps HttpClient.",
    `export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req);
};`
  ],
  "RxJS Operators: switchMap vs mergeMap": [
    "switchMap cancels the previous inner Observable when a new value arrives, mergeMap runs all inner Observables in parallel, and concatMap runs them one after another. I use switchMap for search and navigation, where only the latest result matters.",
    "Each higher-order operator maps a value to an inner Observable and flattens it. switchMap unsubscribes from the earlier inner request, mergeMap keeps them all running, exhaustMap ignores new values while one is running, and concatMap queues them.",
    "Choosing the wrong flattening operator causes stale results, duplicate writes or lost actions.",
    "switchMap for typeahead and route-driven loads, mergeMap for independent parallel requests, concatMap for ordered writes, and exhaustMap for submit buttons.",
    "Do not use mergeMap for search, because older responses can overwrite newer ones. Do not use switchMap for writes that must all complete.",
    "Pipe the source through debounceTime and distinctUntilChanged, then switchMap to the HTTP call. Use forkJoin when the calls are independent and must all complete.",
    "Pros: precise control over concurrency and cancellation. Cons: subtle bugs when the operator is wrong.",
    "async/await with Promises for simple one-off calls, or a state store that serialises updates.",
    `this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.api.search(term))
).subscribe(results => this.results.set(results));`
  ],
  "Subjects and the Async Pipe": [
    "A Subject is an Observable you can push values into, and BehaviorSubject keeps the latest value for new subscribers. I use the async pipe in templates so Angular subscribes and unsubscribes for me, and I avoid manual subscriptions in views.",
    "Subject multicasts to many subscribers. BehaviorSubject requires an initial value and replays it. ReplaySubject replays a set number of values. The async pipe subscribes when the view renders and unsubscribes on destroy.",
    "Shared streams need one source of truth, and the async pipe removes most manual cleanup.",
    "Sharing a stream between components, and displaying Observable data in templates.",
    "Do not expose a Subject publicly, because any caller can push values into it. Do not subscribe in a template twice when the async pipe can handle it once with a shareReplay.",
    "Keep the subject private, expose it as an Observable with asObservable, use the async pipe with @if or @let for the value, and use shareReplay when several parts of the view need the same HTTP result.",
    "Pros: simple, declarative views. Cons: many nested async pipes can be hard to read.",
    "toSignal to convert an Observable into a signal, or a signal store for shared state.",
    `private items$ = new BehaviorSubject<Item[]>([]);
readonly items = this.items$.asObservable();

// template
@if (items | async; as list) {
  @for (item of list; track item.id) { <app-item [item]="item" /> }
}`
  ],
  "Unsubscribing and Memory Leaks": [
    "Every manual subscription must end, or the callback keeps running after the component is gone, which is a memory leak. I rely on the async pipe, takeUntilDestroyed or take(1) for one-off calls, and I check for leaks when screens are opened and closed repeatedly.",
    "A subscription holds references to the component through its callbacks. When the component is destroyed but the subscription lives on, the component stays in memory and may update a detached view.",
    "Leaks grow with navigation and make the app slower and sometimes produce errors.",
    "Any subscribe call in a component or service that is not tied to the HTTP request lifecycle.",
    "Do not add unsubscribe logic for HTTP calls that complete on their own, and avoid over-engineering with many Subjects.",
    "Use the async pipe in templates, takeUntilDestroyed(this.destroyRef) for manual subscriptions, and check with the browser memory tools after navigating back and forth.",
    "Pros: no leaks and clear lifetimes. Cons: developers must remember the pattern, which lint rules can help enforce.",
    "Signals with toSignal, which unsubscribes automatically when the component is destroyed.",
    `readonly orders = toSignal(this.orderService.orders$, { initialValue: [] });

// or for a manual subscription
this.clock$.pipe(takeUntilDestroyed()).subscribe(now => this.now.set(now));`
  ],
  "State Management: NgRx and Signal Stores": [
    "State management is about where shared application state lives and how it changes. For small apps I use services with signals. For larger apps with many teams I use NgRx, which gives explicit actions, reducers, selectors and effects.",
    "NgRx keeps one store, changes it only through dispatched actions and pure reducers, reads it through selectors, and handles side effects in effects. Signal stores provide a lighter pattern with signals and methods on a service.",
    "Shared state across many components becomes hard to trace without a clear pattern.",
    "Large apps with complex workflows, many shared entities, or a need for an audit trail of changes.",
    "Do not add NgRx to a small app with one or two screens, because the boilerplate outweighs the benefit.",
    "Start with a service and signals. When state needs actions, undo or many consumers, add NgRx slices or a signal store, and keep reducers pure and selectors memoised.",
    "Pros: predictable, testable and traceable state. Cons: boilerplate and a learning curve.",
    "Services with BehaviorSubject, or passing state with inputs and outputs for local state.",
    `export const cartReducer = createReducer(
  initialState,
  on(CartActions.addItem, (state, { item }) => ({ ...state, items: [...state.items, item] }))
);`
  ],
  "Error Handling": [
    "I handle errors at three levels: the HTTP layer maps errors to a consistent shape, services decide what the user needs to know, and components show a clear message. Unhandled errors go to a global ErrorHandler for logging.",
    "HTTP errors arrive as HttpErrorResponse in the error channel of an Observable. catchError can recover with a fallback or rethrow. A custom ErrorHandler catches uncaught errors across the app.",
    "Users need clear feedback, and the team needs logs to find root causes.",
    "API calls that can fail, form submissions, and any place where a silent failure would confuse users.",
    "Do not swallow errors silently or show raw server messages to users.",
    "Map errors in an interceptor or service, use catchError to return a safe default when appropriate, show a retry option, and implement ErrorHandler to send errors to a logging service.",
    "Pros: consistent, observable failures. Cons: more code paths to test.",
    "Retry operators for transient failures, or error boundaries in the UI.",
    `this.api.getOrders().pipe(
  retry(2),
  catchError(err => {
    this.error.set('Could not load orders. Please try again.');
    return of([]);
  })
).subscribe(orders => this.orders.set(orders));`
  ],
  "Performance Optimisation": [
    "I measure before I tune. The common wins are lazy loading routes, OnPush change detection, track in @for, avoiding heavy template expressions and keeping bundles small. I use Chrome DevTools and the Angular profiler to find the real bottleneck.",
    "Performance covers initial load (bundle size, lazy routes, SSR), runtime (change detection, list rendering, expensive computations) and network (caching, fewer requests). Angular DevTools shows which components are checked.",
    "Slow screens cost users and conversions, but guessing at fixes wastes time.",
    "When a page is slow to load, scroll, or respond to input.",
    "Do not add memoisation or OnPush everywhere without evidence, because it adds complexity.",
    "Run a Lighthouse audit, check bundle size with the build stats, use the Angular DevTools profiler, then apply lazy loading, OnPush, virtual scrolling for long lists and debounced inputs.",
    "Pros: faster, measured improvements. Cons: optimisation adds some complexity and needs ongoing monitoring.",
    "Server-side rendering or prerendering for first paint, and caching responses with an HTTP cache.",
    `ng build --stats-json
npx source-map-explorer dist/app/browser/*.js
// Then lazy load the heaviest feature routes`
  ],
  "Unit Testing with TestBed": [
    "I test components and services with Jasmine or Jest and TestBed, replace dependencies with fakes, and focus on behaviour the user sees. I keep logic in services so most of it can be tested without rendering the template.",
    "TestBed configures a testing module that mirrors the app's providers. fixture.detectChanges triggers change detection, and HttpTestingController lets tests flush mocked HTTP responses.",
    "Good tests protect against regressions when the team changes code quickly.",
    "Component behaviour, form validation, service logic and HTTP mapping.",
    "Do not test private implementation details or mock everything, because the tests then prove nothing.",
    "Provide fake services in the TestBed configuration, create the component, call detectChanges, interact with the DOM or methods, and assert on the rendered output or the service calls.",
    "Pros: fast feedback and confidence. Cons: TestBed setup is verbose and brittle when markup changes often.",
    "Testing pure functions and services without TestBed, or component harnesses from Angular CDK for stable interaction.",
    `it('shows the total of cart items', () => {
  const service = jasmine.createSpyObj('CartService', ['items']);
  service.items.and.returnValue([{ price: 10, qty: 2 }]);
  TestBed.configureTestingModule({ imports: [CartComponent], providers: [{ provide: CartService, useValue: service }] });
  const fixture = TestBed.createComponent(CartComponent);
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('20');
});`
  ],
  "End-to-End Testing": [
    "End-to-end tests run the real app in a browser to check important user journeys, such as login and checkout. I use Playwright or Cypress for these and keep the number small, because they are slower and more fragile than unit tests.",
    "E2E tests drive the browser, click through screens and assert on the visible result, usually against a test backend or mocked API responses.",
    "They catch integration problems that unit tests cannot, such as routing, guards and real HTTP.",
    "Critical user paths and smoke tests after a deployment.",
    "Do not cover every edge case end to end, because the suite becomes slow and flaky.",
    "Choose a few key journeys, use stable selectors such as data-testid, mock slow external APIs, and run the suite in CI on each merge.",
    "Pros: realistic confidence. Cons: slower, more flaky, and more maintenance.",
    "Component tests with a browser runner, or integration tests with mocked HTTP.",
    `test('user can log in and see orders', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Your orders')).toBeVisible();
});`
  ],
  "XSS and Sanitisation": [
    "Angular escapes values in templates by default, which protects against most cross-site scripting. I avoid bypassing that protection, and when I must render HTML I sanitise it and never trust raw user input.",
    "Interpolated values are treated as text. Binding innerHTML is sanitised by Angular, but DomSanitizer.bypassSecurityTrust methods disable that protection and should be rare and reviewed.",
    "XSS lets attackers run scripts in users' sessions and steal tokens.",
    "Rendering user-generated content, rich text or values from an external API.",
    "Do not use bypassSecurityTrustHtml on user input, and do not build HTML strings with concatenation.",
    "Bind values with interpolation, sanitise rich text on the server or with a vetted library, add a Content Security Policy, and avoid direct DOM access with ElementRef.",
    "Pros: safe by default. Cons: rich text needs extra work to render safely.",
    "Trusted types and a strict CSP, or a markdown renderer with an allow-list.",
    `<!-- Safe: text is escaped -->
<p>{{ comment.body }}</p>

// Risky: only with content that is already trusted
this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(trustedHtml);`
  ],
  "Authentication with JWT": [
    "I handle login by sending credentials once, storing the short-lived access token in memory, and sending it with an HTTP interceptor. Route guards only improve the user experience, and the API must always check the token.",
    "A JWT is a signed token with claims such as user id, roles and expiry. The client attaches it as a bearer token, and the server validates the signature. Refresh tokens get a new access token without a new login.",
    "Stateless tokens let any API instance validate requests, and a central interceptor keeps the logic in one place.",
    "Single sign-on or API access where tokens are needed on every request.",
    "Do not store long-lived tokens in localStorage if avoidable, because any XSS can read them. Do not trust the client to enforce roles.",
    "Log in against the auth server, keep the access token in memory with a refresh token in an HttpOnly cookie, attach the token in an interceptor, and log out by clearing state and revoking the refresh token.",
    "Pros: scalable and standard. Cons: revocation is harder, and the token storage choice matters for security.",
    "Session cookies with server-side sessions, or a managed identity provider with OAuth 2.0 and PKCE.",
    `// Interceptor adds the access token; the server checks it on every call
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`
  ],
  "Slow Rendering of a Large List": [
    "I first check whether the slowness comes from rendering or from data. For long lists I use @for with track, virtual scrolling with the CDK, OnPush components and pagination or server-side filtering so the DOM never holds thousands of rows.",
    "A screen that lists 10,000 rows freezes when it loads and when the user scrolls or types into a filter.",
    "The DOM is expensive, and each change detection pass checks every row, so the UI stalls.",
    "Long tables, feeds and dropdowns with many options.",
    "Do not render all rows and hide them with CSS, because the DOM cost remains.",
    "Profile with Angular DevTools, add track to @for, use cdk-virtual-scroll-viewport for the list, move filtering and sorting to the server or a signal computed, and make row components OnPush.",
    "Pros: smooth scrolling and fast rendering. Cons: virtual lists need fixed or measured row heights and can complicate accessibility and find-in-page.",
    "Server-side pagination or infinite scroll that loads pages on demand.",
    `<cdk-virtual-scroll-viewport itemSize="48" class="list">
  <div *cdkVirtualFor="let row of rows; trackBy: trackById">{{ row.name }}</div>
</cdk-virtual-scroll-viewport>`
  ],
  "Typeahead Search Shows Stale Results": [
    "A typeahead can show results for an old query when slow responses arrive after newer ones. I fix it with debounce, distinct values and switchMap, so only the latest request's result is kept.",
    "The user types 'an', then 'ang', and the response for 'an' arrives last, so the list shows the wrong results for the current text.",
    "Responses arrive in any order, so the last response to arrive is not always the newest request.",
    "Search boxes, autocomplete and any filter that calls the server on input.",
    "Do not fire a request on every keystroke, and do not use mergeMap for search.",
    "Debounce the input by about 300 ms, skip repeated values, switchMap to the API call, and handle the empty query without a request.",
    "Pros: correct and efficient search. Cons: a short delay before results appear.",
    "Client-side filtering for small local lists, or caching results for repeated queries.",
    `this.search.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(q => q ? this.api.search(q) : of([]))
).subscribe(results => this.results.set(results));`
  ],
  "Memory Leak After Navigation": [
    "I suspect a leak when memory keeps growing as the user opens and closes a screen. I find it with the Chrome heap snapshot and by checking for subscriptions, timers or event listeners that outlive the component.",
    "The user goes to a report page and back several times, and the browser memory grows each time. The report component still receives events from a global Subject after it is destroyed.",
    "Each leaked subscription keeps its component and data in memory and may call methods on destroyed views.",
    "Components that subscribe to global streams, use timers, or add document listeners.",
    "Do not assume the garbage collector will fix it, because active subscriptions keep references alive.",
    "Take heap snapshots before and after navigation, compare detached DOM nodes, switch manual subscriptions to takeUntilDestroyed or the async pipe, and clear timers and listeners in ngOnDestroy or with DestroyRef.",
    "Pros: stable memory. Cons: needs discipline across the team, which lint rules and reviews help with.",
    "toSignal for component state, or services that expose state only while a screen is active.",
    `private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.bus.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(e => this.handle(e));
}`
  ],
  "Form With Dependent Fields": [
    "I model the form as a reactive form, listen to the controlling field, and enable, reset or revalidate the dependent fields. I keep the rule in the form model rather than in the template so it is testable.",
    "A product form where the 'Country' field decides which 'State' options appear, and 'State' is required only for some countries.",
    "The UI must stay consistent, and users must not submit invalid combinations.",
    "Any form where one answer changes the valid options or required fields.",
    "Do not reset the form on every change, because users lose their input.",
    "Subscribe to the country control with valueChanges or use a signal, load the states for that country, reset only the state control, and add a validator that depends on the country value.",
    "Pros: correct and testable rules. Cons: dependency chains can get complex and need clear tests.",
    "Multi-step wizards, or a schema-based form library for large rule sets.",
    `this.form.controls.country.valueChanges.pipe(
  distinctUntilChanged(),
  switchMap(c => this.geo.statesFor(c))
).subscribe(states => {
  this.states.set(states);
  this.form.controls.state.reset('');
});`
  ],
  "Sharing State Between Unrelated Components": [
    "Components that are not parent and child should not pass data through many layers. I share the state through a service with signals or an RxJS subject, or a store if many screens depend on it, so both components read the same source of truth.",
    "A header cart badge and a product page must show the same cart count. The cart service holds the items and both components read them.",
    "Prop drilling through unrelated layers couples components and makes changes risky.",
    "Shared data across distant components, such as user profile, cart or notifications.",
    "Do not share local UI state, such as an open dropdown, through a global service.",
    "Create a service with providedIn root, expose a readonly signal or Observable, add methods that change the state, and read it in each component.",
    "Pros: one source of truth and loose coupling. Cons: global state needs care to avoid hidden dependencies.",
    "Route parameters or query strings for shareable state, or a full store for complex workflows.",
    `@Injectable({ providedIn: 'root' })
export class CartState {
  private _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);
}`
  ],
  "Token Expires Mid-Session": [
    "When the access token expires, the API returns 401. The interceptor refreshes the token once, queues other requests while the refresh runs, and retries them. If the refresh fails, the user is logged out and sent to the login page.",
    "A user is editing a form when the access token expires. Their next save returns 401 and the work could be lost.",
    "Users should not lose work or see random errors, and the refresh must not run many times in parallel.",
    "Any app with short access tokens and long user sessions.",
    "Do not retry every failing request in a loop, and do not refresh on every call.",
    "In the interceptor, catch 401 responses, call the refresh endpoint once with a shared in-flight Observable, retry the original request with the new token, and redirect to login if refresh fails.",
    "Pros: seamless sessions and no lost work. Cons: careful concurrency code is needed and the refresh endpoint must be protected.",
    "Silent refresh in an iframe, or longer sessions with server-side session management.",
    `// Single in-flight refresh shared by all waiting requests
refreshed$ ??= this.auth.refresh().pipe(finalize(() => (this.refreshed$ = null)), shareReplay(1));`
  ],
  "Slow First Load of a Large App": [
    "I reduce what the browser must download before the first screen. The main levers are lazy loading routes, removing heavy unused libraries, prerendering or server-side rendering, and deferring non-critical code.",
    "A large app takes seconds to show anything because the main bundle contains every feature and several large libraries.",
    "The first load decides whether users stay, and the browser must parse all code before it can show content.",
    "Enterprise apps with many features, or public pages where first paint matters.",
    "Do not move everything to SSR without measuring, because server load and hydration add complexity.",
    "Check the bundle report, lazy load feature routes, replace big libraries with smaller ones, use the @defer block for heavy components, enable prerendering for public pages, and cache static assets.",
    "Pros: faster first paint. Cons: more build and hosting complexity, and SSR needs careful state handling.",
    "Caching with a service worker, or a CDN for static assets.",
    `@defer (on viewport) {
  <app-heavy-chart [data]="data()" />
} @placeholder {
  <p>Loading chart...</p>
}`
  ],
  "Build a Counter with Signals": [
    "I build a counter with a signal for the state, a computed value for derived output, and small methods that update the signal. This shows the basics of signals that interviewers expect.",
    "Create a standalone component with a count signal, increment, decrement and reset methods, and a computed double value shown in the template.",
    "It checks that you know how to read, write and derive signal state without mutating plain fields.",
    "Any time a component needs simple local state, such as a quantity picker or a toggle.",
    "Do not store derived values in a separate signal that you update by hand, because they drift out of sync.",
    "Use signal for the state, use update for changes based on the previous value, use computed for derived values, and call the signal in the template with parentheses.",
    "Pros: small and easy to read. Cons: for shared state, move the signal into a service.",
    "Plain class fields with OnPush, but the signal version updates the view precisely.",
    `@Component({
  selector: 'app-counter',
  standalone: true,
  template: \`
    <button (click)="decrement()">-</button>
    <span>{{ count() }}</span>
    <span>Double: {{ double() }}</span>
    <button (click)="increment()">+</button>
    <button (click)="reset()">Reset</button>
  \`
})
export class CounterComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);

  increment() { this.count.update(c => c + 1); }
  decrement() { this.count.update(c => c - 1); }
  reset() { this.count.set(0); }
}`
  ],
  "Build a Custom Pipe": [
    "I write a pure pipe that shortens text to a limit and adds a suffix, with a default for each argument. Pure pipes only re-run when their input changes, which keeps templates fast.",
    "Create a standalone pipe with a name, implement PipeTransform, handle null input, and use the limit and suffix as optional arguments.",
    "Formatting logic belongs in a pipe instead of being repeated in components and templates.",
    "Display formatting such as truncating descriptions, currency or dates.",
    "Do not call services or perform HTTP calls inside a pipe, because pipes should be simple and fast.",
    "Declare the pipe with a name, return an empty string for null, slice the text when it is too long, and declare it in the imports of each standalone component that uses it.",
    "Pros: reusable and pure, so it is cheap. Cons: an impure pipe runs on every check and should be avoided.",
    "A method on the component, which works but is not reusable across templates.",
    `@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit = 20, suffix = '...'): string {
    if (!value) return '';
    return value.length > limit ? value.slice(0, limit).trimEnd() + suffix : value;
  }
}

// usage: {{ product.description | truncate:50 }}`
  ],
  "Build an Attribute Directive": [
    "I write an attribute directive that changes the background of its host element on hover, with the colour passed in as an input. It shows how a directive uses ElementRef, host listeners and inputs.",
    "Create a standalone directive with a selector in attribute form, an input for the colour with a default, and mouse enter and leave listeners on the host.",
    "Directives add reusable DOM behaviour without a new component.",
    "Hover effects, tooltips, or any behaviour that applies to existing elements.",
    "Do not change the DOM directly with innerHTML or heavy DOM queries, and do not forget to reset styles on leave.",
    "Use the host property for the listeners, read the input with input(), inject ElementRef, and set and clear the style on the native element. For cleaner code, use Renderer2 or a host style binding.",
    "Pros: reusable and declarative. Cons: direct style changes bypass the template, so a host binding is often cleaner.",
    "A CSS hover rule, which is simpler when only styling is needed.",
    `@Directive({
  selector: '[appHighlight]',
  standalone: true,
  host: {
    '(mouseenter)': 'onEnter()',
    '(mouseleave)': 'onLeave()'
  }
})
export class HighlightDirective {
  color = input('yellow', { alias: 'appHighlight' });
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  onEnter() { this.el.nativeElement.style.backgroundColor = this.color(); }
  onLeave() { this.el.nativeElement.style.backgroundColor = ''; }
}

// usage: <p appHighlight="lightblue">Hover me</p>`
  ],
  "Build a Custom Structural Directive": [
    "I write a structural directive that renders its template only when a condition is false, which is the reverse of ngIf. It shows how TemplateRef and ViewContainerRef control what is in the DOM.",
    "Create a directive whose selector is in brackets, inject the template and the view container, and create or clear the embedded view when the input changes.",
    "Structural directives explain how Angular's star syntax works internally.",
    "Showing a fallback block when a value is missing, or hiding content for a role.",
    "Do not create a new view on every change, because that duplicates the DOM. Track whether the view already exists.",
    "Inject TemplateRef and ViewContainerRef, use a setter input, keep a flag for the current state, create the view when needed and clear it when the condition changes.",
    "Pros: a clean template syntax for DOM control. Cons: more complex than a simple attribute directive and harder to debug.",
    "A plain ngIf with a negated expression, which is often enough.",
    `@Directive({ selector: '[appUnless]', standalone: true })
export class UnlessDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private hasView = false;

  @Input() set appUnless(condition: boolean) {
    if (!condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

// usage: <p *appUnless="loggedIn">Please log in</p>`
  ],
  "Parent-Child Communication with Signal Inputs and Outputs": [
    "I pass data down with input signals and send events up with output, so the child stays reusable and the parent owns the state. I can also use model for two-way binding.",
    "Build a star rating child that receives the current value and emits the newly selected rating, and a parent that stores the value in a signal.",
    "This is the core of component design, and it tests whether you know the data flows down and events flow up.",
    "Any reusable child component, such as a rating, a card or a dialog.",
    "Do not change the parent's state directly from the child or share mutable objects between them.",
    "Declare the child value with input(), declare the event with output(), emit in the method, and bind in the parent with property binding and an event binding.",
    "Pros: clear data flow and easy testing. Cons: deep chains of inputs and outputs need a service instead.",
    "model() for two-way binding, or a shared service for distant components.",
    `@Component({
  selector: 'app-rating',
  standalone: true,
  template: \`
    @for (star of [1, 2, 3, 4, 5]; track star) {
      <button (click)="select(star)">{{ star <= value() ? '★' : '☆' }}</button>
    }
  \`
})
export class RatingComponent {
  value = input(0);
  ratingChange = output<number>();

  select(star: number) { this.ratingChange.emit(star); }
}

// parent template: <app-rating [value]="rating()" (ratingChange)="rating.set($event)" />`
  ],
  "Build a Debounced Search Box": [
    "I build a search box that waits for the user to stop typing, skips repeated values, cancels old requests and shows a loading state. It combines reactive forms with RxJS operators and is a very common coding task.",
    "Create a component with a FormControl bound to an input, subscribe to its changes, debounce, use switchMap to call the API, and set the results and loading state.",
    "It shows that you can combine forms, RxJS and signals without causing stale results or memory leaks.",
    "Autocomplete, product search and any input that calls the server.",
    "Do not subscribe inside the subscribe callback of another stream, and do not forget to handle an empty query.",
    "Use debounceTime, distinctUntilChanged, switchMap with catchError inside, set the loading flag before and after, and use takeUntilDestroyed for cleanup.",
    "Pros: efficient and accurate search. Cons: the operator chain takes practice to read.",
    "Async pipe with an observable of results, which is shorter when the template handles the stream.",
    `@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <input [formControl]="search" placeholder="Search products">
    @if (loading()) { <p>Loading...</p> }
    <ul>
      @for (item of results(); track item.id) { <li>{{ item.name }}</li> }
    </ul>
  \`
})
export class SearchComponent {
  private api = inject(ProductService);
  search = new FormControl('', { nonNullable: true });
  results = signal<Product[]>([]);
  loading = signal(false);

  constructor() {
    this.search.valueChanges.pipe(
      map(term => term.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap(term => term
        ? this.api.search(term).pipe(catchError(() => of([])))
        : of([])),
      tap(() => this.loading.set(false)),
      takeUntilDestroyed()
    ).subscribe(items => this.results.set(items));
  }
}`
  ],
  "Dynamic Form with FormArray": [
    "I build a form where the user can add and remove phone numbers, using a FormArray for the list and validators on each control. It is a common task that tests reactive forms knowledge.",
    "Create a reactive form with a name control and a FormArray of phone controls. Add a method to push a new control, a method to remove one by index, and validate on submit.",
    "Dynamic lists of inputs are common in real forms, such as addresses, contacts or line items.",
    "Any form where the number of fields is chosen by the user.",
    "Do not use a plain array of values outside the form model, because the validation and the submitted value then drift apart.",
    "Create the FormArray with a factory method for each control, bind it with formArrayName or with the controls list in the template, and use getRawValue on submit.",
    "Pros: validation and value stay in one model. Cons: the template and typing need more care.",
    "A template-driven form with a manual list, which is harder to validate.",
    `@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="save()">
      <input formControlName="name" placeholder="Name">
      @for (phone of phones.controls; track $index; let i = $index) {
        <div>
          <input [formControl]="phone" placeholder="Phone">
          <button type="button" (click)="removePhone(i)">Remove</button>
        </div>
      }
      <button type="button" (click)="addPhone()">Add phone</button>
      <button [disabled]="form.invalid">Save</button>
    </form>
  \`
})
export class ContactFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phones: this.fb.array([this.createPhone()])
  });

  get phones() { return this.form.controls.phones; }

  createPhone() {
    return this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\\d{10}$/)]);
  }
  addPhone() { this.phones.push(this.createPhone()); }
  removePhone(index: number) { this.phones.removeAt(index); }
  save() { if (this.form.valid) console.log(this.form.getRawValue()); }
}`
  ],
  "Write a Functional Route Guard": [
    "I write a functional guard that allows navigation only for logged-in admins and otherwise redirects to login with the return URL. It shows route protection with the modern function style.",
    "Create a CanActivateFn that reads the auth service through inject, returns true when allowed, and returns a UrlTree for the login page otherwise.",
    "Guards control navigation in the browser, and returning a UrlTree is the clean way to redirect.",
    "Protected screens such as admin pages or account settings.",
    "Do not treat a guard as security, because the API must still check the token and role.",
    "Write the guard function, read the auth state with inject, return a UrlTree with a returnUrl query parameter, and add the guard to the route's canActivate array.",
    "Pros: simple and testable. Cons: client checks can be bypassed, so the server remains the source of truth.",
    "canMatch, which stops the lazy bundle from loading for users who cannot access the route.",
    `export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.hasRole('admin')) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// routes: { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent) }`
  ],
  "Write an HTTP Error Interceptor": [
    "I write a functional HTTP interceptor that handles 401 responses by sending the user to login and turns other errors into a readable error. Central error handling keeps services simple.",
    "Create an HttpInterceptorFn that calls next, pipes the result through catchError, redirects on 401, and rethrows a clear error.",
    "Errors from many services are handled in one place, which is easier to change and test.",
    "Global behaviour such as session expiry or a standard error message.",
    "Do not swallow errors silently and do not put screen-specific messages in the interceptor.",
    "Use catchError, check error.status, navigate with the Router, and throw with throwError so that callers can still react.",
    "Pros: consistent behaviour. Cons: global side effects must be understood by the team.",
    "A per-service error handler, which is more flexible but repeated.",
    `export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        router.navigate(['/login']);
      }
      return throwError(() => new Error(error.error?.message ?? 'Request failed'));
    })
  );
};

// app.config.ts: provideHttpClient(withInterceptors([httpErrorInterceptor]))`
  ],
  "Global Loading Spinner Interceptor": [
    "I show one loading spinner while any HTTP request is running, using a counter so the spinner stays on until the last request finishes. It combines an interceptor, a service and signals.",
    "Create a loading service with a pending counter and a signal, and an interceptor that increments the counter before a request and decrements it in finalize.",
    "A plain true or false flag hides the spinner too early when two requests overlap.",
    "Global loading feedback for the whole app.",
    "Do not show the spinner for requests that must be silent, such as background polling, unless you add a flag for them.",
    "Increment on start, decrement with finalize so errors also decrement, and expose a computed or signal for the template.",
    "Pros: simple and accurate. Cons: one spinner can hide which part of the page is loading.",
    "Per-component loading states for precise feedback.",
    `@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;
  readonly loading = signal(false);

  start() { this.pending++; this.loading.set(true); }
  stop() {
    this.pending = Math.max(0, this.pending - 1);
    this.loading.set(this.pending > 0);
  }
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoadingService);
  loader.start();
  return next(req).pipe(finalize(() => loader.stop()));
};`
  ],
  "Shared State Service with Signals": [
    "I write a service that holds a cart as a private signal, exposes read-only values and computed totals, and changes the state only through methods. It shows clean state design.",
    "Create an injectable root service with a private writable signal, a readonly view of it, computed count and total, and add and remove methods that update immutably.",
    "Keeping writes inside the service prevents components from changing the state in inconsistent ways.",
    "Shared data such as a cart, the current user or feature flags.",
    "Do not expose the writable signal publicly, and do not mutate array items in place.",
    "Use signal for the private state, asReadonly for the public view, computed for totals, and update with map and filter for changes.",
    "Pros: one source of truth and easy testing. Cons: a global service must be kept small and focused.",
    "A signal store library for larger apps with many slices.",
    `@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly items = signal<CartItem[]>([]);

  readonly all = this.items.asReadonly();
  readonly count = computed(() => this.items().reduce((n, i) => n + i.qty, 0));
  readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price * i.qty, 0));

  add(item: CartItem) {
    this.items.update(list => {
      const found = list.some(i => i.id === item.id);
      return found
        ? list.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...list, { ...item, qty: 1 }];
    });
  }

  remove(id: number) {
    this.items.update(list => list.filter(i => i.id !== id));
  }
}`
  ],
  "Unit Test a Component with a Mock Service": [
    "I test a component by replacing its service with a Jasmine spy that returns fixed data, then check that the rendered output shows the data. This is the standard way to unit test Angular components.",
    "Create a spy object for the service, provide it in TestBed, create the component, run change detection, and assert on the output and the service call.",
    "A mock keeps the test fast and independent of the API, so failures point at the component.",
    "Any component that gets data from a service.",
    "Do not test the service internals in a component test, and do not forget to call detectChanges after setup.",
    "Create the spy with the methods used, set the return value with and.returnValue, configure the testing module with a useValue provider, call createComponent and detectChanges, then check the text or the spy calls.",
    "Pros: fast and focused. Cons: mocks can drift from the real service if they are not kept in sync.",
    "HttpTestingController for tests that check the real service and HTTP calls.",
    `describe('ProductListComponent', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  let productService: jasmine.SpyObj<ProductService>;

  beforeEach(async () => {
    productService = jasmine.createSpyObj<ProductService>('ProductService', ['getProducts']);
    productService.getProducts.and.returnValue(of([{ id: 1, name: 'Laptop' }]));

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [{ provide: ProductService, useValue: productService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();
  });

  it('renders the products returned by the service', () => {
    expect(productService.getProducts).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Laptop');
  });
});`
  ],
  "Implement a Debounce Function in TypeScript": [
    "I write a generic debounce function that delays a call until the calls stop for a set time, and clears the previous timer each time. It is a common plain TypeScript coding question.",
    "Write a function that takes another function and a delay, returns a new function, stores the timer id in a closure, clears it on each call, and runs the original after the delay.",
    "Debouncing is needed for resize, scroll and input events, and the question tests closures and typing.",
    "Event handlers that would otherwise run many times per second.",
    "Do not use it when every call must run, such as saving each keystroke to an audit log.",
    "Keep the timer in a closure, clear it with clearTimeout before scheduling, and pass the arguments through with rest parameters.",
    "Pros: simple, no dependency needed. Cons: the last call wins, and there is no cancel method unless you add one.",
    "RxJS debounceTime, which is the usual choice in Angular code.",
    `function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const logSearch = debounce((term: string) => console.log('search', term), 300);`
  ],
  "Infinite Scroll with IntersectionObserver": [
    "I load the next page when a sentinel element at the bottom of the list becomes visible, using IntersectionObserver. I guard against parallel requests and stop when there is no more data, and I disconnect the observer on destroy.",
    "Create a component with a sentinel element in the template, observe it after the view is ready, and load the next page when it is visible, adding the results to a signal.",
    "It avoids scroll listeners, which are slower, and it shows that you can handle the DOM lifecycle correctly.",
    "Feeds, long lists and search results with paged APIs.",
    "Do not observe the sentinel before the view exists, and do not request pages in parallel.",
    "Use ViewChild for the sentinel, create the observer in ngAfterViewInit, guard with a loading flag and a done flag, append results with update, and disconnect in ngOnDestroy.",
    "Pros: efficient and simple. Cons: it needs a server with pagination and careful handling of empty pages.",
    "Virtual scrolling for very long lists that are already loaded, or a load more button for accessibility.",
    `@Component({
  selector: 'app-feed',
  standalone: true,
  template: \`
    @for (post of posts(); track post.id) { <app-post [post]="post" /> }
    <div #sentinel></div>
  \`
})
export class FeedComponent implements AfterViewInit, OnDestroy {
  private api = inject(PostService);
  @ViewChild('sentinel') sentinel!: ElementRef<HTMLElement>;

  posts = signal<Post[]>([]);
  private page = 1;
  private loading = false;
  private done = false;
  private observer?: IntersectionObserver;

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) this.loadMore();
    });
    this.observer.observe(this.sentinel.nativeElement);
  }

  loadMore() {
    if (this.loading || this.done) return;
    this.loading = true;
    this.api.getPage(this.page).subscribe(items => {
      this.done = items.length === 0;
      this.posts.update(list => [...list, ...items]);
      this.page++;
      this.loading = false;
    });
  }

  ngOnDestroy() { this.observer?.disconnect(); }
}`
  ]
};
