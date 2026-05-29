import { useId, useState } from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// ColorFunctionPreview (public) — renders the value as a swatch background,
// with a light/dark color-scheme toggle for `light-dark()` values.
// ---------------------------------------------------------------------------

export interface ColorFunctionPreviewProps {
  value: string
  className?: string
}

export function ColorFunctionPreview({
  value,
  className,
}: ColorFunctionPreviewProps) {
  const [scheme, setScheme] = useState<"light" | "dark">("light")
  const isLightDark = value.trimStart().startsWith("light-dark(")
  const headingId = useId()

  return (
    <section className={cn("space-y-2", className)} aria-labelledby={headingId}>
      <div className="flex items-center justify-between">
        <span id={headingId} className="text-[10px] text-muted-foreground">
          Preview
        </span>
        {isLightDark && (
          <button
            type="button"
            aria-label="Toggle color scheme"
            onClick={() => setScheme((s) => (s === "light" ? "dark" : "light"))}
            className="rounded border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            scheme: {scheme}
          </button>
        )}
      </div>
      <div
        data-testid="cf-preview-scheme"
        style={{ colorScheme: scheme }}
        className="rounded border p-2"
      >
        <div
          data-testid="cf-preview"
          style={{ background: value }}
          className="h-16 w-full rounded"
        />
      </div>
    </section>
  )
}
