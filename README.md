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

## 📈 GA4 Events

All events go through `trackEvent` in `src/utils/analytics.js` (values trimmed + lowercased, no personal data):

| Event | Parameters | Fired when |
|---|---|---|
| `filter_city` | `city` | user picks a city |
| `filter_category` | `category` | user picks a category (`all` = every category) |
| `filter_market` | `market` | user picks a market (`all` = every market) |
| `search_submit` | `city`, `category`, `market` | search button clicked |
| `view_market` | `market_name`, `city` | market page opened |
| `view_product` | `product_name`, `category`, `market_name` | product page opened |
| `view_price_history` | `product_name` | history chart shown with data |
| `language_switch` | `from`, `to` | language switched |

Not wired (nothing in the UI to attach them to): `click_source_link` (the source is plain text, no link) and `share_click` (no share control). Scroll depth comes from GA4 Enhanced Measurement.
