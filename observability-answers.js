// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Logs, Metrics and Traces": [
    "Logs are timestamped records of discrete events, metrics are numeric time series aggregated over time, and traces follow one request across services as a tree of spans. Metrics tell you that something is wrong, traces show where, and logs explain why.",
    "Metrics are cheap and good for alerting and trends (counters, gauges, histograms). Logs carry rich context but cost more to store and search. A trace is a set of spans sharing a trace id, with parent-child links and timing.",
    "Distributed systems fail in ways no single signal reveals, and without all three you cannot move from a symptom to a root cause quickly.",
    "Use metrics for dashboards and alerts, traces for latency and dependency analysis across services, and logs for detailed debugging of specific events. Link them with the trace id.",
    "Do not rely on logs alone for alerting, do not trace everything at full volume without sampling, and do not treat the three signals as separate silos.",
    "In Spring Boot 3 use Micrometer for metrics and tracing (micrometer-tracing-bridge-otel), export through OTLP to a collector, put traceId and spanId into the logging MDC, and use exemplars to jump from a latency metric to a trace.",
    "Metrics are cheap but lose detail, logs are detailed but expensive, and traces show causality but need sampling and propagation across every hop.",
    "Alternatives are an all-in-one APM (Datadog, New Relic, Dynatrace), the Grafana stack (Prometheus, Loki, Tempo) and the Elastic stack, and profiles are often called the fourth signal.",
    `# application.yml (Spring Boot 3.x)
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
  tracing:
    sampling:
      probability: 0.1
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces
logging:
  pattern:
    correlation: "[%X{traceId:-},%X{spanId:-}] "`
  ],
  "Structured Logging Best Practices": [
    "Emit logs as structured JSON with consistent field names, including timestamp, level, service, environment, traceId, spanId and a stable message, so they can be filtered and aggregated by machine. Never log secrets or personal data.",
    "Instead of free text such as 'user 42 failed', log a fixed message with key-value fields (userId, orderId, durationMs). Spring Boot 3.4 supports structured console logging through logging.structured.format.console (ecs, logstash or gelf), and logstash-logback-encoder does the same on earlier versions.",
    "Grepping unstructured text does not scale, and inconsistent formats make dashboards and alerts brittle.",
    "Apply it to every service in a system that ships logs to a central platform.",
    "Do not log at DEBUG in production by default, log full request bodies with sensitive data, log inside tight loops, or use logs as a substitute for metrics.",
    "Use SLF4J with a JSON encoder, put request-scoped data into MDC, propagate a correlation id, mask sensitive fields, log exceptions once with the stack trace at the boundary, use levels consistently, and write to stdout so the platform collects them.",
    "Structured logs are searchable and cheap to query but larger on disk, and the field schema needs governance across teams.",
    "Alternatives are plain text with grok parsing, which is brittle, and emitting events directly through OpenTelemetry logs.",
    `<!-- logback-spring.xml -->
<configuration>
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <includeMdcKeyName>traceId</includeMdcKeyName>
      <includeMdcKeyName>spanId</includeMdcKeyName>
      <customFields>{"service":"orders","env":"prod"}</customFields>
    </encoder>
  </appender>
  <root level="INFO"><appender-ref ref="JSON"/></root>
</configuration>

// Java
log.atInfo().addKeyValue("orderId", id).addKeyValue("durationMs", ms).log("order placed");`
  ],
  "Golden Signals, RED and USE Methods": [
    "The four golden signals (latency, traffic, errors, saturation) come from Google SRE. RED (rate, errors, duration) is for request-driven services, and USE (utilisation, saturation, errors) is for resources such as CPU, memory, disks and connection pools.",
    "Latency should separate successful from failed requests and be read as percentiles. Saturation measures how full a resource is, such as queue depth or thread pool usage. RED suits microservices, USE suits hosts and infrastructure.",
    "They give a short checklist that covers most failure modes so you do not drown in hundreds of metrics.",
    "Build one RED dashboard per service and one USE view per resource, and base alerts and SLOs on those signals.",
    "Do not alert on every USE metric such as CPU above 80 percent without evidence of user impact, and do not use averages for latency.",
    "Expose http.server.requests as a Micrometer timer with percentile histograms, track thread pool, connection pool and queue saturation, and query with PromQL using rate and histogram_quantile.",
    "A small standard set is easy to adopt and compare, but it may miss business-level problems that need custom metrics.",
    "Alternatives are business KPIs as SLIs, SLO-first dashboards and vendor APM defaults.",
    `# Rate
sum(rate(http_server_requests_seconds_count{application="orders"}[5m]))

# Errors (ratio)
sum(rate(http_server_requests_seconds_count{application="orders",status=~"5.."}[5m]))
  / sum(rate(http_server_requests_seconds_count{application="orders"}[5m]))

# Duration (p99)
histogram_quantile(0.99, sum by (le) (rate(http_server_requests_seconds_bucket{application="orders"}[5m])))

# Saturation (Hikari pool)
hikaricp_connections_active / hikaricp_connections_max`
  ],
  "Distributed Tracing with OpenTelemetry": [
    "OpenTelemetry is the vendor-neutral standard for generating traces, metrics and logs. Services create spans, propagate context in the W3C traceparent header, and export through OTLP to a Collector that processes and forwards data to a backend such as Jaeger, Tempo or a commercial APM.",
    "A trace is a tree of spans, each with a name, timing, attributes and status. Auto-instrumentation through the Java agent or Spring Boot starters creates spans for HTTP, JDBC and messaging, and the Collector applies receivers, processors (batch, tail sampling, attribute filtering) and exporters.",
    "In a microservice call chain, per-service logs cannot show where the time went, and proprietary agents cause vendor lock-in.",
    "Use it for any multi-service system, to find latency bottlenecks, error propagation and unexpected dependencies.",
    "Do not sample 100 percent of high-volume traffic without a cost plan, put personal data in span attributes, or break context propagation through async handoffs and message headers.",
    "Attach the OTel Java agent or use micrometer-tracing-bridge-otel with opentelemetry-exporter-otlp, set service.name, pick head sampling in the SDK or tail sampling in the Collector so errors and slow traces are kept, propagate context through Kafka and executor threads, and add custom spans for key business operations.",
    "Open standard and rich insight, but extra overhead, storage cost and effort to keep propagation intact. Tail sampling needs a stateful Collector tier.",
    "Alternatives are vendor agents, Zipkin or Jaeger client libraries, Spring Cloud Sleuth (retired in Spring Boot 3, replaced by Micrometer Tracing) and service-mesh tracing.",
    `# Run with the agent
java -javaagent:opentelemetry-javaagent.jar -Dotel.service.name=orders -Dotel.exporter.otlp.endpoint=http://otel-collector:4317 -jar app.jar

# Collector config
receivers:
  otlp:
    protocols: { grpc: {}, http: {} }
processors:
  batch: {}
  tail_sampling:
    decision_wait: 10s
    policies:
      - { name: errors, type: status_code, status_code: { status_codes: [ERROR] } }
      - { name: slow, type: latency, latency: { threshold_ms: 1000 } }
      - { name: baseline, type: probabilistic, probabilistic: { sampling_percentage: 5 } }
exporters:
  otlp/tempo:
    endpoint: tempo:4317
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [tail_sampling, batch]
      exporters: [otlp/tempo]`
  ],
  "Cardinality and Cost Control": [
    "Cardinality is the number of unique label combinations, and every combination is a separate time series that costs memory and storage. Never use unbounded values such as user id, request id, email or raw URL paths as metric labels.",
    "A metric with labels method, status and route might have a few hundred series, but adding userId multiplies it by millions. High-cardinality data belongs in logs and traces, not in metric labels.",
    "Cardinality explosions slow or crash Prometheus, inflate vendor bills and make queries slow.",
    "Review it when adding metrics or labels, when a monitoring bill spikes, or when Prometheus memory grows.",
    "Do not drop useful dimensions blindly, and do not use full URIs with path variables as labels.",
    "Use route templates (/orders/{id}) not concrete paths, whitelist label values, set limits (Prometheus sample_limit and label_limit), drop labels and metrics through relabeling, use recording rules for expensive queries, sample traces, set log retention tiers and drop noisy debug logs at the Collector.",
    "Lower cost and better performance, but less granularity, and wrongly dropped labels can hide the dimension needed during an incident.",
    "Alternatives are exemplars to link a few traces to metrics, event-based analytics stores for high-cardinality data, and downsampling for long-term retention.",
    `# Find the worst offenders in Prometheus
topk(10, count by (__name__) ({__name__=~".+"}))

# prometheus.yml: drop a risky label and cap series per scrape
scrape_configs:
  - job_name: orders
    sample_limit: 50000
    metric_relabel_configs:
      - action: labeldrop
        regex: user_id|request_id`
  ],
  "SLIs, SLOs and Error Budgets": [
    "An SLI is a measured indicator (for example the share of requests that succeed under 300 ms), an SLO is the target for it over a window (99.9 percent over 30 days), and the error budget is the allowed failure (0.1 percent, about 43 minutes a month). When the budget is burned, feature work yields to reliability work.",
    "SLIs are ratios of good events to valid events, measured from the user's perspective, such as availability, latency and freshness. An SLA is the external contract, usually looser than the internal SLO.",
    "Without a shared target, reliability debates are opinion-driven, and teams either over-invest in uptime or ship recklessly.",
    "Define SLOs for each user-facing journey, report budget consumption, and use burn-rate alerts to page.",
    "Do not set 100 percent targets, pick SLIs the user does not feel (such as CPU), or define too many SLOs per service.",
    "Choose two or three SLIs per service, record them with Prometheus recording rules, alert on multi-window burn rate (for example 14.4x over 1 hour and 5 minutes pages, 6x over 6 hours and 30 minutes pages, 1x over 3 days opens a ticket), and review them quarterly.",
    "Clear objective trade-offs and fewer noisy alerts, but they need good measurement and organisational buy-in on the budget policy.",
    "Alternatives are threshold alerting on raw metrics, Apdex scores and uptime-only monitoring.",
    `# SLI: ratio of non-5xx requests, 5-minute window
sum(rate(http_server_requests_seconds_count{application="orders",status!~"5.."}[5m]))
  / sum(rate(http_server_requests_seconds_count{application="orders"}[5m]))

# Error budget for 99.9% over 30 days
# 0.001 * 30 * 24 * 60 = 43.2 minutes

# Burn rate = observed error ratio / allowed error ratio (0.001)
# 14.4x burn for 1h consumes 2% of a 30-day budget`
  ],
  "Alerting Best Practices": [
    "Alert on symptoms that users feel (error rate, latency, SLO burn) rather than causes, make every page actionable with a runbook, and route by severity. Too many alerts cause fatigue, so each alert must justify waking someone.",
    "Prometheus evaluates alert rules with a for duration to avoid flapping, and Alertmanager groups, deduplicates, routes, silences and inhibits notifications. Pages go to on-call, and lower severity goes to tickets or chat.",
    "Noisy or non-actionable alerts get ignored, and missed alerts cause long outages.",
    "Use burn-rate alerts for SLOs, a small set of symptom alerts per service, and cause-based alerts only for predictable failures such as disk fill or certificate expiry.",
    "Do not page on CPU, a single pod restart or any condition with no action, and do not leave alerts without owners or runbooks.",
    "Write alerts with severity, summary, runbook_url and dashboard links, use a for duration, group related alerts, add inhibition rules so a down cluster does not page for every service, review alert quality after incidents, and delete alerts nobody acts on.",
    "Symptom alerts reduce noise but give less hint about the cause, while cause alerts are precise but numerous and brittle.",
    "Alternatives are anomaly detection, SLO platforms (Sloth, Pyrra), and managed alerting in vendor tools.",
    `groups:
  - name: orders-slo
    rules:
      - alert: OrdersHighErrorBudgetBurn
        expr: |
          (sum(rate(http_server_requests_seconds_count{application="orders",status=~"5.."}[1h]))
            / sum(rate(http_server_requests_seconds_count{application="orders"}[1h]))) > (14.4 * 0.001)
          and
          (sum(rate(http_server_requests_seconds_count{application="orders",status=~"5.."}[5m]))
            / sum(rate(http_server_requests_seconds_count{application="orders"}[5m]))) > (14.4 * 0.001)
        for: 2m
        labels:
          severity: page
        annotations:
          summary: Orders API is burning its error budget 14x too fast
          runbook_url: https://runbooks.example.com/orders/high-error-rate`
  ],
  "Dashboards That Help": [
    "A useful dashboard answers a specific question quickly: a top-level service overview with RED metrics and SLO status, with drill-downs by dependency, instance and endpoint. Fewer, well-organised panels beat walls of graphs.",
    "Good dashboards follow a hierarchy (overview, service, component), use consistent layouts and units, show percentiles rather than averages, mark deployments and incidents as annotations, and link to logs and traces.",
    "During an incident, people need to see the state of the system in seconds, and cluttered dashboards slow diagnosis.",
    "Build them per service and per audience: on-call overview, capacity view and business KPI view.",
    "Do not add every available metric, rely on averages, use dashboards as alerting, or leave stale dashboards that nobody owns.",
    "Template with variables (environment, service, instance), put the golden signals first, add SLO burn panels, annotate deploys, link each panel to related logs or traces, and keep dashboards as code (Grafana provisioning or Jsonnet) in version control.",
    "Dashboards give fast situational awareness but require maintenance, and they only answer questions someone anticipated.",
    "Alternatives are ad-hoc exploration (Grafana Explore, PromQL), notebook-style investigation, and AI-assisted incident tooling.",
    `# Typical on-call overview rows
1. SLO status and error budget remaining
2. Request rate, error ratio, p50/p95/p99 latency
3. Saturation: CPU, memory, JVM heap, GC pause, thread pool, DB connection pool
4. Dependencies: downstream latency and error rate
5. Deployment annotations and recent alerts`
  ],
  "Synthetic Monitoring": [
    "Synthetic monitoring runs scripted probes (HTTP checks or full user journeys) from outside against production at fixed intervals, to detect outages and regressions before real users report them. It measures availability and latency independent of real traffic.",
    "Probes can be simple HTTP or TCP checks (Prometheus Blackbox Exporter), or multi-step browser or API scripts (Grafana k6, Playwright, CloudWatch Synthetics), run from several regions. Results feed alerts and SLIs.",
    "Real-user metrics are silent when there is no traffic, such as at night or after an edge or DNS failure, and internal metrics miss problems in the network path.",
    "Use it for critical journeys such as login and checkout, for third-party dependency checks, certificate expiry, and for new regions or low-traffic services.",
    "Do not use it instead of real-user monitoring, run probes that create real orders or pollute data, or alert on a single failing probe location.",
    "Probe from multiple locations, use dedicated test accounts and mark synthetic traffic with a header, assert on content and latency, require several consecutive failures before paging, and keep the scripts in version control.",
    "Early, consistent detection of outages, but limited coverage of real behaviour, extra test data hygiene and some cost.",
    "Alternatives are real-user monitoring (RUM), canary deployments with automated analysis, and health endpoints probed by the load balancer.",
    `# Prometheus Blackbox Exporter module
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: [200]
      method: GET
      fail_if_body_not_matches_regexp: ["status.*UP"]

# Alert on probe failure from at least two locations
- alert: CheckoutProbeFailing
  expr: count(probe_success{job="checkout-probe"} == 0) >= 2
  for: 3m`
  ],
  "Debugging a Production Incident": [
    "Mitigate first, diagnose second: stop user impact with a rollback, a feature flag, scaling or failover, then find the cause using the golden signals, recent changes, traces and logs. Form hypotheses and test them one at a time, and keep notes on a timeline.",
    "Typical flow is to confirm impact and scope, check what changed (deployments, config, traffic, dependencies), look at RED and saturation metrics, follow a slow trace to the failing span, then read correlated logs. For JVM issues use thread dumps, heap dumps, GC logs and a profiler.",
    "Under pressure, people guess and change several things at once, which prolongs outages and destroys evidence.",
    "Use it for any on-call situation, and practise it in game days.",
    "Do not restart everything before capturing evidence, make unreviewed changes in production, or debug in silence without telling the incident channel.",
    "Declare an incident, assign roles, roll back the last change if it correlates, compare against a healthy period, capture jstack or jcmd Thread.print, heap dumps and async-profiler samples before restarting a bad pod, check connection pools and dependency latency, and record every action with times.",
    "Mitigation-first minimises impact but can obscure the cause, so capture evidence first when it is cheap and safe.",
    "Alternatives are feature flags and canary rollouts that make rollback instant, and observability platforms with automatic change correlation.",
    `# Capture JVM evidence from a misbehaving pod before restarting it
kubectl exec orders-7d9f -- jcmd 1 Thread.print > threads.txt
kubectl exec orders-7d9f -- jcmd 1 GC.heap_dump /tmp/heap.hprof
kubectl exec orders-7d9f -- jcmd 1 VM.flags

# Find recent changes
kubectl rollout history deployment/orders
kubectl rollout undo deployment/orders`
  ],
  "Incident Response and On-Call": [
    "Good incident response has defined roles (incident commander, operations lead, communications lead), severity levels, a single coordination channel, regular status updates and escalation paths. Sustainable on-call needs rotations, runbooks, fair load and a low-noise alert set.",
    "The incident commander coordinates and decides but does not debug, the ops lead investigates, and the comms lead updates stakeholders and the status page. Severity (SEV1 to SEV4) sets response urgency and who gets involved.",
    "Unstructured response causes duplicated work, confusion over who decides, and poor communication.",
    "Use it for every customer-impacting incident, with lighter process for small ones.",
    "Do not make heroes of individuals, keep the same people on call without rest, or page for non-actionable conditions.",
    "Define on-call rotations with primary and secondary, follow-the-sun if possible, keep runbooks next to alerts, use a paging tool (PagerDuty or Opsgenie), declare incidents early, set update intervals, and hold handover notes. Measure MTTD, MTTA and MTTR and the page volume per shift.",
    "Structure speeds recovery and protects people, but process has overhead for small incidents, and on-call has a real human cost that must be managed.",
    "Alternatives are best-effort support for internal tools, a dedicated SRE team, and vendor-managed operations.",
    `Severity guide (example)
SEV1: major outage or data loss, page immediately, updates every 15 minutes
SEV2: significant degradation, page, updates every 30 minutes
SEV3: minor impact, handle in business hours
SEV4: no user impact, ticket

Roles: Incident Commander | Ops Lead | Communications Lead | Scribe`
  ],
  "Blameless Postmortems": [
    "A blameless postmortem reviews an incident to understand how the system and process allowed it, focusing on contributing factors and learning rather than on who made a mistake. It ends with owned, dated action items that actually get done.",
    "It contains a summary, impact, a precise timeline, root and contributing causes (for example found through five whys), detection and response analysis, what went well, what went badly, and follow-up actions.",
    "If people fear blame they hide information, and then the same failures repeat.",
    "Write one for every significant incident or near miss, and share it widely.",
    "Do not use it for performance management, stop at human error as the cause, or write one and leave the action items unowned.",
    "Hold the review within a few days, draft the timeline from logs, chat and metrics, ask how-and-why questions, classify actions as prevent, detect or mitigate, assign owners and due dates in the tracker, and review completion in a regular reliability meeting.",
    "Learning improves reliability and trust, but the process takes time, and it fails if leadership punishes honesty or ignores action items.",
    "Alternatives are lightweight incident notes for minor events, and formal root cause analysis methods such as fault tree analysis for safety-critical systems.",
    `Title: Orders API elevated errors (SEV2)
Impact: 22% of checkout requests failed for 38 minutes
Timeline (UTC): 10:02 deploy v1.84 | 10:09 alert fired | 10:14 incident declared | 10:40 rollback complete
Contributing factors: connection pool size not updated for new query pattern; no canary stage
What went well: alert fired within 7 minutes; rollback was one command
Actions: add pool saturation alert (owner A, due next sprint); enable canary releases (owner B, due Q+1)`
  ],
  "Log Aggregation Stack (ELK, Loki)": [
    "A log aggregation stack collects logs from all instances into one searchable place. ELK/EFK (Elasticsearch, Logstash or Fluentd, Kibana, with Beats) indexes full text for powerful search, while Grafana Loki indexes only labels and stores compressed chunks in object storage, which is far cheaper.",
    "Agents (Filebeat, Fluent Bit, Grafana Alloy) tail container stdout and ship logs, optionally through Logstash for parsing. Elasticsearch stores inverted indexes with index lifecycle management (hot, warm, delete). Loki queries with LogQL by label selectors and then filters the lines.",
    "Logs scattered across ephemeral containers disappear with the pods and cannot be searched together.",
    "Use ELK for heavy full-text search and analytics, and Loki when you mostly query by service and time and already use Grafana and Prometheus.",
    "Do not index everything forever in Elasticsearch, use high-cardinality values as Loki labels, or ship unstructured logs without parsing and retention policies.",
    "Log JSON to stdout, run a node-level agent as a DaemonSet, enrich with Kubernetes metadata, keep a small label set in Loki, define retention and ILM, set per-tenant rate limits, and mask sensitive fields before shipping.",
    "Elasticsearch gives rich search at higher storage and operations cost, and Loki is cheap and simple but slower for arbitrary full-text queries.",
    "Alternatives are managed services (OpenSearch Service, Splunk, Datadog Logs, CloudWatch Logs) and OpenTelemetry Collector pipelines to any backend.",
    `# LogQL: errors for the orders service with a trace id
{app="orders", env="prod"} |= "ERROR" | json | traceId="4bf92f3577b34da6a3ce929d0e0e4736"

# LogQL: error rate per minute
sum(rate({app="orders"} |= "ERROR" [1m]))`
  ],
  "Continuous Profiling": [
    "Continuous profiling samples CPU, memory and lock activity in production all the time at low overhead, and stores flame graphs over time so you can see which code paths consume resources and what changed after a deploy. On the JVM the sources are Java Flight Recorder and async-profiler.",
    "A sampling profiler periodically captures stack traces, usually 1 to 5 percent overhead, and a backend (Grafana Pyroscope, Parca, or vendor tools) aggregates them into flame graphs that can be compared between time ranges and linked to traces by span id.",
    "Metrics show that CPU or latency rose, but not which function is responsible, and reproducing production load locally is hard.",
    "Use it to find CPU hotspots, allocation pressure, lock contention and regressions after releases, and to cut cloud cost.",
    "Do not profile with high-overhead settings in production, or expect it to explain slowness caused by waiting on I/O unless wall-clock profiling is enabled.",
    "Run async-profiler or JFR as an agent (for example Pyroscope Java agent), label profiles with service and version, compare before and after a release, use wall-clock mode for I/O waits, and correlate with traces.",
    "Deep code-level insight with low overhead, but extra infrastructure and storage, and interpretation skill is needed.",
    "Alternatives are on-demand profiling with jcmd JFR.start or async-profiler during an incident, APM transaction traces and benchmark-based profiling in CI.",
    `# Start a 60-second JFR recording on a running JVM
jcmd <pid> JFR.start name=prod duration=60s filename=/tmp/prod.jfr settings=profile

# async-profiler flame graph, CPU for 30 seconds
asprof -d 30 -e cpu -f /tmp/flame.html <pid>

# Continuous: Pyroscope Java agent
java -javaagent:pyroscope.jar -Dpyroscope.application.name=orders -Dpyroscope.server.address=http://pyroscope:4040 -jar app.jar`
  ],
  "Chaos Engineering": [
    "Chaos engineering deliberately injects failures (killed pods, latency, dependency outages) into a system in a controlled way to verify that it behaves as expected and to find weaknesses before real incidents do. It starts with a steady-state hypothesis and a small blast radius.",
    "Experiments follow a loop: define normal behaviour through SLIs, form a hypothesis, inject a fault, observe, and fix what breaks. Tools include Chaos Mesh, LitmusChaos, Gremlin, AWS Fault Injection Service and Chaos Monkey.",
    "Redundancy, retries, timeouts and failover are only trustworthy if they are exercised, and many failures are discovered only in production.",
    "Use it once you have monitoring, SLOs and basic resilience patterns (timeouts, retries, circuit breakers), in game days or automated steady-state experiments.",
    "Do not run it without observability, abort criteria or approval, or in systems that already fail regularly, where fixing basics is the priority.",
    "Begin in staging, then small production experiments, write the hypothesis and abort conditions, limit the blast radius to a small share of traffic, run during working hours with the team present, and turn findings into fixes such as Resilience4j timeouts or bulkheads.",
    "Builds confidence and uncovers hidden coupling, but needs maturity, careful safety controls and organisational support.",
    "Alternatives are load and failure testing in staging, game-day tabletop exercises, and fault injection through a service mesh such as Istio.",
    `apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: kill-one-orders-pod
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces: [staging]
    labelSelectors:
      app: orders
  duration: 60s

# Hypothesis: killing one of 3 pods keeps the error ratio under 1% and p99 under 500 ms`
  ]
};
