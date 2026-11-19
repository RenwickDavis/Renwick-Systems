# Renwick Systems work schedule

## Active State

- **As of** 2026-11-19 ET. Branch `dev`, based on `6178194`. The local milestone is the commit containing this entry.
- **Completed** Project Legacy case study, AI workflow automation service page, homepage and Discovery week links, canonical URLs, sitemap, and robots directive.
- **Verification** 24 of 24 checks passed (6 HTTP/SEO, 9 browser, 3 link/API, 3 invoice edge cases, 3 JavaScript syntax). Wrangler dry build passed. The link audit covered 17 distinct targets.
- **Live routes at audit** `/` and `/privacy` returned 200. Cloudflare served `/robots.txt` without a sitemap directive. The case study, service page, and `/sitemap.xml` returned 404.
- **Open hold** Production deployment. Both new pages, the sitemap, and the updated robots directive were verified on local Wrangler.
- **Next decision** Approve a push to `origin/dev`. After deployment, check the live routes and robots directive, submit `/sitemap.xml` in Google Search Console, and inspect both new page URLs.
