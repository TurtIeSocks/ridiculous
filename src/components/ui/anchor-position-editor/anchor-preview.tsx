"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// AnchorPreview (public) — the live mock-anchor + positioned-box preview for
// position-area mode. Guards on `CSS.supports("position-area: …")`: in a
// supporting browser a small box snaps to the chosen area around a mock anchor;
// elsewhere (jsdom, older browsers) it degrades to a static diagram with a
// support note (mirrors `if-function`'s degrade path). The preview carries no
// injection surface — it sets `position-area` from a vetted keyword string.
// ---------------------------------------------------------------------------

const SUPPORT_FEATURE = "position-area: center"

function detectSupport(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return false
  }
  try {
    return CSS.supports(SUPPORT_FEATURE)
  } catch {
    return false
  }
}

export interface AnchorPreviewProps {
  /** The `position-area` value to visualize. */
  value: string
  className?: string
}

export function AnchorPreview({ value, className }: AnchorPreviewProps) {
  // Detect once on mount (post-hydration) so SSR + jsdom take the static path.
  const [supported, setSupported] = useState(false)
  useEffect(() => {
    setSupported(detectSupport())
  }, [])

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">preview</span>
        {supported ? (
          <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
            anchor positioning ✓
          </span>
        ) : (
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            not supported
          </span>
        )}
      </div>

      {supported ? (
        <div
          role="img"
          aria-label={`A box placed at ${value} around a mock anchor`}
          className="relative grid h-28 place-items-center rounded-md bg-muted/30"
        >
          {/* The mock anchor — registers an anchor name the box references.
              `anchorName` / `positionAnchor` / `positionArea` are camelCased
              (React serializes them to kebab-case CSS) and cast because they
              are not yet in React's CSSProperties. */}
          <div
            style={{ anchorName: "--preview-anchor" } as React.CSSProperties}
            className="size-10 rounded border-2 border-primary/50 border-dashed bg-primary/5"
          />
          {/* The positioned box — snaps to the chosen position-area. */}
          <div
            style={
              {
                position: "absolute",
                positionAnchor: "--preview-anchor",
                positionArea: value || "center",
              } as React.CSSProperties
            }
            className="size-5 rounded bg-primary"
          />
        </div>
      ) : (
        <StaticDiagram value={value} />
      )}

      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        {supported ? (
          <>
            Live placement via <code className="font-mono">position-area</code>{" "}
            around an <code className="font-mono">anchor-name</code>. Resize to
            see it track.
          </>
        ) : (
          <>
            CSS anchor positioning is unavailable here — showing a static
            diagram. The produced value still copies and works in a supporting
            browser.
          </>
        )}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StaticDiagram — the degraded, support-free placement sketch.
// ---------------------------------------------------------------------------

function StaticDiagram({ value }: { value: string }) {
  return (
    <div
      role="img"
      aria-label={`Static diagram: a box at ${value} relative to an anchor`}
      className="grid h-28 place-items-center rounded-md bg-muted/30"
    >
      <div className="relative size-16">
        <div className="absolute inset-0 rounded border-2 border-primary/50 border-dashed bg-primary/5" />
        <div className="absolute top-0 left-0 size-4 rounded bg-primary" />
      </div>
    </div>
  )
}
