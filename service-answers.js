const ANSWER_SECTIONS = [
  "Definition (What)",
  "Motivation (Why)",
  "Context (When)",
  "Anti-Context (When NOT)",
  "Implementation (How)",
  "Trade-offs (Pros & Cons)",
  "Alternatives (Comparison)",
  "Example"
];

// A page may define its own SECTION_LABELS (same order) before this script loads.
function sectionLabels() {
  return typeof SECTION_LABELS !== "undefined" ? SECTION_LABELS : ANSWER_SECTIONS;
}

function revisedStore() {
  const key = "revised:" + location.pathname;
  try {
    return { key, set: new Set(JSON.parse(localStorage.getItem(key) || "[]")) };
  } catch (e) {
    return { key, set: new Set() };
  }
}

function saveRevised(store) {
  try {
    localStorage.setItem(store.key, JSON.stringify([...store.set]));
  } catch (e) { /* storage unavailable: progress simply is not remembered */ }
}

function updateRevisedCount() {
  const counter = document.getElementById("revised-count");
  if (!counter) return;
  const all = document.querySelectorAll(".guide nav button").length;
  const done = document.querySelectorAll(".guide nav button.revised").length;
  counter.textContent = `Revised ${done} of ${all}`;
}

// name: key stored for the topic; button: the button that opened the answer (optional)
function renderAnswer(container, name, parts, button) {
  const labels = sectionLabels();
  const [summary, ...sections] = parts;

  const title = document.createElement("h4");
  title.textContent = name;

  const summaryBox = document.createElement("p");
  summaryBox.className = "answer-summary";
  const summaryLabel = document.createElement("strong");
  summaryLabel.textContent = "Interview summary: ";
  summaryBox.append(summaryLabel, summary);

  container.replaceChildren(title, summaryBox);
  sections.forEach((text, i) => {
    const heading = document.createElement("h5");
    heading.textContent = labels[i];
    let body;
    if (/^(Example|Code)/.test(labels[i])) {
      body = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = text;
      body.append(code);
    } else {
      body = document.createElement("p");
      body.textContent = text;
    }
    container.append(heading, body);
  });

  if (button) {
    const store = revisedStore();
    const label = document.createElement("label");
    label.className = "revised-toggle";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = store.set.has(name);
    box.addEventListener("change", () => {
      if (box.checked) store.set.add(name); else store.set.delete(name);
      button.classList.toggle("revised", box.checked);
      saveRevised(store);
      updateRevisedCount();
    });
    label.append(box, " Mark as revised");
    container.append(label);
  }
}

document.querySelectorAll(".guide nav button").forEach(button => {
  button.addEventListener("click", () => {
    const nav = button.closest("nav");
    let answer = nav.nextElementSibling;
    if (!answer || !answer.classList.contains("service-answer")) {
      answer = document.createElement("div");
      answer.className = "service-answer";
      answer.hidden = true;
      nav.after(answer);
    }

    const name = button.textContent;
    const wasOpen = !answer.hidden && answer.dataset.service === name;
    nav.querySelectorAll("button").forEach(b => b.setAttribute("aria-expanded", "false"));

    if (wasOpen) {
      answer.hidden = true;
      return;
    }

    renderAnswer(answer, name, SERVICE_ANSWERS[name] || ["No answer written yet."], button);
    answer.dataset.service = name;
    answer.hidden = false;
    button.setAttribute("aria-expanded", "true");
  });
});

// Search box and revised counter, shown above the first topic group.
(function setupPageTools() {
  const articles = [...document.querySelectorAll("article.guide")].filter(a => a.querySelector("nav button"));
  if (!articles.length) return;

  const store = revisedStore();
  document.querySelectorAll(".guide nav button").forEach(b => {
    if (store.set.has(b.textContent)) b.classList.add("revised");
  });

  const tools = document.createElement("div");
  tools.className = "page-tools";
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search topics...";
  search.setAttribute("aria-label", "Search topics");
  const counter = document.createElement("span");
  counter.id = "revised-count";
  tools.append(search, counter);
  articles[0].before(tools);
  updateRevisedCount();

  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    articles.forEach(article => {
      let visible = 0;
      article.querySelectorAll("nav button").forEach(b => {
        const show = !q || b.textContent.toLowerCase().includes(q);
        b.hidden = !show;
        if (show) visible++;
      });
      article.hidden = visible === 0;
    });
  });
})();
