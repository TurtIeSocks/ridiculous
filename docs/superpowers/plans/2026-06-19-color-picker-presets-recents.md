# ColorPicker presets + controllable history — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `presets` prop (color values or CSS vars; `undefined` = current 10 hardcoded) and a controlled/uncontrolled recents row to `ColorPicker`, typed in lockstep with `value`/`onChange`.

**Architecture:** Extract the inline `onChange` conditional into an exported `ColorValue<TMode>` alias and reuse it for the history props. Generalize the existing `preset-palette.tsx` into a reusable `SwatchRow` used for both presets and recents. CSS-var swatches display natively via `backgroundColor` and resolve to a concrete color on click via a `getComputedStyle` probe mounted inside the popover; non-var entries parse directly (lossless). Recents are stored internally as `string[]` behind a self-contained `useControllableState` hook, committed once per popover close, deduped move-to-front and capped.

**Tech Stack:** React 19, TypeScript 6, vitest 4 (jsdom + @testing-library/react), Biome, shadcn registry, pnpm.

## Global Constraints

- Package manager: **pnpm**. Test: `pnpm exec vitest run <file>`. Full test+coverage: `pnpm test:coverage`. Typecheck: `pnpm typecheck` (`tsc --noEmit -p tsconfig.app.json`). Lint/format: `pnpm exec biome check --write src/components/ui/color-picker tests`.
- Tests live in `tests/*.test.tsx` (jsdom). Use `render`/`screen`/`fireEvent` from `@testing-library/react`; `renderHook`/`act` from the same package. Globals are on (`describe`/`it`/`expect`/`vi` importable from `vitest`).
- Coverage thresholds over `src/components/ui/color-picker/**`: statements 90, branches 85, functions 90, lines 90. New code must be exercised.
- Registry self-containment: NO new external dependency. The controllable hook is local.
- All new props OPTIONAL; existing call sites (`gradient-editor`, `color-function/*`, `filter-builder`, `box-shadow-editor`) must compile and behave identically.
- TypeScript: object shapes use `interface`; conditional/union type aliases use `type`.
- Prefer `interface` for object props; the one boundary cast `as ColorValue<TMode>[]` (and the existing `as Parameters<typeof onChange>[0]`) are the only sanctioned casts.

---

### Task 1: `ColorValue<TMode>` alias + `onChange` refactor

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.types.ts` (add alias near `ColorMode`, ~line 296)
- Modify: `src/components/ui/color-picker/color-picker.tsx:33-35` (refactor `onChange`)
- Modify: `src/components/ui/color-picker/index.ts` (export `ColorValue`)
- Test: `tests/color-picker.test-d.ts` (NEW, type-level)

**Interfaces:**
- Produces: `type ColorValue<TMode extends ColorMode | undefined = undefined> = TMode extends ColorMode ? ColorStringMap[TMode] : ColorString` — consumed by Tasks 5 (history props) and the refactored `onChange`.

- [ ] **Step 1: Write the failing type test**

Create `tests/color-picker.test-d.ts`:

```ts
import { describe, expectTypeOf, it } from "vitest"
import type {
  ColorString,
  ColorValue,
  HexString,
} from "@/components/ui/color-picker/color-picker.types"

describe("ColorValue<TMode>", () => {
  it("resolves to the mode-specific string when TMode is set", () => {
    expectTypeOf<ColorValue<"hex">>().toEqualTypeOf<HexString>()
  })
  it("resolves to the broad union when TMode is undefined", () => {
    expectTypeOf<ColorValue<undefined>>().toEqualTypeOf<ColorString>()
    expectTypeOf<ColorValue>().toEqualTypeOf<ColorString>()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run tests/color-picker.test-d.ts`
Expected: FAIL — `ColorValue` is not exported from `color-picker.types`.

- [ ] **Step 3: Add the alias**

In `src/components/ui/color-picker/color-picker.types.ts`, immediately after the `export type ColorMode = keyof ColorStringMap` line:

```ts
/**
 * The value `onChange` emits and the element type of the recents `history`.
 * Mode-locked pickers narrow to the exact mode string; auto pickers widen to
 * the full `ColorString` union. Reused so onChange and history can never drift.
 */
export type ColorValue<TMode extends ColorMode | undefined = undefined> =
  TMode extends ColorMode ? ColorStringMap[TMode] : ColorString
```

- [ ] **Step 4: Refactor `onChange` to use the alias**

In `src/components/ui/color-picker/color-picker.tsx`, add `ColorValue` to the type import block (lines 18-23) and replace the `onChange` field (lines 33-35):

```ts
import type {
  ColorMode,
  ColorString,
  ColorStringMap,
  ColorValue,
  Oklch,
} from "./color-picker.types"
```

```ts
  onChange: (value: ColorValue<TMode>) => void
```

(`ColorStringMap` may now be unused in this file; if Biome flags it, drop it from the import in Step 7's lint pass.)

- [ ] **Step 5: Export the alias**

In `src/components/ui/color-picker/index.ts`, add `ColorValue,` to the `export type { ... } from "./color-picker.types"` list (alphabetical, after `ColorString`).

- [ ] **Step 6: Run the type test + typecheck**

Run: `pnpm exec vitest run tests/color-picker.test-d.ts && pnpm typecheck`
Expected: PASS, and `tsc` exits 0 (no regression in existing consumers).

- [ ] **Step 7: Lint + commit**

```bash
pnpm exec biome check --write src/components/ui/color-picker tests/color-picker.test-d.ts
git add src/components/ui/color-picker/color-picker.types.ts src/components/ui/color-picker/color-picker.tsx src/components/ui/color-picker/index.ts tests/color-picker.test-d.ts
git commit -m "refactor(color-picker): extract ColorValue<TMode> alias for onChange"
```

---

### Task 2: `useControllableState` hook

**Files:**
- Create: `src/components/ui/color-picker/color-picker.hooks.ts`
- Modify: `registry.json` (add the hooks file to the `color-picker` `files` array)
- Test: `tests/color-picker.test.tsx` (append a `describe` block)

**Interfaces:**
- Produces: `function useControllableState<T>({ prop, defaultProp, onChange }: { prop: T | undefined; defaultProp: T; onChange?: (next: T) => void }): [T, (next: T | ((prev: T) => T)) => void]` — consumed by Task 5.

- [ ] **Step 1: Write the failing tests**

At the END of `tests/color-picker.test.tsx`, first extend the existing `@testing-library/react` import to include `act` and `renderHook`:

```ts
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react"
```

Then append:

```ts
import { useControllableState } from "@/components/ui/color-picker/color-picker.hooks"

describe("useControllableState", () => {
  it("uncontrolled: owns state and notifies onChange", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState<number[]>({
        prop: undefined,
        defaultProp: [],
        onChange,
      }),
    )
    expect(result.current[0]).toEqual([])
    act(() => result.current[1]([1, 2]))
    expect(result.current[0]).toEqual([1, 2])
    expect(onChange).toHaveBeenCalledWith([1, 2])
  })

  it("controlled: does not self-update but still notifies", () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ prop }: { prop: number[] }) =>
        useControllableState<number[]>({ prop, defaultProp: [], onChange }),
      { initialProps: { prop: [1] } },
    )
    expect(result.current[0]).toEqual([1])
    act(() => result.current[1]([1, 2]))
    expect(result.current[0]).toEqual([1]) // prop still drives the value
    expect(onChange).toHaveBeenCalledWith([1, 2])
    rerender({ prop: [1, 2] })
    expect(result.current[0]).toEqual([1, 2])
  })

  it("supports a functional updater reading the previous value", () => {
    const { result } = renderHook(() =>
      useControllableState<number[]>({ prop: undefined, defaultProp: [1] }),
    )
    act(() => result.current[1]((prev) => [...prev, 2]))
    expect(result.current[0]).toEqual([1, 2])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run tests/color-picker.test.tsx -t useControllableState`
Expected: FAIL — module `color-picker.hooks` not found.

- [ ] **Step 3: Implement the hook**

Create `src/components/ui/color-picker/color-picker.hooks.ts`:

```ts
import { useCallback, useRef, useState } from "react"

interface UseControllableStateParams<T> {
  /** Controlled value. When defined, the hook does not own the state. */
  prop: T | undefined
  /** Initial value used only in uncontrolled mode. */
  defaultProp: T
  /** Fired with the next value in BOTH controlled and uncontrolled modes. */
  onChange?: (next: T) => void
}

/**
 * Minimal controlled/uncontrolled state. Self-contained (registry components
 * must not depend on @radix-ui/react-use-controllable-state). The setter is
 * stable and reads value/onChange through refs to avoid stale closures, and
 * accepts a functional updater.
 */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const [uncontrolled, setUncontrolled] = useState<T>(defaultProp)
  const isControlled = prop !== undefined
  const value = isControlled ? (prop as T) : uncontrolled

  const valueRef = useRef(value)
  valueRef.current = value
  const isControlledRef = useRef(isControlled)
  isControlledRef.current = isControlled
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    const resolved =
      typeof next === "function"
        ? (next as (prev: T) => T)(valueRef.current)
        : next
    if (!isControlledRef.current) setUncontrolled(resolved)
    onChangeRef.current?.(resolved)
  }, [])

  return [value, setValue]
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run tests/color-picker.test.tsx -t useControllableState`
Expected: PASS (3 tests).

- [ ] **Step 5: Register the file**

In `registry.json`, inside the `color-picker` item's `files` array, add (after the `color-picker.types.ts` entry):

```json
    {
      "path": "src/components/ui/color-picker/color-picker.hooks.ts",
      "type": "registry:ui",
      "target": "components/ui/color-picker/color-picker.hooks.ts"
    },
```

- [ ] **Step 6: Lint + commit**

```bash
pnpm exec biome check --write src/components/ui/color-picker tests/color-picker.test.tsx registry.json
git add src/components/ui/color-picker/color-picker.hooks.ts tests/color-picker.test.tsx registry.json
git commit -m "feat(color-picker): add self-contained useControllableState hook"
```

---

### Task 3: CSS-var + recents helpers

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.helpers.ts` (append helpers)
- Test: `tests/color-picker.test.tsx` (append a `describe` block)

**Interfaces:**
- Produces:
  - `function isCssVar(s: string): boolean`
  - `function normalizeCssVar(s: string): string` (bare `--x` → `var(--x)`, else passthrough)
  - `function resolveCssColor(raw: string, probe: HTMLElement | null): ParseResult | null`
  - `function pushRecent(prev: readonly string[], value: string, max: number): string[]`
- Consumes: existing `parseColor` and `ParseResult` from the same file.

- [ ] **Step 1: Write the failing tests**

Append to `tests/color-picker.test.tsx`:

```ts
import {
  isCssVar,
  normalizeCssVar,
  pushRecent,
  resolveCssColor,
} from "@/components/ui/color-picker/color-picker.helpers"

describe("css var helpers", () => {
  it("isCssVar detects var() and bare custom properties", () => {
    expect(isCssVar("var(--x)")).toBe(true)
    expect(isCssVar("  var( --x )")).toBe(true)
    expect(isCssVar("--x")).toBe(true)
    expect(isCssVar("#ff0000")).toBe(false)
    expect(isCssVar("oklch(0.5 0.1 240)")).toBe(false)
  })

  it("normalizeCssVar wraps bare custom properties only", () => {
    expect(normalizeCssVar("--x")).toBe("var(--x)")
    expect(normalizeCssVar("var(--x)")).toBe("var(--x)")
    expect(normalizeCssVar("#ff0000")).toBe("#ff0000")
  })

  it("resolveCssColor parses concrete colors directly (lossless, no probe)", () => {
    expect(resolveCssColor("#ff0000", null)?.mode).toBe("hex")
    expect(resolveCssColor("oklch(0.7 0.2 30)", null)?.mode).toBe("oklch")
  })

  it("resolveCssColor returns null for a css var with no probe", () => {
    expect(resolveCssColor("var(--whatever)", null)).toBeNull()
  })

  it("resolveCssColor returns null for an unresolved css var via probe", () => {
    const probe = document.createElement("span")
    document.body.appendChild(probe)
    expect(resolveCssColor("var(--nope-not-defined)", probe)).toBeNull()
    probe.remove()
  })
})

describe("pushRecent", () => {
  it("prepends new values", () => {
    expect(pushRecent(["a", "b"], "c", 8)).toEqual(["c", "a", "b"])
  })
  it("dedups by moving an existing value to the front", () => {
    expect(pushRecent(["a", "b", "c"], "b", 8)).toEqual(["b", "a", "c"])
  })
  it("caps the list length", () => {
    expect(pushRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run tests/color-picker.test.tsx -t "css var helpers"`
Expected: FAIL — helpers not exported.

- [ ] **Step 3: Implement the helpers**

Append to `src/components/ui/color-picker/color-picker.helpers.ts`:

```ts
// ---------------------------------------------------------------------------
// CSS variable presets + recents
// ---------------------------------------------------------------------------

/** True for `var(--x)` / `var( --x )` and bare `--x` custom-property refs. */
export function isCssVar(s: string): boolean {
  return /^\s*(var\(\s*--|--)/.test(s)
}

/** A bare `--x` is wrapped to `var(--x)` for use as a CSS value; else passthrough. */
export function normalizeCssVar(s: string): string {
  const trimmed = s.trim()
  return trimmed.startsWith("--") ? `var(${trimmed})` : s
}

/**
 * Resolve a preset/recent entry to a concrete color.
 * - Concrete colors parse directly (lossless; preserves wide-gamut oklch).
 * - CSS vars need the live cascade: set them on a mounted `probe` element and
 *   read the browser-serialized computed `color`, then parse that. Returns null
 *   when unresolvable (undefined var, no probe / server render). parseColor has
 *   no `color()` branch, so wide-gamut P3 tokens resolve to null by design.
 */
export function resolveCssColor(
  raw: string,
  probe: HTMLElement | null,
): ParseResult | null {
  if (!isCssVar(raw)) return parseColor(raw)
  if (!probe) return null
  probe.style.color = normalizeCssVar(raw)
  const resolved = getComputedStyle(probe).color
  probe.style.color = ""
  return resolved ? parseColor(resolved) : null
}

/** Prepend `value`, drop any prior copy (move-to-front dedup), cap at `max`. */
export function pushRecent(
  prev: readonly string[],
  value: string,
  max: number,
): string[] {
  return [value, ...prev.filter((c) => c !== value)].slice(0, max)
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run tests/color-picker.test.tsx -t "css var helpers" && pnpm exec vitest run tests/color-picker.test.tsx -t pushRecent`
Expected: PASS.

- [ ] **Step 5: Lint + commit**

```bash
pnpm exec biome check --write src/components/ui/color-picker tests/color-picker.test.tsx
git add src/components/ui/color-picker/color-picker.helpers.ts tests/color-picker.test.tsx
git commit -m "feat(color-picker): add cssvar resolution + pushRecent helpers"
```

---

### Task 4: `SwatchRow` + `presets` prop

**Files:**
- Create: `src/components/ui/color-picker/swatch-row.tsx`
- Delete: `src/components/ui/color-picker/preset-palette.tsx`
- Modify: `src/components/ui/color-picker/color-picker.tsx` (imports, `presets` prop, probe ref, click handler, render presets via `SwatchRow`)
- Modify: `registry.json` (rename `preset-palette.tsx` → `swatch-row.tsx`)
- Test: `tests/color-picker.test.tsx` (append)

**Interfaces:**
- Produces:
  - `interface SwatchEntry { value: string; label: string }`
  - `function SwatchRow({ entries, onPick, ariaLabelPrefix, dataSlot }: SwatchRowProps): JSX.Element | null` where `SwatchRowProps` is `{ entries: ReadonlyArray<SwatchEntry>; onPick: (value: string) => void; ariaLabelPrefix: string; dataSlot: string }`
  - `presets?: ReadonlyArray<ColorString | (string & {})>` on `ColorPickerProps`
- Consumes: `resolveCssColor`, `normalizeCssVar` (Task 3); `PRESETS` (constants).

- [ ] **Step 1: Write the failing tests**

Append to `tests/color-picker.test.tsx`:

```ts
import { SwatchRow } from "@/components/ui/color-picker/swatch-row"

describe("SwatchRow", () => {
  it("returns null for empty entries", () => {
    const { container } = render(
      <SwatchRow
        entries={[]}
        onPick={() => {}}
        ariaLabelPrefix="preset"
        dataSlot="color-picker-presets"
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders one swatch per entry and fires onPick with the raw value", () => {
    const onPick = vi.fn()
    render(
      <SwatchRow
        entries={[{ value: "#ff0000", label: "red" }]}
        onPick={onPick}
        ariaLabelPrefix="preset"
        dataSlot="color-picker-presets"
      />,
    )
    fireEvent.click(screen.getByLabelText("preset red"))
    expect(onPick).toHaveBeenCalledWith("#ff0000")
  })
})

describe("ColorPicker presets prop", () => {
  function open() {
    fireEvent.click(
      document.querySelector('[data-slot="color-picker-trigger"]') as HTMLElement,
    )
  }

  it("renders the default 10-swatch palette when presets is omitted", () => {
    render(<ColorPicker value="oklch(0.6 0.1 240)" onChange={() => {}} />)
    open()
    const row = document.querySelector('[data-slot="color-picker-presets"]')
    expect(row?.querySelectorAll("button").length).toBe(10)
    expect(screen.getByLabelText("preset red")).toBeTruthy()
  })

  it("renders supplied presets and emits the resolved color on click", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker
        value="oklch(0.6 0.1 240)"
        presets={["#ff0000"]}
        onChange={onChange}
      />,
    )
    open()
    expect(
      document
        .querySelector('[data-slot="color-picker-presets"]')
        ?.querySelectorAll("button").length,
    ).toBe(1)
    fireEvent.click(screen.getByLabelText("preset #ff0000"))
    expect(onChange).toHaveBeenCalled()
    // active mode is oklch (detected from value); resolved red emits oklch
    expect(String(onChange.mock.calls.at(-1)?.[0])).toMatch(/^oklch\(/)
  })

  it("renders no preset row for an empty presets array", () => {
    render(
      <ColorPicker value="oklch(0.6 0.1 240)" presets={[]} onChange={() => {}} />,
    )
    open()
    expect(
      document.querySelector('[data-slot="color-picker-presets"]'),
    ).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run tests/color-picker.test.tsx -t "SwatchRow"`
Expected: FAIL — `swatch-row` module not found.

- [ ] **Step 3: Create `SwatchRow`**

Create `src/components/ui/color-picker/swatch-row.tsx`:

```tsx
import { normalizeCssVar } from "./color-picker.helpers"

export interface SwatchEntry {
  value: string
  label: string
}

export interface SwatchRowProps {
  entries: ReadonlyArray<SwatchEntry>
  onPick: (value: string) => void
  ariaLabelPrefix: string
  dataSlot: string
}

export function SwatchRow({
  entries,
  onPick,
  ariaLabelPrefix,
  dataSlot,
}: SwatchRowProps) {
  if (entries.length === 0) return null
  return (
    <div
      data-slot={dataSlot}
      className="flex w-full flex-1 flex-wrap items-center justify-evenly gap-1.5"
    >
      {entries.map((entry, i) => (
        <button
          key={`${entry.value}-${i}`}
          type="button"
          aria-label={`${ariaLabelPrefix} ${entry.label}`}
          onClick={() => onPick(entry.value)}
          className="h-5 w-5 shrink-0 cursor-pointer rounded border transition hover:scale-110"
          style={{ backgroundColor: normalizeCssVar(entry.value) }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Wire presets into `ColorPicker`**

In `src/components/ui/color-picker/color-picker.tsx`:

(a) Replace the preset-palette import (line 27) and extend helper/constants imports:

```ts
import {
  formatColor,
  formatHex,
  parseColor,
  parseHex,
  resolveCssColor,
  srgbToOklch,
} from "./color-picker.helpers"
import { PRESETS } from "./color-picker.constants"
import { SwatchRow, type SwatchEntry } from "./swatch-row"
```

(b) Add the `presets` prop to `ColorPickerProps` (after `"aria-label"?`):

```ts
  /**
   * Preset swatches. Each entry is a color value OR a CSS variable
   * (`"var(--color-primary)"` or bare `"--color-primary"`). `undefined` →
   * the built-in palette; `[]` → no preset row. NOTE: this project's Tailwind
   * v4 theme tokens are `--color-*`; pass the full name. A CSS-var entry must
   * resolve to an sRGB-representable color (wide-gamut P3 tokens are skipped).
   */
  presets?: ReadonlyArray<ColorString | (string & {})>
```

(c) Destructure `presets` in the component signature (alongside `native`, etc.).

(d) Add a probe ref next to the other refs (after `const lastEmittedRef = ...`):

```ts
  const probeRef = useRef<HTMLSpanElement>(null)
```

(e) After the `emit` definition, add the string-pick handler and preset entries:

```ts
  const handlePickString = (raw: string) => {
    const result = resolveCssColor(raw, probeRef.current)
    if (result) emit(result.oklch)
  }

  const presetEntries: SwatchEntry[] =
    presets === undefined
      ? PRESETS.map((p) => ({
          value: `oklch(${p.l} ${p.c} ${p.h})`,
          label: p.name,
        }))
      : presets.map((p) => ({ value: p, label: p }))
```

(f) Replace the eyedropper/presets row (the `<div className="flex items-center gap-1.5">...<PresetPalette onPick={emit} />...</div>` block) with a guarded version that renders `SwatchRow`, and add the probe span at the end of the `flex-col` wrapper:

```tsx
          {(hasEyeDropper || presetEntries.length > 0) && (
            <div className="flex items-center gap-1.5">
              {hasEyeDropper && (
                <button
                  type="button"
                  onClick={handleEyeDropper}
                  aria-label="Pick color from screen"
                  data-slot="color-picker-eyedropper"
                  className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border bg-muted/40 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                    aria-hidden="true"
                  >
                    <path d="m11.5 1.5 3 3-2 2-3-3z" />
                    <path d="m9.5 3.5-7 7v3h3l7-7" />
                  </svg>
                </button>
              )}
              <SwatchRow
                entries={presetEntries}
                onPick={handlePickString}
                ariaLabelPrefix="preset"
                dataSlot="color-picker-presets"
              />
            </div>
          )}
```

And just before the closing `</div>` of the `flex flex-col gap-3` wrapper, add:

```tsx
          <span
            ref={probeRef}
            aria-hidden="true"
            style={{ position: "absolute", height: 0, width: 0, overflow: "hidden" }}
          />
```

- [ ] **Step 5: Delete the old palette + check for stragglers**

```bash
grep -rn "preset-palette\|PresetPalette" src tests || echo "no references"
rm src/components/ui/color-picker/preset-palette.tsx
```

Expected: the only matches before deletion are the import you just replaced; after `rm`, none remain.

- [ ] **Step 6: Rename the registry entry**

In `registry.json`, change the `preset-palette.tsx` file object to:

```json
    {
      "path": "src/components/ui/color-picker/swatch-row.tsx",
      "type": "registry:ui",
      "target": "components/ui/color-picker/swatch-row.tsx"
    }
```

- [ ] **Step 7: Run tests + typecheck**

Run: `pnpm exec vitest run tests/color-picker.test.tsx && pnpm typecheck`
Expected: PASS (new SwatchRow + presets tests green, existing tests still green, `tsc` exit 0).

- [ ] **Step 8: Lint + commit**

```bash
pnpm exec biome check --write src/components/ui/color-picker tests/color-picker.test.tsx registry.json
git add -A src/components/ui/color-picker tests/color-picker.test.tsx registry.json
git commit -m "feat(color-picker): presets prop + reusable SwatchRow (cssvar-aware)"
```

---

### Task 5: Controllable recents (history) + commit-on-close

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.constants.ts` (add `MAX_RECENTS`)
- Modify: `src/components/ui/color-picker/color-picker.tsx` (history props, popover open state, commit-on-close, recents row)
- Test: `tests/color-picker.test.tsx` (append)

**Interfaces:**
- Consumes: `useControllableState` (Task 2), `pushRecent` (Task 3), `SwatchRow` (Task 4), `ColorValue` (Task 1).
- Produces: `history?`, `defaultHistory?`, `onHistoryChange?` on `ColorPickerProps`; a recents `SwatchRow` with `data-slot="color-picker-recents"`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/color-picker.test.tsx`:

```ts
describe("ColorPicker recents", () => {
  const trigger = () =>
    document.querySelector('[data-slot="color-picker-trigger"]') as HTMLElement

  it("records a recent on popover close and shows it on reopen (uncontrolled)", () => {
    render(<ColorPicker value="oklch(0.6 0.1 240)" onChange={() => {}} />)
    fireEvent.click(trigger()) // open
    fireEvent.click(screen.getByLabelText("preset red")) // pick -> pending
    fireEvent.click(trigger()) // close -> commit
    fireEvent.click(trigger()) // reopen
    const row = document.querySelector('[data-slot="color-picker-recents"]')
    expect(row?.querySelectorAll("button").length).toBe(1)
  })

  it("does not record a recent when opened without editing", () => {
    render(<ColorPicker value="oklch(0.6 0.1 240)" onChange={() => {}} />)
    fireEvent.click(trigger()) // open
    fireEvent.click(trigger()) // close, no edit
    fireEvent.click(trigger()) // reopen
    expect(
      document.querySelector('[data-slot="color-picker-recents"]'),
    ).toBeNull()
  })

  it("renders controlled history and calls onHistoryChange on close", () => {
    const onHistoryChange = vi.fn()
    render(
      <ColorPicker
        value="oklch(0.6 0.1 240)"
        history={["oklch(0.7 0.2 30)"]}
        onHistoryChange={onHistoryChange}
        onChange={() => {}}
      />,
    )
    fireEvent.click(trigger()) // open
    expect(
      document
        .querySelector('[data-slot="color-picker-recents"]')
        ?.querySelectorAll("button").length,
    ).toBe(1) // from controlled prop
    fireEvent.click(screen.getByLabelText("preset red")) // pick -> pending
    fireEvent.click(trigger()) // close -> commit -> notify
    expect(onHistoryChange).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run tests/color-picker.test.tsx -t "ColorPicker recents"`
Expected: FAIL — no `color-picker-recents` slot / props don't exist.

- [ ] **Step 3: Add the cap constant**

Append to `src/components/ui/color-picker/color-picker.constants.ts`:

```ts
/** Max recents kept in the history row (fits one popover-width swatch row). */
export const MAX_RECENTS = 8
```

- [ ] **Step 4: Wire recents into `ColorPicker`**

In `src/components/ui/color-picker/color-picker.tsx`:

(a) Extend imports:

```ts
import { MAX_RECENTS, PRESETS } from "./color-picker.constants"
import { useControllableState } from "./color-picker.hooks"
import {
  formatColor,
  formatHex,
  parseColor,
  parseHex,
  pushRecent,
  resolveCssColor,
  srgbToOklch,
} from "./color-picker.helpers"
```

(b) Add history props to `ColorPickerProps` (after `presets`):

```ts
  /** Controlled recents. When provided, the component does not own this state. */
  history?: ReadonlyArray<ColorValue<TMode>>
  /** Uncontrolled initial recents. Ignored when `history` is provided. */
  defaultHistory?: ReadonlyArray<ColorValue<TMode>>
  /**
   * Fired when recents change (a color committed on popover close). Fires in
   * both modes. Passing `history` without `onHistoryChange` yields a frozen,
   * read-only recents row.
   */
  onHistoryChange?: (history: ColorValue<TMode>[]) => void
```

(c) Destructure `history`, `defaultHistory`, `onHistoryChange` in the signature.

(d) Add state/hook next to the other top-level hooks (after `hasEyeDropper`):

```ts
  const [open, setOpen] = useState(false)
  const pendingRef = useRef<string | null>(null)
  // History is stored internally as string[]; every ColorValue<TMode> member is
  // a string, so the single boundary cast below is sound.
  const [recents, setRecents] = useControllableState<readonly string[]>({
    prop: history as readonly string[] | undefined,
    defaultProp: (defaultHistory as readonly string[] | undefined) ?? [],
    onChange: onHistoryChange as ((next: readonly string[]) => void) | undefined,
  })
```

(e) In `emit`, record the session-pending value (add one line after `lastEmittedRef.current = formatted`):

```ts
    lastEmittedRef.current = formatted
    pendingRef.current = formatted
```

(f) After `emit`, add the open/commit handlers:

```ts
  const commitRecent = (formatted: string) => {
    setRecents((prev) => pushRecent(prev, formatted, MAX_RECENTS))
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      pendingRef.current = null // start a fresh session
      return
    }
    if (pendingRef.current) {
      commitRecent(pendingRef.current)
      pendingRef.current = null
    }
  }
```

(g) Make the popover controlled — change `<Popover>` to:

```tsx
    <Popover open={open} onOpenChange={handleOpenChange}>
```

(h) Render the recents row directly after the presets row block:

```tsx
          <SwatchRow
            entries={recents.map((c) => ({ value: c, label: c }))}
            onPick={handlePickString}
            ariaLabelPrefix="recent"
            dataSlot="color-picker-recents"
          />
```

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm exec vitest run tests/color-picker.test.tsx && pnpm typecheck`
Expected: PASS (recents tests green, existing/native/fallback tests still green, `tsc` exit 0).

> If the radix trigger toggle does not close in jsdom (recents tests time out), fall back to firing close via the content's escape handler: `fireEvent.keyDown(document.querySelector('[data-slot="color-picker"]')!, { key: "Escape" })`. Keep the trigger-toggle form if it passes.

- [ ] **Step 6: Lint + commit**

```bash
pnpm exec biome check --write src/components/ui/color-picker tests/color-picker.test.tsx
git add src/components/ui/color-picker/color-picker.tsx src/components/ui/color-picker/color-picker.constants.ts tests/color-picker.test.tsx
git commit -m "feat(color-picker): controllable recents with commit-on-close"
```

---

### Task 6: Full verification + cssvar manual check

**Files:** none (verification only) — plus optional example, see Step 4.

- [ ] **Step 1: Run the full gate in parallel**

Run (single batch): `pnpm typecheck` · `pnpm check` · `pnpm test:coverage`
Expected: typecheck exit 0; Biome clean; all tests pass; coverage over `color-picker/**` meets 90/85/90/90.

- [ ] **Step 2: If coverage dips below threshold**

Identify the uncovered lines from the v8 report (`coverage/index.html`) and add targeted tests to `tests/color-picker.test.tsx` for the specific branch (most likely an unexercised `resolveCssColor`/`emit` path). Re-run `pnpm test:coverage`. Commit any added tests.

- [ ] **Step 3: Manual cssvar verification (browser — jsdom can't resolve `var()`)**

Start the preview server and confirm a CSS-var preset both displays and resolves on click:

```tsx
<ColorPicker
  value="oklch(0.6 0.1 240)"
  presets={["var(--color-primary)", "#ff0000", "oklch(0.7 0.2 150)"]}
  onChange={(c) => console.log(c)}
/>
```

Verify via Claude Preview: the `--color-primary` swatch paints the theme color; clicking it logs a concrete (non-`var`) color string in the active mode; the recents row appears after closing the popover.

- [ ] **Step 4 (optional): Demo example**

If demoing the new props is wanted, add `src/examples/color-picker/presets-and-recents.tsx` following the existing `src/examples/color-picker/basic-usage.tsx` pattern, and register it on the docs page. Out of the core spec scope — skip unless requested.

- [ ] **Step 5: Final confirmation**

Confirm `git status` is clean and all six commits are present:

```bash
git log --oneline -6
git status
```

---

## Self-Review

**Spec coverage:**
- `ColorValue<TMode>` alias + `onChange` refactor + export → Task 1. ✓
- `presets` prop (undefined default / `[]` / list; `ColorString | (string & {})`) → Task 4. ✓
- CSS-var display (native `backgroundColor`) + click resolution (parseColor-first, probe for vars) → Tasks 3 (helper) + 4 (probe wiring). ✓
- Click-emit in active mode via `emit` → Task 4 (`handlePickString`). ✓
- Controlled + uncontrolled history typed via `ColorValue<TMode>` → Tasks 1 + 5. ✓
- `useControllableState` (self-contained, no dep) → Task 2. ✓
- Internal `string[]` storage + single boundary cast → Task 5 (step 4d). ✓
- Commit-on-close, `openValueRef`/pending guard, dedup (raw string, move-to-front), cap 8 → Tasks 3 (`pushRecent`) + 5. ✓
- `SwatchRow` reused for both rows, `null` when empty, empty-row guard → Task 4. ✓
- Recents below presets, `data-slot` hooks, aria-labels → Tasks 4 + 5. ✓
- Registry updates (rename + new hook file) → Tasks 2 + 4. ✓
- jsdom spec for logic; browser for cssvar → Tasks 2/3/4/5 (jsdom) + Task 6 step 3 (browser). ✓
- Backward compat (4 consumers compile) → Task 1 step 6 typecheck + Task 6. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; commands have expected output. ✓

**Type consistency:** `useControllableState` signature identical in Tasks 2 and 5; `resolveCssColor(raw, probe)` identical in Tasks 3 and 4/5; `SwatchEntry`/`SwatchRow` props identical in Tasks 4 and 5; `pushRecent(prev, value, max)` identical in Tasks 3 and 5; `ColorValue<TMode>` identical in Tasks 1 and 5. ✓

**Deviation from spec:** spec named the test file `color-picker.spec.tsx`; the repo convention is `tests/color-picker.test.tsx` (existing) — tests are appended there. The `openValueRef` mechanism in the spec is implemented as the equivalent session-scoped `pendingRef` (cleared on open, committed on close), which is strictly more robust against a non-reflecting parent.
