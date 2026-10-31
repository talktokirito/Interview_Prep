// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives]
const SERVICE_ANSWERS = {
  "Compute Engine": [
    "Compute Engine is GCP's VM service. I pick machine families by workload, use custom machine types, managed instance groups for autoscaling and service accounts instead of keys, and Spot VMs for fault-tolerant work.",
    "Virtual machines with persistent disks in a VPC, grouped into instance groups behind load balancers.",
    "Owning hardware is slow and rigid.",
    "OS-level control, licensed software, lift-and-shift, special hardware.",
    "Stateless services better served by Cloud Run or GKE.",
    "Choose a machine type, create an instance template, run a managed instance group with autoscaling and a health check behind a load balancer, and set the JVM heap to the VM memory.",
    "Pros: control, custom sizing, sustained use discounts. Cons: you patch and scale it.",
    "Cloud Run, GKE (less ops), App Engine."
  ],
  "Cloud Run": [
    "Cloud Run runs stateless containers serverlessly with scale to zero. My default for Spring Boot on GCP: ship a container, tune concurrency and minimum instances, and speed up startup.",
    "A managed container platform billed by request time, built on Knative.",
    "Cluster management is heavy for simple services.",
    "HTTP services, APIs, event handlers, background jobs.",
    "Stateful workloads, long-lived connections, or workloads needing host access.",
    "Build the image, deploy with gcloud run deploy, set CPU, memory, concurrency and min instances, use a service account, and connect to Cloud SQL via the connector.",
    "Pros: simple, scales to zero. Cons: cold starts, request timeout limits, stateless only.",
    "GKE (more control), Cloud Functions, App Engine, Lambda or Fargate."
  ],
  "Cloud Functions": [
    "Cloud Functions is event-driven serverless code, now part of the Cloud Run functions family. Good for glue tasks; JVM cold start is the main concern.",
    "Functions triggered by HTTP, Pub/Sub or storage events.",
    "Small handlers do not justify servers.",
    "Event handlers and small integrations.",
    "Large apps or long-running work.",
    "Write a function with the Java Functions Framework, deploy with a trigger, and set memory and concurrency.",
    "Pros: simple. Cons: cold starts, limits.",
    "Cloud Run, Lambda, Azure Functions."
  ],
  "App Engine": [
    "App Engine is Google's original PaaS with automatic scaling. It works, but for new systems I choose Cloud Run.",
    "A managed platform in standard and flexible environments.",
    "Deploy apps without servers.",
    "Legacy apps or simple web services.",
    "New systems needing flexibility.",
    "Provide app.yaml, deploy with gcloud app deploy, and set scaling.",
    "Pros: simple. Cons: less flexible, legacy feel.",
    "Cloud Run, App Service."
  ],
  "Batch": [
    "Batch is a managed service to run batch jobs on Compute Engine, handling provisioning and cleanup, with Spot VMs to cut cost.",
    "A job scheduler over VM pools.",
    "Avoid managing batch clusters.",
    "Compute-heavy and HPC jobs.",
    "Simple scheduled tasks.",
    "Define a job with tasks and resources, submit it, and monitor.",
    "Pros: cost efficient. Cons: queue latency.",
    "Cloud Run jobs, GKE jobs, AWS Batch."
  ],
  "Bare Metal Solution": [
    "Bare Metal Solution offers dedicated physical servers near Google Cloud for specialised workloads like Oracle that cannot be virtualised.",
    "Dedicated hardware with low-latency links to GCP.",
    "Licensing or hardware constraints.",
    "Oracle and specialised databases.",
    "Normal cloud workloads.",
    "Provision servers and connect to the VPC.",
    "Pros: specialised support. Cons: cost, niche.",
    "Compute Engine, on-prem."
  ],
  "Google Kubernetes Engine (GKE)": [
    "GKE is managed Kubernetes and the most mature offering. I choose Autopilot to let Google manage nodes, use workload identity, HPA and tuned JVM container settings.",
    "Google runs the control plane and optionally the nodes.",
    "Operating Kubernetes is hard.",
    "Microservice estates and Kubernetes-based tooling.",
    "Few services where Cloud Run is simpler.",
    "Create an Autopilot or Standard cluster, deploy with Helm or manifests, expose via Ingress or Gateway, configure workload identity, HPA, probes and resource limits.",
    "Pros: mature, powerful. Cons: complexity.",
    "Cloud Run, EKS, AKS."
  ],
  "Artifact Registry": [
    "Artifact Registry is the managed repository for container images and language packages like Maven, with scanning and IAM access.",
    "A registry for images and packages.",
    "Self-hosted registries need upkeep.",
    "All GCP container workloads.",
    "Multi-cloud setups elsewhere.",
    "Create a repository, authenticate with gcloud, and push images or Maven artifacts.",
    "Pros: integrated. Cons: storage cost.",
    "Docker Hub, Artifactory."
  ],
  "Cloud Deploy": [
    "Cloud Deploy provides managed continuous delivery to GKE and Cloud Run with promotion pipelines, approvals and rollbacks.",
    "A delivery pipeline service.",
    "Structured release flow across environments.",
    "Multi-environment promotion.",
    "Simple single-environment deploys.",
    "Define a delivery pipeline and targets, create releases, and promote.",
    "Pros: managed. Cons: GCP-specific.",
    "Argo CD, Spinnaker."
  ],
  "Cloud Storage": [
    "Cloud Storage is GCP's object storage with Standard, Nearline, Coldline and Archive classes. I use uniform access, signed URLs, lifecycle rules and the Java client.",
    "Buckets of objects with strong consistency.",
    "Files and databases are poor for large unstructured data.",
    "Uploads, backups, data lakes, static assets.",
    "Random block access.",
    "Create a bucket, upload with the Storage client, generate signed URLs, set lifecycle rules.",
    "Pros: durable, cheap. Cons: not a file system.",
    "S3, Blob Storage, Filestore."
  ],
  "Persistent Disk": [
    "Persistent Disk is network block storage for VMs, in standard, balanced, SSD and extreme types with snapshots.",
    "Durable block volumes attached to Compute Engine.",
    "VM disks must persist.",
    "VM boot and data disks.",
    "Shared files or objects.",
    "Create a disk, attach, choose type by IOPS, and schedule snapshots.",
    "Pros: durable. Cons: zonal limits.",
    "Filestore, Cloud Storage."
  ],
  "Filestore": [
    "Filestore is a managed NFS share for VMs and GKE pods that need shared files.",
    "Managed file storage.",
    "Shared files without self-managed servers.",
    "Lift-and-shift apps needing NFS.",
    "Object or database use.",
    "Create an instance and mount it over NFS.",
    "Pros: managed. Cons: cost.",
    "Cloud Storage FUSE, EFS."
  ],
  "Storage Transfer Service": [
    "Storage Transfer Service moves large data into Cloud Storage from other clouds, on-premises or other buckets on a schedule, used mainly for migrations.",
    "A managed data transfer service.",
    "Manual copying is slow.",
    "Migrations.",
    "Small copies.",
    "Create a transfer job with source, destination and schedule.",
    "Pros: managed. Cons: setup.",
    "gsutil, DataSync."
  ],
  "Cloud SQL": [
    "Cloud SQL is managed MySQL, PostgreSQL and SQL Server with backups, HA and replicas. I connect via the connector with IAM auth and HikariCP pooling.",
    "A managed relational database.",
    "Avoid operating databases.",
    "Standard Spring Boot relational workloads.",
    "Global scale or extreme throughput.",
    "Create an instance with HA, use the Cloud SQL connector, pool connections, add read replicas.",
    "Pros: managed. Cons: vertical scaling limits.",
    "AlloyDB, Spanner, RDS."
  ],
  "AlloyDB": [
    "AlloyDB is a PostgreSQL-compatible database with higher performance and strong analytics speed; I consider it when Cloud SQL is outgrown.",
    "A PostgreSQL-compatible service with a disaggregated storage layer.",
    "Standard Postgres limits.",
    "Demanding PostgreSQL workloads.",
    "Small databases.",
    "Create a cluster and primary, connect via JDBC, and add read pools.",
    "Pros: performance. Cons: cost.",
    "Cloud SQL, Aurora PostgreSQL."
  ],
  "Cloud Spanner": [
    "Spanner is a globally distributed relational database with strong consistency and horizontal scale. I avoid monotonic keys to prevent hotspots.",
    "A distributed SQL database using TrueTime.",
    "Relational databases do not scale horizontally with transactions.",
    "Global scale with consistency.",
    "Small apps due to cost.",
    "Create an instance, design the schema with interleaving, and use the Java client.",
    "Pros: scale, consistency. Cons: cost, design effort.",
    "Cloud SQL, CockroachDB, Cosmos DB."
  ],
  "Firestore": [
    "Firestore is a serverless document database with real-time listeners, common for mobile and web, modelled around queries.",
    "A document NoSQL database.",
    "Real-time sync and automatic scaling.",
    "Mobile and web backends.",
    "Complex relational queries.",
    "Create collections, index queries, and use the Java client.",
    "Pros: serverless. Cons: query limits.",
    "DynamoDB, Cosmos DB."
  ],
  "Bigtable": [
    "Bigtable is a wide-column NoSQL database for very high throughput at petabyte scale, where row key design is everything.",
    "A sparse, sorted key-value store like HBase.",
    "Massive low-latency reads and writes.",
    "Time series, IoT, large lookups.",
    "Relational needs.",
    "Create an instance and table, design row keys carefully, and use the Java client.",
    "Pros: scale. Cons: hotspots, cost.",
    "DynamoDB, Cassandra."
  ],
  "Memorystore": [
    "Memorystore is managed Redis, Valkey and Memcached for caching, sessions and rate limiting.",
    "An in-memory data store.",
    "Databases are slow for hot reads.",
    "Caching and sessions.",
    "Durable primary storage.",
    "Create an instance in the VPC and connect with Lettuce or Spring Cache.",
    "Pros: fast. Cons: invalidation.",
    "ElastiCache, Azure Cache for Redis."
  ],
  "VPC": [
    "A GCP VPC is global with regional subnets. I design subnets per region, firewall rules, Private Google Access, Shared VPC and Cloud NAT.",
    "A global virtual network with subnets and firewall rules.",
    "Isolation and traffic control.",
    "Every GCP deployment.",
    "Avoid needless complexity.",
    "Create custom subnets, define firewall rules by tag or service account, and share via Shared VPC.",
    "Pros: global. Cons: design care.",
    "AWS VPC, Azure VNet."
  ],
  "Cloud Load Balancing": [
    "Cloud Load Balancing offers global and regional balancers. I use the global HTTP(S) balancer with Cloud CDN, Cloud Armor and managed certificates.",
    "Software-defined load balancers with anycast IPs.",
    "Spread traffic and remove single points of failure.",
    "Any scaled service.",
    "Single-instance dev.",
    "Create backend services, health checks, URL maps and forwarding rules.",
    "Pros: global. Cons: cost.",
    "ALB, Application Gateway."
  ],
  "Cloud CDN": [
    "Cloud CDN caches content at Google's edge, attached to the global load balancer, using cache modes and signed URLs.",
    "An edge cache for HTTP content.",
    "Reduce latency and origin load.",
    "Static and cacheable content.",
    "Uncacheable traffic.",
    "Enable CDN on a backend service and set cache TTLs.",
    "Pros: performance. Cons: invalidation.",
    "CloudFront, Azure CDN."
  ],
  "Cloud DNS": [
    "Cloud DNS is a managed authoritative DNS with public and private zones.",
    "A DNS hosting service.",
    "Reliable DNS.",
    "Domain and private name resolution.",
    "Registration.",
    "Create zones and records.",
    "Pros: reliable. Cons: caching.",
    "Route 53, Azure DNS."
  ],
  "Cloud NAT": [
    "Cloud NAT provides outbound internet access for private instances without external IPs.",
    "A managed NAT service.",
    "Keep workloads private.",
    "Private VMs and GKE nodes needing egress.",
    "Public workloads.",
    "Create a NAT on a router for a region.",
    "Pros: managed. Cons: cost, port limits.",
    "NAT gateway on AWS, Azure NAT Gateway."
  ],
  "Cloud Interconnect": [
    "Cloud Interconnect is a dedicated or partner connection between on-premises and GCP, paired with VPN for redundancy.",
    "A private high-bandwidth link.",
    "Internet links are unpredictable.",
    "Hybrid enterprises.",
    "Small needs.",
    "Order the connection, create VLAN attachments, and set routes.",
    "Pros: performance. Cons: lead time, cost.",
    "Cloud VPN, Direct Connect."
  ],
  "Cloud Armor": [
    "Cloud Armor is the WAF and DDoS service on the external load balancer with OWASP rules, rate limiting and adaptive protection.",
    "A security policy layer for load balancers.",
    "Web attacks and abuse.",
    "Public apps.",
    "Internal services.",
    "Create a security policy with rules and attach it to a backend service.",
    "Pros: managed. Cons: tuning.",
    "WAF, Azure WAF."
  ],
  "Network Connectivity Center": [
    "Network Connectivity Center is a hub for connecting on-premises, other clouds and VPCs, mainly relevant to network teams.",
    "A hub-and-spoke connectivity service.",
    "Manage large hybrid networks centrally.",
    "Large hybrid designs.",
    "Simple setups.",
    "Create a hub and attach spokes.",
    "Pros: central. Cons: complexity.",
    "Transit Gateway."
  ],
  "API Gateway": [
    "API Gateway is a managed gateway for serverless backends using OpenAPI for authentication, quotas and monitoring.",
    "A gateway for Cloud Run and Functions.",
    "Cross-cutting API concerns.",
    "Lightweight API management.",
    "Full API programmes.",
    "Upload an OpenAPI config and create a gateway.",
    "Pros: simple. Cons: limited features.",
    "Apigee, AWS API Gateway."
  ],
  "Apigee": [
    "Apigee is Google's full API management platform with policies, analytics, monetisation and developer portals for large enterprises.",
    "An API management suite.",
    "Manage many external APIs.",
    "Enterprise API programmes.",
    "Small APIs.",
    "Build API proxies with policies, publish products and portals.",
    "Pros: rich. Cons: cost, heavy.",
    "API Gateway, Kong, Azure APIM."
  ],
  "Endpoints": [
    "Cloud Endpoints is an older API management layer using an OpenAPI spec and a proxy. For new work I use API Gateway or Apigee.",
    "A proxy-based API management service.",
    "API auth and monitoring.",
    "Existing users.",
    "New designs.",
    "Deploy ESP with an OpenAPI spec.",
    "Pros: simple. Cons: dated.",
    "API Gateway, Apigee."
  ],
  "BigQuery": [
    "BigQuery is a serverless columnar data warehouse that queries terabytes in seconds with SQL. I use partitioning and clustering, avoid SELECT star and load in bulk.",
    "A serverless warehouse with separated storage and compute.",
    "Warehouses are hard to operate.",
    "Analytics and BI.",
    "OLTP.",
    "Create datasets, load data, query with the Java client, and partition tables.",
    "Pros: serverless scale. Cons: query cost.",
    "Redshift, Snowflake, Synapse."
  ],
  "Dataflow": [
    "Dataflow is a managed stream and batch processing service based on Apache Beam with a Java SDK; I use it to move Pub/Sub into BigQuery.",
    "A Beam runner that autoscales workers.",
    "Stream processing is complex to operate.",
    "ETL and streaming pipelines.",
    "Simple transforms in SQL.",
    "Write a Beam pipeline in Java and launch it with the Dataflow runner.",
    "Pros: managed, exactly-once. Cons: Beam learning curve.",
    "Spark, Flink, Kinesis Analytics."
  ],
  "Dataproc": [
    "Dataproc is managed Spark and Hadoop clusters that start quickly, good for migrating Hadoop jobs.",
    "Managed open source big data clusters.",
    "Operating Hadoop is hard.",
    "Existing Spark jobs.",
    "New pipelines where Dataflow or BigQuery suit.",
    "Create a cluster and submit Spark jobs.",
    "Pros: familiar. Cons: cluster tuning.",
    "EMR, Databricks."
  ],
  "Pub/Sub": [
    "Pub/Sub is the global managed messaging service for async architectures, with at-least-once delivery, ordering keys, dead-letter topics and replay. I make subscribers idempotent.",
    "Topics and subscriptions with push or pull delivery.",
    "Decouple services and absorb spikes.",
    "Event-driven systems and ingestion.",
    "Low-latency RPC.",
    "Create a topic and subscription, publish with the Java client, ack messages, and add a DLQ.",
    "Pros: global scale. Cons: duplicates, ordering care.",
    "SQS and SNS, Kafka, Service Bus."
  ],
  "Cloud Composer": [
    "Cloud Composer is managed Apache Airflow for orchestrating data and batch workflows as DAGs.",
    "Airflow as a service.",
    "Run dependent pipelines on schedule.",
    "Data workflow orchestration.",
    "Simple cron jobs.",
    "Create an environment and deploy DAGs.",
    "Pros: managed Airflow. Cons: cost.",
    "Cloud Workflows, MWAA."
  ],
  "Data Fusion": [
    "Data Fusion is a managed, visual ETL tool built on CDAP for low-code integration.",
    "A drag-and-drop pipeline builder.",
    "Data integration without code.",
    "Low-code ETL.",
    "Developer-heavy pipelines.",
    "Build pipelines in the UI and run on Dataproc.",
    "Pros: visual. Cons: cost.",
    "Dataflow, Data Factory."
  ],
  "Dataplex": [
    "Dataplex provides data governance, discovery and quality across lakes and warehouses, relevant to data platform teams.",
    "A data management layer.",
    "Govern distributed data.",
    "Large data estates.",
    "Small projects.",
    "Create lakes and zones and attach assets.",
    "Pros: governance. Cons: complexity.",
    "Lake Formation, Purview."
  ],
  "Looker": [
    "Looker is Google's BI platform built on a LookML semantic layer, for analysts, connecting to BigQuery.",
    "A BI and modelling tool.",
    "Governed analytics.",
    "Business reporting.",
    "Custom UIs.",
    "Model data in LookML and build dashboards.",
    "Pros: governed metrics. Cons: cost.",
    "Power BI, Tableau."
  ],
  "Datastream": [
    "Datastream is serverless change data capture replicating databases into BigQuery or Cloud Storage for near real-time analytics.",
    "A CDC service.",
    "Avoid custom CDC code.",
    "Replicating OLTP to analytics.",
    "Batch-only needs.",
    "Create a connection profile and stream.",
    "Pros: managed. Cons: source limits.",
    "Debezium, DMS."
  ],
  "Vertex AI": [
    "Vertex AI is the unified ML platform for training, deploying and managing models, and the home of Gemini. I call endpoints through the client library.",
    "A platform with model garden, pipelines and endpoints.",
    "Operationalising ML is hard.",
    "Custom and generative models.",
    "Simple prebuilt API needs.",
    "Train or pick a model, deploy to an endpoint, and call it from Java.",
    "Pros: unified. Cons: complexity.",
    "SageMaker, Azure ML."
  ],
  "Gemini API": [
    "The Gemini API gives access to Google's multimodal models, via Vertex AI or AI Studio. I watch prompt design, token cost, latency and data governance.",
    "Hosted multimodal generative models.",
    "Self-hosting LLMs is costly.",
    "Chat, summarisation, code, multimodal tasks.",
    "Deterministic logic.",
    "Use the Vertex AI Java SDK to call generateContent.",
    "Pros: capable. Cons: cost, non-determinism.",
    "Azure OpenAI, Bedrock."
  ],
  "AutoML": [
    "AutoML trains custom models with little ML expertise and is now folded into Vertex AI.",
    "Automated model training.",
    "Few ML specialists.",
    "Quick custom models.",
    "Complex research needs.",
    "Upload data, train, and deploy.",
    "Pros: easy. Cons: less control.",
    "Custom training."
  ],
  "Vision AI": [
    "Vision AI provides image analysis APIs for labels, OCR, faces and objects.",
    "A prebuilt vision service.",
    "Building vision models is costly.",
    "OCR and tagging.",
    "Specialised vision.",
    "Call the Vision API client.",
    "Pros: easy. Cons: generic.",
    "Rekognition."
  ],
  "Natural Language AI": [
    "The Natural Language API offers sentiment, entities and classification.",
    "A prebuilt NLP API.",
    "NLP pipelines are heavy.",
    "Text analytics.",
    "Domain-specific.",
    "Call the client library.",
    "Pros: simple. Cons: generic.",
    "Comprehend."
  ],
  "Speech-to-Text": [
    "Speech-to-Text transcribes audio in real time or batch for call transcripts and voice interfaces.",
    "A speech recognition API.",
    "Manual transcription.",
    "Voice features.",
    "Noisy audio needing custom models.",
    "Call the Speech client.",
    "Pros: accurate. Cons: cost.",
    "Transcribe."
  ],
  "Text-to-Speech": [
    "Text-to-Speech turns text into natural audio with many voices through a simple API.",
    "A speech synthesis API.",
    "Recording audio is costly.",
    "Accessibility and voice.",
    "Custom voices.",
    "Call the TTS client.",
    "Pros: easy. Cons: cost.",
    "Polly."
  ],
  "Translation AI": [
    "Translation AI translates text between languages with neural models and glossaries.",
    "A translation API.",
    "Manual localisation.",
    "Dynamic content.",
    "Legal text.",
    "Call the Translate client.",
    "Pros: simple. Cons: quality.",
    "DeepL, Translate."
  ],
  "Document AI": [
    "Document AI extracts structured data from documents like invoices and forms, equivalent to Textract.",
    "Specialised document processors.",
    "Manual data entry.",
    "Invoices, forms.",
    "Unusual layouts.",
    "Create a processor and call process.",
    "Pros: structured. Cons: cost.",
    "Textract."
  ],
  "Video Intelligence API": [
    "The Video Intelligence API analyses video for labels, shot changes, objects and speech, a niche media option.",
    "A video analysis API.",
    "Manual tagging.",
    "Media processing.",
    "General apps.",
    "Call annotateVideo.",
    "Pros: easy. Cons: niche.",
    "Rekognition Video."
  ],
  "IAM": [
    "GCP IAM uses a hierarchy of organisation, folders and projects where policies inherit downward. I use predefined roles, group grants and service accounts with workload identity rather than keys.",
    "Policies binding members to roles on resources.",
    "Control access.",
    "All GCP usage.",
    "Avoid basic roles.",
    "Grant roles to groups, use conditions, and avoid downloaded keys.",
    "Pros: granular. Cons: inheritance complexity.",
    "AWS IAM, Azure RBAC."
  ],
  "Cloud KMS": [
    "Cloud KMS manages encryption keys including customer-managed keys, with rotation, HSM options and audit logging.",
    "A key management service.",
    "Control encryption keys.",
    "CMEK and envelope encryption.",
    "Bulk encryption directly.",
    "Create a key ring and key, grant access, and enable rotation.",
    "Pros: managed. Cons: request costs.",
    "AWS KMS, Key Vault."
  ],
  "Secret Manager": [
    "Secret Manager stores and versions secrets, controlled through IAM, which I fetch at runtime with version pinning.",
    "A managed secret store.",
    "Secrets in config leak.",
    "Credentials and API keys.",
    "Non-sensitive config.",
    "Create a secret, grant access, and mount in Cloud Run or fetch via client.",
    "Pros: managed. Cons: per-access cost.",
    "AWS Secrets Manager, Key Vault, Vault."
  ],
  "Identity Platform": [
    "Identity Platform is a customer identity service for sign-up, sign-in and MFA built on Firebase Auth; my APIs validate its JWTs.",
    "A CIAM service.",
    "Avoid building auth.",
    "Customer-facing apps.",
    "Workforce SSO.",
    "Configure providers and validate tokens in Spring Security.",
    "Pros: managed. Cons: limits.",
    "Cognito, Auth0."
  ],
  "Security Command Center": [
    "Security Command Center is the central security and risk dashboard across GCP resources.",
    "A posture and threat service.",
    "Security visibility.",
    "Organisation-wide.",
    "Small projects.",
    "Enable it and review findings.",
    "Pros: central. Cons: cost tiers.",
    "Security Hub, Defender."
  ],
  "Binary Authorization": [
    "Binary Authorization enforces that only trusted signed images are deployed to GKE or Cloud Run, supporting supply chain security.",
    "A deploy-time policy for images.",
    "Prevent untrusted images.",
    "Regulated pipelines.",
    "Small teams.",
    "Create a policy and attestors, and sign images in CI.",
    "Pros: secure. Cons: process overhead.",
    "Admission controllers, Sigstore."
  ],
  "Resource Manager": [
    "Resource Manager organises resources into organisation, folders and projects, where IAM and billing attach. Structure per environment is an early decision.",
    "A resource hierarchy.",
    "Governance and isolation.",
    "All GCP setups.",
    "N/A.",
    "Design folders and projects and apply policies.",
    "Pros: central. Cons: restructure cost.",
    "AWS Organizations."
  ],
  "VPC Service Controls": [
    "VPC Service Controls create security perimeters around Google APIs to prevent data exfiltration.",
    "Service perimeters.",
    "Stop data leakage.",
    "Regulated data.",
    "Simple apps.",
    "Define perimeters and access levels.",
    "Pros: strong control. Cons: complexity.",
    "Private Link and policies."
  ],
  "Cloud Monitoring": [
    "Cloud Monitoring collects metrics, dashboards and alerts and supports SLOs. I publish custom metrics from Micrometer.",
    "A metrics and alerting service.",
    "Operate with visibility.",
    "All workloads.",
    "Deep APM.",
    "Create dashboards and alert policies.",
    "Pros: native. Cons: cost.",
    "Datadog, CloudWatch."
  ],
  "Cloud Logging": [
    "Cloud Logging centralises logs with structured JSON, log-based metrics, sinks and retention. I log structured JSON so severity and trace IDs are indexed.",
    "A log service.",
    "Centralised logs.",
    "All services.",
    "Long archives.",
    "Write JSON logs, create sinks, and use exclusion filters.",
    "Pros: automatic. Cons: ingestion cost.",
    "CloudWatch Logs, Log Analytics."
  ],
  "Cloud Trace": [
    "Cloud Trace is distributed tracing showing latency across services, fed by OpenTelemetry.",
    "A tracing backend.",
    "Find slow dependencies.",
    "Microservices.",
    "Single services.",
    "Export spans with OpenTelemetry.",
    "Pros: simple. Cons: sampling.",
    "X-Ray, App Insights."
  ],
  "Cloud Profiler": [
    "Cloud Profiler is a continuous low-overhead production profiler showing CPU and heap by code path.",
    "A profiling service.",
    "Find hot spots without reproducing locally.",
    "Production tuning.",
    "N/A.",
    "Enable the Java agent.",
    "Pros: low overhead. Cons: limited.",
    "async-profiler, JFR."
  ],
  "Cloud Asset Inventory": [
    "Cloud Asset Inventory records and queries resources and IAM policies over time for audits.",
    "A resource history service.",
    "Know what exists.",
    "Audits.",
    "N/A.",
    "Export assets to BigQuery.",
    "Pros: visibility. Cons: setup.",
    "AWS Config."
  ],
  "Billing": [
    "Cloud Billing manages accounts, budgets and cost reports, with export to BigQuery. I use labels and budgets so teams see spend.",
    "A billing and cost service.",
    "Control spend.",
    "All projects.",
    "N/A.",
    "Create budgets and export billing data.",
    "Pros: native. Cons: limited depth.",
    "FinOps tools."
  ],
  "Cloud Build": [
    "Cloud Build is managed CI/CD running steps as containers. I build Maven or Gradle projects, push to Artifact Registry and deploy to Cloud Run or GKE.",
    "A serverless build service.",
    "Avoid build servers.",
    "GCP-centred CI.",
    "GitHub Actions shops.",
    "Write cloudbuild.yaml and set triggers.",
    "Pros: scales. Cons: fewer features.",
    "GitHub Actions, Jenkins."
  ],
  "Cloud Shell": [
    "Cloud Shell is a browser terminal with gcloud and tools preinstalled, handy for quick admin.",
    "A managed shell environment.",
    "Avoid local setup.",
    "Quick tasks.",
    "Daily development.",
    "Open it from the console.",
    "Pros: easy. Cons: limited resources.",
    "Local gcloud."
  ],
  "Cloud Scheduler": [
    "Cloud Scheduler is managed cron triggering HTTP, Pub/Sub or other targets, used for periodic jobs against Cloud Run.",
    "A cron service.",
    "Avoid cron servers.",
    "Periodic jobs.",
    "Complex workflows.",
    "Create a job with schedule and target.",
    "Pros: simple. Cons: basic.",
    "EventBridge Scheduler."
  ],
  "Cloud Tasks": [
    "Cloud Tasks manages queues of asynchronous HTTP tasks with rate limits and retries, for throttling work to a service.",
    "A task queue.",
    "Control rate and retries.",
    "Throttled async work.",
    "Broadcast patterns.",
    "Create a queue and enqueue tasks.",
    "Pros: control. Cons: HTTP targets.",
    "Pub/Sub, SQS."
  ],
  "Workflows": [
    "Workflows orchestrates services and APIs with retries, conditions and error handling, similar to Step Functions.",
    "A serverless orchestrator.",
    "Coordinate steps without custom code.",
    "Chaining Cloud Run and HTTP APIs.",
    "Complex logic.",
    "Write YAML workflows and deploy.",
    "Pros: serverless. Cons: YAML limits.",
    "Step Functions, Logic Apps."
  ],
  "Eventarc": [
    "Eventarc routes events from Google services, Pub/Sub and third parties to targets like Cloud Run using CloudEvents.",
    "An event routing service.",
    "Standardise event delivery.",
    "Event-driven architectures.",
    "Streaming.",
    "Create triggers with filters and targets.",
    "Pros: standard format. Cons: limited sources.",
    "EventBridge, Event Grid."
  ]
};
