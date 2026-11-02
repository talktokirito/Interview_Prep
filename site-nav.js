// Shared header navigation: a Home link plus one dropdown per section, on every page.
// Item format: [label, href, priority] where priority is m (must), d (medium) or l (low).
const SITE_NAV = [
  { label: "Core Topics", items: [
    ["Collections", "collections.html", "m"],
    ["Versions", "versions.html", "m"],
    ["Stream", "stream.html", "m"],
    ["Spring", "spring.html", "m"]
  ] },
  { label: "Java Fundamentals", items: [
    ["Core Java and OOP", "core-java.html", "m"],
    ["Modern Java Features", "modern-java.html", "d"],
    ["Concurrency", "concurrency.html", "m"],
    ["JVM and Performance", "jvm.html", "m"],
    ["Databases and JPA", "database.html", "m"],
    ["Testing", "testing.html", "m"]
  ] },
  { label: "Design and Architecture", items: [
    ["Design Patterns and SOLID", "design-patterns.html", "m"],
    ["Low-Level Design", "lld.html", "d"],
    ["System Design", "system-design.html", "m"],
    ["Microservices Patterns", "microservices.html", "m"],
    ["Architecture", "architecture.html", "d"],
    ["API Design", "api-design.html", "m"],
    ["Messaging and Streaming", "messaging.html", "d"]
  ] },
  { label: "Engineering Practices", items: [
    ["DevOps", "devops.html", "d"],
    ["Security", "security.html", "m"],
    ["Observability", "observability.html", "d"]
  ] },
  { label: "Interview Skills", items: [
    ["Data Structures and Algorithms", "dsa.html", "d"],
    ["Scenario Questions", "scenarios.html", "m"],
    ["Behavioural and Leadership", "behavioural.html", "m"]
  ] },
  { label: "Cloud", items: [
    ["AWS", "aws.html", "m"],
    ["GCP", "gcp.html", "d"],
    ["Azure", "azure.html", "d"],
    ["Comparison", "comparison.html", "d"]
  ] }
];

(function buildSiteNav() {
  const header = document.querySelector("header");
  if (!header) return;

  const current = location.pathname.split("/").pop() || "index.html";
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Site");

  const home = document.createElement("a");
  home.href = "index.html";
  home.textContent = "Home";
  home.className = "nav-home";
  if (current === "index.html") home.setAttribute("aria-current", "page");
  nav.append(home);

  const groups = [];
  function closeAll(except) {
    groups.forEach(g => {
      if (g.button === except) return;
      g.button.setAttribute("aria-expanded", "false");
      g.menu.hidden = true;
    });
  }

  SITE_NAV.forEach(section => {
    const group = document.createElement("div");
    group.className = "nav-group";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-toggle";
    button.setAttribute("aria-expanded", "false");
    button.textContent = section.label;

    const menu = document.createElement("div");
    menu.className = "nav-menu";
    menu.hidden = true;

    let holdsCurrent = false;
    section.items.forEach(([label, href, priority]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      link.dataset.priority = priority;
      if (href === current) {
        link.setAttribute("aria-current", "page");
        holdsCurrent = true;
      }
      menu.append(link);
    });
    if (holdsCurrent) button.classList.add("nav-current");

    button.addEventListener("click", event => {
      event.stopPropagation();
      const open = button.getAttribute("aria-expanded") === "true";
      closeAll(button);
      button.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });

    groups.push({ button, menu });
    group.append(button, menu);
    nav.append(group);
  });

  document.addEventListener("click", () => closeAll(null));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeAll(null);
  });

  header.append(nav);
})();
