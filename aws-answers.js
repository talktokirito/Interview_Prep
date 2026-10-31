// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives]
const SERVICE_ANSWERS = {
  "EC2": [
    "EC2 is AWS's virtual machine service. I use it when I need full OS and JVM control, put it in Auto Scaling groups behind a load balancer, give it IAM roles instead of keys, and mix On-Demand, Reserved and Spot to control cost.",
    "Resizable virtual servers (instances) launched from AMIs, with instance types, EBS storage, security groups and a VPC placement. The flow is: AMI -> instance -> security group -> load balancer.",
    "Running our own servers means capex, long lead times and poor elasticity. EC2 gives capacity in minutes, paid per second.",
    "Lift-and-shift migrations, workloads needing OS-level tuning, licensed software, long-running stateful processes, or large JVM heaps that do not fit serverless limits.",
    "Small stateless services where containers or Lambda cut ops work, or spiky workloads where idle VMs waste money. Patching and AMI upkeep become toil.",
    "Pick the instance family by workload (compute or memory optimised), bake an AMI with the JAR, define a launch template, attach an Auto Scaling group and ALB, and set -XX:MaxRAMPercentage so the heap fits the instance. Use an instance profile for AWS access.",
    "Pros: maximum control, wide instance choice, Savings Plans and Spot discounts. Cons: you own patching, scaling policy and capacity planning, and it is the most operationally heavy compute option.",
    "ECS/EKS with Fargate (less ops, less control), Lambda (event driven, short tasks), Elastic Beanstalk (managed wrapper). EC2 wins when control or licensing matters."
  ],
  "Lambda": [
    "Lambda runs code on events with no servers and per-millisecond billing. For Java the issue is cold start, solved with SnapStart, native images, lighter frameworks or provisioned concurrency.",
    "A function-as-a-service runtime triggered by events such as API Gateway, SQS, S3 or schedules. Flow: event source -> Lambda handler -> downstream services.",
    "Idle servers cost money and scaling needs management. Lambda scales per request and charges only for execution time.",
    "Event processing, glue code, spiky or low-volume APIs, scheduled jobs, and fan-out from queues or streams where each run is under 15 minutes.",
    "Long-running jobs, steady high-throughput services where always-on containers are cheaper, latency-critical paths that cannot tolerate cold starts, or heavy Spring apps with big startup cost.",
    "Implement RequestHandler, keep the SDK clients static to reuse across invocations, enable SnapStart for faster restores, set memory (which also sets CPU), and use reserved concurrency to protect downstream databases. Deploy through SAM or CDK.",
    "Pros: no ops, scales to zero, pay per use. Cons: cold starts, 15-minute limit, connection management to databases, harder local debugging, and cost can exceed containers at constant load.",
    "Fargate/ECS (containers without servers, steady load), EC2 (full control), Step Functions (orchestration). Lambda wins for bursty event-driven work."
  ],
  "Elastic Beanstalk": [
    "Beanstalk is a PaaS: upload a JAR or WAR and it provisions EC2, load balancing, scaling and monitoring. Fast to start, but I prefer ECS or EKS with infrastructure as code for serious systems.",
    "A managed deployment layer that creates and wires EC2, ALB, Auto Scaling and CloudWatch from an application bundle.",
    "Teams wanted to deploy apps without learning every underlying AWS service.",
    "Small teams, quick prototypes, or legacy WAR deployments that need to move to AWS with little change.",
    "Large microservice platforms, teams needing fine control or container-first workflows, since the abstraction gets in the way.",
    "Create an application and environment, upload the Spring Boot JAR, choose the Java platform, set environment properties, and use rolling or blue-green deployments. Customise via .ebextensions.",
    "Pros: very low setup effort, still runs on your EC2. Cons: limited flexibility, slower innovation than container services, and drift if people edit resources manually.",
    "ECS/Fargate (container-based, more modern), App Runner (simpler for containers), EC2 plus CloudFormation (full control)."
  ],
  "Lightsail": [
    "Lightsail is a simple VPS with fixed monthly pricing. Fine for small sites and demos, but I would not use it for production enterprise Java.",
    "A simplified bundle of a small VM, storage, networking and static IP with predictable pricing.",
    "Make cloud hosting approachable for people who do not want to design VPCs and IAM.",
    "Personal projects, small WordPress or demo sites, learning environments.",
    "Anything needing auto scaling, private networking, compliance controls or deep AWS integration.",
    "Pick a blueprint and plan, attach a static IP, open firewall ports, and deploy the JAR via SSH or a container service.",
    "Pros: simple and cheap. Cons: limited features and scaling, awkward to integrate into a larger AWS architecture.",
    "EC2 (more power and flexibility), App Runner (managed web service), or other VPS providers for cheap hosting."
  ],
  "Batch": [
    "AWS Batch runs batch jobs as containers, managing queues and compute. I use it with Spot capacity for large offline jobs where I only pay while they run.",
    "A managed batch scheduler: job definitions, job queues and compute environments on EC2 or Fargate.",
    "Running our own batch cluster means managing schedulers and wasted idle capacity.",
    "Large data processing, nightly or periodic jobs, simulations, or any containerised job that can be parallelised and retried.",
    "Low-latency request/response work, or small jobs that fit a Lambda or a scheduled ECS task.",
    "Package the Java job in a container, push it to ECR, create a job definition with vCPU and memory, submit jobs to a queue (array jobs for parallelism), and use Spot with retries.",
    "Pros: cost efficient, automatic scaling, built-in retries. Cons: queue latency, container packaging required, and debugging is slower than local runs.",
    "Step Functions plus Lambda (small steps), EMR or Glue (big data frameworks), ECS scheduled tasks (simple recurring jobs)."
  ],
  "Outposts": [
    "Outposts runs AWS infrastructure in your own data centre for low latency or data residency needs. It is a niche, costly commitment I would only recommend for specific hybrid cases.",
    "AWS-owned racks installed on premises that expose the same APIs and services as a region.",
    "Some workloads must stay local for latency or regulation but teams want a consistent AWS experience.",
    "Factory floors, trading systems, healthcare or telecom with local processing and data residency rules.",
    "Normal cloud-friendly workloads, small teams, or anywhere the hardware and facility costs are not justified.",
    "Order a rack, connect it to a parent region over a service link, extend a VPC to it, and launch EC2, EBS or ECS on it like in the region.",
    "Pros: consistent APIs, local processing. Cons: high cost, long lead times, dependence on the parent region connection.",
    "Local Zones or Wavelength (closer edge capacity without hardware), or standard on-prem plus Direct Connect."
  ],
  "ECS": [
    "ECS is AWS's native container orchestrator. I define a task definition, run it as a service on Fargate or EC2 behind an ALB, and use task roles. It is simpler than Kubernetes and my default when we do not need the Kubernetes ecosystem.",
    "A container scheduler with clusters, task definitions, services and capacity providers. Flow: image in ECR -> task definition -> service -> ALB.",
    "Running containers at scale needs placement, health checks, scaling and rollout handling.",
    "Java microservices on AWS where the team wants containers with minimal operational overhead and tight AWS integration.",
    "When portability across clouds or Kubernetes tooling (Helm, operators, service mesh) is required.",
    "Build the image, push to ECR, register a task definition with CPU, memory, env and a task role, create a service with desired count and deployment circuit breaker, attach it to a target group, and add target tracking autoscaling.",
    "Pros: simple, deep AWS integration, no control plane cost. Cons: AWS-specific, smaller ecosystem than Kubernetes.",
    "EKS (portable, richer ecosystem, more complexity), Fargate-only options like App Runner (even simpler), Lambda (functions rather than containers)."
  ],
  "EKS": [
    "EKS is managed Kubernetes on AWS. I choose it when the team knows Kubernetes or needs the ecosystem and portability, using IRSA for pod permissions and tuning JVM limits in containers.",
    "AWS runs the Kubernetes control plane while worker nodes run as managed node groups, self-managed nodes or Fargate.",
    "Kubernetes is powerful but operating the control plane is hard and risky.",
    "Large microservice estates, platform teams, multi-cloud portability goals, or teams that depend on Helm, operators and service meshes.",
    "Small teams or a handful of services, where Kubernetes complexity and the cluster fee outweigh benefits.",
    "Create the cluster with eksctl or Terraform, add node groups, install the load balancer controller, deploy with Helm or manifests, set resource requests and limits so the JVM sees correct memory, add HPA and probes, and use IRSA for IAM.",
    "Pros: standard Kubernetes, huge ecosystem, flexible. Cons: steep learning curve, upgrade burden, control plane cost, more to secure.",
    "ECS (simpler, AWS-only), Fargate-based ECS (no nodes), Lambda (serverless). EKS wins when Kubernetes skills and portability matter."
  ],
  "Fargate": [
    "Fargate is serverless compute for containers: I specify CPU and memory per task and AWS manages the servers. It removes node patching, at a higher unit price.",
    "A launch type for ECS and EKS where each task runs in its own isolated micro-VM with no EC2 nodes to manage.",
    "Managing and right-sizing container host instances is undifferentiated work.",
    "Teams wanting to run containers without infrastructure management, variable workloads, and security isolation per task.",
    "Very steady, high-density workloads where well-packed EC2 is cheaper, or workloads needing GPUs, special kernels or host access.",
    "Choose launch type FARGATE in the ECS service or a Fargate profile in EKS, set task CPU and memory, use awsvpc networking with a security group, and send logs to CloudWatch.",
    "Pros: no servers to manage, per-second billing, strong isolation. Cons: higher cost at scale, slower startup than warm nodes, fewer host options.",
    "ECS/EKS on EC2 (cheaper at scale, more control), Lambda (functions), App Runner (simplest)."
  ],
  "ECR": [
    "ECR is the managed private container registry. I push images from CI, enable scanning and lifecycle policies, and let ECS or EKS pull via IAM.",
    "A registry for Docker and OCI images and Helm charts, with repositories, tags and IAM-based access.",
    "Running our own registry means managing storage, availability and security.",
    "Any AWS container workload, since it integrates with ECS, EKS, Lambda containers and CodeBuild.",
    "Multi-cloud setups that standardise on another registry, or when public images are enough.",
    "Create a repository, authenticate with aws ecr get-login-password, push the image from the pipeline, enable scan on push, and add lifecycle rules to expire old tags.",
    "Pros: managed, secure, close to compute. Cons: AWS-specific, storage and transfer charges.",
    "Docker Hub, GitHub Container Registry, Artifactory or Harbor (more features, multi-cloud)."
  ],
  "App Runner": [
    "App Runner deploys a container or source repo as a web service with scaling, load balancing and TLS handled. It is the quickest way to run a simple Spring Boot API.",
    "A fully managed service that builds or pulls your app and runs it behind an HTTPS endpoint with autoscaling.",
    "ECS and load balancer setup is too much for small web services.",
    "Small APIs and internal tools, prototypes, teams without platform expertise.",
    "Complex networking, sidecars, large fleets or workloads needing fine tuning.",
    "Point it at an ECR image or GitHub repo, set port, CPU and memory, configure env vars and a health check, and enable auto deployments.",
    "Pros: minimal ops, quick. Cons: less control and fewer features than ECS or EKS.",
    "ECS on Fargate (more control), Elastic Beanstalk (older PaaS), Lambda (functions)."
  ],
  "S3": [
    "S3 is durable object storage with eleven nines durability. I use it for files, backups, static sites and data lakes, with storage classes and lifecycle rules for cost, encryption, block public access, and pre-signed URLs for uploads.",
    "A flat key-based object store organised in buckets, accessed over HTTPS APIs. Flow: client -> pre-signed URL or SDK -> bucket -> lifecycle tier.",
    "File systems and databases are poor and costly for large unstructured data, and scaling them is hard.",
    "Static assets, user uploads, logs, backups, data lake storage, artifacts and event triggers.",
    "Low-latency random read-write block access, transactional data, or workloads needing POSIX file semantics.",
    "Use AWS SDK v2: S3Client.putObject with RequestBody, multipart upload for big files, pre-signed URLs for direct browser upload, bucket policy with block public access, default SSE-KMS encryption, versioning, and lifecycle rules to Glacier.",
    "Pros: durable, cheap, scalable, strong consistency. Cons: not a file system, request costs, small-object overhead, careful permissions needed to avoid leaks.",
    "EFS or EBS (file and block), DynamoDB (small structured items), Glacier tiers (cold archive). S3 wins for objects at scale."
  ],
  "EBS": [
    "EBS is network block storage for EC2, like a persistent disk. I pick gp3 by default, io2 for heavy IOPS, and use snapshots for backup.",
    "Block volumes attached to a single instance in one availability zone, independent of instance lifecycle.",
    "Instance store is lost when the instance stops; workloads need durable disks.",
    "Root volumes, self-managed databases on EC2, and workloads needing consistent IOPS.",
    "Shared storage across instances (use EFS), or very large archival data (use S3).",
    "Create a volume with type, size and IOPS, attach it, mount it, enable encryption, schedule snapshots through Data Lifecycle Manager, and monitor burst and queue depth.",
    "Pros: durable, snapshots, tunable performance. Cons: tied to one AZ, one writer, you pay for provisioned size.",
    "EFS (shared files), S3 (objects), instance store (fast but ephemeral)."
  ],
  "EFS": [
    "EFS is managed elastic NFS shared across instances and AZs. I use it when multiple services need a shared file system, accepting higher latency than local disk.",
    "A scalable NFSv4 file system that mounts on EC2, ECS, EKS and Lambda.",
    "Sharing files between servers otherwise needs self-managed NFS.",
    "Shared content, home directories, CMS media, and containers needing persistent shared volumes.",
    "Latency-sensitive databases, or when object storage would do.",
    "Create a file system with mount targets in each AZ, secure with security groups, mount with the EFS helper using TLS, and choose throughput mode and lifecycle to Infrequent Access.",
    "Pros: elastic, shared, no capacity planning. Cons: higher latency and cost than EBS, throughput tuning.",
    "S3 (objects), EBS (single-instance block), FSx (specialised file systems)."
  ],
  "FSx": [
    "FSx provides managed specialised file systems such as Windows File Server, Lustre, NetApp ONTAP and OpenZFS. I use it when an app needs a specific protocol like SMB.",
    "Managed third-party file system engines running on AWS.",
    "Some workloads depend on SMB, Lustre performance or NetApp features that EFS does not offer.",
    "Windows file shares, high performance computing, and migrations from NetApp.",
    "Typical cloud-native Java services, which are better served by S3 or EFS.",
    "Choose the FSx type, deploy it in the VPC, join it to Active Directory if needed, and mount it over SMB, NFS or the Lustre client.",
    "Pros: protocol and feature compatibility, high performance. Cons: more expensive, specific to the engine.",
    "EFS (simple NFS), S3 (objects), self-managed file servers on EC2."
  ],
  "S3 Glacier": [
    "Glacier storage classes are for archives that are rarely read. I use lifecycle rules to move old logs and backups there automatically for compliance and savings.",
    "Low-cost S3 storage classes (Instant Retrieval, Flexible Retrieval, Deep Archive) with different retrieval times.",
    "Keeping years of data in Standard is wasteful.",
    "Compliance archives, backups, old logs and media you must keep but rarely read.",
    "Data accessed frequently or needing immediate millisecond reads.",
    "Add a lifecycle rule transitioning objects after N days, use Vault Lock or Object Lock for retention, and plan retrieval time and fees.",
    "Pros: very cheap storage. Cons: retrieval delay and fees, minimum storage duration.",
    "S3 Standard-IA or Intelligent-Tiering (easier access), or external tape archives."
  ],
  "Storage Gateway": [
    "Storage Gateway connects on-premises systems to AWS storage via file, volume or tape interfaces. Useful in hybrid migrations, rarely touched by cloud-native Java services.",
    "A hybrid appliance or VM presenting NFS, SMB, iSCSI or virtual tape backed by S3, EBS snapshots or Glacier.",
    "On-prem apps cannot speak the S3 API directly.",
    "Hybrid backup, gradual migrations, and extending on-prem file shares to AWS.",
    "Cloud-native apps, which can use S3 directly.",
    "Deploy the gateway VM, activate it, create a file share or volume mapped to a bucket, and mount it from on-prem clients.",
    "Pros: easy hybrid bridge, local caching. Cons: extra component to run, limited throughput.",
    "DataSync (bulk transfer), direct S3 SDK usage, or Transfer Family (SFTP)."
  ],
  "RDS": [
    "RDS is managed relational databases with backups, patching, Multi-AZ failover and read replicas. I pair it with HikariCP, tune parameter groups and consider RDS Proxy for bursty connections.",
    "A managed service for engines such as PostgreSQL, MySQL, Oracle and SQL Server. Flow: app -> pool -> primary (Multi-AZ standby) -> read replicas.",
    "Running databases yourself costs DBA time for backups, failover and patches.",
    "Standard transactional workloads that need relational features and a familiar engine.",
    "Extreme scale or very spiky serverless workloads that do better on Aurora or DynamoDB, or when you need OS-level access.",
    "Create an instance with Multi-AZ, put it in private subnets, configure a subnet and security group, connect via JDBC with HikariCP sized to max_connections, enable automated backups and Performance Insights, and use read replicas for read scaling.",
    "Pros: less ops, high availability, easy backups. Cons: limited superuser access, vertical scaling limits, cost, and replica lag.",
    "Aurora (more performant and available), DynamoDB (NoSQL scale), self-managed on EC2 (full control)."
  ],
  "Aurora": [
    "Aurora is AWS's cloud-native MySQL and PostgreSQL compatible database with shared storage across three AZs and fast failover. My default for demanding relational workloads on AWS.",
    "A distributed storage layer with a writer and up to fifteen readers, compatible with MySQL and PostgreSQL.",
    "Standard engines are limited by single-node storage and slow failover.",
    "High-availability OLTP, read-heavy systems with many replicas, and variable load with Serverless v2.",
    "Small, low-traffic databases where RDS is cheaper, or when you rely on engine features Aurora does not support.",
    "Create a cluster with writer and readers, use the cluster and reader endpoints from Java with HikariCP, enable backtrack or global database if needed, and use Serverless v2 for elastic capacity.",
    "Pros: performance, availability, fast failover, scaling reads. Cons: higher cost, AWS lock-in, I/O pricing considerations.",
    "RDS (cheaper, simpler), DynamoDB (NoSQL), Spanner or Cosmos DB on other clouds."
  ],
  "DynamoDB": [
    "DynamoDB is a managed key-value and document NoSQL database with single-digit millisecond latency at any scale. The skill is designing partition keys and access patterns up front.",
    "A serverless table store with partition and sort keys, secondary indexes and streams.",
    "Relational databases struggle to scale writes horizontally and need capacity management.",
    "High-scale, predictable access patterns, session and cart data, IoT, and serverless backends.",
    "Ad hoc queries, complex joins and reporting, or when access patterns are unknown.",
    "Model access patterns first, choose partition and sort keys to avoid hot partitions, add GSIs, use the Enhanced Client in the Java SDK, enable TTL and on-demand capacity, and use Streams for change events.",
    "Pros: massive scale, no ops, low latency. Cons: rigid modelling, limited querying, cost surprises with poor keys.",
    "Aurora or RDS (relational flexibility), MongoDB or DocumentDB (flexible documents), Cassandra or Keyspaces."
  ],
  "ElastiCache": [
    "ElastiCache is managed Redis, Valkey and Memcached for caching. I use cache-aside with TTLs for hot reads, sessions and rate limiting.",
    "An in-memory data store deployed as a cluster in your VPC.",
    "Databases are too slow and costly for repeated reads.",
    "Read-heavy workloads, session storage, leaderboards, and rate limiting.",
    "Data that must be strongly consistent and durable, or when working sets are tiny and the DB handles it.",
    "Create a replication group across AZs, connect with Lettuce or Spring Cache, set TTLs and eviction policy, handle cache invalidation and stampede protection, and enable encryption in transit.",
    "Pros: very fast, reduces DB load. Cons: stale data risk, extra infrastructure, invalidation complexity.",
    "MemoryDB (durable Redis), DynamoDB DAX (DynamoDB-specific cache), local Caffeine cache (per-instance)."
  ],
  "MemoryDB": [
    "MemoryDB is a Redis-compatible in-memory database with durable multi-AZ storage, so it can be the primary store, not just a cache.",
    "Redis API with a distributed transaction log providing durability.",
    "Plain Redis caches can lose data on failure.",
    "Workloads needing microsecond reads plus durability, such as real-time leaderboards or session stores of record.",
    "Pure caching, where ElastiCache is cheaper.",
    "Create a cluster with shards and replicas, connect with a Redis client like Lettuce, and enable TLS and ACLs.",
    "Pros: Redis speed with durability. Cons: higher cost than ElastiCache.",
    "ElastiCache (cheaper cache), DynamoDB (durable and serverless)."
  ],
  "DocumentDB": [
    "DocumentDB is a managed document database compatible with the MongoDB API. It suits MongoDB migrations, but I check feature compatibility first.",
    "A MongoDB-compatible service with clustered storage and replicas.",
    "Teams wanted managed MongoDB-style storage on AWS.",
    "Moving existing MongoDB apps with minimal code change.",
    "When full MongoDB features or newest versions are required.",
    "Create a cluster, connect with the MongoDB Java driver over TLS, and design indexes for query patterns.",
    "Pros: managed, compatible, scalable reads. Cons: not full MongoDB parity, AWS lock-in.",
    "MongoDB Atlas (full feature set), DynamoDB (AWS-native NoSQL)."
  ],
  "Neptune": [
    "Neptune is a managed graph database supporting Gremlin, openCypher and SPARQL, for relationship-heavy problems like fraud detection and recommendations.",
    "A graph store with nodes and edges and a high-performance traversal engine.",
    "Deep relationship queries become painful joins in relational databases.",
    "Social graphs, fraud rings, knowledge graphs, recommendations.",
    "Simple tabular data, or where relationships are shallow.",
    "Create a cluster, load data from S3, and query with Gremlin through the TinkerPop Java driver.",
    "Pros: fast traversals. Cons: niche skills, cost, modelling effort.",
    "Neo4j (popular graph DB), relational recursive queries, OpenSearch for search-style needs."
  ],
  "Keyspaces": [
    "Keyspaces is a serverless Cassandra-compatible database, useful when Cassandra apps and drivers already exist.",
    "A managed wide-column store speaking CQL.",
    "Avoid running Cassandra clusters.",
    "Migrating Cassandra workloads or very high write throughput with known key patterns.",
    "New projects with no Cassandra history, where DynamoDB is more native.",
    "Create a keyspace and tables, connect with the DataStax Java driver using TLS and IAM auth.",
    "Pros: no cluster ops. Cons: not all Cassandra features, niche.",
    "DynamoDB (AWS-native), self-managed Cassandra or ScyllaDB."
  ],
  "Timestream": [
    "Timestream is a managed time-series database for metrics and IoT data with built-in retention tiers.",
    "A serverless store optimised for timestamped data, with memory and magnetic tiers.",
    "General databases handle time-series volume poorly.",
    "IoT telemetry, operational metrics and monitoring data.",
    "Typical business data, or when CloudWatch or Prometheus already cover the need.",
    "Create a database and table, set retention, write records with the SDK in batches, and query with SQL-like time functions.",
    "Pros: serverless, time functions. Cons: niche, cost model, availability constraints.",
    "InfluxDB, Prometheus, or CloudWatch metrics."
  ],
  "QLDB": [
    "QLDB was a ledger database with an immutable change history. AWS has ended support, so I would not start new work on it and would use Aurora PostgreSQL with audit tables instead.",
    "A managed, append-only ledger with cryptographic verification of history.",
    "Auditing changes in normal databases is easy to tamper with.",
    "Historically for audit-heavy systems; now only existing ones.",
    "Any new project.",
    "Migrate to Aurora PostgreSQL with an audit table or temporal pattern, or use a purpose-built ledger solution.",
    "Pros: immutability. Cons: end of support, limited ecosystem.",
    "Aurora PostgreSQL with audit trails, blockchain frameworks, or S3 with Object Lock."
  ],
  "VPC": [
    "A VPC is the isolated virtual network. I put load balancers in public subnets and apps and databases in private subnets across AZs, using security groups, NAT gateways and VPC endpoints.",
    "A logically isolated network with CIDR ranges, subnets, route tables and gateways.",
    "Workloads need network isolation and control over traffic.",
    "Every AWS deployment, especially multi-tier and regulated applications.",
    "Not optional, but avoid over-complicated multi-VPC designs for small systems.",
    "Design CIDR with room to grow, create public and private subnets in at least two AZs, add an internet gateway and NAT, restrict with security groups and NACLs, and use gateway endpoints for S3 and DynamoDB.",
    "Pros: strong isolation, flexible. Cons: complex to design, NAT costs, hard to change CIDR later.",
    "No real alternative on AWS; connectivity can be via peering, Transit Gateway or PrivateLink."
  ],
  "Route 53": [
    "Route 53 is AWS's DNS with health checks and routing policies. I use alias records, weighted routing for gradual releases, and failover routing for resilience.",
    "A managed authoritative DNS service plus domain registration and health checking.",
    "Self-hosted DNS is hard to keep available and global.",
    "Any public or private domain on AWS, blue-green releases, multi-region failover.",
    "DNS TTL cannot give instant failover, so it is not a substitute for a load balancer.",
    "Create a hosted zone, add alias records to ALB or CloudFront, attach health checks, and use weighted, latency or failover policies.",
    "Pros: reliable, integrated. Cons: DNS caching delays, cost per query.",
    "Cloudflare or other DNS providers, Global Accelerator (IP-based failover)."
  ],
  "CloudFront": [
    "CloudFront is the CDN that caches content at the edge to cut latency and offload the origin. I use it in front of S3 and APIs with TLS, WAF and proper cache policies.",
    "A global network of edge locations with distributions pointing at origins.",
    "Serving everything from one region is slow for distant users and loads the origin.",
    "Static sites, media, and cacheable APIs with a global audience.",
    "Highly personalised, uncacheable traffic with no edge benefit.",
    "Create a distribution with an S3 or ALB origin, use origin access control, set cache policies and TTLs, attach WAF, and invalidate paths on deploy.",
    "Pros: performance, DDoS absorption. Cons: invalidation delays, cache key mistakes, cost.",
    "Cloudflare or Akamai (other CDNs), Global Accelerator (non-cacheable TCP/UDP)."
  ],
  "Elastic Load Balancing": [
    "Elastic Load Balancing spreads traffic across targets. I use ALB for HTTP routing and NLB for layer 4 speed or static IPs, with health checks and connection draining.",
    "Managed load balancers (ALB, NLB, GWLB) distributing across targets in multiple AZs.",
    "Single servers are a failure point and cannot scale.",
    "Any scaled or highly available service.",
    "A single instance dev setup where the cost is unnecessary.",
    "Create an ALB with listeners and rules, register targets in a target group, configure health checks, tune deregistration delay to allow graceful Java shutdown, and terminate TLS with ACM certificates.",
    "Pros: managed, highly available. Cons: cost, ALB idle timeouts, layer 7 limits.",
    "API Gateway (API features), Nginx or HAProxy on EC2, service mesh for internal traffic."
  ],
  "API Gateway": [
    "API Gateway is a managed front door for REST, HTTP and WebSocket APIs handling auth, throttling and caching. Great with Lambda; I choose HTTP APIs for lower cost.",
    "A gateway routing requests to Lambda, HTTP backends or AWS services with built-in authorisation.",
    "Cross-cutting API concerns should not be rebuilt in each service.",
    "Serverless backends, public APIs needing throttling, keys and usage plans.",
    "Very high-throughput simple routing, where an ALB is cheaper, or heavy internal traffic.",
    "Define routes and integrations, add a JWT or Cognito authoriser, set throttling and usage plans, enable stage variables and logging, and deploy via OpenAPI.",
    "Pros: managed, secure, integrates with Lambda. Cons: per-request cost, payload and timeout limits, added latency.",
    "ALB (cheaper HTTP routing), Spring Cloud Gateway or Kong (self-hosted), AppSync (GraphQL)."
  ],
  "Direct Connect": [
    "Direct Connect is a dedicated private link from a data centre to AWS for consistent latency and bandwidth. I pair it with a VPN as backup.",
    "A physical connection between your network and AWS at a Direct Connect location.",
    "Internet links are unpredictable and costly for large data transfer.",
    "Hybrid enterprises, large data migrations, and steady high-volume traffic.",
    "Small or temporary needs, where a VPN suffices.",
    "Order the connection, create virtual interfaces, connect to a virtual private gateway or Transit Gateway, and add VPN failover.",
    "Pros: stable performance, lower data transfer cost. Cons: lead time, cost, and need for redundancy.",
    "Site-to-site VPN (quick and cheap), Transit Gateway with VPN."
  ],
  "Global Accelerator": [
    "Global Accelerator gives static anycast IPs that route users over the AWS backbone to the nearest healthy endpoint, improving global performance and failover.",
    "A networking service with two static IPs fronting regional endpoints.",
    "DNS-based failover is slow and internet paths are inconsistent.",
    "Global TCP/UDP apps, gaming, fast regional failover, static IP requirements.",
    "Cacheable HTTP content, where CloudFront is better.",
    "Create an accelerator, add listeners and endpoint groups for each region, and set health checks and traffic dials.",
    "Pros: fast failover, static IPs. Cons: hourly and data cost.",
    "CloudFront (caching), Route 53 latency routing."
  ],
  "Transit Gateway": [
    "Transit Gateway is a hub connecting many VPCs and on-prem networks, replacing a mesh of peering. I recommend it once the number of networks grows.",
    "A regional router with attachments for VPCs, VPNs and Direct Connect and route tables.",
    "Peering does not scale and is not transitive.",
    "Multi-account, multi-VPC organisations with hybrid connectivity.",
    "Two or three VPCs, where peering is enough.",
    "Create the gateway, attach VPCs, define route tables and segmentation, and share it through Resource Access Manager.",
    "Pros: simple topology at scale. Cons: hourly and data charges, route table design.",
    "VPC peering (cheap, small), PrivateLink (service-level access)."
  ],
  "SQS": [
    "SQS is a managed queue for decoupling services. I design idempotent consumers, use visibility timeouts and dead-letter queues, and choose FIFO when ordering matters.",
    "A message queue with standard (at-least-once) and FIFO (ordered, deduplicated) types. Flow: producer -> queue -> consumers -> DLQ.",
    "Synchronous calls tie services together and spikes overwhelm downstream systems.",
    "Buffering load, async processing, work distribution, and retries.",
    "Pub/sub fan-out (use SNS), streaming replays (use Kinesis), or low-latency RPC.",
    "Create a queue with a DLQ and redrive policy, send with SendMessage, consume with Spring Cloud AWS @SqsListener using long polling, set visibility timeout above processing time, and delete after success.",
    "Pros: simple, durable, scales. Cons: duplicate delivery, limited ordering, message size limit, no replay.",
    "SNS (fan-out), Kinesis or Kafka (streams), Amazon MQ (JMS)."
  ],
  "SNS": [
    "SNS is a pub/sub service that fans messages out to SQS, Lambda, HTTP and email. The usual pattern is SNS to several SQS queues with filter policies.",
    "A topic with many subscribers receiving each published message.",
    "Publishers should not know every consumer.",
    "Event notifications, fan-out, alerts, and mobile push.",
    "Needing replay or ordered streams, or heavy per-consumer buffering without SQS.",
    "Create a topic, subscribe queues with filter policies, publish via SnsClient, and use dead-letter queues on subscriptions.",
    "Pros: easy fan-out, managed. Cons: no replay, delivery retries only, ordering limited to FIFO topics.",
    "EventBridge (richer routing), Kinesis or Kafka (streams), SQS alone (point-to-point)."
  ],
  "EventBridge": [
    "EventBridge is a serverless event bus that routes events from AWS services, SaaS and our own apps by rules, good for event-driven decoupling and schedules.",
    "An event bus with rules matching patterns and delivering to targets, plus a schema registry.",
    "Point-to-point integrations create tight coupling.",
    "Event-driven architectures, cross-account events, scheduled jobs, SaaS integrations.",
    "High-throughput streaming or strict ordering needs.",
    "Create a bus, publish events with a JSON detail, write pattern rules, route to Lambda, SQS or Step Functions, and enable archive and replay.",
    "Pros: decoupled, many integrations. Cons: some latency, schema governance, at-least-once delivery.",
    "SNS (simple fan-out), Kinesis or Kafka (streams), SQS (queues)."
  ],
  "Step Functions": [
    "Step Functions orchestrates workflows as state machines with retries, branching and error handling. I use it for sagas and multi-step processes rather than hand-coding orchestration.",
    "A visual workflow engine defined in Amazon States Language, running steps against AWS services.",
    "Coordinating failures, retries and long-running logic in code is error prone.",
    "Order processing, ETL pipelines, human approvals, saga compensation.",
    "Simple linear tasks that one Lambda handles, or ultra-high-throughput low-latency flows.",
    "Define states (Task, Choice, Parallel, Map), add Retry and Catch, call Lambdas or SDK integrations directly, and choose Standard or Express type.",
    "Pros: visible state, built-in retries. Cons: state transition costs, JSON-based definitions, vendor-specific.",
    "Temporal or Camunda (portable workflow engines), SQS plus Lambda chains."
  ],
  "Amazon MQ": [
    "Amazon MQ is managed ActiveMQ and RabbitMQ, the easy path for existing Java apps using JMS or AMQP.",
    "Managed message brokers with standard protocols.",
    "Migrating legacy brokers without rewriting client code.",
    "Existing JMS-based Java applications moving to AWS.",
    "New cloud-native systems, where SQS and SNS are simpler and cheaper.",
    "Create a broker in private subnets, connect with the JMS client or Spring JMS over TLS, and use active/standby for HA.",
    "Pros: protocol compatibility. Cons: broker sizing and cost, less elastic than SQS.",
    "SQS/SNS (native), Kafka via MSK (streams)."
  ],
  "AppSync": [
    "AppSync is a managed GraphQL and real-time API service, handy for mobile and web clients needing flexible queries and subscriptions.",
    "A GraphQL layer connecting to DynamoDB, Lambda and HTTP sources with resolvers.",
    "Multiple REST calls and over-fetching hurt client performance.",
    "Mobile apps, real-time updates, and aggregating several data sources.",
    "Simple CRUD REST APIs, or Java back ends with an existing GraphQL server.",
    "Define a schema, attach resolvers to data sources, secure with Cognito or API keys, and use subscriptions for real-time updates.",
    "Pros: managed GraphQL, real time. Cons: resolver template learning curve, lock-in.",
    "Spring for GraphQL or Apollo (self-hosted), API Gateway (REST)."
  ],
  "Athena": [
    "Athena runs serverless SQL directly on S3 data, billed per data scanned. I use Parquet, partitioning and the Glue catalog to keep it fast and cheap.",
    "An interactive query engine (Trino-based) over files in S3.",
    "Loading data into a warehouse for occasional queries is costly.",
    "Ad hoc log and data lake analysis.",
    "Low-latency, high-concurrency application queries.",
    "Define tables in the Glue catalog, store data as partitioned Parquet, run queries via console or JDBC, and control cost with partition filters.",
    "Pros: no infrastructure, pay per query. Cons: scan costs, not for OLTP.",
    "Redshift (warehouse), OpenSearch (search), EMR (custom Spark)."
  ],
  "EMR": [
    "EMR is managed big data clusters for Spark, Hadoop and Flink. I use it when jobs need tuning control, with Spot for cost.",
    "Managed clusters running open source big data frameworks.",
    "Standing up Hadoop and Spark yourself is complex.",
    "Large Spark ETL, machine learning pipelines, and legacy Hadoop jobs.",
    "Small jobs, where Glue or Athena is simpler.",
    "Launch a cluster or EMR Serverless, submit Spark jobs (Java or Scala) with data in S3, use Spot for task nodes, and terminate when done.",
    "Pros: flexible and powerful. Cons: tuning effort, cluster costs.",
    "Glue (serverless ETL), Databricks, Athena (SQL)."
  ],
  "Glue": [
    "Glue is serverless ETL plus a data catalog and crawlers. The catalog becomes the shared schema store for Athena and Redshift.",
    "A managed Spark and Python ETL service with a metadata catalog.",
    "Hand-built ETL infrastructure and schema tracking is heavy.",
    "Data lake transformations and cataloguing.",
    "Real-time low-latency processing or tiny jobs.",
    "Create a crawler or define tables, write a Glue job (PySpark or Scala), schedule triggers, and write partitioned Parquet to S3.",
    "Pros: serverless. Cons: startup time, cost per DPU hour, Spark skills.",
    "EMR (control), Airflow (orchestration), dbt (SQL transformations)."
  ],
  "Kinesis": [
    "Kinesis handles real-time streaming. Data Streams is ordered and sharded, Firehose delivers to S3 or Redshift with little code.",
    "Managed streaming services with shards, retention and consumers.",
    "Batch pipelines are too slow for live data.",
    "Clickstreams, logs, IoT, real-time analytics.",
    "Simple queueing, where SQS is easier.",
    "Choose a partition key to avoid hot shards, produce with the SDK or KPL, consume with the KCL for checkpointing, and use Firehose for delivery.",
    "Pros: managed, replay within retention. Cons: shard management, ordering only per shard.",
    "MSK or self-managed Kafka (richer ecosystem), SQS (queues)."
  ],
  "Redshift": [
    "Redshift is AWS's columnar data warehouse for large analytical queries. I design distribution and sort keys and load via COPY from S3.",
    "A massively parallel columnar warehouse available provisioned or serverless.",
    "OLTP databases cannot run large aggregations efficiently.",
    "BI, reporting and large joins over structured data.",
    "Transactional workloads or small data.",
    "Create a cluster or serverless workgroup, define DISTKEY and SORTKEY, COPY from S3, use Spectrum for external data, and connect via JDBC.",
    "Pros: fast analytics. Cons: tuning, cost, not for OLTP.",
    "Athena (serverless), Snowflake, BigQuery."
  ],
  "QuickSight": [
    "QuickSight is AWS's managed BI dashboard tool. I know it connects to Athena and Redshift but rarely build with it.",
    "A serverless BI service with SPICE in-memory engine.",
    "Self-service dashboards without servers.",
    "Business reporting on AWS data.",
    "Complex custom UIs.",
    "Connect a data source, build datasets and dashboards, and share with row-level security.",
    "Pros: pay per session. Cons: less rich than Tableau or Power BI.",
    "Power BI, Tableau, Looker."
  ],
  "Lake Formation": [
    "Lake Formation helps build and secure a data lake, adding centralised fine-grained permissions on S3 data.",
    "A governance layer over the Glue catalog and S3.",
    "Managing S3 and catalog permissions separately is error prone.",
    "Organisations with shared data lakes and many teams.",
    "Small single-team lakes.",
    "Register S3 locations, grant table and column permissions, and query via Athena or Redshift Spectrum.",
    "Pros: central governance. Cons: complexity, learning curve.",
    "IAM and bucket policies alone, Unity Catalog on Databricks."
  ],
  "OpenSearch Service": [
    "OpenSearch Service is managed OpenSearch for full-text search and log analytics. I size shards carefully and use Spring Data or the Java client.",
    "A managed search and analytics cluster, forked from Elasticsearch.",
    "Relational databases perform poorly at text search and log analytics.",
    "Search features, log and observability pipelines.",
    "Primary transactional storage.",
    "Create a domain in a VPC, define mappings and shards, index with the Java client, and secure with fine-grained access control.",
    "Pros: powerful search. Cons: cluster tuning, cost, shard sizing.",
    "Elastic Cloud, Algolia, CloudWatch Logs Insights (logs)."
  ],
  "SageMaker": [
    "SageMaker is the platform to build, train and deploy ML models. As a Java developer I usually call deployed endpoints through the SDK.",
    "A managed ML platform with notebooks, training jobs, pipelines and endpoints.",
    "ML infrastructure is hard to build and scale.",
    "Teams training custom models.",
    "Simple needs met by prebuilt APIs.",
    "Train a model, deploy it to an endpoint, and invoke it with SageMakerRuntimeClient from Java.",
    "Pros: end-to-end ML. Cons: complexity, cost.",
    "Bedrock (foundation models), Vertex AI, Azure ML."
  ],
  "Bedrock": [
    "Bedrock gives API access to foundation models for generative AI. I call it via the SDK for summarisation and chat, watching cost, latency and privacy.",
    "A managed service exposing models from several providers with knowledge bases and guardrails.",
    "Hosting large models yourself is expensive.",
    "Generative AI features and RAG apps.",
    "Deterministic logic that does not need an LLM.",
    "Enable model access, call InvokeModel or Converse via BedrockRuntimeClient, add guardrails and a knowledge base for RAG.",
    "Pros: no hosting, multiple models. Cons: token cost, latency, non-determinism.",
    "Azure OpenAI, Vertex AI, direct provider APIs."
  ],
  "Rekognition": [
    "Rekognition is a managed image and video analysis API for faces, objects and moderation.",
    "A pretrained computer vision service.",
    "Building vision models is costly.",
    "Moderation, face matching, label detection.",
    "Highly specialised vision tasks.",
    "Call DetectLabels or similar via the SDK with an S3 image.",
    "Pros: no training. Cons: accuracy limits, privacy concerns.",
    "Custom SageMaker models, Vision AI, Azure AI Vision."
  ],
  "Comprehend": [
    "Comprehend is a natural language processing API offering sentiment, entities and key phrases.",
    "A managed NLP service.",
    "Building NLP pipelines is heavy.",
    "Text analytics, classification.",
    "Domain-specific language models.",
    "Call DetectSentiment or DetectEntities through the SDK.",
    "Pros: simple. Cons: generic models.",
    "Bedrock LLMs, Google Natural Language."
  ],
  "Lex": [
    "Lex builds conversational chatbots with voice and text, using the Alexa technology, with Lambda for fulfilment.",
    "A managed conversational interface service.",
    "Building dialogue systems is hard.",
    "Customer service bots.",
    "Open-ended LLM chat.",
    "Define intents and slots, attach a Lambda fulfilment function, and integrate with Connect or web.",
    "Pros: managed. Cons: limited flexibility.",
    "Bedrock agents, Dialogflow."
  ],
  "Polly": [
    "Polly converts text to lifelike speech in many voices and languages.",
    "A text-to-speech API.",
    "Recording audio is costly.",
    "Accessibility, voice responses.",
    "Highly custom voices.",
    "Call SynthesizeSpeech and store the audio in S3.",
    "Pros: simple. Cons: per-character cost.",
    "Google Text-to-Speech, Azure Speech."
  ],
  "Textract": [
    "Textract extracts text, tables and forms from scanned documents, going beyond basic OCR.",
    "A managed document analysis service.",
    "Manual data entry is slow.",
    "Invoices, forms, ID documents.",
    "Very unusual document layouts.",
    "Trigger from S3, call AnalyzeDocument, and parse the response blocks.",
    "Pros: structured output. Cons: cost per page.",
    "Document AI, Azure Document Intelligence, Tesseract."
  ],
  "Transcribe": [
    "Transcribe is speech-to-text with speaker identification and custom vocabularies.",
    "A managed speech recognition service.",
    "Manual transcription is slow.",
    "Call centre analytics, subtitles.",
    "Real-time tight latency needs on poor audio.",
    "Start a transcription job from an S3 file or stream audio, and read the JSON result.",
    "Pros: easy. Cons: accuracy depends on audio.",
    "Google Speech-to-Text, Whisper."
  ],
  "Translate": [
    "Translate is a neural machine translation API for text between many languages.",
    "A managed translation service.",
    "Manual localisation of dynamic content is slow.",
    "Localising user-generated or dynamic text.",
    "Legally sensitive text needing human translators.",
    "Call TranslateText through the SDK, with custom terminology if needed.",
    "Pros: simple. Cons: quality varies.",
    "Google Translation AI, DeepL."
  ],
  "IAM": [
    "IAM controls who can do what in AWS. I follow least privilege, use roles instead of long-lived keys, and understand policy evaluation, resource policies and cross-account role assumption.",
    "Users, groups, roles and JSON policies evaluated on every API call.",
    "Without fine-grained access control, any compromise is catastrophic.",
    "Every AWS workload.",
    "Never skip it, but avoid overly broad wildcard policies.",
    "Create roles for EC2, ECS tasks and Lambda, attach least-privilege policies with conditions, use permission boundaries and SCPs, and use IAM Access Analyzer to find excess access.",
    "Pros: granular, free. Cons: complex policy logic, easy to misconfigure.",
    "IAM Identity Center for workforce SSO, external IdPs via federation."
  ],
  "KMS": [
    "KMS manages encryption keys. I use customer managed keys for S3, RDS and EBS, envelope encryption for app data, and audit usage through CloudTrail.",
    "A managed key service with HSM-backed keys and policies.",
    "Handling key material in code is risky.",
    "Encrypting data at rest and signing.",
    "Very high-volume bulk encryption done directly with KMS rather than data keys.",
    "Create a CMK with key policy, enable rotation, call GenerateDataKey for envelope encryption, and grant via IAM and key policies.",
    "Pros: managed, audited. Cons: request costs and limits.",
    "CloudHSM (dedicated HSM), HashiCorp Vault."
  ],
  "Secrets Manager": [
    "Secrets Manager stores and rotates secrets like DB passwords, encrypted with KMS. I fetch them at runtime with caching so nothing sensitive sits in config.",
    "A managed secret store with versioning and rotation.",
    "Secrets in code and properties files leak.",
    "Database credentials, API keys, rotating secrets.",
    "Non-sensitive config, where Parameter Store is cheaper.",
    "Store the secret, grant GetSecretValue to the app role, load via Spring Cloud AWS or the SDK, and enable rotation with Lambda.",
    "Pros: rotation, audit. Cons: per-secret cost.",
    "Parameter Store, HashiCorp Vault."
  ],
  "Cognito": [
    "Cognito provides user sign-up and sign-in with user pools and issues JWTs, which my Spring Security resource servers validate.",
    "A managed identity service with user pools and identity pools.",
    "Building authentication from scratch is risky.",
    "Customer-facing apps needing quick auth with social login.",
    "Heavily customised auth flows or very large enterprise needs.",
    "Create a user pool and app client, configure hosted UI, and configure Spring Security with the issuer URI.",
    "Pros: managed, scalable. Cons: customisation limits, pricing.",
    "Auth0, Keycloak, Okta."
  ],
  "WAF": [
    "WAF filters HTTP traffic on CloudFront, ALB and API Gateway with managed rule groups and rate-based rules.",
    "A web application firewall with rule sets.",
    "Apps face SQL injection, bots and abuse.",
    "Any public web endpoint.",
    "Internal-only services.",
    "Create a web ACL, add managed rules and rate limits, associate with the resource, and monitor in count mode first.",
    "Pros: easy protection. Cons: false positives, cost.",
    "Cloudflare WAF, ModSecurity."
  ],
  "Shield": [
    "Shield protects against DDoS. Standard is automatic and free; Advanced adds detection and response support.",
    "Managed DDoS protection.",
    "Volumetric attacks can take services down.",
    "Internet-facing apps.",
    "Internal systems.",
    "Use with CloudFront, Route 53 and WAF for layered defence.",
    "Pros: automatic. Cons: Advanced is costly.",
    "Cloudflare, Akamai."
  ],
  "GuardDuty": [
    "GuardDuty is managed threat detection analysing CloudTrail, VPC flow logs and DNS logs. Low effort, so enable in every account.",
    "A threat detection service using ML and threat intelligence.",
    "Manual log review misses attacks.",
    "All accounts.",
    "Not a replacement for good IAM and hygiene.",
    "Enable it organisation-wide, send findings to Security Hub, and alert on high-severity ones.",
    "Pros: easy. Cons: findings need triage.",
    "Third-party SIEM or XDR tools."
  ],
  "Inspector": [
    "Inspector scans EC2, container images and Lambda for vulnerabilities, which I tie to ECR scanning.",
    "An automated vulnerability management service.",
    "Dependencies carry known CVEs.",
    "Continuous scanning of workloads.",
    "Not a pen test replacement.",
    "Enable scanning, review findings by severity, and fix by upgrading dependencies.",
    "Pros: automatic. Cons: noise.",
    "Snyk, Trivy, Dependabot."
  ],
  "Macie": [
    "Macie uses ML to find sensitive data like personal information in S3, supporting compliance.",
    "A data security and privacy service.",
    "Unknown sensitive data in buckets is a risk.",
    "Regulated data estates.",
    "Not needed for non-sensitive data.",
    "Enable it, run discovery jobs on buckets, and review findings.",
    "Pros: automatic discovery. Cons: cost per data scanned.",
    "Custom scans, third-party DLP."
  ],
  "Security Hub": [
    "Security Hub aggregates findings from GuardDuty, Inspector and others with compliance checks like CIS.",
    "A central security posture dashboard.",
    "Findings scattered across tools are hard to manage.",
    "Multi-account security monitoring.",
    "Small single-account projects.",
    "Enable standards, aggregate across accounts, and route findings to ticketing.",
    "Pros: unified view. Cons: noise and cost.",
    "Third-party CSPM tools."
  ],
  "Organizations": [
    "Organizations manages many AWS accounts centrally with consolidated billing and service control policies.",
    "A hierarchy of accounts and OUs with guardrails.",
    "A single account lacks isolation.",
    "Any serious AWS estate with prod, staging and dev.",
    "A tiny single project.",
    "Create OUs, apply SCPs, enable consolidated billing, and use Control Tower for a landing zone.",
    "Pros: isolation, governance. Cons: cross-account complexity.",
    "Separate standalone accounts."
  ],
  "CloudWatch": [
    "CloudWatch is the core observability service: metrics, logs, alarms and dashboards. I use structured JSON logs, Micrometer metrics and alarms on latency and errors.",
    "Metrics, logs, alarms, dashboards and tracing integrations.",
    "Running production blind causes outages.",
    "Every AWS workload.",
    "Replace with specialised APM only when deeper tracing is needed.",
    "Ship logs as JSON, publish custom metrics via Micrometer, create alarms with SNS actions, use Logs Insights for queries, and add X-Ray for traces.",
    "Pros: integrated. Cons: cost of logs and custom metrics, limited UX.",
    "Datadog, Prometheus and Grafana, New Relic."
  ],
  "CloudTrail": [
    "CloudTrail records API calls for audit. I enable it in all regions, send to S3 with integrity validation, and use it for investigations.",
    "A log of who did what and when in the account.",
    "Auditability and forensic needs.",
    "All accounts.",
    "Not a replacement for application logs.",
    "Create an organisation trail to S3, enable log validation, and query with Athena.",
    "Pros: complete audit. Cons: storage and analysis effort.",
    "AWS Config (resource state), third-party SIEM."
  ],
  "CloudFormation": [
    "CloudFormation is AWS's infrastructure as code with stacks. I use change sets and drift detection, and the CDK lets me write it in Java.",
    "Declarative templates that create and update resources as stacks.",
    "Manual console changes are not repeatable.",
    "All AWS infrastructure.",
    "Multi-cloud setups, where Terraform fits better.",
    "Write YAML or use CDK, deploy with change sets, parametrise environments, and use nested stacks for reuse.",
    "Pros: native, rollback. Cons: verbose, slower than some tools.",
    "Terraform, Pulumi, CDK (generates CloudFormation)."
  ],
  "Systems Manager": [
    "Systems Manager provides operations tooling. Parameter Store for configuration and Session Manager for SSH-free access are the parts I use most.",
    "A suite for patching, run command, parameters and sessions.",
    "Managing fleets and config manually is risky.",
    "Operations and config management.",
    "Not an app framework.",
    "Store config in Parameter Store, read it in Spring Cloud AWS, and use Session Manager instead of SSH.",
    "Pros: no open ports. Cons: setup and permissions.",
    "Secrets Manager, Ansible."
  ],
  "AWS Config": [
    "AWS Config records resource configuration and checks it against rules, supporting compliance auditing.",
    "A configuration history and rules service.",
    "Drift from approved configuration is hard to detect.",
    "Compliance-heavy environments.",
    "Small projects.",
    "Enable the recorder, add managed rules, and remediate non-compliance.",
    "Pros: audit trail. Cons: cost per recorded item.",
    "CloudTrail, third-party CSPM."
  ],
  "Control Tower": [
    "Control Tower sets up a governed multi-account landing zone with guardrails. Mostly a platform team concern.",
    "An opinionated multi-account setup built on Organizations.",
    "Manual account setup is inconsistent.",
    "Large enterprises.",
    "Small teams.",
    "Launch the landing zone, enable guardrails, and use Account Factory.",
    "Pros: fast governance. Cons: opinionated.",
    "Custom Organizations plus Terraform."
  ],
  "Trusted Advisor": [
    "Trusted Advisor gives recommendations on cost, performance, security and fault tolerance, useful for quick health checks.",
    "A checks dashboard across best-practice areas.",
    "Visibility into waste and risks.",
    "Periodic reviews.",
    "As your only governance tool.",
    "Review checks, and act on findings.",
    "Pros: easy. Cons: full checks need paid support.",
    "Cost Explorer, Well-Architected Tool."
  ],
  "Cost Explorer": [
    "Cost Explorer visualises and forecasts spend by service and tag. I use tags and budgets so teams own their costs.",
    "A cost analysis and forecast tool.",
    "Cloud bills grow silently.",
    "Ongoing cost management.",
    "Detailed chargeback needing CUR.",
    "Enable cost allocation tags, create budgets with alerts, and review by service.",
    "Pros: simple. Cons: limited granularity.",
    "CUR with Athena, third-party FinOps tools."
  ],
  "CodeBuild": [
    "CodeBuild is a managed build service running a buildspec in containers, handy for Maven or Gradle builds without build servers.",
    "A serverless build runner.",
    "Maintaining build servers is toil.",
    "AWS-centred CI.",
    "Teams already standardised on GitHub Actions or Jenkins.",
    "Write buildspec.yml, set the image and cache, publish artifacts and images, and run in a pipeline.",
    "Pros: scales per build. Cons: less rich than other CI tools.",
    "GitHub Actions, Jenkins, GitLab CI."
  ],
  "CodeCommit": [
    "CodeCommit was AWS's managed Git hosting. AWS stopped onboarding new customers, so I would use GitHub, GitLab or Bitbucket.",
    "A managed Git repository service.",
    "Host Git inside AWS.",
    "Only existing users.",
    "New projects.",
    "Migrate repositories to another Git host and update pipelines.",
    "Pros: IAM integration. Cons: closed to new customers.",
    "GitHub, GitLab, Bitbucket."
  ],
  "CodeDeploy": [
    "CodeDeploy automates deployments to EC2, ECS and Lambda with rolling, blue-green and canary strategies and rollback on alarms.",
    "A deployment automation service.",
    "Manual releases are error prone.",
    "AWS compute deployments needing safe rollout.",
    "Kubernetes, which has its own tools.",
    "Write an appspec file, define a deployment group and strategy, and attach alarms for rollback.",
    "Pros: safe releases. Cons: AWS-specific.",
    "Argo CD, Spinnaker, ECS rolling updates."
  ],
  "CodePipeline": [
    "CodePipeline is a managed CI/CD orchestrator chaining source, build, test and deploy stages.",
    "A pipeline service with stages and actions.",
    "Manual release steps are slow and risky.",
    "AWS-native delivery.",
    "Teams happy with GitHub Actions or Jenkins.",
    "Define source, build with CodeBuild, and deploy with CodeDeploy or CloudFormation, adding manual approvals.",
    "Pros: native. Cons: less flexible UI.",
    "Jenkins, GitHub Actions, GitLab CI."
  ],
  "CodeArtifact": [
    "CodeArtifact is a managed artifact repository for Maven, npm and PyPI, with upstream proxying. I use it as a private Maven repo.",
    "A package repository with domains and repositories.",
    "Teams need private packages and controlled dependency sources.",
    "Internal libraries and supply chain control.",
    "Small teams with simple needs.",
    "Create a repo with an upstream to Maven Central, configure Maven settings with an auth token, and publish artifacts.",
    "Pros: managed. Cons: token expiry handling.",
    "Artifactory, Nexus, GitHub Packages."
  ],
  "Cloud9": [
    "Cloud9 was a browser-based IDE. AWS closed it to new customers, so I use local IDEs or other cloud dev environments.",
    "A cloud IDE running on EC2.",
    "Consistent dev environments.",
    "Existing users only.",
    "New projects.",
    "Move to local IDEs, Dev Containers or Codespaces.",
    "Pros: browser access. Cons: closed to new customers.",
    "GitHub Codespaces, Gitpod, VS Code Dev Containers."
  ]
};
