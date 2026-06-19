const REGISTRY_BASE = "https://ridiculous.turtlesocks.dev/r"

/**
 * Canonical shadcn-registry URL for a component, e.g.
 * `registryUrl("color-picker")` →
 * `https://ridiculous.turtlesocks.dev/r/color-picker.json`.
 *
 * Pure string helper — pass the result to `<InstallCta args={`add ${url}`} />`.
 */
export function registryUrl(name: string): string {
  return `${REGISTRY_BASE}/${name}.json`
}
