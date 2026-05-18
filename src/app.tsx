import { ApiReference } from "./examples/color-picker/api-reference"
import { BasicUsage } from "./examples/color-picker/basic-usage"
import { ModeLocked } from "./examples/color-picker/mode-locked"
import { Native } from "./examples/color-picker/native"
import { TierCasual } from "./examples/color-picker/tier-casual"
import { TierIntellisense } from "./examples/color-picker/tier-intellisense"
import { TierStrict } from "./examples/color-picker/tier-strict"
import { ApiReference as GradientApiReference } from "./examples/gradient-editor/api-reference"
import { BasicUsage as GradientBasicUsage } from "./examples/gradient-editor/basic-usage"
import { Interpolation as GradientInterpolation } from "./examples/gradient-editor/interpolation"
import { StopsControl as GradientStopsControl } from "./examples/gradient-editor/stops-control"
import { TypeLocked as GradientTypeLocked } from "./examples/gradient-editor/type-locked"
import { BasicUsageExample as EasingBasicUsage } from "./examples/easing-picker/basic-usage"
import { InlinePanelExample as EasingInlinePanel } from "./examples/easing-picker/inline-panel"
import { OutputFormatsExample as EasingOutputFormats } from "./examples/easing-picker/output-formats"
import { SubComponentBezierExample as EasingSubBezier } from "./examples/easing-picker/sub-component-bezier"
import { SubComponentSpringExample as EasingSubSpring } from "./examples/easing-picker/sub-component-spring"
import { TypeLockedExample as EasingTypeLocked } from "./examples/easing-picker/type-locked"
import { ApiReference as UnitInputApiReference } from "./examples/unit-input/api-reference"
import { BasicUsage as UnitInputBasicUsage } from "./examples/unit-input/basic-usage"
import { Scrub as UnitInputScrub } from "./examples/unit-input/scrub"
import { StrictTyping as UnitInputStrictTyping } from "./examples/unit-input/strict-typing"

export function App() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden px-12">
      <div
        aria-hidden="true"
        className="bg-mesh pointer-events-none fixed inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none fixed inset-0 -z-10"
      />

      <header className="relative">
        <div className="container mx-auto max-w-6xl px-6 pt-24 pb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-muted-foreground backdrop-blur-sm">
            <span className="inline-block size-1.5 rounded-full bg-violet-glow shadow-[0_0_8px_var(--color-violet-glow)]" />
            v0 · color-picker
          </div>
          <h1 className="mt-6 text-6xl md:text-7xl font-extrabold tracking-tight leading-[0.95]">
            <span className="text-gradient">ridiculous</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Ridiculously typed shadcn components. Template-literal validators,
            tiered ergonomics, zero-runtime guarantees.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/TurtIeSocks/ridiculous"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition hover:border-white/25 hover:bg-white/10"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
                aria-hidden="true"
              >
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.82 1.18 3.08 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .3.21.67.79.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
              </svg>
              github.com/TurtIeSocks/ridiculous
            </a>
            <a
              href="#install"
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-br from-violet-glow to-pink-glow px-4 py-2 text-sm font-semibold text-background shadow-[0_4px_24px_oklch(0.5_0.2_300/0.35)] transition hover:brightness-110"
            >
              Install
            </a>
          </div>
        </div>
        <div className="container mx-auto max-w-6xl px-6">
          <div className="h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </header>

      <main className="relative">
        <div className="container mx-auto max-w-6xl px-6 py-20">
          <SectionHeader
            eyebrow="component"
            title="Color Picker"
            description="Oklch L×C pad, hue + alpha strips, 6-mode round-trip (oklch, oklab, hex, rgb, hsl, hwb). Three usage tiers from casual to strict."
          />
          <div className="mt-12 space-y-10">
            <BasicUsage />
            <ModeLocked />
            <Native />
          </div>

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

          <SectionHeader
            className="mt-32"
            eyebrow="component"
            title="Unit Input"
            description="CSS-unit input with built-in deg/%/px/rem/em/vw/vh validators, pointer-locked drag scrubbing, and tiered typing tiers from casual to strict."
          />
          <div className="mt-12 space-y-10">
            <UnitInputBasicUsage />
            <UnitInputScrub />
            <UnitInputStrictTyping />
            <UnitInputApiReference />
          </div>

          <SectionHeader
            className="mt-32"
            eyebrow="component"
            title="Easing Picker"
            description="CSS easing function picker — bezier canvas, spring/bounce/wiggle physics baked to linear(), polynomial preset gallery, 6-property animation preview, 3-format output (CSS/Tailwind v3/v4)."
          />
          <div className="mt-12 space-y-10">
            <EasingBasicUsage />
            <EasingTypeLocked />
            <EasingOutputFormats />
            <EasingInlinePanel />
            <EasingSubBezier />
            <EasingSubSpring />
          </div>

          <SectionHeader
            className="mt-32"
            eyebrow="types"
            title="Three usage tiers"
            description="Pick the level of compile-time validation you want. From useState-and-go to literal-validated."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <TierCasual />
            <TierIntellisense />
            <TierStrict />
          </div>

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

          <SectionHeader
            className="mt-32"
            eyebrow="install"
            title="Drop it in"
            description="One command. Resolves button + popover against the shadcn-ui registry automatically."
            id="install"
          />
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
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <pre className="text-sm md:text-base font-mono overflow-x-auto">
                <span className="text-muted-foreground select-none">$ </span>
                <span className="text-foreground">npx shadcn add </span>
                <span className="text-gradient">
                  https://turtiesocks.github.io/ridiculous/r/easing-picker.json
                </span>
              </pre>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative border-t border-white/10 mt-20">
        <div className="container mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>MIT License · 2026</span>
          <a
            href="https://github.com/TurtIeSocks/ridiculous"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            github.com/TurtIeSocks/ridiculous
          </a>
        </div>
      </footer>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  id,
}: {
  eyebrow: string
  title: string
  description: string
  className?: string
  id?: string
}) {
  return (
    <div className={className} id={id}>
      <div className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">/</span> {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
    </div>
  )
}
