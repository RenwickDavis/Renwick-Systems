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
Still the owner's hand in the dashboard: the custom domain `www.renwicksystems.com` (Worker -> Domains & Routes); a redirect
from `renwicksystems.net` to the .com (the .net zone needs one proxied record and a redirect rule); Web Analytics on the
zone (Analytics -> Web analytics -> add `renwicksystems.com`: with the zone proxied, no script tag is needed); Email Routing on
the zone (Email -> Email Routing -> enable, route `hello@renwicksystems.com` to the owner's mailbox; the MX records are
Cloudflare's).

## The form -> HubSpot (free CRM, portal 247736001)
HubSpot -> Marketing -> Forms -> Create -> Embedded form, named "Renwick Systems - start". Five fields, in this order, mapped to
these properties: First name (`firstname`), Company name (`company`), Email (`email`), Message (`message`, single-line or
multi-line text), and a drop-down mapped to a CONTACT property `offer` (create it with the same five values as the DEAL
property `offer`: discovery_week, prototype, pilot_60_days, operate - plus facility_pilot). Then either paste HubSpot's embed
code in place of the `<form>` in `index.html`, or keep the page's form and post it to the Forms API endpoint HubSpot shows
for that form. Every submission is a CONTACT; Monday's `/pipeline` turns each new contact into a Lead deal with `offer` set
(the intake step), and the follow-up is DRAFTED, never sent.

## Google Search, when the page is live (a small budget; the owner's account)
One campaign, exact and phrase match, Ohio and neighbouring states first, landing on this page:
"custom ai development small business", "ai application development company", "ai consultant for small business",
"build an ai app for my business", "ai developer for hire", "neurosymbolic ai", "ai automation for clinics",
"ai software for construction company". Negatives: "free", "course", "jobs", "salary", "tutorial", "chatgpt plugin".

## Before any ad runs
The USPTO and Ohio name checks are done (the owner, 2026-10-19). Still to come: the entity filing (the footer says
"Renwick Systems, Ohio"; add the LLC suffix when it exists), the services agreement and statement of work (counsel), the
LinkedIn profile rewritten to this page's first sentence.
