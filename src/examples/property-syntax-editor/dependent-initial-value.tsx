"use client"

import { useState } from "react"
import {
  matchesSyntax,
  PropertySyntaxEditorPanel,
} from "@/components/ui/property-syntax-editor"

export function DependentInitialValue() {
  const [syntax, setSyntax] = useState<string>("<length>+")
  // A standalone initial-value demo mirroring the Panel's internal field, so
  // the dependency is visible side-by-side with the produced syntax string.
  const [initialValue, setInitialValue] = useState<string>("0px 4px 8px")
  const valid = matchesSyntax(syntax, initialValue)

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> dependent-initial-value
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        The dependency, live: one CSS string typing another
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        The hero. Build the{" "}
        <code className="font-mono text-foreground">syntax</code> descriptor
        with the chip builder on the left; type a candidate{" "}
        <code className="font-mono text-foreground">initial-value</code> on the
        right. The badge flips green / red in real time as{" "}
        <code className="font-mono text-foreground">
          matchesSyntax(syntax, value)
        </code>{" "}
        runs — the runtime mirror of the dependent type{" "}
        <code className="font-mono text-foreground">
          InitialValueLiteral&lt;Syntax, V&gt;
        </code>
        . Try <code className="font-mono">&lt;color&gt;</code> with{" "}
        <code className="font-mono">#ff0000</code> (valid) vs{" "}
        <code className="font-mono">red</code> (rejected — color-picker forms
        only).
      </p>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <PropertySyntaxEditorPanel
          value={syntax}
          onChange={setSyntax}
          className="w-full lg:w-auto"
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase">
              produced syntax string
            </div>
            <code className="mt-1 block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
              syntax: "{syntax || " "}"
            </code>
          </div>

          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase">
              candidate initial-value
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                aria-label="candidate initial value"
                value={initialValue}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => setInitialValue(e.target.value)}
                className="h-8 w-[220px] rounded-md border border-input bg-background px-2 font-mono text-xs"
              />
              <span
                role="status"
                className={
                  valid
                    ? "rounded-md bg-emerald-500/15 px-2 py-1 font-mono text-emerald-600 text-xs dark:text-emerald-400"
                    : "rounded-md bg-red-500/15 px-2 py-1 font-mono text-red-600 text-xs dark:text-red-400"
                }
              >
                {valid ? "valid" : "invalid"}
              </span>
            </div>
          </div>

          <p className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-muted-foreground/80 text-xs leading-relaxed">
            At compile time the same dependency is{" "}
            <code className="font-mono text-foreground">
              cssProperty(syntax, initialValue)
            </code>{" "}
            — a mismatch resolves the call to{" "}
            <code className="font-mono text-foreground">never</code>. The{" "}
            <code className="font-mono">inherits</code> descriptor is a UI
            toggle, not part of the controlled syntax value.
          </p>
        </div>
      </div>
    </div>
  )
}
