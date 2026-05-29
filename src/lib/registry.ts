const REGISTRY_BASE = "https://turtiesocks.github.io/ridiculous/r"

/**
 * Canonical shadcn-registry URL for a component, e.g.
 * `registryUrl("color-picker")` →
 * `https://turtiesocks.github.io/ridiculous/r/color-picker.json`.
 *
 * Pure string helper — pass the result to `<InstallCta args={`add ${url}`} />`.
 */
export function registryUrl(name: string): string {
  return `${REGISTRY_BASE}/${name}.json`
}
