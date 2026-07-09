import type { Config } from "tailwindcss";

/**
 * Mirror of the TDF-SYS-01 token system declared in app/globals.css.
 * Loaded by Tailwind v4 via `@config` — the CSS custom properties in
 * globals.css remain the single source of truth; everything here
 * references them.
 */
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        tdf: {
          "000": "var(--tdf-000)",
          "025": "var(--tdf-025)",
          "050": "var(--tdf-050)",
          "100": "var(--tdf-100)",
          "200": "var(--tdf-200)",
          "300": "var(--tdf-300)",
          "400": "var(--tdf-400)",
          "500": "var(--tdf-500)",
          "600": "var(--tdf-600)",
          "700": "var(--tdf-700)",
          "800": "var(--tdf-800)",
          "900": "var(--tdf-900)",
          "950": "var(--tdf-950)",
        },
        blueprint: {
          DEFAULT: "var(--accent)",
          surface: "var(--accent-surface)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        line: "var(--line)",
        raised: "var(--bg-raised)",
        sunken: "var(--bg-sunken)",
      },
      borderRadius: {
        chip: "var(--r-chip)",
        input: "var(--r-input)",
        card: "var(--r-card)",
        panel: "var(--r-panel)",
        band: "var(--r-band)",
      },
      boxShadow: {
        e1: "var(--e-1)",
        e2: "var(--e-2)",
        e3: "var(--e-3)",
        e4: "var(--e-4)",
      },
      transitionDuration: {
        "120": "var(--d-1)",
        "180": "var(--d-2)",
        "260": "var(--d-3)",
        "420": "var(--d-4)",
      },
      transitionTimingFunction: {
        tdf: "var(--ease)",
      },
      fontFamily: {
        display: "var(--font-newsreader)",
        sans: "var(--font-inter)",
        mono: "var(--font-jetbrains)",
      },
      maxWidth: {
        container: "var(--container)",
      },
    },
  },
};

export default config;
