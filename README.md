# cenesapijace.org — Independent Green Market Portal

An independent green market portal providing a fast, clear, and visually optimized overview of agricultural product price trends across green markets in Serbia. The project automatically collects, normalizes, and aggregates data from official sources (STIPS and local utility companies), offering users transparent market insights.

---

## 🚀 Tech Stack

- **Frontend:** React SPA (Single Page Application), Vite, styled-components, react-i18next (sr/en)
- **Hosting & Infrastructure:** Cloudflare Pages
- **Edge Computing:** Cloudflare Pages Middleware (`HTMLRewriter` API)
- **SEO & Meta Tags:** Client-side routing metadata library + server-side Edge middleware for web crawlers
- **Automated Graphics Generation:** Canvas-less HTML-to-SVG engine + fast Rust-based SVG-to-PNG compiler (Node.js build scripts)
- **Animations:** Declarative animation library for React

---

## 🛠️ Features & Changelog

### 1. UI/UX Redesign & Aesthetics

- **Minimalist Footer:** Overhauled the lower section of the site. Removed the redundant exploration columns and unified the remaining legal disclaimer links with modern hover effects and clean typography, completely eliminating default underlines.
- **Branding & Animated Logo:** Integrated a custom SVG logo component featuring subtle entry animations as an icon-only credit link (no text label), delivering a sharper, completely clutter-free visual identity.
- **Modernized 404 Page:** Improved spacing, established consistent border-radii across all interactive elements, and deployed a high-contrast, clean redirection CTA button.
- **Data Consistency & Noise Reduction:** Temporarily removed incomplete market opening hours and unverified physical addresses from the UI to keep the layout polished where upstream data sources are missing entries.

### 2. Data Optimization & Core Logic

- **Asynchronous Date Handling:** Fixed an aggregation bug that used a rigid maximum date filter, which previously caused locations with older data timestamps to drop off the UI entirely. Each market now resolves its own latest available reporting week completely independently.
- **Data Sanitization:** Resolved trailing-whitespace parsing issues originating from the raw data source that were causing duplicated product/category entries and breaking client-side UI filters.
- **Data Range Normalization:** Implemented custom averaging logic that translates variable minimum/maximum price ranges from regional reports into a single comparable value, enabling direct logical comparisons against the fixed prices reported by local public utility companies.

### 3. Advanced Edge SEO & Dynamic Open Graph (OG) Pipeline

- **Cloudflare Edge Middleware:** Because the application operates as a React SPA, a specialized Edge middleware layer intercepts every incoming request. Using an HTML rewriting API, meta tags are injected directly at the edge in constant time using a single manifest lookup per request, giving crawlers accurate previews without the overhead of a full SSR architecture.
- **Pre-compiled Route Manifest:** A generation script executes during the build phase, reads the live price architecture, and writes a flat route-to-metadata manifest. The middleware exclusively performs an inline object lookup against this file, entirely eliminating network overhead or external API calls at request time.
- **Build-Time Automated Image Generation:** A dedicated image compilation script automatically generates high-resolution Open Graph `.png` cards for every single city, market, and product route (covering over 300 unique variants), along with a global sitewide fallback. It converts HTML/CSS layouts into vector data and rasterizes them directly to PNG before the project compiles.
- **SPA Fallback Routing:** Implemented fallback routing rules so that deep-linked client-side paths resolve correctly on the hosting platform instead of returning server-side errors before the application boots.
- **Smart Link Sharing Hierarchy (Viber, WhatsApp, Facebook):**
  - **Product Page:** The generated preview card headlines the specific product name alongside a country-wide context subtitle.
  - **City Page:** Displays a master title with a dynamic subtitle formatted explicitly to highlight the selected city and its local market context.
  - **Market Page:** Automatically resolves and prints both location nodes, gracefully mapping the city name alongside the specific local marketplace name.
- **Terminology & Copywriting Update:** Removed misleading terms implying real-time updates since data entry depends on periodic external reporting schedules, and phased out historical "barometer" phrasing. The entire platform now consistently utilizes **Nezavisni pijačni portal** (Independent Market Portal) and **Aktuelne cene** (Up-to-date Prices).

---

## 🛠️ Configuration & Environment Requirements

The application relies on external data integration using two distinct access levels, requiring configuration in your deployment pipeline:

### 1. Sheet Identifiers

The browser no longer talks to Google Sheets. The build reads the sheet (see Data Pipeline below), so `VITE_GOOGLE_SHEETS_SPREADSHEET_ID`, `VITE_GOOGLE_SHEETS_SHEET_NAME` and `VITE_GOOGLE_SHEETS_JKP_SHEET_NAME` are needed at build time only; `VITE_GOOGLE_SHEETS_API_KEY` is no longer used.

### 2. Build-Time Automation Credentials

Because referrer-restricted public tokens reject automated scripts running in non-browser Node.js environments, the build pipeline authenticates independently:

- **Service Account Credentials:** The complete JSON payload of a secure service account role with explicit read-only access to the source database sheets.

> ⚠️ **Deployment Guardrails:** Make sure all of the above credentials are added to **both** the Production and Preview environment variable secret tables within your hosting provider's dashboard. This ensures automated previews and staging branches build cleanly without failing on pull requests. For local workflows, build scripts safely fall back to a gitignored local credential file if available.

---

## 💻 Local Development Workflow

1. **Install Dependencies:**

   bash
   npm install

2. **Environment Configuration:**
   Copy the provided local environment template file to your active local configuration file and input the necessary public data keys and source identifiers described above.

3. **Launch Development Server:**

   bash
   npm run dev

4. **Compile Production Build:**
   Triggers the compilation suite, which automatically executes the prebuild scripts to generate the updated SEO manifests and Open Graph images before building the optimized frontend bundle.

   bash
   npm run build

5. **Code Quality & Linting:**

   bash
   npm run lint

---

## 📦 Data Pipeline

Google Sheets (filled by the STIPS and JKP scrapers) stays the single source of truth. `npm run generate:data` (run automatically by `prebuild`) reads it with the service account and writes static files; values are never altered, only filtered/grouped:

- `public/data/latest.json` - the two most recent datapoints per product/market/source (homepage, city, market and category pages).
- `public/data/products/{family}.json` - full history of one product family, lazy-loaded by the product page's chart.
- `public/data/meta.json` - data version and generation time.
- `public/snap/**/*.html` - per-route HTML snapshots; `functions/_middleware.js` injects them into `#snapshot` so crawlers and no-JS visitors see real prices. The React app removes the container once it has rendered the same content.

**Refreshing data:** run the "Weekly Market Scrape to Sheets" workflow manually (Actions -> Run workflow) or wait for the Monday schedule; its last step calls the Cloudflare Pages deploy hook (secret `CLOUDFLARE_DEPLOY_HOOK`), which rebuilds the site with the new data. Locally: `npm run generate:data`.

## 📈 GA4 događaji

All events go through `src/utils/analytics.js` (string parameters trimmed and lowercased, empty ones dropped, no personal data). The gtag snippet in `index.html` is configured with `send_page_view: false`: the single `page_view` of every page comes from `src/utils/pageView.js`.

| Događaj | Kada okida | Parametri | Ključni događaj |
|---|---|---|---|
| `page_view` | once after the first load and after every route change, **after** the page has set its `document.title` and canonical (waits for the `<head>` to settle, max 3 s; never twice for the same URL) | `page_title`, `page_location`, `page_path` (sent as they are, not lowercased) | ne |
| `view_product` | once per visit of a product page, when its data is loaded | `product_name`, `market`, `market_name`, `city`, `category` | ne |
| `view_price_history` | NOT automatic: first hover/tap/click on the price-history chart or on its variety tabs, at most once per product page visit | same as `view_product` | ne |
| `view_market` | market page opened | `market_name`, `city` | ne |
| `click_source_link` | click on the link to the official source on a product page (only STIPS and JKP Beogradske pijace have a link); sent with `transport_type: beacon` | `source` (`stips` / `jkp`), `page_type`, `product_name` | ne |
| `search_submit` | search button clicked | `city`, `category`, `market` | **da** |
| `filter_city` | user picks a city | `city` | ne |
| `filter_category` | user picks a category (`all` = every category) | `category` | ne |
| `filter_market` | user picks a market (`all` = every market) | `market` | ne |
| `language_switch` | language switched | `from`, `to` | ne |
| `feedback_open` | suggestions form opened | `from_page_type` (`home`, `city`, `market`, `category`, `product`, `other`; never the path) | ne |
| `feedback_submit` | suggestions form sent successfully (nothing the visitor wrote is ever sent) | - | **da** |

`page_type` in `click_source_link` uses the same values as `from_page_type`. Scroll depth comes from GA4 Enhanced Measurement.

**Debug.** Open any page with `?ga_debug=1`: for the rest of that browser session every event carries `debug_mode: true` and shows up in GA4 -> Admin -> DebugView. Without the parameter nothing changes.

**Manual settings in GA4** (cannot be done from the code):
1. Admin -> Data streams -> the web stream -> Enhanced measurement -> gear icon -> turn **off** "Page changes based on browser history events". The app sends its own `page_view` after each route change; with this option on, GA4 would add a second one at the moment of the URL change, carrying the previous page's title.
2. Admin -> Events: mark only `search_submit` and `feedback_submit` as key events (turn off the key-event flag on anything else, e.g. `view_product`, `view_price_history`).
3. If you want `market`, `market_name`, `city`, `category`, `product_name`, `source`, `page_type`, `from_page_type` in reports: Admin -> Custom definitions -> create event-scoped custom dimensions with those parameter names.

## 💬 Feedback forma: podešavanje

The suggestions/comments form (`/predlozi` in Serbian, `/feedback` in English; linked only from the footer) writes each message as a new row into a `Feedback` tab of the **same Google file** that holds the prices. It is not a price-error report: prices come from the official sources and the site never changes them. Messages are never shown publicly. The page is `noindex`, left out of `sitemap.xml`, has no hreflang, and `robots.txt` disallows `/api/`.

Parts: `src/pages/Feedback` (form), `src/utils/feedbackRules.js` (validation shared by browser and server), `functions/api/feedback.js` + `functions/lib/feedback.js` (endpoint `POST /api/feedback`, Workers runtime, JWT signed with WebCrypto, no Node packages).

### Manual steps (once)

1. **Tab.** In the spreadsheet add a tab named `Feedback` (or pick another name and set `FEEDBACK_SHEET_NAME`) and put this header in row 1:

   | A | B | C | D | E | F |
   |---|---|---|---|---|---|
   | Datum | Ime | Poruka | Strana | Jezik | Status |

   `Datum` is ISO UTC set by the server, `Strana` is the pathname of the page the visitor was on before opening the form (kept in `sessionStorage` by `src/utils/lastRoute.js`, sent as `page`; empty after a direct visit; never from `document.referrer`), `Jezik` is `sr`/`en`, `Status` starts as `novo`. No IP address and no User-Agent are stored.
2. **Service account.** Use a service account whose key you can paste as JSON. It must be **Editor** on the spreadsheet file (needed to append rows). Because Editor access covers the whole file, **protect the price tabs** (Data -> Protect sheets and ranges -> only the scrapers' account may edit), so the form's account can write only to `Feedback`. The scope used is `https://www.googleapis.com/auth/spreadsheets`. Using a separate account from the scrapers is recommended.
3. **Turnstile.** In the Cloudflare dashboard create a Turnstile widget for `cenesapijace.org` (managed mode). You get a site key (public) and a secret key.
4. **Environment variables** (Cloudflare Pages -> the project -> Settings -> Variables and Secrets; set them for Production, and for Preview if you test there). Values are never written to the repo:

   | Name | Type | Where it is used | Notes |
   |---|---|---|---|
   | `FEEDBACK_SERVICE_ACCOUNT_JSON` | Secret | Functions (runtime) | full service-account key JSON |
   | `FEEDBACK_SPREADSHEET_ID` | Text | Functions (runtime) | id of the price spreadsheet |
   | `FEEDBACK_SHEET_NAME` | Text, optional | Functions (runtime) | default `Feedback` |
   | `TURNSTILE_SECRET_KEY` | Secret | Functions (runtime) | Turnstile secret |
   | `ALLOW_PREVIEW_ORIGINS` | Text, optional | Functions (runtime) | `true` also accepts `https://*.pages.dev` (for preview deployments); leave unset in production |
   | `VITE_TURNSTILE_SITE_KEY` | Text | **build time** (browser bundle) | public site key; must exist when the site is built, so redeploy after setting it |

   The `FEEDBACK_*`/`TURNSTILE_*`/`ALLOW_*` variables are read by the Functions at request time from `context.env`; `VITE_TURNSTILE_SITE_KEY` is baked into the bundle at build time. Locally `.env.example` lists the build-time name; Cloudflare's test keys (site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`) always pass and are meant for development.
5. **Redeploy** so the new build picks up `VITE_TURNSTILE_SITE_KEY`, then send one test message from the live site and check that a row appeared in `Feedback`.

### What the endpoint does

Only `POST` (others 405), JSON up to 4 KB, `Origin`/`Referer` must be `https://cenesapijace.org`. It validates again on the server (name <= 60, message 5-1000, language `sr`/`en`, path rule), strips control characters, drops a filled honeypot silently (200, no write), verifies the Turnstile token with the visitor's `CF-Connecting-IP`, and appends the row (`valueInputOption=RAW`, `insertDataOption=INSERT_ROWS`). A name or message starting with `=`, `+`, `-` or `@` gets a leading apostrophe so Sheets cannot run it as a formula. Responses are generic (`200 {ok:true}` / 400 / 403 / 413 / 415 / 429 / 500); a 500 carries only the failed `phase` and `upstream` status (see below), errors from Google are never returned, and logs carry only those two values, never names or messages. A small in-memory limit (5 posts per 10 minutes per address, per Worker instance) adds a best-effort 429.

### When the form answers 500: reading the phase

Every 5xx answer of `POST /api/feedback` says where it failed, e.g. `{"ok":false,"error":"server_error","phase":"sheets_append","upstream":403}` (browser DevTools -> Network -> `feedback` -> Response; the same two values are logged by the Function as `feedback: phase=... upstream=...`, see Pages -> Functions -> Real-time logs). `upstream` is only the HTTP status of the Google/Cloudflare service that answered, or `null` when there was no answer (network error) or the step is local. Nothing else is ever returned or logged: no error text from a service, no token, no key, no name or message.

| `phase` | What failed | Typical `upstream` and what to check |
|---|---|---|
| `config` | a variable is missing or unusable; the answer adds `"var":"<NAME>"` (the name, never the value) | `null`. Set the named variable for the right environment (Production vs Preview) and redeploy. For `FEEDBACK_SERVICE_ACCOUNT_JSON`: it must hold the key file's JSON (pasted as text, as a "JSON" variable, or base64 of the file) with `client_email` and `private_key` |
| `turnstile_fetch` | the request to Cloudflare's `siteverify` failed | `null` network problem, or the HTTP status Cloudflare returned |
| `auth_parse_key` | `private_key` is not a readable PEM | `null`. The key was cut, or edited when pasted |
| `auth_import_key` | WebCrypto refused the key | `null`. It is not a PKCS#8 RSA private key (use the key from the JSON file Google generated) |
| `auth_sign` | WebCrypto could not sign the token request | `null` |
| `auth_token` | Google's token endpoint did not give a token | `400` invalid key/clock, `401`/`403` account disabled or key deleted, `null` network |
| `sheets_append` | the append to the sheet failed | `403` the account is not Editor on the file (or the Sheets API is not enabled in its project), `404` wrong `FEEDBACK_SPREADSHEET_ID`, `400` the tab name does not exist (check `FEEDBACK_SHEET_NAME`), `429` quota |

For local development the endpoint can be pointed at mocks with `FEEDBACK_SHEETS_API_BASE` and `FEEDBACK_TURNSTILE_VERIFY_URL` (and a `token_uri` in a throw-away test key); leave them unset in production. `wrangler pages dev dist` reads such values from a git-ignored `.dev.vars` file.

### Tests

`npm test` runs `tests/*.test.mjs` with Node's built-in runner: validation rules, endpoint (405, Origin, Turnstile, honeypot, Sheets request body and column order, JWT signature and caching) against mocks, the 5xx phases, a simulation of the Workers runtime without `Buffer`/`process`, and the route/sitemap rules. Nothing there touches Google or Cloudflare.
