// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, optional code example]
const SERVICE_ANSWERS = {
  "OWASP Top 10": [
    "The OWASP Top 10 is a consensus list of the most critical web application risks, and the 2021 edition is led by Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable and Outdated Components, Identification and Authentication Failures, Software and Data Integrity Failures, Logging and Monitoring Failures, and SSRF. Be able to name them and give a Java or Spring mitigation for each.",
    "It is an awareness document published by the OWASP Foundation and refreshed every few years from vulnerability data and community surveys. Each category groups related weaknesses (CWEs) rather than single bugs.",
    "It gives developers, reviewers and auditors a shared baseline for threat modelling, secure coding standards and security testing priorities.",
    "Use it as a checklist for code reviews, a basis for training, and a map when running tools like ZAP, Burp or SAST scanners.",
    "Do not treat it as a complete standard or compliance proof; it covers common web risks only, so use OWASP ASVS for detailed verification requirements and add API-specific lists such as the OWASP API Security Top 10.",
    "Map each category to controls: enforce authorisation server-side on every request, use parameterised queries, apply TLS and strong hashing, keep dependencies patched with Dependabot or OWASP Dependency-Check, harden configuration, log security events, validate outbound URLs, and verify integrity of pipelines and updates.",
    "Pros: widely recognised, practical, great for prioritisation. Cons: coarse categories, a ranking by frequency not by your own risk, and easy to treat as a box-ticking exercise.",
    "Alternatives or complements are OWASP ASVS and the Cheat Sheet Series, the SANS/CWE Top 25, threat modelling with STRIDE, and the OWASP API Security Top 10.",
    `// A01 Broken Access Control: vulnerable (trusts the id from the URL)
@GetMapping("/orders/{id}")
Order get(@PathVariable Long id) { return repo.findById(id).orElseThrow(); }

// Fixed: check ownership server-side
@GetMapping("/orders/{id}")
Order get(@PathVariable Long id, Authentication auth) {
    Order o = repo.findById(id).orElseThrow(NotFoundException::new);
    if (!o.getOwner().equals(auth.getName())) throw new AccessDeniedException("forbidden");
    return o;
}

// A03 Injection: vulnerable
String sql = "SELECT * FROM users WHERE name = '" + name + "'";
// Fixed: parameterised
PreparedStatement ps = con.prepareStatement("SELECT * FROM users WHERE name = ?");
ps.setString(1, name);`
  ],
  "Authentication vs Authorisation": [
    "Authentication proves who you are (passwords, MFA, tokens, certificates), while authorisation decides what that identity may do (roles, permissions, policies). Authenticate first, then authorise every request on the server, and treat broken authorisation as the top web risk.",
    "Authentication verifies an identity claim and yields a principal. Authorisation evaluates that principal against rules such as RBAC (roles), ABAC (attributes), ACLs or policy engines, and returns allow or deny. HTTP 401 means not authenticated, 403 means authenticated but not allowed.",
    "Conflating them leads to systems where logged-in users can access other users' data; separating them lets you change identity providers without rewriting access rules.",
    "Use authentication at the edge or identity provider (OIDC, SAML, session login) and authorisation both coarse-grained at the endpoint and fine-grained at the data or object level.",
    "Avoid authorising only in the UI or the gateway, trusting client-supplied roles or ids, hard-coded role checks scattered through code, and relying on obscure URLs.",
    "In Spring Security configure a SecurityFilterChain with authenticated requests and role rules, use method security with @PreAuthorize for fine-grained checks including ownership, load permissions server-side from the token or database, apply deny-by-default, and add MFA for sensitive operations.",
    "RBAC is simple but role explosion happens; ABAC and policy engines (OPA, Cedar) are expressive but more complex. Centralised authorisation is consistent but adds a dependency and latency.",
    "Alternatives are ACLs per object (Spring Security ACL), ABAC, relationship-based access control (Zanzibar-style, for example OpenFGA), and API gateways for coarse checks.",
    `@Configuration
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(a -> a
                .requestMatchers("/public/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())      // deny by default
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
        return http.build();
    }
}

@Service
class InvoiceService {
    // authorisation at object level, not just by role
    @PreAuthorize("hasRole('USER') and @invoiceAccess.isOwner(#id, authentication.name)")
    public Invoice get(Long id) { return repo.findById(id).orElseThrow(); }
}`
  ],
  "Hashing vs Encryption vs Signing": [
    "Hashing is a one-way digest used for integrity and password verification, encryption is reversible with a key and provides confidentiality, and signing uses a private key to prove origin and integrity that anyone can verify with the public key. Use SHA-256 or better for digests, AES-GCM for symmetric encryption, and RSA, ECDSA or Ed25519 for signatures.",
    "A hash function maps data to a fixed-size digest and cannot be reversed. Symmetric encryption (AES) uses one shared key, asymmetric encryption (RSA, ECIES) uses a key pair, and a digital signature is a hash of the data encrypted or signed with a private key. A MAC such as HMAC provides integrity and authenticity with a shared secret.",
    "Different goals need different primitives: confidentiality (encryption), integrity (hash, MAC), authenticity and non-repudiation (signature), and safe password storage (slow salted hash).",
    "Use hashing for checksums and password verification, AES-GCM for data at rest and in application-level encryption, HMAC for webhook verification, and signatures for JWTs, software artefacts and certificates.",
    "Avoid MD5 and SHA-1 for security, ECB mode, encrypting passwords instead of hashing them, hand-rolled crypto, hard-coded keys, and reusing a nonce or IV with the same GCM key.",
    "Use MessageDigest with SHA-256, Cipher AES/GCM/NoPadding with a random 12-byte IV per message and a key from a KMS or KeyStore, Signature with SHA256withRSA or Ed25519, and Mac with HmacSHA256 compared using a constant-time check such as MessageDigest.isEqual. Prefer vetted libraries such as Google Tink.",
    "Hashing is fast but not reversible; encryption needs key management; signatures need trusted public key distribution. Asymmetric operations are slower than symmetric ones, so hybrid encryption is common.",
    "Alternatives or higher-level options are Tink, libsodium bindings, envelope encryption through a cloud KMS, and TLS for data in transit.",
    `// Hash (integrity)
byte[] digest = MessageDigest.getInstance("SHA-256").digest(data);

// Encrypt (confidentiality): AES-GCM with a fresh random IV
SecretKey key = loadKeyFromKms();
byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);
Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
byte[] ciphertext = c.doFinal(plaintext);          // store iv + ciphertext

// Sign (authenticity + integrity)
Signature s = Signature.getInstance("SHA256withRSA");
s.initSign(privateKey);
s.update(message);
byte[] sig = s.sign();

// HMAC (shared-secret authenticity), constant-time compare
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(sharedSecret, "HmacSHA256"));
boolean ok = MessageDigest.isEqual(mac.doFinal(body), receivedMac);`
  ],
  "Password Storage": [
    "Never store passwords or encrypt them reversibly; store a salted hash from a slow, memory-hard password hashing algorithm such as Argon2id, bcrypt, scrypt or PBKDF2. In Spring use DelegatingPasswordEncoder, which tags the algorithm in the stored value and allows upgrades.",
    "A password hash uses a unique random salt per user and a tunable work factor to make brute force expensive. Argon2id is memory-hard and the current OWASP first choice; bcrypt is widely deployed with a 72-byte input limit; PBKDF2 is used where FIPS compliance is needed.",
    "Databases leak, and fast hashes like plain SHA-256 let attackers crack billions of guesses per second with GPUs; salts defeat rainbow tables and per-user cracking at scale.",
    "Use it for any system that authenticates users with passwords; also consider passkeys (WebAuthn) and MFA to reduce reliance on passwords.",
    "Avoid MD5, SHA-1 or unsalted SHA-256, a single global salt, home-made schemes, logging passwords, emailing passwords, and truncating passwords silently.",
    "Use Argon2PasswordEncoder or BCryptPasswordEncoder through PasswordEncoderFactories.createDelegatingPasswordEncoder, tune the cost so verification takes roughly 100 to 500 ms on your hardware, rehash on login when the cost is outdated (upgradeEncoding), add rate limiting and lockout, check breached passwords, and optionally add a pepper kept in a KMS.",
    "Slow hashing costs CPU and memory per login (a possible denial-of-service lever), and raising the work factor requires rehashing at next login. bcrypt is battle-tested but less GPU-resistant than Argon2id.",
    "Alternatives are passkeys and WebAuthn, delegating authentication to an identity provider (OIDC, Keycloak, Auth0-style services), and passwordless magic links or one-time codes.",
    `// Vulnerable: fast unsalted hash
String stored = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(password.getBytes()));

// Fixed: delegating encoder (bcrypt by default, upgradable)
PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
String hash = encoder.encode(rawPassword);              // {bcrypt}$2a$10$...
boolean ok = encoder.matches(rawPassword, hash);

// Explicit Argon2id (needs Bouncy Castle on the classpath)
PasswordEncoder argon = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

// Rehash on login if parameters are outdated
if (ok && encoder.upgradeEncoding(hash)) {
    user.setPasswordHash(encoder.encode(rawPassword));
}`
  ],
  "Principle of Least Privilege": [
    "Least privilege means every user, service, process and credential gets only the access it needs for its task and only for as long as needed. It limits the blast radius of compromised accounts, bugs and insider mistakes.",
    "It applies to human accounts, service accounts, database users, IAM roles, container capabilities, file permissions and network rules. Related ideas are separation of duties, just-in-time access and deny-by-default.",
    "Breaches usually spread through excessive permissions, such as an app database user that can drop tables or a pod that can read all secrets; restricting rights turns a compromise into a contained incident.",
    "Use it when designing IAM policies, database roles, Kubernetes RBAC, application roles, CI credentials, network segmentation and container security contexts.",
    "Avoid wildcard permissions (star on star in IAM), shared admin credentials, running containers as root or privileged, and granting broad access temporarily and never removing it.",
    "Give the application a dedicated database user with only the needed DML rights and a separate migration user for DDL, scope IAM roles to specific resources, use Kubernetes RBAC and securityContext (runAsNonRoot, readOnlyRootFilesystem, drop all capabilities), use short-lived credentials and just-in-time elevation, and review permissions regularly.",
    "Pros: smaller blast radius, easier audits. Cons: more upfront design and policy maintenance, risk of breaking things when permissions are too narrow, and permission sprawl over time without review.",
    "Alternatives or complements are role-based access control with periodic access reviews, privileged access management tools, zero trust network design and sandboxing.",
    `-- separate database users
CREATE USER app_rw WITH PASSWORD 'change-me';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA shop TO app_rw;   -- no DDL
CREATE USER migrator WITH PASSWORD 'change-me-too';
GRANT ALL ON SCHEMA shop TO migrator;                                         -- used only by Flyway

# Kubernetes container hardening
# securityContext:
#   runAsNonRoot: true
#   allowPrivilegeEscalation: false
#   readOnlyRootFilesystem: true
#   capabilities: { drop: ["ALL"] }

# AWS IAM: scope to one bucket prefix, not star
# Action: s3:GetObject   Resource: arn:aws:s3:::example-bucket/reports/*`
  ],
  "XSS": [
    "Cross-site scripting lets attacker-controlled script run in a victim's browser in your site's origin, to steal sessions, act as the user or deface pages. Defend with context-aware output encoding, a strict Content Security Policy, HttpOnly cookies, and safe templating frameworks.",
    "Stored XSS persists the payload in the database, reflected XSS echoes it from the request, and DOM-based XSS happens entirely in client-side JavaScript sinks such as innerHTML. The root cause is untrusted data being interpreted as HTML, attributes, JavaScript or URLs.",
    "The browser trusts any script served from your origin, so injected script has the full power of the user session.",
    "It applies anywhere user-influenced data is rendered, including comments, profile fields, search terms, error messages, URLs and JSON embedded in pages.",
    "Do not rely on input blacklists or filtering of the word script; the fix is encoding at output for the correct context, not trying to strip bad input. Avoid innerHTML, document.write and th:utext or unescaped output.",
    "Use auto-escaping templates (Thymeleaf th:text, not th:utext), encode by context with the OWASP Java Encoder, sanitise rich HTML with an allowlist library such as OWASP HTML Sanitizer, set a Content-Security-Policy without unsafe-inline, mark session cookies HttpOnly and Secure, and use textContent instead of innerHTML in JavaScript.",
    "Pros: encoding and CSP are robust layered defences. Cons: a strict CSP needs nonces and refactoring of inline scripts, and rich text input remains risky and needs sanitisation.",
    "Alternatives or complements are Trusted Types in browsers, framework defaults in React or Angular (auto-escaping, with escape hatches to avoid), and WAF rules as a last line only.",
    `// Vulnerable: reflected into HTML without encoding
@GetMapping("/search")
@ResponseBody
String search(@RequestParam String q) {
    return "<h1>Results for " + q + "</h1>";      // q = <script>...</script>
}

// Fixed: encode for the HTML context
import org.owasp.encoder.Encode;
return "<h1>Results for " + Encode.forHtml(q) + "</h1>";

<!-- Thymeleaf: safe by default -->
<p th:text="comment.body">escaped</p>
<!-- Unsafe: th:utext renders raw HTML -->

# Response header
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-RANDOM_PER_REQUEST'; object-src 'none'; base-uri 'none'`
  ],
  "CSRF": [
    "Cross-site request forgery tricks a logged-in user's browser into sending an unwanted state-changing request, because the browser attaches cookies automatically. Defend with anti-CSRF tokens (Spring Security enables them by default), SameSite cookies, and by never changing state on GET.",
    "The attacker's page makes the victim's browser send a request to your site, and the browser includes the session cookie, so the server cannot tell it from a genuine action. The attacker cannot read the response, only trigger the effect.",
    "Cookie-based authentication is ambient, so any site the user visits can cause requests with their credentials unless the server demands something an attacker cannot supply.",
    "It applies to session-cookie-authenticated browser applications with state-changing endpoints such as form posts, money transfers and settings changes.",
    "Pure token-based APIs where the client sends an Authorization header manually (not a cookie) are not vulnerable to classic CSRF, so disabling CSRF is acceptable there, but not for cookie-authenticated endpoints. Never disable it just to make a POST test pass.",
    "Keep Spring Security CSRF protection on for browser apps, send the synchroniser token in a hidden form field or X-CSRF-TOKEN header (CookieCsrfTokenRepository for single-page apps), set SameSite=Lax or Strict on session cookies, use POST, PUT or DELETE for changes, and optionally verify Origin and Referer headers.",
    "Tokens add a small amount of client-side plumbing; SameSite cookies are simple but depend on browser behaviour and site structure, so combine both.",
    "Alternatives are the double-submit cookie pattern, custom request headers that cannot be set cross-origin without CORS approval, and Fetch Metadata headers (Sec-Fetch-Site) checks.",
    `// Spring Security: default keeps CSRF on. SPA using a readable cookie token:
http.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()));

// Stateless API using bearer tokens in the Authorization header only
http.csrf(csrf -> csrf.disable())
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));

<!-- Thymeleaf form: token added automatically -->
<form th:action="@{/transfer}" method="post">...</form>

# Cookie hardening
Set-Cookie: JSESSIONID=PLACEHOLDER; Secure; HttpOnly; SameSite=Lax; Path=/`
  ],
  "CORS": [
    "CORS is a browser mechanism that relaxes the same-origin policy: a server opts in with Access-Control-Allow-Origin and related headers so a page from another origin can read its responses. It is not an authentication mechanism and it does not stop non-browser clients or CSRF.",
    "An origin is scheme plus host plus port. For non-simple requests the browser first sends an OPTIONS preflight, and the server answers with allowed origins, methods, headers, credentials flag and max-age. Wildcard origin cannot be combined with credentials.",
    "Browsers block cross-origin reads by default to protect users; legitimate separate front-end and API origins need a controlled way to allow it.",
    "Use it when a single-page app on one origin calls an API on another, and to expose specific cross-origin endpoints such as public APIs.",
    "Avoid reflecting the request Origin header blindly, allowing star with credentials, or allowing null origins; also do not treat CORS errors as server-side access control, since curl ignores them.",
    "Allow an explicit list of origins, allow only needed methods and headers, set allowCredentials only when required, configure it once in Spring via CorsConfigurationSource in the security filter chain (so preflights are handled before authentication), and cache preflights with maxAge.",
    "A narrow allowlist is safest but needs maintenance per environment; permissive CORS is convenient but exposes authenticated APIs to any malicious site the user visits.",
    "Alternatives are serving frontend and API from the same origin, a reverse proxy or API gateway that unifies origins, and JSONP (obsolete and unsafe).",
    `@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("https://app.example.com"));   // explicit, no star
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(Duration.ofHours(1));
    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/api/**", cfg);
    return src;
}

// in the filter chain
http.cors(Customizer.withDefaults());

# Vulnerable: reflects any origin with credentials
# Access-Control-Allow-Origin: https://evil.example
# Access-Control-Allow-Credentials: true`
  ],
  "Session Management": [
    "Secure sessions use unguessable random session IDs, transported only in Secure, HttpOnly, SameSite cookies, regenerated on login to prevent fixation, expired by idle and absolute timeouts, and invalidated on logout. Decide between server-side sessions and stateless tokens based on revocation needs.",
    "A session binds a browser to server-side state through an identifier. Attacks include session fixation (attacker sets the ID before login), hijacking (theft through XSS, sniffing or logs), and CSRF abuse of ambient cookies.",
    "The session identifier is effectively the user's credential after login, so its generation, storage and lifecycle must be protected as strictly as the password.",
    "Use it for browser-based applications; in clustered deployments store sessions in Redis (Spring Session) or use sticky routing.",
    "Avoid session IDs in URLs, predictable IDs, very long-lived sessions without re-authentication for sensitive actions, and storing sensitive data in client-side cookies without encryption and signing.",
    "Spring Security changes the session ID after authentication by default (changeSessionId), set server.servlet.session.cookie.secure, http-only and same-site properties, configure timeouts, limit concurrent sessions where required, invalidate and delete cookies on logout, and re-authenticate before sensitive operations.",
    "Server-side sessions are easy to revoke but need shared storage when scaled; stateless JWT sessions scale easily but are difficult to revoke before expiry.",
    "Alternatives are short-lived access tokens with refresh token rotation, the Backend-for-Frontend pattern that keeps tokens server-side, and delegating to an OIDC provider session.",
    `# application.properties
server.servlet.session.timeout=30m
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.same-site=lax
server.servlet.session.tracking-modes=cookie

// Spring Security
http.sessionManagement(s -> s
        .sessionFixation(f -> f.changeSessionId())
        .maximumSessions(1))
    .logout(l -> l
        .invalidateHttpSession(true)
        .deleteCookies("JSESSIONID"));`
  ],
  "Security Headers and Clickjacking": [
    "Security response headers harden browser behaviour: Strict-Transport-Security forces HTTPS, Content-Security-Policy limits script and frame sources, X-Content-Type-Options stops MIME sniffing, and frame-ancestors or X-Frame-Options prevents clickjacking. Spring Security sets several of them by default.",
    "Clickjacking overlays your page invisibly inside an attacker's frame so users click your buttons unknowingly. The defence is to forbid framing using CSP frame-ancestors (preferred) or X-Frame-Options DENY or SAMEORIGIN.",
    "These headers are cheap defence-in-depth that reduce the impact of XSS, downgrade attacks, sniffing and UI redress even when code has a bug.",
    "Apply them on all HTTP responses of web applications, especially login and sensitive pages, typically at the application or at a reverse proxy or gateway.",
    "Do not add a strict CSP blindly to an existing app without testing, since it will break inline scripts; and do not enable HSTS with includeSubDomains or preload before every subdomain supports HTTPS.",
    "Configure headers via http.headers() in Spring Security or at the proxy: HSTS with a long max-age, CSP starting in Content-Security-Policy-Report-Only mode, frame-ancestors none, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, and Permissions-Policy. Verify with securityheaders.com or ZAP.",
    "Pros: strong protection for little code. Cons: CSP is hard to roll out on legacy pages, HSTS mistakes are sticky, and headers do not fix underlying vulnerabilities.",
    "Alternatives or complements are framework-level protections, frame-busting JavaScript (weak, not recommended), and WAF-injected headers.",
    `http.headers(h -> h
    .httpStrictTransportSecurity(hsts -> hsts
        .includeSubDomains(true).maxAgeInSeconds(31536000))
    .contentSecurityPolicy(csp -> csp.policyDirectives(
        "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'"))
    .frameOptions(f -> f.deny())
    .contentTypeOptions(Customizer.withDefaults())
    .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)));

# Resulting headers
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin`
  ],
  "SSRF": [
    "Server-side request forgery makes your server fetch an attacker-chosen URL, which can reach internal services, cloud metadata endpoints (169.254.169.254) and localhost. Defend with an allowlist of hosts, resolving and validating the IP address, blocking redirects and private ranges, network egress controls, and IMDSv2 on AWS.",
    "Any feature that fetches a user-supplied URL, such as webhooks, image or PDF import, link previews and XML external entities, can be abused. The attacker uses the server's network position and trust to read internal data or hit internal APIs.",
    "Internal networks and metadata services often trust requests from inside, so one SSRF can lead to credential theft and lateral movement, as in several major cloud breaches.",
    "Check for it wherever the server issues HTTP or other outbound requests based on user input, including redirect following and URL parsing differences.",
    "Do not rely on a blocklist of strings like localhost or 127.0.0.1, since attackers use decimal or IPv6 forms, DNS names that resolve to internal IPs, redirects and DNS rebinding.",
    "Prefer a fixed allowlist of destination hosts, parse the URL, resolve DNS yourself and reject loopback, link-local, private and metadata addresses, connect to the validated IP, disable redirects or revalidate each hop, restrict schemes to https, apply egress firewall rules, give workloads minimal IAM roles, and require IMDSv2.",
    "Allowlists are secure but restrictive; dynamic validation is flexible but easy to get wrong because of rebinding and parser differences. Network-level egress filtering is the strongest backstop.",
    "Alternatives are a dedicated fetch proxy in an isolated network segment, asking users to upload content instead of supplying URLs, and cloud features such as VPC endpoints and metadata hop limits.",
    `// Vulnerable: fetches any URL supplied by the user
@GetMapping("/preview")
String preview(@RequestParam String url) throws Exception {
    return new String(new URL(url).openStream().readAllBytes());
}

// Fixed: allowlist, https only, resolve and reject internal addresses, no redirects
private static final Set<String> ALLOWED = Set.of("images.example.com");

String fetch(String raw) throws Exception {
    URI uri = URI.create(raw);
    if (!"https".equals(uri.getScheme()) || !ALLOWED.contains(uri.getHost())) {
        throw new IllegalArgumentException("host not allowed");
    }
    InetAddress addr = InetAddress.getByName(uri.getHost());
    if (addr.isAnyLocalAddress() || addr.isLoopbackAddress()
            || addr.isLinkLocalAddress() || addr.isSiteLocalAddress()) {
        throw new IllegalArgumentException("internal address");
    }
    HttpClient client = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build();
    return client.send(HttpRequest.newBuilder(uri).build(), HttpResponse.BodyHandlers.ofString()).body();
}`
  ],
  "TLS and Certificates": [
    "TLS encrypts and authenticates traffic: the client verifies the server certificate chain up to a trusted CA and the hostname, then both sides derive session keys (TLS 1.3 uses ephemeral key exchange for forward secrecy). Use TLS 1.2 or 1.3 only, validate certificates properly, and automate renewal.",
    "An X.509 certificate binds a public key to an identity (Subject Alternative Name) and is signed by a CA. A chain runs from the leaf through intermediates to a root in the trust store. Java stores keys and certificates in keystores and trust anchors in truststores (PKCS12 format by default).",
    "Without TLS, credentials and data can be read or altered on the network; without certificate validation, TLS gives no protection against man-in-the-middle attacks.",
    "Use it for all external and internal traffic, including service-to-service calls, database connections and message brokers, and use Let's Encrypt or an internal CA with automated rotation.",
    "Never disable certificate or hostname verification (trust-all TrustManager, HostnameVerifier returning true) to make a test pass, and avoid long-lived certificates, self-signed certificates in production, and private keys in source control.",
    "Terminate TLS at the load balancer or in the app with server.ssl properties, import private CAs into a truststore rather than disabling checks, keep private keys in a secrets manager, enable HSTS, automate issuance with cert-manager or ACME, monitor expiry, and diagnose with openssl s_client or keytool -list.",
    "TLS adds handshake latency and key management work; terminating at the edge is simpler but leaves internal traffic in plaintext unless re-encrypted (or a mesh with mTLS is used).",
    "Alternatives or complements are mTLS, service meshes that automate certificates, VPN or private networking (not a replacement for TLS), and certificate pinning in mobile apps with care.",
    `# Spring Boot: TLS with a PKCS12 keystore (password from the environment)
server.port=8443
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-type=PKCS12
server.ssl.key-store-password=$KEYSTORE_PASSWORD
server.ssl.enabled-protocols=TLSv1.3,TLSv1.2

# inspect a server certificate and chain
openssl s_client -connect api.example.com:443 -servername api.example.com -showcerts
keytool -list -v -keystore keystore.p12 -storetype PKCS12

// Vulnerable: disables validation (never do this)
HttpsURLConnection.setDefaultHostnameVerifier((host, session) -> true);

// Fixed: trust a private CA through a truststore
SSLContext ctx = SSLContext.getInstance("TLS");
ctx.init(null, trustManagerFactoryFromTruststore.getTrustManagers(), null);`
  ],
  "OAuth2 Flows": [
    "OAuth 2.0 is a delegation framework where a client obtains an access token from an authorisation server to call a resource server. Use Authorization Code with PKCE for user-facing apps (web, SPA, mobile), Client Credentials for machine-to-machine, and avoid the Implicit and Resource Owner Password flows, which OAuth 2.1 removes.",
    "Roles are resource owner, client, authorisation server and resource server. In Authorization Code, the user authenticates at the authorisation server, the client receives a one-time code and exchanges it (with the PKCE code_verifier) for tokens. Refresh tokens obtain new access tokens, and Device Code serves input-constrained devices.",
    "It lets users grant limited access without sharing passwords, and lets services authenticate to each other with scoped, short-lived tokens.",
    "Use Authorization Code with PKCE for logins, Client Credentials for backend jobs and service calls, Device Code for TVs and CLIs, and token exchange or on-behalf-of for propagating identity.",
    "Do not use Implicit (tokens in URLs) or Password grant (client sees user credentials), do not treat OAuth as authentication by itself (use OpenID Connect), and do not store tokens in localStorage if avoidable.",
    "Use a vetted authorisation server (Keycloak, Spring Authorization Server, a cloud IdP), register exact redirect URIs, always send and verify state and PKCE, keep access tokens short-lived with rotating refresh tokens, request minimal scopes, validate JWT signature, issuer, audience and expiry in resource servers, and keep confidential client secrets out of public clients.",
    "Pros: standard, delegation without passwords, scoped access. Cons: many options and easy misconfigurations (redirect URI handling, token storage), and revocation is hard with self-contained tokens.",
    "Alternatives are SAML for enterprise SSO, API keys for simple server-to-server use, mutual TLS client authentication, and session cookies with a Backend-for-Frontend.",
    `# 1. Authorization Code + PKCE: redirect the user (placeholders)
GET https://auth.example.com/authorize?response_type=code&client_id=shop-web&redirect_uri=https://app.example.com/callback&scope=openid%20orders.read&state=RANDOM_STATE&code_challenge=BASE64URL_SHA256_OF_VERIFIER&code_challenge_method=S256

# 2. Exchange the code for tokens
POST https://auth.example.com/token
grant_type=authorization_code&code=RECEIVED_CODE&redirect_uri=https://app.example.com/callback&client_id=shop-web&code_verifier=ORIGINAL_RANDOM_VERIFIER

# Client Credentials (machine to machine)
POST https://auth.example.com/token
grant_type=client_credentials&client_id=billing-job&client_secret=PLACEHOLDER_SECRET&scope=invoices.write

# Spring Boot resource server
# spring.security.oauth2.resourceserver.jwt.issuer-uri=https://auth.example.com`
  ],
  "JWT Pitfalls": [
    "A JWT is a signed (JWS) or encrypted (JWE) token with header, claims and signature; the main pitfalls are accepting alg none or the wrong algorithm, not validating issuer, audience and expiry, weak HS256 secrets, putting sensitive data in an unencrypted payload (it is only base64url encoded), and the difficulty of revoking tokens. Keep tokens short-lived and validate everything.",
    "A signed JWT has three base64url parts: header (alg, kid), payload (claims such as iss, sub, aud, exp) and signature. Anyone can read the payload, and the signature only proves it was not altered and who issued it.",
    "JWTs enable stateless verification across services without a session lookup, but that statelessness creates security traps when libraries or configuration are lax.",
    "Use them as short-lived access tokens between an authorisation server and resource servers, verifying with the issuer's public keys from the JWKS endpoint.",
    "Avoid them as long-lived session tokens that cannot be revoked, for secrets or personal data in claims, storing them in localStorage where XSS can steal them, and algorithm confusion where an RS256 public key is used as an HS256 secret.",
    "Pin the expected algorithm, verify signature, iss, aud, exp and nbf, fetch keys by kid from a cached JWKS, use strong secrets or asymmetric keys, keep lifetimes to minutes, use refresh token rotation, keep a denylist or short expiry for revocation, and store tokens in HttpOnly cookies or keep them server-side via a Backend-for-Frontend.",
    "Pros: stateless and scalable, easy cross-service propagation. Cons: hard revocation, larger header size, claim data staleness until expiry, and subtle validation bugs.",
    "Alternatives are opaque tokens with introspection (RFC 7662), server-side sessions, PASETO, and token binding techniques such as DPoP or mTLS-bound tokens.",
    `// Vulnerable: parse without verifying (just decodes the payload)
Claims claims = Jwts.parser().build().parseUnsecuredClaims(token).getPayload();

// Fixed: verify signature and enforce issuer, audience, expiry (JJWT 0.12)
Claims claims = Jwts.parser()
    .verifyWith(publicKey)                  // pins the key type
    .requireIssuer("https://auth.example.com")
    .requireAudience("shop-api")
    .build()
    .parseSignedClaims(token)               // throws if invalid or expired
    .getPayload();

// Spring Security resource server with audience validation
@Bean
JwtDecoder jwtDecoder() {
    NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation("https://auth.example.com");
    OAuth2TokenValidator<Jwt> withAudience = new JwtClaimValidator<List<String>>("aud",
        aud -> aud != null && aud.contains("shop-api"));
    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefaultWithIssuer("https://auth.example.com"), withAudience));
    return decoder;
}`
  ],
  "OpenID Connect": [
    "OpenID Connect is an identity layer on top of OAuth 2.0 that adds a signed ID token (a JWT about the authenticated user), a UserInfo endpoint, standard scopes and claims, and discovery, so OAuth can be used for login and single sign-on. OAuth gives access to APIs, OIDC tells the app who the user is.",
    "The client requests the openid scope and receives an ID token containing iss, sub, aud, exp, iat and optionally nonce, name and email. A discovery document at /.well-known/openid-configuration lists endpoints and the JWKS URI for signature keys.",
    "Plain OAuth does not define how to identify the user; OIDC standardises that, so apps avoid inventing insecure login schemes on top of access tokens.",
    "Use it for SSO and social or enterprise login with providers such as Keycloak, Entra ID, Okta or Google, and for federated identity across applications.",
    "Do not use an access token as proof of identity, skip validation of the ID token (signature, iss, aud, exp, nonce), or send ID tokens to APIs as access tokens.",
    "Use Authorization Code with PKCE, send a nonce and state, validate the ID token and its claims, rely on sub plus iss as the stable user key (not email), use Spring Security oauth2Login with a client registration, map groups or roles claims to authorities, and support logout (RP-initiated logout) and token refresh.",
    "Pros: standard SSO, no password handling in your app, rich claims. Cons: dependency on the identity provider, claim mapping differences between providers, and logout and session synchronisation can be tricky.",
    "Alternatives are SAML 2.0 (common in legacy enterprise), custom session login with local accounts, and passkeys (WebAuthn) for passwordless authentication.",
    `# application.yml: Spring Boot OIDC login with a provider issuer (placeholders)
spring:
  security:
    oauth2:
      client:
        registration:
          corp:
            client-id: shop-web
            client-secret: PLACEHOLDER_SECRET
            scope: openid, profile, email
        provider:
          corp:
            issuer-uri: https://auth.example.com/realms/corp

// Security config
http.authorizeHttpRequests(a -> a.anyRequest().authenticated())
    .oauth2Login(Customizer.withDefaults());

// Reading the identity in a controller
@GetMapping("/me")
String me(@AuthenticationPrincipal OidcUser user) {
    return user.getSubject() + " " + user.getEmail();
}`
  ],
  "mTLS": [
    "Mutual TLS makes both sides present certificates, so the server verifies the client as well as the client verifying the server, which gives strong service-to-service identity and encrypted traffic. It is commonly automated by a service mesh such as Istio or Linkerd with short-lived certificates.",
    "In a normal TLS handshake only the server authenticates. With mTLS the server sends a CertificateRequest, the client proves possession of its private key, and the server validates the client certificate against a trusted CA. The certificate identity (SAN or SPIFFE ID) is then used for authorisation.",
    "Network location is a weak identity; certificates tie each workload to a cryptographic identity, which supports zero-trust designs and prevents unauthorised callers from reaching services.",
    "Use it for internal microservice communication, B2B APIs with strict partner identity, and certificate-bound tokens for high-security APIs.",
    "Avoid it for public browser-facing endpoints where users cannot manage client certificates, and avoid mTLS without automated issuance and rotation, which becomes an operational burden.",
    "Run a private CA or use SPIFFE and SPIRE, cert-manager or a mesh to issue short-lived workload certificates, configure the server with client-auth need and a truststore of accepted CAs (server.ssl.client-auth=need in Spring Boot), map the certificate subject to a principal, and monitor expiry and rotation.",
    "Pros: strong mutual identity, encryption, and no shared secrets. Cons: certificate lifecycle and PKI management complexity, harder debugging, and added handshake overhead.",
    "Alternatives are OAuth2 client credentials tokens, API keys or HMAC-signed requests, network policies, and a service mesh that provides mTLS transparently.",
    `# Spring Boot: require client certificates
server.ssl.enabled=true
server.ssl.key-store=classpath:server.p12
server.ssl.key-store-password=$KEYSTORE_PASSWORD
server.ssl.client-auth=need
server.ssl.trust-store=classpath:truststore.p12
server.ssl.trust-store-password=$TRUSTSTORE_PASSWORD

// Map the certificate to a user in Spring Security
http.x509(x -> x.subjectPrincipalRegex("CN=(.*?)(?:,|$)"))
    .authorizeHttpRequests(a -> a.anyRequest().authenticated());

# Test with curl
curl --cert client.pem --key client-key.pem --cacert ca.pem https://orders.internal.example.com/health

# Istio: require mTLS in a namespace
# kind: PeerAuthentication
# spec: { mtls: { mode: STRICT } }`
  ],
  "Insecure Deserialization": [
    "Deserializing untrusted data with Java native serialization (ObjectInputStream) can execute attacker-controlled code through gadget chains in libraries on the classpath. Avoid native serialization for untrusted input, prefer simple data formats such as JSON into explicit DTOs, and apply serialization filters if you must.",
    "During readObject, classes can run arbitrary logic. Attackers craft object graphs that chain existing classes (gadgets) into remote code execution, denial of service or file access. Similar issues exist with Jackson default typing, XStream and YAML loaders that instantiate arbitrary types.",
    "It consistently yields remote code execution in widely used libraries (for example, the Commons Collections gadgets), and appears in the OWASP Top 10 under Software and Data Integrity Failures.",
    "Check any place that reads serialized objects from the network, caches, message queues, cookies, files or RMI and JMX endpoints.",
    "Never deserialize untrusted bytes with ObjectInputStream, enable Jackson default typing for polymorphic input from untrusted sources, or use SnakeYAML's unrestricted load on user input.",
    "Use JSON or Protobuf with explicit types, avoid enableDefaultTyping and use a PolymorphicTypeValidator with an allowlist, set a JEP 290 deserialization filter (ObjectInputFilter or the jdk.serialFilter property) with an allowlist, use SafeConstructor for YAML, sign data you must trust, keep libraries patched, and prefer records or immutable DTOs.",
    "Allowlists are secure but need maintenance when classes change; replacing native serialization with JSON needs migration effort but removes the whole class of bug.",
    "Alternatives are Protobuf, Avro or plain JSON with schema validation, signed and encrypted tokens for state passed through clients, and keeping state server-side.",
    `// Vulnerable: deserialises untrusted bytes
try (ObjectInputStream in = new ObjectInputStream(request.getInputStream())) {
    Object o = in.readObject();            // gadget chain can run code here
}

// Fixed (if you cannot avoid it): allowlist filter, JEP 290
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
    "com.example.dto.*;java.base/*;!*");
ObjectInputStream in = new ObjectInputStream(request.getInputStream());
in.setObjectInputFilter(filter);

// Better: JSON into a concrete type, no default typing
ObjectMapper mapper = new ObjectMapper();
OrderDto dto = mapper.readValue(request.getInputStream(), OrderDto.class);

// JVM-wide filter
// -Djdk.serialFilter=com.example.dto.*;java.base/*;!*`
  ],
  "Dependency and Supply Chain Security": [
    "Most of your code is third-party, so vulnerable or malicious dependencies are a major risk: scan with OWASP Dependency-Check, Dependabot, Renovate or Snyk, pin and lock versions, generate an SBOM, and protect the build pipeline. The Log4Shell incident is the textbook case.",
    "Supply chain attacks include known-vulnerable libraries (CVEs), typosquatting and dependency confusion, compromised maintainers or build systems, and tampered artefacts. Defences include software composition analysis, signed artefacts, provenance (SLSA) and SBOMs in CycloneDX or SPDX format.",
    "A single vulnerable transitive dependency can expose the whole application, and attackers increasingly target build and release processes rather than your own code.",
    "Apply it to every project: in CI on each build, on a schedule for newly published CVEs, and when choosing or adding a new library.",
    "Avoid unpinned or dynamic versions, resolving from public repositories without a proxy, ignoring scanner findings without triage, huge dependency trees for trivial features, and running CI with excessive secrets.",
    "Route dependencies through an internal repository manager, pin versions through a BOM or lockfile, run dependency-check or the Maven enforcer plugin, enable Dependabot or Renovate with automated pull requests, generate an SBOM with the CycloneDX plugin, verify checksums and signatures, scan images with Trivy or Grype, claim your namespaces to prevent dependency confusion, and triage by reachability and severity (CVSS, EPSS).",
    "Pros: early detection, auditability, faster patching. Cons: noisy false positives, update churn, and scanners only know published CVEs, not malicious new packages.",
    "Alternatives or complements are vendoring and reviewing critical code, minimal dependency policies, reproducible builds, SLSA-level attestations with Sigstore cosign, and runtime protection.",
    `<!-- pom.xml: fail the build on serious CVEs -->
<plugin>
  <groupId>org.owasp</groupId>
  <artifactId>dependency-check-maven</artifactId>
  <version>12.1.0</version>
  <configuration>
    <failBuildOnCVSS>7</failBuildOnCVSS>
  </configuration>
  <executions>
    <execution><goals><goal>check</goal></goals></execution>
  </executions>
</plugin>

<!-- Generate an SBOM -->
<plugin>
  <groupId>org.cyclonedx</groupId>
  <artifactId>cyclonedx-maven-plugin</artifactId>
  <executions>
    <execution><phase>package</phase><goals><goal>makeAggregateBom</goal></goals></execution>
  </executions>
</plugin>

# shell
# mvn dependency:tree -Dverbose           # find where a vulnerable library comes from
# trivy image registry.example.com/shop-api:1.0.0
# cosign sign registry.example.com/shop-api:1.0.0`
  ],
  "Secrets Handling": [
    "In application code, never hard-code or log secrets: read them from environment variables, mounted files or a secrets manager at runtime, keep them out of git and images, avoid exposing them in actuator endpoints and stack traces, and rotate them. If one leaks, treat it as compromised and rotate immediately.",
    "Secrets are credentials such as database passwords, API keys, signing keys and tokens. Leakage paths include source control history, build logs, error messages, heap dumps, config endpoints and client-side bundles.",
    "Attackers routinely scan public and private repositories for keys, and a single leaked cloud key can lead to full account compromise.",
    "Use it everywhere configuration holds credentials: Spring properties, CI variables, Docker builds, Kubernetes manifests and test fixtures.",
    "Avoid committing .env files or application.yml with real values, using the same secret across environments, passing secrets as build arguments baked into image layers, and printing them in startup logs or toString methods.",
    "Externalise configuration, use a secrets manager (Vault, cloud secret services, Spring Cloud Vault or Kubernetes secrets with encryption) with runtime injection, use char arrays or dedicated types and avoid logging them, mask values in Spring Boot actuator (management.endpoint.env.show-values=never), add gitleaks or trufflehog scanning plus pre-commit hooks, and prefer workload identity over static keys.",
    "Pros: smaller exposure and easy rotation. Cons: extra infrastructure and bootstrap secret problem, and runtime fetching adds a startup dependency.",
    "Alternatives are encrypted configuration (Jasypt, SOPS, Sealed Secrets) where the key is still protected elsewhere, and eliminating secrets with cloud IAM roles, IRSA or workload identity federation.",
    `// Vulnerable
private static final String API_KEY = "sk_live_EXAMPLE_DO_NOT_COMMIT";
log.info("Connecting with password {}", password);

// Fixed: externalised, never logged
@Value("#{systemEnvironment['PAYMENT_API_KEY']}")
private String apiKey;

# application.properties
management.endpoint.env.show-values=never
management.endpoint.configprops.show-values=never
management.endpoints.web.exposure.include=health,info

# Dockerfile: do not use ARG/ENV for secrets; use BuildKit secret mounts
# RUN --mount=type=secret,id=npmrc cat /run/secrets/npmrc > /dev/null

# Scan before pushing
# gitleaks protect --staged`
  ],
  "Input Validation and Output Encoding": [
    "Validate input on the server for type, length, range and format using allowlists, and encode output for the exact context it is placed in (HTML, attribute, JavaScript, URL, SQL), because validation reduces bad data while encoding and parameterisation actually prevent injection. Use Bean Validation, parameterised queries and the OWASP Java Encoder.",
    "Input validation checks that data conforms to what the application expects, and canonicalisation normalises it first. Output encoding transforms special characters so the receiver treats data as data, and parameterised queries separate SQL code from data.",
    "Injection flaws (SQL, command, LDAP, XSS, path traversal) happen when untrusted data is interpreted as code, so defence needs both layers.",
    "Use it at every trust boundary: HTTP parameters, headers, JSON bodies, file uploads, message payloads and data read from the database or third parties.",
    "Do not rely on client-side validation, blacklists of bad characters, or validation as the only protection against injection; also avoid building SQL, shell commands or file paths by string concatenation.",
    "Use Jakarta Bean Validation (@NotBlank, @Size, @Pattern, @Valid on request DTOs), allowlist formats, enforce size limits on bodies and uploads, use JPA parameters or PreparedStatement, avoid Runtime.exec with user input (use ProcessBuilder with argument lists), normalise and check file paths against a base directory, and encode with Encode.forHtml and similar context-specific methods.",
    "Pros: layered defence that blocks whole bug classes. Cons: rules must be kept in sync with business needs, and overly strict validation causes false rejections of legitimate input.",
    "Alternatives or complements are schema validation (JSON Schema, OpenAPI), ORM and query builders such as jOOQ, safe-by-default template engines, and WAFs as an additional layer.",
    `// DTO validation
public record CreateUser(
    @NotBlank @Size(max = 50) String name,
    @Email String email,
    @Min(18) @Max(120) int age) {}

@PostMapping("/users")
ResponseEntity<Void> create(@Valid @RequestBody CreateUser req) { /* ... */ return ResponseEntity.ok().build(); }

// SQL injection: vulnerable vs fixed
String bad = "SELECT * FROM users WHERE email = '" + email + "'";
@Query("select u from User u where u.email = :email")
Optional<User> findByEmail(@Param("email") String email);

// Path traversal: vulnerable vs fixed
Path base = Path.of("/data/uploads").toRealPath();
Path file = base.resolve(userSuppliedName).normalize();
if (!file.startsWith(base)) throw new SecurityException("bad path");

// Command injection: pass arguments separately, never through a shell string
new ProcessBuilder("convert", inputPath, outputPath).start();`
  ],
  "Secure Logging and PII": [
    "Log enough to detect and investigate security events (logins, access denials, privilege changes) but never log secrets, tokens, full card numbers or unnecessary personal data, and sanitise user input to prevent log forging and injection. Treat logs as sensitive data with access control, retention limits and tamper protection.",
    "Secure logging covers what is logged, how entries are protected and who can read them. PII is any data identifying a person (email, address, phone, IP in many jurisdictions), and regulations such as GDPR require minimisation, retention limits and the ability to delete or protect it.",
    "Logs are widely copied to third-party tools and shared with many engineers, so leaked passwords or personal data in logs create breaches and compliance violations; missing security logs delay detection, which is itself an OWASP Top 10 category.",
    "Apply it to application logs, access logs, audit trails and error handling, including exception messages and request or response body logging.",
    "Avoid logging request bodies by default, authentication headers, session IDs, passwords or full PII; avoid verbose debug logging in production and concatenating raw user input that may contain newlines, which enables log forging.",
    "Mask or hash sensitive fields (for example in a Logback converter or by overriding toString), use structured JSON logs with a correlation id, log security events with who, what, when and outcome, neutralise CR and LF in user-supplied values, restrict access, ship logs to a central store with retention and integrity protection, and keep Log4j and Logback patched.",
    "Pros: better detection, compliance, and lower breach impact. Cons: masking has CPU and maintenance cost, and too little detail makes incidents hard to investigate, so balance carefully.",
    "Alternatives or complements are tokenisation or pseudonymisation of identifiers, dedicated audit logging separate from application logs, and SIEM systems for correlation and alerting.",
    `// Vulnerable: logs credentials and unsanitised input
log.info("Login attempt user={} password={}", username, password);
log.info("Search term: " + request.getParameter("q"));   // may contain newlines (log forging)

// Fixed: log the event, not the secret, and neutralise line breaks
String safeUser = username.replaceAll("[\\r\\n]", "_");
log.info("login_failed user={} ip={} correlationId={}", safeUser, maskIp(ip), correlationId);

// Mask sensitive fields in toString
public record Payment(String id, String cardNumber) {
    @Override public String toString() {
        return "Payment[id=" + id + ", card=****" + cardNumber.substring(cardNumber.length() - 4) + "]";
    }
}

// Audit record for access decisions
auditLog.info("authz_denied subject={} action={} resource={}", subjectId, "READ", "invoice:123");`
  ],
  "Zero Trust": [
    "Zero trust means never trusting a request because of where it comes from: verify every user, device and service explicitly, enforce least privilege, and assume breach. In practice this means strong identity, mTLS between services, micro-segmentation, short-lived credentials and continuous authorisation and logging.",
    "The model (NIST SP 800-207) replaces the trusted internal network perimeter with policy decision and enforcement points that evaluate identity, device posture and context on each access. Core principles are verify explicitly, use least privilege and assume breach.",
    "Perimeter security fails once an attacker or malicious insider is inside, and cloud, remote work and microservices have dissolved the clear network boundary.",
    "Use it when designing service-to-service security, remote access to internal tools, multi-cloud networks and any system holding sensitive data.",
    "Avoid treating it as a product you can buy or a one-off project; it is an incremental architecture, and applying heavy controls everywhere without prioritisation hurts developer productivity.",
    "Authenticate and authorise every call with OIDC or JWT plus object-level checks, enable mTLS through a service mesh or SPIFFE identities, apply Kubernetes NetworkPolicies for micro-segmentation, use short-lived credentials and workload identity, enforce MFA and device posture for people, centralise logging and anomaly detection, and replace VPN-wide access with identity-aware proxies.",
    "Pros: contains breaches, fits cloud and microservices, stronger auditability. Cons: significant effort and complexity, added latency and operational overhead, and cultural change.",
    "Alternatives are traditional perimeter or castle-and-moat security with VPNs and firewalls (weak against lateral movement) and defence in depth as a complementary layered approach.",
    `# Kubernetes NetworkPolicy: only the API gateway may call the orders service
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: orders-allow-gateway-only
  namespace: shop
spec:
  podSelector:
    matchLabels: { app: orders }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector:
            matchLabels: { app: api-gateway }
      ports:
        - port: 8080

# Istio: require mTLS and allow only a specific workload identity
# kind: AuthorizationPolicy
# rules:
#   - from:
#       - source:
#           principals: ["cluster.local/ns/shop/sa/api-gateway"]

// App level: still authorise every request, even from internal callers
@PreAuthorize("hasAuthority('SCOPE_orders.read')")
public Order get(Long id) { /* ... */ }`
  ]
};
