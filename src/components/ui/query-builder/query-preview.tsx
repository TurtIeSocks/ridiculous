"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { matchesNow } from "./query-builder.helpers"
import type { QueryMode } from "./query-builder.types"

// ---------------------------------------------------------------------------
// QueryPreview (public) — live "matches now?" indicator (media only)
// ---------------------------------------------------------------------------

export interface QueryPreviewProps {
  value: string
  mode: QueryMode
  className?: string
}

export function QueryPreview({ value, mode, className }: QueryPreviewProps) {
  const [matches, setMatches] = useState<boolean | null>(() =>
    matchesNow(value, mode),
  )

  useEffect(() => {
    if (mode !== "media") {
      setMatches(null)
      return
    }
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      setMatches(null)
      return
    }
    let mql: MediaQueryList
    try {
      mql = window.matchMedia(value)
    } catch {
      setMatches(null)
      return
    }
    setMatches(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener?.("change", onChange)
    return () => mql.removeEventListener?.("change", onChange)
  }, [value, mode])

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        {mode === "media" ? (
          <span
            role="status"
            className={cn(
              "rounded px-2 py-0.5 font-mono text-[10px]",
              matches
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {matches === null
              ? "matchMedia unavailable"
              : matches
                ? "matches now ✓"
                : "no match now"}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground/70">
            container — match depends on the element size
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        {mode === "media" ? (
          <>
            Live result from{" "}
            <code className="font-mono">window.matchMedia()</code>, updated as
            the viewport changes.
          </>
        ) : (
          <>
            Container queries match against a sized container element at
            runtime; there is no global live-match API, so no indicator is shown
            here.
          </>
        )}
      </p>
    </div>
  )
}
