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
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  const tw = property ? cssToTailwind(property, value, { colorPrefix }) : null
  const cssOnly = tw === null || output === "css"
  const active: "css" | "tailwind" = cssOnly
    ? "css"
    : output === "tailwind"
      ? "tailwind"
      : format
  const shown = active === "tailwind" && tw ? tw.inline : value
  const showToggle = output === "both" && tw !== null
  const canCopy = shown.trim() !== "" && shown.trim() !== "none"

  const copy = async () => {
    if (!canCopy) return
    if (timer.current !== null) clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(shown)
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
        <button
          type="button"
          onClick={copy}
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
    </div>
  )
}
