// Topic filter for the home page: clicking a header topic shows only the matching
// buttons and hides sections left empty. Clicking the active topic again shows everything.
(function initTopicFilter() {
  const buttons = Array.from(document.querySelectorAll(".topic-button"));
  if (!buttons.length) return;

  let active = null;

  function apply() {
    // Page buttons and Spring/Microservices sub-group headings carry a data-topic.
    document.querySelectorAll(".page-button, .topic-group").forEach(el => {
      el.hidden = active !== null && el.dataset.topic !== active;
    });

    document.querySelectorAll("main section").forEach(section => {
      const visible = section.querySelector(".page-button:not([hidden])");
      section.hidden = active !== null && !visible;
    });

    buttons.forEach(btn => {
      const on = btn.dataset.filter === active;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("topic-active", on);
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      active = active === filter ? null : filter;
      apply();
    });
  });
})();
