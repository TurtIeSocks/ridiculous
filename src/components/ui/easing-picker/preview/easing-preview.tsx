import { useState } from "react"
import { cn } from "@/lib/utils"
import type { EasingString } from "../easing-picker.types"

export type PreviewProperty =
  | "moveX"
  | "moveY"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "rotate"
  | "opacity"
  | "width"
  | "color"
  | "blur"

export interface EasingPreviewProps {
  easing: EasingString | (string & {})
  property?: PreviewProperty
  duration?: number
  loop?: boolean
  showLinearComparison?: boolean
  className?: string
}

const PROP_KEYFRAMES: Record<PreviewProperty, { from: string; to: string }> = {
  moveX: {
    from: "transform: translateX(0)",
    to: "transform: translateX(400px)",
  },
  moveY: {
    from: "transform: translateY(0)",
    to: "transform: translateY(100px)",
  },
  scale: { from: "transform: scale(0.5)", to: "transform: scale(1.5)" },
  scaleX: { from: "transform: scaleX(0.5)", to: "transform: scaleX(1.5)" },
  scaleY: { from: "transform: scaleY(0.5)", to: "transform: scaleY(1.5)" },
  rotate: { from: "transform: rotate(0)", to: "transform: rotate(360deg)" },
  opacity: { from: "opacity: 0", to: "opacity: 1" },
  width: { from: "width: 50px", to: "width: 200px" },
  color: {
    from: "background-color: oklch(0.55 0.2 300)",
    to: "background-color: oklch(0.55 0.2 30)",
  },
  blur: { from: "filter: blur(0px)", to: "filter: blur(8px)" },
}

export function EasingPreview({
  easing,
  property = "moveX",
  duration = 800,
  loop = false,
  showLinearComparison = false,
  className,
}: EasingPreviewProps) {
  const [animKey, setAnimKey] = useState(0)
  const [playing, setPlaying] = useState(true)
  const animName = `easing-preview-${property}`

  return (
    <div
      className={cn(
        "relative h-[120px] w-full overflow-hidden rounded bg-muted/30",
        className,
      )}
    >
      <style>
        {`@keyframes ${animName} {
          from { ${PROP_KEYFRAMES[property].from}; }
          to { ${PROP_KEYFRAMES[property].to}; }
        }`}
      </style>
      {showLinearComparison && (
        <div
          key={`ghost-${animKey}`}
          data-preview-ghost
          className="absolute top-6 left-4 size-8 rounded bg-muted-foreground/35"
          style={{
            animation: `${animName} ${duration}ms ${loop ? "infinite" : "1"} linear`,
            animationPlayState: playing ? "running" : "paused",
          }}
        />
      )}
      <div
        key={`target-${animKey}`}
        data-preview-target
        data-animation-key={animKey}
        className="absolute top-6 left-4 size-8 rounded bg-primary"
        style={{
          animation: `${animName} ${duration}ms ${loop ? "infinite" : "1"} ${easing}`,
          animationPlayState: playing ? "running" : "paused",
        }}
      />
      <div className="absolute right-2 bottom-2 flex gap-1">
        {loop && (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded border bg-background px-2 py-1 text-xs"
          >
            {playing ? "Pause" : "Play"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setAnimKey((k) => k + 1)}
          className="rounded border bg-background px-2 py-1 text-xs"
        >
          Replay
        </button>
      </div>
    </div>
  )
}
