# CalcEditor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-05-29-calc-editor-design.md`
**Branch/worktree:** `claude/hungry-chaplygin-62fec9` (commit here; controller merges)
**Method:** TDD. Type-level tests FIRST (the validator is the product). Biome: no semicolons, double quotes, 2-space. Commit per logical unit; every commit leaves `pnpm typecheck` clean.

Order is dependency-driven: types → runtime helpers → components → wiring → demo. Each task lists its test(s) and the acceptance bar.

---

## Task 1 — Type tier: `CalcLiteral`, suggestion strings, utility types, state

**Files:** `src/components/ui/calc-editor/calc-editor.types.ts` (new), `tests/calc-editor-types.test-d.ts` (new).

**1a. Write the type-test first** (`tests/calc-editor-types.test-d.ts`). Assert BOTH directions:

```ts
import { expectTypeOf, test } from "vitest"
import type {
  ArgCountOf, CalcFn, CalcFunctionName, CalcLiteral, CalcNode,
  CalcString, CalcStringMap, DimensionOfCalc, FunctionOf,
} from "@/components/ui/calc-editor/calc-editor.types"
import { cssCalc } from "@/components/ui/calc-editor/calc-editor.types"
import type { CalcEditor } from "@/components/ui/calc-editor"

test("calc add/sub same dimension resolves to the literal", () => {
  expectTypeOf<CalcLiteral<"calc(10px + 2rem)">>().toEqualTypeOf<"calc(10px + 2rem)">()
  expectTypeOf<CalcLiteral<"calc(100% - 10px)">>().toBeNever() // % vs length mismatch
  expectTypeOf<CalcLiteral<"calc(50% + 10%)">>().toEqualTypeOf<"calc(50% + 10%)">()
})
test("calc + with mismatched dimensions is never", () => {
  expectTypeOf<CalcLiteral<"calc(10px + 45deg)">>().toBeNever()
})
test("calc * requires a number operand", () => {
  expectTypeOf<CalcLiteral<"calc(10px * 3)">>().toEqualTypeOf<"calc(10px * 3)">()
  expectTypeOf<CalcLiteral<"calc(2 * 10px)">>().toEqualTypeOf<"calc(2 * 10px)">()
  expectTypeOf<CalcLiteral<"calc(10px * 2px)">>().toBeNever()
})
test("calc / requires a number divisor", () => {
  expectTypeOf<CalcLiteral<"calc(10px / 2)">>().toEqualTypeOf<"calc(10px / 2)">()
  expectTypeOf<CalcLiteral<"calc(10px / 2px)">>().toBeNever()
  expectTypeOf<CalcLiteral<"calc(2 / 10px)">>().toBeNever()
})
test("nested parens + precedence-irrelevant dimensions", () => {
  expectTypeOf<CalcLiteral<"calc((10px + 2px) * 3)">>().toEqualTypeOf<"calc((10px + 2px) * 3)">()
  expectTypeOf<CalcLiteral<"calc(10px + 2 * 5px)">>().toEqualTypeOf<"calc(10px + 2 * 5px)">()
})
test("clamp requires exactly 3 same-dimension args", () => {
  expectTypeOf<CalcLiteral<"clamp(1rem, 2vw, 3rem)">>().toEqualTypeOf<"clamp(1rem, 2vw, 3rem)">()
  expectTypeOf<CalcLiteral<"clamp(1rem, 2vw)">>().toBeNever()        // arity
  expectTypeOf<CalcLiteral<"clamp(1rem, 2vw, 3deg)">>().toBeNever()  // mismatch
})
test("min/max require >=1 same-dimension args", () => {
  expectTypeOf<CalcLiteral<"min(10px, 2rem, 5vw)">>().toEqualTypeOf<"min(10px, 2rem, 5vw)">()
  expectTypeOf<CalcLiteral<"max(50%)">>().toEqualTypeOf<"max(50%)">()
  expectTypeOf<CalcLiteral<"min(10px, 45deg)">>().toBeNever()
})
test("nested functions propagate dimensions", () => {
  expectTypeOf<CalcLiteral<"calc(min(10px, 2rem) + 1rem)">>().toEqualTypeOf<"calc(min(10px, 2rem) + 1rem)">()
  expectTypeOf<CalcLiteral<"clamp(1rem, calc(1rem + 2vw), 3rem)">>().toEqualTypeOf<"clamp(1rem, calc(1rem + 2vw), 3rem)">()
})
test("var() is rejected by strict tier (L6)", () => {
  expectTypeOf<CalcLiteral<"calc(100% - var(--gap))">>().toBeNever()
})
test("cssCalc validates at call site", () => {
  const a = cssCalc("calc(10px + 2rem)")
  expectTypeOf(a).toEqualTypeOf<"calc(10px + 2rem)">()
  // @ts-expect-error length + angle
  cssCalc("calc(10px + 45deg)")
  // @ts-expect-error length * length
  cssCalc("calc(10px * 2px)")
  // @ts-expect-error clamp arity
  cssCalc("clamp(1rem, 2vw)")
  // @ts-expect-error not a calc-family function
  cssCalc("rgb(1,2,3)")
})
test("FunctionOf / DimensionOfCalc / ArgCountOf", () => {
  expectTypeOf<FunctionOf<"clamp(1rem, 2vw, 3rem)">>().toEqualTypeOf<"clamp">()
  expectTypeOf<FunctionOf<"calc(1px)">>().toEqualTypeOf<"calc">()
  expectTypeOf<DimensionOfCalc<"calc(10px + 2rem)">>().toEqualTypeOf<"length">()
  expectTypeOf<DimensionOfCalc<"calc(50% + 10%)">>().toEqualTypeOf<"percent">()
  expectTypeOf<DimensionOfCalc<"calc(10px + 45deg)">>().toBeNever()
  expectTypeOf<ArgCountOf<"clamp(1rem, 2vw, 3rem)">>().toEqualTypeOf<3>()
})
test("CalcString suggestion union + map", () => {
  expectTypeOf<"calc(1px + 1px)">().toMatchTypeOf<CalcString>()
  expectTypeOf<CalcStringMap["clamp"]>().toEqualTypeOf<`clamp(${string})`>()
  expectTypeOf<CalcFn>().toEqualTypeOf<"calc" | "clamp" | "min" | "max">()
  expectTypeOf<CalcFunctionName>().toEqualTypeOf<"calc" | "clamp" | "min" | "max">()
})
test("CalcNode discriminates by kind", () => {
  const n: CalcNode = { kind: "binary", op: "+",
    left: { kind: "literal", value: "10px", dimension: "length" },
    right: { kind: "literal", value: "2rem", dimension: "length" } }
  expectTypeOf(n).toMatchTypeOf<CalcNode>()
})
test("CalcEditor fn='clamp' narrows onChange", () => {
  type P = Parameters<typeof CalcEditor<"clamp">>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<`clamp(${string})`>()
})
test("CalcEditor without fn keeps the union", () => {
  type P = Parameters<typeof CalcEditor>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<CalcString>()
})
test("depth cap weak-accepts beyond 8 (L2)", () => {
  // 9 levels of nested parens — weak-accept (not never)
  expectTypeOf<CalcLiteral<"calc(((((((((1px))))))))) ">>().not.toBeNever()
})
```

**1b. Implement `calc-editor.types.ts`** so the above passes. Build, in order:
`CombineDim`, `EvalLeaf` (handles math constants → number, `(...)` → recurse with depth-1, `name(...)` → `EvalFn`, else `DimensionOf`), `EvalExpr` (right-assoc space-split), `EvalFn` (calc→EvalExpr, min/max→EvalVariadicSame, clamp→EvalClamp, else never), `EvalVariadicSame` (fold comma list, all same dim, ≥1), `EvalClamp` (exactly-3 tuple match + all same), `EvalTop` (ParseFunction the outer call, dispatch by name with the `DEPTH=[8×unknown]` budget), then `CalcLiteral`, `cssCalc`, suggestion strings, `FunctionOf`, `DimensionOfCalc`, `ArgCountOf`, `CalcNode`. Re-export `Dimension` from the kit.

> Depth weak-accept: when `EvalLeaf` hits `(...)` and `Depth` is exhausted, return the inner string untouched (a `string`, which is not a `Dimension`) — but that would make the whole expr `never`. To weak-ACCEPT, `EvalLeaf` returns `"number"` (a benign dimension) on depth exhaustion so the surrounding expression still resolves. Tune so the 9-paren test is `not never`. (Implementer: verify the exact knob against the test.)

**Acceptance:** `pnpm exec vitest run --typecheck tests/calc-editor-types.test-d.ts` → all pass, `Type Errors: no errors`. NOTE: the `CalcEditor`-narrowing tests will fail to *import* until Task 4 — split them into the file but expect the component import to resolve only after Task 4. (Alternative: stub a minimal `index.ts` + component signature in Task 1 so imports resolve; preferred — do a 1-line type-only stub.) **Run `time` on this — must stay < ~1.5s total typecheck.**

**Commit:** `feat(calc-editor): strict dimensional-algebra type tier + cssCalc`.

---

## Task 2 — Runtime: tokenizer + parser → `CalcNode`

**Files:** `src/components/ui/calc-editor/calc-editor.helpers.ts` (new), `tests/calc-editor-parse.test.ts` (new).

**2a. Test first** (`tests/calc-editor-parse.test.ts`):

```ts
import { describe, expect, test } from "vitest"
import { parseCalc, tokenizeCalc, calcDimension, evaluateCalc } from "@/components/ui/calc-editor/calc-editor.helpers"

describe("tokenizeCalc", () => {
  test("splits numbers/units/ops/parens/commas", () => {
    expect(tokenizeCalc("calc(10px + 2rem)").map(t => t.type)).toEqual([
      "ident","lparen","number","op","number","rparen",
    ])
  })
  test("handles signed numbers and percent", () => {
    const t = tokenizeCalc("calc(-5px + 50%)")
    expect(t.some(x => x.type === "number" && x.value === "-5px")).toBe(true)
    expect(t.some(x => x.type === "number" && x.value === "50%")).toBe(true)
  })
})

describe("parseCalc", () => {
  test("parses calc with precedence (* tighter than +)", () => {
    const n = parseCalc("calc(10px + 2 * 5px)")
    expect(n).not.toBeNull()
    expect(n).toMatchObject({ kind: "fn", name: "calc",
      args: [{ kind: "binary", op: "+",
        left: { kind: "literal", value: "10px" },
        right: { kind: "binary", op: "*" } }] })
  })
  test("parses clamp/min/max", () => {
    expect(parseCalc("clamp(1rem, 2vw, 3rem)")).toMatchObject({ kind: "fn", name: "clamp" })
    expect((parseCalc("min(1px, 2px, 3px)") as any).args[0].args).toHaveLength(3)
  })
  test("parses var() passthrough", () => {
    expect(parseCalc("calc(100% - var(--gap))")).not.toBeNull()
  })
  test("returns null on syntax errors", () => {
    expect(parseCalc("calc(10px +")).toBeNull()
    expect(parseCalc("calc()")).toBeNull()
    expect(parseCalc("clamp(1px, 2px)")).toBeNull()   // arity
    expect(parseCalc("rgb(1,2,3)")).toBeNull()         // not calc-family
    expect(parseCalc("calc(10px 2px)")).toBeNull()     // missing operator
  })
})

describe("calcDimension", () => {
  test("same-dim add, mismatch null", () => {
    expect(calcDimension(parseCalc("calc(10px + 2rem)")!)).toBe("length")
    expect(calcDimension(parseCalc("calc(10px + 45deg)")!)).toBeNull()
  })
  test("mul/div number rules", () => {
    expect(calcDimension(parseCalc("calc(10px * 3)")!)).toBe("length")
    expect(calcDimension(parseCalc("calc(10px * 2px)")!)).toBeNull()
    expect(calcDimension(parseCalc("calc(10px / 2px)")!)).toBeNull()
  })
  test("clamp/min same-dim", () => {
    expect(calcDimension(parseCalc("clamp(1rem, 2vw, 3rem)")!)).toBe("length")
    expect(calcDimension(parseCalc("min(10px, 45deg)")!)).toBeNull()
  })
  test("var() is dimension-tolerant", () => {
    expect(calcDimension(parseCalc("calc(100% - var(--gap))")!)).toBe("percent")
    expect(calcDimension(parseCalc("calc(10px + var(--x))")!)).toBe("length")
  })
})

describe("evaluateCalc facade", () => {
  test("valid → node + dimension, no error", () => {
    const r = evaluateCalc("calc(10px + 2rem)")
    expect(r.error).toBeNull(); expect(r.dimension).toBe("length")
  })
  test("dimensional violation → dimension null + error", () => {
    const r = evaluateCalc("calc(10px + 45deg)")
    expect(r.dimension).toBeNull(); expect(r.error).toMatch(/dimension|mismatch|unit/i)
  })
  test("syntax error → node null + error", () => {
    expect(evaluateCalc("calc(10px +").error).not.toBeNull()
  })
})
```

**2b. Implement** `tokenizeCalc`, `parseCalc` (recursive descent: `parseExpr` → `parseTerm` (`* /`) → `parseFactor` (number | `(` expr `)` | `name(` args `)` | `var(...)`)), `calcDimension` (combine rules; var tolerant), and the `evaluateCalc` facade. Export the `CalcNode` runtime type usage from `.types.ts` (import the type).

**Acceptance:** `pnpm exec vitest run tests/calc-editor-parse.test.ts` green.

**Commit:** `feat(calc-editor): tokenizer + recursive-descent parser + dimension checker`.

---

## Task 3 — Runtime: `computeCalc` + `formatCalc`

**Files:** extend `calc-editor.helpers.ts`, `tests/calc-editor-format.test.ts` (new).

**3a. Test first:**

```ts
import { describe, expect, test } from "vitest"
import { computeCalc, formatCalc, parseCalc } from "@/components/ui/calc-editor/calc-editor.helpers"

describe("formatCalc", () => {
  test("canonical spacing", () => {
    expect(formatCalc(parseCalc("calc(10px+2rem)")!)).toBe("calc(10px + 2rem)")
    expect(formatCalc(parseCalc("clamp( 1rem ,2vw, 3rem )")!)).toBe("clamp(1rem, 2vw, 3rem)")
  })
})

describe("computeCalc", () => {
  const ctx = { viewport: 1000 } // 1vw = 10px
  test("resolves vw/rem/px to px", () => {
    expect(computeCalc(parseCalc("calc(1rem + 2vw)")!, ctx)).toBeCloseTo(16 + 20) // 36
  })
  test("clamp clamps", () => {
    // clamp(16, 0.5rem+2vw=8+20=28 ... wait preferred=8+20=28, min16 max48 -> 28)
    expect(computeCalc(parseCalc("clamp(16px, calc(0.5rem + 2vw), 48px)")!, ctx)).toBeCloseTo(28)
    // at small viewport preferred < min -> min
    expect(computeCalc(parseCalc("clamp(16px, calc(0.5rem + 2vw), 48px)")!, { viewport: 100 })!).toBeCloseTo(16)
  })
  test("min/max", () => {
    expect(computeCalc(parseCalc("min(10px, 2rem)")!, ctx)).toBe(10)   // 10 vs 32
    expect(computeCalc(parseCalc("max(10px, 2rem)")!, ctx)).toBe(32)
  })
  test("null when var() blocks computation", () => {
    expect(computeCalc(parseCalc("calc(10px + var(--x))")!, ctx)).toBeNull()
  })
})
```

**3b. Implement** `computeCalc(node, ctx)` (px/rem(16)/vw(viewport)/vh(ctx.viewportH ?? viewport)/% (ctx.basis) → number; `min`/`max`/`clamp` reduce; binary ops compute; `var()` → null) and `formatCalc(node)` (canonical re-serialization).

**Acceptance:** `pnpm exec vitest run tests/calc-editor-format.test.ts` green.

**Commit:** `feat(calc-editor): computeCalc evaluator + formatCalc serializer`.

---

## Task 4 — Components + index barrel

**Files:** `src/components/ui/calc-editor/calc-editor.tsx` (new), `src/components/ui/calc-editor/index.ts` (new). (If Task 1 used a stub component signature, replace it.)

**4a. Component test first** (`tests/calc-editor.test.tsx`):

```ts
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  CalcEditor, CalcEditorPanel, ExpressionField, FluidTypePlayground, TokenPalette,
} from "@/components/ui/calc-editor/calc-editor"

describe("CalcEditorPanel", () => {
  test("renders the expression field with the value", () => {
    render(<CalcEditorPanel value="calc(10px + 2rem)" onChange={() => {}} />)
    expect(screen.getByLabelText(/expression/i)).toHaveValue("calc(10px + 2rem)")
  })
  test("typing a valid expression emits onChange", () => {
    const onChange = vi.fn()
    render(<CalcEditorPanel value="calc(1px)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/expression/i), { target: { value: "calc(10px + 2rem)" } })
    expect(onChange).toHaveBeenCalledWith("calc(10px + 2rem)")
  })
  test("invalid (dimension mismatch) does NOT emit and shows a badge/error", () => {
    const onChange = vi.fn()
    render(<CalcEditorPanel value="calc(1px)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/expression/i), { target: { value: "calc(10px + 45deg)" } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText(/mismatch|invalid|—/i)).toBeInTheDocument()
  })
})

describe("ExpressionField", () => {
  test("shows a dimension badge", () => {
    render(<ExpressionField value="calc(10px + 2rem)" onChange={() => {}} dimension="length" />)
    expect(screen.getByText("length")).toBeInTheDocument()
  })
})

describe("TokenPalette", () => {
  test("clicking a token calls onInsert", () => {
    const onInsert = vi.fn()
    render(<TokenPalette onInsert={onInsert} />)
    fireEvent.click(screen.getByRole("button", { name: "+" }))
    expect(onInsert).toHaveBeenCalledWith(" + ")
  })
})

describe("FluidTypePlayground", () => {
  test("slider updates the computed readout", () => {
    render(<FluidTypePlayground expression="clamp(16px, calc(0.5rem + 2vw), 48px)" />)
    const slider = screen.getByRole("slider")
    fireEvent.change(slider, { target: { value: "1000" } })
    expect(screen.getByText(/px/)).toBeInTheDocument()
  })
})

describe("CalcEditor (popover trigger)", () => {
  test("renders a trigger button", () => {
    render(<CalcEditor value="calc(10px + 2rem)" onChange={() => {}} />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })
})
```

**4b. Implement** the components (use `useState` for `{ fn, expr }`, `useEffect` external resync with `lastEmittedRef` sentinel like easing). `ExpressionField` = `<Input>` + badge. `TokenPalette` = grid of insert buttons (operators `+ - * /`, units `px rem % vw em`, `var()`, `clamp(` `min(` `max(` `(` `)`). `FluidTypePlayground` = native range slider + `computeCalc` readout. `FunctionTabs` internal. `CalcEditor` wraps `CalcEditorPanel` in `<Popover>` with a trigger showing `fx` + truncated expr + dimension badge.

**4c. Write `index.ts`** barrel — re-export components + helper fns + all public types + `cssCalc`.

**Acceptance:** `pnpm exec vitest run tests/calc-editor.test.tsx` green; `tests/calc-editor-types.test-d.ts` now fully passes (component-narrowing imports resolve).

**Commit:** `feat(calc-editor): CalcEditor/CalcEditorPanel + ExpressionField/TokenPalette/FluidTypePlayground`.

---

## Task 5 — Demo page + examples + nav

**Files:** `pages/calc-editor/index.html`, `pages/calc-editor/main.tsx`, `src/pages/calc-editor/page.tsx`, `src/examples/calc-editor/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,fluid-type-playground}.tsx` (all new).

- Clone easing's `index.html`/`main.tsx` (swap title + page import).
- `page.tsx`: `Layout variant="compact"`, SectionHeaders, render the examples + `ApiReference`, `InstallCta args="add https://turtiesocks.github.io/ridiculous/r/calc-editor.json"`.
- Examples per spec §7.2. `tier-strict.tsx` uses `cssCalc(...)` with `@ts-expect-error` comments. `fluid-type-playground.tsx` is the showcase.
- Run `pnpm nav:build` after Task 6 (needs the registry entry).

**Acceptance:** files compile (`pnpm typecheck`). Visual not required headless.

**Commit:** `feat(calc-editor): demo page + tier examples + fluid-type playground`.

---

## Task 6 — Registry + coverage wiring

**Files:** `registry.json` (append item + add to `all`), `vitest.config.ts` (one line).

- Append a `calc-editor` item (4 files: index.ts, calc-editor.tsx, calc-editor.types.ts, calc-editor.helpers.ts; `registryDependencies: ["ridiculous-type-kit","button","popover","input"]`).
- Add `"https://turtiesocks.github.io/ridiculous/r/calc-editor.json"` to the `all` bundle's `registryDependencies` and update its description.
- Add `"src/components/ui/calc-editor/**"` to `coverage.include`.
- Run `pnpm registry:build` (regenerates `public/r/*.json` — gitignored, do NOT commit) and `pnpm nav:build`.

**Acceptance:** `registry:build` exits 0; `nav:build` writes 6 nav items.

**Commit:** `feat(calc-editor): registry entry + all-bundle + coverage include`.

---

## Task 7 — Green gate

Run in parallel (one Bash batch): `pnpm typecheck`, `pnpm check`, `pnpm test`. Then the full `pnpm pr:check`.

- Fix any biome (no semicolons, double quotes, sort imports).
- If vitest prints `@/generated/nav` errors → `pnpm nav:build` first.
- Confirm `calc-editor-types.test-d.ts` reports `Type Errors: no errors` and all suites green.

**Acceptance:** `pnpm pr:check` exits 0.

**Commit (if any fixups):** `chore(calc-editor): pr:check green`.

---

## Risk notes (from spec §7 / §2.2)

- **tsc budget:** prototype already green at ~baseline. After Task 1, re-`time` the typecheck; if it regresses badly, fall back to the §7 floor (name+paren+operator+leaf-is-dimension) and update the spec's §2 decision. (Not expected.)
- **var() asymmetry:** strict rejects, runtime tolerant — covered by tests in both Task 1 (never) and Task 2 (tolerant). Keep them consistent with the spec.
- **Depth cap knob (L2):** the exact weak-accept behavior at depth-exhaustion needs to be tuned against the 9-paren test in Task 1b — verify empirically.
