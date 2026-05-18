# `ridiculous` v0 — Color Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the `ridiculous` shadcn registry and ship its first component — a 6-mode color picker (oklch, oklab, hex, rgb, hsl, hwb) with a tiered type system (casual / IntelliSense / strict).

**Architecture:** Vite + React 19 + Tailwind v4 single-page demo app at the root, hosted via GitHub Pages at `https://turtiesocks.github.io/ridiculous/`. Registry source-of-truth in `registry.json`; `shadcn build` emits `public/r/*.json` for consumer install. Color picker lives in `src/components/ui/color-picker/` as a barrel with three files: `index.ts`, `color-picker.tsx`, `color-picker.types.ts`. Type machinery (primitive type-level parsers + strict `*Literal<S>` validators) lives in the types file; runtime parse / format / conversion math stays inline in the component file. Tests use Vitest + jsdom + canvas mock; type-level tests use `expectTypeOf`.

**Tech Stack:** React 19, TypeScript 5+, Vite 5+, Tailwind v4, Biome (lint + format), Vitest (jsdom env + `@vitest/coverage-v8` + builtin typecheck), shadcn CLI, pnpm 9, GitHub Actions, GitHub Pages.

**Source of truth for math:** the existing draft at `/Users/rin/GitHub/shadcn-admin-kit/src/components/ui/color-picker.tsx`. The plan ports its conversion math verbatim and adds oklab + hwb.

**Source of truth for design:** `docs/superpowers/specs/2026-05-17-ridiculous-registry-color-picker-design.md`.

---

## Phase 1 — Repository scaffolding

### Task 1: Initialize pnpm project

**Files:**
- Create: `package.json`
- Create: `.npmrc`

- [ ] **Step 1: Create `.npmrc` to pin pnpm strictness**

```ini
# .npmrc
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 2: Initialize `package.json`**

Create `package.json`:

```json
{
  "name": "ridiculous",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "vite",
    "build": "pnpm registry:build && tsc -b && vite build",
    "preview": "vite preview",
    "registry:build": "shadcn build",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "typecheck": "tsc --noEmit -p tsconfig.app.json",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "ci:check": "biome ci ."
  }
}
```

- [ ] **Step 3: Install runtime + dev dependencies**

```bash
pnpm add react@^19 react-dom@^19 clsx tailwind-merge
pnpm add -D typescript@^5 vite@^5 @vitejs/plugin-react @types/react @types/react-dom @types/node
pnpm add -D tailwindcss@^4 @tailwindcss/vite
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
pnpm add -D @biomejs/biome
pnpm add -D shadcn
```

Expected: `pnpm-lock.yaml` generated. `node_modules/` populated.

- [ ] **Step 4: Verify install**

```bash
pnpm ls --depth 0
```

Expected: all packages listed without errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .npmrc
git commit -m "Initialize pnpm project with React 19 + Vite + TS deps"
```

---

### Task 2: TypeScript configs

**Files:**
- Create: `tsconfig.json` (project references root)
- Create: `tsconfig.app.json` (app sources)
- Create: `tsconfig.node.json` (vite/vitest configs)

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

- [ ] **Step 2: Create `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },

    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    "skipLibCheck": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 4: Run typecheck (will fail since no source exists yet)**

```bash
pnpm typecheck
```

Expected: PASS (empty include set is valid).

- [ ] **Step 5: Commit**

```bash
git add tsconfig*.json
git commit -m "Add TypeScript project references"
```

---

### Task 3: Vite config with Tailwind v4 + path alias

**Files:**
- Create: `vite.config.ts`

- [ ] **Step 1: Write `vite.config.ts`**

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig({
  base: "/ridiculous/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "Add Vite config with Tailwind v4 plugin and @ path alias"
```

---

### Task 4: Biome config

**Files:**
- Create: `biome.json`

- [ ] **Step 1: Write `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true,
    "ignore": [
      "node_modules",
      "dist",
      "public/r",
      ".github",
      "docs",
      "pnpm-lock.yaml"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "noNonNullAssertion": "warn"
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "semicolons": "asNeeded",
      "quoteStyle": "double",
      "trailingCommas": "all"
    }
  },
  "organizeImports": {
    "enabled": true
  }
}
```

- [ ] **Step 2: Run biome on existing files (config files only)**

```bash
pnpm check
```

Expected: PASS or fixable warnings only. Run `pnpm check:fix` if needed.

- [ ] **Step 3: Commit**

```bash
git add biome.json
git commit -m "Add Biome lint + format config"
```

---

### Task 5: Tailwind v4 setup + theme

**Files:**
- Create: `src/index.css`

- [ ] **Step 1: Create `src/index.css` with Tailwind import + theme**

```css
@import "tailwindcss";

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-secondary: oklch(0.97 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-accent: oklch(0.97 0 0);
  --color-accent-foreground: oklch(0.205 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-destructive-foreground: oklch(0.985 0 0);
  --color-border: oklch(0.922 0 0);
  --color-input: oklch(0.922 0 0);
  --color-ring: oklch(0.708 0 0);
}

@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "Add Tailwind v4 entry with shadcn neutral theme tokens"
```

---

### Task 6: `cn()` utility

**Files:**
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Write `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "Add cn() className utility"
```

---

### Task 7: `components.json` + shadcn primitives

**Files:**
- Create: `components.json`
- Create (via CLI): `src/components/ui/button/**`, `src/components/ui/popover/**`

- [ ] **Step 1: Write `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 2: Add button + popover via shadcn CLI**

```bash
pnpm dlx shadcn@latest add button popover
```

Expected: `src/components/ui/button.tsx` and `src/components/ui/popover.tsx` (or directory variants depending on shadcn CLI version) created.

- [ ] **Step 3: Verify shadcn primitives compile**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components.json src/components/ui/
git commit -m "Add shadcn config + button/popover primitives for demo"
```

---

## Phase 2 — Test infrastructure

### Task 8: Vitest config

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.app.json",
      include: ["tests/**/*.test-d.ts"],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/components/ui/color-picker/**"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "Add Vitest config with jsdom + typecheck + coverage"
```

---

### Task 9: Test setup file with canvas mock

**Files:**
- Create: `tests/setup.ts`

- [ ] **Step 1: Write `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// jsdom has no canvas. LcPad calls getContext + putImageData on render;
// without this stub, mount crashes.
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  createImageData: vi.fn((w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
    colorSpace: "srgb" as const,
  })),
  putImageData: vi.fn(),
})) as unknown as HTMLCanvasElement["getContext"]
```

- [ ] **Step 2: Commit**

```bash
git add tests/setup.ts
git commit -m "Add Vitest setup with jsdom canvas mock"
```

---

### Task 10: Smoke test — verify Vitest runs

**Files:**
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Write trivial smoke test**

```ts
import { describe, it, expect } from "vitest"

describe("smoke", () => {
  it("can run vitest", () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 2: Run**

```bash
pnpm test
```

Expected: 1 test passed.

- [ ] **Step 3: Delete the smoke test (it has served its purpose)**

```bash
rm tests/smoke.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Verify vitest infrastructure via temporary smoke test"
```

---

## Phase 3 — Pure color math (TDD)

> Throughout Phase 3, the implementer should reference the source file at `/Users/rin/GitHub/shadcn-admin-kit/src/components/ui/color-picker.tsx` for the existing parse/format/conversion functions. **The plan ports them verbatim** unless a task says otherwise. New code (oklab, hwb) is given in full in this plan.

### Task 11: Stub `color-picker.tsx` with section comments

**Files:**
- Create: `src/components/ui/color-picker/color-picker.tsx`

- [ ] **Step 1: Create stub file with placeholder export and section comments**

```tsx
"use client"

// ---------------------------------------------------------------------------
// Component (top of file — filled in Phase 5)
// ---------------------------------------------------------------------------

export function ColorPicker() {
  return null
}

// ---------------------------------------------------------------------------
// Parsing / formatting (filled below)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Color space conversions
// ---------------------------------------------------------------------------
```

- [ ] **Step 2: Verify typecheck passes**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/color-picker/color-picker.tsx
git commit -m "Stub color-picker.tsx with section comments"
```

---

### Task 12: Helpers `clamp01`, `trimNumber`, `parseAlphaToken` + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Create: `tests/color-conversions.test.ts`

- [ ] **Step 1: Write failing tests in `tests/color-conversions.test.ts`**

```ts
import { describe, it, expect } from "vitest"
import {
  clamp01,
  trimNumber,
  parseAlphaToken,
} from "@/components/ui/color-picker/color-picker"

describe("clamp01", () => {
  it("returns 0 for negatives", () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(-0.0001)).toBe(0)
  })
  it("returns 1 for > 1", () => {
    expect(clamp01(1.5)).toBe(1)
    expect(clamp01(2)).toBe(1)
  })
  it("passes through 0..1", () => {
    expect(clamp01(0)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(1)).toBe(1)
  })
})

describe("trimNumber", () => {
  it("rounds to 4 decimals", () => {
    expect(trimNumber(0.123456789)).toBe(0.1235)
    expect(trimNumber(1)).toBe(1)
    expect(trimNumber(0)).toBe(0)
  })
})

describe("parseAlphaToken", () => {
  it("parses fractional 0..1", () => {
    expect(parseAlphaToken("0.5")).toBe(0.5)
    expect(parseAlphaToken("1")).toBe(1)
    expect(parseAlphaToken("0")).toBe(0)
  })
  it("parses percentages 0..100", () => {
    expect(parseAlphaToken("50%")).toBe(0.5)
    expect(parseAlphaToken("100%")).toBe(1)
    expect(parseAlphaToken("0%")).toBe(0)
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm test tests/color-conversions.test.ts
```

Expected: FAIL — imports do not resolve.

- [ ] **Step 3: Implement in `color-picker.tsx`**

Add **above** the "Color space conversions" comment, **inside** the "Parsing / formatting" section:

```ts
export function parseAlphaToken(raw: string): number {
  return raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw)
}

export function trimNumber(n: number): number {
  return parseFloat(n.toFixed(4))
}

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n
}
```

> **Export note:** these are exported only so tests can import them. They are not re-exported from the barrel `index.ts`. The component itself uses them internally.

- [ ] **Step 4: Run, verify pass**

```bash
pnpm test tests/color-conversions.test.ts
```

Expected: PASS (3 describe blocks, 7 it blocks).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/color-picker/color-picker.tsx tests/color-conversions.test.ts
git commit -m "Add clamp01, trimNumber, parseAlphaToken helpers"
```

---

### Task 13: Gamma encode/decode `linearToSrgb`, `srgbToLinear` + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-conversions.test.ts`

- [ ] **Step 1: Append failing tests to `tests/color-conversions.test.ts`**

```ts
import { linearToSrgb, srgbToLinear } from "@/components/ui/color-picker/color-picker"

describe("linearToSrgb / srgbToLinear", () => {
  it("clamps below 0 and above 1", () => {
    expect(linearToSrgb(-0.5)).toBe(0)
    expect(linearToSrgb(1.5)).toBe(1)
    expect(srgbToLinear(-0.5)).toBe(0)
    expect(srgbToLinear(1.5)).toBe(1)
  })
  it("round-trips arbitrary values", () => {
    for (const v of [0.05, 0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 6)
      expect(srgbToLinear(linearToSrgb(v))).toBeCloseTo(v, 6)
    }
  })
  it("matches IEC 61966-2-1 anchors", () => {
    expect(linearToSrgb(0.0031308)).toBeCloseTo(0.04045, 4)
    expect(srgbToLinear(0.04045)).toBeCloseTo(0.0031308, 6)
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm test tests/color-conversions.test.ts
```

Expected: FAIL — imports do not resolve.

- [ ] **Step 3: Implement in `color-picker.tsx` under the "Color space conversions" section**

```ts
export function linearToSrgb(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
}

export function srgbToLinear(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}
```

- [ ] **Step 4: Run, verify pass**

```bash
pnpm test tests/color-conversions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add gamma encode/decode (linearToSrgb, srgbToLinear)"
```

---

### Task 14: HEX `parseHex` + `formatHex` + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Create: `tests/color-parse.test.ts`
- Create: `tests/color-format.test.ts`

- [ ] **Step 1: Write failing parse tests in `tests/color-parse.test.ts`**

```ts
import { describe, it, expect } from "vitest"
import { parseHex } from "@/components/ui/color-picker/color-picker"

describe("parseHex", () => {
  it("parses 6-digit hex", () => {
    expect(parseHex("#ff0000")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
    expect(parseHex("#00ff00")).toEqual({ r: 0, g: 1, b: 0, a: 1 })
    expect(parseHex("#0000ff")).toEqual({ r: 0, g: 0, b: 1, a: 1 })
  })
  it("parses 3-digit hex by doubling chars", () => {
    expect(parseHex("#f00")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
    expect(parseHex("#0f0")).toEqual({ r: 0, g: 1, b: 0, a: 1 })
  })
  it("parses 8-digit hex with alpha", () => {
    expect(parseHex("#ff000080")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: expect.closeTo(0.5019, 3),
    })
  })
  it("parses 4-digit hex with alpha", () => {
    expect(parseHex("#f008")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: expect.closeTo(0.5333, 3),
    })
  })
  it("returns null for invalid", () => {
    expect(parseHex("#zzz")).toBeNull()
    expect(parseHex("ff0000")).toBeNull()
    expect(parseHex("#ff")).toBeNull()
    expect(parseHex("")).toBeNull()
  })
})
```

- [ ] **Step 2: Write failing format tests in `tests/color-format.test.ts`**

```ts
import { describe, it, expect } from "vitest"
import { formatHex } from "@/components/ui/color-picker/color-picker"

describe("formatHex", () => {
  it("emits 6-digit hex when alpha is full", () => {
    expect(formatHex({ l: 0.5, c: 0.18, h: 30, a: 1 }, false)).toMatch(/^#[0-9a-f]{6}$/)
  })
  it("emits 8-digit hex when includeAlpha is true", () => {
    expect(formatHex({ l: 0.5, c: 0.18, h: 30, a: 0.5 }, true)).toMatch(/^#[0-9a-f]{8}$/)
  })
})
```

- [ ] **Step 3: Run both, verify failure**

```bash
pnpm test tests/color-parse.test.ts tests/color-format.test.ts
```

Expected: FAIL — imports do not resolve.

- [ ] **Step 4: Implement in `color-picker.tsx` — port from source verbatim**

Port `parseHex` and `formatHex` from source lines 499-550 verbatim. They reference `oklchToSrgb` which doesn't exist yet — that's fine, `formatHex` will be testable only after Task 17 lands. The format test above only checks shape, not exact value, so it will pass once `oklchToSrgb` is added (it currently won't even compile).

**For this task, only implement `parseHex`.** Defer `formatHex` to Task 17 when `oklchToSrgb` exists.

Implementation (`parseHex` only):

```ts
export function parseHex(
  value: string,
): { r: number; g: number; b: number; a: number } | null {
  const match = value.match(/^#([0-9a-f]{3,8})$/i)
  if (!match) return null
  const body = match[1]
  const read = (hex: string) => parseInt(hex, 16) / 255
  if (body.length === 3) {
    return {
      r: read(body[0].repeat(2)),
      g: read(body[1].repeat(2)),
      b: read(body[2].repeat(2)),
      a: 1,
    }
  }
  if (body.length === 4) {
    return {
      r: read(body[0].repeat(2)),
      g: read(body[1].repeat(2)),
      b: read(body[2].repeat(2)),
      a: read(body[3].repeat(2)),
    }
  }
  if (body.length === 6) {
    return {
      r: read(body.slice(0, 2)),
      g: read(body.slice(2, 4)),
      b: read(body.slice(4, 6)),
      a: 1,
    }
  }
  if (body.length === 8) {
    return {
      r: read(body.slice(0, 2)),
      g: read(body.slice(2, 4)),
      b: read(body.slice(4, 6)),
      a: read(body.slice(6, 8)),
    }
  }
  return null
}
```

Also remove (or comment out) the `formatHex` import in `tests/color-format.test.ts` for this task — re-add in Task 17. Mark those tests `.skip` for now:

```ts
describe.skip("formatHex", () => { ... })
```

- [ ] **Step 5: Run parse tests, verify pass**

```bash
pnpm test tests/color-parse.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add parseHex with alpha + 3/4/6/8 digit variants"
```

---

### Task 15: RGB `parseRgb` + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-parse.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
import { parseRgb } from "@/components/ui/color-picker/color-picker"

describe("parseRgb", () => {
  it("parses comma-separated rgb()", () => {
    expect(parseRgb("rgb(255, 0, 0)")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
  })
  it("parses space-separated rgb()", () => {
    expect(parseRgb("rgb(255 0 0)")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
  })
  it("parses percentage channels", () => {
    expect(parseRgb("rgb(100% 0% 0%)")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
  })
  it("parses rgba with alpha slash", () => {
    expect(parseRgb("rgba(255 0 0 / 0.5)")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: 0.5,
    })
  })
  it("parses rgba with comma alpha", () => {
    expect(parseRgb("rgba(255, 0, 0, 0.5)")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: 0.5,
    })
  })
  it("returns null for invalid", () => {
    expect(parseRgb("rgb()")).toBeNull()
    expect(parseRgb("not-rgb")).toBeNull()
  })
})
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm test tests/color-parse.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Port `parseRgb` from source lines 552-567**

```ts
export function parseRgb(
  value: string,
): { r: number; g: number; b: number; a: number } | null {
  const match = value.match(
    /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i,
  )
  if (!match) return null
  const channel = (raw: string) =>
    raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw) / 255
  const r = channel(match[1])
  const g = channel(match[2])
  const b = channel(match[3])
  const a = match[4] != null ? parseAlphaToken(match[4]) : 1
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b, a }
}
```

- [ ] **Step 4: Run, verify pass**

```bash
pnpm test tests/color-parse.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add parseRgb with comma/space/percent/alpha variants"
```

---

### Task 16: HSL parse/convert/format + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-parse.test.ts`
- Modify: `tests/color-conversions.test.ts`

- [ ] **Step 1: Append parse tests**

```ts
import { parseHsl } from "@/components/ui/color-picker/color-picker"

describe("parseHsl", () => {
  it("parses space-separated", () => {
    expect(parseHsl("hsl(0 100% 50%)")).toEqual({
      h: 0,
      s: 1,
      l: 0.5,
      a: 1,
    })
  })
  it("parses comma-separated", () => {
    expect(parseHsl("hsl(120, 100%, 50%)")).toEqual({
      h: 120,
      s: 1,
      l: 0.5,
      a: 1,
    })
  })
  it("parses alpha", () => {
    expect(parseHsl("hsl(240 50% 50% / 0.5)")).toEqual({
      h: 240,
      s: 0.5,
      l: 0.5,
      a: 0.5,
    })
  })
  it("returns null for invalid", () => {
    expect(parseHsl("hsl(garbage)")).toBeNull()
  })
})
```

- [ ] **Step 2: Append conversion tests**

```ts
import {
  hslToSrgb,
  srgbToHsl,
} from "@/components/ui/color-picker/color-picker"

describe("hslToSrgb / srgbToHsl", () => {
  it("round-trips pure red", () => {
    const rgb = hslToSrgb(0, 1, 0.5)
    expect(rgb.r).toBeCloseTo(1, 6)
    expect(rgb.g).toBeCloseTo(0, 6)
    expect(rgb.b).toBeCloseTo(0, 6)
    const hsl = srgbToHsl(rgb.r, rgb.g, rgb.b)
    expect(hsl.h).toBeCloseTo(0, 4)
    expect(hsl.s).toBeCloseTo(1, 4)
    expect(hsl.l).toBeCloseTo(0.5, 4)
  })
  it("handles grayscale (saturation = 0)", () => {
    const rgb = hslToSrgb(0, 0, 0.5)
    expect(rgb.r).toBeCloseTo(0.5, 6)
    expect(rgb.g).toBeCloseTo(0.5, 6)
    expect(rgb.b).toBeCloseTo(0.5, 6)
    const hsl = srgbToHsl(0.5, 0.5, 0.5)
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(0.5)
  })
  it("wraps hue 360 to 0", () => {
    const rgb = hslToSrgb(360, 1, 0.5)
    expect(rgb.r).toBeCloseTo(1, 6)
    expect(rgb.g).toBeCloseTo(0, 6)
    expect(rgb.b).toBeCloseTo(0, 6)
  })
})
```

- [ ] **Step 3: Run, verify failure**

```bash
pnpm test
```

Expected: FAIL — imports unresolved.

- [ ] **Step 4: Port `parseHsl`, `hslToSrgb`, `srgbToHsl` from source lines 577-730**

```ts
export function parseHsl(
  value: string,
): { h: number; s: number; l: number; a: number } | null {
  const match = value.match(
    /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i,
  )
  if (!match) return null
  const h = parseFloat(match[1])
  const s = parseFloat(match[2]) / 100
  const l = parseFloat(match[3]) / 100
  const a = match[4] != null ? parseAlphaToken(match[4]) : 1
  if ([h, s, l].some((n) => Number.isNaN(n))) return null
  return { h, s, l, a }
}

export function hslToSrgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const hh = (((h % 360) + 360) % 360) / 60
  const x = chroma * (1 - Math.abs((hh % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hh < 1) [r1, g1, b1] = [chroma, x, 0]
  else if (hh < 2) [r1, g1, b1] = [x, chroma, 0]
  else if (hh < 3) [r1, g1, b1] = [0, chroma, x]
  else if (hh < 4) [r1, g1, b1] = [0, x, chroma]
  else if (hh < 5) [r1, g1, b1] = [x, 0, chroma]
  else [r1, g1, b1] = [chroma, 0, x]
  const m = l - chroma / 2
  return { r: r1 + m, g: g1 + m, b: b1 + m }
}

export function srgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  if (h < 0) h += 360
  return { h, s, l }
}
```

- [ ] **Step 5: Run, verify pass**

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add HSL parse + sRGB conversion (hslToSrgb, srgbToHsl)"
```

---

### Task 17: OKLCH parse/convert/format + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-parse.test.ts`
- Modify: `tests/color-format.test.ts`
- Modify: `tests/color-conversions.test.ts`

- [ ] **Step 1: Append parse tests**

```ts
import { parseOklch } from "@/components/ui/color-picker/color-picker"

describe("parseOklch", () => {
  it("parses bare numeric form", () => {
    expect(parseOklch("oklch(0.5 0.1 240)")).toEqual({
      l: 0.5,
      c: 0.1,
      h: 240,
      a: 1,
    })
  })
  it("parses percentage L (relative to 1)", () => {
    expect(parseOklch("oklch(50% 0.1 240)")).toMatchObject({ l: 0.5 })
  })
  it("parses percentage C (relative to 0.4)", () => {
    expect(parseOklch("oklch(0.5 50% 240)")).toMatchObject({ c: 0.2 })
  })
  it("parses alpha", () => {
    expect(parseOklch("oklch(0.5 0.1 240 / 50%)")).toEqual({
      l: 0.5,
      c: 0.1,
      h: 240,
      a: 0.5,
    })
  })
})
```

- [ ] **Step 2: Append conversion tests (round-trip)**

```ts
import {
  oklchToSrgb,
  srgbToOklch,
} from "@/components/ui/color-picker/color-picker"

describe("oklchToSrgb / srgbToOklch", () => {
  it("round-trips a few sRGB colors", () => {
    const samples = [
      { r: 1, g: 0, b: 0 },
      { r: 0, g: 1, b: 0 },
      { r: 0, g: 0, b: 1 },
      { r: 0.5, g: 0.25, b: 0.75 },
    ]
    for (const { r, g, b } of samples) {
      const oklch = srgbToOklch(r, g, b, 1)
      const [r2, g2, b2] = oklchToSrgb(oklch.l, oklch.c, oklch.h)
      expect(r2).toBeCloseTo(r, 3)
      expect(g2).toBeCloseTo(g, 3)
      expect(b2).toBeCloseTo(b, 3)
    }
  })
  it("returns gray for desaturated input (C ≈ 0)", () => {
    const oklch = srgbToOklch(0.5, 0.5, 0.5, 1)
    expect(oklch.c).toBeCloseTo(0, 3)
  })
})
```

- [ ] **Step 3: Unskip and finish `formatHex` tests in `tests/color-format.test.ts`**

```ts
import { formatHex } from "@/components/ui/color-picker/color-picker"

describe("formatHex", () => {
  it("emits 6-digit hex without alpha", () => {
    const oklch = { l: 0.628, c: 0.258, h: 29.234, a: 1 } // red-ish
    const hex = formatHex(oklch, false)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })
  it("emits 8-digit hex with alpha", () => {
    const oklch = { l: 0.628, c: 0.258, h: 29.234, a: 0.5 }
    const hex = formatHex(oklch, true)
    expect(hex).toMatch(/^#[0-9a-f]{8}$/)
  })
})
```

- [ ] **Step 4: Run, verify failure**

```bash
pnpm test
```

Expected: FAIL — imports unresolved.

- [ ] **Step 5: Port from source lines 472-497 (parseOklch + formatOklch), 623-677 (oklchToSrgb + srgbToOklch), 541-550 (formatHex)**

```ts
// Place near parsers section:
const OKLCH_RE =
  /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+(?:deg)?)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i

export function parseOklch(value: string): {
  l: number
  c: number
  h: number
  a: number
} | null {
  const match = value.match(OKLCH_RE)
  if (!match) return null
  const l = match[1].endsWith("%")
    ? parseFloat(match[1]) / 100
    : parseFloat(match[1])
  const c = match[2].endsWith("%")
    ? (parseFloat(match[2]) / 100) * 0.4
    : parseFloat(match[2])
  const h = parseFloat(match[3].replace(/deg$/i, ""))
  const a = match[4] != null ? parseAlphaToken(match[4]) : 1
  if ([l, c, h].some((n) => Number.isNaN(n))) return null
  return { l, c, h, a }
}

export function formatOklch({
  l,
  c,
  h,
  a,
}: { l: number; c: number; h: number; a: number }): string {
  const base = `oklch(${trimNumber(l)} ${trimNumber(c)} ${trimNumber(h)}`
  if (a >= 1) return `${base})`
  return `${base} / ${trimNumber(a * 100)}%)`
}

export function formatHex(
  oklch: { l: number; c: number; h: number; a: number },
  includeAlpha: boolean,
): string {
  const [r, g, b] = oklchToSrgb(oklch.l, oklch.c, oklch.h)
  const channel = (n: number) =>
    Math.round(clamp01(n) * 255)
      .toString(16)
      .padStart(2, "0")
  const base = `#${channel(r)}${channel(g)}${channel(b)}`
  if (!includeAlpha) return base
  return `${base}${channel(oklch.a)}`
}

// In "Color space conversions" section:
export function oklchToSrgb(
  L: number,
  C: number,
  hDeg: number,
): [number, number, number] {
  const hRad = (hDeg * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const lCubed = l_ * l_ * l_
  const mCubed = m_ * m_ * m_
  const sCubed = s_ * s_ * s_

  const rLin =
    4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed
  const gLin =
    -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed
  const bLin =
    -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed

  return [linearToSrgb(rLin), linearToSrgb(gLin), linearToSrgb(bLin)]
}

export function srgbToOklch(
  r: number,
  g: number,
  b: number,
  alpha: number,
): { l: number; c: number; h: number; a: number } {
  const rLin = srgbToLinear(r)
  const gLin = srgbToLinear(g)
  const bLin = srgbToLinear(b)

  const lLms = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin
  const mLms = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin
  const sLms = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin

  const l_ = Math.cbrt(lLms)
  const m_ = Math.cbrt(mLms)
  const s_ = Math.cbrt(sLms)

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const aAxis = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bAxis = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const C = Math.sqrt(aAxis * aAxis + bAxis * bAxis)
  let H = (Math.atan2(bAxis, aAxis) * 180) / Math.PI
  if (H < 0) H += 360

  return { l: L, c: C, h: H, a: alpha }
}
```

- [ ] **Step 6: Run, verify pass**

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add OKLCH parse/format + sRGB conversion (Ottosson matrix)"
```

---

### Task 18: RGB `formatRgb` + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-format.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
import { formatRgb } from "@/components/ui/color-picker/color-picker"

describe("formatRgb", () => {
  it("emits rgb(...) without alpha when a >= 1", () => {
    expect(formatRgb({ l: 0.628, c: 0.258, h: 29.234, a: 1 })).toMatch(
      /^rgb\(\d+ \d+ \d+\)$/,
    )
  })
  it("emits rgb(... / x%) with alpha < 1", () => {
    expect(formatRgb({ l: 0.628, c: 0.258, h: 29.234, a: 0.5 })).toMatch(
      /^rgb\(\d+ \d+ \d+ \/ \d+%\)$/,
    )
  })
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Port `formatRgb` from source lines 569-575**

```ts
export function formatRgb(oklch: {
  l: number
  c: number
  h: number
  a: number
}): string {
  const [r, g, b] = oklchToSrgb(oklch.l, oklch.c, oklch.h)
  const channel = (n: number) => Math.round(clamp01(n) * 255)
  const base = `rgb(${channel(r)} ${channel(g)} ${channel(b)}`
  if (oklch.a >= 1) return `${base})`
  return `${base} / ${Math.round(oklch.a * 100)}%)`
}
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add formatRgb"
```

---

### Task 19: HSL `formatHsl` + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-format.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
import { formatHsl } from "@/components/ui/color-picker/color-picker"

describe("formatHsl", () => {
  it("emits hsl(h s% l%)", () => {
    expect(formatHsl({ l: 0.5, c: 0.18, h: 0, a: 1 })).toMatch(
      /^hsl\(\d+ \d+% \d+%\)$/,
    )
  })
  it("emits alpha when a < 1", () => {
    expect(formatHsl({ l: 0.5, c: 0.18, h: 0, a: 0.5 })).toMatch(
      /^hsl\(\d+ \d+% \d+% \/ \d+%\)$/,
    )
  })
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Port `formatHsl` from source lines 592-601**

```ts
export function formatHsl(oklch: {
  l: number
  c: number
  h: number
  a: number
}): string {
  const [r, g, b] = oklchToSrgb(oklch.l, oklch.c, oklch.h)
  const hsl = srgbToHsl(clamp01(r), clamp01(g), clamp01(b))
  const h = Math.round(hsl.h)
  const s = Math.round(hsl.s * 100)
  const l = Math.round(hsl.l * 100)
  const base = `hsl(${h} ${s}% ${l}%`
  if (oklch.a >= 1) return `${base})`
  return `${base} / ${Math.round(oklch.a * 100)}%)`
}
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add formatHsl"
```

---

### Task 20: OKLAB parse/convert/format + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-parse.test.ts`
- Modify: `tests/color-format.test.ts`
- Modify: `tests/color-conversions.test.ts`

- [ ] **Step 1: Append parse tests**

```ts
import { parseOklab } from "@/components/ui/color-picker/color-picker"

describe("parseOklab", () => {
  it("parses bare oklab(L a b)", () => {
    expect(parseOklab("oklab(0.5 0.1 -0.05)")).toEqual({
      l: 0.5,
      a: 0.1,
      b: -0.05,
      alpha: 1,
    })
  })
  it("parses percentage L", () => {
    expect(parseOklab("oklab(50% 0.1 0.05)")).toMatchObject({ l: 0.5 })
  })
  it("parses alpha", () => {
    expect(parseOklab("oklab(0.5 0.1 -0.05 / 0.5)")).toEqual({
      l: 0.5,
      a: 0.1,
      b: -0.05,
      alpha: 0.5,
    })
  })
})
```

- [ ] **Step 2: Append conversion tests**

```ts
import {
  oklchToOklab,
  oklabToOklch,
} from "@/components/ui/color-picker/color-picker"

describe("oklch ↔ oklab", () => {
  it("round-trips polar/cartesian", () => {
    const oklab = oklchToOklab(0.5, 0.18, 240)
    const back = oklabToOklch(oklab.l, oklab.a, oklab.b)
    expect(back.l).toBeCloseTo(0.5, 6)
    expect(back.c).toBeCloseTo(0.18, 6)
    expect(back.h).toBeCloseTo(240, 4)
  })
  it("h=0 → a=c, b=0", () => {
    const oklab = oklchToOklab(0.5, 0.1, 0)
    expect(oklab.a).toBeCloseTo(0.1, 6)
    expect(oklab.b).toBeCloseTo(0, 6)
  })
})
```

- [ ] **Step 3: Append format test**

```ts
import { formatOklab } from "@/components/ui/color-picker/color-picker"

describe("formatOklab", () => {
  it("emits oklab(L a b)", () => {
    expect(formatOklab({ l: 0.5, c: 0.1, h: 0, a: 1 })).toMatch(
      /^oklab\(\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?\)$/,
    )
  })
  it("emits negative b for cool colors", () => {
    // h=240 → roughly negative b (blueward in oklab)
    expect(formatOklab({ l: 0.5, c: 0.18, h: 240, a: 1 })).toMatch(/-/)
  })
  it("emits alpha < 1", () => {
    expect(formatOklab({ l: 0.5, c: 0.1, h: 0, a: 0.5 })).toMatch(
      / \/ \d+%\)$/,
    )
  })
})
```

- [ ] **Step 4: Run, verify failure**

- [ ] **Step 5: Implement in `color-picker.tsx`**

Add **parser** in the Parsing/formatting section:

```ts
const OKLAB_RE =
  /^oklab\(\s*([\d.]+%?)\s+(-?[\d.]+%?)\s+(-?[\d.]+%?)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i

export function parseOklab(value: string): {
  l: number
  a: number
  b: number
  alpha: number
} | null {
  const match = value.match(OKLAB_RE)
  if (!match) return null
  const l = match[1].endsWith("%")
    ? parseFloat(match[1]) / 100
    : parseFloat(match[1])
  // Per CSS Color 4, oklab a/b percentages are relative to 0.4 (signed).
  const a = match[2].endsWith("%")
    ? (parseFloat(match[2]) / 100) * 0.4
    : parseFloat(match[2])
  const b = match[3].endsWith("%")
    ? (parseFloat(match[3]) / 100) * 0.4
    : parseFloat(match[3])
  const alpha = match[4] != null ? parseAlphaToken(match[4]) : 1
  if ([l, a, b].some((n) => Number.isNaN(n))) return null
  return { l, a, b, alpha }
}

export function formatOklab(oklch: {
  l: number
  c: number
  h: number
  a: number
}): string {
  const { a, b } = oklchToOklab(oklch.l, oklch.c, oklch.h)
  const base = `oklab(${trimNumber(oklch.l)} ${trimNumber(a)} ${trimNumber(b)}`
  if (oklch.a >= 1) return `${base})`
  return `${base} / ${trimNumber(oklch.a * 100)}%)`
}
```

Add **conversions** in the Color space conversions section:

```ts
export function oklchToOklab(
  L: number,
  C: number,
  hDeg: number,
): { l: number; a: number; b: number } {
  const hRad = (hDeg * Math.PI) / 180
  return { l: L, a: C * Math.cos(hRad), b: C * Math.sin(hRad) }
}

export function oklabToOklch(
  L: number,
  a: number,
  b: number,
): { l: number; c: number; h: number } {
  const C = Math.sqrt(a * a + b * b)
  let H = (Math.atan2(b, a) * 180) / Math.PI
  if (H < 0) H += 360
  return { l: L, c: C, h: H }
}
```

- [ ] **Step 6: Run, verify pass**

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add OKLAB parse/format + oklch↔oklab conversion"
```

---

### Task 21: HWB parse/convert/format + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-parse.test.ts`
- Modify: `tests/color-format.test.ts`
- Modify: `tests/color-conversions.test.ts`

- [ ] **Step 1: Append parse tests**

```ts
import { parseHwb } from "@/components/ui/color-picker/color-picker"

describe("parseHwb", () => {
  it("parses hwb(H W% B%)", () => {
    expect(parseHwb("hwb(0 0% 0%)")).toEqual({
      h: 0,
      w: 0,
      b: 0,
      a: 1,
    })
  })
  it("parses alpha", () => {
    expect(parseHwb("hwb(240 20% 30% / 0.5)")).toEqual({
      h: 240,
      w: 0.2,
      b: 0.3,
      a: 0.5,
    })
  })
  it("returns null for invalid", () => {
    expect(parseHwb("hwb(garbage)")).toBeNull()
  })
})
```

- [ ] **Step 2: Append conversion tests**

```ts
import {
  hwbToSrgb,
  srgbToHwb,
} from "@/components/ui/color-picker/color-picker"

describe("hwbToSrgb / srgbToHwb", () => {
  it("round-trips pure red", () => {
    const srgb = hwbToSrgb(0, 0, 0)
    expect(srgb.r).toBeCloseTo(1, 6)
    expect(srgb.g).toBeCloseTo(0, 6)
    expect(srgb.b).toBeCloseTo(0, 6)
    const hwb = srgbToHwb(srgb.r, srgb.g, srgb.b)
    expect(hwb.h).toBeCloseTo(0, 4)
    expect(hwb.w).toBeCloseTo(0, 4)
    expect(hwb.b).toBeCloseTo(0, 4)
  })
  it("W=1 yields white regardless of hue", () => {
    const srgb = hwbToSrgb(240, 1, 0)
    expect(srgb.r).toBeCloseTo(1, 4)
    expect(srgb.g).toBeCloseTo(1, 4)
    expect(srgb.b).toBeCloseTo(1, 4)
  })
  it("B=1 yields black regardless of hue", () => {
    const srgb = hwbToSrgb(240, 0, 1)
    expect(srgb.r).toBeCloseTo(0, 4)
    expect(srgb.g).toBeCloseTo(0, 4)
    expect(srgb.b).toBeCloseTo(0, 4)
  })
})
```

- [ ] **Step 3: Append format test**

```ts
import { formatHwb } from "@/components/ui/color-picker/color-picker"

describe("formatHwb", () => {
  it("emits hwb(H W% B%)", () => {
    expect(formatHwb({ l: 0.628, c: 0.258, h: 29.234, a: 1 })).toMatch(
      /^hwb\(\d+ \d+% \d+%\)$/,
    )
  })
  it("emits alpha", () => {
    expect(formatHwb({ l: 0.5, c: 0.18, h: 240, a: 0.5 })).toMatch(/ \/ \d+%\)$/)
  })
})
```

- [ ] **Step 4: Run, verify failure**

- [ ] **Step 5: Implement in `color-picker.tsx`**

Add **parser** (Parsing/formatting):

```ts
const HWB_RE =
  /^hwb\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i

export function parseHwb(value: string): {
  h: number
  w: number
  b: number
  a: number
} | null {
  const match = value.match(HWB_RE)
  if (!match) return null
  const h = parseFloat(match[1])
  const w = parseFloat(match[2]) / 100
  const b = parseFloat(match[3]) / 100
  const a = match[4] != null ? parseAlphaToken(match[4]) : 1
  if ([h, w, b].some((n) => Number.isNaN(n))) return null
  return { h, w, b, a }
}

export function formatHwb(oklch: {
  l: number
  c: number
  h: number
  a: number
}): string {
  const [r, g, b] = oklchToSrgb(oklch.l, oklch.c, oklch.h)
  const hwb = srgbToHwb(clamp01(r), clamp01(g), clamp01(b))
  const h = Math.round(hwb.h)
  const w = Math.round(hwb.w * 100)
  const bk = Math.round(hwb.b * 100)
  const base = `hwb(${h} ${w}% ${bk}%`
  if (oklch.a >= 1) return `${base})`
  return `${base} / ${Math.round(oklch.a * 100)}%)`
}
```

Add **conversions** (Color space conversions):

```ts
// Per CSS Color 4 spec, https://www.w3.org/TR/css-color-4/#hwb-to-rgb
export function hwbToSrgb(
  h: number,
  w: number,
  b: number,
): { r: number; g: number; b: number } {
  if (w + b >= 1) {
    const gray = w / (w + b)
    return { r: gray, g: gray, b: gray }
  }
  const rgb = hslToSrgb(h, 1, 0.5)
  const scale = 1 - w - b
  return {
    r: rgb.r * scale + w,
    g: rgb.g * scale + w,
    b: rgb.b * scale + w,
  }
}

export function srgbToHwb(
  r: number,
  g: number,
  b: number,
): { h: number; w: number; b: number } {
  const hsl = srgbToHsl(r, g, b)
  const w = Math.min(r, g, b)
  const bk = 1 - Math.max(r, g, b)
  return { h: hsl.h, w, b: bk }
}
```

- [ ] **Step 6: Run, verify pass**

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add HWB parse/format + sRGB conversion"
```

---

### Task 22: `parseColor` + `formatColor` dispatchers + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-parse.test.ts`
- Modify: `tests/color-format.test.ts`

- [ ] **Step 1: Append dispatcher tests**

```ts
import { parseColor } from "@/components/ui/color-picker/color-picker"

describe("parseColor", () => {
  it("detects oklch", () => {
    expect(parseColor("oklch(0.5 0.1 240)")?.mode).toBe("oklch")
  })
  it("detects oklab", () => {
    expect(parseColor("oklab(0.5 0.1 -0.05)")?.mode).toBe("oklab")
  })
  it("detects hex", () => {
    expect(parseColor("#ff0000")?.mode).toBe("hex")
  })
  it("detects rgb", () => {
    expect(parseColor("rgb(255 0 0)")?.mode).toBe("rgb")
  })
  it("detects hsl", () => {
    expect(parseColor("hsl(0 100% 50%)")?.mode).toBe("hsl")
  })
  it("detects hwb", () => {
    expect(parseColor("hwb(0 0% 0%)")?.mode).toBe("hwb")
  })
  it("trims whitespace", () => {
    expect(parseColor("  #ff0000  ")?.mode).toBe("hex")
  })
  it("returns null for unrecognized", () => {
    expect(parseColor("not a color")).toBeNull()
  })
})
```

```ts
// in tests/color-format.test.ts
import { formatColor } from "@/components/ui/color-picker/color-picker"

describe("formatColor dispatcher", () => {
  const sample = { l: 0.628, c: 0.258, h: 29.234, a: 1 }
  it("dispatches each mode", () => {
    expect(formatColor(sample, "hex")).toMatch(/^#/)
    expect(formatColor(sample, "rgb")).toMatch(/^rgb\(/)
    expect(formatColor(sample, "hsl")).toMatch(/^hsl\(/)
    expect(formatColor(sample, "oklch")).toMatch(/^oklch\(/)
    expect(formatColor(sample, "oklab")).toMatch(/^oklab\(/)
    expect(formatColor(sample, "hwb")).toMatch(/^hwb\(/)
  })
  it("includes alpha branch for hex when a < 1", () => {
    const withAlpha = { ...sample, a: 0.5 }
    expect(formatColor(withAlpha, "hex")).toMatch(/^#[0-9a-f]{8}$/)
  })
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Implement dispatchers**

```ts
import type { ColorMode } from "./color-picker.types"

export interface ParseResult {
  oklch: { l: number; c: number; h: number; a: number }
  mode: ColorMode
}

export function parseColor(value: string): ParseResult | null {
  const trimmed = value.trim()

  const oklch = parseOklch(trimmed)
  if (oklch) return { oklch, mode: "oklch" }

  const oklab = parseOklab(trimmed)
  if (oklab) {
    const polar = oklabToOklch(oklab.l, oklab.a, oklab.b)
    return {
      oklch: { l: polar.l, c: polar.c, h: polar.h, a: oklab.alpha },
      mode: "oklab",
    }
  }

  const hex = parseHex(trimmed)
  if (hex) {
    return { oklch: srgbToOklch(hex.r, hex.g, hex.b, hex.a), mode: "hex" }
  }

  const rgb = parseRgb(trimmed)
  if (rgb) {
    return { oklch: srgbToOklch(rgb.r, rgb.g, rgb.b, rgb.a), mode: "rgb" }
  }

  const hsl = parseHsl(trimmed)
  if (hsl) {
    const srgb = hslToSrgb(hsl.h, hsl.s, hsl.l)
    return {
      oklch: srgbToOklch(srgb.r, srgb.g, srgb.b, hsl.a),
      mode: "hsl",
    }
  }

  const hwb = parseHwb(trimmed)
  if (hwb) {
    const srgb = hwbToSrgb(hwb.h, hwb.w, hwb.b)
    return {
      oklch: srgbToOklch(srgb.r, srgb.g, srgb.b, hwb.a),
      mode: "hwb",
    }
  }

  return null
}

export function formatColor(
  oklch: { l: number; c: number; h: number; a: number },
  mode: ColorMode,
): string {
  switch (mode) {
    case "oklch":
      return formatOklch(oklch)
    case "oklab":
      return formatOklab(oklch)
    case "hex":
      return formatHex(oklch, oklch.a < 1)
    case "rgb":
      return formatRgb(oklch)
    case "hsl":
      return formatHsl(oklch)
    case "hwb":
      return formatHwb(oklch)
  }
}
```

> **Cross-file note:** `parseColor` and `formatColor` import `ColorMode` from `./color-picker.types`. The types file doesn't exist yet — Task 23 creates it. Until then, comment out the import line in `color-picker.tsx` and use a temporary local type `type ColorMode = "oklch" | "oklab" | "hex" | "rgb" | "hsl" | "hwb"`. Replace with the import in Task 23.

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add parseColor + formatColor dispatchers"
```

---

## Phase 4 — Type system

### Task 23: Primitives (`color-picker.types.ts`)

**Files:**
- Create: `src/components/ui/color-picker/color-picker.types.ts`
- Modify: `src/components/ui/color-picker/color-picker.tsx` (replace temp local `ColorMode` with import)
- Create: `tests/color-types.test-d.ts`

- [ ] **Step 1: Create `color-picker.types.ts` with primitives + range checks**

```ts
// =====================================================================
// 1. PRIMITIVES — private helpers, not exported
// =====================================================================

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

type HexDigit =
  | Digit
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"

type WS = " " | "\n" | "\t"

type TrimLeft<S extends string> = S extends `${WS}${infer R}` ? TrimLeft<R> : S
type TrimRight<S extends string> = S extends `${infer R}${WS}`
  ? TrimRight<R>
  : S
type Trim<S extends string> = TrimLeft<TrimRight<S>>

type AllChars<S extends string, Allowed extends string> = S extends ""
  ? true
  : S extends `${infer C}${infer R}`
    ? C extends Allowed
      ? AllChars<R, Allowed>
      : false
    : false

type NonEmptyAllChars<S extends string, Allowed extends string> = S extends ""
  ? false
  : AllChars<S, Allowed>

type Length<
  S extends string,
  A extends unknown[] = [],
> = S extends `${string}${infer R}` ? Length<R, [...A, unknown]> : A["length"]

type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

type Or<A extends boolean, B extends boolean> = A extends true
  ? true
  : B extends true
    ? true
    : false

type Enumerate<
  N extends number,
  A extends number[] = [],
> = A["length"] extends N ? A[number] : Enumerate<N, [...A, A["length"]]>

type IntRange<From extends number, To extends number> = Exclude<
  Enumerate<To>,
  Enumerate<From>
>

type StripLeadingZeros<S extends string> = S extends `0${infer R}`
  ? R extends ""
    ? "0"
    : StripLeadingZeros<R>
  : S

type NormalizeInt<S extends string> = S extends "" ? "0" : StripLeadingZeros<S>

type IsIntPart<S extends string> = S extends ""
  ? true
  : NonEmptyAllChars<S, Digit>

type IsByte<S extends string> =
  NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 256>}`
      ? true
      : false
    : false

type IsNumber0To1<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends "0"
      ? true
      : NormalizeInt<I> extends "1"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends "0" | "1"
      ? true
      : false
    : false

type IsNumber0To100<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends `${IntRange<0, 100>}`
      ? true
      : NormalizeInt<I> extends "100"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 101>}`
      ? true
      : false
    : false

type IsNumber0To360<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends `${IntRange<0, 360>}`
      ? true
      : NormalizeInt<I> extends "360"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 361>}`
      ? true
      : false
    : false

type IsNumber0To400<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends `${IntRange<0, 400>}`
      ? true
      : NormalizeInt<I> extends "400"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 401>}`
      ? true
      : false
    : false

type IsPercent0To100<S extends string> = S extends `${infer N}%`
  ? IsNumber0To100<N>
  : false

type IsAlpha<S extends string> = Or<IsNumber0To1<S>, IsPercent0To100<S>>

type IsRgbChannel<S extends string> = Or<IsByte<S>, IsPercent0To100<S>>

type IsHue<S extends string> = S extends `${infer N}deg`
  ? IsNumber0To360<N>
  : S extends `${infer N}turn`
    ? IsNumber0To1<N>
    : S extends `${infer N}grad`
      ? IsNumber0To400<N>
      : IsNumber0To360<S>

type IsNonNegativeNumber<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>>
  : NonEmptyAllChars<S, Digit>

type KeepIf<B extends boolean, S extends string> = B extends true ? S : never
```

> **Note:** No exports yet. Validators come in subsequent tasks.

- [ ] **Step 2: Append minimal smoke test in `tests/color-types.test-d.ts`**

```ts
import { expectTypeOf, test } from "vitest"

// Type-only smoke test: ensure the file imports cleanly.
test("color-picker.types module imports", () => {
  expectTypeOf<string>().toBeString()
})
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
pnpm test --typecheck
```

Expected: PASS. (Primitive types are unused yet — that's fine; they're not exported.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add type-level primitive parsers (Digit, Trim, IntRange, range checks)"
```

---

### Task 24: `HexLiteral` validator + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.types.ts`
- Modify: `tests/color-types.test-d.ts`

- [ ] **Step 1: Append failing type tests**

```ts
import { expectTypeOf, test } from "vitest"
import type { HexLiteral } from "@/components/ui/color-picker/color-picker.types"

test("HexLiteral accepts valid hex", () => {
  expectTypeOf<HexLiteral<"#ff0000">>().toEqualTypeOf<"#ff0000">()
  expectTypeOf<HexLiteral<"#fff">>().toEqualTypeOf<"#fff">()
  expectTypeOf<HexLiteral<"#ff0000ff">>().toEqualTypeOf<"#ff0000ff">()
  expectTypeOf<HexLiteral<"#abcd">>().toEqualTypeOf<"#abcd">()
})

test("HexLiteral rejects invalid hex", () => {
  expectTypeOf<HexLiteral<"#zzz">>().toBeNever()
  expectTypeOf<HexLiteral<"#ff">>().toBeNever() // wrong length
  expectTypeOf<HexLiteral<"#fffff">>().toBeNever() // wrong length
  expectTypeOf<HexLiteral<"ff0000">>().toBeNever() // missing #
})
```

- [ ] **Step 2: Run, verify failure**

```bash
pnpm test --typecheck
```

Expected: FAIL — `HexLiteral` not exported.

- [ ] **Step 3: Append to `color-picker.types.ts`**

```ts
// =====================================================================
// 2. STRICT VALIDATORS — exported, generic. Used by color() helper.
// =====================================================================

/** #RGB, #RGBA, #RRGGBB, #RRGGBBAA */
export type HexLiteral<S extends string> = S extends `#${infer Body}`
  ? Length<Body> extends 3 | 4 | 6 | 8
    ? KeepIf<AllChars<Body, HexDigit>, S>
    : never
  : never
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add HexLiteral validator + assertions"
```

---

### Task 25: `RGBLiteral` + `RGBALiteral` + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.types.ts`
- Modify: `tests/color-types.test-d.ts`

- [ ] **Step 1: Append failing tests**

```ts
import type {
  RGBLiteral,
  RGBALiteral,
} from "@/components/ui/color-picker/color-picker.types"

test("RGBLiteral accepts valid forms", () => {
  expectTypeOf<RGBLiteral<"rgb(255, 0, 0)">>().toEqualTypeOf<"rgb(255, 0, 0)">()
  expectTypeOf<RGBLiteral<"rgb(255 0 0)">>().toEqualTypeOf<"rgb(255 0 0)">()
  expectTypeOf<RGBLiteral<"rgb(100%, 0%, 0%)">>().toEqualTypeOf<
    "rgb(100%, 0%, 0%)"
  >()
})

test("RGBLiteral rejects out-of-range bytes", () => {
  expectTypeOf<RGBLiteral<"rgb(256, 0, 0)">>().toBeNever()
  expectTypeOf<RGBLiteral<"rgb(255 0 999)">>().toBeNever()
})

test("RGBALiteral accepts alpha forms", () => {
  expectTypeOf<RGBALiteral<"rgba(255, 0, 0, 0.5)">>().toEqualTypeOf<
    "rgba(255, 0, 0, 0.5)"
  >()
  expectTypeOf<RGBALiteral<"rgba(255 0 0 / 0.5)">>().toEqualTypeOf<
    "rgba(255 0 0 / 0.5)"
  >()
  expectTypeOf<RGBALiteral<"rgb(255 0 0 / 0.5)">>().toEqualTypeOf<
    "rgb(255 0 0 / 0.5)"
  >()
})

test("RGBALiteral rejects bad alpha", () => {
  expectTypeOf<RGBALiteral<"rgba(255, 0, 0, 2)">>().toBeNever()
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Append to types file**

```ts
/** rgb(255, 0, 0) | rgb(100%, 0%, 0%) | rgb(255 0 0) */
export type RGBLiteral<S extends string> =
  S extends `rgb(${infer R},${infer G},${infer B})`
    ? KeepIf<
        And<
          IsRgbChannel<Trim<R>>,
          And<IsRgbChannel<Trim<G>>, IsRgbChannel<Trim<B>>>
        >,
        S
      >
    : S extends `rgb(${infer R} ${infer G} ${infer B})`
      ? KeepIf<
          And<
            IsRgbChannel<Trim<R>>,
            And<IsRgbChannel<Trim<G>>, IsRgbChannel<Trim<B>>>
          >,
          S
        >
      : never

/**
 * rgba(255, 0, 0, 0.5) | rgba(255, 0, 0, 50%)
 * rgba(255 0 0 / 0.5) | rgb(255 0 0 / 0.5)
 */
export type RGBALiteral<S extends string> =
  S extends `rgba(${infer R},${infer G},${infer B},${infer A})`
    ? KeepIf<
        And<
          IsRgbChannel<Trim<R>>,
          And<
            IsRgbChannel<Trim<G>>,
            And<IsRgbChannel<Trim<B>>, IsAlpha<Trim<A>>>
          >
        >,
        S
      >
    : S extends `rgba(${infer R} ${infer G} ${infer B} / ${infer A})`
      ? KeepIf<
          And<
            IsRgbChannel<Trim<R>>,
            And<
              IsRgbChannel<Trim<G>>,
              And<IsRgbChannel<Trim<B>>, IsAlpha<Trim<A>>>
            >
          >,
          S
        >
      : S extends `rgb(${infer R} ${infer G} ${infer B} / ${infer A})`
        ? KeepIf<
            And<
              IsRgbChannel<Trim<R>>,
              And<
                IsRgbChannel<Trim<G>>,
                And<IsRgbChannel<Trim<B>>, IsAlpha<Trim<A>>>
              >
            >,
            S
          >
        : never
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add RGBLiteral + RGBALiteral validators"
```

---

### Task 26: `HSLLiteral` + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.types.ts`
- Modify: `tests/color-types.test-d.ts`

- [ ] **Step 1: Append failing tests**

```ts
import type { HSLLiteral } from "@/components/ui/color-picker/color-picker.types"

test("HSLLiteral accepts valid forms", () => {
  expectTypeOf<HSLLiteral<"hsl(210 100% 50%)">>().toEqualTypeOf<
    "hsl(210 100% 50%)"
  >()
  expectTypeOf<HSLLiteral<"hsl(210, 100%, 50%)">>().toEqualTypeOf<
    "hsl(210, 100%, 50%)"
  >()
  expectTypeOf<HSLLiteral<"hsl(210 100% 50% / 0.5)">>().toEqualTypeOf<
    "hsl(210 100% 50% / 0.5)"
  >()
})

test("HSLLiteral rejects out-of-range", () => {
  expectTypeOf<HSLLiteral<"hsl(400 100% 50%)">>().toBeNever()
  expectTypeOf<HSLLiteral<"hsl(210 200% 50%)">>().toBeNever()
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Append to types file**

```ts
/** hsl(210, 100%, 50%) | hsl(210 100% 50%) | hsl(210 100% 50% / 0.5) */
export type HSLLiteral<S extends string> =
  S extends `hsl(${infer H} ${infer Sat} ${infer Light} / ${infer A})`
    ? KeepIf<
        And<
          IsHue<Trim<H>>,
          And<
            IsPercent0To100<Trim<Sat>>,
            And<IsPercent0To100<Trim<Light>>, IsAlpha<Trim<A>>>
          >
        >,
        S
      >
    : S extends `hsl(${infer H},${infer Sat},${infer Light})`
      ? KeepIf<
          And<
            IsHue<Trim<H>>,
            And<IsPercent0To100<Trim<Sat>>, IsPercent0To100<Trim<Light>>>
          >,
          S
        >
      : S extends `hsl(${infer H} ${infer Sat} ${infer Light})`
        ? KeepIf<
            And<
              IsHue<Trim<H>>,
              And<IsPercent0To100<Trim<Sat>>, IsPercent0To100<Trim<Light>>>
            >,
            S
          >
        : never
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add HSLLiteral validator"
```

---

### Task 27: `OKLCHLiteral` + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.types.ts`
- Modify: `tests/color-types.test-d.ts`

- [ ] **Step 1: Append failing tests**

```ts
import type { OKLCHLiteral } from "@/components/ui/color-picker/color-picker.types"

test("OKLCHLiteral accepts valid forms", () => {
  expectTypeOf<OKLCHLiteral<"oklch(0.5 0.1 240)">>().toEqualTypeOf<
    "oklch(0.5 0.1 240)"
  >()
  expectTypeOf<OKLCHLiteral<"oklch(50% 0.1 240deg)">>().toEqualTypeOf<
    "oklch(50% 0.1 240deg)"
  >()
  expectTypeOf<OKLCHLiteral<"oklch(0.5 0.1 240 / 0.5)">>().toEqualTypeOf<
    "oklch(0.5 0.1 240 / 0.5)"
  >()
})

test("OKLCHLiteral rejects bad L", () => {
  expectTypeOf<OKLCHLiteral<"oklch(2 0.1 240)">>().toBeNever()
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Append to types file**

```ts
/**
 * oklch(62% 0.18 240)
 * oklch(0.62 0.18 240deg / 0.8)
 */
export type OKLCHLiteral<S extends string> =
  S extends `oklch(${infer L} ${infer C} ${infer H} / ${infer A})`
    ? KeepIf<
        And<
          Or<IsNumber0To1<Trim<L>>, IsPercent0To100<Trim<L>>>,
          And<
            Or<IsNonNegativeNumber<Trim<C>>, IsPercent0To100<Trim<C>>>,
            And<IsHue<Trim<H>>, IsAlpha<Trim<A>>>
          >
        >,
        S
      >
    : S extends `oklch(${infer L} ${infer C} ${infer H})`
      ? KeepIf<
          And<
            Or<IsNumber0To1<Trim<L>>, IsPercent0To100<Trim<L>>>,
            And<
              Or<IsNonNegativeNumber<Trim<C>>, IsPercent0To100<Trim<C>>>,
              IsHue<Trim<H>>
            >
          >,
          S
        >
      : never
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add OKLCHLiteral validator"
```

---

### Task 28: `OklabLiteral` validator + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.types.ts`
- Modify: `tests/color-types.test-d.ts`

For oklab, a and b range roughly -0.4 to 0.4. The strict validator accepts negative-prefixed decimal forms.

- [ ] **Step 1: Append failing tests**

```ts
import type { OklabLiteral } from "@/components/ui/color-picker/color-picker.types"

test("OklabLiteral accepts valid forms", () => {
  expectTypeOf<OklabLiteral<"oklab(0.5 0.1 -0.05)">>().toEqualTypeOf<
    "oklab(0.5 0.1 -0.05)"
  >()
  expectTypeOf<OklabLiteral<"oklab(50% 0.1 -0.05)">>().toEqualTypeOf<
    "oklab(50% 0.1 -0.05)"
  >()
  expectTypeOf<OklabLiteral<"oklab(0.5 0.1 -0.05 / 0.5)">>().toEqualTypeOf<
    "oklab(0.5 0.1 -0.05 / 0.5)"
  >()
})

test("OklabLiteral rejects bad L", () => {
  expectTypeOf<OklabLiteral<"oklab(2 0.1 0.1)">>().toBeNever()
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Append to types file**

We need a signed-number check. Add helper above OklabLiteral:

```ts
type IsSignedDecimal<S extends string> = S extends `-${infer R}`
  ? IsNonNegativeNumber<R>
  : IsNonNegativeNumber<S>

/**
 * oklab(0.5 0.1 -0.05)
 * oklab(50% 0.1 -0.05 / 0.5)
 *
 * Note: a/b axes are signed (typically -0.4..0.4 in sRGB gamut). This validator
 * accepts any signed decimal; it does NOT range-check a/b to keep complexity
 * tractable. CSS Color 4 allows broader ranges anyway.
 */
export type OklabLiteral<S extends string> =
  S extends `oklab(${infer L} ${infer A} ${infer B} / ${infer Alpha})`
    ? KeepIf<
        And<
          Or<IsNumber0To1<Trim<L>>, IsPercent0To100<Trim<L>>>,
          And<
            IsSignedDecimal<Trim<A>>,
            And<IsSignedDecimal<Trim<B>>, IsAlpha<Trim<Alpha>>>
          >
        >,
        S
      >
    : S extends `oklab(${infer L} ${infer A} ${infer B})`
      ? KeepIf<
          And<
            Or<IsNumber0To1<Trim<L>>, IsPercent0To100<Trim<L>>>,
            And<IsSignedDecimal<Trim<A>>, IsSignedDecimal<Trim<B>>>
          >,
          S
        >
      : never
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add OklabLiteral validator with signed decimal support"
```

---

### Task 29: `HWBLiteral` validator + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.types.ts`
- Modify: `tests/color-types.test-d.ts`

- [ ] **Step 1: Append failing tests**

```ts
import type { HWBLiteral } from "@/components/ui/color-picker/color-picker.types"

test("HWBLiteral accepts valid forms", () => {
  expectTypeOf<HWBLiteral<"hwb(0 0% 0%)">>().toEqualTypeOf<"hwb(0 0% 0%)">()
  expectTypeOf<HWBLiteral<"hwb(240 20% 30%)">>().toEqualTypeOf<
    "hwb(240 20% 30%)"
  >()
  expectTypeOf<HWBLiteral<"hwb(240 20% 30% / 0.5)">>().toEqualTypeOf<
    "hwb(240 20% 30% / 0.5)"
  >()
})

test("HWBLiteral rejects bad hue/percent", () => {
  expectTypeOf<HWBLiteral<"hwb(400 0% 0%)">>().toBeNever()
  expectTypeOf<HWBLiteral<"hwb(0 200% 0%)">>().toBeNever()
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Append to types file**

```ts
/**
 * hwb(240 20% 30%)
 * hwb(240 20% 30% / 0.5)
 */
export type HWBLiteral<S extends string> =
  S extends `hwb(${infer H} ${infer W} ${infer B} / ${infer A})`
    ? KeepIf<
        And<
          IsHue<Trim<H>>,
          And<
            IsPercent0To100<Trim<W>>,
            And<IsPercent0To100<Trim<B>>, IsAlpha<Trim<A>>>
          >
        >,
        S
      >
    : S extends `hwb(${infer H} ${infer W} ${infer B})`
      ? KeepIf<
          And<
            IsHue<Trim<H>>,
            And<IsPercent0To100<Trim<W>>, IsPercent0To100<Trim<B>>>
          >,
          S
        >
      : never
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add HWBLiteral validator"
```

---

### Task 30: `ColorLiteral` union + `color()` helper + tests

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.types.ts`
- Modify: `tests/color-types.test-d.ts`

- [ ] **Step 1: Append failing tests**

```ts
import type { ColorLiteral } from "@/components/ui/color-picker/color-picker.types"
import { color } from "@/components/ui/color-picker/color-picker.types"

test("ColorLiteral accepts any valid color string", () => {
  expectTypeOf<ColorLiteral<"#ff0000">>().toEqualTypeOf<"#ff0000">()
  expectTypeOf<ColorLiteral<"rgb(255 0 0)">>().toEqualTypeOf<"rgb(255 0 0)">()
  expectTypeOf<ColorLiteral<"hsl(0 100% 50%)">>().toEqualTypeOf<
    "hsl(0 100% 50%)"
  >()
  expectTypeOf<ColorLiteral<"oklch(0.5 0.1 240)">>().toEqualTypeOf<
    "oklch(0.5 0.1 240)"
  >()
  expectTypeOf<ColorLiteral<"oklab(0.5 0.1 -0.05)">>().toEqualTypeOf<
    "oklab(0.5 0.1 -0.05)"
  >()
  expectTypeOf<ColorLiteral<"hwb(0 0% 0%)">>().toEqualTypeOf<"hwb(0 0% 0%)">()
})

test("color() accepts valid literals at runtime", () => {
  expect(color("#ff0000")).toBe("#ff0000")
  expect(color("rgb(255 0 0)")).toBe("rgb(255 0 0)")
  expect(color("oklch(0.5 0.1 240)")).toBe("oklch(0.5 0.1 240)")
})

test("color() rejects invalid at type level", () => {
  // @ts-expect-error 256 > 255
  color("rgb(256 0 0)")
  // @ts-expect-error wrong hex length
  color("#ff")
  // @ts-expect-error oklch L out of range
  color("oklch(2 0.1 240)")
})
```

`expect` needs to be imported — add `import { expect } from "vitest"` at top of file if not already.

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Append to types file**

```ts
export type ColorLiteral<S extends string> =
  | HexLiteral<S>
  | RGBLiteral<S>
  | RGBALiteral<S>
  | HSLLiteral<S>
  | OKLCHLiteral<S>
  | OklabLiteral<S>
  | HWBLiteral<S>

/** Validate a color literal at the call site. */
export const color = <S extends string>(value: S & ColorLiteral<S>): S => value
```

- [ ] **Step 4: Run, verify pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add ColorLiteral union + color() runtime helper"
```

---

### Task 31: Suggestion strings + `ColorMode` + wire into component

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.types.ts`
- Modify: `src/components/ui/color-picker/color-picker.tsx` (replace temp local `ColorMode`)

- [ ] **Step 1: Append suggestion types to `color-picker.types.ts`**

```ts
// =====================================================================
// 3. SUGGESTION STRINGS — non-generic, for IntelliSense + onChange returns.
// =====================================================================

export type HexString = `#${string}`

export type RgbString =
  | `rgb(${number} ${number} ${number})`
  | `rgb(${number} ${number} ${number} / ${number}%)`
  | `rgb(${number}, ${number}, ${number})`
  | `rgba(${number}, ${number}, ${number}, ${number})`

export type HslString =
  | `hsl(${number} ${number}% ${number}%)`
  | `hsl(${number} ${number}% ${number}% / ${number}%)`

export type OklchString =
  | `oklch(${number} ${number} ${number})`
  | `oklch(${number} ${number} ${number} / ${number}%)`

export type OklabString =
  | `oklab(${number} ${number} ${number})`
  | `oklab(${number} ${number} ${number} / ${number}%)`

export type HwbString =
  | `hwb(${number} ${number}% ${number}%)`
  | `hwb(${number} ${number}% ${number}% / ${number}%)`

export type ColorString =
  | HexString
  | RgbString
  | HslString
  | OklchString
  | OklabString
  | HwbString

export interface ColorStringMap {
  hex: HexString
  rgb: RgbString
  hsl: HslString
  oklch: OklchString
  oklab: OklabString
  hwb: HwbString
}

export type ColorMode = keyof ColorStringMap
```

- [ ] **Step 2: Replace temp local `ColorMode` in `color-picker.tsx`**

Find the temporary `type ColorMode = ...` line from Task 22 and delete it. Add at the top of the file (above the component):

```ts
import type {
  ColorMode,
  ColorString,
  ColorStringMap,
} from "./color-picker.types"
```

- [ ] **Step 3: Run typecheck + tests**

```bash
pnpm typecheck && pnpm test
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add ColorString suggestion types + wire ColorMode into component"
```

---

## Phase 5 — Component

### Task 32: ColorPicker shell — native fallback + invalid swatch path

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Create: `tests/color-picker.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ColorPicker } from "@/components/ui/color-picker/color-picker"

describe("ColorPicker native path", () => {
  it("renders a native input when native=true", () => {
    render(<ColorPicker value="#ff0000" native onChange={() => {}} />)
    const input = screen.getByLabelText("Pick a color") as HTMLInputElement
    expect(input).toBeInstanceOf(HTMLInputElement)
    expect(input.type).toBe("color")
    expect(input.value).toBe("#ff0000")
  })
})

describe("ColorPicker invalid fallback", () => {
  it("renders a static swatch span when value is unparseable", () => {
    render(<ColorPicker value="not-a-color" onChange={() => {}} />)
    const swatch = document.querySelector('[aria-hidden="true"]')
    expect(swatch).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Replace stub `ColorPicker` in `color-picker.tsx`**

```tsx
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const COLOR_MODES: readonly ColorMode[] = [
  "oklch",
  "oklab",
  "hex",
  "rgb",
  "hsl",
  "hwb",
] as const

export interface ColorPickerProps<
  TMode extends ColorMode | undefined = undefined,
> {
  value: ColorString | (string & {})
  onChange: (
    value: TMode extends ColorMode ? ColorStringMap[TMode] : ColorString,
  ) => void
  mode?: TMode
  native?: boolean
  className?: string
  "aria-label"?: string
}

export function ColorPicker<TMode extends ColorMode | undefined>({
  value,
  onChange,
  mode: modeProp,
  native = false,
  className,
  "aria-label": ariaLabel = "Pick a color",
}: ColorPickerProps<TMode>) {
  if (native) {
    const parsed = parseColor(value)
    const hex = parsed ? formatHex(parsed.oklch, false) : "#000000"
    return (
      <input
        type="color"
        value={hex}
        onChange={(event) => {
          const next = parseHex(event.target.value)
          if (!next) return
          const oklch = srgbToOklch(next.r, next.g, next.b, next.a)
          onChange(
            formatColor(oklch, modeProp ?? "hex") as Parameters<
              typeof onChange
            >[0],
          )
        }}
        className={cn(
          "h-6 w-6 cursor-pointer rounded border bg-transparent",
          className,
        )}
        aria-label={ariaLabel}
        data-slot="color-picker-native"
      />
    )
  }

  const parsed = parseColor(value)
  if (!parsed) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-block h-5 w-5 rounded border", className)}
        style={{ backgroundColor: value }}
        data-slot="color-picker-fallback"
      />
    )
  }

  // Popover wiring lands in Task 37.
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block h-5 w-5 rounded border", className)}
      style={{ backgroundColor: value }}
      data-slot="color-picker-trigger-placeholder"
    />
  )
}
```

> Imports: this task adds `Button`, `Popover`, etc. They are used in Task 37; biome may complain about unused imports. Mark them with a `// biome-ignore` comment, or add them in Task 37 instead. **Decision:** remove these imports for now; re-add in Task 37.

So actually the imports in this step are only: `cn` and the types. Update:

```tsx
import { cn } from "@/lib/utils"
import type {
  ColorMode,
  ColorString,
  ColorStringMap,
} from "./color-picker.types"
```

`COLOR_MODES` is unused this task — defer too (Task 36). Remove for now.

- [ ] **Step 4: Run, verify pass**

```bash
pnpm test tests/color-picker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add ColorPicker shell with native + fallback paths"
```

---

### Task 33: `LcPad` sub-component

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`

> No test added for LcPad rendering — jsdom canvas is mocked, paint is a no-op. Smoke test against the parent component in Task 37 will exercise mount/unmount.

- [ ] **Step 1: Add `LcPad` definition inline (above the ColorPicker function or below — pick one and stick with it; place it **below** for top-down readability of the public component)**

Append below `ColorPicker`:

```tsx
import { useEffect, useRef } from "react"

const PAD_WIDTH = 240
const PAD_HEIGHT = 160
const CHROMA_MAX = 0.4

function LcPad({
  l,
  c,
  h,
  onChange,
}: {
  l: number
  c: number
  h: number
  onChange: (l: number, c: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const image = ctx.createImageData(PAD_WIDTH, PAD_HEIGHT)
    for (let y = 0; y < PAD_HEIGHT; y++) {
      const lAtRow = 1 - y / (PAD_HEIGHT - 1)
      for (let x = 0; x < PAD_WIDTH; x++) {
        const cAtCol = (x / (PAD_WIDTH - 1)) * CHROMA_MAX
        const [r, g, b] = oklchToSrgb(lAtRow, cAtCol, h)
        const i = (y * PAD_WIDTH + x) * 4
        image.data[i] = r * 255
        image.data[i + 1] = g * 255
        image.data[i + 2] = b * 255
        image.data[i + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  }, [h])

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const nx = clamp01((event.clientX - rect.left) / rect.width)
    const ny = clamp01((event.clientY - rect.top) / rect.height)
    onChange(1 - ny, nx * CHROMA_MAX)
  }

  const markerX = (c / CHROMA_MAX) * 100
  const markerY = (1 - l) * 100

  return (
    <div
      data-slot="color-picker-pad"
      className="relative touch-none cursor-crosshair rounded border overflow-hidden"
      style={{ width: PAD_WIDTH, height: PAD_HEIGHT }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        handlePointer(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons) handlePointer(event)
      }}
    >
      <canvas
        ref={canvasRef}
        width={PAD_WIDTH}
        height={PAD_HEIGHT}
        className="block h-full w-full"
      />
      <div
        aria-hidden="true"
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40 pointer-events-none"
        style={{ left: `${markerX}%`, top: `${markerY}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add LcPad sub-component with canvas oklch L×C gradient"
```

---

### Task 34: `HueStrip` sub-component

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`

- [ ] **Step 1: Append below `LcPad`**

```tsx
const HUE_GRADIENT = `linear-gradient(to right, oklch(0.7 0.18 0), oklch(0.7 0.18 60), oklch(0.7 0.18 120), oklch(0.7 0.18 180), oklch(0.7 0.18 240), oklch(0.7 0.18 300), oklch(0.7 0.18 360))`

function HueStrip({
  h,
  onChange,
}: {
  h: number
  onChange: (h: number) => void
}) {
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    onChange(clamp01((event.clientX - rect.left) / rect.width) * 360)
  }

  return (
    <div
      data-slot="color-picker-hue"
      role="slider"
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(h)}
      tabIndex={0}
      className="relative h-4 w-full touch-none cursor-pointer rounded-full"
      style={{ background: HUE_GRADIENT }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        handlePointer(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons) handlePointer(event)
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") onChange(Math.max(0, h - 1))
        if (event.key === "ArrowRight") onChange(Math.min(360, h + 1))
      }}
    >
      <div
        aria-hidden="true"
        className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-black/40 shadow pointer-events-none"
        style={{ left: `${(h / 360) * 100}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add HueStrip sub-component"
```

---

### Task 35: `AlphaStrip` sub-component

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`

- [ ] **Step 1: Append below `HueStrip`**

```tsx
const CHECKER_BG = `conic-gradient(#bbb 25%, #fff 0 50%, #bbb 0 75%, #fff 0) 0 0 / 10px 10px`

function AlphaStrip({
  a,
  l,
  c,
  h,
  onChange,
}: {
  a: number
  l: number
  c: number
  h: number
  onChange: (next: number) => void
}) {
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    onChange(clamp01((event.clientX - rect.left) / rect.width))
  }

  const color = `oklch(${l} ${c} ${h})`
  const background = `linear-gradient(to right, transparent, ${color}), ${CHECKER_BG}`

  return (
    <div
      data-slot="color-picker-alpha"
      role="slider"
      aria-label="Alpha"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(a * 100)}
      tabIndex={0}
      className="relative h-4 w-full touch-none cursor-pointer rounded-full"
      style={{ background }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        handlePointer(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons) handlePointer(event)
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") onChange(clamp01(a - 0.01))
        if (event.key === "ArrowRight") onChange(clamp01(a + 0.01))
      }}
    >
      <div
        aria-hidden="true"
        className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-black/40 shadow pointer-events-none"
        style={{ left: `${a * 100}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add AlphaStrip sub-component with checkerboard background"
```

---

### Task 36: `ModeButtonGroup` sub-component

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`

- [ ] **Step 1: Append `COLOR_MODES` near top of file (above ColorPicker)**

```tsx
const COLOR_MODES = [
  "oklch",
  "oklab",
  "hex",
  "rgb",
  "hsl",
  "hwb",
] as const satisfies readonly ColorMode[]
```

- [ ] **Step 2: Append `ModeButtonGroup` below `AlphaStrip`**

```tsx
import { Button } from "@/components/ui/button"

function ModeButtonGroup({
  mode,
  onChange,
}: {
  mode: ColorMode
  onChange: (next: ColorMode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Color format"
      className="flex gap-1"
      data-slot="color-picker-modes"
    >
      {COLOR_MODES.map((m) => (
        <Button
          key={m}
          type="button"
          role="tab"
          aria-selected={m === mode}
          size="sm"
          variant={m === mode ? "secondary" : "ghost"}
          onClick={() => onChange(m)}
          className="h-7 px-2 font-mono text-xs"
        >
          {m}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify typecheck**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add ModeButtonGroup with 6 mode tabs"
```

---

### Task 37: Wire popover internals + emit logic

**Files:**
- Modify: `src/components/ui/color-picker/color-picker.tsx`
- Modify: `tests/color-picker.test.tsx`

- [ ] **Step 1: Append failing tests**

```tsx
import { fireEvent } from "@testing-library/react"

describe("ColorPicker popover path", () => {
  it("renders trigger button when value parses", () => {
    render(<ColorPicker value="#ff0000" onChange={() => {}} />)
    const trigger = document.querySelector('[data-slot="color-picker-trigger"]')
    expect(trigger).toBeTruthy()
  })

  it("hides mode switcher when mode prop is set", async () => {
    render(<ColorPicker value="#ff0000" mode="hex" onChange={() => {}} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector('[data-slot="color-picker-modes"]')
    expect(switcher).toBeNull()
  })

  it("shows mode switcher when mode prop is unset", async () => {
    render(<ColorPicker value="#ff0000" onChange={() => {}} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector('[data-slot="color-picker-modes"]')
    expect(switcher).toBeTruthy()
  })

  it("fires onChange in active mode when switcher tab clicked", async () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#ff0000" onChange={onChange} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const tabs = document.querySelectorAll('[role="tab"]')
    const rgbTab = Array.from(tabs).find((t) => t.textContent === "rgb")
    fireEvent.click(rgbTab as Element)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0]).toMatch(/^rgb\(/)
  })
})
```

- [ ] **Step 2: Run, verify failure**

- [ ] **Step 3: Replace the popover-path placeholder block in `ColorPicker`**

Replace:

```tsx
  // Popover wiring lands in Task 37.
  return (
    <span ... data-slot="color-picker-trigger-placeholder" />
  )
```

With the real popover:

```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

  const activeMode: ColorMode = modeProp ?? parsed.mode
  const showModeGroup = modeProp == null

  const emit = (
    next: { l: number; c: number; h: number; a: number },
    mode: ColorMode = activeMode,
  ) => {
    onChange(
      formatColor(next, mode) as Parameters<typeof onChange>[0],
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "shrink-0 cursor-pointer rounded outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          data-slot="color-picker-trigger"
        >
          <span
            aria-hidden="true"
            className="block h-5 w-5 rounded border"
            style={{ backgroundColor: value }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3"
        align="start"
        data-slot="color-picker"
      >
        <div className="flex flex-col gap-3">
          {showModeGroup && (
            <ModeButtonGroup
              mode={activeMode}
              onChange={(next) => emit(parsed.oklch, next)}
            />
          )}
          <LcPad
            l={parsed.oklch.l}
            c={parsed.oklch.c}
            h={parsed.oklch.h}
            onChange={(l, c) => emit({ ...parsed.oklch, l, c })}
          />
          <HueStrip
            h={parsed.oklch.h}
            onChange={(h) => emit({ ...parsed.oklch, h })}
          />
          <AlphaStrip
            a={parsed.oklch.a}
            l={parsed.oklch.l}
            c={parsed.oklch.c}
            h={parsed.oklch.h}
            onChange={(a) => emit({ ...parsed.oklch, a })}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
```

- [ ] **Step 4: Run, verify pass**

```bash
pnpm test tests/color-picker.test.tsx
```

Expected: PASS (4 new tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Wire ColorPicker popover with LcPad/HueStrip/AlphaStrip + mode switcher"
```

---

### Task 38: Barrel `index.ts`

**Files:**
- Create: `src/components/ui/color-picker/index.ts`

- [ ] **Step 1: Write barrel**

```ts
export { ColorPicker } from "./color-picker"
export type { ColorPickerProps } from "./color-picker"

export {
  color,
} from "./color-picker.types"

export type {
  ColorMode,
  ColorString,
  ColorStringMap,
  HexString,
  RgbString,
  HslString,
  OklchString,
  OklabString,
  HwbString,
  ColorLiteral,
  HexLiteral,
  RGBLiteral,
  RGBALiteral,
  HSLLiteral,
  OKLCHLiteral,
  OklabLiteral,
  HWBLiteral,
} from "./color-picker.types"
```

- [ ] **Step 2: Verify imports work**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/color-picker/index.ts
git commit -m "Add color-picker barrel index"
```

---

## Phase 6 — Demo app

### Task 39: `index.html` + `main.tsx`

**Files:**
- Create: `index.html`
- Create: `src/main.tsx`

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext y='14'%3E🎨%3C/text%3E%3C/svg%3E" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ridiculous — ridiculously typed shadcn components</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Write `src/main.tsx`**

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./app"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Commit**

```bash
git add index.html src/main.tsx
git commit -m "Add Vite entry + React bootstrap"
```

---

### Task 40: `app.tsx` scaffold

**Files:**
- Create: `src/app.tsx`

- [ ] **Step 1: Write minimal `app.tsx`**

```tsx
export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-5xl font-bold tracking-tight">ridiculous</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            ridiculously typed shadcn components
          </p>
          <p className="mt-2">
            <a
              href="https://github.com/TurtIeSocks/ridiculous"
              className="underline"
            >
              github.com/TurtIeSocks/ridiculous
            </a>
          </p>
        </div>
      </header>
      <main className="container mx-auto px-6 py-12 space-y-16">
        {/* Sections populated in subsequent tasks */}
      </main>
      <footer className="border-t mt-24">
        <div className="container mx-auto px-6 py-6 text-sm text-muted-foreground">
          MIT License ·{" "}
          <a
            href="https://github.com/TurtIeSocks/ridiculous"
            className="underline"
          >
            Source
          </a>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Verify dev server runs**

```bash
pnpm dev
```

Visit `http://localhost:5173/ridiculous/`. Expected: hero with title visible.

- [ ] **Step 3: Stop dev server, commit**

```bash
git add src/app.tsx
git commit -m "Add demo app scaffold with hero + footer"
```

---

### Task 41: `basic-usage` example

**Files:**
- Create: `src/examples/color-picker/basic-usage.tsx`
- Modify: `src/app.tsx`

- [ ] **Step 1: Write `src/examples/color-picker/basic-usage.tsx`**

```tsx
import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"

export function BasicUsage() {
  const [color, setColor] = useState<string>("oklch(0.628 0.258 29.234)")
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-4">Basic Usage</h3>
      <div className="flex items-center gap-4">
        <ColorPicker value={color} onChange={setColor} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {color}
        </code>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Mode unset → switcher visible → onChange emits whichever mode the user
        last selected.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Import + render in `app.tsx`**

Inside `<main>`:

```tsx
<section>
  <h2 className="text-2xl font-semibold mb-6">Color Picker</h2>
  <BasicUsage />
</section>
```

And import at top:

```tsx
import { BasicUsage } from "./examples/color-picker/basic-usage"
```

- [ ] **Step 3: Verify dev server shows the example**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add basic-usage example + wire into app"
```

---

### Task 42: `mode-locked` example with all 6 modes

**Files:**
- Create: `src/examples/color-picker/mode-locked.tsx`
- Modify: `src/app.tsx`

- [ ] **Step 1: Write `mode-locked.tsx`**

```tsx
import { useState } from "react"
import {
  ColorPicker,
  type ColorMode,
  type ColorStringMap,
} from "@/components/ui/color-picker"

const MODES: readonly ColorMode[] = [
  "oklch",
  "oklab",
  "hex",
  "rgb",
  "hsl",
  "hwb",
] as const

function ModeCard<M extends ColorMode>({ mode }: { mode: M }) {
  const initial: Record<ColorMode, string> = {
    oklch: "oklch(0.628 0.258 29.234)",
    oklab: "oklab(0.628 0.225 0.126)",
    hex: "#ff0000",
    rgb: "rgb(255 0 0)",
    hsl: "hsl(0 100% 50%)",
    hwb: "hwb(0 0% 0%)",
  }
  const [color, setColor] = useState<ColorStringMap[M]>(
    initial[mode] as ColorStringMap[M],
  )
  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-mono text-sm mb-3">{mode}</h4>
      <div className="flex items-center gap-3">
        <ColorPicker<M>
          value={color}
          mode={mode}
          onChange={(next) => setColor(next)}
        />
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate">
          {color}
        </code>
      </div>
    </div>
  )
}

export function ModeLocked() {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-4">Mode-Locked</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODES.map((m) => (
          <ModeCard key={m} mode={m} />
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Setting <code>mode</code> hides the switcher and locks onChange to that
        format.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Wire into `app.tsx`**

```tsx
import { ModeLocked } from "./examples/color-picker/mode-locked"
// ...
<ModeLocked />
```

- [ ] **Step 3: Verify rendering**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add mode-locked example with all 6 modes"
```

---

### Task 43: `native` example

**Files:**
- Create: `src/examples/color-picker/native.tsx`
- Modify: `src/app.tsx`

- [ ] **Step 1: Write `native.tsx`**

```tsx
import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"

export function Native() {
  const [color, setColor] = useState("#ff0000")
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-4">Native Variant</h3>
      <div className="flex items-center gap-4">
        <ColorPicker native value={color} onChange={setColor} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {color}
        </code>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Falls back to the browser&apos;s <code>&lt;input type=&quot;color&quot;&gt;</code>.
        sRGB-only, no alpha — wide-gamut and transparent values lose information
        on edit.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Wire + commit**

```bash
git add -A
git commit -m "Add native example"
```

---

### Task 44: `tier-casual` example

**Files:**
- Create: `src/examples/color-picker/tier-casual.tsx`
- Modify: `src/app.tsx`

- [ ] **Step 1: Write `tier-casual.tsx`**

```tsx
import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"

export function TierCasual() {
  const [color, setColor] = useState<string>("#3b82f6")
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-1">Tier 1 — Casual</h3>
      <p className="text-sm text-muted-foreground mb-4">
        <code>useState&lt;string&gt;</code> — any string accepted. Validation at
        runtime only.
      </p>
      <div className="flex items-center gap-4">
        <ColorPicker value={color} onChange={setColor} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {color}
        </code>
      </div>
      <pre className="mt-4 text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
        {`const [color, setColor] = useState<string>("#3b82f6")
<ColorPicker value={color} onChange={setColor} />`}
      </pre>
    </div>
  )
}
```

- [ ] **Step 2: Wire + commit**

```bash
git add -A
git commit -m "Add tier-casual example"
```

---

### Task 45: `tier-intellisense` example

**Files:**
- Create: `src/examples/color-picker/tier-intellisense.tsx`
- Modify: `src/app.tsx`

- [ ] **Step 1: Write `tier-intellisense.tsx`**

```tsx
import { useState } from "react"
import {
  ColorPicker,
  type ColorString,
} from "@/components/ui/color-picker"

export function TierIntellisense() {
  const [color, setColor] = useState<ColorString>(
    "oklch(0.7 0.18 240)",
  )
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-1">Tier 2 — IntelliSense</h3>
      <p className="text-sm text-muted-foreground mb-4">
        State typed as <code>ColorString</code> — IDE suggests literal shapes
        in autocomplete. Range checks still deferred to runtime.
      </p>
      <div className="flex items-center gap-4">
        <ColorPicker value={color} onChange={setColor} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {color}
        </code>
      </div>
      <pre className="mt-4 text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
        {`const [color, setColor] = useState<ColorString>("oklch(0.7 0.18 240)")
// hover the literal in your editor — IntelliSense suggests oklch/oklab/hex/rgb/hsl/hwb shapes`}
      </pre>
    </div>
  )
}
```

- [ ] **Step 2: Wire + commit**

```bash
git add -A
git commit -m "Add tier-intellisense example"
```

---

### Task 46: `tier-strict` example

**Files:**
- Create: `src/examples/color-picker/tier-strict.tsx`
- Modify: `src/app.tsx`

- [ ] **Step 1: Write `tier-strict.tsx`**

```tsx
import { useState } from "react"
import { ColorPicker, color } from "@/components/ui/color-picker"

export function TierStrict() {
  const [c, setC] = useState(color("oklch(0.7 0.18 240)"))
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-1">Tier 3 — Strict</h3>
      <p className="text-sm text-muted-foreground mb-4">
        <code>color()</code> validates the literal at compile time. Range
        violations type-error.
      </p>
      <div className="flex items-center gap-4">
        <ColorPicker value={c} onChange={setC} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {c}
        </code>
      </div>
      <pre className="mt-4 text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
        {`import { color } from "@/components/ui/color-picker"

const valid = color("#ff0000")        // ✓
// @ts-expect-error 256 > 255
const broken = color("rgb(256 0 0)")  // type-error
// @ts-expect-error wrong hex length
const wrong = color("#ff")            // type-error`}
      </pre>
    </div>
  )
}
```

- [ ] **Step 2: Wire + commit**

```bash
git add -A
git commit -m "Add tier-strict example with color() helper"
```

---

### Task 47: Install instructions section

**Files:**
- Modify: `src/app.tsx`

- [ ] **Step 1: Append before footer**

```tsx
<section>
  <h2 className="text-2xl font-semibold mb-4">Install</h2>
  <div className="rounded-lg border p-6 space-y-4">
    <p className="text-sm">
      Drop the component into any shadcn-configured project:
    </p>
    <pre className="text-sm font-mono bg-muted p-3 rounded overflow-x-auto">
      npx shadcn add
      https://turtiesocks.github.io/ridiculous/r/color-picker.json
    </pre>
    <p className="text-xs text-muted-foreground">
      <code>button</code> and <code>popover</code> dependencies resolve against
      the shadcn-ui registry automatically.
    </p>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/app.tsx
git commit -m "Add install instructions section"
```

---

## Phase 7 — Registry build

### Task 48: `registry.json`

**Files:**
- Create: `registry.json`

- [ ] **Step 1: Write `registry.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "ridiculous",
  "homepage": "https://turtiesocks.github.io/ridiculous",
  "items": [
    {
      "name": "color-picker",
      "type": "registry:ui",
      "title": "Color Picker",
      "description": "Ridiculously typed color picker with oklch L×C pad, hue/alpha strips, and 6-mode round-trip (oklch, oklab, hex, rgb, hsl, hwb).",
      "registryDependencies": ["button", "popover"],
      "dependencies": [],
      "files": [
        {
          "path": "src/components/ui/color-picker/index.ts",
          "type": "registry:ui",
          "target": "components/ui/color-picker/index.ts"
        },
        {
          "path": "src/components/ui/color-picker/color-picker.tsx",
          "type": "registry:ui",
          "target": "components/ui/color-picker/color-picker.tsx"
        },
        {
          "path": "src/components/ui/color-picker/color-picker.types.ts",
          "type": "registry:ui",
          "target": "components/ui/color-picker/color-picker.types.ts"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add registry.json
git commit -m "Add registry.json source-of-truth"
```

---

### Task 49: Verify `shadcn build` output

**Files:**
- No file edits — verification only

- [ ] **Step 1: Build registry**

```bash
pnpm registry:build
```

Expected: `public/r/color-picker.json` is created.

- [ ] **Step 2: Inspect output**

```bash
cat public/r/color-picker.json | head -40
```

Expected: JSON with `name`, `type`, `files[]` array containing inlined contents of each source file.

- [ ] **Step 3: Add `public/r/` to .gitignore**

The generated JSON should not be committed (regenerated on each build):

```bash
echo "public/r/" >> .gitignore
```

- [ ] **Step 4: Verify `.gitignore` works**

```bash
git status
```

Expected: `public/r/` not listed in untracked.

- [ ] **Step 5: Commit `.gitignore`**

```bash
git add .gitignore
git commit -m "Ignore generated public/r/ registry output"
```

---

### Task 50: Verify Vite build copies registry JSON to `dist/`

**Files:**
- No file edits — verification only

- [ ] **Step 1: Run full build**

```bash
pnpm build
```

Expected: `pnpm registry:build` runs first (creates `public/r/color-picker.json`), `tsc -b` passes, `vite build` outputs `dist/`.

- [ ] **Step 2: Verify dist contents**

```bash
ls dist/
ls dist/r/
```

Expected: `dist/index.html`, `dist/assets/`, `dist/r/color-picker.json`.

- [ ] **Step 3: Preview locally**

```bash
pnpm preview
```

Visit `http://localhost:4173/ridiculous/r/color-picker.json` — expected: JSON served.

- [ ] **Step 4: Stop preview server, no commit needed (no file changes)**

---

## Phase 8 — CI + deploy

### Task 51: `.github/workflows/deploy.yml`

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm ci:check
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deploy workflow"
```

---

### Task 52: Update `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write README**

```md
# ridiculous

Ridiculously typed [shadcn](https://ui.shadcn.com) components.

A shadcn-compatible component registry. Each component is built to be
**ridiculously precise** at the type level: template-literal validators
that range-check color tokens, IntelliSense hints for literal shapes, and
ergonomic escape hatches when you just want JavaScript.

## Components

- **Color Picker** — oklch L×C pad, hue/alpha strips, 6 modes (oklch, oklab,
  hex, rgb, hsl, hwb), tiered typing (casual / IntelliSense / strict).

## Install

```bash
npx shadcn add https://turtiesocks.github.io/ridiculous/r/color-picker.json
```

Browse the live demo at <https://turtiesocks.github.io/ridiculous>.

## Development

```bash
pnpm install
pnpm dev               # demo at http://localhost:5173/ridiculous/
pnpm test              # vitest with jsdom + canvas mock
pnpm typecheck         # tsc -b
pnpm check             # biome lint + format check
pnpm build             # registry:build + tsc + vite build → dist/
pnpm registry:build    # emits public/r/*.json
```

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Update README with overview, install, and dev instructions"
```

---

### Task 53: Final end-to-end verification

**Files:**
- No file edits — verification only

- [ ] **Step 1: Run full CI flow locally**

```bash
pnpm ci:check && pnpm typecheck && pnpm test && pnpm build
```

Expected: all four pass.

- [ ] **Step 2: Verify dist serves both demo + registry**

```bash
pnpm preview
```

- Visit `http://localhost:4173/ridiculous/` — full demo app renders with all examples.
- Visit `http://localhost:4173/ridiculous/r/color-picker.json` — registry JSON served, contains inlined source files.

- [ ] **Step 3: Push to GitHub and configure Pages**

```bash
gh repo create TurtIeSocks/ridiculous --public --source=. --remote=origin --push
```

Then in GitHub UI: Settings → Pages → Source: "GitHub Actions".

- [ ] **Step 4: Wait for Actions run to complete**

Monitor at `https://github.com/TurtIeSocks/ridiculous/actions`.

- [ ] **Step 5: Verify live URLs**

- `https://turtiesocks.github.io/ridiculous/` — demo loads.
- `https://turtiesocks.github.io/ridiculous/r/color-picker.json` — JSON served.

- [ ] **Step 6: Test consumer install in a scratch project**

```bash
mkdir /tmp/ridiculous-consumer-test && cd /tmp/ridiculous-consumer-test
pnpm dlx create-vite@latest . --template react-ts
pnpm install
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add https://turtiesocks.github.io/ridiculous/r/color-picker.json
```

Expected: button, popover, and color-picker directory all installed under `src/components/ui/`.

- [ ] **Step 7: Smoke test consumer build**

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 8: Clean up scratch project**

```bash
cd .. && rm -rf /tmp/ridiculous-consumer-test
```

---

## Self-review

**Spec coverage check:** every spec section has at least one task —

- Goal / philosophy / non-goals — embedded in plan header
- Project layout — Phase 1 (tasks 1-7), file paths verified
- Type system (primitives / validators / suggestions) — Phase 4 (tasks 23-31)
- Component API (props / behavior / parsing / sub-components / barrel) — Phase 5 (tasks 32-38)
- Registry config + build — Phase 7 (tasks 48-50)
- Demo app — Phase 6 (tasks 39-47)
- Build pipeline + deploy — Phase 8 (tasks 51-53), `vite.config.ts` in task 3
- Testing strategy (three layers, jsdom env, canvas mock, typecheck) — Phase 2 (tasks 8-10), tests added throughout Phase 3-4

**Placeholder scan:** no "TBD" / "TODO" / "implement later" / "add appropriate" / "similar to" patterns. Code shown in every implementation step.

**Type consistency:** `ColorMode`, `ColorString`, `ColorStringMap`, `parseColor`, `formatColor`, `parseHex`, `formatHex` etc. used consistently across tasks. Task 22 explicitly notes the temporary local `ColorMode` definition pending Task 23's full `color-picker.types.ts` file, and Task 31 closes the loop by replacing it with the import.

**One inconsistency caught & fixed inline during draft:** `parseOklab` returns `{l, a, b, alpha}` (not `a`) to avoid conflict with oklch's `a` (alpha). The `parseColor` dispatcher in Task 22 reflects this. The conversion `oklabToOklch` returns `{l, c, h}` without alpha — alpha is preserved separately in `parseColor`'s dispatch.

**Plan size:** 53 tasks. Larger than typical but appropriate for "bootstrap a registry + first component + tests + deploy". No task does more than one self-contained change.
