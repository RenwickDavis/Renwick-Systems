const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-nav");

function setMenuOpen(open) {
  menuToggle.setAttribute("aria-expanded", String(open));
  header.toggleAttribute("data-collapsed", !open);
}

setMenuOpen(false);
menuToggle.hidden = false;
menuToggle.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});
navigation.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || menuToggle.getAttribute("aria-expanded") !== "true") return;

  setMenuOpen(false);
  document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
});
header.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || menuToggle.getAttribute("aria-expanded") !== "true") return;

  setMenuOpen(false);
  menuToggle.focus();
});

const stages = document.querySelector(".stage-selector");
const stageButtons = stages.querySelectorAll("button");

function showStage(selected) {
  for (const button of stageButtons) {
    const active = button === selected;
    button.setAttribute("aria-pressed", String(active));
    document.getElementById(button.getAttribute("aria-controls")).hidden = !active;
  }
}

for (const button of stageButtons) {
  button.addEventListener("click", () => showStage(button));
}
showStage(stageButtons[0]);
stages.hidden = false;

const form = document.querySelector("#start-form");
const offer = form.elements.namedItem("offer");
const status = document.querySelector("#start-status");
const submit = form.querySelector('button[type="submit"]');
const fallbackError = "Your message could not be sent. Please email hello@renwicksystems.com.";

for (const link of document.querySelectorAll("[data-offer]")) {
  link.addEventListener("click", () => {
    offer.value = link.dataset.offer;
  });
}

function showFormStatus(message, error = false) {
  status.textContent = message;
  status.toggleAttribute("data-error", error);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submit.disabled) return;

  submit.disabled = true;
  showFormStatus("Sending…");

  try {
    const response = await fetch(form.action, { method: "POST", body: new FormData(form) });
    const result = await response.json();
    if (response.ok && result.ok) {
      form.reset();
      showFormStatus("Thank you. We received your inquiry and will reply within one working day.");
    } else {
      showFormStatus(result.error || fallbackError, true);
    }
  } catch {
    showFormStatus(fallbackError, true);
  } finally {
    submit.disabled = false;
  }
});

const mail = document.querySelector(".mail");
const mailNote = document.querySelector(".mail-note");

mail.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(mail.getAttribute("href").slice("mailto:".length));
    mailNote.textContent = " (address copied)";
  } catch {
    // The mailto link is still usable when clipboard access is unavailable.
  }
});
