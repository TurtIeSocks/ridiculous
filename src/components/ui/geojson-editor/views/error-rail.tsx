"use client"

import { cn } from "@/lib/utils"
import { useGeojsonEditorContext } from "../context"
import {
  closeRing,
  getAtPath,
  reverseRing,
  setAtPath,
} from "../geojson-editor.helpers"
import type { GeojsonError, Position } from "../geojson-editor.types"

export function ErrorRail({ className }: { className?: string }) {
  const { errors, select, value, setValue } = useGeojsonEditorContext()
  if (errors.length === 0) return null

  const applyFix = (error: GeojsonError) => {
    if (!error.fix) return
    const ring = getAtPath(value, error.path) as Position[] | undefined
    if (!Array.isArray(ring)) return
    const next =
      error.fix.kind === "close-ring" ? closeRing(ring) : reverseRing(ring)
    setValue(setAtPath(value, error.path, next))
  }

  return (
    <ul
      data-slot="error-rail"
      className={cn("flex flex-col gap-1 p-2 text-sm", className)}
    >
      {errors.map((e, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: MVP list, no stable keys
        <li key={`${e.code}-${i}`} className="flex items-start gap-1">
          <button
            type="button"
            onClick={() => select(e.path)}
            className={cn(
              "flex flex-1 flex-col gap-0.5 rounded-md px-2 py-1 text-left hover:bg-muted/50",
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
          {e.fix && (
            <button
              type="button"
              onClick={() => applyFix(e)}
              className="rounded-md border border-input px-2 py-1 text-muted-foreground text-xs hover:bg-muted/50"
            >
              {e.fix.label}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
