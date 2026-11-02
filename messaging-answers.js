// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Queue vs Topic (Point-to-Point vs Pub/Sub)": [
    "A queue delivers each message to exactly one consumer (competing consumers, point-to-point), while a topic delivers every message to every subscriber (publish-subscribe). Kafka blends both: consumers in the same group compete for partitions, and different groups each get the full stream.",
    "In point-to-point, a message is removed once one consumer acknowledges it, which suits work distribution. In pub/sub, the broker fans a message out to all subscriptions, and each subscriber tracks its own position or has its own queue.",
    "Work distribution and event broadcast are different needs, and one model cannot serve both without the producer knowing the consumers.",
    "Use a queue for tasks such as sending emails or processing payments, where one worker should handle each job. Use a topic for domain events such as OrderPlaced, where billing, shipping and analytics all react independently.",
    "Do not use pub/sub when exactly one handler must act, or a queue when several services need the same fact, since publishers would end up knowing every consumer.",
    "In RabbitMQ bind one queue to an exchange for point-to-point and bind a queue per subscriber to a fanout or topic exchange for pub/sub. In Kafka use one consumer group for competing consumers and a separate group.id per independent subscriber.",
    "Queues give simple load levelling but messages are gone after consumption, so replay is hard. Topics decouple producers from consumers and allow replay in a log-based broker, at the cost of more storage and subscriber-side offset management.",
    "Alternatives are the JMS Queue and Topic models, SNS fan-out to multiple SQS queues, Redis Streams, and synchronous HTTP calls when an immediate reply is required.",
    `// Kafka: same group.id = competing consumers (queue semantics)
// Different group.id per service = every service sees every event (pub/sub semantics)
@KafkaListener(topics = "orders", groupId = "billing")
public void billing(OrderPlaced e) { /* only one billing instance gets each record */ }

@KafkaListener(topics = "orders", groupId = "shipping")
public void shipping(OrderPlaced e) { /* shipping also receives every record */ }`
  ],
  "Delivery Guarantees": [
    "Messaging offers at-most-once (may lose, never duplicates), at-least-once (never loses, may duplicate) and exactly-once (effect applied once, which needs transactions or idempotence). In practice you run at-least-once and make consumers idempotent.",
    "At-most-once commits or acknowledges before processing. At-least-once acknowledges after processing, so a crash in between causes redelivery. Exactly-once processing is achieved through broker transactions in a closed read-process-write loop, or by deduplicating at the consumer.",
    "Networks and processes fail between sending, processing and acknowledging, so a system must choose between losing and repeating work.",
    "At-most-once fits lossy telemetry. At-least-once is the default for business events. Exactly-once semantics fit Kafka-to-Kafka stream processing and some financial pipelines.",
    "Do not claim end-to-end exactly-once when a side effect such as an email, a payment gateway call or an HTTP request sits outside the transactional boundary.",
    "Producer side: acks=all, enable.idempotence=true and retries. Consumer side: disable auto-commit, process then commit, and dedupe by a business or message id. Add an outbox so database change and publish do not diverge.",
    "At-least-once is robust and simple, but demands idempotent handlers. Exactly-once adds latency and operational constraints, and at-most-once risks silent data loss.",
    "Alternatives are the transactional outbox with idempotent consumers, the inbox pattern, and reconciliation jobs that repair drift.",
    `# Producer settings for at-least-once without duplicates on retry
acks=all
enable.idempotence=true
retries=2147483647
delivery.timeout.ms=120000
# Consumer: commit after processing
enable.auto.commit=false`
  ],
  "Message Ordering": [
    "Ordering is only guaranteed within a single queue or partition, so you choose a key (such as orderId) so related messages land on the same partition and are processed by one consumer at a time. Global ordering across all messages costs you parallelism.",
    "Kafka preserves order per partition and the default partitioner hashes the key. Competing consumers, retries and redelivery on a classic queue can reorder messages, and SQS FIFO ensures order per message group id.",
    "Business rules such as OrderCreated before OrderCancelled depend on sequence, but scaling needs parallel consumers.",
    "Use per-key ordering when events about one entity must be applied in sequence, such as account balance updates or state transitions.",
    "Do not rely on global ordering at scale, and do not assume order survives repartitioning, parallel handlers inside one consumer, or retries through a separate retry topic.",
    "Set a stable message key, keep max.in.flight.requests.per.connection at 5 or less with idempotence enabled so retries keep order, process each partition on a single thread, and include a version or sequence number so consumers can detect gaps and stale events.",
    "Per-key ordering scales well but can create hot partitions if keys are skewed. Strict global ordering needs a single partition and so a single consumer.",
    "Alternatives are sequence numbers with optimistic version checks, event-time reordering buffers, and a single-writer design per aggregate.",
    `// Key by aggregate id so all events for one order go to one partition
kafkaTemplate.send("orders", order.getId().toString(), event);

// Idempotent producer keeps order across retries
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.producer.properties.max.in.flight.requests.per.connection=5`
  ],
  "Acknowledgements and Redelivery": [
    "An acknowledgement tells the broker a message has been processed, and anything unacknowledged is redelivered after a timeout, a disconnect or a negative ack. Ack after the work is durable, and expect duplicates.",
    "RabbitMQ uses basic.ack, basic.nack and basic.reject with a prefetch limit. SQS hides a message for the visibility timeout (30 seconds by default) and redelivers if it is not deleted. Kafka has no per-message ack, instead consumers commit offsets.",
    "Without acknowledgements the broker cannot know whether a consumer crashed mid-processing, so messages would be lost or stuck.",
    "Use manual acknowledgement when processing has side effects that must succeed before the message is considered done.",
    "Do not auto-ack before processing for important data, do not ack on failure without a DLQ strategy, and do not make the visibility timeout shorter than the processing time.",
    "In Spring AMQP use AcknowledgeMode.AUTO with retry plus a dead-letter policy, set prefetch to a sensible number, and requeue only for transient errors. In SQS set the visibility timeout above processing time and extend it for long jobs.",
    "Early ack is fast but risks loss, late ack is safe but causes duplicates. Unbounded requeue can create a hot loop that starves other messages.",
    "Alternatives are transactional consumption, offset commit control in Kafka, and publisher confirms for the producer side.",
    `// Spring AMQP: manual ack
@RabbitListener(queues = "orders.q", ackMode = "MANUAL")
public void handle(OrderPlaced m, Channel ch, @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws IOException {
    try {
        service.process(m);
        ch.basicAck(tag, false);
    } catch (TransientException e) {
        ch.basicNack(tag, false, true);   // requeue
    } catch (Exception e) {
        ch.basicNack(tag, false, false);  // to dead-letter exchange
    }
}`
  ],
  "Dead-Letter Queues and Retry Topics": [
    "A dead-letter queue (DLQ) holds messages that could not be processed after limited retries so they stop blocking the main flow and can be inspected or replayed. Pair it with bounded retries with backoff, and with non-blocking retry topics when ordering allows.",
    "RabbitMQ routes rejected or expired messages through a dead-letter exchange (x-dead-letter-exchange). SQS uses a redrive policy with maxReceiveCount. In Spring Kafka, DeadLetterPublishingRecoverer publishes the failed record to a topic named after the original with a .DLT suffix, and @RetryableTopic creates delayed retry topics.",
    "One failing message must not block a partition or consume infinite retries, and failed data must not be silently dropped.",
    "Use it for malformed payloads, downstream outages that outlast short retries, and business rule rejections that need human review.",
    "Do not use a DLQ as a trash can nobody reads, retry non-retryable errors such as deserialization failures, or use non-blocking retry topics where strict per-key order must be preserved.",
    "Classify errors as retryable or not, retry with exponential backoff and jitter, add failure metadata headers (exception, original topic, offset), alert on DLQ depth, and build a tool to replay after the fix.",
    "Pros: isolates failures and keeps throughput. Cons: loses ordering for retried messages, adds operational work, and unmonitored DLQs hide data loss.",
    "Alternatives are blocking retries with a pause (DefaultErrorHandler with backoff), a parking-lot table in a database, and circuit breakers that pause the consumer.",
    `@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template);   // sends to orders.DLT
    var backoff = new ExponentialBackOffWithMaxRetries(4);
    backoff.setInitialInterval(1000);
    backoff.setMultiplier(2.0);
    var handler = new DefaultErrorHandler(recoverer, backoff);
    handler.addNotRetryableExceptions(DeserializationException.class, IllegalArgumentException.class);
    return handler;
}

// Non-blocking alternative
@RetryableTopic(attempts = "4", backoff = @Backoff(delay = 1000, multiplier = 2.0))
@KafkaListener(topics = "payments")
public void onPayment(Payment p) { service.process(p); }`
  ],
  "Message Deduplication": [
    "Because delivery is at-least-once, consumers must tolerate duplicates by making handlers idempotent or by recording processed message ids. A unique id plus a unique constraint in the same transaction as the business change is the most robust approach.",
    "Duplicates come from producer retries, consumer redelivery after a crash, rebalances and replays. Deduplication uses a message id, or a natural idempotency key, checked against a store of processed ids.",
    "You cannot avoid duplicates in a distributed system, but you can make their effect harmless.",
    "Use it for any consumer with side effects such as charging, creating records or sending notifications.",
    "Do not keep dedupe ids in memory only, since they vanish on restart, and do not hold ids forever without a retention policy unless you can afford the storage.",
    "Put a unique message id in headers or payload, implement the inbox pattern: insert the id into a processed_messages table with a unique constraint in the same transaction as the business update, and skip when the insert conflicts. Prefer naturally idempotent operations such as upserts and set-to-value updates.",
    "A database inbox is exact but adds a write per message and needs cleanup. Broker-side dedupe such as SQS FIFO is bounded to a 5-minute window, and Kafka idempotent producers only dedupe producer retries within a session.",
    "Alternatives are idempotent natural operations, Redis SET NX with TTL for short windows, and Kafka transactions for stream processing.",
    `@Transactional
public void handle(OrderPaid event) {
    try {
        processedRepo.save(new ProcessedMessage(event.messageId()));  // unique constraint on message_id
    } catch (DataIntegrityViolationException dup) {
        return;                                                      // duplicate, ignore
    }
    orderService.markPaid(event.orderId());
}`
  ],
  "Poison Messages": [
    "A poison message is one that always fails processing, such as a malformed payload or a bug trigger, and it can block a partition or loop forever. Detect it with bounded retries and divert it to a DLQ, and treat deserialization errors explicitly.",
    "With in-order consumption the consumer retries the same record repeatedly, so lag grows behind it. A deserialization failure inside the Kafka client can even stop the consumer before your code runs.",
    "One bad record can stall a whole partition and trigger endless redelivery and alert noise.",
    "Use it as a design check whenever a consumer processes messages in sequence, or reads data from outside your control.",
    "Do not retry non-transient failures indefinitely, and do not drop the message without recording it.",
    "Wrap the deserializer with ErrorHandlingDeserializer in Spring Kafka, mark validation and deserialization exceptions as not retryable, cap redelivery attempts, publish to a DLT with headers, and alert on any DLT traffic.",
    "Pros: protects throughput. Cons: needs a replay and triage process, and skipping a record can break ordering assumptions.",
    "Alternatives are schema validation at the producer, a schema registry with compatibility checks, and parking the key so later messages for the same entity wait.",
    `spring.kafka.consumer.key-deserializer=org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
spring.kafka.consumer.properties.spring.deserializer.value.delegate.class=org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties.spring.json.trusted.packages=com.example.events`
  ],
  "Kafka Architecture": [
    "Kafka is a distributed, partitioned, replicated commit log: producers append records to topic partitions on brokers, consumers pull and track their own offsets, and data is retained by time or size rather than deleted on consumption. Since Kafka 4.0 it runs on KRaft with no ZooKeeper.",
    "A topic is split into partitions, each an ordered append-only log with a leader and follower replicas on different brokers. Controllers in a KRaft quorum manage metadata, and consumer group state is kept in the internal __consumer_offsets topic.",
    "Traditional brokers struggle with high throughput, replay and many independent consumers, and a log with sequential disk I/O and zero-copy gives very high throughput.",
    "Use it for event streaming, log aggregation, event-driven microservices, CDC pipelines and stream processing where replay and scale matter.",
    "Do not use it for low-volume task queues needing per-message routing, priorities or delayed delivery, or for request-reply where a simpler broker is easier to run.",
    "Size partitions for target parallelism, use replication.factor 3 with min.insync.replicas 2, pick message keys deliberately, tune retention.ms or retention.bytes, and run dedicated or combined KRaft controllers. Monitor under-replicated partitions, request latency and consumer lag.",
    "Pros: throughput, durability, replay and ecosystem (Connect, Streams). Cons: operational complexity, partition count limits parallelism, and a weaker fit for routing and priority queues.",
    "Alternatives are RabbitMQ, Pulsar, Amazon SQS and SNS, Redpanda, and managed services such as Amazon MSK or Confluent Cloud.",
    `# Create a topic with 6 partitions and 3 replicas
kafka-topics.sh --bootstrap-server localhost:9092 --create --topic orders
  --partitions 6 --replication-factor 3 --config min.insync.replicas=2 --config retention.ms=604800000
  (all of the above on one command line)

# Inspect leaders and ISR
kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic orders`
  ],
  "Partitions and Consumer Groups": [
    "A topic is divided into partitions, and within a consumer group each partition is assigned to exactly one consumer, so the partition count caps parallelism. Different groups read the same topic independently.",
    "The group coordinator broker assigns partitions to members, and a rebalance happens when members join, leave or time out. Keyed records hash to a stable partition, and records without a key are spread by the sticky partitioner.",
    "Partitions allow parallel writes and reads and keep order per key, while groups allow scaling consumers and multiple independent applications.",
    "Choose partition count from target throughput divided by per-consumer throughput, with headroom, since you can add partitions later but not remove them.",
    "Do not run more consumers than partitions expecting more speed, since extras sit idle, and do not increase partitions on a keyed topic casually, because it changes the key-to-partition mapping and breaks ordering for existing keys.",
    "Set group.id, choose the assignor (CooperativeStickyAssignor reduces stop-the-world rebalances), use static membership with group.instance.id for rolling restarts, and set concurrency in Spring Kafka to the number of partitions to consume in parallel inside one instance.",
    "More partitions give more parallelism but increase file handles, replication traffic, leader election time and end-to-end latency. Too few caps throughput.",
    "Alternatives are the Share Groups queue-like model (KIP-932, new in Kafka 4.x), manual partition assignment with assign(), and RabbitMQ competing consumers.",
    `@KafkaListener(topics = "orders", groupId = "billing", concurrency = "6")
public void onOrder(ConsumerRecord<String, OrderPlaced> rec) { ... }

# consumer config
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
group.instance.id=billing-pod-1`
  ],
  "Offsets and Commit Strategies": [
    "An offset is a consumer's position in a partition, and the committed offset stored in __consumer_offsets decides where it resumes after a restart. Commit after processing for at-least-once, and avoid auto-commit when losing messages matters.",
    "Auto-commit (enable.auto.commit=true, interval 5 seconds) commits offsets of records returned by poll in the background, which can lose records if processing fails afterwards. Manual commit can be synchronous or asynchronous, per record or per batch.",
    "The committed offset is the only recovery point for a consumer, so when and how you commit defines the delivery guarantee.",
    "Use manual commit after successful processing for important data, and auto-commit only for tolerant workloads.",
    "Do not commit before processing, do not commit offsets of records you have not handled when a batch partly fails, and do not forget that auto.offset.reset only applies when no committed offset exists.",
    "In Spring Kafka set enable.auto.commit=false and choose AckMode: BATCH (default), RECORD, MANUAL or MANUAL_IMMEDIATE with Acknowledgment.acknowledge(). Commit synchronously on shutdown and in a rebalance listener, and store offsets with results when you need exactly-once.",
    "Per-record commits are safest but slow, batch commits are fast but reprocess more after a crash. Async commits are faster but may be reordered or fail silently.",
    "Alternatives are storing offsets in your own database alongside the results, and Kafka transactions with sendOffsetsToTransaction.",
    `spring.kafka.consumer.enable-auto-commit=false
spring.kafka.listener.ack-mode=manual

@KafkaListener(topics = "payments", groupId = "ledger")
public void onPayment(Payment p, Acknowledgment ack) {
    ledgerService.apply(p);
    ack.acknowledge();      // commit only after success
}`
  ],
  "Replication and ISR": [
    "Each partition has a leader and follower replicas, and the in-sync replica set (ISR) is the followers that are caught up with the leader. With acks=all, replication.factor 3 and min.insync.replicas 2 a write is acknowledged only after at least two replicas have it, so one broker can fail without data loss.",
    "Followers fetch from the leader, and a follower that lags beyond replica.lag.time.max.ms (30 seconds by default) is removed from the ISR. When the leader fails, the controller elects a new leader from the ISR, and the high watermark marks the offset visible to consumers.",
    "Brokers fail, and the log must stay durable and available without losing acknowledged data.",
    "Apply it to every production topic, with replicas spread across racks or availability zones using broker.rack.",
    "Do not enable unclean.leader.election.enable (default false) when data loss is unacceptable, and do not set min.insync.replicas equal to the replication factor, since one broker loss would block writes.",
    "Use replication.factor=3, min.insync.replicas=2, acks=all on producers, rack awareness, and alert on UnderReplicatedPartitions and offline partitions. Consider follower fetching (KIP-392) to read from the nearest replica.",
    "Pros: durability and automatic failover. Cons: acks=all adds latency, and a shrunken ISR below min.insync.replicas causes producer errors such as NotEnoughReplicas.",
    "Alternatives are acks=1 for lower latency with risk of loss, MirrorMaker 2 or cluster linking for cross-cluster replication, and tiered storage for retention.",
    `# Topic and producer settings for durability
replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false

# producer
acks=all
enable.idempotence=true`
  ],
  "Exactly-Once Semantics": [
    "Kafka's exactly-once semantics combine the idempotent producer (enabled by default since 3.0), transactions that write output records and consumer offsets atomically, and read_committed consumers. It applies to the read-process-write loop within Kafka, not to external side effects.",
    "The idempotent producer uses a producer id and per-partition sequence numbers to drop duplicate retries. A transactional producer with a transactional.id commits or aborts a batch across partitions, and consumers with isolation.level=read_committed skip aborted records.",
    "At-least-once retries and rebalances produce duplicates, which are wrong for aggregations and ledgers computed from streams.",
    "Use it for consume-transform-produce pipelines and Kafka Streams with processing.guarantee=exactly_once_v2.",
    "Do not expect it to cover database writes, HTTP calls or emails, which need idempotency or the outbox pattern, and do not use it where latency and throughput cost cannot be afforded.",
    "Set a unique stable transactional.id per producer instance (in Spring set transaction-id-prefix), wrap the read-process-write in a KafkaTransactionManager transaction so offsets are sent with sendOffsetsToTransaction, and consume with read_committed.",
    "Pros: no duplicates or loss inside Kafka. Cons: higher latency from transaction markers, more complexity and fencing issues if transactional ids are mismanaged.",
    "Alternatives are at-least-once with idempotent consumers, the outbox with deduplication, and database-stored offsets.",
    `spring.kafka.producer.transaction-id-prefix=tx-orders-
spring.kafka.producer.acks=all
spring.kafka.consumer.isolation-level=read_committed
spring.kafka.consumer.enable-auto-commit=false

@KafkaListener(topics = "orders")
@Transactional("kafkaTransactionManager")
public void process(OrderPlaced in) {
    kafkaTemplate.send("invoices", in.orderId(), toInvoice(in));  // offset is committed in the same transaction
}`
  ],
  "Consumer Lag and Rebalancing": [
    "Consumer lag is the gap between the log end offset and the group's committed offset, and it signals consumers falling behind. Rebalances reassign partitions when group membership changes and pause consumption, so tune poll and session timeouts and use cooperative or static assignment.",
    "A consumer is removed from the group if it does not heartbeat within session.timeout.ms (45 seconds by default since 3.0), or does not call poll within max.poll.interval.ms (5 minutes). Eager rebalancing revokes all partitions, while cooperative rebalancing moves only the affected ones, and the new consumer protocol (KIP-848, GA in Kafka 4.0) moves the logic to the broker.",
    "Growing lag means stale data and delayed processing, and frequent rebalances cause duplicates and throughput dips.",
    "Monitor lag per partition for every consumer group, and tune when deployments, autoscaling or slow handlers cause repeated rebalances.",
    "Do not do slow blocking work inside the poll loop without adjusting max.poll.interval.ms, and do not scale consumers beyond the partition count to fix lag.",
    "Alert on lag growth rate and on time-lag, not just absolute lag. Reduce max.poll.records for slow handlers, use CooperativeStickyAssignor, set group.instance.id for static membership, and add partitions or optimise handlers when lag persists. Check with kafka-consumer-groups.sh --describe.",
    "Static membership avoids rebalances on restart but delays failure detection. Short timeouts detect failure fast but cause spurious rebalances under GC pauses.",
    "Alternatives are the KIP-848 consumer group protocol, hand-offloading work to a worker pool with manual commits, and tools such as Burrow or Kafka Exporter for lag monitoring.",
    `kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group billing

# consumer tuning
max.poll.records=100
max.poll.interval.ms=300000
session.timeout.ms=45000
heartbeat.interval.ms=3000
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor`
  ],
  "Kafka Producer Tuning": [
    "Producer throughput is tuned mainly by batching: linger.ms, batch.size and compression.type, while durability is set by acks and idempotence. Waiting a few milliseconds to fill larger compressed batches greatly raises throughput.",
    "The producer buffers records per partition up to batch.size (16 KB default) and sends them after linger.ms (5 ms default in Kafka 4.0, 0 earlier), within buffer.memory (32 MB). Total send time is bounded by delivery.timeout.ms (2 minutes).",
    "Small unbatched requests waste network and broker CPU, and misconfigured retries cause duplicates or reordering.",
    "Tune when producing high volume, when latency targets are tight, or when brokers show high request rates.",
    "Do not raise linger.ms for latency-critical single-record sends without measuring, and do not disable idempotence with retries and many in-flight requests, since that can reorder.",
    "Set acks=all with enable.idempotence=true, linger.ms 5 to 20, batch.size 64 KB or more, compression.type lz4 or zstd, and max.in.flight.requests.per.connection up to 5. Handle send callbacks and monitor record-error-rate, batch-size-avg and request-latency-avg.",
    "Larger batches and compression raise throughput and cut bandwidth but add latency and CPU. acks=all adds latency compared with acks=1 but protects data.",
    "Alternatives are acks=1 or 0 for loss-tolerant metrics, and sending through Kafka Connect or a proxy for non-JVM clients.",
    `spring.kafka.producer.acks=all
spring.kafka.producer.compression-type=lz4
spring.kafka.producer.batch-size=65536
spring.kafka.producer.properties.linger.ms=10
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.producer.properties.delivery.timeout.ms=120000
spring.kafka.producer.properties.max.in.flight.requests.per.connection=5`
  ],
  "Log Compaction": [
    "A compacted topic (cleanup.policy=compact) keeps at least the latest record for each key instead of deleting by age, so the topic works as a changelog or table snapshot. A record with a null value is a tombstone that deletes the key after delete.retention.ms.",
    "A background cleaner thread rewrites older segments, dropping records that have a newer record with the same key, while the active segment is never compacted. Order and offsets of surviving records are preserved.",
    "Consumers that rebuild state, such as caches, KTables and configuration, need the current value per key without keeping unbounded history.",
    "Use it for entity state topics, CDC changelogs, configuration, and Kafka Streams state-store changelog topics.",
    "Do not use it when you need the full event history, for records without meaningful keys, or expect immediate removal of old values, since compaction is eventual.",
    "Set cleanup.policy=compact (or compact,delete to also expire), tune min.cleanable.dirty.ratio, segment.ms and delete.retention.ms, always key records, and publish a null value to delete a key.",
    "Pros: bounded storage with fast state recovery. Cons: history is lost, compaction lags behind, and the cleaner consumes IO.",
    "Alternatives are time-based retention with a separate state store, a database table, and event sourcing with snapshots.",
    `kafka-topics.sh --bootstrap-server localhost:9092 --create --topic customer-profile
  --partitions 3 --replication-factor 3
  --config cleanup.policy=compact
  --config min.cleanable.dirty.ratio=0.1
  --config delete.retention.ms=86400000
  (all of the above on one command line)

// delete a key
kafkaTemplate.send("customer-profile", "cust-42", null);   // tombstone`
  ],
  "Kafka Streams": [
    "Kafka Streams is a Java library for stateful stream processing that runs inside your application, with KStream and KTable abstractions, windowing, joins and local state stores backed by changelog topics. It scales by running more instances and supports exactly-once processing.",
    "Topology tasks are tied to input partitions. State is kept locally in RocksDB, replicated to compacted changelog topics, and rebuilt on another instance after failure, with num.standby.replicas reducing recovery time.",
    "Aggregations, joins and windows over streams need fault-tolerant state, and many teams do not want a separate processing cluster.",
    "Use it for real-time aggregations, enrichment joins, deduplication and event-driven transformations that read and write Kafka.",
    "Do not use it for sources and sinks outside Kafka (use Connect), for heavy batch analytics, or for non-JVM stacks.",
    "Define the topology with StreamsBuilder, set application.id, processing.guarantee=exactly_once_v2, and use co-partitioned topics for joins. Use windowed aggregations with grace periods for late data, and monitor state-store restoration and lag.",
    "Pros: no cluster to operate, elastic scaling, exactly-once. Cons: JVM only, state restoration time, repartition topics add traffic, and rebalancing affects stateful tasks.",
    "Alternatives are Apache Flink, Spark Structured Streaming, ksqlDB and plain consumers with a database.",
    `StreamsBuilder b = new StreamsBuilder();
KStream<String, Order> orders = b.stream("orders");
orders.groupByKey()
      .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1)))
      .count(Materialized.as("orders-per-5m"))
      .toStream()
      .map((k, v) -> KeyValue.pair(k.key(), v))
      .to("order-counts", Produced.with(Serdes.String(), Serdes.Long()));

# config
application.id=order-counter
processing.guarantee=exactly_once_v2
num.standby.replicas=1`
  ],
  "Schema Registry and Evolution": [
    "A schema registry stores versioned Avro, Protobuf or JSON Schema definitions and enforces compatibility rules, so producers and consumers can evolve independently. Messages carry only a schema id, and the default compatibility mode is BACKWARD.",
    "With the Confluent serializers each record starts with a magic byte and a 4-byte schema id that clients use to fetch the schema, and the registry checks each new version against the subject's compatibility setting: BACKWARD, FORWARD, FULL or their TRANSITIVE variants.",
    "Free-form JSON breaks consumers silently when fields change, and embedding schemas in every message wastes space.",
    "Use it whenever multiple teams share topics, or data is retained long enough that old and new formats coexist.",
    "Do not apply breaking changes (removing a required field, changing a type) to an existing subject, and do not skip a registry for topics consumed by many teams.",
    "Add fields with defaults, never reuse or change field numbers or types, set the subject strategy (TopicNameStrategy by default), run compatibility checks in CI, and upgrade consumers before producers under BACKWARD compatibility.",
    "Pros: safe evolution, compact messages, documented contracts. Cons: another component on the critical path, and required discipline on field changes.",
    "Alternatives are plain JSON with consumer-side validation, versioned topic names for breaking changes, and CloudEvents with a contract test suite.",
    `{
  "type": "record",
  "name": "OrderPlaced",
  "namespace": "com.example.events",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "amount", "type": "long"},
    {"name": "currency", "type": "string", "default": "USD"}
  ]
}

# producer config
value.serializer=io.confluent.kafka.serializers.KafkaAvroSerializer
schema.registry.url=http://schema-registry:8081
auto.register.schemas=false`
  ],
  "Kafka vs RabbitMQ vs SQS": [
    "Kafka is a durable replayable log for high-throughput streaming, RabbitMQ is a smart broker with flexible routing and per-message acknowledgement, and SQS is a fully managed queue with minimal operations. Pick by replay needs, routing complexity, throughput and operational capacity.",
    "Kafka consumers pull and track offsets, and retention is independent of consumption. RabbitMQ pushes messages through exchanges to queues and removes them on ack. SQS offers standard queues (at-least-once, best-effort ordering) and FIFO queues (ordering per message group, deduplication within 5 minutes).",
    "Different messaging problems, such as event streaming, task distribution and simple decoupling, are best served by different designs.",
    "Choose Kafka for event streams, replay, multiple consumers and stream processing, RabbitMQ for task queues, complex routing, priorities and request-reply, and SQS when running on AWS with low operational overhead.",
    "Do not use Kafka as a simple job queue with per-message retries, RabbitMQ for very large retained event logs, or SQS when you need replay or consumer-side ordering across many keys at high throughput.",
    "Decide on the main driver: throughput and replay point to Kafka, routing and priority point to RabbitMQ, and managed simplicity points to SQS plus SNS. Consider the team's skills and cloud platform, and plan DLQs and monitoring in each.",
    "Kafka: scale and replay but operational weight and no per-message ack. RabbitMQ: flexible but lower throughput ceiling and messages are gone once consumed. SQS: easy and elastic but limited ordering, no replay and vendor lock-in.",
    "Other options are Pulsar, Google Pub/Sub, Azure Service Bus, ActiveMQ Artemis, NATS JetStream and Redis Streams."
  ],
  "RabbitMQ Exchanges and Queues": [
    "Producers publish to an exchange, which routes messages to queues using bindings: direct (exact routing key), fanout (all bound queues), topic (pattern with * and #) or headers. Consumers read from queues, and quorum queues are the replicated, durable choice for production.",
    "A binding links an exchange to a queue with a binding key. Messages that cannot be routed are dropped unless the mandatory flag or an alternate exchange is used. Queues can have TTLs, length limits and a dead-letter exchange.",
    "Decoupling producers from queue names lets you add consumers and routing rules without touching producers.",
    "Use direct for targeted tasks, topic for hierarchical event routing such as order.*.created, and fanout for broadcast.",
    "Do not rely on classic mirrored queues (removed in RabbitMQ 4.0), publish without publisher confirms when loss matters, or let queues grow unbounded.",
    "Declare durable quorum queues (x-queue-type=quorum), enable publisher confirms and persistent messages, set a prefetch count, configure a dead-letter exchange, and declare topology in Spring with Queue, Exchange and Binding beans.",
    "Pros: rich routing and per-message control. Cons: lower throughput than Kafka, queues are not replayable, and long queues degrade performance.",
    "Alternatives are Kafka topics with keys, SNS topic with SQS subscriptions, and Azure Service Bus topics.",
    `@Bean TopicExchange orders() { return new TopicExchange("orders.x"); }

@Bean Queue billingQueue() {
    return QueueBuilder.durable("billing.q")
        .quorum()
        .deadLetterExchange("orders.dlx")
        .build();
}

@Bean Binding billingBinding() {
    return BindingBuilder.bind(billingQueue()).to(orders()).with("order.*.created");
}`
  ],
  "Request-Reply over Messaging": [
    "Request-reply over a broker sends a request message with a reply-to destination and a correlation id, and the caller matches the response by that id. It adds a timeout, and it is usually better to stay asynchronous unless you need broker-based load balancing or decoupling.",
    "The requester publishes to a request queue or topic, the responder processes and publishes to the reply-to destination, copying the correlation id. Spring offers ReplyingKafkaTemplate and RabbitTemplate.convertSendAndReceive.",
    "Sometimes a caller needs an answer from a service reached only through a broker, for example behind a firewall or for load-levelled work.",
    "Use it for RPC-like calls where the broker provides buffering or routing, or when migrating a messaging-based integration.",
    "Do not use it for ordinary synchronous queries where HTTP or gRPC is simpler and lower latency, and avoid it in long call chains, since timeouts and lost replies are hard to handle.",
    "Generate a correlation id, set a per-request reply destination or one shared reply topic per instance, set a timeout and handle late replies, make the responder idempotent, and consider returning 202 with a status endpoint instead.",
    "Pros: decoupled and load-balanced. Cons: higher latency, timeout and orphan reply handling, and more infrastructure than a direct call.",
    "Alternatives are HTTP or gRPC, an asynchronous callback or webhook, and polling a status resource.",
    `@Bean
ReplyingKafkaTemplate<String, PriceRequest, PriceReply> template(
        ProducerFactory<String, PriceRequest> pf,
        ConcurrentMessageListenerContainer<String, PriceReply> replies) {
    return new ReplyingKafkaTemplate<>(pf, replies);
}

RequestReplyFuture<String, PriceRequest, PriceReply> f =
    template.sendAndReceive(new ProducerRecord<>("price.requests", key, req), Duration.ofSeconds(5));
PriceReply reply = f.get(5, TimeUnit.SECONDS).value();`
  ]
};
