/// <reference types="node" />
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { Component } from "lucide-react"
import { describe, expect, it } from "vitest"
import {
  COMPONENT_ICONS,
  iconForComponent,
} from "@/components/layout/component-icons"

interface RegistryItem {
  name: string
  files?: unknown[]
}

// vitest runs with cwd at the repo root, where registry.json lives.
const registry = JSON.parse(
  readFileSync(resolve(process.cwd(), "registry.json"), "utf8"),
) as { items: RegistryItem[] }

// Real components are the registry items that ship files (excludes meta-bundles
// like "all"). build-nav.mjs uses the same filter to populate the site NAV.
const componentNames = registry.items
  .filter((it) => Array.isArray(it.files) && it.files.length > 0)
  .map((it) => it.name)

describe("component icon map", () => {
  it("maps every registry component to a non-fallback icon", () => {
    for (const name of componentNames) {
      expect(
        COMPONENT_ICONS[name],
        `missing icon mapping for "${name}"`,
      ).toBeDefined()
      expect(
        COMPONENT_ICONS[name],
        `"${name}" should have a dedicated icon, not the fallback`,
      ).not.toBe(Component)
    }
  })

  it("resolves a mapped name to its icon", () => {
    expect(iconForComponent("color-picker")).toBe(
      COMPONENT_ICONS["color-picker"],
    )
  })

  it("falls back to the Component icon for an unknown name", () => {
    expect(iconForComponent("does-not-exist")).toBe(Component)
  })
})
