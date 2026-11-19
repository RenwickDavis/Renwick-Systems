const approvalThreshold = 100_000;
const invoiceScenarios = new Map([
  ["missing", { total: 124_000, lineItems: [94_000, 30_000], approval: null }],
  ["approved", { total: 124_000, lineItems: [94_000, 30_000], approval: { role: "manager", status: "approved" } }],
  ["under", { total: 96_000, lineItems: [66_000, 30_000], approval: null }],
]);
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const money = (cents) => currency.format(cents / 100);

function invoiceTrace({ total, lineItems, approval }) {
  const requiresApproval = total > approvalThreshold;
  const approved = approval?.role === "manager" && approval.status === "approved";
  const decision = requiresApproval && !approved ? "Hold payment" : "Eligible for release";

  // Reconstruct the amount from line items and evaluate the policy on that amount.
  const verifiedTotal = lineItems.reduce((sum, amount) => sum + amount, 0);
  const confirmedApproval = approval?.status === "approved" && approval.role === "manager";
  const verifiedDecision = verifiedTotal <= approvalThreshold || confirmedApproval
    ? "Eligible for release"
    : "Hold payment";
  const agrees = total === verifiedTotal && decision === verifiedDecision;
  const comparison = total > approvalThreshold ? ">" : total === approvalThreshold ? "=" : "<";

  let explanation = `${money(verifiedTotal)} is at or below the approval threshold.`;
  if (!agrees) {
    explanation = "The independent check disagreed. Route this invoice for review.";
  } else if (verifiedDecision === "Hold payment") {
    explanation = `Manager approval is required for ${money(verifiedTotal)}.`;
  } else if (verifiedTotal > approvalThreshold) {
    explanation = `Manager approval is on file for ${money(verifiedTotal)}.`;
  }

  return {
    total: money(total),
    approval: approved ? "Manager approval on file" : "No manager approval on file",
    comparison: `${money(total)} ${comparison} ${money(approvalThreshold)}`,
    approvalCheck: requiresApproval ? (approved ? "Required and recorded" : "Required and missing") : "Approval optional",
    decision,
    lineItems: lineItems.map(money).join(" + "),
    verifiedTotal: money(verifiedTotal),
    verifiedDecision: agrees ? verifiedDecision : "Withhold decision",
    explanation,
  };
}

const invoiceDemo = document.querySelector("[data-invoice-demo]");
const invoiceScenario = invoiceDemo.querySelector(".demo-scenario");
const scenarioSelect = invoiceScenario.querySelector("select");
const traceValues = invoiceDemo.querySelectorAll("[data-invoice-value]");

function showScenario() {
  const values = invoiceTrace(invoiceScenarios.get(scenarioSelect.value));
  for (const element of traceValues) {
    element.textContent = values[element.dataset.invoiceValue];
  }
}

scenarioSelect.addEventListener("change", showScenario);
showScenario();
invoiceScenario.hidden = false;
