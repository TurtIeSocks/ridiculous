"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useGeojsonEditorContext } from "../context"
import { getAtPath } from "../geojson-editor.helpers"
import type { GeojsonPath, Json } from "../geojson-editor.types"

// Coerce a raw input string to a JSON scalar (number / boolean / null / string).
function coerce(raw: string): Json {
  if (raw === "true") return true
  if (raw === "false") return false
  if (raw === "null") return null
  if (raw.trim() !== "" && !Number.isNaN(Number(raw))) return Number(raw)
  return raw
}

function featurePath(
  selection: GeojsonPath | null,
  value: unknown,
): GeojsonPath | null {
  if (selection === null)
    return (value as { type?: string })?.type === "Feature" ? [] : null
  const at = getAtPath(value, selection) as { type?: string } | undefined
  return at?.type === "Feature" ? selection : null
}

export function PropertiesGrid({ className }: { className?: string }) {
  const { value, selection, setProperty } = useGeojsonEditorContext()
  const fPath = featurePath(selection, value)
  if (fPath === null) return null
  const props =
    (getAtPath(value, [...fPath, "properties"]) as Record<
      string,
      Json
    > | null) ?? {}
  const entries = Object.entries(props)

  return (
    <div
      data-slot="properties-grid"
      className={cn("flex flex-col gap-1 p-2", className)}
    >
      <span className="text-muted-foreground text-xs">properties</span>
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-1.5">
          <Input
            readOnly
            value={key}
            aria-label={`property ${key} key`}
            className="h-7 w-28 font-mono text-xs"
          />
          <PropValue
            initial={String(val)}
            label={`property ${key} value`}
            onCommit={(next) => setProperty(fPath, key, coerce(next))}
          />
        </div>
      ))}
      <AddProperty onAdd={(key) => setProperty(fPath, key, "")} />
    </div>
  )
}

function PropValue({
  initial,
  label,
  onCommit,
}: {
  initial: string
  label: string
  onCommit: (next: string) => void
}) {
  const [draft, setDraft] = React.useState<string | null>(null)
  return (
    <Input
      aria-label={label}
      value={draft ?? initial}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => {
        setDraft(null)
        if (e.target.value !== initial) onCommit(e.target.value)
      }}
      className="h-7 flex-1 font-mono text-xs"
    />
  )
}

function AddProperty({ onAdd }: { onAdd: (key: string) => void }) {
  const [key, setKey] = React.useState("")
  return (
    <form
      className="flex gap-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        if (key.trim()) {
          onAdd(key.trim())
          setKey("")
        }
      }}
    >
      <Input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="+ add property"
        aria-label="new property key"
        className="h-7 w-28 font-mono text-xs"
      />
    </form>
  )
}
