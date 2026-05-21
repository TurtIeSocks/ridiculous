"use client"

import { useState } from "react"
import {
  BezierCanvas,
  type EasingString,
  EasingPreview,
  formatEasing,
  type PolynomialFamily,
  PRESETS,
  type PreviewProperty,
  SpringControls,
  type StepPosition,
  StepsControls,
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

type Basis = "bezier" | "spring" | "steps"
const BASES: ReadonlyArray<Basis> = ["bezier", "spring", "steps"]

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
  x1: number
  y1: number
  x2: number
  y2: number
  extraTop: number
  extraBottom: number
  family: PolynomialFamily | null
  direction: PlaygroundDirection
  stiffness: number
  damping: number
  mass: number
  n: number
  position: StepPosition
  property: PreviewProperty
  duration: number
  loop: boolean
  replayKey: number
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
  stiffness: 100,
  damping: 10,
  mass: 1,
  n: 4,
  position: "end",
  property: "moveX",
  duration: 600,
  loop: true,
  replayKey: 0,
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
  if (state.basis === "bezier") {
    return formatEasing({
      basis: "bezier",
      x1: state.x1,
      y1: state.y1,
      x2: state.x2,
      y2: state.y2,
      extraTop: state.extraTop,
      extraBottom: state.extraBottom,
    })
  }
  if (state.basis === "spring") {
    return formatEasing({
      basis: "spring",
      stiffness: state.stiffness,
      damping: state.damping,
      mass: state.mass,
    })
  }
  return formatEasing({
    basis: "steps",
    n: state.n,
    position: state.position,
  })
}

const pillClass = (active: boolean) =>
  cn(
    "rounded-full px-3 py-1 text-xs font-mono border transition",
    active
      ? "bg-gradient-to-br from-violet-glow to-pink-glow text-background border-transparent"
      : "bg-white/5 border-white/10 hover:bg-white/10",
  )

const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2"

function CopyButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
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
        "rounded px-2 py-1 text-[10px] font-mono uppercase tracking-[0.05em] border border-white/10 bg-white/5 hover:bg-white/10",
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
  const bumpReplay = () =>
    setState((s) => ({ ...s, replayKey: s.replayKey + 1 }))
  const toggleLoop = () => setState((s) => ({ ...s, loop: !s.loop }))
  const setDuration = (duration: number) =>
    setState((s) => ({ ...s, duration }))
  const setFormat = (format: OutputFormat) =>
    setState((s) => ({ ...s, format }))

  return (
    <section
      data-slot="easing-playground"
      data-replay-key={state.replayKey}
      className={cn(
        "glass-card rounded-2xl p-6 md:p-8 border border-white/10",
        "bg-[linear-gradient(135deg,oklch(0.18_0.04_290),oklch(0.14_0.03_270))]",
      )}
    >
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
            / component · playground
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight">
            Easing Picker
          </h3>
        </div>
        <div
          data-slot="easing-playground-value"
          className="text-xs font-mono text-muted-foreground"
        >
          {easing}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr] items-stretch">
        <div
          data-slot="easing-playground-left"
          className="flex flex-col gap-4"
        >
          <div>
            <div className={sectionLabelClass}>Basis</div>
            <div className="flex gap-1.5">
              {BASES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBasis(b)}
                  className={pillClass(state.basis === b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {state.basis === "bezier" && (
            <>
              <div>
                <div className={sectionLabelClass}>Direction</div>
                <div className="flex gap-1.5">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDirection(d)}
                      className={pillClass(state.direction === d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className={sectionLabelClass}>Presets</div>
                <div className="flex flex-wrap gap-1.5">
                  {FAMILIES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFamily(f)}
                      className={pillClass(state.family === f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className={sectionLabelClass}>Curve</div>
                <div className="aspect-square max-w-60">
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
                  stiffness: state.stiffness,
                  damping: state.damping,
                  mass: state.mass,
                }}
                onChange={(v) => setState((s) => ({ ...s, ...v }))}
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
          className="flex flex-col gap-4 min-w-0"
        >
          <div className="flex-1 rounded-lg border border-white/10 bg-background/40 p-4">
            <div className={sectionLabelClass}>
              Preview · {state.property} (linear ghost shown)
            </div>
            <EasingPreview
              key={state.replayKey}
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
            <button
              type="button"
              aria-label="Restart playground animation"
              onClick={bumpReplay}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-mono border transition",
                "bg-white/5 border-white/10 hover:bg-white/10",
              )}
            >
              ▶ Restart
            </button>
            <label className="flex items-center gap-2 text-xs font-mono">
              <input
                type="checkbox"
                aria-label="loop"
                checked={state.loop}
                onChange={toggleLoop}
                className="accent-violet-glow"
              />
              loop
            </label>
            <label className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">duration</span>
              <input
                type="range"
                aria-label="duration"
                min={200}
                max={2000}
                step={50}
                value={state.duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-32"
              />
              <span className="tabular-nums w-12 text-right">
                {state.duration}ms
              </span>
            </label>
          </div>

          <div className="rounded-lg border border-white/10 bg-background/60 p-3 mt-2 space-y-2">
            <div className="flex items-center gap-1">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={cn(
                    "rounded px-2 py-1 text-[10px] font-mono uppercase tracking-[0.05em] border",
                    state.format === f
                      ? "bg-violet-500/20 border-violet-400/40 text-violet-200"
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
              className="text-xs font-mono text-foreground/90 whitespace-pre-wrap break-all"
            >
              {formatSnippet(easing, state.format)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
