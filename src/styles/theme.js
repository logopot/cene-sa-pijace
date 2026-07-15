// Canonical design-token source. Consumed via styled-components' ThemeProvider
// (props.theme) in .styled.js files, and imported directly as a plain object
// in non-styled files (e.g. Recharts prop values) that have no theme context.
export const theme = {
  colors: {
    primaryGreen: "#1f6f43",
    primaryHover: "#17512f",
    primaryTint: "#d8f0e0",
    primaryTintLight: "#5b956e",
    iconBg: "#e6f2ea",
    disabledBg: "#c8d6cd",
    surface: "#ffffff",
    bg: "#f8fafc",
    textDark: "#212529",
    textSecondary: "#495057",
    textMuted: "#6c757d",
    border: "#dee2e6",
    borderLight: "#f1f3f5",
    danger: "#c0392b",
    dangerTint: "#fbe4e1",
    jkpBlue: "#2563eb",
    jkpBlueTint: "#dbeafe",
    tertiary: "#b45309",
    tertiaryTint: "#fef3c7",
    leafOrange: "#e75a24",
    chartGuide: "#cbd5e1",
    titleDark: "#0f172a",
    priceAccent: "#16a34a",
    glyphMuted: "rgba(15, 23, 42, 0.16)",
    glassBg: "rgba(255, 255, 255, 0.8)",
    glassBorder: "rgba(255, 255, 255, 0.6)",
    // Ultra-subtle alpha tints for the minimalist trend indicator - lighter
    // than primaryTint/dangerTint (which are solid pastels used for badges
    // with borders), meant to sit behind text with no border at all.
    primaryTintSoft: "rgba(31, 111, 67, 0.08)",
    dangerTintSoft: "rgba(192, 57, 43, 0.08)",
    neutralTintSoft: "rgba(108, 117, 125, 0.08)",
    // Translucent dark blend for a control track sitting on a colored
    // surface (e.g. the header's segmented language switcher).
    trackBg: "rgba(0, 0, 0, 0.16)",
  },
  radius: {
    lg: "16px",
    md: "12px",
    xl: "24px",
    pill: "999px",
  },
  spacing: {
    xxs: "4px",
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "40px",
    xxl: "64px",
  },
  font: {
    // Pairing: 'Plus Jakarta Sans' for headings/branding (character, warmth),
    // 'Inter' for body/data (readability, tabular figures for prices). Both
    // are loaded via the Google Fonts <link> in index.html.
    heading: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  shadow: {
    xs: "0 1px 3px rgba(0, 0, 0, 0.08)",
    sm: "0 2px 8px rgba(0, 0, 0, 0.04)",
    card: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01), 0 20px 25px -5px rgba(0, 0, 0, 0.03)",
    cardHover:
      "0 8px 12px -2px rgba(0, 0, 0, 0.04), 0 4px 8px -2px rgba(0, 0, 0, 0.02), 0 28px 40px -8px rgba(0, 0, 0, 0.06)",
    tooltip:
      "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
  },
  // Pastel mesh gradients for the ProductCard image header, keyed by the
  // same category slug as CATEGORIES/getCategorySlug - `default` is the
  // fallback for any category without a dedicated tone.
  gradients: {
    eggsPoultry:
      "linear-gradient(135deg, #fff7e0 0%, #ffedc2 55%, #fff9ec 100%)",
    meat: "linear-gradient(135deg, #fde8e8 0%, #fbd5d5 55%, #fff5f5 100%)",
    dairy: "linear-gradient(135deg, #eef6ff 0%, #dbeafe 55%, #f7fbff 100%)",
    milk: "linear-gradient(135deg, #f0f7ff 0%, #e0edff 55%, #f8fbff 100%)",
    vegetables:
      "linear-gradient(135deg, #eafbe9 0%, #d3f3d0 55%, #f4fdf3 100%)",
    fruit: "linear-gradient(135deg, #fff1e6 0%, #ffe0c2 55%, #fff8f0 100%)",
    grains: "linear-gradient(135deg, #faf3e0 0%, #f0e2bd 55%, #fdf9ef 100%)",
    default: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 55%, #f8fafc 100%)",
  },
};
