// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Docker Essentials": [
    "Docker packages an application and its dependencies into an image that runs as an isolated container sharing the host kernel, so the same artefact runs identically in dev, CI and production. Know images versus containers, layers, registries, volumes, networks and the basic run, build, logs and exec commands.",
    "An image is a read-only layered filesystem built from a Dockerfile; a container is a running instance with a writable layer, namespaces for isolation and cgroups for resource limits. Registries such as Docker Hub or a private registry store and distribute images.",
    "It removes the 'works on my machine' problem, makes deployments immutable and reproducible, and uses far fewer resources than virtual machines because there is no guest OS.",
    "Use it for packaging services, running local dependencies (databases, brokers), reproducible CI builds and as the unit of deployment for Kubernetes.",
    "Avoid it for data you must keep inside the container filesystem (use volumes), for GUI-heavy desktop apps, and do not treat containers as small VMs by logging in to patch them; rebuild the image instead.",
    "Build with docker build -t name:tag ., run with docker run -d -p 8080:8080 --memory 512m name:tag, inspect with docker logs and docker exec -it, persist data with named volumes, connect containers on user-defined networks, and pin image tags or digests.",
    "Pros: portability, fast startup, consistent environments, efficient layer caching. Cons: shared kernel means weaker isolation than VMs, image sprawl and security patching responsibility, and persistent storage and networking need care.",
    "Alternatives are virtual machines, Podman (daemonless, rootless), containerd and nerdctl, buildpacks and Jib that build images without a Dockerfile, and plain JAR deployment on a JVM host.",
    `# build and run
docker build -t shop-api:1.0.0 .
docker run -d --name shop-api -p 8080:8080 --memory 512m -e SPRING_PROFILES_ACTIVE=prod shop-api:1.0.0

# inspect
docker ps
docker logs -f shop-api
docker exec -it shop-api sh
docker stats --no-stream

# data and networking
docker volume create pgdata
docker network create backend
docker run -d --name db --network backend -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=change-me postgres:16

# cleanup
docker stop shop-api && docker rm shop-api
docker image prune -f`
  ],
  "Dockerfile Best Practices": [
    "Use a minimal, pinned base image, multi-stage builds to keep build tools out of the runtime image, ordered layers for cache efficiency, a non-root user, and a .dockerignore file. For Java use a JRE-only or distroless image and set container-aware JVM options.",
    "A Dockerfile is a recipe where each instruction creates a layer that is cached until a preceding layer changes. Multi-stage builds use several FROM stages and copy only the needed artefacts into the final stage.",
    "Smaller images pull faster and have a smaller attack surface; good layer ordering makes rebuilds take seconds, and non-root users limit the damage of a container compromise.",
    "Apply them to every service image, especially in CI where build time and image size matter and where vulnerability scanning is enforced.",
    "Avoid the latest tag, running as root, copying the entire context with secrets in it, installing build tools in the final image, and baking environment-specific configuration or secrets into layers.",
    "Copy dependency descriptors first and resolve dependencies before copying source, use a multi-stage build with a JDK build stage and a JRE runtime stage, add USER, a HEALTHCHECK where useful, use exec-form ENTRYPOINT so signals reach the JVM, rely on -XX:MaxRAMPercentage, and consider Spring Boot layered jars or Jib.",
    "Pros: small, fast, secure images with quick rebuilds. Cons: more complex Dockerfiles, distroless images lack a shell for debugging, and cache behaviour can surprise people.",
    "Alternatives are Jib or Spring Boot buildpacks (spring-boot:build-image) that avoid writing a Dockerfile, jlink-created minimal runtimes, and native images with GraalVM for very small footprints and fast startup.",
    `# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /workspace
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q -B dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -B package -DskipTests

FROM eclipse-temurin:25-jre
RUN useradd --system --uid 10001 appuser
WORKDIR /app
COPY --from=build /workspace/target/app.jar app.jar
USER 10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]

# .dockerignore
# target/
# .git/
# *.log
# .env`
  ],
  "Kubernetes Core Objects": [
    "A Pod is the smallest deployable unit, a Deployment manages replicated stateless Pods with rolling updates, a Service gives them a stable virtual IP and DNS name, and Ingress routes external HTTP traffic. ConfigMaps and Secrets inject configuration, and probes tell Kubernetes when a Pod is alive and ready.",
    "Pods hold one or more containers sharing network and storage. A Deployment uses a ReplicaSet to keep the desired replica count; StatefulSets give stable identity and storage; Jobs and CronJobs run batch work; HPA scales replicas on metrics; PersistentVolumeClaims request storage.",
    "Kubernetes provides declarative desired state, self-healing, scaling, service discovery and zero-downtime rollouts, so teams describe what they want and controllers reconcile reality.",
    "Use it for running many containerised services with scaling and automated recovery, and when you need rolling updates, config management and portability across clouds.",
    "Avoid it for a handful of simple apps where a managed PaaS or plain VMs are cheaper to operate, and do not run databases in it without a clear operational plan and operators.",
    "Define Deployments with resource requests and limits, readiness, liveness and startup probes, ConfigMaps and Secrets for config, a Service per Deployment, an Ingress or Gateway for external access, and an HPA. Use kubectl get, describe, logs, rollout status and rollout undo to operate and debug.",
    "Pros: self-healing, scalable, declarative, rich ecosystem. Cons: steep learning curve, operational complexity and cost, YAML sprawl, and misconfigured limits or probes cause outages.",
    "Alternatives are Docker Compose or Swarm for small setups, Nomad, managed container services such as ECS or Cloud Run, and serverless platforms.",
    `apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-api
spec:
  replicas: 3
  selector:
    matchLabels: { app: shop-api }
  strategy:
    rollingUpdate: { maxUnavailable: 0, maxSurge: 1 }
  template:
    metadata:
      labels: { app: shop-api }
    spec:
      containers:
        - name: app
          image: registry.example.com/shop-api:1.0.0
          ports: [{ containerPort: 8080 }]
          resources:
            requests: { cpu: 250m, memory: 512Mi }
            limits: { memory: 512Mi }
          readinessProbe:
            httpGet: { path: /actuator/health/readiness, port: 8080 }
          livenessProbe:
            httpGet: { path: /actuator/health/liveness, port: 8080 }
          envFrom:
            - configMapRef: { name: shop-api-config }
            - secretRef: { name: shop-api-secrets }
---
apiVersion: v1
kind: Service
metadata:
  name: shop-api
spec:
  selector: { app: shop-api }
  ports: [{ port: 80, targetPort: 8080 }]

# kubectl apply -f shop-api.yaml
# kubectl rollout status deployment/shop-api
# kubectl rollout undo deployment/shop-api`
  ],
  "Docker Compose": [
    "Docker Compose defines and runs multi-container applications from one YAML file, ideal for local development and integration tests: app, database, broker and cache come up with a single docker compose up. It is not a production orchestrator.",
    "A compose.yaml lists services, images or builds, ports, environment, volumes, networks, healthchecks and depends_on conditions. Services share a default network and reach each other by service name.",
    "Starting several dependencies by hand is error-prone; Compose makes the whole local stack reproducible and versionable alongside the code.",
    "Use it for local development stacks, demos, CI integration environments and quickly trying software such as Kafka or Postgres.",
    "Avoid it for production clustering, autoscaling and self-healing (use Kubernetes or a managed service), and do not commit real secrets in the file.",
    "Use docker compose up -d, logs -f and down -v, define healthchecks with depends_on condition service_healthy so the app waits for the database, use profiles for optional services, and put secrets in a git-ignored .env file or Compose secrets. Spring Boot 3.1+ can also start Compose services automatically with spring-boot-docker-compose.",
    "Pros: simple, readable, quick onboarding. Cons: single host, limited scaling and rollout features, and depends_on only orders start unless health conditions are used.",
    "Alternatives are Testcontainers (code-managed containers in tests), Kubernetes with kind or minikube locally, Tilt or Skaffold for cluster-based development, and Podman Compose.",
    `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: shop
      POSTGRES_USER: shop
      POSTGRES_PASSWORD: change-me
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shop"]
      interval: 5s
      retries: 10

  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/shop
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:

# docker compose up -d
# docker compose logs -f api
# docker compose down -v`
  ],
  "Helm": [
    "Helm is the package manager for Kubernetes: a chart bundles templated manifests with a values.yaml, and a release is an installed, versioned instance that you can upgrade and roll back. It avoids copy-pasting YAML per environment.",
    "A chart contains Chart.yaml, templates written in Go templating, default values and optional dependencies. Helm renders templates with values, applies them, and stores release history in the cluster as Secrets.",
    "Raw manifests are repetitive across services and environments; Helm parameterises them and gives install, upgrade, rollback and dependency management.",
    "Use it to deploy your own services with per-environment values files and to install third-party software such as ingress controllers or Prometheus from public charts.",
    "Avoid heavy templating logic that makes charts unreadable, and consider Kustomize or plain manifests when the differences between environments are small.",
    "Create a chart with helm create, put environment differences in values-dev.yaml and values-prod.yaml, preview with helm template or helm lint, deploy with helm upgrade --install --atomic, inspect with helm history, and roll back with helm rollback. Never put secrets in values files committed to git.",
    "Pros: reuse, versioned releases, easy rollback, big chart ecosystem. Cons: Go template complexity, hard to debug rendered output, and release state in the cluster can drift from git unless GitOps is used.",
    "Alternatives are Kustomize (overlay patching, built into kubectl), plain manifests, Jsonnet or CUE, and operators for complex applications.",
    `# create and validate
helm create shop-api
helm lint ./shop-api
helm template shop-api ./shop-api -f values-prod.yaml

# install or upgrade, roll back automatically on failure
helm upgrade --install shop-api ./shop-api -n shop --create-namespace -f values-prod.yaml --atomic --timeout 5m

# history and rollback
helm history shop-api -n shop
helm rollback shop-api 2 -n shop

# values-prod.yaml
# replicaCount: 4
# image:
#   repository: registry.example.com/shop-api
#   tag: 1.0.0
# resources:
#   requests: { cpu: 250m, memory: 512Mi }`
  ],
  "CI/CD Pipelines": [
    "A CI/CD pipeline automatically builds, tests, scans and packages every commit (continuous integration) and then delivers or deploys it through environments (continuous delivery or deployment). Fast, reliable pipelines with automated quality gates and easy rollback are the core of safe frequent releases.",
    "Typical stages are checkout, compile, unit tests, static analysis and dependency scanning, build artefact or image, integration tests, publish, deploy to staging, smoke tests, and production deployment. Continuous delivery keeps a manual approval before production, continuous deployment does not.",
    "Frequent small automated releases lower risk, shorten feedback and remove error-prone manual steps; they are a key driver of the DORA metrics: deployment frequency, lead time, change failure rate and time to restore.",
    "Use it for every service; pipelines are defined as code in Jenkins, GitHub Actions, GitLab CI or Azure DevOps.",
    "Avoid long pipelines that nobody waits for, rebuilding artefacts per environment (build once, promote the same artefact), secrets echoed in logs, and manual snowflake deployments.",
    "Define the pipeline as code in the repository, cache dependencies, run fast tests first and in parallel, scan with tools like OWASP Dependency-Check or Trivy, build one immutable versioned artefact, deploy using blue-green, canary or rolling strategies, use feature flags to decouple deploy from release, and use short-lived credentials or OIDC for cloud access.",
    "Pros: fast feedback, repeatable releases, early defect detection. Cons: pipeline maintenance cost, flaky tests block delivery, and it needs discipline such as trunk-based development and good test coverage.",
    "Alternatives are manual releases (risky), scheduled batch releases, and GitOps pull-based delivery where a controller syncs the cluster from git.",
    `# .github/workflows/ci.yml
name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 25
          cache: maven
      - name: Build and test
        run: mvn -B verify
      - name: Build image
        run: docker build -t registry.example.com/shop-api:$GITHUB_SHA .
      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: registry.example.com/shop-api:$GITHUB_SHA
          severity: HIGH,CRITICAL
          exit-code: 1`
  ],
  "Git Branching Strategies": [
    "Trunk-based development keeps short-lived branches merged to main at least daily with feature flags and strong CI, GitHub Flow uses short feature branches with pull requests, and Gitflow uses long-lived develop, release and hotfix branches. For continuously deployed services I prefer trunk-based or GitHub Flow, and Gitflow only for versioned products with parallel releases.",
    "Gitflow has main, develop, feature, release and hotfix branches. GitHub Flow has main plus short feature branches and pull requests. Trunk-based development has a single trunk with very short-lived branches or direct commits, and release branches cut only when needed.",
    "The branching model determines merge pain, release cadence and how quickly integration problems surface; long-lived branches diverge and cause painful merges.",
    "Choose trunk-based for web services and continuous delivery, GitHub Flow for most teams using pull requests, and Gitflow for libraries or on-premise products shipping multiple supported versions.",
    "Avoid long-lived feature branches, Gitflow for a single continuously deployed service (needless overhead), and weak CI when merging often.",
    "Protect main with required reviews and status checks, keep branches under a day or two, use feature flags for unfinished work, tag releases with semantic versions, cut release branches only for supported versions, and cherry-pick fixes to them.",
    "Trunk-based: fast integration but needs good tests and flags. GitHub Flow: simple but lacks multi-version support. Gitflow: structure for versioned releases but slow, merge-heavy and often overkill.",
    "Alternatives include GitLab Flow with environment branches, release-train branching, and forking workflows for open source.",
    `# GitHub Flow / short-lived branch
git switch -c feature/ABC-123-discount-rules
git commit -am "ABC-123 add discount rules"
git push -u origin feature/ABC-123-discount-rules
# open a pull request, get review and green CI, then squash merge

# Release branch for a supported version (Gitflow-style or trunk-based with releases)
git switch -c release/2.4 main
git tag -a v2.4.0 -m "Release 2.4.0"
git switch release/2.3
git cherry-pick <commit-sha>      # backport a fix`
  ],
  "Git Merge vs Rebase": [
    "Merge joins two histories with a merge commit and preserves the true history, while rebase replays your commits on top of another branch to produce a linear history by rewriting them. Rebase your own unpublished branches, merge or squash shared ones, and never rebase commits others have pulled.",
    "git merge creates a commit with two parents and leaves existing commits untouched. git rebase creates new commits with new hashes for each replayed commit. Squash merge combines a branch into a single commit on the target.",
    "Teams choose between an accurate but branch-heavy history and a clean linear one that is easier to read, bisect and revert.",
    "Use rebase to update a local feature branch with the latest main before opening a pull request, and use merge or squash merge to integrate into shared branches according to team policy.",
    "Do not rebase public or shared branches, since rewriting history forces collaborators to reconcile diverged copies; avoid force pushes to main, and prefer merge when preserving the context of a long integration matters.",
    "Update your branch with git fetch then git rebase origin/main, resolve conflicts commit by commit, use git push --force-with-lease (never plain --force) after a rebase, use git rebase -i to clean up local commits, and abort with git rebase --abort if it goes wrong.",
    "Merge: safe and preserves history, but noisy graphs. Rebase: linear and tidy, but rewrites history, can need repeated conflict resolution and is dangerous on shared branches.",
    "Alternatives are squash merge, fast-forward-only merges (--ff-only), and cherry-pick for selective commits.",
    `# Merge: keeps both histories
git switch main
git merge feature/login        # creates a merge commit (use --no-ff to force one)

# Rebase: replay my commits on top of the latest main
git fetch origin
git switch feature/login
git rebase origin/main
git push --force-with-lease    # safe force push of my own branch

# Interactive cleanup of the last 3 commits
git rebase -i HEAD~3

# Squash merge into main
git merge --squash feature/login && git commit -m "Add login"`
  ],
  "Maven vs Gradle": [
    "Maven is convention-based and declarative with a fixed lifecycle and XML POMs, which makes builds uniform and predictable; Gradle uses a Groovy or Kotlin DSL with a task graph, incremental builds and a build cache, which makes it faster and more flexible on large builds. Both resolve dependencies from Maven Central and handle transitive dependencies.",
    "Maven has the lifecycle phases validate, compile, test, package, verify, install and deploy, plugins bound to phases, and dependencyManagement and BOMs for versions. Gradle models builds as a directed acyclic graph of tasks with up-to-date checks, a daemon, build cache and configuration avoidance.",
    "Builds must be reproducible, fast and consistent across developer machines and CI, with dependency resolution and versions managed centrally.",
    "Choose Maven for standard Java services and teams that value convention and uniformity, and Gradle for large multi-module builds, Android, Kotlin projects or when custom build logic and build caching matter.",
    "Avoid unpinned dynamic versions (LATEST, version ranges), copying large parent POM logic everywhere, and highly customised Gradle scripts that nobody understands.",
    "Use the Maven wrapper (mvnw) or Gradle wrapper for a pinned tool version, manage versions through a BOM or parent POM or a Gradle version catalog, run dependency:tree or gradle dependencies to debug conflicts, and enable the Gradle build cache and parallel execution.",
    "Maven: simple, predictable, huge ecosystem, but verbose XML and slower incremental builds. Gradle: faster and flexible, but a steeper learning curve and a risk of complex scripts.",
    "Alternatives are Bazel for very large polyglot monorepos, sbt for Scala, and Ant (legacy).",
    `<!-- Maven: pom.xml -->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-dependencies</artifactId>
      <version>3.5.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
</dependencies>

// Gradle (Kotlin DSL): build.gradle.kts
plugins { java; id("org.springframework.boot") version "3.5.0" }
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

# commands
# ./mvnw -B verify           ./mvnw dependency:tree
# ./gradlew build --build-cache      ./gradlew dependencies`
  ],
  "Git Troubleshooting (reset, revert, reflog, bisect)": [
    "Use git revert to undo a published commit safely with a new commit, git reset to move a local branch pointer (soft keeps changes staged, mixed keeps them unstaged, hard discards them), git reflog to recover lost commits, and git bisect to find the commit that introduced a bug by binary search.",
    "Reset moves HEAD and optionally the index and working tree. Revert creates an inverse commit. Reflog is a local log of where HEAD and branches pointed, which allows recovery for roughly 90 days by default. Bisect checks out midpoints between a good and a bad commit.",
    "Mistakes such as bad commits, wrong resets, deleted branches or regressions of unknown origin happen; knowing the right tool prevents data loss and shared history damage.",
    "Use revert on shared branches, reset on local unpublished work, reflog after an accidental reset or rebase, and bisect when a regression appeared somewhere in many commits.",
    "Avoid git reset --hard or force pushes on shared branches, and avoid running destructive commands without checking git status and git reflog first.",
    "Undo a pushed commit with git revert <sha>; undo the last local commit but keep changes with git reset --soft HEAD~1; recover with git reflog then git reset --hard <sha> or git branch rescue <sha>; run git bisect start, bisect bad, bisect good <sha> and then automate with git bisect run <test script>; use git stash for temporary work.",
    "Revert: safe but adds history noise. Reset: clean but rewrites history and can lose work. Reflog is local only. Bisect is fast but needs a reliable reproducible test.",
    "Alternatives are git restore for files, git commit --amend for the last commit, git cherry-pick, and git stash or worktrees to switch context.",
    `# undo a commit that is already pushed
git revert 3f2a9c1
git push

# undo last local commit, keep the work staged
git reset --soft HEAD~1

# oops: hard reset lost commits - find and restore them
git reflog
git reset --hard HEAD@{2}

# recover a deleted branch
git branch recovered-branch <sha-from-reflog>

# find which commit broke the build
git bisect start
git bisect bad                # current commit is broken
git bisect good v2.3.0        # known good tag
git bisect run ./mvnw -q test -Dtest=PriceCalculatorTest
git bisect reset`
  ],
  "Artifact Repositories and Versioning": [
    "An artifact repository (Nexus, Artifactory, GitHub Packages, or a cloud registry) stores built JARs, container images and other binaries, proxies upstream registries, and enforces versioning and retention. Use semantic versioning, immutable releases, and promote the same artefact through environments instead of rebuilding.",
    "Repositories can be hosted (your artefacts), proxy (cache of Maven Central or Docker Hub) or group (a single URL for many). Semantic versioning uses MAJOR.MINOR.PATCH where major signals breaking changes, and SNAPSHOT versions are mutable development builds in Maven.",
    "Central storage gives reproducible builds, faster dependency resolution, control over third-party components, audit trails and a place for scanning and licence checks.",
    "Use it for internal libraries, release and snapshot artefacts, Docker images, and as a mandatory proxy for all external dependencies in a company.",
    "Avoid overwriting released versions, using SNAPSHOT dependencies in releases, using latest tags for images, and keeping artefacts only on build agents.",
    "Configure mirrors and credentials in settings.xml (never in git), deploy with mvn deploy to separate release and snapshot repositories, tag git with the version, produce an SBOM and sign artefacts, use the Maven release or versions plugin or CI-driven version numbers, and set retention policies for old snapshots and images.",
    "Pros: reproducibility, security control, speed. Cons: infrastructure to run and secure, storage costs, and release process discipline is required.",
    "Alternatives are public registries directly (risky), vendoring dependencies into git, and cloud-native registries such as ECR, GCR or GitHub Container Registry.",
    `<!-- pom.xml: where to publish -->
<distributionManagement>
  <repository>
    <id>internal-releases</id>
    <url>https://repo.example.com/repository/maven-releases/</url>
  </repository>
  <snapshotRepository>
    <id>internal-snapshots</id>
    <url>https://repo.example.com/repository/maven-snapshots/</url>
  </snapshotRepository>
</distributionManagement>

<!-- ~/.m2/settings.xml: mirror everything through the proxy, credentials by id -->
<mirrors>
  <mirror>
    <id>internal</id>
    <mirrorOf>*</mirrorOf>
    <url>https://repo.example.com/repository/maven-public/</url>
  </mirror>
</mirrors>

# versioning flow
# 1.4.0-SNAPSHOT -> release 1.4.0 (immutable) -> next 1.4.1-SNAPSHOT
# mvn -B release:prepare release:perform
# docker tag shop-api:1.4.0 registry.example.com/shop-api:1.4.0`
  ],
  "Secrets Management": [
    "Secrets such as passwords, API keys and certificates must never live in source code, images or plain config; store them in a secrets manager (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, Kubernetes Secrets with encryption at rest) and inject them at runtime. Use least privilege, rotation, short-lived credentials and audit logs.",
    "A secrets manager encrypts secrets at rest, controls access with identity-based policies, logs every read, supports versioning and rotation, and can issue dynamic short-lived database credentials. Kubernetes Secrets are only base64-encoded by default and need encryption at rest and RBAC.",
    "Leaked credentials in git history, logs or images are a leading cause of breaches, and static long-lived secrets cannot be easily rotated or traced.",
    "Use it for database credentials, third-party API keys, TLS private keys and signing keys, across all environments and CI/CD pipelines.",
    "Avoid committing secrets (even in private repos), passing them as command-line arguments or baking them into images, sharing one credential across services, and logging configuration values.",
    "Fetch secrets at startup via Spring Cloud Vault or the cloud SDK, or mount them from the External Secrets Operator or CSI driver; authenticate workloads with their identity (Kubernetes service account, IAM role or OIDC) rather than another secret; rotate regularly; scan repositories with gitleaks or trufflehog and use pre-commit hooks; and revoke and rotate immediately on exposure.",
    "Pros: central control, auditability, rotation. Cons: another critical dependency to operate, bootstrapping the first credential is hard, and app changes are needed to consume dynamic secrets.",
    "Alternatives are environment variables from the orchestrator (simple but visible in process listings and dumps), encrypted files such as SOPS or Sealed Secrets for GitOps, and workload identity that removes static secrets entirely.",
    `# Kubernetes: secret created from literals (placeholder values)
kubectl create secret generic shop-api-secrets --from-literal=DB_PASSWORD=change-me --from-literal=API_KEY=replace-me

# Pod consumes it as environment variables or a mounted file
# envFrom:
#   - secretRef: { name: shop-api-secrets }

# Scan the repository and history for leaked credentials
gitleaks detect --source . --verbose

# Spring Boot: read the value from the environment, never from application.yml in git
# spring.datasource.password=$DB_PASSWORD

# HashiCorp Vault: read a secret via CLI
vault kv get -field=password secret/shop/db`
  ],
  "Linux Commands for Java Developers": [
    "Know the commands to inspect processes, logs, memory, disk and network on a server: ps, top or htop, free, df and du, tail -f, grep, ss, curl, lsof, plus the JDK tools jps, jstack, jmap, jcmd and jstat. These let you diagnose a hung or slow JVM in production quickly.",
    "Process tools show CPU and memory use, file tools search and follow logs, network tools show listening ports and connections, and JDK tools take thread dumps, heap dumps and GC statistics from a running JVM. Containers add docker logs and kubectl exec.",
    "Production problems are usually diagnosed on the host or container through the shell, often without an IDE or profiler available.",
    "Use them to find a runaway process, read and filter logs, check which process holds a port, investigate high CPU by thread, and capture dumps before restarting.",
    "Avoid taking heap dumps blindly on a loaded production node (they pause the JVM and are large), running destructive commands such as rm -rf or kill -9 without understanding the impact, and leaving dumps containing sensitive data lying around.",
    "For high CPU: top -H -p <pid> to find the hot thread, convert its id to hex, and match it in jstack <pid> or jcmd <pid> Thread.print. For memory use jcmd <pid> GC.heap_info and GC.heap_dump; for logs use grep, less, and tail -f | grep; for ports use ss -tlnp; for disk use df -h and du -sh.",
    "Pros: quick, universally available, scriptable. Cons: raw text output needs experience to interpret, and some tools affect a loaded process.",
    "Alternatives are APM and observability platforms, Java Flight Recorder, async-profiler, Arthas, and centralised logging such as ELK or Loki.",
    `# processes and resources
ps aux | grep java
top -H -p 12345             # per-thread CPU for a JVM
free -h; df -h; du -sh /var/log/*

# logs
tail -f app.log | grep ERROR
grep -c "OutOfMemoryError" app.log
less +G app.log

# network
ss -tlnp | grep 8080         # who listens on 8080
curl -sS -o /dev/null -w "%{http_code} %{time_total}s" http://localhost:8080/actuator/health
lsof -i :8080

# JVM diagnostics
jcmd                         # list JVMs
jcmd 12345 Thread.print > threads.txt
jcmd 12345 GC.heap_info
jstat -gcutil 12345 1000 5
jcmd 12345 JFR.start duration=60s filename=/tmp/rec.jfr`
  ],
  "Networking Basics (DNS, TCP, HTTP)": [
    "A request resolves a name via DNS to an IP address, opens a TCP connection (three-way handshake, plus a TLS handshake for HTTPS), and then exchanges HTTP messages, where latency, timeouts, keep-alive and connection pooling all matter. Know status code classes, HTTP/1.1 versus HTTP/2 and HTTP/3, load balancer layers and common failure modes.",
    "DNS maps names to records (A, AAAA, CNAME, TXT) and caches them according to TTL. TCP provides reliable ordered streams with a handshake, retransmission and flow control. HTTP is a stateless request-response protocol with methods, headers and status codes; HTTP/2 multiplexes streams over one connection, and HTTP/3 uses QUIC over UDP.",
    "Most production issues, such as timeouts, connection resets, stale DNS and slow handshakes, are network issues, and diagnosing them needs a clear model of each layer.",
    "Use it when debugging connectivity, setting client timeouts and pool sizes, configuring load balancers and ingress, and reasoning about latency across regions.",
    "Avoid default infinite timeouts, creating a new connection per request, assuming DNS changes take effect instantly because of caching (including the JVM networkaddress.cache.ttl), and ignoring the difference between connect, read and idle timeouts.",
    "Debug with nslookup or dig for DNS, ping and traceroute for reachability, nc -zv host port or curl -v for TCP and HTTP, ss for sockets, and tcpdump or Wireshark for packet-level issues. Configure client connect and read timeouts, pooled keep-alive connections, retries with backoff for idempotent calls, and layer 4 versus layer 7 load balancing appropriately.",
    "Pros of pooling and keep-alive: lower latency. Cons: stale connections after load balancer idle timeouts, DNS caching surprises, and retries can amplify load without backoff and limits.",
    "Alternatives or related are gRPC over HTTP/2, WebSockets and server-sent events for streaming, service meshes (Istio, Linkerd) for managed retries and mTLS, and message queues to decouple synchronous calls.",
    `# DNS
dig +short api.example.com
dig api.example.com CNAME

# TCP reachability
nc -zv api.example.com 443

# HTTP with timing breakdown
curl -sS -o /dev/null -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}" https://api.example.com/health

# HTTP client with explicit timeouts (Java 11+)
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(2))
    .version(HttpClient.Version.HTTP_2)
    .build();
HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.example.com/health"))
    .timeout(Duration.ofSeconds(5))
    .GET().build();
HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());`
  ],
  "Infrastructure as Code (Terraform)": [
    "Infrastructure as code defines cloud resources in version-controlled files that are reviewed and applied automatically; Terraform (or OpenTofu) is declarative, builds a dependency graph, compares desired configuration to state and applies the plan. Remote state with locking, modules and plan review in CI are the essentials.",
    "Terraform uses providers to talk to APIs, resources and data sources in HCL, variables and outputs, and a state file mapping configuration to real resources. The workflow is init, plan, apply, and modules package reusable components.",
    "Manual console changes are unrepeatable and untracked; IaC makes environments reproducible, reviewable, auditable and quick to recreate or recover.",
    "Use it for provisioning networks, clusters, databases, IAM and DNS across environments, and for disaster recovery rebuilds.",
    "Avoid keeping state locally or in git (it can contain secrets), editing infrastructure by hand which causes drift, giant monolithic state files, and putting secrets in plain variables.",
    "Store state remotely (for example S3 with locking or Terraform Cloud), split state by environment and component, use modules and pinned provider versions, run terraform plan on pull requests and apply from the pipeline after approval, detect drift with scheduled plans, and scan with tflint, tfsec or checkov.",
    "Pros: repeatability, review, versioned history, drift detection. Cons: state management complexity, a learning curve, risk of destructive plans, and provider coverage gaps.",
    "Alternatives are OpenTofu (open-source fork), Pulumi (general-purpose languages), AWS CloudFormation or CDK, Ansible for configuration management, and Crossplane for Kubernetes-native provisioning.",
    `terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "example-tf-state"
    key            = "shop/prod/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "tf-locks"
    encrypt        = true
  }
}

variable "env" { type = string }

resource "aws_s3_bucket" "assets" {
  bucket = "example-shop-assets-1234"
  tags   = { Environment = var.env }
}

output "assets_bucket" { value = aws_s3_bucket.assets.bucket }

# terraform init
# terraform plan -var env=prod -out tfplan
# terraform apply tfplan`
  ],
  "GitOps": [
    "GitOps makes git the single source of truth for the desired state of the system, and an in-cluster agent such as Argo CD or Flux continuously pulls from git and reconciles the cluster, so deployments are pull requests and rollbacks are reverts. It gives audit, consistency and drift correction.",
    "The four principles are declarative configuration, versioned and immutable storage in git, automated pull of approved changes, and continuous reconciliation. Application code and the deployment config usually live in separate repositories, and CI updates the image tag in the config repo.",
    "Push-based pipelines need cluster credentials and cannot detect manual changes; pull-based reconciliation keeps the cluster matching git and improves security and traceability.",
    "Use it for Kubernetes deployments across many environments or clusters, when you want audited changes via pull requests and automatic drift correction.",
    "Avoid it when there is no declarative target (traditional VMs without tooling), and avoid committing plaintext secrets to the config repo; handle them with Sealed Secrets, SOPS or External Secrets.",
    "Keep manifests, Helm charts or Kustomize overlays in an environment repo, let CI build the image and open a pull request bumping the tag, define Argo CD Applications with automated sync, prune and self-heal, protect branches, and use progressive delivery (Argo Rollouts) for canary or blue-green.",
    "Pros: auditability, easy rollback, no cluster credentials in CI, drift correction. Cons: two repos and more moving parts, secret handling needs extra tools, and debugging sync failures requires GitOps tooling knowledge.",
    "Alternatives are push-based CI/CD deploys with kubectl or Helm from the pipeline, and manual deployments.",
    `# Argo CD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: shop-api
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://git.example.com/platform/shop-config.git
    targetRevision: main
    path: overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: shop
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true

# Release flow:
# 1. CI builds image shop-api:1.4.0 and opens a PR in shop-config changing the tag
# 2. PR is reviewed and merged
# 3. Argo CD detects the change and syncs the cluster
# 4. Rollback = git revert of that commit`
  ],
  "Cloud Cost Awareness": [
    "Cloud cost is a design concern: right-size instances and containers, autoscale, use reserved capacity or savings plans and spot instances where suitable, control data transfer and storage tiers, tag everything for cost allocation, and set budgets and alerts. This practice is known as FinOps.",
    "Costs come mainly from compute, storage, data egress, managed services and idle resources. FinOps combines engineering, finance and product to make cost visible per team and service, and to optimise continuously.",
    "Pay-as-you-go makes it easy to overspend through oversized instances, forgotten resources, chatty cross-zone traffic and unbounded logs or storage.",
    "Use it when sizing services, choosing managed versus self-hosted components, designing multi-region architectures and reviewing monthly bills.",
    "Avoid premature micro-optimisation that costs more engineering time than it saves, sacrificing reliability to save a little, and making cost-driven choices without measuring.",
    "Tag resources by team and service, set budgets and anomaly alerts, right-size using real CPU and memory metrics, set Kubernetes requests and limits properly, use autoscaling and scale-to-zero for non-production, shut down dev environments out of hours, use spot capacity for fault-tolerant jobs, apply lifecycle rules to storage and log retention, and reduce cross-AZ and egress traffic.",
    "Pros: lower bills and better efficiency. Cons: commitments (reserved capacity) reduce flexibility, spot instances can be reclaimed, and optimisation takes ongoing effort.",
    "Alternatives are on-premise or colocation for stable large workloads, serverless for spiky low-volume traffic, and cost tools such as AWS Cost Explorer, Kubecost or OpenCost.",
    `# Terraform: mandatory cost tags
locals {
  common_tags = {
    team        = "payments"
    service     = "shop-api"
    environment = "prod"
  }
}

# Kubernetes: right-sized requests and a horizontal autoscaler
# resources:
#   requests: { cpu: 250m, memory: 512Mi }
# kubectl autoscale deployment shop-api --cpu-percent=70 --min=2 --max=10

# S3 lifecycle: move old logs to cheaper storage, then expire
# transition after 30 days to STANDARD_IA
# expire after 365 days

# Quick checks
# kubectl top pods -n shop          # actual usage vs requests
# aws ce get-cost-and-usage ...     # cost by tag`
  ]
};
