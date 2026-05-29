"use client"

import { useState } from "react"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import {
  formatAnimation,
  formatTransition,
  parseAnimation,
  parseTime,
  parseTransition,
} from "./transition-editor.helpers"
import type { EditorMode } from "./transition-editor.types"

// ---------------------------------------------------------------------------
// Preview constants
// ---------------------------------------------------------------------------

// Demo keyframes for the preview (animation mode needs @keyframes to exist).
const PREVIEW_KEYFRAMES = `
@keyframes te-slide { from { transform: translateX(0); } to { transform: translateX(96px); } }
@keyframes te-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
@keyframes te-spin { to { transform: rotate(360deg); } }
`

// Map a demo keyframes-name to the @keyframes we actually ship in the preview.
const KEYFRAME_ALIAS: Record<string, string> = {
  slide: "te-slide",
  pulse: "te-pulse",
  spin: "te-spin",
}

// ---------------------------------------------------------------------------
// Preview value helpers
// ---------------------------------------------------------------------------

/** Rewrite each animation layer's name to the preview's prefixed @keyframes. */
function aliasAnimation(value: string): string {
  const layers = parseAnimation(value)
  if (layers === null) return value
  return formatAnimation(
    layers.map((l) =>
      l.name && KEYFRAME_ALIAS[l.name]
        ? { ...l, name: KEYFRAME_ALIAS[l.name] }
        : l,
    ),
  )
}

/** Replace the first layer's duration with `ms` while preserving the rest. */
function setFirstDuration(mode: EditorMode, value: string, ms: number): string {
  const dur = `${ms}ms`
  if (mode === "transition") {
    const layers = parseTransition(value)
    if (layers === null || layers.length === 0) {
      return formatTransition([{ property: "all", duration: dur }])
    }
    return formatTransition(
      layers.map((l, i) => (i === 0 ? { ...l, duration: dur } : l)),
    )
  }
  const layers = parseAnimation(value)
  if (layers === null || layers.length === 0) {
    return formatAnimation([{ name: "slide", duration: dur }])
  }
  return formatAnimation(
    layers.map((l, i) => (i === 0 ? { ...l, duration: dur } : l)),
  )
}

/** Pull the first layer's duration in ms, defaulting to 200. */
function firstDurationMs(mode: EditorMode, value: string): number {
  const layers =
    mode === "transition" ? parseTransition(value) : parseAnimation(value)
  const d = layers?.[0]?.duration
  if (!d) return 200
  const t = parseTime(d)
  if (t === null) return 200
  const n = Number.parseFloat(t.num)
  if (Number.isNaN(n)) return 200
  return t.unit === "s" ? n * 1000 : n
}

// ---------------------------------------------------------------------------
// TransitionPreview — the live showcase
// ---------------------------------------------------------------------------

export interface TransitionPreviewProps {
  mode: EditorMode
  value: string
  onChange?: (value: string) => void
  className?: string
}

export function TransitionPreview({
  mode,
  value,
  onChange,
  className,
}: TransitionPreviewProps) {
  // `tick` remounts the animation target to restart it; `toggled` flips the
  // transition target so the transition fires on each play press.
  const [tick, setTick] = useState(0)
  const [toggled, setToggled] = useState(false)

  const applied = value === "none" ? "" : value
  const durationMs = firstDurationMs(mode, value)

  const transitionStyle =
    mode === "transition"
      ? {
          transition: applied,
          transform: toggled ? "translateX(96px)" : "translateX(0)",
        }
      : { animation: aliasAnimation(applied) }

  const replay = () => {
    if (mode === "transition") {
      setToggled((t) => !t)
    } else {
      setTick((t) => t + 1)
    }
  }

  return (
    <div className={cn("space-y-3 rounded-lg border p-3", className)}>
      {/* Static demo keyframes (no user input); rendered as a text child, not
          dangerouslySetInnerHTML, so there is no injection surface. */}
      <style>{PREVIEW_KEYFRAMES}</style>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        <button
          type="button"
          onClick={replay}
          aria-label={
            mode === "transition" ? "Play transition" : "Replay animation"
          }
          className="rounded border px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          {mode === "transition" ? "play" : "replay"}
        </button>
      </div>

      <div className="flex h-28 items-center overflow-hidden rounded-md bg-[radial-gradient(circle_at_30%_40%,#1e293b,#0f172a)] px-4">
        <div
          key={mode === "animation" ? `anim-${tick}` : "trans"}
          data-preview-target
          className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-300 to-violet-400"
          style={transitionStyle}
          aria-hidden="true"
        />
      </div>

      {onChange ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="w-16 font-mono text-muted-foreground">duration</span>
          <UnitInput
            unit="ms"
            value={`${Math.round(durationMs)}ms`}
            min={0}
            max={5000}
            step={50}
            aria-label="Duration (first layer) in ms"
            className="h-7 w-24"
            onChange={(next) => {
              const n = Number.parseFloat(next)
              onChange(setFirstDuration(mode, value, Number.isNaN(n) ? 0 : n))
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
