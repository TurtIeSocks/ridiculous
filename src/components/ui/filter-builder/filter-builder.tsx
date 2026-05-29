"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { FilterMode } from "./filter-builder.constants"
import {
  defaultItem,
  formatFilter,
  parseFilter,
} from "./filter-builder.helpers"
import type {
  FilterFunctionName,
  FilterItem,
  FilterString,
} from "./filter-builder.types"
import { FilterPreview } from "./filter-preview"
import { FilterFunctionRow, FunctionOptions } from "./filter-row"

// Re-export the extracted sub-components + their prop types so the public
// entry surface (and existing deep imports) is unchanged by the file split.
export type { FilterPreviewProps } from "./filter-preview"
export { FilterPreview } from "./filter-preview"
export type {
  FilterArgEditorProps,
  FilterFunctionRowProps,
} from "./filter-row"
export { FilterArgEditor, FilterFunctionRow } from "./filter-row"

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export interface FilterBuilderPanelProps {
  value: FilterString | (string & {})
  onChange: (value: FilterString) => void
  /**
   * Which CSS property the live preview targets. Both `filter` and
   * `backdrop-filter` share the identical function-list grammar, so this does
   * not change validation or narrow the `onChange` output — it only drives the
   * preview render target + labels. Defaults to `"filter"`.
   */
  mode?: FilterMode
  className?: string
  "aria-label"?: string
}

export interface FilterBuilderProps extends FilterBuilderPanelProps {}

// ---------------------------------------------------------------------------
// FilterBuilder — popover-wrapped
// ---------------------------------------------------------------------------

export function FilterBuilder(props: FilterBuilderProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS filter",
  } = props
  const items = parseFilter(String(value)) ?? []

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span aria-hidden="true" className="text-foreground/60">
            ✦
          </span>
          <span className="text-[10px] text-muted-foreground">
            {items.length} {items.length === 1 ? "fn" : "fns"}
          </span>
          <span className="max-w-[180px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <FilterBuilderPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// FilterBuilderPanel — inline
// ---------------------------------------------------------------------------

export function FilterBuilderPanel({
  value,
  onChange,
  mode = "filter",
  className,
  "aria-label": ariaLabel = "CSS filter builder",
}: FilterBuilderPanelProps) {
  const [items, setItems] = useState<FilterItem[]>(
    () => parseFilter(String(value)) ?? [],
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseFilter(String(value))
    if (parsed !== null) setItems(parsed)
  }, [value])

  const commit = (next: FilterItem[]) => {
    setItems(next)
    const str = formatFilter(next)
    lastEmittedRef.current = str
    onChange(str as FilterString)
  }

  const updateAt = (index: number, item: FilterItem) => {
    commit(items.map((it, i) => (i === index ? item : it)))
  }
  const removeAt = (index: number) => {
    commit(items.filter((_, i) => i !== index))
  }
  const add = (fn: FilterFunctionName) => {
    commit([...items, defaultItem(fn)])
  }

  return (
    <fieldset
      className={cn(
        "m-0 w-[480px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="space-y-2">
        {items.map((item, i) => (
          <FilterFunctionRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and reorderable only by add/remove
            key={`${item.fn}-${i}`}
            item={item}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))}
      </div>
      <AddFilterMenu onAdd={add} />
      <LiveString value={formatFilter(items)} />
      <FilterPreview
        value={formatFilter(items)}
        mode={mode}
        onChange={(str) => {
          const parsed = parseFilter(str)
          if (parsed !== null) commit(parsed)
        }}
      />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// AddFilterMenu (public)
// ---------------------------------------------------------------------------

export interface AddFilterMenuProps {
  onAdd: (fn: FilterFunctionName) => void
  className?: string
}

export function AddFilterMenu({ onAdd, className }: AddFilterMenuProps) {
  return (
    <select
      aria-label="Add a filter function"
      value=""
      onChange={(e) => {
        const fn = e.target.value
        if (fn) onAdd(fn as FilterFunctionName)
        e.target.value = ""
      }}
      className={cn(
        "h-9 w-full rounded-md border border-dashed bg-background px-2 font-mono text-muted-foreground text-xs",
        className,
      )}
    >
      <option value="">+ add function…</option>
      <FunctionOptions />
    </select>
  )
}

// ---------------------------------------------------------------------------
// LiveString (internal)
// ---------------------------------------------------------------------------

function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value}
    </code>
  )
}
