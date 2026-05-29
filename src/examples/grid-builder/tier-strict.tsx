"use client"

import { useState } from "react"
import {
  cssGridAreas,
  cssTracks,
  GridBuilder,
  type GridTemplateString,
} from "@/components/ui/grid-builder"

// Compile-time grid-template validation. These calls are checked by tsc:
const validTracks = cssTracks("repeat(3, minmax(100px, 1fr)) [end]")
const validAreas = cssGridAreas('"head head" "nav main" "nav foot"')

// @ts-expect-error an fr is not a valid minmax min (must be inflexible)
const _badMin = cssTracks("minmax(1fr, 2fr)")
// @ts-expect-error repeat count must be a positive int | auto-fill | auto-fit
const _badCount = cssTracks("repeat(0, 1fr)")
// @ts-expect-error calc() is undecidable at the strict tier
const _badCalc = cssTracks("calc(1px + 2px)")
// @ts-expect-error grid-template-areas rows must share a column count
const _badCols = cssGridAreas('"a a" "b"')
void _badMin
void _badCount
void _badCalc
void _badCols

export function TierStrict() {
  const [value, setValue] = useState<GridTemplateString>(validTracks)
  void validAreas
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          TrackListLiteral&lt;S&gt; · GridAreasLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Two validators at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssTracks()</code> validates the whole
        track-list grammar — <code className="text-foreground">minmax</code>'s
        min must be inflexible, <code className="text-foreground">repeat</code>
        's count must be a positive int or{" "}
        <code className="text-foreground">auto-fill</code>/
        <code className="text-foreground">auto-fit</code>, named lines must be
        valid idents. <code className="text-foreground">cssGridAreas()</code>{" "}
        checks quoting + equal column counts. A violation resolves to{" "}
        <code className="text-foreground">never</code>.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <GridBuilder value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssTracks</span>(
        <span className="text-emerald-400">
          &quot;repeat(3, minmax(100px, 1fr))&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error fr is not an inflexible minmax min"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssTracks</span>(
        <span className="text-destructive">&quot;minmax(1fr, 2fr)&quot;</span>)
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error unequal column counts"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssGridAreas</span>(
        <span className="text-destructive">
          &quot;&apos;a a&apos; &apos;b&apos;&quot;
        </span>
        )
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: the contiguous-<strong>rectangle</strong> rule for areas (each
        name spans one filled rectangle) is checked at <strong>runtime</strong>{" "}
        by <code className="font-mono">parseAreas</code> /{" "}
        <code className="font-mono">validateAreasRectangles</code> — it is
        borderline-undecidable as a template-literal type, so the strict tier
        validates shape (quoting + equal columns + cell idents). Likewise{" "}
        <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> are undecidable at strict — use
        the casual / IntelliSense tier for those.
      </p>
    </div>
  )
}
