const ANSWER_SECTIONS = [
  "Definition (What)",
  "Motivation (Why)",
  "Context (When)",
  "Anti-Context (When NOT)",
  "Implementation (How)",
  "Trade-offs (Pros & Cons)",
  "Alternatives (Comparison)"
];

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

    const [summary, ...sections] = SERVICE_ANSWERS[name] || ["No answer written yet."];

    const title = document.createElement("h4");
    title.textContent = name;

    const summaryBox = document.createElement("p");
    summaryBox.className = "answer-summary";
    const summaryLabel = document.createElement("strong");
    summaryLabel.textContent = "Interview summary: ";
    summaryBox.append(summaryLabel, summary);

    answer.replaceChildren(title, summaryBox);
    sections.forEach((text, i) => {
      const heading = document.createElement("h5");
      heading.textContent = ANSWER_SECTIONS[i];
      const body = document.createElement("p");
      body.textContent = text;
      answer.append(heading, body);
    });

    answer.dataset.service = name;
    answer.hidden = false;
    button.setAttribute("aria-expanded", "true");
  });
});
