"use client"

import { useState } from "react"
import { QueryBuilderPanel } from "@/components/ui/query-builder"
import { matchesNow } from "@/components/ui/query-builder/query-builder.helpers"
import type { QueryMode } from "@/components/ui/query-builder/query-builder.types"

export function ConditionBuilder() {
  const [mode, setMode] = useState<QueryMode>("media")
  const [mediaValue, setMediaValue] = useState<string>(
    "(min-width: 600px) and (orientation: landscape)",
  )
  const [containerValue, setContainerValue] = useState<string>(
    "sidebar (inline-size > 30rem)",
  )
  const value = mode === "media" ? mediaValue : containerValue
  const setValue = mode === "media" ? setMediaValue : setContainerValue
  const matches = matchesNow(value, mode)

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> condition-builder
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-xl tracking-tight">
          Feature tests, combiners, and a live match
        </h3>
        <fieldset className="m-0 inline-flex overflow-hidden rounded-lg border border-white/10 p-0 font-mono text-xs">
          <legend className="sr-only">query mode</legend>
          {(["media", "container"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={
                mode === m
                  ? "bg-foreground px-3 py-1 text-background"
                  : "px-3 py-1 text-muted-foreground hover:text-foreground"
              }
            >
              {m}
            </button>
          ))}
        </fieldset>
      </div>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Each row is one parenthesized feature test: a feature{" "}
        <code className="font-mono text-foreground">select</code>, a shape
        (exists / <code className="font-mono text-foreground">:</code> value /
        range), an operator, and the value (a{" "}
        <code className="font-mono text-foreground">unit-input</code> for
        lengths, a keyword{" "}
        <code className="font-mono text-foreground">select</code> for enums).
        Add rows, choose one{" "}
        <code className="font-mono text-foreground">and</code>/
        <code className="font-mono text-foreground">or</code> joiner, and toggle
        a top-level <code className="font-mono text-foreground">not</code>.
        Switch the mode to swap between media and the container size-feature
        subset.
      </p>
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-start">
        <QueryBuilderPanel
          mode={mode}
          value={value}
          onChange={setValue}
          className="w-full"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="font-mono text-[10px] text-muted-foreground uppercase">
            produced value
          </div>
          <code className="block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
            @{mode} {value}
          </code>
          {mode === "media" ? (
            <div
              className={
                matches
                  ? "rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono text-emerald-300 text-xs"
                  : "rounded-md border border-white/10 bg-black/30 px-3 py-2 font-mono text-muted-foreground text-xs"
              }
            >
              matches now?{" "}
              <strong>
                {matches === null ? "unknown" : matches ? "yes ✓" : "no"}
              </strong>{" "}
              <span className="text-muted-foreground/60">
                (live via window.matchMedia — resize the window)
              </span>
            </div>
          ) : (
            <p className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-muted-foreground/80 text-xs leading-relaxed">
              Container queries match against a sized container element at
              runtime — there is no global live-match API, so no indicator is
              shown.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
