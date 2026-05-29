"use client"

import { useState } from "react"
import {
  BezierCanvas,
  BounceControls,
  EasingPreview,
  type EasingString,
  formatEasing,
  type PolynomialFamily,
  PRESETS,
  type PreviewProperty,
  SpringControls,
  type StepPosition,
  StepsControls,
  WiggleControls,
} from "@/components/ui/easing-picker"
import { cn } from "@/lib/utils"

const FAMILIES: ReadonlyArray<PolynomialFamily> = [
  "Sine",
  "Quad",
  "Cubic",
  "Quart",
  "Quint",
  "Expo",
  "Circ",
  "Back",
]

type PlaygroundDirection = "In" | "Out" | "InOut"
const DIRECTIONS: ReadonlyArray<PlaygroundDirection> = ["In", "Out", "InOut"]

type Basis = "bezier" | "spring" | "bounce" | "wiggle" | "steps"
const BASES: ReadonlyArray<Basis> = [
  "bezier",
  "spring",
  "bounce",
  "wiggle",
  "steps",
]

const PROPERTIES: ReadonlyArray<PreviewProperty> = [
  "moveX",
  "moveY",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "opacity",
  "width",
  "color",
  "blur",
]

type OutputFormat = "css" | "tailwind-v3" | "tailwind-v4"

const FORMATS: ReadonlyArray<OutputFormat> = [
  "css",
  "tailwind-v3",
  "tailwind-v4",
]

function formatSnippet(easing: string, format: OutputFormat): string {
  switch (format) {
    case "css":
      return easing
    case "tailwind-v3":
      return `class="ease-[${easing.replace(/\s+/g, "_")}]"`
    case "tailwind-v4":
      return `@theme {\n  --ease-custom: ${easing};\n}\n/* usage: class="ease-custom" */`
  }
}

interface PlaygroundState {
  basis: Basis

  // bezier
  x1: number
  y1: number
  x2: number
  y2: number
  extraTop: number
  extraBottom: number
  family: PolynomialFamily | null
  direction: PlaygroundDirection

  // spring
  springStiffness: number
  springDamping: number
  springMass: number

  // bounce
  bounces: number
  bounceStiffness: number

  // wiggle
  wiggles: number
  wiggleDamping: number

  // steps
  n: number
  position: StepPosition

  // preview
  property: PreviewProperty
  duration: number
  loop: boolean

  // output
  format: OutputFormat
}

const INITIAL_STATE: PlaygroundState = {
  basis: "bezier",
  // easeInOutCubic = [0.65, 0, 0.35, 1] — keep bezier coords consistent with family="Cubic"
  x1: 0.65,
  y1: 0,
  x2: 0.35,
  y2: 1,
  extraTop: 0.25,
  extraBottom: 0.25,
  family: "Cubic",
  direction: "InOut",
  springStiffness: 100,
  springDamping: 10,
  springMass: 1,
  bounces: 3,
  bounceStiffness: 50,
  wiggles: 4,
  wiggleDamping: 5,
  n: 4,
  position: "end",
  property: "moveX",
  duration: 1500,
  loop: true,
  format: "css",
}

function resolveBezier(
  family: PolynomialFamily,
  direction: PlaygroundDirection,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const match = PRESETS.find(
    (p) => p.family === family && p.direction === direction,
  )
  if (!match) return null
  const [x1, y1, x2, y2] = match.bezier
  return { x1, y1, x2, y2 }
}

function computeEasing(state: PlaygroundState): EasingString {
  switch (state.basis) {
    case "bezier":
      return formatEasing({
        basis: "bezier",
        x1: state.x1,
        y1: state.y1,
        x2: state.x2,
        y2: state.y2,
        extraTop: state.extraTop,
        extraBottom: state.extraBottom,
      })
    case "spring":
      return formatEasing({
        basis: "spring",
        stiffness: state.springStiffness,
        damping: state.springDamping,
        mass: state.springMass,
      })
    case "bounce":
      return formatEasing({
        basis: "bounce",
        bounces: state.bounces,
        stiffness: state.bounceStiffness,
      })
    case "wiggle":
      return formatEasing({
        basis: "wiggle",
        wiggles: state.wiggles,
        damping: state.wiggleDamping,
      })
    case "steps":
      return formatEasing({
        basis: "steps",
        n: state.n,
        position: state.position,
      })
  }
}

const pillClass = (active: boolean) =>
  cn(
    "rounded-full border px-3 py-1 font-mono text-xs transition",
    active
      ? "border-transparent bg-linear-to-br from-violet-glow to-pink-glow text-background"
      : "border-white/10 bg-white/5 hover:bg-white/10",
  )

const compactPillClass = (active: boolean) =>
  cn(
    "rounded-md border px-2 py-0.5 font-mono text-[11px] transition",
    active
      ? "border-transparent bg-linear-to-br from-violet-glow to-pink-glow text-background"
      : "border-white/10 bg-white/5 hover:bg-white/10",
  )

const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2"

// Background grid pattern shared by curve canvas + preview pane
const gridBackground = {
  backgroundImage:
    "linear-gradient(to right, oklch(0.4 0.04 290 / 0.18) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.4 0.04 290 / 0.18) 1px, transparent 1px)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0",
} as const

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* clipboard blocked — ignore */
        }
      }}
      className={cn(
        "rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider hover:bg-white/10",
        className,
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

export function EasingPlayground() {
  const [state, setState] = useState<PlaygroundState>(INITIAL_STATE)
  const easing = computeEasing(state)

  const setBasis = (basis: Basis) => setState((s) => ({ ...s, basis }))
  const setDirection = (direction: PlaygroundDirection) =>
    setState((s) => {
      if (s.family == null) return { ...s, direction }
      const bezier = resolveBezier(s.family, direction)
      return bezier ? { ...s, direction, ...bezier } : { ...s, direction }
    })
  const setFamily = (family: PolynomialFamily) =>
    setState((s) => {
      const bezier = resolveBezier(family, s.direction)
      return bezier ? { ...s, family, ...bezier } : { ...s, family }
    })
  const setBezier = (b: { x1: number; y1: number; x2: number; y2: number }) =>
    setState((s) => ({ ...s, ...b, family: null }))
  const setProperty = (property: PreviewProperty) =>
    setState((s) => ({ ...s, property }))
  const toggleLoop = () => setState((s) => ({ ...s, loop: !s.loop }))
  const setDuration = (duration: number) =>
    setState((s) => ({ ...s, duration }))
  const setFormat = (format: OutputFormat) =>
    setState((s) => ({ ...s, format }))

  return (
    <section
      data-slot="easing-playground"
      className={cn(
        "glass-card rounded-2xl border border-white/10 p-6 md:p-8",
        "bg-[linear-gradient(135deg,oklch(0.18_0.04_290),oklch(0.14_0.03_270))]",
      )}
    >
      <div className="mb-6">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          / component · playground
        </div>
        <h3 className="mt-1 font-bold text-xl tracking-tight">Easing Picker</h3>
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-[0.7fr_1fr]">
        <div data-slot="easing-playground-left" className="flex flex-col gap-4">
          {/* Basis + Direction on the same row (Direction only when basis=bezier) */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className={sectionLabelClass}>Basis</div>
              <div className="flex gap-1.5">
                {BASES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBasis(b)}
                    className={compactPillClass(state.basis === b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            {state.basis === "bezier" && (
              <div>
                <div className={sectionLabelClass}>Direction</div>
                <div className="flex gap-1.5">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDirection(d)}
                      className={compactPillClass(state.direction === d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {state.basis === "bezier" && (
            <>
              <div>
                <div className={sectionLabelClass}>Presets</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {FAMILIES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFamily(f)}
                      className={compactPillClass(state.family === f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className={sectionLabelClass}>Curve</div>
                <div
                  className="aspect-square max-w-60 rounded border border-white/10"
                  style={gridBackground}
                >
                  <BezierCanvas
                    value={{
                      x1: state.x1,
                      y1: state.y1,
                      x2: state.x2,
                      y2: state.y2,
                    }}
                    onChange={setBezier}
                  />
                </div>
              </div>
            </>
          )}

          {state.basis === "spring" && (
            <div>
              <div className={sectionLabelClass}>Spring</div>
              <SpringControls
                value={{
                  stiffness: state.springStiffness,
                  damping: state.springDamping,
                  mass: state.springMass,
                }}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    springStiffness: v.stiffness,
                    springDamping: v.damping,
                    springMass: v.mass,
                  }))
                }
              />
            </div>
          )}

          {state.basis === "bounce" && (
            <div>
              <div className={sectionLabelClass}>Bounce</div>
              <BounceControls
                value={{
                  bounces: state.bounces,
                  stiffness: state.bounceStiffness,
                }}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    bounces: v.bounces,
                    bounceStiffness: v.stiffness,
                  }))
                }
              />
            </div>
          )}

          {state.basis === "wiggle" && (
            <div>
              <div className={sectionLabelClass}>Wiggle</div>
              <WiggleControls
                value={{
                  wiggles: state.wiggles,
                  damping: state.wiggleDamping,
                }}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    wiggles: v.wiggles,
                    wiggleDamping: v.damping,
                  }))
                }
              />
            </div>
          )}

          {state.basis === "steps" && (
            <div>
              <div className={sectionLabelClass}>Steps</div>
              <StepsControls
                value={{ n: state.n, position: state.position }}
                onChange={(v) => setState((s) => ({ ...s, ...v }))}
              />
            </div>
          )}
        </div>

        <div
          data-slot="easing-playground-right"
          className="flex min-w-0 flex-col gap-6"
        >
          <div
            className="flex-1 rounded-lg border border-white/10 bg-background/40 p-4"
            style={gridBackground}
          >
            <div className={sectionLabelClass}>
              Preview · {state.property} (linear ghost shown)
            </div>
            <EasingPreview
              easing={easing}
              property={state.property}
              duration={state.duration}
              loop={state.loop}
              showLinearComparison
            />
          </div>

          <div>
            <div className={sectionLabelClass}>Property</div>
            <div className="flex flex-wrap gap-1.5">
              {PROPERTIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProperty(p)}
                  className={pillClass(state.property === p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 font-mono text-xs">
              <input
                type="checkbox"
                aria-label="loop"
                checked={state.loop}
                onChange={toggleLoop}
                className="accent-violet-glow"
              />
              loop
            </label>
            <label className="flex items-center gap-2 font-mono text-xs">
              <span className="text-muted-foreground">duration</span>
              <input
                type="range"
                aria-label="duration"
                min={200}
                max={5000}
                step={50}
                value={state.duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-32"
              />
              <span className="w-12 text-right tabular-nums">
                {state.duration}ms
              </span>
            </label>
          </div>

          <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-background/60 p-3">
            <div className="flex items-center gap-1">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={cn(
                    "rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
                    state.format === f
                      ? "border-violet-400/40 bg-violet-500/20 text-violet-200"
                      : "border-transparent text-muted-foreground hover:bg-white/5",
                  )}
                >
                  {f === "tailwind-v3"
                    ? "Tailwind v3"
                    : f === "tailwind-v4"
                      ? "Tailwind v4"
                      : "CSS"}
                </button>
              ))}
              <CopyButton
                text={formatSnippet(easing, state.format)}
                className="ml-auto"
              />
            </div>
            <pre
              data-slot="easing-playground-code"
              className="whitespace-pre-wrap break-all font-mono text-foreground/90 text-xs"
            >
              {formatSnippet(easing, state.format)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
