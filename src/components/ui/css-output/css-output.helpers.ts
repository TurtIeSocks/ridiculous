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
