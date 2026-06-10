"use client"

import { cn } from "@/lib/utils"
import { useGeojsonEditorContext } from "../context"

export function ErrorRail({ className }: { className?: string }) {
  const { errors, select } = useGeojsonEditorContext()
  if (errors.length === 0) return null
  return (
    <ul
      data-slot="error-rail"
      className={cn("flex flex-col gap-1 p-2 text-sm", className)}
    >
      {errors.map((e, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: MVP list, no stable keys
        <li key={`${e.code}-${i}`}>
          <button
            type="button"
            onClick={() => select(e.path)}
            className={cn(
              "flex w-full flex-col gap-0.5 rounded-md px-2 py-1 text-left hover:bg-muted/50",
              e.severity === "error"
                ? "text-destructive"
                : "text-amber-600 dark:text-amber-400",
            )}
          >
            <span>{e.message}</span>
            <span className="font-mono text-muted-foreground text-xs">
              {e.path.length ? e.path.join(".") : "document"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
