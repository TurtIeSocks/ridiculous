import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type OutputFormat = "css" | "tailwind-v3" | "tailwind-v4"

interface OutputPanelProps {
  easing: string
  format: OutputFormat
  onFormatChange: (format: OutputFormat) => void
}

export function OutputPanel({
  easing,
  format,
  onFormatChange,
}: OutputPanelProps) {
  const [varName, setVarName] = useState("ease-custom")
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  // Hold the reset timer so we can cancel it on a new copy / unmount.
  // Without this, the popover Portal can close before the timeout fires,
  // triggering a setState-after-unmount.
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current)
    }
  }, [])

  const snippet = formatSnippet(easing, format, varName)

  const copy = async () => {
    if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current)
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      resetTimerRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopyError(true)
      resetTimerRef.current = setTimeout(() => setCopyError(false), 1500)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-xs">
        {(["css", "tailwind-v3", "tailwind-v4"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFormatChange(f)}
            className={cn(
              "rounded border px-2 py-1",
              format === f
                ? "border-accent-foreground/20 bg-accent"
                : "border-transparent hover:bg-accent/50",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      {format === "tailwind-v4" && (
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">--var name:</span>
          <input
            type="text"
            value={varName}
            onChange={(e) =>
              setVarName(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              )
            }
            className="flex-1 rounded bg-muted px-2 py-1 text-foreground"
          />
        </label>
      )}
      <pre className="overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">
        {snippet}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="w-full rounded bg-primary px-2 py-1 text-primary-foreground text-xs"
      >
        {copyError ? "Failed" : copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

function formatSnippet(
  easing: string,
  format: OutputFormat,
  varName: string,
): string {
  switch (format) {
    case "css":
      return easing
    case "tailwind-v3": {
      // Tailwind v3 arbitrary values: strip spaces (cubic-bezier args stay valid).
      const encoded = easing.replace(/\s+/g, "")
      return `class="ease-[${encoded}]"`
    }
    case "tailwind-v4":
      return `@theme {\n  --${varName}: ${easing};\n}\n/* usage: class="${varName}" */`
  }
}
