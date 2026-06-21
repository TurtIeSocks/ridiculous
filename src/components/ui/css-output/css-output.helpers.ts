import type { CssToTailwindOptions, TailwindForm } from "./css-output.types"

/**
 * Encode a CSS value for use inside a Tailwind arbitrary value/property.
 * Order matters: collapse comma-space, escape literal underscores, then
 * turn remaining whitespace into underscores. Tailwind un-escapes `\_`
 * back to a literal `_` (including inside url()), so escaping is always safe.
 */
export function encodeArbitraryValue(value: string): string {
  return value
    .trim()
    .replace(/,\s+/g, ",")
    .replace(/_/g, "\\_")
    .replace(/\s+/g, "_")
}

/** property → named utility prefix (color handled separately via colorPrefix). */
const NAMED: Record<string, string> = {
  "box-shadow": "shadow",
  "transition-timing-function": "ease",
  animation: "animate",
  filter: "filter",
  transform: "transform",
  "background-image": "bg",
  "grid-template-columns": "grid-cols",
  "grid-template-rows": "grid-rows",
}

/** property → @theme namespace (the only 4 with a token form). */
const TOKEN_NS: Record<string, string> = {
  color: "color",
  "box-shadow": "shadow",
  "transition-timing-function": "ease",
  animation: "animate",
}

export function cssToTailwind(
  property: string | null | undefined,
  value: string,
  opts: CssToTailwindOptions = {},
): TailwindForm | null {
  if (!property) return null

  const enc = encodeArbitraryValue(value)
  const colorPrefix = opts.colorPrefix ?? "bg"
  const name = opts.name?.trim() || "custom"

  let prefix: string | undefined
  let inline: string
  if (property === "color") {
    prefix = colorPrefix
    inline = `${colorPrefix}-[${enc}]`
  } else if (property in NAMED) {
    prefix = NAMED[property]
    inline = `${prefix}-[${enc}]`
  } else {
    inline = `[${property}:${enc}]` // generic arbitrary-property fallback
  }

  const ns = TOKEN_NS[property]
  if (!ns) return { inline }

  const className =
    property === "color" ? `${colorPrefix}-${name}` : `${prefix}-${name}`
  return {
    inline,
    theme: { atRule: `@theme {\n  --${ns}-${name}: ${value};\n}`, className },
  }
}
