# Renwick Systems - the site (written 2026-10-19)

The landing page of the AI-development business (its own entity; named 2026-10-19; USPTO and Ohio read free and clear by the
owner; renwicksystems.com + .net registered through Cloudflare the same night). It sits in this repository only until the
entity has its own; nothing in Project Legacy's build, tests or deploy reads this folder.

Two static files: `index.html` (the page: the method, the four packages at the prices of
`docs/SAAS_OFFER_PACKAGES_2026-10-19.md`, Project Legacy as the first case study, the founder, the form) and `privacy.html`.
No framework, no build step, no external script. Light and dark follow the visitor's system.

## Deploy (a Git-connected Cloudflare Worker serving static assets; set up by the owner 2026-10-19)
The Cloudflare project `renwick-systems` (account Renwickdavis.rd@gmail.com, Workers & Pages) is connected to this repository:
production branch `dev`, no build command, deploy command `npx wrangler deploy`, root `/`. Every push to `dev` deploys the
site; `wrangler.jsonc` tells wrangler to serve `public/` as static assets (so the README and the config are never served).
`renwicksystems.com` is a custom domain on the Worker and answers 200.
DONE in the dashboard 2026-10-19 (the owner's yes on each; read back): custom domains `www.renwicksystems.com`,
`renwicksystems.net` and `www.renwicksystems.net` on the Worker; a Single Redirect on the .net zone (".net to
renwicksystems.com": all requests -> `concat("https://renwicksystems.com", http.request.uri.path)`, 301, query string kept);
Web Analytics on `renwicksystems.com` with automatic setup (no script tag); Email Routing on the .com zone (Cloudflare's three
MX + the SPF TXT, destination renwickdavis.rd@gmail.com verified, rule hello@renwicksystems.com -> that mailbox).

## The form -> email (Cloudflare Email Routing, 2026-11-19)
`public/index.html` posts the form to `/api/start`. `src/worker.js` (the Worker's `main`, run first only for `/api/*`;
everything else is the static site) checks the five fields and a hidden spam trap, then sends one plain-text email
through the `send_email` binding `START_MAIL` to the Email Routing destination already verified on the .com zone
(`wrangler.jsonc`: the binding is locked to that address and `START_TO` names it). From: form@renwicksystems.com;
Reply-To: the visitor, so answering the email answers them. The page says whether it went. HubSpot is no longer in the
path; the Monday `/pipeline` intake now starts from these emails. Email links on both pages also copy the address,
because a mailto link does nothing on a machine with no mail app set up.

## Google Search, when the page is live (a small budget; the owner's account)
One campaign, exact and phrase match, Ohio and neighbouring states first, landing on this page:
"custom ai development small business", "ai application development company", "ai consultant for small business",
"build an ai app for my business", "ai developer for hire", "neurosymbolic ai", "ai automation for clinics",
"ai software for construction company". Negatives: "free", "course", "jobs", "salary", "tutorial", "chatgpt plugin".

## Before any ad runs
The USPTO and Ohio name checks are done (the owner, 2026-10-19). Still to come: the entity filing (the footer says
"Renwick Systems, Ohio"; add the LLC suffix when it exists), the services agreement and statement of work (counsel), the
LinkedIn profile rewritten to this page's first sentence.
