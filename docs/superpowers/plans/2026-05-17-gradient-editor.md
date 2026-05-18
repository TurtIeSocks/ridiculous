# `gradient-editor` v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the gradient-editor — the `ridiculous` registry's second component. Linear / radial / conic gradients, draggable stops, oklch-default interpolation, color-picker reused as a registry dependency. Tier 1 typing (suggestion strings + utility types, no `GradientLiteral<S>`).

**Architecture:** Single polymorphic `<GradientEditor>` with internal state hybrid-pattern (mirrors color-picker). Multi-file barrel: `gradient-editor.tsx` (component + sub-components + parse/format inline), `gradient-editor.types.ts` (suggestion strings + `GradientTypeOf<S>` + `InterpolationOf<S>` + helpers), `index.ts` (barrel). Cross-registry dependency on `color-picker` for per-stop `ColorLiteral<S>` validation via composition. Component file ~900 lines (similar to color-picker's 1000).

**Tech Stack:** React 19, TypeScript 5+, Tailwind v4, Vitest + jsdom (no canvas mock needed — gradient editor uses CSS `background`, not `<canvas>`), Biome, pnpm 9.

**Source of design:** `docs/superpowers/specs/2026-05-17-gradient-editor-design.md`. Read it first.

**Source of patterns:** the existing `src/components/ui/color-picker/` is the reference for everything — hybrid state, popover layout, sub-component conventions, naming. When a step says "mirror color-picker pattern X", look at the relevant section of `color-picker.tsx`.

---

## Phase 1 — Scaffolding

### Task 1: Stub the three files

**Files:**
- Create: `src/components/ui/gradient-editor/gradient-editor.tsx`
- Create: `src/components/ui/gradient-editor/gradient-editor.types.ts`
- Create: `src/components/ui/gradient-editor/index.ts`

- [ ] **Step 1: Create `gradient-editor.tsx` stub**

```tsx
"use client"

// ---------------------------------------------------------------------------
// Component (top of file)
// ---------------------------------------------------------------------------

export function GradientEditor() {
  return null
}

// ---------------------------------------------------------------------------
// Parsing / formatting
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-components (filled in Phase 4)
// ---------------------------------------------------------------------------
```

- [ ] **Step 2: Create `gradient-editor.types.ts` empty stub**

```ts
// =====================================================================
// 1. SUGGESTION STRINGS (filled in Phase 2)
// =====================================================================

// =====================================================================
// 2. INTERPOLATION
// =====================================================================

// =====================================================================
// 3. UTILITY TYPES
// =====================================================================

// =====================================================================
// 4. INTERNAL STOP REPRESENTATION
// =====================================================================
```

- [ ] **Step 3: Create `index.ts` minimal barrel**

```ts
export { GradientEditor } from "./gradient-editor"
```

- [ ] **Step 4: Verify typecheck passes**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/gradient-editor/
git commit -m "Stub gradient-editor module with section comments"
```

---

## Phase 2 — Type system

### Task 2: Suggestion strings + GradientType

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.types.ts`
- Create: `tests/gradient-types.test-d.ts`

- [ ] **Step 1: Write failing type-level smoke test in `tests/gradient-types.test-d.ts`**

```ts
import { expectTypeOf, test } from "vitest"
import type {
  ConicGradientString,
  GradientString,
  GradientStringMap,
  GradientType,
  LinearGradientString,
  RadialGradientString,
} from "@/components/ui/gradient-editor/gradient-editor.types"

test("GradientType enumerates the three gradient flavors", () => {
  expectTypeOf<GradientType>().toEqualTypeOf<"linear" | "radial" | "conic">()
})

test("GradientStringMap keys match GradientType", () => {
  expectTypeOf<keyof GradientStringMap>().toEqualTypeOf<GradientType>()
})

test("GradientString unions the three flavors", () => {
  expectTypeOf<
    LinearGradientString | RadialGradientString | ConicGradientString
  >().toEqualTypeOf<GradientString>()
})
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm test --typecheck tests/gradient-types.test-d.ts
```

Expected: FAIL — types not exported.

- [ ] **Step 3: Implement suggestion strings in `gradient-editor.types.ts`**

```ts
// =====================================================================
// 1. SUGGESTION STRINGS — IntelliSense surface + onChange return types.
// =====================================================================

export type LinearGradientString =
  | `linear-gradient(${string})`
  | `linear-gradient(in ${string}, ${string})`

export type RadialGradientString =
  | `radial-gradient(${string})`
  | `radial-gradient(in ${string}, ${string})`

export type ConicGradientString =
  | `conic-gradient(${string})`
  | `conic-gradient(in ${string}, ${string})`

export type GradientString =
  | LinearGradientString
  | RadialGradientString
  | ConicGradientString

export interface GradientStringMap {
  linear: LinearGradientString
  radial: RadialGradientString
  conic: ConicGradientString
}

export type GradientType = keyof GradientStringMap
```

- [ ] **Step 4: Run, verify PASS**

```bash
pnpm test --typecheck tests/gradient-types.test-d.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add gradient suggestion strings + GradientType union"
```

---

### Task 3: Interpolation types

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.types.ts`
- Modify: `tests/gradient-types.test-d.ts`

- [ ] **Step 1: Append failing tests**

```ts
import type {
  InterpolationHueMethod,
  InterpolationSpace,
  PolarSpace,
} from "@/components/ui/gradient-editor/gradient-editor.types"

test("InterpolationSpace lists the 5 supported spaces", () => {
  expectTypeOf<InterpolationSpace>().toEqualTypeOf<
    "srgb" | "oklch" | "oklab" | "hsl" | "hwb"
  >()
})

test("InterpolationHueMethod is shorter | longer", () => {
  expectTypeOf<InterpolationHueMethod>().toEqualTypeOf<"shorter" | "longer">()
})

test("PolarSpace is the polar subset of InterpolationSpace", () => {
  expectTypeOf<PolarSpace>().toEqualTypeOf<"oklch" | "hsl" | "hwb">()
})
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Append to types file**

```ts
// =====================================================================
// 2. INTERPOLATION
// =====================================================================

export type InterpolationSpace = "srgb" | "oklch" | "oklab" | "hsl" | "hwb"
export type InterpolationHueMethod = "shorter" | "longer"

/** Polar spaces support hue interpolation method. Cartesian (srgb, oklab) don't. */
export type PolarSpace = Extract<InterpolationSpace, "oklch" | "hsl" | "hwb">
```

- [ ] **Step 4: Run, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add InterpolationSpace + InterpolationHueMethod + PolarSpace"
```

---

### Task 4: Utility types — GradientTypeOf + InterpolationOf

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.types.ts`
- Modify: `tests/gradient-types.test-d.ts`

- [ ] **Step 1: Append failing tests**

```ts
import type {
  GradientTypeOf,
  InterpolationOf,
} from "@/components/ui/gradient-editor/gradient-editor.types"

test("GradientTypeOf extracts the type from a literal", () => {
  expectTypeOf<GradientTypeOf<"linear-gradient(red, blue)">>().toEqualTypeOf<
    "linear"
  >()
  expectTypeOf<GradientTypeOf<"radial-gradient(red, blue)">>().toEqualTypeOf<
    "radial"
  >()
  expectTypeOf<GradientTypeOf<"conic-gradient(red, blue)">>().toEqualTypeOf<
    "conic"
  >()
  expectTypeOf<GradientTypeOf<"not a gradient">>().toBeNever()
})

test("InterpolationOf extracts the interpolation space", () => {
  expectTypeOf<InterpolationOf<"linear-gradient(in oklch, red, blue)">>()
    .toEqualTypeOf<"oklch">()
  expectTypeOf<InterpolationOf<"linear-gradient(in oklch longer hue, red, blue)">>()
    .toEqualTypeOf<"oklch">()
  expectTypeOf<InterpolationOf<"linear-gradient(in oklch shorter hue, red, blue)">>()
    .toEqualTypeOf<"oklch">()
  expectTypeOf<InterpolationOf<"linear-gradient(red, blue)">>().toBeNever()
})
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Append to types file**

```ts
// =====================================================================
// 3. UTILITY TYPES — extract structural info at the type level.
// =====================================================================

/**
 * Extract gradient type from a literal.
 * @example
 * type T = GradientTypeOf<"linear-gradient(red, blue)">  // "linear"
 */
export type GradientTypeOf<S extends string> = S extends `linear-gradient(${string}`
  ? "linear"
  : S extends `radial-gradient(${string}`
    ? "radial"
    : S extends `conic-gradient(${string}`
      ? "conic"
      : never

/**
 * Extract interpolation space from a literal, if declared.
 * @example
 * type T = InterpolationOf<"linear-gradient(in oklch, red, blue)">  // "oklch"
 */
export type InterpolationOf<S extends string> =
  S extends `${string}-gradient(in ${infer Space}, ${string}`
    ? Space extends `${infer Pure} longer hue` | `${infer Pure} shorter hue`
      ? Pure
      : Space
    : never
```

- [ ] **Step 4: Run, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add GradientTypeOf<S> + InterpolationOf<S> utility types"
```

---

### Task 5: GradientStop interface

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.types.ts`

- [ ] **Step 1: Append to types file**

```ts
// =====================================================================
// 4. INTERNAL STOP REPRESENTATION (exported for advanced use)
// =====================================================================

import type { ColorString } from "@/components/ui/color-picker"

/**
 * A single color stop in the editor's internal representation.
 * Reuses ColorString from the color-picker registry item.
 */
export interface GradientStop {
  /** Color in any of the 6 supported color modes. */
  color: ColorString
  /** Position 0..100. */
  position: number
}
```

> **Note:** `import type` at the bottom of a types file is unusual but TypeScript allows it. Biome may reorganize — let it.

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Run biome autofix**

```bash
pnpm check:fix
```

May reorder the import to the top. Accept whatever it does.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add GradientStop interface, reuses ColorString from color-picker"
```

---

## Phase 3 — Pure parse/format functions (TDD)

> All parsers, formatters, and helpers in this phase live in `src/components/ui/gradient-editor/gradient-editor.tsx`. Tests live in `tests/gradient-parse.test.ts` and `tests/gradient-format.test.ts`.

### Task 6: Balanced-paren comma splitter

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`
- Create: `tests/gradient-parse.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest"
import { splitTopLevelCommas } from "@/components/ui/gradient-editor/gradient-editor"

describe("splitTopLevelCommas", () => {
  it("splits a flat list", () => {
    expect(splitTopLevelCommas("a, b, c")).toEqual(["a", "b", "c"])
  })
  it("does NOT split commas inside parens", () => {
    expect(splitTopLevelCommas("rgb(1, 2, 3), oklch(0.5 0.1 240 / 50%)")).toEqual([
      "rgb(1, 2, 3)",
      "oklch(0.5 0.1 240 / 50%)",
    ])
  })
  it("handles nested parens", () => {
    expect(splitTopLevelCommas("calc(min(1px, 2px) + 3px), foo")).toEqual([
      "calc(min(1px, 2px) + 3px)",
      "foo",
    ])
  })
  it("trims whitespace around segments", () => {
    expect(splitTopLevelCommas("  a  ,  b  ")).toEqual(["a", "b"])
  })
  it("returns a single segment when no commas at top level", () => {
    expect(splitTopLevelCommas("rgb(1, 2, 3)")).toEqual(["rgb(1, 2, 3)"])
  })
  it("handles empty input", () => {
    expect(splitTopLevelCommas("")).toEqual([])
  })
})
```

- [ ] **Step 2: Run, verify FAIL**

```bash
pnpm test tests/gradient-parse.test.ts
```

Expected: FAIL (import unresolved).

- [ ] **Step 3: Implement in `gradient-editor.tsx` under the "Parsing / formatting" section**

```ts
/**
 * Split a string on commas, ignoring commas inside parens. Trims each segment.
 *
 * @example
 * splitTopLevelCommas("rgb(1, 2, 3), red") // ["rgb(1, 2, 3)", "red"]
 */
export function splitTopLevelCommas(input: string): string[] {
  const trimmed = input.trim()
  if (trimmed === "") return []
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === "(") depth++
    else if (ch === ")") depth--
    else if (ch === "," && depth === 0) {
      out.push(trimmed.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(trimmed.slice(start).trim())
  return out
}
```

- [ ] **Step 4: Run, verify PASS**

```bash
pnpm test tests/gradient-parse.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add splitTopLevelCommas helper for balanced-paren stop splitting"
```

---

### Task 7: parseStop + formatStop

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`
- Modify: `tests/gradient-parse.test.ts`
- Create: `tests/gradient-format.test.ts`

- [ ] **Step 1: Append parse tests**

```ts
import { parseStop } from "@/components/ui/gradient-editor/gradient-editor"

describe("parseStop", () => {
  it("parses a hex stop without position", () => {
    expect(parseStop("#ff0000")).toEqual({ color: "#ff0000", position: null })
  })
  it("parses an rgb stop with position", () => {
    expect(parseStop("rgb(255 0 0) 50%")).toEqual({
      color: "rgb(255 0 0)",
      position: 50,
    })
  })
  it("parses an oklch stop with position", () => {
    expect(parseStop("oklch(0.5 0.1 240) 25%")).toEqual({
      color: "oklch(0.5 0.1 240)",
      position: 25,
    })
  })
  it("parses oklch with comma inside, treating last token as position", () => {
    expect(parseStop("oklch(0.5 0.1 240 / 50%) 75%")).toEqual({
      color: "oklch(0.5 0.1 240 / 50%)",
      position: 75,
    })
  })
  it("returns null for invalid stop", () => {
    expect(parseStop("not-a-color 50%")).toBeNull()
  })
})
```

- [ ] **Step 2: Write format tests in `tests/gradient-format.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { formatStop } from "@/components/ui/gradient-editor/gradient-editor"

describe("formatStop", () => {
  it("emits color + integer percent", () => {
    expect(formatStop({ color: "#ff0000", position: 50 })).toBe("#ff0000 50%")
  })
  it("rounds fractional positions to integer", () => {
    expect(formatStop({ color: "#ff0000", position: 33.7 })).toBe("#ff0000 34%")
  })
})
```

- [ ] **Step 3: Run, verify FAIL**

- [ ] **Step 4: Implement in `gradient-editor.tsx`**

```ts
import { parseColor } from "@/components/ui/color-picker/color-picker"
import type { ColorString, GradientStop } from "./gradient-editor.types"

/**
 * Parse a single gradient stop. The position is optional; when absent,
 * returns `position: null` so the caller can auto-distribute.
 *
 * @example
 * parseStop("#ff0000 50%") // { color: "#ff0000", position: 50 }
 * parseStop("oklch(0.5 0.1 240)") // { color: "oklch(0.5 0.1 240)", position: null }
 */
export function parseStop(
  input: string,
): { color: ColorString; position: number | null } | null {
  // The position (if present) is the LAST whitespace-separated token outside parens.
  // Walk backwards, find the split point.
  const trimmed = input.trim()
  let depth = 0
  let splitAt = -1
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const ch = trimmed[i]
    if (ch === ")") depth++
    else if (ch === "(") depth--
    else if (ch === " " && depth === 0) {
      splitAt = i
      break
    }
  }

  let colorPart = trimmed
  let positionPart: string | null = null
  if (splitAt !== -1) {
    const tail = trimmed.slice(splitAt + 1).trim()
    if (tail.endsWith("%")) {
      const n = parseFloat(tail.slice(0, -1))
      if (!Number.isNaN(n)) {
        colorPart = trimmed.slice(0, splitAt).trim()
        positionPart = tail
      }
    }
  }

  if (parseColor(colorPart) == null) return null
  return {
    color: colorPart as ColorString,
    position: positionPart == null ? null : parseFloat(positionPart),
  }
}

export function formatStop(stop: GradientStop): string {
  return `${stop.color} ${Math.round(stop.position)}%`
}
```

- [ ] **Step 5: Run, verify PASS**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add parseStop + formatStop with backward-walk position extraction"
```

---

### Task 8: parseInterpolation + formatInterpolation helpers

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`
- Modify: `tests/gradient-parse.test.ts`
- Modify: `tests/gradient-format.test.ts`

- [ ] **Step 1: Append parse tests**

```ts
import { parseInterpolation } from "@/components/ui/gradient-editor/gradient-editor"

describe("parseInterpolation", () => {
  it("parses `in oklch`", () => {
    expect(parseInterpolation("in oklch")).toEqual({
      space: "oklch",
      hueMethod: undefined,
    })
  })
  it("parses `in oklch longer hue`", () => {
    expect(parseInterpolation("in oklch longer hue")).toEqual({
      space: "oklch",
      hueMethod: "longer",
    })
  })
  it("parses `in srgb` (cartesian, no hue method)", () => {
    expect(parseInterpolation("in srgb")).toEqual({
      space: "srgb",
      hueMethod: undefined,
    })
  })
  it("returns null when prefix is missing", () => {
    expect(parseInterpolation("oklch")).toBeNull()
  })
  it("returns null for unknown space", () => {
    expect(parseInterpolation("in mystery")).toBeNull()
  })
})
```

- [ ] **Step 2: Append format tests**

```ts
import { formatInterpolation } from "@/components/ui/gradient-editor/gradient-editor"

describe("formatInterpolation", () => {
  it("returns empty string for default srgb (no hue method)", () => {
    expect(formatInterpolation({ space: "srgb" })).toBe("")
  })
  it("returns `in oklch, ` for non-default space", () => {
    expect(formatInterpolation({ space: "oklch" })).toBe("in oklch, ")
  })
  it("includes hue method for polar spaces", () => {
    expect(formatInterpolation({ space: "oklch", hueMethod: "longer" })).toBe(
      "in oklch longer hue, ",
    )
  })
  it("ignores hue method for cartesian (sRGB / oklab)", () => {
    expect(formatInterpolation({ space: "srgb", hueMethod: "longer" })).toBe("")
    expect(formatInterpolation({ space: "oklab", hueMethod: "longer" })).toBe(
      "in oklab, ",
    )
  })
})
```

- [ ] **Step 3: Run, verify FAIL**

- [ ] **Step 4: Implement in `gradient-editor.tsx`**

```ts
import type {
  InterpolationHueMethod,
  InterpolationSpace,
  PolarSpace,
} from "./gradient-editor.types"

const INTERPOLATION_SPACES = ["srgb", "oklch", "oklab", "hsl", "hwb"] as const
const POLAR_SPACES: readonly PolarSpace[] = ["oklch", "hsl", "hwb"]

interface Interpolation {
  space: InterpolationSpace
  hueMethod?: InterpolationHueMethod
}

/**
 * Parse a CSS interpolation clause like `in oklch longer hue`.
 * Returns null if the prefix is missing or the space is unrecognized.
 */
export function parseInterpolation(input: string): Interpolation | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith("in ")) return null
  const body = trimmed.slice(3).trim()
  // Possible forms: "<space>", "<space> longer hue", "<space> shorter hue"
  const huePartMatch = body.match(/^(\S+)\s+(longer|shorter)\s+hue$/)
  if (huePartMatch) {
    const space = huePartMatch[1] as InterpolationSpace
    if (!INTERPOLATION_SPACES.includes(space)) return null
    return { space, hueMethod: huePartMatch[2] as InterpolationHueMethod }
  }
  const space = body as InterpolationSpace
  if (!INTERPOLATION_SPACES.includes(space)) return null
  return { space, hueMethod: undefined }
}

/**
 * Format an interpolation as a clause for inclusion in a gradient string,
 * including the trailing comma. Returns empty string when the space is `srgb`
 * with no hue method (CSS default — keep output clean).
 */
export function formatInterpolation(interp: Interpolation): string {
  // srgb is CSS default — omit unless hue method is set (which is N/A for cartesian).
  if (interp.space === "srgb") return ""
  const isPolar = POLAR_SPACES.includes(interp.space as PolarSpace)
  if (isPolar && interp.hueMethod) {
    return `in ${interp.space} ${interp.hueMethod} hue, `
  }
  return `in ${interp.space}, `
}
```

- [ ] **Step 5: Run, verify PASS**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add parseInterpolation + formatInterpolation helpers"
```

---

### Task 9: parseLinearGradient + parseRadialGradient + parseConicGradient

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`
- Modify: `tests/gradient-parse.test.ts`

- [ ] **Step 1: Append parse tests**

```ts
import { parseGradient } from "@/components/ui/gradient-editor/gradient-editor"

describe("parseGradient — linear", () => {
  it("parses basic linear-gradient with two stops", () => {
    const parsed = parseGradient("linear-gradient(red, blue)")
    expect(parsed?.type).toBe("linear")
    expect(parsed?.stops).toHaveLength(2)
    expect(parsed?.angle).toBe(180) // CSS default = to bottom = 180deg
    expect(parsed?.interpolation.space).toBe("srgb")
  })
  it("parses linear-gradient with angle", () => {
    const parsed = parseGradient("linear-gradient(45deg, red, blue)")
    expect(parsed?.angle).toBe(45)
  })
  it("parses linear-gradient with `to right`", () => {
    const parsed = parseGradient("linear-gradient(to right, red, blue)")
    expect(parsed?.angle).toBe(90)
  })
  it("parses linear-gradient with interpolation clause", () => {
    const parsed = parseGradient("linear-gradient(in oklch, red, blue)")
    expect(parsed?.interpolation).toEqual({ space: "oklch", hueMethod: undefined })
  })
  it("parses linear-gradient with hue method", () => {
    const parsed = parseGradient("linear-gradient(in oklch longer hue, red, blue)")
    expect(parsed?.interpolation).toEqual({ space: "oklch", hueMethod: "longer" })
  })
  it("auto-distributes positions when stops omit them", () => {
    const parsed = parseGradient("linear-gradient(red, green, blue)")
    expect(parsed?.stops.map((s) => s.position)).toEqual([0, 50, 100])
  })
  it("handles balanced-paren stops (oklch with alpha)", () => {
    const parsed = parseGradient(
      "linear-gradient(rgb(255, 0, 0), oklch(0.5 0.1 240 / 50%))",
    )
    expect(parsed?.stops).toHaveLength(2)
    expect(parsed?.stops[0].color).toBe("rgb(255, 0, 0)")
    expect(parsed?.stops[1].color).toBe("oklch(0.5 0.1 240 / 50%)")
  })
})

describe("parseGradient — radial", () => {
  it("parses basic radial-gradient", () => {
    const parsed = parseGradient("radial-gradient(red, blue)")
    expect(parsed?.type).toBe("radial")
    expect(parsed?.shape).toBe("ellipse") // CSS default
    expect(parsed?.size).toBe("farthest-corner")
    expect(parsed?.position).toEqual({ x: 50, y: 50 })
  })
  it("parses radial-gradient with shape + size + position", () => {
    const parsed = parseGradient(
      "radial-gradient(circle closest-side at 20% 30%, red, blue)",
    )
    expect(parsed?.shape).toBe("circle")
    expect(parsed?.size).toBe("closest-side")
    expect(parsed?.position).toEqual({ x: 20, y: 30 })
  })
})

describe("parseGradient — conic", () => {
  it("parses basic conic-gradient", () => {
    const parsed = parseGradient("conic-gradient(red, blue)")
    expect(parsed?.type).toBe("conic")
    expect(parsed?.fromAngle).toBe(0)
    expect(parsed?.position).toEqual({ x: 50, y: 50 })
  })
  it("parses conic-gradient with from + at", () => {
    const parsed = parseGradient(
      "conic-gradient(from 90deg at 25% 75%, red, blue)",
    )
    expect(parsed?.fromAngle).toBe(90)
    expect(parsed?.position).toEqual({ x: 25, y: 75 })
  })
})

describe("parseGradient — edge cases", () => {
  it("returns null for unrecognized prefix", () => {
    expect(parseGradient("not-a-gradient(red, blue)")).toBeNull()
  })
  it("returns null for single-stop gradient", () => {
    expect(parseGradient("linear-gradient(red)")).toBeNull()
  })
  it("returns null when a stop fails to parse", () => {
    expect(parseGradient("linear-gradient(not-a-color, blue)")).toBeNull()
  })
})
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement parseGradient + internal type in `gradient-editor.tsx`**

Add the `InternalState` interface near the top of the file (above the component):

```ts
import type {
  GradientStop,
  GradientType,
  InterpolationHueMethod,
  InterpolationSpace,
} from "./gradient-editor.types"

export interface InternalState {
  type: GradientType
  stops: GradientStop[]
  /** Linear only. Degrees, 0 = to top, 90 = to right, 180 = to bottom (CSS default), 270 = to left. */
  angle: number
  /** Radial only. */
  shape: "circle" | "ellipse"
  /** Radial only. */
  size: "closest-side" | "closest-corner" | "farthest-side" | "farthest-corner"
  /** Radial + conic. Percentages 0..100. */
  position: { x: number; y: number }
  /** Conic only. Degrees. */
  fromAngle: number
  interpolation: {
    space: InterpolationSpace
    hueMethod?: InterpolationHueMethod
  }
}
```

Then the dispatcher + per-type parsers:

```ts
const SIDE_TO_ANGLE: Record<string, number> = {
  "to top": 0,
  "to top right": 45,
  "to right": 90,
  "to bottom right": 135,
  "to bottom": 180,
  "to bottom left": 225,
  "to left": 270,
  "to top left": 315,
}

const RADIAL_SHAPES = ["circle", "ellipse"] as const
const RADIAL_SIZES = [
  "closest-side",
  "closest-corner",
  "farthest-side",
  "farthest-corner",
] as const

/**
 * Parse a CSS gradient string into the editor's internal state.
 * Returns null on parse failure or when the gradient has fewer than 2 stops.
 */
export function parseGradient(value: string): InternalState | null {
  const trimmed = value.trim()
  const prefixMatch = trimmed.match(/^(linear|radial|conic)-gradient\((.*)\)$/s)
  if (!prefixMatch) return null
  const type = prefixMatch[1] as GradientType
  const body = prefixMatch[2]

  const segments = splitTopLevelCommas(body)
  if (segments.length === 0) return null

  // Try to extract interpolation from first segment.
  let interpolation: { space: InterpolationSpace; hueMethod?: InterpolationHueMethod } = {
    space: "srgb",
  }
  let preludeAndStops = segments
  const interpFromFirst = parseInterpolation(segments[0])
  if (interpFromFirst) {
    interpolation = interpFromFirst
    preludeAndStops = segments.slice(1)
  }

  // Determine if the next segment is a prelude (angle/shape/from) or a stop.
  let preludeIndex = 0
  const first = preludeAndStops[0] ?? ""
  const looksLikePrelude =
    /^(\d+(\.\d+)?deg|to )/.test(first) || // linear angle
    /^(circle|ellipse|closest|farthest)/.test(first) || // radial shape/size
    first.startsWith("at ") || // radial position alone
    first.startsWith("from ") // conic

  // Type-specific prelude extraction
  let angle = 180 // linear default = to bottom
  let shape: InternalState["shape"] = "ellipse"
  let size: InternalState["size"] = "farthest-corner"
  let position = { x: 50, y: 50 }
  let fromAngle = 0

  if (looksLikePrelude && type === "linear") {
    const prelude = preludeAndStops[0]
    if (SIDE_TO_ANGLE[prelude] != null) {
      angle = SIDE_TO_ANGLE[prelude]
    } else {
      const m = prelude.match(/^(\d+(?:\.\d+)?)deg$/)
      if (m) angle = parseFloat(m[1])
      else return null
    }
    preludeIndex = 1
  } else if (looksLikePrelude && type === "radial") {
    const prelude = preludeAndStops[0]
    // Tokens: [shape] [size] [at <pos>]
    const tokens = prelude.split(/\s+/)
    let i = 0
    if (RADIAL_SHAPES.includes(tokens[i] as (typeof RADIAL_SHAPES)[number])) {
      shape = tokens[i] as InternalState["shape"]
      i++
    }
    if (RADIAL_SIZES.includes(tokens[i] as (typeof RADIAL_SIZES)[number])) {
      size = tokens[i] as InternalState["size"]
      i++
    }
    if (tokens[i] === "at") {
      i++
      const x = parsePercent(tokens[i++])
      const y = parsePercent(tokens[i++])
      if (x == null || y == null) return null
      position = { x, y }
    }
    preludeIndex = 1
  } else if (looksLikePrelude && type === "conic") {
    const prelude = preludeAndStops[0]
    // Tokens: [from <angle>] [at <pos>]
    const tokens = prelude.split(/\s+/)
    let i = 0
    if (tokens[i] === "from") {
      i++
      const m = tokens[i++].match(/^(-?\d+(?:\.\d+)?)deg$/)
      if (!m) return null
      fromAngle = parseFloat(m[1])
    }
    if (tokens[i] === "at") {
      i++
      const x = parsePercent(tokens[i++])
      const y = parsePercent(tokens[i++])
      if (x == null || y == null) return null
      position = { x, y }
    }
    preludeIndex = 1
  }

  // Remaining segments are stops.
  const stopSegments = preludeAndStops.slice(preludeIndex)
  if (stopSegments.length < 2) return null

  const rawStops = stopSegments.map(parseStop)
  if (rawStops.some((s) => s == null)) return null

  // Auto-distribute positions when null.
  const count = rawStops.length
  const stops: GradientStop[] = rawStops.map((raw, i) => ({
    color: raw!.color,
    position:
      raw!.position != null ? raw!.position : (i / (count - 1)) * 100,
  }))

  return {
    type,
    stops,
    angle,
    shape,
    size,
    position,
    fromAngle,
    interpolation,
  }
}

function parsePercent(input: string | undefined): number | null {
  if (!input) return null
  if (!input.endsWith("%")) return null
  const n = parseFloat(input.slice(0, -1))
  return Number.isNaN(n) ? null : n
}
```

- [ ] **Step 4: Run, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add parseGradient dispatcher with linear/radial/conic prelude parsing"
```

---

### Task 10: formatGradient dispatcher

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`
- Modify: `tests/gradient-format.test.ts`

- [ ] **Step 1: Append format tests**

```ts
import {
  formatGradient,
  parseGradient,
} from "@/components/ui/gradient-editor/gradient-editor"

describe("formatGradient", () => {
  it("emits linear with angle + stops", () => {
    expect(
      formatGradient({
        type: "linear",
        stops: [
          { color: "#ff0000", position: 0 },
          { color: "#0000ff", position: 100 },
        ],
        angle: 45,
        shape: "ellipse",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        fromAngle: 0,
        interpolation: { space: "srgb" },
      }),
    ).toBe("linear-gradient(45deg, #ff0000 0%, #0000ff 100%)")
  })

  it("emits radial with shape + size + position", () => {
    expect(
      formatGradient({
        type: "radial",
        stops: [
          { color: "#ff0000", position: 0 },
          { color: "#0000ff", position: 100 },
        ],
        angle: 180,
        shape: "circle",
        size: "closest-side",
        position: { x: 20, y: 30 },
        fromAngle: 0,
        interpolation: { space: "srgb" },
      }),
    ).toBe("radial-gradient(circle closest-side at 20% 30%, #ff0000 0%, #0000ff 100%)")
  })

  it("emits conic with from + at", () => {
    expect(
      formatGradient({
        type: "conic",
        stops: [
          { color: "#ff0000", position: 0 },
          { color: "#0000ff", position: 100 },
        ],
        angle: 180,
        shape: "ellipse",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        fromAngle: 90,
        interpolation: { space: "srgb" },
      }),
    ).toBe("conic-gradient(from 90deg at 50% 50%, #ff0000 0%, #0000ff 100%)")
  })

  it("prepends interpolation when not default srgb", () => {
    expect(
      formatGradient({
        type: "linear",
        stops: [
          { color: "#ff0000", position: 0 },
          { color: "#0000ff", position: 100 },
        ],
        angle: 90,
        shape: "ellipse",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        fromAngle: 0,
        interpolation: { space: "oklch" },
      }),
    ).toBe("linear-gradient(in oklch, 90deg, #ff0000 0%, #0000ff 100%)")
  })
})

describe("parseGradient + formatGradient round-trip", () => {
  it("round-trips a basic linear gradient", () => {
    const input = "linear-gradient(90deg, #ff0000 0%, #0000ff 100%)"
    const parsed = parseGradient(input)
    expect(parsed).not.toBeNull()
    expect(formatGradient(parsed!)).toBe(input)
  })

  it("round-trips with interpolation + hue method", () => {
    const input = "linear-gradient(in oklch longer hue, 90deg, #ff0000 0%, #0000ff 100%)"
    const parsed = parseGradient(input)
    expect(parsed).not.toBeNull()
    expect(formatGradient(parsed!)).toBe(input)
  })

  it("round-trips a radial", () => {
    const input = "radial-gradient(circle closest-side at 20% 30%, #ff0000 0%, #0000ff 100%)"
    const parsed = parseGradient(input)
    expect(parsed).not.toBeNull()
    expect(formatGradient(parsed!)).toBe(input)
  })
})
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement formatGradient in `gradient-editor.tsx`**

```ts
/**
 * Serialize internal state to a CSS gradient string.
 */
export function formatGradient(state: InternalState): string {
  const interp = formatInterpolation(state.interpolation)
  const stops = state.stops.map(formatStop).join(", ")
  switch (state.type) {
    case "linear":
      return `linear-gradient(${interp}${state.angle}deg, ${stops})`
    case "radial":
      return `radial-gradient(${interp}${state.shape} ${state.size} at ${Math.round(state.position.x)}% ${Math.round(state.position.y)}%, ${stops})`
    case "conic":
      return `conic-gradient(${interp}from ${state.fromAngle}deg at ${Math.round(state.position.x)}% ${Math.round(state.position.y)}%, ${stops})`
  }
}
```

- [ ] **Step 4: Run, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add formatGradient dispatcher with canonical-form output"
```

---

### Task 11: isGradientString runtime guard

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`
- Modify: `tests/gradient-types.test-d.ts`

- [ ] **Step 1: Append runtime tests**

```ts
import { expect } from "vitest"
import { isGradientString } from "@/components/ui/gradient-editor/gradient-editor"

test("isGradientString accepts valid gradients", () => {
  expect(isGradientString("linear-gradient(red, blue)")).toBe(true)
  expect(isGradientString("radial-gradient(red, blue)")).toBe(true)
  expect(isGradientString("conic-gradient(red, blue)")).toBe(true)
  expect(isGradientString("linear-gradient(in oklch, red, blue)")).toBe(true)
})

test("isGradientString rejects non-gradient strings", () => {
  expect(isGradientString("not a gradient")).toBe(false)
  expect(isGradientString("")).toBe(false)
  expect(isGradientString("#ff0000")).toBe(false)
  expect(isGradientString("linear-gradient(red)")).toBe(false) // single stop
})
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement `isGradientString` in `gradient-editor.tsx`**

```ts
import type {
  ConicGradientString,
  GradientString,
  LinearGradientString,
  RadialGradientString,
} from "./gradient-editor.types"

/**
 * Runtime type guard. Narrows wide `string` to `GradientString`.
 *
 * @example
 * const v: string = userInput
 * if (isGradientString(v)) {
 *   // v is now GradientString
 * }
 */
export function isGradientString(value: string): value is GradientString
export function isGradientString<S extends string>(
  value: S,
): value is S & (LinearGradientString | RadialGradientString | ConicGradientString)
export function isGradientString(value: string): boolean {
  return parseGradient(value) !== null
}
```

- [ ] **Step 4: Run, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add isGradientString runtime guard with overloaded narrowing"
```

---

## Phase 4 — Component shell + sub-components

### Task 12: ColorPicker shell with invalid fallback

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`
- Create: `tests/gradient-editor.test.tsx`

- [ ] **Step 1: Write failing tests in `tests/gradient-editor.test.tsx`**

```tsx
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { GradientEditor } from "@/components/ui/gradient-editor/gradient-editor"

describe("GradientEditor shell", () => {
  it("renders fallback span for unparseable value", () => {
    render(<GradientEditor value="not a gradient" onChange={() => {}} />)
    const fallback = document.querySelector(
      '[data-slot="gradient-editor-fallback"]',
    )
    expect(fallback).toBeTruthy()
  })

  it("renders trigger when value parses", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    )
    expect(trigger).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement the component shell + props in `gradient-editor.tsx`**

Imports at the top:

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type {
  GradientString,
  GradientStringMap,
  GradientType,
} from "./gradient-editor.types"
```

Replace the stub `GradientEditor` with the props interface + body (just the shell — popover wiring lands in Task 22):

```tsx
const GRADIENT_TYPES: readonly GradientType[] = [
  "linear",
  "radial",
  "conic",
] as const

export interface GradientEditorProps<
  TType extends GradientType | undefined = undefined,
> {
  value: GradientString | (string & {})
  onChange: (
    value: TType extends GradientType ? GradientStringMap[TType] : GradientString,
  ) => void
  type?: TType
  maxStops?: number
  className?: string
  "aria-label"?: string
}

export function GradientEditor<TType extends GradientType | undefined>({
  value,
  onChange: _onChange, // not yet wired
  type: _typeProp, // not yet wired
  maxStops: _maxStops = 8, // not yet wired
  className,
  "aria-label": _ariaLabel = "Edit gradient",
}: GradientEditorProps<TType>) {
  const parsedFromValue = parseGradient(value)

  if (!parsedFromValue) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-5 w-12 rounded border bg-muted",
          className,
        )}
        style={{ backgroundColor: value }}
        data-slot="gradient-editor-fallback"
      />
    )
  }

  return (
    <button
      type="button"
      aria-label={_ariaLabel}
      className={cn(
        "h-5 w-12 shrink-0 cursor-pointer rounded border outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      style={{ background: value }}
      data-slot="gradient-editor-trigger"
    />
  )
}
```

Suppress unused warnings on the prefixed `_` params for now — Phase 5 wires them up. If Biome complains, mark with biome-ignore comments.

- [ ] **Step 4: Run, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add GradientEditor shell with fallback span + trigger button"
```

---

### Task 13: InterpolationPicker sub-component

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Add sub-component below the main component, near the bottom of file**

```tsx
import { Button } from "@/components/ui/button"

function InterpolationPicker({
  space,
  hueMethod,
  onSpaceChange,
  onHueMethodChange,
}: {
  space: InterpolationSpace
  hueMethod?: InterpolationHueMethod
  onSpaceChange: (next: InterpolationSpace) => void
  onHueMethodChange: (next: InterpolationHueMethod) => void
}) {
  const isPolar = POLAR_SPACES.includes(space as PolarSpace)
  return (
    <div
      className="flex items-center gap-2"
      data-slot="gradient-editor-interpolation"
    >
      <select
        value={space}
        onChange={(e) => onSpaceChange(e.target.value as InterpolationSpace)}
        className="h-7 rounded border bg-background px-2 font-mono text-xs"
        aria-label="Interpolation space"
      >
        {INTERPOLATION_SPACES.map((s) => (
          <option key={s} value={s}>
            in {s}
          </option>
        ))}
      </select>
      {isPolar && (
        <select
          value={hueMethod ?? "shorter"}
          onChange={(e) =>
            onHueMethodChange(e.target.value as InterpolationHueMethod)
          }
          className="h-7 rounded border bg-background px-2 font-mono text-xs"
          aria-label="Hue method"
        >
          <option value="shorter">shorter hue</option>
          <option value="longer">longer hue</option>
        </select>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck + biome**

```bash
pnpm typecheck && pnpm check
```

May flag the unused sub-component since nothing consumes it yet. Either temporarily export, or accept the warning until Task 22 wires it in. Decision: add a temporary `export` keyword on each sub-component until Task 22 (then drop the exports).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add InterpolationPicker sub-component"
```

---

### Task 14: AngleDial widget + LinearControls

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Add AngleDial sub-component**

```tsx
function AngleDial({
  angle,
  onChange,
}: {
  angle: number
  onChange: (next: number) => void
}) {
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = event.clientX - cx
    const dy = event.clientY - cy
    // 0deg = up; rotate by -90 to align CSS angle convention
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (deg < 0) deg += 360
    if (event.shiftKey) deg = Math.round(deg / 15) * 15
    onChange(Math.round(deg) % 360)
  }
  // Convert to radians for the indicator line; CSS 0deg = up means angle-90 in atan2 terms.
  const rad = ((angle - 90) * Math.PI) / 180
  const x = 20 + 16 * Math.cos(rad)
  const y = 20 + 16 * Math.sin(rad)
  return (
    <div
      role="slider"
      aria-label="Angle"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(angle)}
      tabIndex={0}
      className="h-10 w-10 shrink-0 touch-none cursor-grab rounded-full border bg-muted/40"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        handlePointer(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons) handlePointer(event)
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 15 : 1
        if (event.key === "ArrowLeft") onChange((angle - step + 360) % 360)
        if (event.key === "ArrowRight") onChange((angle + step) % 360)
      }}
      data-slot="gradient-editor-angle-dial"
    >
      <svg viewBox="0 0 40 40" className="h-full w-full">
        <circle cx="20" cy="20" r="1.5" fill="currentColor" />
        <line x1="20" y1="20" x2={x} y2={y} stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

function LinearControls({
  angle,
  onChange,
}: {
  angle: number
  onChange: (next: number) => void
}) {
  return (
    <div
      className="flex items-center gap-3"
      data-slot="gradient-editor-linear-controls"
    >
      <AngleDial angle={angle} onChange={onChange} />
      <input
        type="number"
        min={0}
        max={360}
        value={Math.round(angle)}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) || 0)}
        className="h-7 w-16 rounded border bg-background px-2 font-mono text-xs"
        aria-label="Angle in degrees"
      />
      <span className="font-mono text-xs text-muted-foreground">deg</span>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck + biome**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add AngleDial widget + LinearControls"
```

---

### Task 15: PositionPicker + RadialControls + ConicControls

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Add PositionPicker sub-component**

```tsx
function PositionPicker({
  x,
  y,
  onChange,
}: {
  x: number
  y: number
  onChange: (next: { x: number; y: number }) => void
}) {
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const nx = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    )
    const ny = Math.max(
      0,
      Math.min(100, ((event.clientY - rect.top) / rect.height) * 100),
    )
    onChange({ x: Math.round(nx), y: Math.round(ny) })
  }
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-16 w-16 shrink-0 touch-none cursor-crosshair rounded border bg-muted/40"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          handlePointer(event)
        }}
        onPointerMove={(event) => {
          if (event.buttons) handlePointer(event)
        }}
        data-slot="gradient-editor-position-pad"
      >
        <div
          aria-hidden="true"
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          x:
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(x)}
            onChange={(e) =>
              onChange({ x: Number.parseInt(e.target.value, 10) || 0, y })
            }
            className="h-6 w-12 rounded border bg-background px-1 font-mono text-xs"
          />
          %
        </label>
        <label className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          y:
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(y)}
            onChange={(e) =>
              onChange({ x, y: Number.parseInt(e.target.value, 10) || 0 })
            }
            className="h-6 w-12 rounded border bg-background px-1 font-mono text-xs"
          />
          %
        </label>
      </div>
    </div>
  )
}

function RadialControls({
  state,
  onChange,
}: {
  state: Pick<InternalState, "shape" | "size" | "position">
  onChange: (next: Pick<InternalState, "shape" | "size" | "position">) => void
}) {
  return (
    <div
      className="flex flex-col gap-3"
      data-slot="gradient-editor-radial-controls"
    >
      <div className="flex items-center gap-2">
        <select
          value={state.shape}
          onChange={(e) =>
            onChange({ ...state, shape: e.target.value as "circle" | "ellipse" })
          }
          className="h-7 rounded border bg-background px-2 font-mono text-xs"
          aria-label="Radial shape"
        >
          <option value="ellipse">ellipse</option>
          <option value="circle">circle</option>
        </select>
        <select
          value={state.size}
          onChange={(e) =>
            onChange({
              ...state,
              size: e.target.value as InternalState["size"],
            })
          }
          className="h-7 rounded border bg-background px-2 font-mono text-xs"
          aria-label="Radial size"
        >
          <option value="farthest-corner">farthest-corner</option>
          <option value="closest-corner">closest-corner</option>
          <option value="farthest-side">farthest-side</option>
          <option value="closest-side">closest-side</option>
        </select>
      </div>
      <PositionPicker
        x={state.position.x}
        y={state.position.y}
        onChange={(pos) => onChange({ ...state, position: pos })}
      />
    </div>
  )
}

function ConicControls({
  fromAngle,
  position,
  onChange,
}: {
  fromAngle: number
  position: { x: number; y: number }
  onChange: (next: { fromAngle: number; position: { x: number; y: number } }) => void
}) {
  return (
    <div
      className="flex flex-col gap-3"
      data-slot="gradient-editor-conic-controls"
    >
      <div className="flex items-center gap-3">
        <AngleDial
          angle={fromAngle}
          onChange={(next) => onChange({ fromAngle: next, position })}
        />
        <input
          type="number"
          min={0}
          max={360}
          value={Math.round(fromAngle)}
          onChange={(e) =>
            onChange({
              fromAngle: Number.parseInt(e.target.value, 10) || 0,
              position,
            })
          }
          className="h-7 w-16 rounded border bg-background px-2 font-mono text-xs"
          aria-label="Conic from-angle in degrees"
        />
        <span className="font-mono text-xs text-muted-foreground">deg</span>
      </div>
      <PositionPicker
        x={position.x}
        y={position.y}
        onChange={(pos) => onChange({ fromAngle, position: pos })}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck + biome**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add PositionPicker + RadialControls + ConicControls"
```

---

### Task 16: TypeSwitcher tabs

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Add TypeSwitcher sub-component**

```tsx
function TypeSwitcher({
  type,
  onChange,
}: {
  type: GradientType
  onChange: (next: GradientType) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Gradient type"
      className="flex gap-1"
      data-slot="gradient-editor-types"
    >
      {GRADIENT_TYPES.map((t) => (
        <Button
          key={t}
          type="button"
          role="tab"
          aria-selected={t === type}
          size="sm"
          variant={t === type ? "secondary" : "ghost"}
          onClick={() => onChange(t)}
          className="h-7 px-2 font-mono text-xs"
        >
          {t}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add TypeSwitcher tabs"
```

---

### Task 17: StopDetailRow

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Add StopDetailRow sub-component**

```tsx
import { ColorPicker } from "@/components/ui/color-picker"

function StopDetailRow({
  stop,
  canDelete,
  onChange,
  onDelete,
}: {
  stop: GradientStop
  canDelete: boolean
  onChange: (next: GradientStop) => void
  onDelete: () => void
}) {
  return (
    <div
      className="flex items-center gap-2"
      data-slot="gradient-editor-detail-row"
    >
      <ColorPicker
        value={stop.color}
        onChange={(next) => onChange({ ...stop, color: next })}
      />
      <input
        type="number"
        min={0}
        max={100}
        value={Math.round(stop.position)}
        onChange={(e) =>
          onChange({
            ...stop,
            position: Math.max(0, Math.min(100, Number.parseInt(e.target.value, 10) || 0)),
          })
        }
        className="h-7 w-16 rounded border bg-background px-2 font-mono text-xs"
        aria-label="Stop position"
      />
      <span className="font-mono text-xs text-muted-foreground">%</span>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label="Delete stop"
        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition hover:border-white/25 hover:text-foreground disabled:opacity-30 disabled:hover:border-current disabled:hover:text-current"
        data-slot="gradient-editor-delete-stop"
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add StopDetailRow reusing ColorPicker from sibling registry item"
```

---

### Task 18: StopTrack with draggable handles

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Add StopTrack + GradientPreview sub-components**

```tsx
function GradientPreview({
  state,
  selectedIndex,
  onSelectStop,
  onMoveStop,
  onAddStop,
  maxStops,
}: {
  state: InternalState
  selectedIndex: number
  onSelectStop: (i: number) => void
  onMoveStop: (i: number, position: number) => void
  onAddStop: (position: number) => void
  maxStops: number
}) {
  // Always render as horizontal linear during editing so the 1D stop track makes sense.
  const previewBg = formatGradient({
    ...state,
    type: "linear",
    angle: 90,
  })
  const handleTrackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (state.stops.length >= maxStops) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pct = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    )
    onAddStop(Math.round(pct))
  }
  return (
    <div className="flex flex-col gap-1" data-slot="gradient-editor-preview">
      <div
        className="relative h-20 w-full rounded border"
        style={{ background: previewBg }}
        data-slot="gradient-editor-track"
        onPointerDown={handleTrackPointer}
      >
        {state.stops.map((stop, i) => (
          <button
            key={`${i}-${stop.position}`}
            type="button"
            aria-label={`Stop ${i + 1} at ${Math.round(stop.position)}%`}
            onClick={() => onSelectStop(i)}
            onPointerDown={(event) => {
              event.stopPropagation()
              event.currentTarget.setPointerCapture(event.pointerId)
              onSelectStop(i)
            }}
            onPointerMove={(event) => {
              if (event.buttons) {
                const trackRect =
                  event.currentTarget.parentElement!.getBoundingClientRect()
                const pct = Math.max(
                  0,
                  Math.min(
                    100,
                    ((event.clientX - trackRect.left) / trackRect.width) * 100,
                  ),
                )
                onMoveStop(i, Math.round(pct))
              }
            }}
            className={cn(
              "absolute bottom-1 h-4 w-4 -translate-x-1/2 cursor-grab rounded-sm border-2 border-white shadow ring-1 ring-black/40 transition",
              i === selectedIndex && "ring-2 ring-primary scale-110",
            )}
            style={{
              left: `${stop.position}%`,
              backgroundColor: stop.color,
            }}
            data-slot="gradient-editor-handle"
            data-selected={i === selectedIndex || undefined}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add GradientPreview pane with draggable stop handles"
```

---

## Phase 5 — Wire popover + emit logic

### Task 19: Internal state + lastEmittedRef hybrid pattern

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Replace the shell `GradientEditor` body with full state-management**

Replace the entire `GradientEditor` function body with:

```tsx
export function GradientEditor<TType extends GradientType | undefined>({
  value,
  onChange,
  type: typeProp,
  maxStops = 8,
  className,
  "aria-label": ariaLabel = "Edit gradient",
}: GradientEditorProps<TType>) {
  const parsedFromValue = parseGradient(value)

  // Internal state mirrors color-picker's hybrid pattern. We do NOT derive
  // marker/handle positions from each re-parse of `value`, because round-tripping
  // through CSS gradient strings rounds sub-percent positions/angles to integers.
  const [internal, setInternal] = useState<InternalState>(
    () =>
      parsedFromValue ?? {
        type: "linear",
        stops: [
          { color: "#000000", position: 0 },
          { color: "#ffffff", position: 100 },
        ],
        angle: 90,
        shape: "ellipse",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        fromAngle: 0,
        interpolation: { space: "oklch" },
      },
  )
  const [selectedStopIndex, setSelectedStopIndex] = useState(0)
  const lastEmittedRef = useRef<string | null>(null)

  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseGradient(value)
    if (parsed) setInternal(parsed)
  }, [value])

  if (!parsedFromValue) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-5 w-12 rounded border bg-muted",
          className,
        )}
        style={{ backgroundColor: value }}
        data-slot="gradient-editor-fallback"
      />
    )
  }

  const activeType: GradientType = typeProp ?? internal.type
  const showTypeSwitcher = typeProp == null

  const emit = (next: InternalState) => {
    setInternal(next)
    const formatted = formatGradient(next)
    lastEmittedRef.current = formatted
    onChange(formatted as Parameters<typeof onChange>[0])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "h-5 w-12 shrink-0 cursor-pointer rounded border outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          style={{ background: value }}
          data-slot="gradient-editor-trigger"
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-fit min-w-[320px] p-3"
        align="start"
        data-slot="gradient-editor"
      >
        <div className="flex flex-col gap-3">
          {showTypeSwitcher && (
            <TypeSwitcher
              type={activeType}
              onChange={(next) => emit({ ...internal, type: next })}
            />
          )}
          <GradientPreview
            state={{ ...internal, type: activeType }}
            selectedIndex={selectedStopIndex}
            onSelectStop={setSelectedStopIndex}
            onMoveStop={(i, position) => {
              const stops = internal.stops.map((s, idx) =>
                idx === i ? { ...s, position } : s,
              )
              emit({ ...internal, stops })
            }}
            onAddStop={(position) => {
              if (internal.stops.length >= maxStops) return
              // Pick interpolated color from neighbors; fallback to last stop's color.
              const newColor =
                internal.stops[internal.stops.length - 1]?.color ?? "#000000"
              const stops = [
                ...internal.stops,
                { color: newColor, position },
              ].sort((a, b) => a.position - b.position)
              setSelectedStopIndex(
                stops.findIndex((s) => s.position === position),
              )
              emit({ ...internal, stops })
            }}
            maxStops={maxStops}
          />
          <StopDetailRow
            stop={internal.stops[selectedStopIndex] ?? internal.stops[0]}
            canDelete={internal.stops.length > 2}
            onChange={(next) => {
              const stops = internal.stops.map((s, idx) =>
                idx === selectedStopIndex ? next : s,
              )
              emit({ ...internal, stops })
            }}
            onDelete={() => {
              if (internal.stops.length <= 2) return
              const stops = internal.stops.filter(
                (_, idx) => idx !== selectedStopIndex,
              )
              setSelectedStopIndex(Math.max(0, selectedStopIndex - 1))
              emit({ ...internal, stops })
            }}
          />
          {activeType === "linear" && (
            <LinearControls
              angle={internal.angle}
              onChange={(angle) => emit({ ...internal, angle })}
            />
          )}
          {activeType === "radial" && (
            <RadialControls
              state={{
                shape: internal.shape,
                size: internal.size,
                position: internal.position,
              }}
              onChange={(partial) => emit({ ...internal, ...partial })}
            />
          )}
          {activeType === "conic" && (
            <ConicControls
              fromAngle={internal.fromAngle}
              position={internal.position}
              onChange={(partial) => emit({ ...internal, ...partial })}
            />
          )}
          <InterpolationPicker
            space={internal.interpolation.space}
            hueMethod={internal.interpolation.hueMethod}
            onSpaceChange={(space) =>
              emit({
                ...internal,
                interpolation: { ...internal.interpolation, space },
              })
            }
            onHueMethodChange={(hueMethod) =>
              emit({
                ...internal,
                interpolation: { ...internal.interpolation, hueMethod },
              })
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

Add imports at top:

```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
```

- [ ] **Step 2: Drop the temporary `export` keywords from sub-components**

Search for `export function (InterpolationPicker|AngleDial|LinearControls|PositionPicker|RadialControls|ConicControls|TypeSwitcher|StopDetailRow|GradientPreview)` and remove the `export` keyword. They're consumed by the main component now.

- [ ] **Step 3: Run typecheck + tests**

```bash
pnpm typecheck && pnpm test
```

Expected: PASS (the test from Task 12 about trigger should still pass since the trigger structure is preserved).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Wire GradientEditor popover with internal state hybrid pattern"
```

---

### Task 20: Component interaction tests

**Files:**
- Modify: `tests/gradient-editor.test.tsx`

- [ ] **Step 1: Append interaction tests**

```tsx
import { fireEvent } from "@testing-library/react"
import { vi } from "vitest"

describe("GradientEditor popover interactions", () => {
  it("hides type switcher when `type` prop is set", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        type="linear"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector(
      '[data-slot="gradient-editor-types"]',
    )
    expect(switcher).toBeNull()
  })

  it("shows type switcher when `type` prop is unset", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector(
      '[data-slot="gradient-editor-types"]',
    )
    expect(switcher).toBeTruthy()
  })

  it("fires onChange when switching gradient type", () => {
    const onChange = vi.fn()
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        onChange={onChange}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const tabs = document.querySelectorAll('[role="tab"]')
    const radialTab = Array.from(tabs).find(
      (t) => t.textContent === "radial",
    ) as HTMLElement
    fireEvent.click(radialTab)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0]).toMatch(/^radial-gradient\(/)
  })

  it("renders one handle per stop", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const handles = document.querySelectorAll(
      '[data-slot="gradient-editor-handle"]',
    )
    expect(handles.length).toBe(3)
  })

  it("disables delete button when at min 2 stops", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000 0%, #0000ff 100%)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const deleteBtn = document.querySelector(
      '[data-slot="gradient-editor-delete-stop"]',
    ) as HTMLButtonElement
    expect(deleteBtn.disabled).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
pnpm test tests/gradient-editor.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add GradientEditor popover interaction tests"
```

---

## Phase 6 — Barrel + registry

### Task 21: Barrel `index.ts`

**Files:**
- Modify: `src/components/ui/gradient-editor/index.ts`

- [ ] **Step 1: Replace barrel content**

```ts
export type { GradientEditorProps } from "./gradient-editor"
export { GradientEditor, isGradientString } from "./gradient-editor"
export type {
  ConicGradientString,
  GradientStop,
  GradientString,
  GradientStringMap,
  GradientType,
  GradientTypeOf,
  InterpolationHueMethod,
  InterpolationOf,
  InterpolationSpace,
  LinearGradientString,
  PolarSpace,
  RadialGradientString,
} from "./gradient-editor.types"
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add gradient-editor barrel index"
```

---

### Task 22: Add to `registry.json`

**Files:**
- Modify: `registry.json`

- [ ] **Step 1: Append the gradient-editor item to the `items` array**

```json
{
  "name": "gradient-editor",
  "type": "registry:ui",
  "title": "Gradient Editor",
  "description": "Linear / radial / conic gradient editor with draggable stops, position picker, oklch-default interpolation, and reusable color-picker stops.",
  "registryDependencies": ["button", "popover", "color-picker"],
  "dependencies": [],
  "files": [
    {
      "path": "src/components/ui/gradient-editor/index.ts",
      "type": "registry:ui",
      "target": "components/ui/gradient-editor/index.ts"
    },
    {
      "path": "src/components/ui/gradient-editor/gradient-editor.tsx",
      "type": "registry:ui",
      "target": "components/ui/gradient-editor/gradient-editor.tsx"
    },
    {
      "path": "src/components/ui/gradient-editor/gradient-editor.types.ts",
      "type": "registry:ui",
      "target": "components/ui/gradient-editor/gradient-editor.types.ts"
    }
  ]
}
```

- [ ] **Step 2: Run registry build**

```bash
pnpm registry:build
```

Expected: emits `public/r/gradient-editor.json` alongside the existing `color-picker.json`.

- [ ] **Step 3: Verify output**

```bash
ls public/r/
```

Expected: `color-picker.json`, `gradient-editor.json`, `registry.json` (index).

- [ ] **Step 4: Commit**

```bash
git add registry.json
git commit -m "Register gradient-editor item with cross-registry color-picker dep"
```

> **Note:** If `pnpm registry:build` fails on the `"color-picker"` bare-name registryDependency (shadcn 4 might require a URL for cross-registry deps), fall back to documenting the requirement in the install instructions and pre-installing color-picker. Update the description in the README accordingly.

---

### Task 23: Verify Vite build copies gradient-editor.json to dist/

**Files:**
- No file edits — verification only

- [ ] **Step 1: Run full build**

```bash
pnpm build
```

- [ ] **Step 2: Verify dist contents**

```bash
ls dist/r/
```

Expected: `color-picker.json`, `gradient-editor.json`, `registry.json`.

- [ ] **Step 3: No commit needed (no file changes)**

---

## Phase 7 — Demo app

### Task 24: basic-usage example

**Files:**
- Create: `src/examples/gradient-editor/basic-usage.tsx`

- [ ] **Step 1: Write the example**

```tsx
import { useState } from "react"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { CopyButton } from "../color-picker/copy-button"

export function BasicUsage() {
  const [grad, setGrad] = useState<string>(
    "linear-gradient(45deg, oklch(0.628 0.258 29.234), oklch(0.622 0.214 259.815))",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> auto-type
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Basic Usage</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Type unset → switcher visible → onChange emits whichever type the user
        last selected.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <GradientEditor value={grad} onChange={setGrad} />
        <code className="flex-1 truncate text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {grad}
        </code>
        <CopyButton value={grad} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Add basic-usage example for GradientEditor"
```

---

### Task 25: type-locked example

**Files:**
- Create: `src/examples/gradient-editor/type-locked.tsx`

- [ ] **Step 1: Write the example**

```tsx
import { useState } from "react"
import {
  type GradientType,
  GradientEditor,
  type GradientStringMap,
} from "@/components/ui/gradient-editor"
import { CopyButton } from "../color-picker/copy-button"

const TYPES: readonly GradientType[] = ["linear", "radial", "conic"] as const

function TypeCard<T extends GradientType>({ type }: { type: T }) {
  const initial: Record<GradientType, string> = {
    linear: "linear-gradient(45deg, #ff0000, #0000ff)",
    radial: "radial-gradient(circle at 50% 50%, #ff0000, #0000ff)",
    conic: "conic-gradient(from 0deg at 50% 50%, #ff0000, #0000ff)",
  }
  const [grad, setGrad] = useState<GradientStringMap[T]>(
    initial[type] as GradientStringMap[T],
  )
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <span className="text-gradient">→</span> {type}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <GradientEditor<T>
          value={grad}
          type={type}
          onChange={(next) => setGrad(next as GradientStringMap[T])}
        />
        <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
          {grad}
        </code>
        <CopyButton value={grad} />
      </div>
    </div>
  )
}

export function TypeLocked() {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> type-locked
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Type-Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Setting <code className="text-foreground">type</code> hides the
        switcher and locks <code className="text-foreground">onChange</code> to
        that gradient flavor.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TYPES.map((t) => (
          <TypeCard key={t} type={t} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Add type-locked example with all 3 gradient flavors"
```

---

### Task 26: stops-control example

**Files:**
- Create: `src/examples/gradient-editor/stops-control.tsx`

- [ ] **Step 1: Write the example**

```tsx
import { useState } from "react"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { CopyButton } from "../color-picker/copy-button"

export function StopsControl() {
  const [tight, setTight] = useState<string>(
    "linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
  )
  const [loose, setLoose] = useState<string>(
    "linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #88ff00, #00ff00, #00ff88, #00ffff, #0088ff, #0000ff)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> maxStops
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Stops Control</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        The <code className="text-foreground">maxStops</code> prop caps how
        many stops the editor will allow. Min 2 is always enforced.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
            <span className="text-gradient">→</span> maxStops=3
          </div>
          <div className="flex items-center gap-2">
            <GradientEditor value={tight} maxStops={3} onChange={setTight} />
            <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
              {tight}
            </code>
            <CopyButton value={tight} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
            <span className="text-gradient">→</span> maxStops=12
          </div>
          <div className="flex items-center gap-2">
            <GradientEditor value={loose} maxStops={12} onChange={setLoose} />
            <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
              {loose}
            </code>
            <CopyButton value={loose} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Add stops-control example showing maxStops prop"
```

---

### Task 27: interpolation example

**Files:**
- Create: `src/examples/gradient-editor/interpolation.tsx`

- [ ] **Step 1: Write the example**

```tsx
import { useState } from "react"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { CopyButton } from "../color-picker/copy-button"

export function Interpolation() {
  const [srgb, setSrgb] = useState<string>(
    "linear-gradient(in srgb, 90deg, #ff0000, #0000ff)",
  )
  const [oklch, setOklch] = useState<string>(
    "linear-gradient(in oklch, 90deg, #ff0000, #0000ff)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> interpolation
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Interpolation Space</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Same red → blue stops, different interpolation spaces. <code className="text-foreground">in srgb</code> goes through a muddy gray midpoint; <code className="text-foreground">in oklch</code> stays perceptually vivid through the transition. This is the brand bias.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
            <span className="text-gradient">→</span> in srgb
          </div>
          <div className="h-20 rounded-lg border" style={{ background: srgb }} />
          <div className="mt-3 flex items-center gap-2">
            <GradientEditor value={srgb} type="linear" onChange={setSrgb} />
            <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
              {srgb}
            </code>
            <CopyButton value={srgb} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
            <span className="text-gradient">→</span> in oklch
          </div>
          <div className="h-20 rounded-lg border" style={{ background: oklch }} />
          <div className="mt-3 flex items-center gap-2">
            <GradientEditor value={oklch} type="linear" onChange={setOklch} />
            <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
              {oklch}
            </code>
            <CopyButton value={oklch} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Add interpolation example showing srgb vs oklch side-by-side"
```

---

### Task 28: api-reference example

**Files:**
- Create: `src/examples/gradient-editor/api-reference.tsx`

- [ ] **Step 1: Write the API reference component**

```tsx
export function ApiReference() {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-10">
      <Section title="Component">
        <Signature>
          {
            "<GradientEditor<TType extends GradientType | undefined>\n  value: GradientString | (string & {})\n  onChange: (next: TType extends GradientType ? GradientStringMap[TType] : GradientString) => void\n  type?: TType\n  maxStops?: number\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "GradientString | (string & {})",
              desc: "Current gradient. Any string accepted; IntelliSense suggests literal shapes.",
            },
            {
              name: "onChange",
              type: "(next) => void",
              desc: "Emits next gradient. Return type discriminated by `type` prop.",
            },
            {
              name: "type",
              type: "GradientType | undefined",
              desc: "Lock gradient type. When unset, in-popover type switcher is shown.",
            },
            {
              name: "maxStops",
              type: "number (default 8)",
              desc: "Max number of stops the editor allows. Min (2) always enforced.",
            },
            {
              name: "className",
              type: "string",
              desc: "Applied to the trigger preview swatch.",
            },
            {
              name: "aria-label",
              type: "string",
              desc: 'Trigger label. Defaults to "Edit gradient".',
            },
          ]}
        />
      </Section>

      <Section title="Runtime helpers">
        <ApiRow
          signature={
            "isGradientString(value: string): value is GradientString\nisGradientString<S extends string>(value: S): value is S & (LinearGradientString | RadialGradientString | ConicGradientString)"
          }
          desc="Runtime type guard. Narrows wide strings to GradientString."
        />
      </Section>

      <Section title="Types">
        <TypesList
          rows={[
            {
              name: "GradientString",
              desc: "Union of all suggestion-string literal types. Default `onChange` return type.",
            },
            {
              name: "GradientStringMap",
              desc: "{ linear: LinearGradientString, radial: RadialGradientString, conic: ConicGradientString }",
            },
            { name: "GradientType", desc: '"linear" | "radial" | "conic"' },
            {
              name: "GradientStop",
              desc: "{ color: ColorString, position: number }. Reuses ColorString from color-picker.",
            },
            {
              name: "InterpolationSpace",
              desc: '"srgb" | "oklch" | "oklab" | "hsl" | "hwb"',
            },
            {
              name: "InterpolationHueMethod",
              desc: '"shorter" | "longer"',
            },
            {
              name: "PolarSpace",
              desc: 'Subset of InterpolationSpace that supports hue methods: "oklch" | "hsl" | "hwb".',
            },
            {
              name: "GradientTypeOf<S>",
              desc: 'Extract the type from a gradient literal. GradientTypeOf<"linear-gradient(...)"> = "linear".',
            },
            {
              name: "InterpolationOf<S>",
              desc: 'Extract the interpolation space from a literal, if declared.',
            },
          ]}
        />
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">§</span> {title}
      </h3>
      {children}
    </div>
  )
}

function Signature({ children }: { children: string }) {
  return (
    <pre className="text-[11px] md:text-xs leading-relaxed font-mono bg-black/40 border border-white/10 p-4 rounded-lg overflow-x-auto whitespace-pre">
      {children}
    </pre>
  )
}

function ApiRow({ signature, desc }: { signature: string; desc: string }) {
  return (
    <div className="space-y-2">
      <Signature>{signature}</Signature>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function PropsTable({
  rows,
}: {
  rows: { name: string; type: string; desc: string }[]
}) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <div className="grid grid-cols-[minmax(7rem,auto)_minmax(12rem,auto)_1fr] gap-x-4 px-4 py-2 bg-black/40 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
        <div>Prop</div>
        <div>Type</div>
        <div>Description</div>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[minmax(7rem,auto)_minmax(12rem,auto)_1fr] gap-x-4 px-4 py-3 items-baseline text-sm"
          >
            <code className="font-mono text-foreground">{r.name}</code>
            <code className="font-mono text-xs text-cyan-glow break-all">
              {r.type}
            </code>
            <span className="text-muted-foreground text-sm">{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TypesList({ rows }: { rows: { name: string; desc: string }[] }) {
  return (
    <div className="rounded-lg border border-white/10 divide-y divide-white/5 overflow-hidden">
      {rows.map((r) => (
        <div
          key={r.name}
          className="grid grid-cols-1 sm:grid-cols-[minmax(10rem,auto)_1fr] gap-x-4 gap-y-1 px-4 py-3 text-sm"
        >
          <code className="font-mono text-foreground">{r.name}</code>
          <span className="text-muted-foreground">{r.desc}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Add api-reference for gradient-editor"
```

---

### Task 29: Wire new sections into `app.tsx`

**Files:**
- Modify: `src/app.tsx`

- [ ] **Step 1: Add new imports at top**

```tsx
import { BasicUsage as GradientBasicUsage } from "./examples/gradient-editor/basic-usage"
import { TypeLocked as GradientTypeLocked } from "./examples/gradient-editor/type-locked"
import { StopsControl as GradientStopsControl } from "./examples/gradient-editor/stops-control"
import { Interpolation as GradientInterpolation } from "./examples/gradient-editor/interpolation"
import { ApiReference as GradientApiReference } from "./examples/gradient-editor/api-reference"
```

- [ ] **Step 2: Add a "Gradient Editor" section after the existing Color Picker section + before the existing Types section**

Between the closing `</div>` of the color-picker examples block and the next `<SectionHeader>` (currently "Three usage tiers"), insert:

```tsx
<SectionHeader
  className="mt-32"
  eyebrow="component"
  title="Gradient Editor"
  description="Linear / radial / conic gradients with draggable stops, oklch-default interpolation, and color-picker stops via cross-registry composition."
/>
<div className="mt-12 space-y-10">
  <GradientBasicUsage />
  <GradientTypeLocked />
  <GradientStopsControl />
  <GradientInterpolation />
</div>
```

- [ ] **Step 3: Extend the API section to include the gradient-editor block**

Find the existing API section (with `<ApiReference />`) and replace with:

```tsx
<SectionHeader
  className="mt-32"
  eyebrow="api"
  title="API"
  description="Public surface — component props, runtime helpers, and the type exports. Strict validator internals are intentionally not expanded here; they read better in the source."
/>
<div className="mt-8 space-y-8">
  <div>
    <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-3">
      <span className="text-gradient">/</span> color-picker
    </div>
    <ApiReference />
  </div>
  <div>
    <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-3">
      <span className="text-gradient">/</span> gradient-editor
    </div>
    <GradientApiReference />
  </div>
</div>
```

- [ ] **Step 4: Update the Install section to show both install commands**

Replace the existing single-command install block with:

```tsx
<div className="mt-8 space-y-3">
  <div className="glass-card rounded-2xl p-6 md:p-8">
    <pre className="text-sm md:text-base font-mono overflow-x-auto">
      <span className="text-muted-foreground select-none">$ </span>
      <span className="text-foreground">npx shadcn add </span>
      <span className="text-gradient">
        https://turtiesocks.github.io/ridiculous/r/color-picker.json
      </span>
    </pre>
  </div>
  <div className="glass-card rounded-2xl p-6 md:p-8">
    <pre className="text-sm md:text-base font-mono overflow-x-auto">
      <span className="text-muted-foreground select-none">$ </span>
      <span className="text-foreground">npx shadcn add </span>
      <span className="text-gradient">
        https://turtiesocks.github.io/ridiculous/r/gradient-editor.json
      </span>
    </pre>
  </div>
</div>
```

- [ ] **Step 5: Run typecheck + tests + biome**

```bash
pnpm typecheck && pnpm test && pnpm check:fix
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Wire gradient-editor into demo app: section + API + install"
```

---

## Phase 8 — Final verification

### Task 30: Full verification + dist build

**Files:**
- No file edits — verification only

- [ ] **Step 1: Run full CI flow locally**

```bash
pnpm ci:check && pnpm typecheck && pnpm test && pnpm build
```

Expected: all four pass.

- [ ] **Step 2: Verify dist outputs**

```bash
ls dist/r/
```

Expected: `color-picker.json`, `gradient-editor.json`, `registry.json`.

- [ ] **Step 3: Local preview smoke**

Open dev server (if not already running) and visually verify the new sections render. Test:

- Open the basic-usage Gradient Editor, drag a stop handle → value updates
- Switch between linear/radial/conic via the popover tabs → onChange fires with correct prefix
- The interpolation example side-by-side shows visibly different mid-stops (oklch vivid, srgb muddy)

- [ ] **Step 4: No commit needed (verification only)**

---

## Self-review

**Spec coverage check:**

| Spec section | Plan task(s) |
|---|---|
| File layout | Task 1, Task 22 |
| Type system — suggestion strings | Task 2 |
| Type system — interpolation | Task 3 |
| Type system — utility types | Task 4 |
| Type system — GradientStop | Task 5 |
| Component API + props | Task 12, Task 19 |
| Internal state hybrid pattern | Task 19 |
| Parse pipeline | Tasks 6-9 |
| Emit pipeline | Task 10 |
| isGradientString | Task 11 |
| Popover layout — preview + track | Task 18 |
| Popover layout — stop detail row | Task 17 |
| Popover layout — type-specific controls | Tasks 14, 15, 16 |
| Popover layout — interpolation | Task 13 |
| Registry config | Task 22 |
| Demo — basic-usage | Task 24 |
| Demo — type-locked | Task 25 |
| Demo — stops-control | Task 26 |
| Demo — interpolation | Task 27 |
| Demo — api-reference | Task 28 |
| Demo — app.tsx wiring | Task 29 |
| Testing — parse | Task 6, 7, 8, 9 (tests embedded) |
| Testing — format | Task 7, 8, 10 (tests embedded) |
| Testing — component | Task 12, 20 |
| Testing — type-level | Tasks 2, 3, 4, 11 (tests embedded) |
| Final verification | Task 30 |

**Placeholder scan:** none. Every step has runnable code or exact commands.

**Type consistency:** `InternalState`, `GradientStop`, `GradientType`, `parseGradient`, `formatGradient`, `parseInterpolation`, `formatInterpolation`, `splitTopLevelCommas`, `parseStop`, `formatStop`, `isGradientString` — used consistently across tasks.

**Known caveat:** Task 22 may need adjustment if shadcn 4 doesn't support bare-name cross-registry deps. Plan addresses this with a fallback note.

**Plan size:** 30 tasks. Smaller than color-picker's 53 because the project infrastructure (Vite, TS configs, Biome, Vitest, Tailwind theme) already exists.
