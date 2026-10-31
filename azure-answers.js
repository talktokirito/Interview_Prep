// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives]
const SERVICE_ANSWERS = {
  "Virtual Machines": [
    "Azure Virtual Machines are the IaaS building block with full OS control. I pick the VM series by workload, use managed disks, availability zones and managed identities, and size the JVM heap to the VM. PaaS is my first choice for new apps.",
    "Resizable virtual servers from images, with disks, NICs and NSGs inside a VNet.",
    "Owning hardware is slow and inflexible; VMs give capacity in minutes.",
    "Lift-and-shift, licensed software, workloads needing OS control or specialised hardware.",
    "Stateless web apps that App Service or containers run with less patching effort.",
    "Choose a VM size, attach a managed disk, place it in a subnet with an NSG, enable a managed identity, put VMs in an availability zone behind a load balancer, and deploy the JAR via a pipeline or cloud-init.",
    "Pros: control, wide sizing. Cons: you patch and scale, higher ops cost.",
    "App Service, AKS or Container Apps (less ops), Functions (event driven)."
  ],
  "Virtual Machine Scale Sets": [
    "Scale sets manage a group of identical VMs that autoscale on metrics or schedules, spread across zones, behind a load balancer.",
    "A resource that creates and manages many identical VM instances from one model.",
    "Hand-scaling VMs is slow and error prone.",
    "Stateless services needing VM-level control with autoscaling.",
    "Workloads that fit PaaS or containers.",
    "Define a model with image and size, set autoscale rules, attach a load balancer, and use rolling upgrades.",
    "Pros: automatic scaling, zone spread. Cons: image management, still VM ops.",
    "AKS or App Service autoscale, plain VMs with availability sets."
  ],
  "Azure Functions": [
    "Azure Functions is serverless, event-driven compute with triggers and bindings. Java is supported; cold start is handled with the Premium plan, and Durable Functions handles stateful orchestration.",
    "Functions triggered by HTTP, queues, timers, blobs or Event Hubs, with declarative bindings.",
    "Running always-on servers for small event handlers wastes money.",
    "Event processing, glue code, scheduled jobs, lightweight APIs.",
    "Long-running steady workloads or heavy Spring apps with slow startup.",
    "Create a function app, write a method annotated with @FunctionName and @ServiceBusQueueTrigger, choose Consumption or Premium plan, and use managed identity for connections.",
    "Pros: pay per use, easy triggers. Cons: cold starts, execution limits.",
    "Container Apps, App Service WebJobs, Logic Apps (low code)."
  ],
  "App Service": [
    "App Service is the PaaS for web apps and APIs. It runs Spring Boot JARs directly, with deployment slots, autoscale, managed TLS and VNet integration. My default for Java web services on Azure.",
    "A managed hosting platform for web apps, APIs and containers.",
    "Managing web servers and patching is repetitive.",
    "Typical web and API workloads, teams wanting simple deployments.",
    "Complex microservice estates needing Kubernetes features.",
    "Create a plan and app with the Java runtime, deploy the JAR via pipeline or az webapp deploy, use slots for blue-green swaps, configure app settings and Key Vault references, and set autoscale rules.",
    "Pros: very easy, slots, integrated. Cons: less control, scaling limits compared with AKS.",
    "AKS or Container Apps (container-first), VMs (full control), Functions (events)."
  ],
  "Container Apps": [
    "Container Apps is serverless containers with scale to zero, KEDA event scaling and revisions for traffic splitting. A good fit for Spring Boot microservices without cluster ops.",
    "A managed platform on Kubernetes that hides the cluster.",
    "AKS operations are heavy for smaller teams.",
    "Microservices, event-driven workers, APIs needing scale to zero.",
    "Workloads needing full Kubernetes APIs or custom operators.",
    "Create an environment, deploy an image from ACR, set ingress, scaling rules and secrets, and use revisions for blue-green.",
    "Pros: simple, serverless scaling. Cons: less control than AKS.",
    "AKS, App Service, Functions."
  ],
  "Container Instances": [
    "Container Instances run a container quickly without orchestration, billed per second. I use them for short tasks and simple jobs.",
    "Serverless single containers or small container groups.",
    "Running a container should not need a cluster.",
    "Short-lived jobs, build agents, quick tests.",
    "Production microservice platforms needing scaling and rollout.",
    "Run az container create with an image, CPU and memory, and set a restart policy.",
    "Pros: fast, simple. Cons: no orchestration or autoscaling.",
    "Container Apps, AKS, Batch."
  ],
  "Azure Batch": [
    "Azure Batch schedules large parallel and HPC jobs across pools of VMs, handling queueing and scaling.",
    "A managed batch scheduler with pools, jobs and tasks.",
    "Building your own batch cluster is complex.",
    "Compute-heavy parallel jobs like rendering and simulation.",
    "Simple scheduled jobs that Functions or Container Apps jobs can run.",
    "Create a pool, define jobs and tasks, upload inputs to storage, and scale with low-priority VMs.",
    "Pros: cost efficient. Cons: niche skills.",
    "AKS jobs, Databricks, AWS Batch equivalent."
  ],
  "Azure Spring Apps": [
    "Azure Spring Apps was a managed Spring Boot platform. It is being retired, so for new work I choose Container Apps, AKS or App Service.",
    "A managed platform with service registry, config server and monitoring for Spring.",
    "Run Spring apps without operating the infrastructure.",
    "Only existing deployments; plan migration.",
    "New projects.",
    "Migrate to Container Apps or AKS, externalising config with Key Vault and App Configuration.",
    "Pros: Spring-specific features. Cons: retirement.",
    "Container Apps, AKS, App Service."
  ],
  "Azure Kubernetes Service (AKS)": [
    "AKS is managed Kubernetes. I use node pools, the cluster autoscaler, managed identities and workload identity, and tune JVM memory limits and probes for containers.",
    "Azure manages the control plane while I manage node pools. Flow: image in ACR -> deployment -> service -> ingress.",
    "Operating Kubernetes control planes is hard.",
    "Large microservice estates, platform teams, and Kubernetes-based tooling.",
    "Small teams or few services, where Container Apps is simpler.",
    "Create the cluster with Azure CNI, add system and user node pools, connect ACR, install an ingress controller, deploy with Helm, add HPA and probes, and use workload identity for Azure access.",
    "Pros: ecosystem, flexibility. Cons: complexity, upgrade effort.",
    "Container Apps (simpler), App Service, EKS or GKE on other clouds."
  ],
  "Azure Container Registry": [
    "ACR is the private registry for Docker and OCI images. I push from CI, enable scanning, geo-replication and attach it to AKS via managed identity.",
    "A managed registry for images and Helm charts.",
    "Self-hosted registries need upkeep and security.",
    "Any Azure container workload.",
    "Multi-cloud setups standardised elsewhere.",
    "Create a registry, az acr login, push images from the pipeline, and grant AcrPull to AKS.",
    "Pros: managed, secure. Cons: storage cost.",
    "Docker Hub, GitHub Container Registry, Harbor."
  ],
  "Azure Red Hat OpenShift": [
    "Azure Red Hat OpenShift is a managed OpenShift cluster jointly operated by Microsoft and Red Hat, for organisations standardised on OpenShift.",
    "Managed OpenShift on Azure.",
    "OpenShift users want it without self-managing.",
    "Existing OpenShift shops.",
    "Teams happy with AKS.",
    "Create the cluster in a VNet, configure OAuth, and deploy with oc or Helm.",
    "Pros: enterprise Kubernetes. Cons: cost, complexity.",
    "AKS, self-managed OpenShift."
  ],
  "Blob Storage": [
    "Blob Storage is Azure's object storage with hot, cool, cold and archive tiers. I use SAS tokens or managed identity, lifecycle rules, soft delete and the Java SDK.",
    "Object storage inside a storage account, with containers and blobs.",
    "Files and databases are poor for large unstructured data.",
    "Static content, uploads, backups, data lake.",
    "Transactional data or random block writes.",
    "Create a storage account, use BlobServiceClient with DefaultAzureCredential, upload blobs, generate user-delegation SAS for clients, and set lifecycle management.",
    "Pros: cheap, durable. Cons: not a file system, permission mistakes.",
    "Azure Files, Disk, S3 and Cloud Storage on other clouds."
  ],
  "Azure Files": [
    "Azure Files provides managed SMB and NFS file shares that multiple VMs or containers mount, ideal for lift-and-shift apps expecting a shared file system.",
    "Managed file shares in a storage account.",
    "Shared files otherwise need file servers.",
    "Shared content and legacy apps.",
    "Latency-sensitive databases.",
    "Create a share, mount over SMB or NFS, and secure with private endpoints.",
    "Pros: managed shared storage. Cons: latency and cost.",
    "Blob Storage, NetApp Files."
  ],
  "Managed Disks": [
    "Managed Disks are block storage for VMs handled by Azure; I choose type by IOPS needs and use snapshots for backup.",
    "Disk volumes from Standard HDD to Ultra Disk.",
    "Managing storage accounts for VM disks was painful.",
    "VM OS and data disks.",
    "Shared files or objects.",
    "Create and attach a disk, select the performance tier, and schedule snapshots.",
    "Pros: simple and durable. Cons: tied to a VM or zone.",
    "Azure Files, Blob Storage."
  ],
  "Queue Storage": [
    "Queue Storage is a simple, cheap queue in a storage account. For ordering, topics or dead-lettering I use Service Bus.",
    "A basic message queue.",
    "Lightweight decoupling.",
    "Simple work queues with large volume.",
    "Enterprise messaging with ordering and sessions.",
    "Use QueueClient to send and receive, with visibility timeout.",
    "Pros: cheap, simple. Cons: few features.",
    "Service Bus, Event Hubs."
  ],
  "Azure NetApp Files": [
    "Azure NetApp Files is a high-performance managed file service for demanding enterprise workloads such as SAP or HPC.",
    "Managed NetApp ONTAP file storage.",
    "Some workloads need very low-latency shared storage.",
    "SAP, databases and HPC.",
    "General apps.",
    "Create a capacity pool and volume, and mount over NFS or SMB.",
    "Pros: performance. Cons: cost.",
    "Azure Files Premium, FSx for NetApp ONTAP."
  ],
  "Data Lake Storage": [
    "Data Lake Storage Gen2 is Blob Storage with a hierarchical namespace and POSIX permissions, the standard layer for analytics.",
    "Blob storage optimised for big data with directories and ACLs.",
    "Analytics needs efficient directory operations and fine-grained access.",
    "Data lakes with Synapse, Databricks and Fabric.",
    "Plain object storage use cases.",
    "Enable hierarchical namespace on the account, organise zones, and set ACLs.",
    "Pros: analytics-friendly. Cons: some feature differences from plain blobs.",
    "S3 plus Lake Formation, Google Cloud Storage."
  ],
  "Azure Backup": [
    "Azure Backup is managed backup for VMs, databases and file shares with retention policies in vaults. An operational baseline rather than something I code against.",
    "A service storing recovery points in a vault.",
    "Manual backups are unreliable.",
    "All production data.",
    "Not a DR replacement by itself.",
    "Create a vault, define a policy, and enable it for resources.",
    "Pros: managed. Cons: restore time, cost.",
    "Snapshots, third-party backup tools."
  ],
  "Azure Site Recovery": [
    "Site Recovery replicates VMs to another region or site for disaster recovery with orchestrated failover.",
    "A DR replication and failover service.",
    "Meeting RTO and RPO targets.",
    "Business-critical VM workloads.",
    "Stateless services that can simply be redeployed.",
    "Enable replication, create recovery plans, and test failover regularly.",
    "Pros: managed DR. Cons: cost, testing effort.",
    "Multi-region active deployments, backup and restore."
  ],
  "Azure SQL Database": [
    "Azure SQL Database is managed SQL Server as PaaS with backups, HA and elastic pools. I choose vCore or serverless, use failover groups for DR, and connect with HikariCP and Entra authentication.",
    "A managed relational database with built-in HA and scaling tiers.",
    "Managing SQL Server installations and patching is toil.",
    "SQL Server-based applications and general relational workloads on Azure.",
    "Needing full SQL Server instance features (use Managed Instance) or PostgreSQL ecosystem.",
    "Create a server and database, configure firewall or private endpoint, connect via the Microsoft JDBC driver with Entra auth, pool connections, and add geo-replication.",
    "Pros: managed, secure. Cons: cost, feature limits versus full SQL Server.",
    "SQL Managed Instance, Azure PostgreSQL, Aurora or Cloud SQL elsewhere."
  ],
  "SQL Managed Instance": [
    "SQL Managed Instance offers near-full SQL Server compatibility inside a VNet, the best target for migrating existing SQL Server apps.",
    "A managed SQL Server instance with SQL Agent and cross-database queries.",
    "Migrations break on features missing from Azure SQL Database.",
    "Lift-and-shift of SQL Server estates.",
    "New apps that do not need instance-level features.",
    "Deploy into a dedicated subnet, restore backups, and use the Database Migration Service.",
    "Pros: compatibility. Cons: higher cost, slower provisioning.",
    "Azure SQL Database, SQL Server on VMs."
  ],
  "Azure Cosmos DB": [
    "Cosmos DB is a globally distributed multi-model NoSQL database with low latency. I design partition keys, watch RU cost and choose the consistency level.",
    "A distributed database with multiple APIs and tunable consistency.",
    "Global-scale apps need low latency and multi-region writes.",
    "Global, high-throughput, flexible-schema workloads.",
    "Relational reporting or tight budgets.",
    "Create an account and container with a partition key, use the Java SDK or Spring Data Cosmos, set throughput mode, and enable multi-region.",
    "Pros: scale, latency, SLAs. Cons: RU cost, hot partitions, modelling effort.",
    "DynamoDB, Azure SQL, MongoDB Atlas."
  ],
  "Azure Database for PostgreSQL": [
    "Managed PostgreSQL via Flexible Server with HA, backups and replicas. Very common for Spring Boot and JPA apps, with private networking and Entra auth.",
    "A managed PostgreSQL service.",
    "Operating PostgreSQL yourself is costly.",
    "General relational workloads on Azure.",
    "Needing Azure SQL-specific features.",
    "Create a flexible server in a private subnet, connect via JDBC with HikariCP, enable zone-redundant HA and read replicas.",
    "Pros: open source, managed. Cons: limits on extensions and scale.",
    "Azure SQL, Cosmos DB for PostgreSQL, Aurora PostgreSQL."
  ],
  "Azure Database for MySQL": [
    "Managed MySQL with Flexible Server, used for apps already built on MySQL with HA and backups.",
    "A managed MySQL service.",
    "Avoid running MySQL yourself.",
    "MySQL-based apps.",
    "New apps where PostgreSQL is preferred.",
    "Create a flexible server, connect with the MySQL connector and pooling, and configure backups.",
    "Pros: managed. Cons: scaling limits.",
    "Azure PostgreSQL, Azure SQL."
  ],
  "Azure Cache for Redis": [
    "Azure Cache for Redis is managed Redis for caching and sessions. Microsoft is moving customers to Azure Managed Redis, so I check the current offering.",
    "A managed in-memory data store.",
    "Databases are slow and costly for hot reads.",
    "Caching, sessions, rate limiting.",
    "Primary durable storage.",
    "Create a cache, connect with Lettuce or Spring Cache over TLS, set TTLs and eviction policy.",
    "Pros: fast. Cons: invalidation, cost, product transition.",
    "Azure Managed Redis, Cosmos DB, local Caffeine cache."
  ],
  "Virtual Network": [
    "A virtual network is Azure's private network. I design subnets per tier, use NSGs, peering and private endpoints, which is the foundation of secure deployments.",
    "Isolated address spaces with subnets, routes and security rules.",
    "Workloads need isolation and traffic control.",
    "Every Azure deployment.",
    "Avoid over-segmenting small systems.",
    "Plan address ranges, create subnets, apply NSGs, peer VNets, and use private endpoints for PaaS.",
    "Pros: flexible. Cons: complex at scale.",
    "No alternative; connect with peering, VWAN or Private Link."
  ],
  "Load Balancer": [
    "Azure Load Balancer is a layer 4 balancer for TCP and UDP; I use it for non-HTTP or internal traffic.",
    "A zone-redundant layer 4 balancer.",
    "Spread traffic and remove single points of failure.",
    "Non-HTTP workloads, internal tier balancing.",
    "HTTP routing needs, where Application Gateway fits.",
    "Create a Standard LB, define frontend, backend pool, probes and rules.",
    "Pros: fast, simple. Cons: no L7 features.",
    "Application Gateway, Front Door, NGINX."
  ],
  "Application Gateway": [
    "Application Gateway is a regional layer 7 load balancer with path routing, TLS termination and optional WAF.",
    "An HTTP load balancer with routing rules.",
    "Need path or host routing and WAF in a region.",
    "Web apps and APIs inside a region.",
    "Global routing, where Front Door fits.",
    "Create a gateway with listeners, rules and backend pools, enable WAF, and configure health probes.",
    "Pros: L7 features. Cons: cost, sizing.",
    "Front Door, Load Balancer, NGINX Ingress."
  ],
  "Azure Front Door": [
    "Front Door is a global entry point with CDN, layer 7 routing, WAF and fast failover, for multi-region apps.",
    "A global edge routing service.",
    "Global users need low latency and resilience.",
    "Multi-region web apps.",
    "Single-region internal apps.",
    "Create a profile, add origins, routes and WAF policy, and set health probes.",
    "Pros: global performance. Cons: cost, complexity.",
    "Traffic Manager, CloudFront, Application Gateway."
  ],
  "Azure CDN": [
    "Azure CDN caches static content at edge locations to reduce latency, often with Blob Storage.",
    "A content delivery network.",
    "Distant users and loaded origins.",
    "Static assets and media.",
    "Dynamic uncacheable traffic.",
    "Create an endpoint pointing at an origin and set caching rules.",
    "Pros: performance. Cons: cache invalidation.",
    "Front Door, CloudFront, Cloudflare."
  ],
  "Azure DNS": [
    "Azure DNS hosts DNS zones on Azure's global network. Private zones resolve names inside VNets, important with private endpoints.",
    "A managed authoritative DNS service.",
    "Reliable DNS hosting integrated with Azure.",
    "Domain hosting and private resolution.",
    "Domain registration, which needs a registrar.",
    "Create a zone, add records, and link private zones to VNets.",
    "Pros: reliable. Cons: caching delays.",
    "Route 53, Cloud DNS."
  ],
  "Azure Firewall": [
    "Azure Firewall is a managed stateful firewall with FQDN filtering, used in hub-and-spoke designs to control egress.",
    "A cloud-native network firewall.",
    "NSGs alone cannot do central filtering.",
    "Centralised network security.",
    "Simple apps where NSGs are enough.",
    "Deploy in a hub VNet, add network and application rules, and route spokes through it.",
    "Pros: central control. Cons: cost.",
    "NSGs, third-party NVAs."
  ],
  "ExpressRoute": [
    "ExpressRoute is a private dedicated connection from on-premises to Azure for reliable latency, often backed up by a VPN.",
    "A private circuit through a connectivity provider.",
    "Internet links are unpredictable.",
    "Hybrid enterprises and large data transfers.",
    "Small or temporary needs.",
    "Order a circuit, configure peering, and connect to a gateway.",
    "Pros: stability. Cons: lead time, cost.",
    "VPN Gateway, AWS Direct Connect."
  ],
  "VPN Gateway": [
    "VPN Gateway provides encrypted site-to-site or point-to-site tunnels over the internet, quicker and cheaper than ExpressRoute.",
    "A gateway terminating IPsec tunnels.",
    "Connect networks securely without dedicated lines.",
    "Small hybrid setups and remote users.",
    "High-bandwidth stable needs.",
    "Create a gateway in a gateway subnet, configure connections and shared keys.",
    "Pros: cheap, fast to set up. Cons: variable performance.",
    "ExpressRoute."
  ],
  "Traffic Manager": [
    "Traffic Manager is DNS-based global traffic routing by priority, weight or performance. Front Door largely replaces it for HTTP.",
    "A DNS load balancer across endpoints.",
    "Multi-region routing and failover.",
    "Non-HTTP endpoints and simple geo routing.",
    "Needs for instant failover or L7 features.",
    "Create a profile, add endpoints, pick a routing method, and set probes.",
    "Pros: simple. Cons: DNS caching.",
    "Front Door, Route 53."
  ],
  "Azure Bastion": [
    "Bastion gives secure RDP and SSH to VMs through the portal over TLS without public IPs.",
    "A managed jump host service.",
    "Exposed management ports are risky.",
    "Admin access to private VMs.",
    "Environments with no VMs.",
    "Deploy into AzureBastionSubnet and connect from the portal.",
    "Pros: secure. Cons: cost.",
    "VPN, jump boxes."
  ],
  "Service Bus": [
    "Service Bus is the enterprise message broker with queues, topics, sessions, dead-lettering and transactions. I make consumers idempotent and use Spring Cloud Azure or JMS.",
    "A managed broker with queues and topic subscriptions.",
    "Synchronous calls couple services and spikes overload them.",
    "Reliable business messaging, ordering and workflows.",
    "High-volume streaming, where Event Hubs fits.",
    "Create a namespace, queues and topics, send and receive with ServiceBusClient, configure max delivery count and DLQ.",
    "Pros: rich features. Cons: cost, throughput limits compared with streams.",
    "Event Hubs, Event Grid, SQS and SNS elsewhere."
  ],
  "Event Hubs": [
    "Event Hubs is a high-throughput streaming platform with a Kafka-compatible endpoint, for telemetry and log ingestion.",
    "A partitioned event stream with consumer groups.",
    "Ingest millions of events per second.",
    "Telemetry, clickstreams, big data feeds.",
    "Command messaging with per-message ack.",
    "Create a hub with partitions, send with EventHubProducerClient, consume with EventProcessorClient and checkpoints.",
    "Pros: scale. Cons: partition design, ordering per partition.",
    "Kafka, Kinesis, Service Bus."
  ],
  "Event Grid": [
    "Event Grid routes lightweight reactive events from Azure services and custom topics to handlers like Functions.",
    "A push-based event routing service.",
    "React to changes without polling.",
    "Blob created, resource change, custom events.",
    "Streaming or ordered messaging.",
    "Create a topic or system topic, add subscriptions with filters, and handle webhooks.",
    "Pros: simple, serverless. Cons: at-least-once, limited replay.",
    "Service Bus, EventBridge."
  ],
  "Logic Apps": [
    "Logic Apps is low-code workflow automation with many connectors, good for integration, while complex logic belongs in Java.",
    "A visual workflow service with triggers and actions.",
    "Integrations need glue without custom code.",
    "SaaS and enterprise system integration.",
    "Complex business logic or high throughput.",
    "Design a workflow, add a trigger and connectors, and deploy via ARM or Bicep.",
    "Pros: fast to build. Cons: hard to test and version.",
    "Functions, Power Automate, Step Functions."
  ],
  "API Management": [
    "API Management is the API gateway for publishing, securing and monitoring APIs using policies for rate limits, JWT validation and caching, plus a developer portal.",
    "A gateway, management plane and portal.",
    "Cross-cutting API concerns should be centralised.",
    "Public and partner APIs, API productisation.",
    "Small internal APIs.",
    "Import an OpenAPI spec, apply policies, create products and subscriptions, and publish.",
    "Pros: rich features. Cons: cost, policy learning curve.",
    "Spring Cloud Gateway, Kong, AWS API Gateway, Apigee."
  ],
  "Azure Synapse Analytics": [
    "Synapse combines data warehousing, Spark and data integration; I know Fabric is now overlapping it.",
    "An analytics workspace with SQL pools and Spark.",
    "Unify analytics tooling.",
    "Large analytical SQL and Spark workloads.",
    "OLTP use.",
    "Create a workspace, load data from the lake, and query with serverless SQL or Spark.",
    "Pros: unified. Cons: complexity, evolving into Fabric.",
    "Databricks, Snowflake, Redshift, BigQuery."
  ],
  "Azure Data Factory": [
    "Data Factory is the managed ETL and orchestration service with pipelines and connectors.",
    "A pipeline service with datasets and activities.",
    "Moving data between systems manually is fragile.",
    "Scheduled ETL and data movement.",
    "Real-time streaming.",
    "Create linked services, build pipelines, and trigger on schedule or events.",
    "Pros: many connectors. Cons: debugging experience.",
    "Airflow, Glue, Fabric pipelines."
  ],
  "Azure Databricks": [
    "Databricks is a managed Spark platform for big data and ML; I interact via jobs and data in storage.",
    "A collaborative Spark environment on Azure.",
    "Running Spark is complex.",
    "Large transformations, ML.",
    "Small data.",
    "Create a workspace, attach clusters, run notebooks or jobs, and use Delta tables.",
    "Pros: powerful. Cons: cost.",
    "Synapse Spark, EMR."
  ],
  "HDInsight": [
    "HDInsight is managed Hadoop, Spark and Kafka clusters, mostly legacy now.",
    "Managed open source big data clusters.",
    "Hadoop is hard to operate.",
    "Existing Hadoop workloads.",
    "New projects.",
    "Provision a cluster type and submit jobs.",
    "Pros: familiar. Cons: dated.",
    "Databricks, Fabric."
  ],
  "Stream Analytics": [
    "Stream Analytics runs SQL-like queries on streaming data from Event Hubs or IoT Hub for windowed aggregations.",
    "A managed real-time analytics engine.",
    "Avoid writing Spark or Flink code.",
    "Simple streaming aggregations.",
    "Complex custom logic.",
    "Define inputs, a query with windows, and outputs.",
    "Pros: easy. Cons: limited flexibility.",
    "Databricks streaming, Flink, Dataflow."
  ],
  "Microsoft Fabric": [
    "Fabric is Microsoft's unified analytics SaaS platform on OneLake, mainly relevant to data teams.",
    "A single platform for data engineering, warehouse, real-time and BI.",
    "Fragmented analytics tools.",
    "Microsoft-centric analytics.",
    "Non-data application work.",
    "Create a workspace, use lakehouses and pipelines.",
    "Pros: integrated. Cons: young, capacity pricing.",
    "Databricks, Snowflake."
  ],
  "Power BI": [
    "Power BI is Microsoft's BI and dashboard tool. For analysts; I know the integration points.",
    "A BI and visualisation service.",
    "Self-service reporting.",
    "Business dashboards.",
    "Custom application UIs.",
    "Connect datasets, build reports, and publish.",
    "Pros: popular. Cons: licensing.",
    "Tableau, Looker, QuickSight."
  ],
  "Azure OpenAI Service": [
    "Azure OpenAI gives access to OpenAI models with Azure's enterprise controls. I call it from Java via SDK or Spring AI and manage quotas, latency and cost.",
    "Hosted OpenAI models behind Azure endpoints with private networking and content filtering.",
    "Enterprises need LLMs with compliance and data controls.",
    "Chat, summarisation, embeddings, RAG.",
    "Deterministic logic.",
    "Create a resource, deploy a model, call it with the Azure OpenAI client and Entra authentication, and add Azure AI Search for retrieval.",
    "Pros: enterprise features. Cons: token cost, quotas, non-determinism.",
    "Bedrock, Vertex AI, direct OpenAI."
  ],
  "Azure Machine Learning": [
    "Azure Machine Learning trains, tracks and deploys models; I consume deployed endpoints from Java services.",
    "An ML platform with pipelines and managed endpoints.",
    "Operationalising ML is hard.",
    "Teams building custom models.",
    "Prebuilt API needs.",
    "Train in a workspace, register a model, and deploy to a managed endpoint.",
    "Pros: end-to-end. Cons: complexity.",
    "SageMaker, Vertex AI."
  ],
  "Azure AI Search": [
    "Azure AI Search is managed search with full-text, vector and hybrid search, the retrieval layer for RAG apps.",
    "A search service with indexes and skillsets.",
    "Database search is weak.",
    "Search and RAG.",
    "Primary storage.",
    "Define an index, ingest documents with an indexer, and query with the Java SDK.",
    "Pros: managed. Cons: cost, index design.",
    "OpenSearch, Elasticsearch."
  ],
  "Azure AI Services": [
    "Azure AI Services bundles prebuilt APIs for vision, language and speech, called via REST or SDKs.",
    "Prebuilt AI endpoints.",
    "Training models is costly.",
    "Adding intelligence quickly.",
    "Highly specialised models.",
    "Create a resource, get an endpoint and key or identity, and call the API.",
    "Pros: fast. Cons: generic models.",
    "AWS AI services, Google AI APIs."
  ],
  "Azure AI Document Intelligence": [
    "Document Intelligence extracts text, tables and fields from documents using prebuilt or custom models, like Textract.",
    "A document analysis service.",
    "Manual data entry.",
    "Invoices, receipts, forms.",
    "Unusual layouts without training.",
    "Call the analyze API with a document and read the structured result.",
    "Pros: structured output. Cons: cost.",
    "Textract, Document AI."
  ],
  "Azure AI Speech": [
    "Azure AI Speech provides speech-to-text, text-to-speech and translation via SDK.",
    "A managed speech service.",
    "Building speech models is hard.",
    "Voice features and transcription.",
    "Offline-only needs.",
    "Use the Speech SDK with a key or identity.",
    "Pros: easy. Cons: per-use cost.",
    "Transcribe and Polly, Google Speech."
  ],
  "Azure Bot Service": [
    "Azure Bot Service hosts bots built with the Bot Framework and connects them to channels like Teams, a niche area for backend developers.",
    "A bot hosting and channel registration service.",
    "Connect bots to many channels.",
    "Teams bots and customer service.",
    "LLM-first chat apps with other frameworks.",
    "Build with Bot Framework, register the bot, and deploy.",
    "Pros: channel reach. Cons: framework changes.",
    "Lex, Dialogflow."
  ],
  "Microsoft Entra ID": [
    "Entra ID, formerly Azure AD, is Microsoft's cloud identity provider. I secure Spring Boot APIs as resource servers validating its JWTs and use managed identities so apps need no secrets.",
    "A directory with users, groups, app registrations, OAuth2 and OIDC, conditional access and MFA.",
    "Centralised identity and SSO are essential.",
    "Every Azure and Microsoft 365 environment.",
    "Consumer identity at large scale (use External ID).",
    "Register an app, configure scopes and roles, set spring.security.oauth2.resourceserver.jwt.issuer-uri, use managed identity for Azure resources.",
    "Pros: integrated, secure. Cons: complexity, licensing tiers.",
    "Okta, Auth0, Keycloak, AWS IAM Identity Center."
  ],
  "Key Vault": [
    "Key Vault stores secrets, keys and certificates with RBAC and managed identities. I load secrets at startup, use soft delete and purge protection, and audit access.",
    "A managed vault for secrets, keys and certs.",
    "Secrets in config leak.",
    "Any application with credentials or certificates.",
    "Non-sensitive config, where App Configuration fits.",
    "Create a vault, grant Key Vault Secrets User to the managed identity, load with Spring Cloud Azure or App Service references.",
    "Pros: secure, audited. Cons: throttling and latency.",
    "AWS Secrets Manager, HashiCorp Vault."
  ],
  "Microsoft Defender for Cloud": [
    "Defender for Cloud gives security posture management and threat protection with recommendations and a secure score.",
    "A CSPM and workload protection platform.",
    "Visibility into misconfigurations and threats.",
    "All subscriptions.",
    "Replacement for secure design.",
    "Enable plans, review recommendations, and remediate.",
    "Pros: broad. Cons: cost per plan.",
    "Wiz, Prisma Cloud, Security Hub."
  ],
  "Microsoft Sentinel": [
    "Sentinel is a cloud-native SIEM and SOAR, mostly for security operations teams.",
    "A log analytics-based security platform.",
    "Correlate security data and automate response.",
    "Security operations centres.",
    "Developer-level monitoring.",
    "Connect data sources, enable analytics rules, and build playbooks.",
    "Pros: scalable. Cons: ingestion cost.",
    "Splunk, Chronicle."
  ],
  "Azure Policy": [
    "Azure Policy enforces organisational rules such as allowed regions or required tags and reports compliance.",
    "A rules engine applied via management groups and subscriptions.",
    "Prevent non-compliant resources.",
    "Governance at scale.",
    "Tiny setups.",
    "Assign built-in policies, use deny or audit effects, and remediate.",
    "Pros: central guardrails. Cons: authoring complexity.",
    "AWS SCPs and Config."
  ],
  "DDoS Protection": [
    "Azure DDoS Protection defends public IPs against volumetric attacks with adaptive tuning, typically enabled by the platform team.",
    "Enhanced DDoS mitigation for VNets.",
    "Volumetric attacks.",
    "Internet-facing production.",
    "Internal-only workloads.",
    "Enable the plan on the VNet and monitor metrics.",
    "Pros: strong protection. Cons: cost.",
    "Cloudflare, Shield."
  ],
  "Private Link": [
    "Private Link exposes PaaS services such as storage, SQL or Key Vault on a private IP in my VNet via private endpoints, with private DNS.",
    "Private endpoints mapping services into a VNet.",
    "Traffic should not traverse the public internet.",
    "Locked-down enterprise designs.",
    "Simple dev setups.",
    "Create a private endpoint, link a private DNS zone, and disable public access.",
    "Pros: strong isolation. Cons: DNS complexity, cost.",
    "Service endpoints, firewall rules."
  ],
  "Azure Role-Based Access Control": [
    "Azure RBAC grants access by assigning roles to identities at a scope. I follow least privilege, assign to groups and managed identities.",
    "Role assignments at management group, subscription, resource group or resource level.",
    "Fine-grained access control.",
    "All Azure resources.",
    "Not a replacement for Entra directory roles.",
    "Choose built-in roles, assign at the lowest scope, and review regularly.",
    "Pros: granular. Cons: sprawl.",
    "AWS IAM, GCP IAM."
  ],
  "Azure Monitor": [
    "Azure Monitor is the observability platform for metrics, logs and traces with alerts and dashboards. I use diagnostic settings, KQL and actionable alerts.",
    "A metrics and logs platform with alert rules.",
    "Operating production blind causes outages.",
    "All workloads.",
    "Deep APM beyond its scope.",
    "Enable diagnostic settings to Log Analytics, create metric and log alerts with action groups, and build workbooks.",
    "Pros: native. Cons: log cost.",
    "Datadog, Prometheus and Grafana."
  ],
  "Log Analytics": [
    "Log Analytics is the workspace that stores logs, queried with KQL; I set retention to control cost.",
    "A log store and query engine.",
    "Centralised log search.",
    "All Azure telemetry.",
    "Long-term archives.",
    "Create a workspace, send logs, and write KQL queries.",
    "Pros: powerful query. Cons: ingestion cost.",
    "OpenSearch, Splunk."
  ],
  "Application Insights": [
    "Application Insights is APM for requests, dependencies, exceptions and traces. I attach the Java agent with no code change.",
    "An APM service within Azure Monitor.",
    "Find slow dependencies and failures.",
    "Every production app.",
    "Not a log archive.",
    "Attach the applicationinsights Java agent, configure sampling, and use the application map and failures views.",
    "Pros: easy. Cons: cost at high volume.",
    "Datadog, New Relic, OpenTelemetry."
  ],
  "Azure Resource Manager": [
    "Azure Resource Manager is the deployment and management layer behind every Azure operation. I deploy with Bicep, ARM or Terraform.",
    "An API layer with resource groups, tags, locks and templates.",
    "Consistent, repeatable infrastructure.",
    "All Azure infrastructure.",
    "Multi-cloud IaC needs, where Terraform fits.",
    "Write Bicep, deploy with az deployment, and use what-if.",
    "Pros: native. Cons: verbose.",
    "Terraform, Pulumi, CloudFormation."
  ],
  "Azure Automation": [
    "Azure Automation runs runbooks for operational tasks like scheduled VM actions, mainly an operations tool.",
    "A runbook and configuration service.",
    "Automate routine ops.",
    "Scheduled ops tasks.",
    "App logic.",
    "Create a runbook and schedule.",
    "Pros: simple. Cons: dated.",
    "Functions, Logic Apps."
  ],
  "Azure Advisor": [
    "Azure Advisor gives recommendations on reliability, security, performance, cost and operations.",
    "A recommendations engine.",
    "Find improvements.",
    "Periodic reviews.",
    "Sole governance.",
    "Review recommendations and act.",
    "Pros: easy. Cons: generic.",
    "Trusted Advisor."
  ],
  "Cost Management": [
    "Cost Management analyses spend, sets budgets and alerts, and supports tagging for chargeback.",
    "A cost analysis and budgeting service.",
    "Cloud bills grow silently.",
    "Ongoing FinOps.",
    "Detailed custom reporting.",
    "Create budgets with alerts, use tags, and export cost data.",
    "Pros: native. Cons: limited depth.",
    "Third-party FinOps tools."
  ],
  "Azure Arc": [
    "Azure Arc extends Azure management to servers and Kubernetes clusters on-premises or in other clouds.",
    "A control plane projecting external resources into Azure.",
    "Unified governance across environments.",
    "Hybrid and multi-cloud.",
    "Azure-only.",
    "Connect machines or clusters with the Arc agent.",
    "Pros: unified management. Cons: setup effort.",
    "Anthos, Rancher."
  ],
  "Azure DevOps": [
    "Azure DevOps is a suite with Boards, Repos, Pipelines and Artifacts. I build YAML pipelines for Maven builds and deployments.",
    "An ALM platform.",
    "Integrated work tracking and CI/CD.",
    "Enterprises on Microsoft tooling.",
    "Teams on GitHub-first workflows.",
    "Create a project, repos, and pipelines.",
    "Pros: integrated. Cons: less momentum than GitHub.",
    "GitHub, GitLab."
  ],
  "Azure Pipelines": [
    "Azure Pipelines is CI/CD with YAML multi-stage pipelines on hosted or self-hosted agents. I build and test Java, publish artifacts and deploy with approvals.",
    "A pipeline service with stages, jobs and tasks.",
    "Automate build and release.",
    "Azure-centred delivery.",
    "GitHub Actions-only shops.",
    "Write azure-pipelines.yml with Maven tasks, publish artifacts, and deploy to environments with checks.",
    "Pros: powerful. Cons: YAML complexity.",
    "GitHub Actions, Jenkins."
  ],
  "Azure Artifacts": [
    "Azure Artifacts hosts private feeds for Maven, npm, NuGet and Python, which I use for internal Java libraries.",
    "A package management service.",
    "Private package hosting.",
    "Internal libraries.",
    "Public-only dependencies.",
    "Create a feed, configure Maven settings, and publish.",
    "Pros: integrated. Cons: Azure DevOps dependence.",
    "Artifactory, Nexus, CodeArtifact."
  ],
  "Azure Load Testing": [
    "Azure Load Testing is a managed service that runs JMeter-based load tests to validate performance and catch regressions.",
    "A managed load generation service.",
    "Know performance limits before release.",
    "Pre-release and pipeline checks.",
    "Tiny apps.",
    "Upload a JMeter script, set load and fail criteria, and run from the pipeline.",
    "Pros: scales. Cons: cost.",
    "Gatling, k6, self-hosted JMeter."
  ]
};
