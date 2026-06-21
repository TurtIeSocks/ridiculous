"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { cssToTailwind } from "./css-output.helpers"
import type { CssOutputProps } from "./css-output.types"

export function CssOutput({
  value,
  property,
  output = "both",
  colorPrefix = "bg",
  className,
}: CssOutputProps) {
  const [format, setFormat] = useState<"css" | "tailwind">("css")
  const [prefix, setPrefix] = useState<"bg" | "text" | "border">(colorPrefix)
  const [name, setName] = useState("custom")
  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  const tw = property
    ? cssToTailwind(property, value, { colorPrefix: prefix, name })
    : null
  const cssOnly = tw === null || output === "css"
  const active: "css" | "tailwind" = cssOnly
    ? "css"
    : output === "tailwind"
      ? "tailwind"
      : format
  const shown = active === "tailwind" && tw ? tw.inline : value
  const showToggle = output === "both" && tw !== null
  const isColor = property === "color"
  const canCopy = shown.trim() !== "" && shown.trim() !== "none"

  const copyText = async (text: string) => {
    if (timer.current !== null) clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), 1200)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        {showToggle && (
          <div className="flex gap-1 text-xs" role="tablist">
            {(["css", "tailwind"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={format === f}
                onClick={() => setFormat(f)}
                className={cn(
                  "rounded border px-2 py-0.5",
                  format === f
                    ? "border-accent-foreground/20 bg-accent"
                    : "border-transparent text-muted-foreground hover:bg-accent/50",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}
        {active === "tailwind" && isColor && (
          <fieldset className="flex gap-1 text-xs">
            <legend className="sr-only">color utility prefix</legend>
            {(["bg", "text", "border"] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={prefix === p}
                onClick={() => setPrefix(p)}
                className={cn(
                  "rounded border px-2 py-0.5",
                  prefix === p
                    ? "border-accent-foreground/20 bg-accent"
                    : "border-transparent text-muted-foreground hover:bg-accent/50",
                )}
              >
                {p}
              </button>
            ))}
          </fieldset>
        )}
        <button
          type="button"
          onClick={() => canCopy && copyText(shown)}
          disabled={!canCopy}
          aria-label={copied ? "Copied" : "Copy"}
          className="ml-auto rounded border border-white/10 px-2 py-0.5 text-muted-foreground text-xs hover:text-foreground disabled:opacity-40"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
        {shown}
      </code>

      {active === "tailwind" && tw?.theme && (
        <div className="space-y-1.5">
          <button
            type="button"
            aria-expanded={showToken}
            onClick={() => setShowToken((s) => !s)}
            className="text-muted-foreground text-xs hover:text-foreground"
          >
            {showToken ? "− " : "+ "}use as @theme token
          </button>
          {showToken && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">token name:</span>
                <input
                  type="text"
                  aria-label="token name"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  className="flex-1 rounded bg-muted px-2 py-0.5 text-foreground"
                />
              </label>
              <pre className="overflow-x-auto whitespace-pre rounded bg-muted/50 p-2 font-mono text-xs">
                {tw.theme.atRule}
              </pre>
              <button
                type="button"
                aria-label="Copy token"
                onClick={() => tw.theme && copyText(tw.theme.atRule)}
                className="rounded border border-white/10 px-2 py-0.5 text-muted-foreground text-xs hover:text-foreground"
              >
                copy token
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
