# Vite MPA Docs Site — Design

**Status:** Approved
**Date:** 2026-05-21
**Author:** brainstormed w/ Claude

## Problem

`src/app.tsx` has grown to 238 lines mixing layout chrome (header, footer, mesh background) with stacked sections for all four components (color-picker, gradient-editor, unit-input, easing-picker). Each component contributes 3–4 example blocks plus API + install snippets, all on a single scrolling page. Discoverability is poor (no nav, no deep links), the page is heavy to load, and adding a fifth component will push the file past any reasonable maintenance threshold.

The site is deployed as a static SPA to GitHub Pages at `/ridiculous/` (Vite + React 19, no router).

## Goals

- One URL per component (`/color-picker/`, `/gradient-editor/`, etc.). Deep-linkable, shareable.
- Persistent sidebar navigation across pages, scaling cleanly past four components.
- Static-only output that GitHub Pages serves with no server, no SPA-rewrite tricks, no 404 hacks.
- Existing example components (`src/examples/*`), shadcn registry pieces (`src/components/ui/*`), tests, and registry build pipeline remain untouched.
- Custom 404 page styled to match the rest of the site.
- Mobile navigation that doesn't sacrifice access to the sidebar.

## Non-Goals

- No client-side router. We're building a real multi-page app, not a SPA pretending to be one.
- No MDX, content-collection framework (Astro, Nextra, Starlight), or search functionality. Out of scope.
- No per-example deep links (`/color-picker/basic`). One page per component, examples scroll within.
- No versioned docs.
- No code-splitting tuning beyond Vite's defaults.

## Decisions Summary

| # | Decision | Choice |
|---|----------|--------|
| Q1 | Page granularity | Index + one page per component (5 pages) |
| Q2 | Nav pattern | Sticky left sidebar |
| Q3 | URL + source layout | Directory-style (`/color-picker/`) |
| Q4 | Index page content | Hero → global install CTA → component cards → tiers section |
| Q5 | Source layout | `pages/` co-located HTML + `main.tsx`, `root: "pages"` in vite config |
| Q6 | `app.tsx` | Delete; layout becomes reusable component under `src/components/layout/` |
| Q7 | Nav data source | Codegenned from `registry.json` to `src/generated/nav.ts` (gitignored) |
| Q8 | 404 page | Custom `pages/404.html` matching site chrome |
| Q9 | Mobile nav | Hamburger drawer using shadcn `Sheet` (Radix Dialog) |
| Q10 | Header | Hero only on `/`; compact top bar on component pages |
| Q11 | Tiers section | Keep existing color-picker-specific cards on index |

## Architecture

### Build model

Vite multi-page application. Each HTML entry boots its own React tree via its own `main.tsx`. Vite + Rollup hoist shared modules (React, layout components, `registry.json`) into common chunks automatically — per-page bundles contain only that page's example components. Full-page navigation between pages (browser load); fine because shared chunks are HTTP-cached after first visit.

### Pages produced

| URL | Source HTML | Mount file | Content |
|-----|-------------|------------|---------|
| `/` | `pages/index.html` | `pages/main.tsx` | Hero, global install CTA, component card grid, "Three usage tiers" section |
| `/color-picker/` | `pages/color-picker/index.html` | `pages/color-picker/main.tsx` | All color-picker examples + API reference + install snippet |
| `/gradient-editor/` | `pages/gradient-editor/index.html` | `pages/gradient-editor/main.tsx` | All gradient-editor examples + API reference + install snippet |
| `/unit-input/` | `pages/unit-input/index.html` | `pages/unit-input/main.tsx` | All unit-input examples + API reference + install snippet |
| `/easing-picker/` | `pages/easing-picker/index.html` | `pages/easing-picker/main.tsx` | All easing-picker examples + install snippet |
| `/404.html` | `pages/404.html` | `pages/not-found.tsx` | Styled "not found" page with sidebar + link back to index |

**Naming note:** GitHub Pages requires `404.html` to live at the deployed root to act as the unknown-path fallback, so its source must sit at `pages/404.html` (alongside `pages/index.html`). Two HTML files in the same directory can't both reference a sibling `main.tsx`, so the 404 entry uses the name `not-found.tsx`. Every other page uses `main.tsx` because each lives in its own subdirectory.

### Vite configuration

```ts
export default defineConfig({
  base: "/ridiculous/",
  root: "pages",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: "pages/index.html",
        404: "pages/404.html",
        "color-picker": "pages/color-picker/index.html",
        "gradient-editor": "pages/gradient-editor/index.html",
        "unit-input": "pages/unit-input/index.html",
        "easing-picker": "pages/easing-picker/index.html",
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

The `@` alias resolves via `__dirname` (the project root), so it continues pointing at `./src` regardless of the Vite root shift. `outDir: "../dist"` ensures the GitHub Pages workflow finds the artifact at the repo-root `dist/` path it already expects — no CI changes needed.

### File layout

**Pages tree (Vite entries):**

```
pages/
  index.html                  → ./main.tsx
  main.tsx                    (mounts <IndexPage />)
  404.html                    → ./not-found.tsx
  not-found.tsx               (mounts <NotFoundPage />)
  color-picker/
    index.html                → ./main.tsx
    main.tsx                  (mounts <ColorPickerPage />)
  gradient-editor/
    index.html                → ./main.tsx
    main.tsx
  unit-input/
    index.html                → ./main.tsx
    main.tsx
  easing-picker/
    index.html                → ./main.tsx
    main.tsx
```

Each `main.tsx` is mount-only:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/index.css"
import { ColorPickerPage } from "@/pages/color-picker/page"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorPickerPage />
  </StrictMode>,
)
```

**Source tree (new):**

```
src/
  components/
    layout/
      layout.tsx              (chrome: background, header, sidebar, footer)
      header.tsx              (variant: "hero" | "compact")
      sidebar.tsx             (desktop sticky + mobile <Sheet>)
      footer.tsx
      nav-link.tsx            (active state via window.location.pathname)
      install-cta.tsx         (global "npx shadcn init" + per-component snippet variant)
      component-card.tsx      (used on index grid)
      section-header.tsx      (extracted from current app.tsx lines 214-238)
    ui/
      sheet.tsx               (added via `pnpm dlx shadcn@latest add sheet`)
      [existing files untouched]
  pages/
    index/page.tsx            (hero + install CTA + card grid + tiers)
    color-picker/page.tsx     (imports existing examples + API + install)
    gradient-editor/page.tsx
    unit-input/page.tsx
    easing-picker/page.tsx
    not-found/page.tsx        (404 content)
  generated/
    nav.ts                    (gitignored; emitted by scripts/build-nav.mjs)
```

**Separation principle:** `pages/**/main.tsx` is mount-only. All page composition lives in `src/pages/*/page.tsx`. This keeps the Vite-entry tree (`pages/`) lean and the real source (`src/`) testable.

**Untouched:**
- `src/examples/**` (all example components imported as-is by the new page files)
- `src/components/ui/{color-picker,gradient-editor,unit-input,easing-picker,button,popover,input}` and their subdirectories
- `src/lib/`
- `tests/**`
- `registry.json`
- `docs/**` (other than this spec)
- `.github/workflows/deploy.yml`

**Deleted:**
- `src/app.tsx`
- `src/main.tsx`

### Navigation data flow

Nav is generated from `registry.json` at build time by `scripts/build-nav.mjs` (~25 lines):

```js
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const registry = JSON.parse(
  readFileSync(resolve(__dirname, "../registry.json"), "utf8"),
)
const items = registry.items.map((it) => ({
  name: it.name,
  title: it.title,
  description: it.description,
  href: `/${it.name}/`,
}))

const out = `// AUTO-GENERATED by scripts/build-nav.mjs. Do not edit.
export interface NavItem {
  name: string
  title: string
  description: string
  href: \`/\${string}/\`
}
export const NAV = ${JSON.stringify(items, null, 2)} as const satisfies readonly NavItem[]
`

mkdirSync(resolve(__dirname, "../src/generated"), { recursive: true })
writeFileSync(resolve(__dirname, "../src/generated/nav.ts"), out)
```

Output (`src/generated/nav.ts`) is consumed by `<Sidebar>` and `<ComponentCard>` grid.

**`package.json` script additions:**

```json
"scripts": {
  "nav:build": "node scripts/build-nav.mjs",
  "predev": "pnpm nav:build",
  "prebuild": "pnpm nav:build",
  "pretypecheck": "pnpm nav:build"
}
```

`pretypecheck` ensures `tsc --noEmit` doesn't fail on a fresh clone before any other script has run.

**`.gitignore`** gains `src/generated/`.

**`tsconfig.app.json`** include glob expanded to cover `src/generated/**/*` and `pages/**/*.{ts,tsx}`.

### Sidebar implementation

Desktop (≥ md): sticky left column, fixed width (~14rem), full-height with own scroll. Active link styled via comparing `window.location.pathname` against `BASE_URL + item.href`.

Mobile (< md): hidden by default. Hamburger button in the compact top bar opens a shadcn `Sheet` from the left containing the same nav list. `Sheet` pulls `@radix-ui/react-dialog` as a transitive dep — added via `pnpm dlx shadcn@latest add sheet`.

Base-path handling — every nav `<a href>` prefixed with `import.meta.env.BASE_URL`:

```tsx
<a href={`${import.meta.env.BASE_URL}${item.name}/`}>{item.title}</a>
```

Vite resolves `BASE_URL` to `/` in dev and `/ridiculous/` in production builds.

### Layout component shape

```tsx
interface LayoutProps {
  variant: "hero" | "compact"
  children: React.ReactNode
}

function Layout({ variant, children }: LayoutProps) {
  return (
    <div className="...">
      <BackgroundMesh />
      <Header variant={variant} />
      <div className="flex">
        <Sidebar />
        <main>{children}</main>
      </div>
      <Footer />
    </div>
  )
}
```

Index page: `<Layout variant="hero">`. Component pages: `<Layout variant="compact">`. Header component switches between the full hero block (current `app.tsx` lines 34–73) and a slim top bar (logo + GitHub link + mobile hamburger trigger).

## Build pipeline

**Local dev:** `pnpm dev` → `predev` hook runs `nav:build` → `vite` starts dev server with `root: pages`. Per-page HMR works within each entry; switching pages is a full reload (expected MPA behavior).

**Production build:** `pnpm build` → `prebuild` hook runs `nav:build` → `pnpm registry:build` emits `/r/*.json` shadcn registry files → `tsc -b` typechecks → `vite build` emits all pages + assets to `dist/`.

**CI (`.github/workflows/deploy.yml`):** No changes. Existing workflow runs `pnpm build`, uploads `dist/` as the Pages artifact, deploys.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Tailwind v4 doesn't pick up classes used only in `pages/**/*.html` | Tailwind v4 + Vite plugin auto-scans imported source. HTML entries reference `main.tsx` → cascade reaches `src/**`. Verify during impl; if a class is used directly in HTML, add explicit `@source` directive in `index.css`. |
| `shadcn build` (registry build) output path changes with `outDir` shift | `shadcn build` emits to `public/r/*.json`; Vite copies `public/` contents into `dist/`. With `root: "pages"` Vite now treats `pages/public/` as the public dir. Either set `publicDir: "../public"` in vite config or move `public/` into `pages/`. Spec defers the choice — verify exact behavior on first build, pick whichever is less invasive. |
| Fresh clone fails `tsc --noEmit` because `src/generated/nav.ts` is absent | `pretypecheck` script runs `nav:build` first. README note about `pnpm install` running `prepare` (or just running `pnpm dev` once) optional follow-up. |
| Per-page bundle duplication if React isn't hoisted | Rollup automatically hoists shared chunks for MPA builds; React and shared layout components land in a common chunk. Verify with `dist/assets/` inspection after first build. No tuning needed unless duplication is observed. |
| `<a>` hrefs hardcoded without `BASE_URL` prefix would 404 in production | Centralize all nav hrefs through one `nav-link.tsx` component that always prefixes `BASE_URL`. Sidebar, card grid, and footer all consume that component. |
| Existing inline `<a href="#install">` jump links in `app.tsx` break when the install section moves | Per-component install snippet now lives on each component page (no jump needed). Global install CTA on index doesn't need anchor scrolling. Remove the old `#install` reference entirely. |

## Migration plan (high level)

1. Add `sheet` from shadcn registry
2. Write `scripts/build-nav.mjs`, run once, commit `.gitignore` + tsconfig changes
3. Build `<Layout>` and sub-components in `src/components/layout/`
4. Build `src/pages/index/page.tsx` (port hero, install CTA, cards, tiers)
5. Build per-component `src/pages/{x}/page.tsx` (port examples + API + per-component install)
6. Add `src/pages/not-found/page.tsx`
7. Create `pages/` tree (HTML entries + mount files for all 6 pages)
8. Update `vite.config.ts` (root + input + outDir)
9. Update `package.json` scripts
10. Delete `src/app.tsx`, `src/main.tsx`
11. Update `tsconfig.app.json` includes
12. Local smoke test: dev server + preview build for all 6 routes
13. Verify `dist/{index,color-picker,gradient-editor,unit-input,easing-picker,404}/index.html` exist after `pnpm build`

Detailed implementation plan will be created via the `writing-plans` skill in a follow-up step.

## Testing

Existing `tests/**` remain untouched — they cover component logic, not the docs site shell.

No new automated tests are required for the docs reorganization itself. Smoke testing during impl covers visual + navigation correctness.

Optional follow-up (not in scope): a tiny build-output assertion that all expected `dist/**/index.html` files exist. Deferred unless the build proves flaky.
