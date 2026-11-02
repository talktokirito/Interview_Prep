// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "Test Pyramid and Strategy": [
    "The test pyramid says to have many fast unit tests, fewer integration tests and very few end-to-end tests, so feedback stays fast and failures are easy to locate. In practice for Spring services I favour a 'testing trophy' shape with a solid layer of integration tests against real databases via Testcontainers.",
    "Unit tests check a class in isolation, integration tests check collaboration with real infrastructure such as a database or broker, and end-to-end tests drive the whole system through its UI or public API. The pyramid ranks them by cost, speed and fragility.",
    "Higher-level tests are slower, flakier and harder to debug, so the bulk of logic coverage should sit at the cheapest level that can catch the bug.",
    "Use it to plan a test suite for a new service, to review a slow or flaky pipeline, and to decide where a given check belongs.",
    "Do not follow the shape dogmatically: an anaemic service with mostly wiring and SQL gains little from mocked unit tests, and an inverted 'ice cream cone' of manual or UI tests is the classic anti-pattern.",
    "Cover business rules with plain unit tests, repositories and controllers with slice or Testcontainers integration tests, service boundaries with contract tests, and keep a handful of smoke end-to-end tests for critical journeys. Run unit tests on every commit and slower suites in the pipeline.",
    "Pros: fast feedback, cheap maintenance, clear failure location. Cons: over-mocking in unit tests can hide integration bugs, and the ideal ratio depends on the architecture.",
    "Alternatives are the testing trophy (integration-heavy), the testing honeycomb for microservices, and risk-based testing where effort follows business criticality rather than a fixed shape.",
    `// Unit level: pure logic, no Spring, runs in milliseconds
class PriceCalculatorTest {
    @Test
    void appliesTenPercentDiscountOverThreshold() {
        var calc = new PriceCalculator();
        assertThat(calc.total(new BigDecimal("200.00"))).isEqualByComparingTo("180.00");
    }
}

// Integration level: real PostgreSQL via Testcontainers
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class OrderRepositoryIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");

    @Autowired OrderRepository repo;

    @Test
    void findsOrdersByCustomer() {
        repo.save(new Order("c-1", new BigDecimal("10.00")));
        assertThat(repo.findByCustomerId("c-1")).hasSize(1);
    }
}`
  ],
  "Unit Testing Best Practices": [
    "A good unit test is fast, isolated, deterministic and checks one behaviour, written in the arrange-act-assert shape with a name that states the scenario and expectation. Test behaviour through the public API, not implementation details.",
    "A unit test exercises a small piece of code with its collaborators replaced or trivial. The FIRST principles describe it: Fast, Isolated, Repeatable, Self-validating, Timely.",
    "Tests are the safety net for refactoring; brittle or unclear tests slow the team down and get deleted, so design them to fail only when behaviour really breaks.",
    "Use them for business rules, calculations, validation, state transitions and edge cases such as nulls, empty collections, boundaries and error paths.",
    "Avoid testing getters, framework code or private methods directly, asserting on interaction details that do not matter, sharing mutable state between tests, and depending on time, randomness or test order.",
    "Name tests by behaviour, use one logical assertion per test, build data with test builders or object mothers, inject Clock and random sources, keep tests independent, and treat test code with the same care as production code.",
    "Pros: fast feedback, living documentation, safe refactoring. Cons: they cost maintenance time, and over-specified tests with heavy mocking break on every refactor without catching real bugs.",
    "Alternatives or complements are integration tests, property-based tests, approval or snapshot tests for large outputs, and static analysis.",
    `class DiscountServiceTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-01-15T10:00:00Z"), ZoneOffset.UTC);
    private final DiscountService service = new DiscountService(clock);

    @Test
    @DisplayName("gives no discount to a customer with no previous orders")
    void noDiscountForNewCustomer() {
        // arrange
        Customer newCustomer = CustomerBuilder.aCustomer().withOrders(0).build();
        // act
        BigDecimal discount = service.discountFor(newCustomer);
        // assert
        assertThat(discount).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void rejectsNullCustomer() {
        assertThatNullPointerException().isThrownBy(() -> service.discountFor(null));
    }
}`
  ],
  "Test Doubles (Mock, Stub, Fake, Spy)": [
    "Test doubles replace real collaborators: a stub returns canned answers, a mock verifies interactions, a fake is a lightweight working implementation (like an in-memory repository), and a spy wraps a real object while recording calls. Prefer stubs and fakes for state-based tests and use mocks sparingly for outbound side effects.",
    "Dummy objects fill parameters, stubs provide fixed responses, spies record how they were called, mocks have pre-set expectations that are verified, and fakes have real but simplified behaviour. The terms come from Gerard Meszaros and Martin Fowler.",
    "They isolate the unit under test from slow, non-deterministic or hard-to-trigger dependencies such as networks, clocks, payment gateways and failures.",
    "Use stubs to feed data in, mocks or spies to verify that an email was sent or an event was published, and fakes where a collaborator has rich behaviour such as a repository or clock.",
    "Do not mock types you own heavily in a way that mirrors the implementation, mock value objects or third-party types you do not control, or verify every call; over-mocking couples tests to internals and gives false confidence.",
    "With Mockito use mock and when/thenReturn for stubs, verify for interactions, spy for partial mocking, and write small hand-made fakes for ports like an InMemoryOrderRepository. Mock at architectural boundaries, not between every pair of classes.",
    "Pros: isolation, speed, control over failures. Cons: mocks can drift from real behaviour, tests become coupled to implementation, and a green mock-based suite does not prove integration works.",
    "Alternatives are real collaborators in integration tests, Testcontainers for infrastructure, WireMock for HTTP services and contract tests to keep doubles honest.",
    `// Stub: canned answer
when(rateClient.rateFor("EUR")).thenReturn(new BigDecimal("1.10"));

// Mock verification: outbound side effect
verify(mailSender).send(argThat(m -> m.to().equals("user@example.com")));

// Fake: small working implementation
class InMemoryOrderRepository implements OrderRepository {
    private final Map<String, Order> store = new HashMap<>();
    public void save(Order o) { store.put(o.id(), o); }
    public Optional<Order> find(String id) { return Optional.ofNullable(store.get(id)); }
}

// Spy: real object, selective override
List<String> real = new ArrayList<>();
List<String> spy = spy(real);
doReturn(99).when(spy).size();`
  ],
  "TDD": [
    "Test-driven development is the red-green-refactor loop: write a failing test, write the minimum code to pass, then refactor with the tests as a safety net. It drives small steps, testable design and high coverage, and works best for logic-heavy code.",
    "Red means a new test fails for the right reason, green means the simplest implementation makes it pass, and refactor means clean up the code and tests while staying green. Classicist (Detroit) TDD builds from the inside out using real objects, and mockist (London) TDD works outside in with mocks.",
    "Writing the test first forces you to think about the API and requirements, keeps changes small, and prevents untested code from accumulating.",
    "Use it for algorithms, business rules, bug fixes (write a failing reproduction first) and when requirements are clear but design is open.",
    "It is less useful for exploratory spikes, UI layout, throwaway scripts and glue code; and it can degrade into tests that mirror the implementation if applied mechanically.",
    "Pick the next simplest behaviour, write one failing test, make it pass in the quickest way, refactor duplication, commit, repeat. Triangulate with a second example before generalising, and keep each cycle to a few minutes.",
    "Pros: better design, fewer defects, confidence to refactor. Cons: slower start, needs discipline and skill, and can encourage over-specified tests.",
    "Alternatives are test-after development, BDD (behaviour-first with business language), and property-based or exploratory testing where example-first is awkward.",
    `// 1. RED: test first, class does not even exist yet
@Test
void fizzBuzzForMultiplesOfThreeAndFive() {
    assertThat(FizzBuzz.of(15)).isEqualTo("FizzBuzz");
    assertThat(FizzBuzz.of(3)).isEqualTo("Fizz");
    assertThat(FizzBuzz.of(5)).isEqualTo("Buzz");
    assertThat(FizzBuzz.of(7)).isEqualTo("7");
}

// 2. GREEN: smallest code that passes, 3. REFACTOR afterwards
final class FizzBuzz {
    static String of(int n) {
        if (n % 15 == 0) return "FizzBuzz";
        if (n % 3 == 0) return "Fizz";
        if (n % 5 == 0) return "Buzz";
        return String.valueOf(n);
    }
}`
  ],
  "BDD and Cucumber": [
    "Behaviour-driven development specifies behaviour in a shared business language, usually Given-When-Then scenarios, and Cucumber turns those Gherkin files into executable tests by binding steps to Java code. It pays off when business people actually read and co-author the scenarios.",
    "Gherkin feature files describe scenarios in plain text with Given (context), When (action) and Then (outcome). Cucumber-JVM matches each step to a step definition method via annotations or expressions and runs them with JUnit.",
    "BDD aims to align developers, testers and the business on requirements and to produce living documentation that is verified on every build.",
    "Use it for acceptance-level scenarios on complex business flows, regulated domains needing traceable requirements, and teams practising the Three Amigos conversation.",
    "Avoid it for purely technical tests, when only developers will ever read the feature files, or as a replacement for unit tests; the extra layer adds maintenance with no benefit otherwise.",
    "Add the cucumber-java and cucumber-junit-platform-engine dependencies, write feature files under src/test/resources, implement steps with @Given, @When and @Then, share state through a scoped world object, and keep scenarios declarative rather than UI-script-like.",
    "Pros: shared language, living documentation, business-readable tests. Cons: extra abstraction and slow runs, brittle step reuse, and scenarios degrade into imperative scripts if not curated.",
    "Alternatives are plain JUnit with descriptive names and the given-when-then comment style, Spock-style specs, Spring REST Docs, and example mapping workshops without tooling.",
    `# src/test/resources/features/discount.feature
Feature: Loyalty discount
  Scenario: Gold customer gets ten percent off
    Given a customer with status "GOLD"
    When they place an order worth 200.00
    Then the order total is 180.00

// Step definitions
public class DiscountSteps {
    private Customer customer;
    private Order order;

    @Given("a customer with status {string}")
    public void customerWithStatus(String status) {
        customer = new Customer(Status.valueOf(status));
    }

    @When("they place an order worth {bigdecimal}")
    public void placeOrder(BigDecimal amount) {
        order = orderService.place(customer, amount);
    }

    @Then("the order total is {bigdecimal}")
    public void totalIs(BigDecimal expected) {
        assertThat(order.total()).isEqualByComparingTo(expected);
    }
}`
  ],
  "JUnit 5 Essentials": [
    "JUnit 5 (Jupiter) uses @Test, lifecycle hooks (@BeforeEach, @AfterEach, @BeforeAll, @AfterAll), @Nested, @DisplayName, @Disabled, assertAll and assertThrows, plus a powerful extension model replacing JUnit 4 runners and rules. JUnit 6 keeps the Jupiter programming model on a Java 17 baseline.",
    "JUnit 5 is composed of the Platform (launching), Jupiter (the programming and extension model) and Vintage (running JUnit 4 tests). Extensions implement callbacks such as BeforeEachCallback or ParameterResolver and are registered with @ExtendWith.",
    "JUnit 4 had a single monolithic jar, runners that could not be combined and limited extensibility; the new design is modular, supports lambdas and composes extensions.",
    "Use it as the default unit and integration test framework on the JVM, including Spring Boot tests, which register SpringExtension automatically via annotations like @SpringBootTest.",
    "Avoid mixing JUnit 4 annotations (org.junit.Test) with Jupiter in the same class, relying on test execution order, and using static mutable state or @TestInstance(PER_CLASS) without understanding the shared-state implications.",
    "Use @Nested classes to group scenarios, assertAll for grouped assertions, assertThrows for exceptions, @Tag to filter in CI, @TempDir for files, @Timeout for hung tests, and @ExtendWith(MockitoExtension.class) for Mockito. Tests can be public or package-private.",
    "Pros: modular, extensible, modern API, strong IDE and build tool support. Cons: a migration effort from JUnit 4 rules and runners, and some third-party libraries still target the older model.",
    "Alternatives are TestNG, Spock (Groovy), and Kotest. AssertJ or Hamcrest complement the built-in assertions.",
    `@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock PaymentClient payments;
    @InjectMocks OrderService service;

    @TempDir Path tmp;

    @BeforeEach
    void setUp() { /* runs before every test */ }

    @Test
    @DisplayName("fails when payment is declined")
    @Timeout(2)
    void declinedPayment() {
        when(payments.charge(any())).thenReturn(PaymentResult.DECLINED);
        var ex = assertThrows(PaymentException.class, () -> service.checkout(cart()));
        assertAll(
            () -> assertEquals("DECLINED", ex.getCode()),
            () -> assertNotNull(ex.getMessage())
        );
    }

    @Nested
    class WhenCartIsEmpty {
        @Test
        void checkoutIsRejected() {
            assertThrows(IllegalStateException.class, () -> service.checkout(emptyCart()));
        }
    }
}`
  ],
  "Mockito": [
    "Mockito creates mocks and spies to isolate a unit: stub with when/thenReturn, verify with verify(), capture arguments with ArgumentCaptor, and use MockitoExtension with @Mock and @InjectMocks in JUnit 5. Mockito 5 uses the inline mock maker by default, so final classes and static methods can be mocked.",
    "A mock is a generated subclass or instrumented class whose methods return defaults until stubbed. Strict stubs, enabled by MockitoExtension, fail the test on unused or mismatched stubbings.",
    "It lets you test a class without its real dependencies, control their responses, force error paths and check that expected side effects occurred.",
    "Use it for service-layer tests with repository and client mocks, verifying outbound calls, and simulating exceptions or timeouts that are hard to reproduce.",
    "Avoid mocking value objects, collections or the class under test, deep stubbing chains (RETURNS_DEEP_STUBS) as a design smell, verifying trivial calls, and mockStatic as a first resort rather than refactoring.",
    "Annotate with @Mock and @InjectMocks under MockitoExtension, stub with when(...).thenReturn or doThrow for void methods, use BDDMockito given/then if you like the style, capture arguments with ArgumentCaptor, and use mockStatic inside try-with-resources.",
    "Pros: concise, widely known, great for failure injection. Cons: encourages implementation-coupled tests, hides design problems, and mockStatic or inline mocking can mask poor seams.",
    "Alternatives are hand-written fakes and stubs, Spring's @MockitoBean (replacing @MockBean) in Spring tests, WireMock for HTTP, and MockK in Kotlin.",
    `@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {
    @Mock UserRepository users;
    @Mock EmailGateway email;
    @InjectMocks NotificationService service;
    @Captor ArgumentCaptor<Email> captor;

    @Test
    void sendsWelcomeEmail() {
        given(users.findById(1L)).willReturn(Optional.of(new User(1L, "a@example.com")));

        service.welcome(1L);

        then(email).should().send(captor.capture());
        assertThat(captor.getValue().to()).isEqualTo("a@example.com");
    }

    @Test
    void propagatesGatewayFailure() {
        given(users.findById(1L)).willReturn(Optional.of(new User(1L, "a@example.com")));
        doThrow(new IllegalStateException("smtp down")).when(email).send(any());

        assertThrows(IllegalStateException.class, () -> service.welcome(1L));
    }

    @Test
    void staticMock() {
        try (MockedStatic<UUID> uuid = mockStatic(UUID.class)) {
            uuid.when(UUID::randomUUID).thenReturn(new UUID(0, 1));
            assertEquals(new UUID(0, 1), UUID.randomUUID());
        }
    }
}`
  ],
  "Parameterized and Dynamic Tests": [
    "@ParameterizedTest runs one test body against many inputs from sources like @ValueSource, @CsvSource, @MethodSource and @EnumSource, while @TestFactory creates tests dynamically at runtime. They remove duplicated tests and make boundary tables explicit.",
    "A parameterized test is a template invoked once per argument set, each reported as a separate result. A dynamic test is returned from a @TestFactory method as DynamicTest instances, so the number of tests can depend on runtime data.",
    "Many cases differ only in data; copying test methods is noisy and hides which inputs are covered.",
    "Use parameterized tests for boundary values, validation rules, equivalence classes and converters, and dynamic tests for data-driven cases discovered from files or lists.",
    "Avoid them when each case needs different setup or assertions, or when the table becomes so large and cryptic that failures are hard to understand.",
    "Add the junit-jupiter-params dependency, pick the simplest source (ValueSource, CsvSource, MethodSource with Arguments), set a readable name pattern, and use @NullAndEmptySource for null-safety checks. Note that dynamic tests do not run @BeforeEach per generated test.",
    "Pros: less duplication, broader input coverage, clear tables. Cons: harder debugging when failing row is cryptic, and dynamic tests have a different lifecycle than regular tests.",
    "Alternatives are separate named tests, property-based testing with jqwik for generated inputs, and @RepeatedTest for repetition without varying data.",
    `class EmailValidatorTest {
    @ParameterizedTest(name = "{0} is valid={1}")
    @CsvSource({
        "a@example.com, true",
        "no-at-sign.com, false",
        "'', false"
    })
    void validatesEmails(String input, boolean expected) {
        assertEquals(expected, EmailValidator.isValid(input));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "   "})
    void blankIsInvalid(String input) {
        assertFalse(EmailValidator.isValid(input));
    }

    @ParameterizedTest
    @MethodSource("ranges")
    void inRange(int value, boolean expected) {
        assertEquals(expected, Range.isValid(value));
    }

    static Stream<Arguments> ranges() {
        return Stream.of(Arguments.of(0, false), Arguments.of(1, true), Arguments.of(100, true), Arguments.of(101, false));
    }

    @TestFactory
    Stream<DynamicTest> dynamic() {
        return Stream.of("a", "bb", "ccc").map(s ->
            DynamicTest.dynamicTest("length of " + s, () -> assertTrue(s.length() > 0)));
    }
}`
  ],
  "AssertJ and Hamcrest": [
    "AssertJ offers fluent, type-aware assertions (assertThat(x).isEqualTo, hasSize, extracting, containsExactly) with excellent failure messages and IDE auto-completion, and Hamcrest uses composable matchers (assertThat(x, is(...))). I prefer AssertJ for readability and discoverability.",
    "Both are assertion libraries on top of JUnit. AssertJ chains methods from a typed assertion object, while Hamcrest builds Matcher objects that are also used by Mockito argThat and Spring MockMvc.",
    "The built-in JUnit assertions are limited and give terse failure output, especially for collections, exceptions and nested objects.",
    "Use AssertJ for collections, optionals, exceptions, dates, soft assertions and recursive object comparison, and Hamcrest where a framework API requires Matcher parameters such as MockMvc jsonPath.",
    "Avoid long chains that assert too many things in one test, comparing floating-point values without tolerance, and mixing both libraries randomly in one code base.",
    "Static import Assertions.assertThat, use extracting and containsExactlyInAnyOrder for collections, usingRecursiveComparison for objects, assertThatThrownBy for exceptions, and SoftAssertions when you want all failures reported at once.",
    "Pros: readable, rich failure messages, discoverable API. Cons: another dependency, and Hamcrest development is slow while its matchers are less discoverable.",
    "Alternatives are JUnit built-in assertions, Truth from Google, and Kotest assertions or Spock conditions.",
    `import static org.assertj.core.api.Assertions.*;

assertThat(orders)
    .hasSize(2)
    .extracting(Order::id)
    .containsExactlyInAnyOrder("o-1", "o-2");

assertThat(actualUser)
    .usingRecursiveComparison()
    .ignoringFields("createdAt")
    .isEqualTo(expectedUser);

assertThatThrownBy(() -> service.find("missing"))
    .isInstanceOf(NotFoundException.class)
    .hasMessageContaining("missing");

SoftAssertions.assertSoftly(s -> {
    s.assertThat(user.name()).isEqualTo("Ann");
    s.assertThat(user.age()).isGreaterThan(17);
});

// Hamcrest equivalent style
// assertThat(list, hasItem("x")); assertThat(n, is(greaterThan(3)));`
  ],
  "Awaitility (Async Testing)": [
    "Awaitility polls a condition until it becomes true or a timeout expires, replacing Thread.sleep in tests of asynchronous behaviour such as message consumers, scheduled jobs and CompletableFuture chains. It makes async tests faster and far less flaky.",
    "It provides a fluent DSL: await().atMost(...).pollInterval(...).until(callable) or untilAsserted(assertion). Failures report the timeout and the last evaluated assertion.",
    "Fixed sleeps are either too short, which causes flaky failures, or too long, which slows the suite; polling returns as soon as the condition holds.",
    "Use it for Kafka or JMS consumer tests, eventual consistency, background threads, async REST callbacks and cache or search index updates.",
    "Avoid it for purely synchronous code, and do not use it to hide race conditions or to wait for long periods; where possible expose a latch, a Future or an injected scheduler or clock that tests can control.",
    "Add the awaitility dependency, use untilAsserted with AssertJ or JUnit assertions, set a sensible atMost timeout, name the condition with alias for readable errors, and poll only cheap, side-effect-free checks.",
    "Pros: deterministic timing, readable, fast. Cons: still time-based, adds a dependency, and the timeouts need tuning on slow CI machines.",
    "Alternatives are CountDownLatch or CompletableFuture.get with timeout, injected schedulers and virtual clocks, and JUnit @Timeout combined with callbacks.",
    `import static org.awaitility.Awaitility.await;
import java.time.Duration;

@Test
void consumerProcessesMessage() {
    kafkaTemplate.send("orders", "o-1", payload);

    await()
        .alias("order saved by consumer")
        .atMost(Duration.ofSeconds(10))
        .pollInterval(Duration.ofMillis(100))
        .untilAsserted(() ->
            assertThat(orderRepository.findById("o-1")).isPresent());
}

// Simple boolean condition
await().atMost(5, TimeUnit.SECONDS).until(() -> counter.get() == 3);`
  ],
  "WireMock": [
    "WireMock runs a local HTTP server that stubs external REST services so integration tests can exercise HTTP clients, retries and error handling deterministically. It lets you simulate delays, 500 errors, malformed bodies and connection resets without the real dependency.",
    "You define stubs that match requests by URL, method, headers or body and return canned responses, and then verify which requests were received. It can run as a JUnit 5 extension, standalone, or in Docker, and supports stateful scenarios and response templating.",
    "Real third-party services are slow, rate-limited, costly and cannot be made to fail on demand, which makes tests flaky and incomplete.",
    "Use it to test Feign, RestClient, WebClient or Retrofit clients, resilience configuration such as timeouts and circuit breakers, and OAuth token endpoints.",
    "Avoid it as a substitute for contract tests when you must be sure the stub matches the real provider, and avoid over-detailed stubs that duplicate the provider implementation.",
    "Register the WireMockExtension with a dynamic port, point the client base URL at it with DynamicPropertySource, stub with stubFor and willReturn, simulate faults with withFixedDelay or Fault, and verify with verify(). Record stubs from real traffic when starting out.",
    "Pros: realistic HTTP-level testing, fault injection, no network dependency. Cons: stubs can drift from the real API, and maintaining many stub files is effortful.",
    "Alternatives are MockWebServer from OkHttp, MockServer, Spring Cloud Contract stubs, Pact for consumer-driven contracts, and Testcontainers-run service doubles.",
    `@RegisterExtension
static WireMockExtension wm = WireMockExtension.newInstance()
        .options(wireMockConfig().dynamicPort()).build();

@DynamicPropertySource
static void props(DynamicPropertyRegistry r) {
    r.add("rates.base-url", wm::baseUrl);
}

@Test
void retriesOnServerError() {
    wm.stubFor(get(urlEqualTo("/rates/EUR"))
        .inScenario("flaky").whenScenarioStateIs(STARTED)
        .willReturn(aResponse().withStatus(503))
        .willSetStateTo("recovered"));
    wm.stubFor(get(urlEqualTo("/rates/EUR"))
        .inScenario("flaky").whenScenarioStateIs("recovered")
        .willReturn(okJson("{\"rate\": 1.10}")));

    assertThat(client.rateFor("EUR")).isEqualByComparingTo("1.10");
    wm.verify(2, getRequestedFor(urlEqualTo("/rates/EUR")));
}`
  ],
  "Integration Testing Strategies": [
    "Integration tests check that components work together with real infrastructure: use Spring Boot test slices for focused wiring and Testcontainers for real databases and brokers instead of H2 or embedded fakes. Keep them isolated, repeatable and few enough to stay fast.",
    "They span a range: slice tests such as @DataJpaTest or @WebMvcTest, full @SpringBootTest with the real context, and out-of-process tests against a deployed environment. Testcontainers starts disposable Docker containers for PostgreSQL, Kafka, Redis and others.",
    "Mocks cannot reveal SQL dialect problems, serialisation bugs, transaction boundaries, mapping errors or configuration mistakes that only appear when real components interact.",
    "Use them for repositories, REST controllers with security, message consumers, Flyway or Liquibase migrations and caching behaviour.",
    "Avoid a full application context for every test (slow startup), shared databases with leftover data between tests, and dependence on external SaaS services or shared test environments.",
    "Use @ServiceConnection with Testcontainers in Spring Boot 3.1+, share one static container across the class or via a singleton to save time, reset state with transactions or cleanup scripts, keep context caching effective by reusing configuration, and run the suite in CI with Docker available (failsafe plugin for *IT classes).",
    "Pros: high confidence, finds real integration bugs. Cons: slower than unit tests, needs Docker in CI, and can become flaky without proper isolation.",
    "Alternatives are in-memory databases like H2 (faster but dialect differences), embedded Kafka, contract tests, and end-to-end tests in a staging environment.",
    `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class OrderApiIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired TestRestTemplate rest;
    @Autowired OrderRepository repo;

    @BeforeEach
    void clean() { repo.deleteAll(); }

    @Test
    void createsAndReadsOrder() {
        var created = rest.postForEntity("/orders", new CreateOrder("c-1", 3), OrderDto.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        var fetched = rest.getForObject("/orders/" + created.getBody().id(), OrderDto.class);
        assertThat(fetched.quantity()).isEqualTo(3);
    }
}`
  ],
  "Code Coverage": [
    "Code coverage (JaCoCo for Java) measures which lines and branches tests execute; it shows what is untested but not whether the tests are good. Use it to find gaps and enforce a sensible floor, not as a target to maximise.",
    "JaCoCo instruments bytecode through a Java agent and reports line, branch, instruction, method and class coverage. Branch coverage is stricter than line coverage because it checks both outcomes of each condition.",
    "It gives a quick, objective signal of untested areas, especially for new code in a pull request, and can be checked automatically in CI.",
    "Use it to review coverage on changed code, set quality gates in SonarQube or the JaCoCo check goal, and find dead code.",
    "Do not chase 100 percent or reward assertion-free tests that merely execute code; coverage goals become gamed (Goodhart's law). Exclude generated code, DTOs and configuration where tests add no value.",
    "Add the jacoco-maven-plugin with prepare-agent and report goals, publish the XML to SonarQube, gate on coverage for new code (for example 80 percent) rather than the whole project, combine with mutation testing to measure test quality, and review branch coverage on complex logic.",
    "Pros: cheap, objective, automated gaps detection. Cons: says nothing about assertion quality, can encourage superficial tests, and is blind to missing requirements or integration paths.",
    "Alternatives or complements are mutation testing (PIT), code review, risk-based testing and requirements traceability.",
    `<!-- pom.xml -->
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.13</version>
  <executions>
    <execution>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>verify</phase>
      <goals><goal>report</goal></goals>
    </execution>
    <execution>
      <id>check</id>
      <phase>verify</phase>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <element>BUNDLE</element>
            <limits>
              <limit>
                <counter>BRANCH</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.70</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
      </configuration>
    </execution>
  </executions>
</plugin>`
  ],
  "Flaky Tests": [
    "A flaky test passes and fails without code changes, and the usual causes are shared state, timing and sleeps, async races, test order dependence, time or randomness, and unstable external services. Fix the root cause, quarantine while you do, and never just rerun until green.",
    "Flakiness is non-determinism in the test, the code or the environment. Common sources are Thread.sleep, system clock, unseeded random, static or shared database state, port clashes, concurrency bugs in production code and resource limits on CI.",
    "Flaky tests destroy trust in the pipeline: teams start ignoring red builds, real regressions slip through, and reruns waste CI time.",
    "Apply it whenever a failure cannot be reproduced locally, a test fails only in CI or only in parallel, or a failure disappears on rerun.",
    "Do not mask flakiness with blanket retries, longer sleeps or ignoring failures; those hide real race conditions that can also affect production.",
    "Reproduce by running the test in a loop or with random order and parallelism, find the shared state or race, replace sleeps with Awaitility or latches, inject Clock and seeds, isolate data per test, use Testcontainers instead of shared environments, and quarantine with a tracked ticket and a deadline.",
    "Pros of fixing: trusted, fast feedback. Cons: root-cause analysis is time-consuming, and quarantined tests lose coverage while they are disabled.",
    "Alternatives or stopgaps are automatic rerun of failed tests (surefire rerunFailingTestsCount, tracked and reported), quarantine suites, flaky-test dashboards and deterministic test infrastructure.",
    `// Flaky: depends on wall-clock timing
Thread.sleep(500);
assertEquals(1, processedCount.get());

// Stable: wait for the condition
await().atMost(Duration.ofSeconds(5))
       .untilAsserted(() -> assertEquals(1, processedCount.get()));

// Flaky: depends on current time
assertTrue(token.isExpired());   // fails around midnight

// Stable: inject a fixed clock
Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
var token = tokenService.issue(clock);

// Surefire: detect flakiness by rerunning, report as flaky not passed
// mvn test -Dsurefire.rerunFailingTestsCount=2
// Run in random order or repeat to reproduce:
// @RepeatedTest(100)`
  ],
  "Test Data Management": [
    "Good test data is created per test, minimal, and independent: use builders or object mothers for in-memory objects and transactions, cleanup or fresh containers for databases. Avoid shared mutable fixtures and giant SQL dumps that nobody understands.",
    "Test data strategies include builders (fluent construction with sensible defaults), object mothers (named factory methods), fixtures loaded from SQL or JSON, generated data (Instancio, Datafaker), and database state isolation techniques.",
    "Tests that depend on shared or leftover data become order-dependent and flaky, and unclear fixtures hide what a test is actually relying on.",
    "Use builders in unit tests, @Sql scripts or repository saves in integration tests, @Transactional rollback or truncation between tests, and anonymised or synthetic data in higher environments.",
    "Avoid copying production data into test environments without anonymisation (privacy and compliance risk), huge shared seed scripts, and tests that rely on IDs or row counts created by other tests.",
    "Create a builder with valid defaults and override only what the test cares about, keep data local to the test, isolate the database with Testcontainers plus cleanup in @BeforeEach or @Transactional rollback, use Flyway test migrations for reference data only, and use Datafaker for realistic random values with a fixed seed.",
    "Pros: readable, isolated, maintainable tests. Cons: builders need upkeep, rollback hides commit-time behaviour (flush, triggers), and generated data can create hard-to-reproduce failures without a seed.",
    "Alternatives are shared snapshot databases, production-subset copies with masking, database reset tooling, and recorded API fixtures.",
    `public class OrderBuilder {
    private String customerId = "c-default";
    private BigDecimal total = new BigDecimal("10.00");
    private OrderStatus status = OrderStatus.NEW;

    public static OrderBuilder anOrder() { return new OrderBuilder(); }
    public OrderBuilder forCustomer(String id) { this.customerId = id; return this; }
    public OrderBuilder withTotal(String t) { this.total = new BigDecimal(t); return this; }
    public OrderBuilder paid() { this.status = OrderStatus.PAID; return this; }
    public Order build() { return new Order(customerId, total, status); }
}

@Test
void paidOrdersAreNotCancellable() {
    Order order = anOrder().forCustomer("c-7").paid().build();
    assertThrows(IllegalStateException.class, order::cancel);
}

@Test
@Sql(statements = "insert into country(code, name) values ('IE', 'Ireland')")
void usesReferenceData() { /* ... */ }`
  ],
  "Contract Testing": [
    "Contract testing verifies that a consumer and provider agree on an API without running both together: in consumer-driven contracts (Pact, Spring Cloud Contract) the consumer states what it needs and the provider build verifies it. It catches breaking changes early and cheaply compared with full end-to-end tests.",
    "A contract is a machine-readable description of requests and responses. With Pact, the consumer test generates a pact file, a broker stores it, and the provider verifies it by replaying requests against its real code. Spring Cloud Contract generates stubs and provider tests from DSL contracts.",
    "In microservices, end-to-end tests are slow and brittle, while mocks drift from real provider behaviour; contracts keep both sides honest independently.",
    "Use it between independently deployed services owned by different teams, for message contracts (Kafka, AMQP) and for deciding whether a provider change can be safely deployed (Pact can-i-deploy).",
    "It is not worth the overhead for a single deployable or tightly coordinated services, and it does not replace functional tests of business logic or non-functional tests.",
    "The consumer writes a Pact test against a mock provider, publishes the pact to a Pact Broker, the provider pipeline runs verification using JUnit with @Provider and @PactBroker, and can-i-deploy gates releases. Keep contracts to what the consumer really uses, using matchers instead of exact values.",
    "Pros: fast, early detection of breaking changes, decouples team pipelines. Cons: needs a broker and process discipline, coverage depends on consumers writing contracts, and added tooling effort.",
    "Alternatives are OpenAPI schema validation and breaking-change detection (openapi-diff), shared integration environments, end-to-end tests and provider-side stubs (WireMock).",
    `// Consumer side (Pact JVM, JUnit 5)
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "user-service")
class UserClientPactTest {
    @Pact(consumer = "order-service")
    V4Pact userExists(PactDslWithProvider builder) {
        return builder.given("user 42 exists")
            .uponReceiving("get user 42")
            .path("/users/42").method("GET")
            .willRespondWith().status(200)
            .body(newJsonBody(b -> {
                b.integerType("id", 42);
                b.stringType("email", "a@example.com");
            }).build())
            .toPact(V4Pact.class);
    }

    @Test
    @PactTestFor(pactMethod = "userExists")
    void fetchesUser(MockServer server) {
        var client = new UserClient(server.getUrl());
        assertThat(client.find(42).email()).isNotBlank();
    }
}

// Provider side
@Provider("user-service")
@PactBroker
class UserProviderPactTest {
    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void verify(PactVerificationContext ctx) { ctx.verifyInteraction(); }
}`
  ],
  "Mutation Testing": [
    "Mutation testing (PIT for Java) makes small changes to the code, such as flipping a condition or removing a call, and checks whether tests fail; surviving mutants reveal weak assertions that line coverage hides. It measures test effectiveness rather than test execution.",
    "PIT applies mutators like conditionals boundary, negate conditionals, math and void method call removal to bytecode, reruns the relevant tests for each mutant and reports killed, survived, no-coverage and timed-out mutants.",
    "A test can execute a line without asserting anything, so coverage can be 100 percent with an almost useless suite; mutation score exposes that.",
    "Use it on critical business logic, in pull requests on changed classes only (incremental analysis), and when evaluating whether a coverage number can be trusted.",
    "Avoid running it on the whole large code base on every commit (very slow), on generated code, and chasing 100 percent mutation score including equivalent mutants that cannot be killed.",
    "Add pitest-maven with pitest-junit5-plugin, restrict targetClasses and targetTests, enable withHistory or incremental analysis, run in a nightly or per-pull-request job, then review surviving mutants and strengthen or add assertions.",
    "Pros: genuine measure of test quality, finds missing assertions. Cons: slow, noisy with equivalent mutants, and needs reasonably fast, deterministic tests.",
    "Alternatives or complements are line and branch coverage, code review, property-based testing and static analysis.",
    `<plugin>
  <groupId>org.pitest</groupId>
  <artifactId>pitest-maven</artifactId>
  <version>1.20.0</version>
  <dependencies>
    <dependency>
      <groupId>org.pitest</groupId>
      <artifactId>pitest-junit5-plugin</artifactId>
      <version>1.2.2</version>
    </dependency>
  </dependencies>
  <configuration>
    <targetClasses><param>com.example.pricing.*</param></targetClasses>
    <mutationThreshold>80</mutationThreshold>
  </configuration>
</plugin>

// shell: mvn org.pitest:pitest-maven:mutationCoverage
// A surviving mutant: condition changed from >= to > and no test failed,
// so add a test for the exact boundary value.`
  ],
  "ArchUnit and Architecture Tests": [
    "ArchUnit lets you write architecture rules as ordinary JUnit tests, such as 'controllers must not access repositories' or 'no cycles between packages', so the intended design is enforced automatically in CI. It stops architectural erosion that code review misses.",
    "ArchUnit imports compiled classes and evaluates a fluent rule DSL over packages, layers, dependencies, naming, annotations and cycles. Rules can be written directly or with predefined layered and onion architecture checks.",
    "Architecture documents rot and reviewers cannot spot every illegal dependency, so a rule that fails the build keeps modules and layers clean.",
    "Use it for layered or hexagonal architectures, module boundaries in a modular monolith, naming conventions, banning dependencies such as java.util.logging or field injection, and detecting package cycles.",
    "Avoid encoding trivial style rules better handled by linters, and avoid rules so strict or numerous that people disable them; start with a few that matter.",
    "Add the archunit-junit5 dependency, import the packages with @AnalyzeClasses, write @ArchTest rules, use layeredArchitecture() for layers, use freeze for legacy violations (FreezingArchRule) so only new violations fail, and review failures like any other test.",
    "Pros: executable architecture, fast feedback, cheap to run. Cons: only checks static dependencies at bytecode level, rules need maintenance, and legacy code may need freezing.",
    "Alternatives are Spring Modulith verification, the Java module system, Maven or Gradle module boundaries, jQAssistant and Sonar architecture rules.",
    `@AnalyzeClasses(packages = "com.example.shop", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringAllDependencies()
        .layer("Web").definedBy("..web..")
        .layer("Service").definedBy("..service..")
        .layer("Persistence").definedBy("..persistence..")
        .whereLayer("Web").mayNotBeAccessedByAnyLayer()
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Web")
        .whereLayer("Persistence").mayOnlyBeAccessedByLayers("Service");

    @ArchTest
    static final ArchRule noCycles =
        slices().matching("com.example.shop.(*)..").should().beFreeOfCycles();

    @ArchTest
    static final ArchRule noFieldInjection =
        noFields().should().beAnnotatedWith(Autowired.class);
}`
  ],
  "Performance and Load Testing": [
    "Performance testing measures latency, throughput and resource use under load, using tools such as Gatling, k6 or JMeter for system-level tests and JMH for micro-benchmarks. Define SLOs first, test in a production-like environment, and look at percentiles (p95, p99), not averages.",
    "Load tests apply expected traffic, stress tests push past capacity, soak tests run for hours to find leaks, and spike tests check sudden bursts. JMH benchmarks small code paths with proper warm-up and dead-code protection.",
    "Performance defects, such as slow queries, thread pool exhaustion, memory leaks and lock contention, appear only under realistic concurrency, not in functional tests.",
    "Use it before launches and major changes, to size infrastructure, to validate autoscaling and timeouts, and as a regression check in the pipeline against a baseline.",
    "Avoid benchmarking on laptops or shared environments, with unrealistic data or without warm-up, and with coordinated omission, where the load tool slows itself down when the server is slow and hides latency.",
    "Model realistic user journeys and data volumes, use open workload models (arrival rate) in Gatling or k6, ramp up gradually, monitor the application with JFR, metrics and GC logs during the run, find the bottleneck one at a time, and write JMH benchmarks with the Blackhole for micro-level questions.",
    "Pros: finds capacity and stability issues before users do. Cons: needs a realistic environment, takes expertise to interpret, and results are easily misleading with poor test design.",
    "Alternatives are production monitoring with canary releases, chaos testing, profiling with async-profiler, and synthetic monitoring.",
    `// Gatling (Java DSL): open model, 50 new users per second for 2 minutes
public class OrdersSimulation extends Simulation {
    HttpProtocolBuilder http = http.baseUrl("http://localhost:8080");
    ScenarioBuilder scn = scenario("browse and order")
        .exec(http("list").get("/products").check(status().is(200)))
        .pause(1)
        .exec(http("order").post("/orders").body(StringBody("{\"sku\":\"A1\"}"))
              .asJson().check(status().is(201)));
    {
        setUp(scn.injectOpen(constantUsersPerSec(50).during(Duration.ofMinutes(2))))
            .protocols(http)
            .assertions(global().responseTime().percentile(95).lt(300),
                        global().failedRequests().percent().lt(1.0));
    }
}

// JMH micro-benchmark
@State(Scope.Thread)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
public class ConcatBench {
    String a = "abc", b = "def";
    @Benchmark public String plus() { return a + b; }
}`
  ],
  "Testing Concurrent Code": [
    "Concurrent code is hard to test because bugs are timing-dependent, so combine design for testability (small units, injectable executors, immutable state) with stress tests, latches to force interleavings, and tools like jcstress. A passing test proves little; absence of races needs reasoning and stress.",
    "Typical techniques are running many threads against the unit with CountDownLatch or CyclicBarrier to start together, using Awaitility for async outcomes, injecting a direct or deterministic executor, and jcstress for memory-model level tests.",
    "Race conditions, deadlocks and visibility bugs cause rare, non-reproducible production failures that ordinary single-threaded tests never trigger.",
    "Use it for thread-safe classes, caches, counters, connection pools, producer-consumer pipelines and any code using locks or atomics.",
    "Do not rely on Thread.sleep to coordinate threads, on a single successful run as proof, or on testing thread scheduling details; keep the concurrent surface small instead.",
    "Start N threads behind a start latch, run many iterations, assert on invariants at the end with a timeout, use ExecutorService with awaitTermination, capture exceptions from worker threads, run the test repeatedly in CI, and add deadlock detection via ThreadMXBean or a jstack on timeout.",
    "Pros: finds many races and invariant violations. Cons: probabilistic (cannot prove absence of bugs), can be slow and flaky, and results vary by hardware.",
    "Alternatives are jcstress, model checking and formal tools, static analysis (Error Prone, SpotBugs), designing out shared mutable state and virtual-thread or structured-concurrency designs that reduce locking.",
    `@Test
void counterIsThreadSafe() throws Exception {
    int threads = 16, perThread = 10_000;
    var counter = new SafeCounter();
    var start = new CountDownLatch(1);
    var done = new CountDownLatch(threads);
    var errors = new ConcurrentLinkedQueue<Throwable>();

    ExecutorService pool = Executors.newFixedThreadPool(threads);
    for (int i = 0; i < threads; i++) {
        pool.execute(() -> {
            try {
                start.await();
                for (int j = 0; j < perThread; j++) counter.increment();
            } catch (Throwable t) {
                errors.add(t);
            } finally {
                done.countDown();
            }
        });
    }
    start.countDown();                       // release all threads together
    assertTrue(done.await(10, TimeUnit.SECONDS), "workers did not finish");
    pool.shutdownNow();

    assertThat(errors).isEmpty();
    assertEquals(threads * perThread, counter.get());
}`
  ],
  "Property-Based Testing": [
    "Property-based testing states a rule that must hold for all inputs, for example 'reverse of reverse is the original', and a library like jqwik generates hundreds of random inputs and shrinks failures to a minimal counterexample. It finds edge cases that example-based tests miss.",
    "A property is an invariant such as round-trip, idempotence, ordering or comparison against a simpler oracle. jqwik provides arbitraries (generators), @Property methods, @ForAll parameters, and automatic shrinking and seed reporting for reproducibility.",
    "Humans pick few examples and miss unusual inputs such as empty strings, negative numbers, unicode and overflows; generated inputs explore the space far more broadly.",
    "Use it for parsers, serialisers (encode then decode), data structures, mathematical or pricing rules, sorting and normalisation code.",
    "It is a poor fit for code without clear invariants, UI flows, or tests needing expensive setup per case; properties that merely re-implement the code under test add no value.",
    "Add jqwik, express the property with @Property and @ForAll, constrain input with @IntRange or @StringLength, build custom Arbitraries for domain objects, keep the seed from failure output for reproduction, and keep example-based tests for documented behaviour.",
    "Pros: broad coverage, finds surprising bugs, shrinking aids diagnosis. Cons: harder to design properties, nondeterministic runs unless seeded, and slower than a single example.",
    "Alternatives are example-based parameterized tests, fuzzing (Jazzer for coverage-guided fuzzing), and mutation testing to assess example suites.",
    `import net.jqwik.api.*;
import net.jqwik.api.constraints.*;

class CodecProperties {

    @Property
    boolean encodeThenDecodeReturnsOriginal(@ForAll String text) {
        return Codec.decode(Codec.encode(text)).equals(text);
    }

    @Property
    void sortedListIsOrdered(@ForAll List<@IntRange(min = -1000, max = 1000) Integer> numbers) {
        List<Integer> sorted = MySort.sort(numbers);
        for (int i = 1; i < sorted.size(); i++) {
            Assertions.assertThat(sorted.get(i - 1)).isLessThanOrEqualTo(sorted.get(i));
        }
        Assertions.assertThat(sorted).containsExactlyInAnyOrderElementsOf(numbers);
    }
}`
  ]
};
