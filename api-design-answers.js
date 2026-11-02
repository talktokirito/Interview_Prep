// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Resource Modelling and URIs": [
    "Model an API around nouns (resources) with plural collection names, identify them with stable URIs such as /orders/{id}, and let HTTP methods express the action. Model by business concept, not by database table, and keep nesting shallow.",
    "A resource is anything a client can name and fetch, such as an order, and a collection URI like /orders holds many. Sub-resources express ownership (/orders/{id}/items), and operations that do not fit CRUD become sub-resources or controller-style endpoints such as POST /orders/{id}/cancellation.",
    "Predictable URIs make an API discoverable, cacheable and easy to evolve, whereas RPC-style verbs in paths multiply endpoints and hide semantics.",
    "Apply it to any public or internal HTTP API consumed by other teams, and especially where caching, gateways and tooling depend on consistent URIs.",
    "Do not force CRUD onto genuinely action-oriented operations, nest more than two levels deep, expose internal database ids or table structure, or put verbs such as getOrder in paths.",
    "Use lower-case, hyphenated plural nouns, use opaque ids (UUID or ULID), filter via query parameters (/orders?status=PAID), keep URIs stable, and model long actions as a resource you create (POST /exports). Keep representations separate from the persistence model with DTOs.",
    "Resource modelling gives consistency and tooling support, but modelling a rich domain action as a resource can feel indirect, and deep nesting couples URIs to the hierarchy.",
    "Alternatives are RPC-style endpoints (gRPC or JSON-RPC), GraphQL where clients shape the response, and command-style APIs in a CQRS system.",
    `GET    /customers/42/orders?status=PAID&sort=-createdAt   -> list a customer's paid orders
POST   /orders                                            -> create, returns 201 + Location: /orders/9f1c
GET    /orders/9f1c                                       -> read one
PUT    /orders/9f1c                                       -> full replace
PATCH  /orders/9f1c                                       -> partial update
DELETE /orders/9f1c                                       -> remove
POST   /orders/9f1c/cancellation                          -> non-CRUD action modelled as a sub-resource`
  ],
  "HTTP Methods and Idempotency": [
    "GET, HEAD and OPTIONS are safe (no state change), and GET, HEAD, PUT, DELETE and OPTIONS are idempotent (repeating gives the same server state), while POST and PATCH are not idempotent by default. Idempotency is what makes client retries safe after a timeout.",
    "Safe means read-only, and idempotent means N identical requests have the same effect as one. DELETE is idempotent even though the second call may return 404, since the state is the same.",
    "Networks fail ambiguously, so clients must retry without knowing whether the first request was applied, and the method semantics tell intermediaries and clients what is safe to repeat.",
    "Use PUT for full replacement at a known URI, POST to create or to trigger non-idempotent actions, PATCH for partial changes, and GET for cached reads.",
    "Do not use GET for state-changing actions, do not tunnel everything through POST, and do not assume POST retries are safe without an idempotency key.",
    "Make PUT and DELETE genuinely idempotent in the service, use upserts and conditional updates (If-Match with ETags), and add Idempotency-Key handling for POST. Return 405 with an Allow header for unsupported methods.",
    "Correct semantics let proxies, browsers and clients retry and cache safely, but making POST idempotent costs extra storage and logic.",
    "Alternatives are gRPC with explicit retry policies, and message-based APIs where deduplication is done by message id.",
    `PUT /carts/77/items/sku-1 HTTP/1.1
Content-Type: application/json

{"quantity": 3}

# Sending it twice leaves quantity = 3 (idempotent).
# POST /carts/77/items {"sku":"sku-1","quantity":1} sent twice adds two lines (not idempotent).`
  ],
  "HTTP Status Codes": [
    "Use the status class to tell clients what happened: 2xx success, 3xx redirection, 4xx the client erred, 5xx the server failed. Pick the most specific code, such as 201 with Location for creation, 204 for no content, 400 versus 422 for validation, 401 versus 403 for authentication versus authorisation, 404, 409 for conflicts and 429 for throttling.",
    "401 means missing or invalid credentials, 403 means authenticated but not allowed, 409 means the request conflicts with current state (duplicate, version mismatch), and 422 means syntactically valid but semantically invalid. 502, 503 and 504 describe gateway and upstream failures, with 503 often carrying Retry-After.",
    "Clients, retries, monitoring and gateways all branch on status codes, so wrong codes cause wrong retries and misleading error rates.",
    "Apply it to every response, and align it with your error body (Problem Details) and your alert rules for 5xx rates.",
    "Do not return 200 with an error in the body, use 500 for validation errors, or leak internals in 5xx messages. Do not return 404 versus 403 inconsistently when it reveals resource existence.",
    "Map exceptions centrally with @ControllerAdvice, return 201 plus Location for POST creates, 204 for successful DELETE, 400 for malformed input, 422 or 400 for validation failures, 412 for failed preconditions, and 5xx only for genuine server faults that clients may retry.",
    "Fine-grained codes help clients, but too many unusual codes confuse them. 4xx should not be retried blindly, while 5xx and 429 may be retried with backoff.",
    "Alternatives are always returning 200 with an error envelope (as in GraphQL), which hides failures from tooling, and gRPC status codes.",
    `HTTP/1.1 201 Created
Location: /orders/9f1c
Content-Type: application/json

{"id":"9f1c","status":"NEW"}

HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{"type":"https://api.example.com/problems/duplicate-order","title":"Duplicate order","status":409}`
  ],
  "Richardson Maturity Model": [
    "The Richardson model rates REST maturity from level 0 (one endpoint, RPC over HTTP) through level 1 (resources), level 2 (proper HTTP verbs and status codes) to level 3 (hypermedia controls, HATEOAS). Most production APIs sit at level 2, and level 3 is rarely worth the cost.",
    "Level 0 uses POST to a single URL, level 1 adds distinct resource URIs, level 2 uses methods and status codes meaningfully, and level 3 returns links that tell the client what it can do next.",
    "It gives a vocabulary for discussing how RESTful an API is, and shows where HATEOAS fits in Roy Fielding's REST constraints.",
    "Use it in design reviews to explain why an API is not truly REST, and to decide how far to go.",
    "Do not treat level 3 as mandatory, or label an API REST just because it uses JSON over HTTP.",
    "Aim for level 2 with consistent URIs and codes. Add hypermedia selectively, for example pagination links and state-dependent actions, using Spring HATEOAS with HAL when clients benefit.",
    "Level 2 is simple and well understood. Level 3 reduces client coupling to URI structure but adds payload size, and few client developers actually follow links.",
    "Alternatives are OpenAPI-described contracts at level 2, GraphQL and gRPC, which do not use this model.",
    `{
  "id": "9f1c",
  "status": "NEW",
  "_links": {
    "self":   { "href": "/orders/9f1c" },
    "cancel": { "href": "/orders/9f1c/cancellation" },
    "pay":    { "href": "/orders/9f1c/payment" }
  }
}`
  ],
  "Content Negotiation": [
    "Content negotiation lets one resource have several representations: the client states what it can accept with the Accept header (and Accept-Language), the server declares what it sends with Content-Type, and mismatches give 406 Not Acceptable or 415 Unsupported Media Type.",
    "Accept can list media types with quality values, for example application/json;q=0.9. The server should add a Vary header when the response depends on request headers so caches key correctly.",
    "Different clients want JSON, XML, CSV or versioned media types, and the protocol has a built-in mechanism for it.",
    "Use it to serve multiple formats, to support media-type versioning, and to return application/problem+json errors.",
    "Do not use it for dozens of formats you cannot test, and do not ignore Vary on cached responses.",
    "In Spring MVC declare produces and consumes on mapping annotations, configure ContentNegotiationManager sensibly (header-based, not path extensions), return 415 for unsupported request bodies and 406 for unavailable responses.",
    "Header-based negotiation is clean but hard to test in a browser, while a query parameter or extension is easy but non-standard.",
    "Alternatives are separate URIs per format, a format query parameter, or supporting JSON only.",
    `@GetMapping(value = "/orders/{id}", produces = { "application/json", "application/vnd.example.order.v2+json" })
public OrderDto get(@PathVariable String id) { ... }

@PostMapping(value = "/orders", consumes = "application/json")
public ResponseEntity<OrderDto> create(@RequestBody @Valid CreateOrder cmd) { ... }

# Request
GET /orders/9f1c
Accept: application/vnd.example.order.v2+json`
  ],
  "API Versioning": [
    "Version an API only when you must make a breaking change, and prefer evolving it compatibly. The usual strategies are URI (/v2/orders), header or media type (Accept: application/vnd.example.v2+json) and query parameter, and URI versioning is the most common because it is explicit and cache-friendly.",
    "A version identifies a contract, not an implementation release. Spring Framework 7 adds built-in API versioning support, and in earlier versions you implement it with separate controllers, mapping conditions or a gateway rule.",
    "Consumers cannot upgrade in lockstep, so breaking changes need a coexistence period during which old and new contracts run in parallel.",
    "Use it for public APIs and mobile clients you cannot force to upgrade, and for internal APIs with many independent consumers.",
    "Do not version for additive changes, create a new version per release, or keep unlimited old versions alive.",
    "Prefer additive evolution, publish a deprecation policy with Deprecation and Sunset headers, route versions at the gateway, share code between versions through a common service layer with version-specific DTOs, and monitor traffic per version before retiring one.",
    "URI versioning is simple but breaks URI stability, and header versioning keeps URIs clean but is less visible. Every live version multiplies testing and maintenance cost.",
    "Alternatives are no versioning with strict backward compatibility (GraphQL style), consumer-driven contracts, and date-based versions as some large public APIs use.",
    `@RestController
@RequestMapping("/v1/orders")
class OrderV1Controller { ... }

@RestController
@RequestMapping("/v2/orders")
class OrderV2Controller { ... }

HTTP/1.1 200 OK
Deprecation: true
Sunset: Wed, 30 Sep 2026 23:59:59 GMT
Link: <https://api.example.com/v2/orders>; rel="successor-version"`
  ],
  "Backward Compatibility": [
    "An API change is backward compatible if existing clients keep working unchanged. Adding optional fields, endpoints or optional parameters is safe, while removing or renaming fields, changing types or semantics, tightening validation or adding a required request field is breaking.",
    "Compatibility works in two directions: servers must accept old requests, and clients should follow the tolerant-reader principle by ignoring unknown fields and unknown enum values.",
    "Breaking consumers you do not control causes outages and slow adoption of the platform.",
    "Apply it whenever an API has external or independently deployed consumers, including events and message schemas.",
    "Do not assume adding an enum value is safe for strict clients, change the meaning of an existing field, or reuse a field name for something else.",
    "Add fields with defaults, deprecate before removal, run contract tests (Pact or Spring Cloud Contract) and OpenAPI diff checks such as openapi-diff in CI, configure Jackson with FAIL_ON_UNKNOWN_PROPERTIES disabled on clients, and communicate sunsets.",
    "Strict compatibility keeps clients stable but accumulates legacy fields and slows cleanup. Allowing breaks needs versioning and coordination.",
    "Alternatives are versioned APIs with parallel support, expand-contract migrations, and schema registries with compatibility modes for events.",
    `# Compatible
+ add optional field "middleName" to Customer response
+ add new endpoint GET /customers/{id}/preferences
+ add optional query parameter ?includeArchived=true

# Breaking
- rename "phone" to "phoneNumber"
- change "amount" from integer cents to decimal string
- make "country" required on POST /customers
- remove a value from an enum clients send`
  ],
  "OpenAPI and Contract-First": [
    "OpenAPI is a language-neutral description of an HTTP API (paths, schemas, security), and contract-first means you write and review the spec before the code, then generate server stubs, clients and docs from it. It prevents drift between documentation and implementation.",
    "The spec is a YAML or JSON document in OpenAPI 3.0 or 3.1 format. Code-first generates the spec from annotations (springdoc-openapi), while contract-first generates code from the spec with openapi-generator or similar.",
    "Teams need an agreed contract early so frontend, backend and partners can work in parallel and test against mocks.",
    "Use contract-first for public APIs and cross-team integrations, and code-first for small internal services where speed matters.",
    "Do not let the generated code become hand-edited so that regeneration breaks, or publish a spec that no test verifies against the running service.",
    "Store the spec in version control, lint it with Spectral, review changes like code, generate interfaces and DTOs in the build, verify responses against the spec in tests, and publish docs and clients from CI.",
    "Contract-first aids design quality and parallel work but needs tooling discipline. Code-first is quicker but lets the spec reflect accidental design.",
    "Alternatives are code-first with springdoc, AsyncAPI for events, Protobuf IDL for gRPC and GraphQL SDL.",
    `openapi: 3.0.3
info:
  title: Orders API
  version: 1.0.0
paths:
  /orders/{id}:
    get:
      operationId: getOrder
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: The order
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Order" }
        "404":
          description: Not found
          content:
            application/problem+json:
              schema: { $ref: "#/components/schemas/Problem" }
components:
  schemas:
    Order:
      type: object
      required: [id, status]
      properties:
        id: { type: string, format: uuid }
        status: { type: string, enum: [NEW, PAID, CANCELLED] }
    Problem:
      type: object
      properties:
        type: { type: string }
        title: { type: string }
        status: { type: integer }`
  ],
  "Pagination, Filtering and Sorting": [
    "Never return unbounded collections: use offset (page and size) pagination for simple cases and cursor or keyset pagination for large or fast-changing data, with a maximum page size. Express filtering and sorting through query parameters such as status=PAID and sort=-createdAt.",
    "Offset pagination uses LIMIT and OFFSET, which gets slow for deep pages and can skip or duplicate rows when data changes. Keyset pagination uses the last seen sort key (WHERE id greater than last_id), and cursor tokens hide this behind an opaque string.",
    "Large result sets hurt latency, memory and database load, and clients need stable ways to walk through data.",
    "Use offset with Spring Data Pageable for admin screens and small data, and cursors for feeds, exports and large tables.",
    "Do not allow arbitrary sort or filter fields that miss indexes, return a total count on huge tables by default, or accept unlimited page sizes.",
    "Cap size (for example at 100), whitelist sortable and filterable fields backed by indexes, return next cursor or Link headers (rel=next), keep a deterministic tie-breaking sort such as created_at plus id, and document the defaults.",
    "Offset is simple and supports jumping to a page but is slow and unstable. Keyset is fast and stable but supports no random page access and needs an indexed, unique ordering.",
    "Alternatives are streaming responses, async export jobs for bulk data, and GraphQL connections (Relay style).",
    `GET /orders?status=PAID&sort=-createdAt&size=20&cursor=eyJjIjoiMjAyNi0wMS0wMVQxMDowMDowMFoiLCJpIjo5OTl9

HTTP/1.1 200 OK
Link: </orders?status=PAID&sort=-createdAt&size=20&cursor=abc123>; rel="next"

{"items":[ ... ],"nextCursor":"abc123"}

-- keyset query
SELECT * FROM orders
WHERE status = 'PAID' AND (created_at, id) < (:lastCreatedAt, :lastId)
ORDER BY created_at DESC, id DESC
LIMIT 20;`
  ],
  "Error Handling (Problem Details)": [
    "Return errors in a consistent machine-readable format: RFC 9457 Problem Details (media type application/problem+json) with type, title, status, detail and instance, plus extension fields such as validation errors and a trace id. Combine it with the correct HTTP status code.",
    "RFC 9457 obsoletes RFC 7807 and defines the standard members, and Spring 6 and Boot 3 provide the ProblemDetail class, ErrorResponse and optional spring.mvc.problemdetails.enabled=true for built-in exceptions.",
    "Ad-hoc error bodies force every client to parse each service differently, and stack traces leak internals.",
    "Use it across all endpoints, including validation, authentication and gateway-generated errors.",
    "Do not expose stack traces or SQL messages, put variable data in title (which should be stable), or return different error shapes per controller.",
    "Centralise handling in a @RestControllerAdvice extending ResponseEntityExceptionHandler, map domain exceptions to status codes, include a correlation or trace id from tracing context, localise detail messages if needed, and log server errors with the same id.",
    "A standard format eases client code and tooling, but you must keep the extension fields stable and documented.",
    "Alternatives are custom error envelopes, which are common but non-standard, and JSON:API error objects.",
    `@RestControllerAdvice
class ApiErrors extends ResponseEntityExceptionHandler {
    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail notFound(OrderNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Order not found");
        pd.setType(URI.create("https://api.example.com/problems/order-not-found"));
        pd.setProperty("traceId", MDC.get("traceId"));
        return pd;
    }
}

HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{"type":"https://api.example.com/problems/order-not-found","title":"Order not found","status":404,"detail":"No order 9f1c","traceId":"4bf92f3577b34da6"}`
  ],
  "Bulk and Partial Updates (PATCH)": [
    "PATCH applies a partial update using either JSON Merge Patch (RFC 7396, simple, null deletes a field) or JSON Patch (RFC 6902, an ordered list of operations). For bulk work, offer a dedicated batch endpoint that reports per-item results, for example with 207 Multi-Status.",
    "PUT replaces the whole resource, while PATCH sends only the changes. Merge Patch cannot express array element changes or setting a field to null explicitly, whereas JSON Patch can, with operations such as add, remove, replace, move, copy and test.",
    "Sending large resources for a one-field change wastes bandwidth and creates lost-update races, and clients often need to create or update many items per call.",
    "Use PATCH for form-like edits, and batch endpoints for imports, sync and reducing round trips on mobile.",
    "Do not treat PATCH as idempotent unless you design it so, apply a patch without validation, or build batch endpoints with all-or-nothing semantics that are hard to retry.",
    "Choose and document the patch media type, validate the result after applying, guard with If-Match and ETags, and for bulk define a size limit, per-item status and an idempotency key. Spring does not provide a built-in PATCH converter, so use a library or explicit DTOs with Optional fields.",
    "Partial updates save bandwidth but need careful semantics and validation. Batch endpoints cut latency but complicate error reporting and transactions.",
    "Alternatives are PUT with full representation, field-specific sub-resources (PUT /users/1/email), and async bulk jobs through 202 Accepted.",
    `PATCH /customers/42 HTTP/1.1
Content-Type: application/merge-patch+json
If-Match: "v7"

{"phone": "+1-555-0100", "nickname": null}

PATCH /customers/42 HTTP/1.1
Content-Type: application/json-patch+json

[
  { "op": "test", "path": "/status", "value": "ACTIVE" },
  { "op": "replace", "path": "/phone", "value": "+1-555-0100" }
]`
  ],
  "HTTP Caching and ETags": [
    "HTTP caching reduces latency and load using Cache-Control (max-age, no-store, no-cache, private, public), validators such as ETag and Last-Modified, and conditional requests with If-None-Match returning 304 Not Modified. The same ETag with If-Match gives optimistic concurrency for updates.",
    "A strong ETag is an opaque version identifier of a representation. A client sends If-None-Match, and the server replies 304 with no body when it matches. Vary tells caches which request headers change the response.",
    "Repeated reads of unchanged data waste bandwidth and compute, and concurrent writers can silently overwrite each other.",
    "Use it for read-heavy reference data and resources with stable versions, and use If-Match with 412 Precondition Failed or 428 Precondition Required for lost-update protection.",
    "Do not cache personalised or sensitive responses on shared caches (use private or no-store), and do not generate ETags that change on every request or ignore Vary.",
    "Set Cache-Control per endpoint, use ResponseEntity.eTag(...) or ShallowEtagHeaderFilter in Spring, derive ETags from a version column or hash, add stale-while-revalidate where acceptable, and test through a CDN.",
    "Caching cuts latency and cost, but stale data and invalidation are the risks. A shallow ETag filter saves bandwidth, not compute, because the response is still built.",
    "Alternatives are application caches (Redis, Caffeine), CDN rules, and server-pushed invalidation.",
    `GET /products/5 HTTP/1.1

HTTP/1.1 200 OK
ETag: "v12"
Cache-Control: max-age=60, must-revalidate

GET /products/5 HTTP/1.1
If-None-Match: "v12"

HTTP/1.1 304 Not Modified

PUT /products/5 HTTP/1.1
If-Match: "v11"

HTTP/1.1 412 Precondition Failed

@GetMapping("/products/{id}")
ResponseEntity<Product> get(@PathVariable long id) {
    Product p = service.find(id);
    return ResponseEntity.ok().eTag("\\"v" + p.version() + "\\"").cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS)).body(p);
}`
  ],
  "Idempotency Keys": [
    "An idempotency key is a client-generated unique value, sent in an Idempotency-Key header on POST, that lets the server recognise a retry and return the original result instead of repeating the operation. It is essential for payments and order creation.",
    "The server stores the key with a fingerprint of the request and the stored response. A repeat with the same key and payload returns the saved response, a repeat while the first is in flight gets 409 or waits, and the same key with a different payload is rejected with an error such as 422.",
    "A timeout leaves the client unsure whether the request ran, and blind retries create duplicate charges or orders.",
    "Use it on non-idempotent creating or charging endpoints, and in client SDKs that retry automatically.",
    "Do not use it where PUT or a natural unique constraint already gives idempotency, or keep keys forever without a TTL.",
    "Have clients send a UUID per logical operation, store key, request hash, status and response in a database table with a unique constraint on (client, key), process within one transaction, expire after 24 to 48 hours, and document behaviour. The IETF httpapi working group is standardising the header.",
    "It makes retries safe, but requires extra storage and care with concurrency and partial failures.",
    "Alternatives are natural business keys with unique constraints, conditional updates with ETags, and server-side deduplication on a message id.",
    `POST /payments HTTP/1.1
Idempotency-Key: 6f1c0b52-3a64-4f0e-9a86-0d2f2a7c1111
Content-Type: application/json

{"orderId":"9f1c","amount":2500,"currency":"USD"}

-- storage
CREATE TABLE idempotency_record (
  client_id VARCHAR(64) NOT NULL,
  idem_key  VARCHAR(64) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL,
  response_body TEXT,
  created_at TIMESTAMP NOT NULL,
  PRIMARY KEY (client_id, idem_key)
);`
  ],
  "Rate Limiting Headers": [
    "Rate limiting protects an API from overload and abuse, and well-behaved APIs tell clients their budget: return 429 Too Many Requests with a Retry-After header, and expose limit, remaining and reset values. The IETF draft RateLimit headers standardise the names, while X-RateLimit-* is the common convention.",
    "Common algorithms are fixed window, sliding window, token bucket and leaky bucket, applied per API key, user, IP or tenant. Retry-After carries seconds or an HTTP date.",
    "Without limits one client can starve others, and without headers clients retry blindly and make overload worse.",
    "Use it at the gateway and on expensive endpoints, with separate quotas per plan and stricter limits on login or search.",
    "Do not rate limit only by IP behind shared NATs, return 5xx instead of 429, or apply the same limit to cheap and expensive operations.",
    "Implement the limiter at the gateway (Spring Cloud Gateway RequestRateLimiter with Redis, Envoy, Kong) or with Bucket4j, return the headers on every response, and have clients back off with jitter honouring Retry-After.",
    "Limits protect capacity but can reject legitimate bursts, and distributed counters add latency and a Redis dependency.",
    "Alternatives are load shedding, concurrency limits, quotas per billing period, and queue-based backpressure.",
    `HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 30
Content-Type: application/problem+json

{"type":"https://api.example.com/problems/rate-limited","title":"Too many requests","status":429}`
  ],
  "Long-Running Operations (202 Accepted)": [
    "For work that takes longer than a normal request, return 202 Accepted immediately with a Location header pointing to a status resource, and let the client poll it (or receive a webhook) until the operation completes. Avoid holding an HTTP connection open for minutes.",
    "The status resource reports states such as PENDING, RUNNING, SUCCEEDED or FAILED, optionally with progress and a Retry-After hint. On completion it links to the result, or the server redirects with 303 See Other.",
    "Long synchronous requests hit gateway and client timeouts, tie up threads and cannot survive restarts.",
    "Use it for exports, video processing, bulk imports, report generation and any workflow triggered by an API call.",
    "Do not use it for operations that complete in milliseconds, and do not forget how clients cancel the job and how long results are retained.",
    "Persist the job and enqueue it for workers, return 202 plus Location, support GET status with Retry-After, DELETE for cancel, and idempotency keys on creation. Offer a callback or webhook for completion, and expire old jobs.",
    "It is robust and scalable, but clients must handle polling and eventual completion, and the server needs job storage.",
    "Alternatives are webhooks, WebSockets or server-sent events for progress, and message-based request-reply.",
    `POST /reports HTTP/1.1
Content-Type: application/json

{"type":"monthly-sales","month":"2026-03"}

HTTP/1.1 202 Accepted
Location: /reports/jobs/881
Retry-After: 5

GET /reports/jobs/881

HTTP/1.1 200 OK
{"id":881,"status":"RUNNING","progress":40}

HTTP/1.1 303 See Other
Location: /reports/5503`
  ],
  "Webhooks": [
    "A webhook is an HTTP callback the provider sends to a consumer-registered URL when an event occurs, so consumers need not poll. Make them reliable with signed payloads, retries with exponential backoff, unique event ids for deduplication, and fast 2xx responses.",
    "The provider POSTs a JSON event to the subscriber endpoint, signs the body with an HMAC-SHA256 using a shared secret and includes a timestamp, and the receiver verifies the signature and rejects stale timestamps to prevent replay.",
    "Polling wastes resources and adds latency, while push notifications give near-real-time integration across organisations.",
    "Use them for third-party integrations, payment and delivery status updates, and long-running job completion.",
    "Do not send huge payloads, call internal endpoints (SSRF risk when users supply URLs), or depend on delivery order or exactly-once delivery.",
    "On the sender: allow-list URLs and block private addresses, sign requests, retry for hours with backoff, and offer an event log and manual replay. On the receiver: verify the signature with a constant-time comparison, store the event id, return 2xx quickly and process asynchronously.",
    "Webhooks are efficient and timely, but delivery is at-least-once, consumers must expose endpoints, and debugging across organisations is harder.",
    "Alternatives are polling, server-sent events, WebSockets and message brokers or event streams for internal consumers.",
    `POST /hooks/orders HTTP/1.1
Content-Type: application/json
Webhook-Id: evt_01HX9
Webhook-Timestamp: 1767225600
Webhook-Signature: v1,Zm9vYmFyLXBsYWNlaG9sZGVyLXNpZw==

{"type":"order.paid","data":{"orderId":"9f1c"}}

// verify (Java)
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret, "HmacSHA256"));
byte[] expected = mac.doFinal((id + "." + timestamp + "." + body).getBytes(StandardCharsets.UTF_8));
boolean ok = MessageDigest.isEqual(expected, providedSignature);`
  ],
  "REST vs GraphQL vs gRPC": [
    "REST is resource-oriented over HTTP with strong caching and tooling and suits public APIs. GraphQL lets clients choose fields from one endpoint, which suits varied frontends, and gRPC uses Protobuf over HTTP/2 for fast, typed, streaming service-to-service calls.",
    "REST returns fixed representations per URI. GraphQL exposes a typed schema and executes client queries, resolved field by field. gRPC generates clients and servers from .proto files and supports unary and streaming calls, with deadlines.",
    "Different consumers need different trade-offs between simplicity, flexibility and performance.",
    "Use REST for public and partner APIs and simple CRUD, GraphQL for aggregating many backends behind a BFF for web and mobile clients, and gRPC for internal low-latency microservice calls and streaming.",
    "Do not use GraphQL without query depth and complexity limits, DataLoader batching and persisted queries, or gRPC directly from browsers without gRPC-web, or for public APIs where curl-friendliness matters.",
    "Choose by consumer: expose REST at the edge, gRPC internally where latency and contracts matter, and GraphQL for aggregation. Watch for N+1 resolvers in GraphQL and set gRPC deadlines, retries and load balancing for HTTP/2.",
    "REST is simple and cacheable but can over- or under-fetch. GraphQL gives flexible queries but complicates caching, authorisation and performance. gRPC is efficient but binary, less debuggable and has limited browser support.",
    "Alternatives are JSON-RPC, SOAP in legacy settings, WebSockets or SSE for push, and message brokers for async integration.",
    `# REST
GET /orders/9f1c

# GraphQL
POST /graphql
{ "query": "{ order(id: \\"9f1c\\") { id status customer { name } } }" }

// gRPC
service OrderService {
  rpc GetOrder (GetOrderRequest) returns (Order);
  rpc WatchOrders (WatchRequest) returns (stream Order);
}`
  ],
  "API Authentication Methods": [
    "Common API authentication methods are API keys, HTTP Basic, bearer tokens (JWT access tokens issued through OAuth 2.0 and OpenID Connect), mutual TLS and signed requests (HMAC). For user-facing flows use the OAuth2 authorization code flow with PKCE, and for service-to-service use client credentials or mTLS.",
    "OAuth 2.0 issues short-lived access tokens, and resource servers validate them either as signed JWTs (checking signature, issuer, audience and expiry) or by introspection. API keys identify an application but carry no user identity, and mTLS authenticates clients by certificate.",
    "APIs need to know who is calling and what they may do, and a wrong choice leaks credentials or blocks integration.",
    "Use OAuth2 with JWTs for user and partner APIs, API keys with rate limits for simple server clients, mTLS inside a zero-trust network and HMAC for webhook signatures.",
    "Do not use Basic auth over plain HTTP, put tokens in URLs, rely on long-lived static keys without rotation, or use the implicit flow, which is deprecated.",
    "Terminate TLS everywhere, configure Spring Security oauth2ResourceServer with a JWT decoder (issuer-uri), validate audience and scopes, keep access tokens short-lived with refresh tokens, store secrets in a vault, and apply least-privilege scopes.",
    "JWTs scale without a lookup but cannot be revoked easily before expiry. Opaque tokens with introspection revoke instantly but add a network call. API keys are simple but weak.",
    "Alternatives are session cookies for browser apps, SAML in enterprise single sign-on, and gateway-managed authentication with token exchange.",
    `@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(a -> a
            .requestMatchers(HttpMethod.GET, "/orders/**").hasAuthority("SCOPE_orders.read")
            .requestMatchers(HttpMethod.POST, "/orders/**").hasAuthority("SCOPE_orders.write")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
    return http.build();
}

# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com/realms/demo`
  ],
  "API Gateway Concerns": [
    "An API gateway is the single entry point that handles cross-cutting concerns for backend services: routing, TLS termination, authentication, rate limiting, request validation, caching, observability and sometimes aggregation. Keep business logic out of it.",
    "It sits between clients and services, applying policies such as JWT validation, quotas, CORS, header transformation and circuit breaking. Examples are Spring Cloud Gateway, Kong, Envoy-based gateways and managed cloud gateways.",
    "Without a gateway every service must reimplement security, throttling and routing, and clients must know internal topology.",
    "Use it when many services are exposed to external clients, or when you need central policy, versioned routing and monitoring.",
    "Do not turn the gateway into a monolithic orchestration layer with business rules, or make it a single point of failure without redundancy.",
    "Run it highly available behind a load balancer, keep routes declarative, validate tokens and apply coarse authorisation at the edge, forward trace context, set timeouts and retries per route, and use a BFF per client type for aggregation.",
    "Central control and simpler services, but an extra hop, an additional component to operate, and a risk of becoming a bottleneck or a team dependency.",
    "Alternatives are a service mesh for east-west traffic, direct service exposure with shared libraries, and a BFF layer.",
    `spring:
  cloud:
    gateway:
      routes:
        - id: orders
          uri: lb://orders-service
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 20
                redis-rate-limiter.burstCapacity: 40
            - name: CircuitBreaker
              args:
                name: ordersCb`
  ]
};
