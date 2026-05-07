import type { CSSProperties } from "react"

/**
 * CSS variable overrides for a single DataTable instance.
 *
 * The component is built on shadcn/ui's CSS custom properties. By default it
 * inherits whatever is defined on the consumer's :root (e.g. when shadcn is
 * already set up). Pass any of these to override on a specific instance —
 * values are emitted as inline CSS variables on the table root, scoped
 * through CSS cascade to that instance only.
 */
export type DataTableTheme = {
  background?: string
  foreground?: string
  card?: string
  cardForeground?: string
  popover?: string
  popoverForeground?: string
  primary?: string
  primaryForeground?: string
  secondary?: string
  secondaryForeground?: string
  muted?: string
  mutedForeground?: string
  accent?: string
  accentForeground?: string
  destructive?: string
  destructiveForeground?: string
  border?: string
  input?: string
  ring?: string

  /** Border radius (e.g. "0.5rem"). */
  radius?: string
  /** Font family for the table body. */
  fontFamily?: string
}

const TOKEN_TO_VAR: Record<keyof DataTableTheme, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  radius: "--radius",
  fontFamily: "--font-family",
}

/** Convert a DataTableTheme into a `style` object of CSS variables. */
export function themeToStyle(theme?: DataTableTheme): CSSProperties {
  if (!theme) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(theme)) {
    if (v == null) continue
    const cssVar = TOKEN_TO_VAR[k as keyof DataTableTheme]
    if (cssVar) out[cssVar] = v
  }
  return out as CSSProperties
}

/** A handful of ready-to-use theme presets. */
export const themePresets = {
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",
    border: "oklch(0.922 0 0)",
  },
  dark: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    cardForeground: "oklch(0.985 0 0)",
    primary: "oklch(0.985 0 0)",
    primaryForeground: "oklch(0.205 0 0)",
    border: "oklch(0.269 0 0)",
  },
  emerald: {
    primary: "oklch(0.66 0.15 162)",
    primaryForeground: "oklch(1 0 0)",
    accent: "oklch(0.94 0.04 162)",
    accentForeground: "oklch(0.3 0.1 162)",
    ring: "oklch(0.66 0.15 162 / 0.5)",
  },
  violet: {
    primary: "oklch(0.55 0.22 285)",
    primaryForeground: "oklch(1 0 0)",
    accent: "oklch(0.94 0.04 285)",
    accentForeground: "oklch(0.3 0.12 285)",
    ring: "oklch(0.55 0.22 285 / 0.5)",
  },
  amber: {
    primary: "oklch(0.7 0.18 65)",
    primaryForeground: "oklch(0.2 0 0)",
    accent: "oklch(0.94 0.05 65)",
    accentForeground: "oklch(0.3 0.12 65)",
    ring: "oklch(0.7 0.18 65 / 0.5)",
  },
} satisfies Record<string, DataTableTheme>

export type DataTableThemeName = keyof typeof themePresets
