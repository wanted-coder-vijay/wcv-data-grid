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
export type DataTableTokens = {
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

/**
 * A theme passed to `<DataTable theme={…}>`.
 *
 * Two accepted shapes:
 *
 * 1. A flat token map (`DataTableTokens`) — applied as-is, no dark variant.
 * 2. A moded map (`DataTableModedTheme`) — `light` is applied by default,
 *    `dark` is swapped in automatically inside `@media (prefers-color-scheme: dark)`
 *    *and* inside any `.dark` ancestor.
 */
export type DataTableModedTheme = {
  light?: DataTableTokens
  dark?: DataTableTokens
}

export type DataTableTheme = DataTableTokens | DataTableModedTheme

const TOKEN_TO_VAR: Record<keyof DataTableTokens, string> = {
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

function isModed(theme: DataTableTheme | undefined): theme is DataTableModedTheme {
  if (!theme) return false
  return "light" in theme || "dark" in theme
}

/** Convert a DataTableTokens map into a CSS `style` object. */
export function tokensToStyle(tokens?: DataTableTokens): CSSProperties {
  if (!tokens) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(tokens)) {
    if (v == null) continue
    const cssVar = TOKEN_TO_VAR[k as keyof DataTableTokens]
    if (cssVar) out[cssVar] = v
  }
  return out as CSSProperties
}

/**
 * Back-compat: original API accepted a flat `DataTableTheme`. Still works,
 * but if a moded theme is passed it returns the `light` variant only — use
 * `splitTheme` if you need both variants.
 */
export function themeToStyle(theme?: DataTableTheme): CSSProperties {
  if (!theme) return {}
  if (isModed(theme)) return tokensToStyle(theme.light)
  return tokensToStyle(theme as DataTableTokens)
}

/**
 * Split a theme into its `light` (always applied) and optional `dark` (applied
 * via `@media (prefers-color-scheme: dark)` and `.dark` ancestor) variants.
 *
 * For flat themes, returns `{ light: theme, dark: undefined }`.
 */
export function splitTheme(theme?: DataTableTheme): {
  light: DataTableTokens | undefined
  dark: DataTableTokens | undefined
} {
  if (!theme) return { light: undefined, dark: undefined }
  if (isModed(theme)) return { light: theme.light, dark: theme.dark }
  return { light: theme as DataTableTokens, dark: undefined }
}

// ---------------------------------------------------------------------------
// Preset builder
// ---------------------------------------------------------------------------

/**
 * Build a full light+dark token set from a single OKLCH hue.
 *
 * @param hue    Hue angle 0–360 (e.g. 285 for violet, 162 for emerald).
 * @param chroma Optional base chroma for tinted neutrals (default 0.03).
 */
export function buildPreset(hue: number, chroma = 0.03): DataTableModedTheme {
  const c = chroma
  // The destructive hue stays in the red band but is nudged a little toward
  // the preset's hue so it sits in the same visual family without losing the
  // universal "this is dangerous" red signal. Distance from rose (~15°) is
  // small for warm presets and larger for cool ones — clamped.
  const destH = blendTowardRed(hue)
  return {
    light: {
      background: `oklch(0.99 ${c * 0.2} ${hue})`,
      foreground: `oklch(0.18 ${c * 1.2} ${hue})`,
      card: `oklch(1 0 0)`,
      cardForeground: `oklch(0.18 ${c * 1.2} ${hue})`,
      popover: `oklch(1 0 0)`,
      popoverForeground: `oklch(0.18 ${c * 1.2} ${hue})`,
      primary: `oklch(0.55 0.2 ${hue})`,
      primaryForeground: `oklch(0.99 0 0)`,
      secondary: `oklch(0.96 ${c} ${hue})`,
      secondaryForeground: `oklch(0.25 ${c * 2} ${hue})`,
      muted: `oklch(0.96 ${c} ${hue})`,
      mutedForeground: `oklch(0.5 ${c * 1.5} ${hue})`,
      accent: `oklch(0.94 ${c * 1.2} ${hue})`,
      accentForeground: `oklch(0.3 ${c * 3} ${hue})`,
      destructive: `oklch(0.577 0.22 ${destH})`,
      destructiveForeground: `oklch(0.985 0 0)`,
      border: `oklch(0.9 ${c * 0.8} ${hue})`,
      input: `oklch(0.9 ${c * 0.8} ${hue})`,
      ring: `oklch(0.55 0.2 ${hue} / 0.5)`,
      radius: "0.625rem",
    },
    dark: {
      background: `oklch(0.16 ${c * 0.6} ${hue})`,
      foreground: `oklch(0.97 ${c * 0.2} ${hue})`,
      card: `oklch(0.21 ${c * 0.8} ${hue})`,
      cardForeground: `oklch(0.97 ${c * 0.2} ${hue})`,
      popover: `oklch(0.21 ${c * 0.8} ${hue})`,
      popoverForeground: `oklch(0.97 ${c * 0.2} ${hue})`,
      primary: `oklch(0.7 0.18 ${hue})`,
      primaryForeground: `oklch(0.16 ${c * 0.6} ${hue})`,
      secondary: `oklch(0.27 ${c * 0.8} ${hue})`,
      secondaryForeground: `oklch(0.97 ${c * 0.2} ${hue})`,
      muted: `oklch(0.27 ${c * 0.8} ${hue})`,
      mutedForeground: `oklch(0.7 ${c * 0.5} ${hue})`,
      accent: `oklch(0.3 ${c * 1.5} ${hue})`,
      accentForeground: `oklch(0.97 ${c * 0.2} ${hue})`,
      destructive: `oklch(0.65 0.22 ${destH})`,
      destructiveForeground: `oklch(0.985 0 0)`,
      border: `oklch(0.27 ${c * 0.8} ${hue})`,
      input: `oklch(0.27 ${c * 0.8} ${hue})`,
      ring: `oklch(0.7 0.18 ${hue} / 0.5)`,
      radius: "0.625rem",
    },
  }
}

/** Pull a hue gently toward the red band so destructive stays unmistakably "red-ish". */
function blendTowardRed(hue: number): number {
  const red = 25
  // Wrap-aware shortest-path blend with weight 0.7 toward red.
  let delta = ((hue - red + 540) % 360) - 180
  return (red + delta * 0.3 + 360) % 360
}

/**
 * Convert a tokens map into a CSS declaration string (no selector, no braces),
 * e.g. `--background:oklch(1 0 0);--foreground:oklch(0.145 0 0)`.
 *
 * Used internally to inject scoped <style> blocks for moded themes.
 */
export function tokensToCssBlock(tokens?: DataTableTokens): string {
  if (!tokens) return ""
  const parts: string[] = []
  for (const [k, v] of Object.entries(tokens)) {
    if (v == null) continue
    const cssVar = TOKEN_TO_VAR[k as keyof DataTableTokens]
    if (cssVar) parts.push(`${cssVar}:${v}`)
  }
  return parts.join(";")
}

/** Pure neutral (grayscale) preset — no hue, no chroma. */
const neutral: DataTableModedTheme = {
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.205 0 0)",
    muted: "oklch(0.97 0 0)",
    mutedForeground: "oklch(0.556 0 0)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    destructiveForeground: "oklch(0.985 0 0)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
    ring: "oklch(0.708 0 0)",
    radius: "0.625rem",
  },
  dark: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    cardForeground: "oklch(0.985 0 0)",
    popover: "oklch(0.205 0 0)",
    popoverForeground: "oklch(0.985 0 0)",
    primary: "oklch(0.985 0 0)",
    primaryForeground: "oklch(0.205 0 0)",
    secondary: "oklch(0.269 0 0)",
    secondaryForeground: "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    mutedForeground: "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    accentForeground: "oklch(0.985 0 0)",
    destructive: "oklch(0.577 0.245 27.325 / 0.6)",
    destructiveForeground: "oklch(0.985 0 0)",
    border: "oklch(0.269 0 0)",
    input: "oklch(0.269 0 0)",
    ring: "oklch(0.439 0 0)",
    radius: "0.625rem",
  },
}

/**
 * Ready-to-use theme presets.
 *
 * Each preset is a full light + dark token set — passing one to
 * `<DataTable theme={…}>` repaints the entire table and auto-flips on OS
 * dark mode (or when a `.dark` ancestor is added).
 *
 * Custom hues:
 *
 * ```ts
 * import { buildPreset } from "@dynostack/react-grid"
 * const tealPreset = buildPreset(180)
 * ```
 */
export const themePresets = {
  neutral,
  light: { light: neutral.light } satisfies DataTableModedTheme,
  dark: { light: neutral.dark } satisfies DataTableModedTheme,
  violet: buildPreset(285),
  emerald: buildPreset(162),
  amber: buildPreset(65),
  rose: buildPreset(15),
  sky: buildPreset(235),
  slate: buildPreset(240, 0.015),
} satisfies Record<string, DataTableModedTheme>

export type DataTableThemeName = keyof typeof themePresets

/**
 * Bundled fallback tokens used when `<DataTable isolate>` is set. These let
 * the grid render correctly even when the consumer hasn't imported
 * `styles.css` or provided any theme of their own.
 */
export const ISOLATE_LIGHT_TOKENS: DataTableTokens = neutral.light!
export const ISOLATE_DARK_TOKENS: DataTableTokens = neutral.dark!

