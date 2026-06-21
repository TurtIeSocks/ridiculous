# css-output + Tailwind copy mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared `<CssOutput>` readout primitive (css ⇄ Tailwind v4 toggle + copy) and a pure `cssToTailwind()` converter, then roll both out across every editor in the registry.

**Architecture:** A pure converter (`cssToTailwind`) lives inside the new `css-output` component (its only consumer; keeps `ridiculous-type-kit` pure-types). `<CssOutput>` renders the converter's output with an adaptive toggle. Each editor swaps its bespoke `<code>` readout for `<CssOutput value property />`, computing `property` from its mode when mode-dependent. Sharing is via declared `registryDependencies` — no copy-pasted internals.

**Tech Stack:** React 19, TypeScript, Tailwind v4, vitest + jsdom + @testing-library/react, shadcn registry (`pnpm registry:build`), Biome.

## Global Constraints

- **Tailwind v4 only.** No v3 output anywhere (including easing-picker — remove its tw-v3 path).
- **Package manager: pnpm.** Test: `pnpm vitest run <file>`. Full gate: `pnpm pr:check` (typecheck + biome + coverage).
- **Tests are flat in `tests/`**: `tests/<name>-<aspect>.test.ts` (logic), `tests/<name>.test.tsx` (component). Import via `@/` alias. `describe/it/expect` are global (vitest `globals: true`) but existing files import them from `"vitest"` — match that.
- **Registry self-containment:** the converter lives in `css-output` only; editors depend on `css-output`, which depends on `["button"]`. Never import one editor's internals from another.
- **Converter contract (verbatim from spec §4):** `cssToTailwind(property, value, opts?) → TailwindForm | null`. `null` ⇒ css-only. `@theme` token only for `color`, `box-shadow`, `transition-timing-function`, `animation`.
- **Encoding:** comma-space → comma; whitespace runs → `_`; literal `_` → `\_`; commas/parens/slashes literal. `@theme` value is **raw** (not encoded).
- **Coverage thresholds** (vitest.config.ts): statements 90 / branches 85 / functions 90 / lines 90. New `css-output` files must be added to `coverage.include` and clear the bar.
- **Biome:** run `pnpm check:fix` before each commit if formatting drifts.

---

### Task 1: Encoding helper `encodeArbitraryValue`

**Files:**
- Create: `src/components/ui/css-output/css-output.helpers.ts`
- Test: `tests/css-output-encode.test.ts`

**Interfaces:**
- Produces: `encodeArbitraryValue(value: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// tests/css-output-encode.test.ts
import { describe, expect, it } from "vitest"
import { encodeArbitraryValue } from "@/components/ui/css-output/css-output.helpers"

describe("encodeArbitraryValue", () => {
  it("turns whitespace runs into single underscores", () => {
    expect(encodeArbitraryValue("0 4px 8px #000")).toBe("0_4px_8px_#000")
  })

  it("keeps slashes and parens, underscores the spaces inside rgb()", () => {
    expect(encodeArbitraryValue("rgb(0 0 0 / 0.25)")).toBe("rgb(0_0_0_/_0.25)")
  })

  it("collapses comma-space to a bare comma", () => {
    expect(encodeArbitraryValue("cubic-bezier(0.25, 0.1, 0.25, 1)")).toBe(
      "cubic-bezier(0.25,0.1,0.25,1)",
    )
  })

  it("encodes a multi-layer box-shadow stack", () => {
    expect(
      encodeArbitraryValue(
        "0px 4px 8px rgb(0 0 0 / 0.25), inset 0px 0px 2px #000",
      ),
    ).toBe("0px_4px_8px_rgb(0_0_0_/_0.25),inset_0px_0px_2px_#000")
  })

  it("escapes literal underscores (Tailwind un-escapes back to '_')", () => {
    expect(encodeArbitraryValue("a_b")).toBe("a\\_b")
    expect(encodeArbitraryValue("url(/a_b.png)")).toBe("url(/a\\_b.png)")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/css-output-encode.test.ts`
Expected: FAIL — `encodeArbitraryValue` is not exported / file missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/ui/css-output/css-output.helpers.ts

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/css-output-encode.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/css-output/css-output.helpers.ts tests/css-output-encode.test.ts
git commit -m "feat(css-output): add encodeArbitraryValue for Tailwind arbitrary values"
```

---

### Task 2: `cssToTailwind` converter + types

**Files:**
- Create: `src/components/ui/css-output/css-output.types.ts`
- Modify: `src/components/ui/css-output/css-output.helpers.ts`
- Test: `tests/css-output-convert.test.ts`

**Interfaces:**
- Consumes: `encodeArbitraryValue` (Task 1)
- Produces:
  - `interface TailwindForm { inline: string; theme?: { atRule: string; className: string } }`
  - `interface CssToTailwindOptions { name?: string; colorPrefix?: "bg" | "text" | "border" }`
  - `cssToTailwind(property: string | null | undefined, value: string, opts?: CssToTailwindOptions): TailwindForm | null`

- [ ] **Step 1: Write the failing test**

```ts
// tests/css-output-convert.test.ts
import { describe, expect, it } from "vitest"
import { cssToTailwind } from "@/components/ui/css-output/css-output.helpers"

describe("cssToTailwind", () => {
  it("box-shadow → named utility + --shadow token", () => {
    expect(cssToTailwind("box-shadow", "0px 4px 8px rgb(0 0 0 / 0.25)")).toEqual({
      inline: "shadow-[0px_4px_8px_rgb(0_0_0_/_0.25)]",
      theme: {
        atRule: "@theme {\n  --shadow-custom: 0px 4px 8px rgb(0 0 0 / 0.25);\n}",
        className: "shadow-custom",
      },
    })
  })

  it("color → bg prefix by default + --color token", () => {
    expect(cssToTailwind("color", "oklch(0.7 0.15 200)")).toEqual({
      inline: "bg-[oklch(0.7_0.15_200)]",
      theme: {
        atRule: "@theme {\n  --color-custom: oklch(0.7 0.15 200);\n}",
        className: "bg-custom",
      },
    })
  })

  it("color honors colorPrefix and name", () => {
    const r = cssToTailwind("color", "red", { colorPrefix: "text", name: "brand" })
    expect(r?.inline).toBe("text-[red]")
    expect(r?.theme).toEqual({
      atRule: "@theme {\n  --color-brand: red;\n}",
      className: "text-brand",
    })
  })

  it("filter → named utility, no token", () => {
    expect(cssToTailwind("filter", "blur(4px) brightness(1)")).toEqual({
      inline: "filter-[blur(4px)_brightness(1)]",
    })
  })

  it("clip-path → arbitrary property, no token", () => {
    expect(cssToTailwind("clip-path", "circle(50% at 50% 50%)")).toEqual({
      inline: "[clip-path:circle(50%_at_50%_50%)]",
    })
  })

  it("transition shorthand → arbitrary property", () => {
    expect(cssToTailwind("transition", "opacity 200ms ease")?.inline).toBe(
      "[transition:opacity_200ms_ease]",
    )
  })

  it("unknown concrete property → generic arbitrary-property fallback", () => {
    expect(cssToTailwind("font", "italic 16px/1.5 Inter")?.inline).toBe(
      "[font:italic_16px/1.5_Inter]",
    )
  })

  it("null/empty property → null (css-only)", () => {
    expect(cssToTailwind(null, "anything")).toBeNull()
    expect(cssToTailwind("", "anything")).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/css-output-convert.test.ts`
Expected: FAIL — `cssToTailwind` not exported.

- [ ] **Step 3: Write the types**

```ts
// src/components/ui/css-output/css-output.types.ts

export interface TailwindForm {
  /** Inline class, e.g. "shadow-[0_4px_8px_#0006]" or "[filter:blur(4px)]". */
  inline: string
  /** Present only for the 4 namespace-backed properties. */
  theme?: {
    /** Full @theme block, e.g. "@theme {\n  --shadow-custom: …;\n}". */
    atRule: string
    /** The class the token enables, e.g. "shadow-custom". */
    className: string
  }
}

export interface CssToTailwindOptions {
  /** @theme token suffix; default "custom". e.g. "brand" → --color-brand. */
  name?: string
  /** Only used when property === "color". Default "bg". */
  colorPrefix?: "bg" | "text" | "border"
}

export interface CssOutputProps {
  /** The formatted CSS value the host already produces. */
  value: string
  /** CSS property the value targets; drives conversion. Omit/null → css-only. */
  property?: string | null
  /** "css" | "tailwind" | "both" — default "both". */
  output?: "css" | "tailwind" | "both"
  /** Only meaningful when property === "color". Default "bg". */
  colorPrefix?: "bg" | "text" | "border"
  className?: string
}
```

- [ ] **Step 4: Add the converter to the helpers file**

```ts
// append to src/components/ui/css-output/css-output.helpers.ts
import type {
  CssToTailwindOptions,
  TailwindForm,
} from "./css-output.types"

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

  const className = property === "color" ? `${colorPrefix}-${name}` : `${prefix}-${name}`
  return {
    inline,
    theme: { atRule: `@theme {\n  --${ns}-${name}: ${value};\n}`, className },
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/css-output-convert.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/css-output/ tests/css-output-convert.test.ts
git commit -m "feat(css-output): add cssToTailwind converter + types"
```

---

### Task 3: `<CssOutput>` core — readout, toggle, output modes, copy

**Files:**
- Create: `src/components/ui/css-output/css-output.tsx`
- Create: `src/components/ui/css-output/index.ts`
- Test: `tests/css-output.test.tsx`

**Interfaces:**
- Consumes: `cssToTailwind` (Task 2), `CssOutputProps` (Task 2)
- Produces: `CssOutput(props: CssOutputProps): JSX.Element`; `index.ts` re-exports `CssOutput`, `cssToTailwind`, and all types.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/css-output.test.tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CssOutput } from "@/components/ui/css-output"

describe("CssOutput core", () => {
  it("shows raw CSS by default in 'both' mode", () => {
    render(<CssOutput value="0 4px 8px #000" property="box-shadow" />)
    expect(screen.getByText("0 4px 8px #000")).toBeInTheDocument()
  })

  it("toggles to the Tailwind inline class", async () => {
    const user = userEvent.setup()
    render(<CssOutput value="0 4px 8px #000" property="box-shadow" />)
    await user.click(screen.getByRole("button", { name: /tailwind/i }))
    expect(screen.getByText("shadow-[0_4px_8px_#000]")).toBeInTheDocument()
  })

  it("hides the toggle when output='css'", () => {
    render(<CssOutput value="x" property="box-shadow" output="css" />)
    expect(screen.queryByRole("button", { name: /tailwind/i })).toBeNull()
  })

  it("hides the toggle when property is null (css-only)", () => {
    render(<CssOutput value="@media x" property={null} />)
    expect(screen.queryByRole("button", { name: /tailwind/i })).toBeNull()
  })

  it("pins to tailwind when output='tailwind'", () => {
    render(<CssOutput value="blur(4px)" property="filter" output="tailwind" />)
    expect(screen.getByText("filter-[blur(4px)]")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^css$/i })).toBeNull()
  })

  it("copies the currently shown string", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const user = userEvent.setup()
    render(<CssOutput value="0 4px 8px #000" property="box-shadow" output="css" />)
    await user.click(screen.getByRole("button", { name: /copy/i }))
    expect(writeText).toHaveBeenCalledWith("0 4px 8px #000")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/css-output.test.tsx`
Expected: FAIL — module `@/components/ui/css-output` has no `CssOutput`.

- [ ] **Step 3: Write the component**

```tsx
// src/components/ui/css-output/css-output.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { cssToTailwind } from "./css-output.helpers"
import type { CssOutputProps } from "./css-output.types"

export function CssOutput({
  value,
  property,
  output = "both",
  colorPrefix = "bg",
  className,
}: CssOutputProps) {
  const [format, setFormat] = useState<"css" | "tailwind">("css")
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  const tw = property ? cssToTailwind(property, value, { colorPrefix }) : null
  const cssOnly = tw === null || output === "css"
  const active: "css" | "tailwind" = cssOnly
    ? "css"
    : output === "tailwind"
      ? "tailwind"
      : format
  const shown = active === "tailwind" && tw ? tw.inline : value
  const showToggle = output === "both" && tw !== null
  const canCopy = shown.trim() !== "" && shown.trim() !== "none"

  const copy = async () => {
    if (!canCopy) return
    if (timer.current !== null) clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(shown)
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), 1200)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        {showToggle && (
          <div className="flex gap-1 text-xs" role="tablist">
            {(["css", "tailwind"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={format === f}
                onClick={() => setFormat(f)}
                className={cn(
                  "rounded border px-2 py-0.5",
                  format === f
                    ? "border-accent-foreground/20 bg-accent"
                    : "border-transparent text-muted-foreground hover:bg-accent/50",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={copy}
          disabled={!canCopy}
          aria-label={copied ? "Copied" : "Copy"}
          className="ml-auto rounded border border-white/10 px-2 py-0.5 text-muted-foreground text-xs hover:text-foreground disabled:opacity-40"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
        {shown}
      </code>
    </div>
  )
}
```

```ts
// src/components/ui/css-output/index.ts
export { CssOutput } from "./css-output"
export { cssToTailwind, encodeArbitraryValue } from "./css-output.helpers"
export type {
  CssOutputProps,
  CssToTailwindOptions,
  TailwindForm,
} from "./css-output.types"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/css-output.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/css-output/css-output.tsx src/components/ui/css-output/index.ts tests/css-output.test.tsx
git commit -m "feat(css-output): add CssOutput primitive (readout, toggle, copy)"
```

---

### Task 4: `<CssOutput>` adaptive — color prefix selector + @theme token disclosure

**Files:**
- Modify: `src/components/ui/css-output/css-output.tsx`
- Test: `tests/css-output-adaptive.test.tsx`

**Interfaces:**
- Consumes: everything from Task 3.
- Produces: no new exports — extends `CssOutput` render with two tailwind-view sub-affordances.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/css-output-adaptive.test.tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CssOutput } from "@/components/ui/css-output"

describe("CssOutput adaptive", () => {
  it("shows a bg/text/border selector for color in tailwind view", async () => {
    const user = userEvent.setup()
    render(<CssOutput value="red" property="color" output="tailwind" />)
    await user.click(screen.getByRole("button", { name: /^text$/i }))
    expect(screen.getByText("text-[red]")).toBeInTheDocument()
  })

  it("reveals an editable @theme token block", async () => {
    const user = userEvent.setup()
    render(<CssOutput value="0 4px 8px #000" property="box-shadow" output="tailwind" />)
    await user.click(screen.getByRole("button", { name: /theme token/i }))
    expect(
      screen.getByText(/--shadow-custom: 0 4px 8px #000;/),
    ).toBeInTheDocument()
    const nameInput = screen.getByLabelText(/token name/i)
    await user.clear(nameInput)
    await user.type(nameInput, "card")
    expect(screen.getByText(/--shadow-card: 0 4px 8px #000;/)).toBeInTheDocument()
  })

  it("offers no token disclosure for a non-namespace property", () => {
    render(<CssOutput value="blur(4px)" property="filter" output="tailwind" />)
    expect(screen.queryByRole("button", { name: /theme token/i })).toBeNull()
  })

  it("copies the @theme block from the token disclosure", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const user = userEvent.setup()
    render(<CssOutput value="red" property="color" output="tailwind" />)
    await user.click(screen.getByRole("button", { name: /theme token/i }))
    await user.click(screen.getByRole("button", { name: /copy token/i }))
    expect(writeText).toHaveBeenCalledWith("@theme {\n  --color-custom: red;\n}")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/css-output-adaptive.test.tsx`
Expected: FAIL — no prefix selector / token disclosure rendered.

- [ ] **Step 3: Extend the component**

Replace the body of `CssOutput` in `css-output.tsx` with this version (adds `prefix`, `name`, `showToken` state and the two sub-affordances; recomputes `tw` with live prefix/name):

```tsx
// src/components/ui/css-output/css-output.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { cssToTailwind } from "./css-output.helpers"
import type { CssOutputProps } from "./css-output.types"

export function CssOutput({
  value,
  property,
  output = "both",
  colorPrefix = "bg",
  className,
}: CssOutputProps) {
  const [format, setFormat] = useState<"css" | "tailwind">("css")
  const [prefix, setPrefix] = useState<"bg" | "text" | "border">(colorPrefix)
  const [name, setName] = useState("custom")
  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  const tw = property
    ? cssToTailwind(property, value, { colorPrefix: prefix, name })
    : null
  const cssOnly = tw === null || output === "css"
  const active: "css" | "tailwind" = cssOnly
    ? "css"
    : output === "tailwind"
      ? "tailwind"
      : format
  const shown = active === "tailwind" && tw ? tw.inline : value
  const showToggle = output === "both" && tw !== null
  const isColor = property === "color"
  const canCopy = shown.trim() !== "" && shown.trim() !== "none"

  const copyText = async (text: string) => {
    if (timer.current !== null) clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), 1200)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        {showToggle && (
          <div className="flex gap-1 text-xs" role="tablist">
            {(["css", "tailwind"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={format === f}
                onClick={() => setFormat(f)}
                className={cn(
                  "rounded border px-2 py-0.5",
                  format === f
                    ? "border-accent-foreground/20 bg-accent"
                    : "border-transparent text-muted-foreground hover:bg-accent/50",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}
        {active === "tailwind" && isColor && (
          <div className="flex gap-1 text-xs" role="group" aria-label="color utility prefix">
            {(["bg", "text", "border"] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={prefix === p}
                onClick={() => setPrefix(p)}
                className={cn(
                  "rounded border px-2 py-0.5",
                  prefix === p
                    ? "border-accent-foreground/20 bg-accent"
                    : "border-transparent text-muted-foreground hover:bg-accent/50",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => canCopy && copyText(shown)}
          disabled={!canCopy}
          aria-label={copied ? "Copied" : "Copy"}
          className="ml-auto rounded border border-white/10 px-2 py-0.5 text-muted-foreground text-xs hover:text-foreground disabled:opacity-40"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
        {shown}
      </code>

      {active === "tailwind" && tw?.theme && (
        <div className="space-y-1.5">
          <button
            type="button"
            aria-expanded={showToken}
            onClick={() => setShowToken((s) => !s)}
            className="text-muted-foreground text-xs hover:text-foreground"
          >
            {showToken ? "− " : "+ "}use as @theme token
          </button>
          {showToken && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">token name:</span>
                <input
                  type="text"
                  aria-label="token name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className="flex-1 rounded bg-muted px-2 py-0.5 text-foreground"
                />
              </label>
              <pre className="overflow-x-auto whitespace-pre rounded bg-muted/50 p-2 font-mono text-xs">
                {tw.theme.atRule}
              </pre>
              <button
                type="button"
                aria-label="Copy token"
                onClick={() => tw.theme && copyText(tw.theme.atRule)}
                className="rounded border border-white/10 px-2 py-0.5 text-muted-foreground text-xs hover:text-foreground"
              >
                copy token
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run both component tests**

Run: `pnpm vitest run tests/css-output.test.tsx tests/css-output-adaptive.test.tsx`
Expected: PASS (all). If a Task-3 selector now matches two elements (e.g. "copy"), tighten via `name: /^Copy$/`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/css-output/css-output.tsx tests/css-output-adaptive.test.tsx
git commit -m "feat(css-output): add color-prefix selector + @theme token disclosure"
```

---

### Task 5: Register `css-output` in the registry + coverage

**Files:**
- Modify: `registry.json` (add `css-output` item; add `"css-output"` URL to the `all` bundle)
- Modify: `vitest.config.ts` (add `src/components/ui/css-output/**` to `coverage.include`)

**Interfaces:** none (build/config only).

- [ ] **Step 1: Add the `css-output` item to `registry.json`**

Insert into the `items` array (after the `ridiculous-type-kit` lib entry is fine):

```json
{
  "name": "css-output",
  "type": "registry:ui",
  "title": "CSS Output",
  "description": "Shared readout for every ridiculous editor: shows the produced value as raw CSS or a Tailwind v4 class (inline arbitrary value, with an optional @theme token for color/shadow/easing/animation) and a copy button. Adapts automatically — values with no Tailwind class form fall back to css-only.",
  "registryDependencies": ["button"],
  "dependencies": [],
  "files": [
    { "path": "src/components/ui/css-output/index.ts", "type": "registry:ui", "target": "components/ui/css-output/index.ts" },
    { "path": "src/components/ui/css-output/css-output.tsx", "type": "registry:ui", "target": "components/ui/css-output/css-output.tsx" },
    { "path": "src/components/ui/css-output/css-output.types.ts", "type": "registry:ui", "target": "components/ui/css-output/css-output.types.ts" },
    { "path": "src/components/ui/css-output/css-output.helpers.ts", "type": "registry:ui", "target": "components/ui/css-output/css-output.helpers.ts" }
  ]
}
```

Then add to the `all` bundle's `registryDependencies` array:

```json
"https://ridiculous.turtlesocks.dev/r/css-output.json"
```

- [ ] **Step 2: Add to coverage include**

In `vitest.config.ts`, add to `coverage.include`:

```ts
"src/components/ui/css-output/**",
```

- [ ] **Step 3: Build the registry + typecheck**

Run: `pnpm registry:build && pnpm typecheck`
Expected: PASS; `public/r/css-output.json` is emitted.

- [ ] **Step 4: Verify the emitted artifact**

Run: `test -f public/r/css-output.json && echo OK`
Expected: `OK`.

- [ ] **Step 5: Commit**

```bash
git add registry.json vitest.config.ts public/r/css-output.json
git commit -m "feat(css-output): register css-output registry item + coverage"
```

---

## Rollout recipe (Tasks 6–10)

Each editor swap follows this recipe. **Apply per component, then one commit + test run per wave.**

```
A. Open the component's main .tsx. Locate the in-panel readout — the JSX that
   renders the formatted value in a <code> block (a local `LiveString` call or a
   `<live-string.tsx>` usage). Grep the format function name from the table.
B. Replace that readout JSX with:
     <CssOutput value={<SAME formatted expression>} property={<PROPERTY from table>} />
C. Add: import { CssOutput } from "@/components/ui/css-output"
D. Delete the now-unused local LiveString function / live-string.tsx import if dead.
E. registry.json: add "css-output" to THIS component's registryDependencies.
F. Run the component's existing test; if the added toggle/copy buttons break a
   selector, tighten the query (e.g. getByText → getByRole). Do NOT weaken assertions.
```

`<PROPERTY>` is a literal string for fixed-property components, or a ternary over the component's existing `mode` state for mode-dependent ones.

---

### Task 6: Rollout Wave A — fixed single-property swaps

**Files (Modify):** the main `.tsx` of each, plus `registry.json`.

| component | readout fn | `property` |
|---|---|---|
| box-shadow-editor | `formatBoxShadow(layers)` (`box-shadow-editor.tsx`, `LiveString` at ~:142/:183) | `"box-shadow"` |
| transform-builder | `formatTransform(items)` (`transform-builder.tsx` ~:236) | `"transform"` |
| color-function | `formatColorFunction(...)` (`color-function/live-string.tsx`) | `"color"` |
| background-editor | `formatBackground(layers)` (`background-editor.tsx` `LiveString` ~:162) | `"background"` |
| font-editor | `formatFont(...)` (`font-editor.tsx`) | `"font"` |

- [ ] **Step 1:** Apply the rollout recipe to all five components (property column above). Example (box-shadow-editor):

```tsx
// before:  <LiveString value={formatBoxShadow(layers)} />
// after:
<CssOutput value={formatBoxShadow(layers)} property="box-shadow" />
// + import { CssOutput } from "@/components/ui/css-output"
// + delete the local LiveString function (now unused)
```

- [ ] **Step 2: Run the affected tests**

Run: `pnpm vitest run tests/box-shadow-editor.test.tsx tests/color-function-format.test.ts`
(plus any transform/background/font component tests that exist — discover with `ls tests | grep -E 'transform|background|font'`).
Expected: PASS (fix selectors if the toggle shifted a query).

- [ ] **Step 3: Build + typecheck**

Run: `pnpm registry:build && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(css-output): roll out to box-shadow, transform, color-function, background, font editors"
```

---

### Task 7: Rollout Wave B — mode-dependent property

**Files (Modify):** the main `.tsx` of each, plus `registry.json`. Use the component's existing `mode` state variable.

| component | `property` expression |
|---|---|
| filter-builder | `mode === "backdrop-filter" ? "backdrop-filter" : "filter"` |
| transition-editor | `mode === "animation" ? "animation" : "transition"` |
| grid-builder | `mode === "columns" ? "grid-template-columns" : mode === "rows" ? "grid-template-rows" : "grid-template-areas"` |
| clip-path-editor | `mode === "shape-outside" ? "shape-outside" : "clip-path"` |
| shape-path-editor | `mode === "offset-path" ? "offset-path" : "clip-path"` |
| anchor-position-editor | position-area readout → `"position-area"`; anchor & position-try readouts → `null` |

- [ ] **Step 1:** Apply the rollout recipe to all six. Confirm each component's mode literal matches its type union (grep the `Mode` type in `<component>.types.ts`); adjust the ternary's string literals to match exactly. Example (grid-builder):

```tsx
<CssOutput
  value={mode === "areas" ? formatAreas(areas) : formatTracks(tracks)}
  property={
    mode === "columns"
      ? "grid-template-columns"
      : mode === "rows"
        ? "grid-template-rows"
        : "grid-template-areas"
  }
/>
```

For anchor-position-editor, each of its three readouts gets its own `<CssOutput>`: position-area → `property="position-area"`; the anchor() and position-try readouts → `property={null}` (css-only, gains a copy button).

- [ ] **Step 2: Run affected tests**

Run: `ls tests | grep -E 'filter|transition|grid|clip|shape|anchor'` then `pnpm vitest run <those files>`.
Expected: PASS (tighten selectors if needed).

- [ ] **Step 3: Build + typecheck**

Run: `pnpm registry:build && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(css-output): roll out to mode-dependent editors (filter, transition, grid, clip-path, shape-path, anchor)"
```

---

### Task 8: Rollout Wave C — add a readout where none exists

**Files (Modify):** `src/components/ui/color-picker/color-picker.tsx`, `src/components/ui/gradient-editor/gradient-editor.tsx`, `registry.json`.

These two have **no in-component readout today** (value shows only in the demo). Add a `<CssOutput>` near the bottom of the panel's controls.

| component | value expression | `property` |
|---|---|---|
| color-picker | the formatted color string (the value the panel emits via `onChange`) | `"color"` |
| gradient-editor | `formatGradient(...)` (the value emitted via `onChange`) | `"background-image"` |

- [ ] **Step 1:** In each panel, after the existing controls, add:

```tsx
// color-picker panel:
<CssOutput value={formattedColor} property="color" />
// gradient-editor panel:
<CssOutput value={formatGradient(state)} property="background-image" />
// + import { CssOutput } from "@/components/ui/css-output" in each
```

Locate `formattedColor` / `formatGradient` by grepping the value passed to the panel's `onChange`. Place the `<CssOutput>` inside the panel's root container so it sits with the controls.

- [ ] **Step 2: Run tests**

Run: `pnpm vitest run tests/gradient-editor.test.tsx tests/gradient-format.test.ts` (+ any color-picker test: `ls tests | grep color`).
Expected: PASS.

- [ ] **Step 3: Build + typecheck**

Run: `pnpm registry:build && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(css-output): add readout to color-picker and gradient-editor panels"
```

---

### Task 9: Rollout Wave D — css-only swaps (gain a copy button)

**Files (Modify):** main `.tsx` of each, plus `registry.json`. All pass `property={null}` → css-only readout + copy button, no toggle.

| component | value expression |
|---|---|
| keyframes-editor | `formatKeyframes(...)` |
| property-syntax-editor | `formatSyntax(...)` |
| query-builder | `queryToString(...)` |
| if-function | `formatIf(...)` |
| calc-editor | `formatCalc(...)` — **optional**: calc-editor shows a Dimension readout today, not the CSS string. If adding it is non-trivial, skip calc-editor and note the skip in the commit body. |

- [ ] **Step 1:** Apply the recipe with `property={null}`. Example (keyframes-editor):

```tsx
// before: <code …>{formatKeyframes(...)}</code>   (or a LiveString)
// after:
<CssOutput value={formatKeyframes(blocks)} property={null} />
```

- [ ] **Step 2: Run tests**

Run: `ls tests | grep -E 'keyframes|property-syntax|query|if-function|calc'` then `pnpm vitest run <those files>`.
Expected: PASS.

- [ ] **Step 3: Build + typecheck**

Run: `pnpm registry:build && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(css-output): css-only readout + copy for keyframes, property-syntax, query, if (calc optional)"
```

---

### Task 10: Rollout Wave E — easing-picker reconciliation (drop tw-v3)

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx` (replace `OutputPanel` usage)
- Delete: `src/components/ui/easing-picker/preview/output-panel.tsx`
- Modify: `registry.json` (remove the `output-panel.tsx` file entry from easing-picker's `files`; add `"css-output"` to its `registryDependencies`; update its `description` to drop "Tailwind v3")
- Test: `tests/easing-output.test.tsx` (new — replaces any OutputPanel assertions)

**Interfaces:** removes `OutputPanel` and `OutputFormat`; easing-picker now renders `<CssOutput>`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/easing-output.test.tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { CssOutput } from "@/components/ui/css-output"

describe("easing-picker output", () => {
  it("offers css and tailwind only (no v3)", async () => {
    const user = userEvent.setup()
    render(
      <CssOutput value="cubic-bezier(0.25, 0.1, 0.25, 1)" property="transition-timing-function" />,
    )
    expect(screen.queryByRole("button", { name: /v3/i })).toBeNull()
    await user.click(screen.getByRole("button", { name: /tailwind/i }))
    expect(screen.getByText("ease-[cubic-bezier(0.25,0.1,0.25,1)]")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails (or passes trivially)** — this asserts the shared primitive's behavior for easing; run it:

Run: `pnpm vitest run tests/easing-output.test.tsx`
Expected: PASS once Tasks 1–4 are merged (it exercises `CssOutput` directly). If it passes, proceed; it documents the v3-removal contract.

- [ ] **Step 3: Replace OutputPanel in easing-picker**

In `easing-picker.tsx`, replace the `<OutputPanel easing={…} format={…} onFormatChange={…} />` usage with:

```tsx
<CssOutput value={easing} property="transition-timing-function" output="both" />
// + import { CssOutput } from "@/components/ui/css-output"
// remove: OutputPanel import, OutputFormat state, and any format-related props
```

Then delete `preview/output-panel.tsx`.

- [ ] **Step 4: Update registry.json**

Remove the `output-panel.tsx` file object from easing-picker's `files`; add `"css-output"` to its `registryDependencies`; change its `description` "…3-format output (CSS / Tailwind v3 / v4)." → "…CSS / Tailwind v4 output via the shared css-output readout."

- [ ] **Step 5: Run easing tests + build**

Run: `pnpm vitest run tests/easing-output.test.tsx && pnpm registry:build && pnpm typecheck`
Expected: PASS. (Grep for stale references: `grep -rn "OutputPanel\|tailwind-v3\|OutputFormat" src` → expect no hits in easing-picker.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(css-output): migrate easing-picker to shared readout, drop Tailwind v3"
```

---

### Task 11: Final gate — full suite, coverage, registry

**Files:** none (verification only).

- [ ] **Step 1: Full registry build**

Run: `pnpm registry:build`
Expected: PASS; every `public/r/*.json` regenerated, including `css-output.json`.

- [ ] **Step 2: Full project gate**

Run: `pnpm pr:check`
Expected: PASS — typecheck clean, Biome clean, `test:coverage` green with css-output meeting 90/85/90/90.

- [ ] **Step 3: Stale-reference sweep**

Run: `grep -rn "LiveString\|live-string\|tailwind-v3" src/components/ui | grep -v css-output`
Expected: only intentional remaining readouts (any component deliberately left css-only via its own `<code>` is fine, but every swapped component should be clean). Investigate unexpected hits.

- [ ] **Step 4: Commit any coverage/lint fixups**

```bash
git add -A
git commit -m "chore(css-output): final lint/coverage fixups"
```

---

## Self-Review (completed during authoring)

- **Spec coverage:** §4 converter → Tasks 1–2; §5 primitive → Tasks 3–4; §6 integration table → Tasks 6–10 (every row mapped; **font-editor added** — it was missing from spec §6, patched there too); §7 easing reconciliation → Task 10; §9 testing → tests in every task + Task 11; registry plumbing → Task 5 + per-wave `registry.json` edits.
- **Placeholder scan:** all code shown in full; the only "locate" steps are deterministic greps for an existing format-fn call, not missing code.
- **Type consistency:** `cssToTailwind` / `TailwindForm` / `CssOutputProps` / `encodeArbitraryValue` names match across Tasks 1→11; `theme.atRule` / `theme.className` consistent; `property` typed `string | null | undefined` everywhere.
- **Known optional:** calc-editor readout (Task 9) is explicitly optional with a documented skip path.
