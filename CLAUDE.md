# Cene sa pijace - Project Style Guide & Skills

This document defines the strict architectural, design, and data formatting rules for the "Cene sa pijace" React application. Refer to these rules during every refactoring and feature implementation.

## Architecture & Components Rule

- **The Two-File Rule:** Every UI component must be split into exactly two files within the same folder:
  - `ComponentName.jsx` (Functional React logic and JSX structural layout)
  - `ComponentName.styled.js` (All Styled Components and visual styles)
- **Strict Separation:** No inline styles are allowed. No Styled Components definitions inside the `.jsx` file.

## Styling & Design Tokens (Strict Theme Paradigm)

- **Banned Native CSS Variables:** Do NOT use native CSS custom properties via `var()` inside `.styled.js` files (e.g., `var(--radius-lg)` or `var(--color-primary-green)` is strictly forbidden).
- **Mandatory Theme Interpolation:** All design tokens (colors, border-radii, spacing, font weights) must be accessed dynamically from the Styled Components theme provider context object.
  - _Incorrect:_ `border-radius: var(--radius-lg); color: var(--color-primary-green);`
  - _Correct:_ `border-radius: ${({ theme }) => theme.radius.lg}; color: ${({ theme }) => theme.colors.primaryGreen};`
- **Primary Branding Colors (Theme Objects):**
  - Primary Green: `#1f6f43` (`theme.colors.primaryGreen`)
  - Hover/Focus Green: `#17512f` (`theme.colors.primaryHover`)
  - Disabled State: `#c8d6cd` (`theme.colors.disabledBg`) with `cursor: not-allowed`
- **Trend Indicators (Consumer-Centric UX):**
  - **Price Drop (pad):** Green text and downward arrow icon.
  - **Price Hike (rast):** Red text and upward arrow icon.
  - **No Change (bez promene):** Neutral text with a single horizontal dash (`-`) icon.

## Localization (i18n)

- **Zero Hardcoded Strings:** Absolutely NO plain text strings are allowed in the JSX layout. Everything must go through the i18n `t()` function.
- **Dynamic Data Translation:** Repeating string attributes coming from backend databases (STIPS or JKP metadata like trend status, packaging, units) must be wrapped in `t()` to ensure full English support for the expat community.
- **Fallback Content:** If a unique product name (e.g., "Blitva") has no translation, it must gracefully fall back to the original text.

## Data Mapping & Quality Standards

- **Multi-Source Data Ingestion:** Support parallel data timelines using a `Source` field (e.g., "STIPS" and "JKP"). Ensure data parsing aggregates records seamlessly by date for dual-line comparison charts while maintaining a single-line fallback for markets with single-source data.
- **City vs. Market Hierarchy:** Market locations (like "Kalenić" or "Skadarlija") must never be parsed as Cities. They must be mapped as Markets and correctly grouped under the City "Beograd".
- **Text Capitalization:** All dropdown options and categories fetched from the database must be properly capitalized and use correct Serbian Latin characters (e.g., "Zelena pijaca", "Kvantaška pijaca" with proper "š").
- **Smart Metadata Parser:** Floating comments at the bottom of cards must be evaluated:
  - If it's a known country (e.g., albanija), render as: `Zemlja uvoza: [Capitalized]`
  - If it's packaging (e.g., folija), render as: `Dodatno pakovanje: [text]`

## Verification Commands

- Run `npm run lint` to verify code quality.
- Run `npm run build` to ensure the project compiles cleanly before declaring a task complete.
