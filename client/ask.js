import { esc } from "./esc.js";

// Renders CLARIFIER questions and resolves with one answer (or null) per question.
export function askUser(el, questions) {
  return new Promise((resolve) => {
    const picked = questions.map(() => "");
    el.innerHTML =
      questions.map((q, i) =>
        `<fieldset class="q"><legend>${esc(q.q)}</legend><div class="opts">` +
        q.options.map((o, j) => `<button type="button" class="opt" data-q="${i}" data-o="${j}" aria-pressed="false">${esc(o)}</button>`).join("") +
        `</div><input class="qa" id="qa-${i}" data-q="${i}" aria-label="Answer to: ${esc(q.q)}"></fieldset>`).join("") +
      `<div class="ask-act"><button type="button" class="btn pri" data-ask="send">Send answers</button>` +
      `<button type="button" class="btn" data-ask="skip">Skip</button></div>`;
    el.hidden = false;
    el.scrollIntoView({ block: "nearest" });
    el.querySelector(".qa")?.focus({ preventScroll: true });

    const finish = (vals) => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("input", onInput);
      el.removeEventListener("keydown", onKey);
      el.hidden = true;
      el.innerHTML = "";
      resolve(vals);
    };
    const send = () => finish(picked.map((s) => s.trim() || null));
    const onClick = (e) => {
      const o = e.target.closest(".opt");
      if (o) {
        const i = Number(o.dataset.q);
        picked[i] = questions[i].options[Number(o.dataset.o)];
        el.querySelector(`#qa-${i}`).value = picked[i];
        for (const b of el.querySelectorAll(`.opt[data-q="${i}"]`)) b.setAttribute("aria-pressed", String(b === o));
        return;
      }
      const a = e.target.closest("[data-ask]")?.dataset.ask;
      if (a === "send") send();
      if (a === "skip") finish(questions.map(() => null));
    };
    const onInput = (e) => {
      const i = Number(e.target.dataset.q);
      if (Number.isNaN(i)) return;
      picked[i] = e.target.value;
      for (const b of el.querySelectorAll(`.opt[data-q="${i}"]`)) b.setAttribute("aria-pressed", String(b.textContent === e.target.value));
    };
    const onKey = (e) => {
      if (e.key === "Enter" && e.target.classList.contains("qa")) { e.preventDefault(); send(); }
    };
    el.addEventListener("click", onClick);
    el.addEventListener("input", onInput);
    el.addEventListener("keydown", onKey);
  });
}
