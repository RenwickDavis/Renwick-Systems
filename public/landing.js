function initNavigation() {
  const header = document.querySelector(".site-header");
  const menuToggle = header.querySelector(".menu-toggle");
  const navigation = header.querySelector("#site-nav");
  const menuOpen = () => menuToggle.getAttribute("aria-expanded") === "true";

  function setMenuOpen(open) {
    menuToggle.setAttribute("aria-expanded", String(open));
    header.toggleAttribute("data-collapsed", !open);
  }

  setMenuOpen(false);
  menuToggle.hidden = false;
  menuToggle.addEventListener("click", () => setMenuOpen(!menuOpen()));
  navigation.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !menuOpen()) return;

    setMenuOpen(false);
    if (link.getAttribute("href").startsWith("#")) {
      document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
    }
  });
  header.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !menuOpen()) return;

    setMenuOpen(false);
    menuToggle.focus();
  });
}

function initStages() {
  const selector = document.querySelector(".stage-selector");
  if (!selector) return;

  const buttons = selector.querySelectorAll("button");
  function showStage(selected) {
    for (const button of buttons) {
      const active = button === selected;
      button.setAttribute("aria-pressed", String(active));
      document.getElementById(button.getAttribute("aria-controls")).hidden = !active;
    }
  }

  for (const button of buttons) {
    button.addEventListener("click", () => showStage(button));
  }
  showStage(buttons[0]);
  selector.hidden = false;
}

function initInquiry() {
  const form = document.querySelector("#start-form");
  if (!form) return;

  const offer = form.elements.namedItem("offer");
  const status = document.querySelector("#start-status");
  const submit = form.querySelector('button[type="submit"]');
  const fallbackError = "Your message could not be sent. Please email hello@renwicksystems.com.";
  const url = new URL(window.location.href);
  const [fragment, fragmentQuery] = url.hash.slice(1).split("?", 2);
  const fragmentOffer = fragment === "start" ? new URLSearchParams(fragmentQuery).get("offer") : null;
  const requestedOffer = url.searchParams.get("offer") ?? fragmentOffer;

  if (Array.from(offer.options).some((option) => option.value === requestedOffer)) {
    offer.value = requestedOffer;
  }

  // Support shared links that put the offer after #start as well as standard query links.
  if (fragment === "start" && fragmentQuery !== undefined) {
    if (offer.value === requestedOffer) url.searchParams.set("offer", requestedOffer);
    url.hash = "start";
    history.replaceState(history.state, "", url);
    const start = document.getElementById("start");
    start.focus({ preventScroll: true });
    start.scrollIntoView({ behavior: "instant" });
  }

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
}

initNavigation();
initStages();
initInquiry();
