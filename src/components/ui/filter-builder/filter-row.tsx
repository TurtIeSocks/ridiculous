"use client"

import { ColorPicker } from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  AMOUNT_UNITS,
  ANGLE_UNITS,
  FUNCTION_GROUPS,
  LENGTH_UNITS,
  singleValue,
  withSingleValue,
} from "./filter-builder.constants"
import { type ArgKind, argSpec, defaultItem } from "./filter-builder.helpers"
import type { FilterFunctionName, FilterItem } from "./filter-builder.types"

// ---------------------------------------------------------------------------
// FunctionOptions (internal) — the shared <optgroup> option list
//
// Single source for the grouped function options rendered inside both
// `FunctionSelect` (a row's function picker) and the entry's `AddFilterMenu`.
// ---------------------------------------------------------------------------

export function FunctionOptions() {
  return (
    <>
      {FUNCTION_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.fns.map((fn) => (
            <option key={fn} value={fn}>
              {fn}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// FilterFunctionRow (public)
// ---------------------------------------------------------------------------

export interface FilterFunctionRowProps {
  item: FilterItem
  onChange: (item: FilterItem) => void
  onRemove: () => void
  className?: string
}

export function FilterFunctionRow({
  item,
  onChange,
  onRemove,
  className,
}: FilterFunctionRowProps) {
  const spec = argSpec(item.fn)

  const changeFn = (fn: FilterFunctionName) => {
    onChange(defaultItem(fn))
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <FunctionSelect value={item.fn} onChange={changeFn} />
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {item.fn === "drop-shadow" ? (
          <DropShadowControls item={item} onChange={onChange} />
        ) : item.fn === "url" ? (
          <Input
            aria-label="url body"
            value={item.url}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => onChange({ fn: "url", url: e.target.value })}
            className="h-8 w-full font-mono text-xs"
          />
        ) : (
          <FilterArgEditor
            label={`${item.fn} ${spec.label}`}
            kind={spec.kind}
            value={singleValue(item)}
            onChange={(next) => onChange(withSingleValue(item.fn, next))}
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.fn}`}
        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

function FunctionSelect({
  value,
  onChange,
}: {
  value: FilterFunctionName
  onChange: (fn: FilterFunctionName) => void
}) {
  return (
    <select
      aria-label="Filter function"
      value={value}
      onChange={(e) => onChange(e.target.value as FilterFunctionName)}
      className="h-8 rounded border bg-background px-1.5 font-mono text-xs"
    >
      <FunctionOptions />
    </select>
  )
}

// ---------------------------------------------------------------------------
// DropShadowControls (internal) — x/y/blur length editors + color
// ---------------------------------------------------------------------------

function DropShadowControls({
  item,
  onChange,
}: {
  item: Extract<FilterItem, { fn: "drop-shadow" }>
  onChange: (item: FilterItem) => void
}) {
  const setField = (patch: Partial<typeof item>) => {
    onChange({ ...item, ...patch })
  }

  return (
    <>
      <FilterArgEditor
        label="drop-shadow offset-x"
        kind="length"
        value={item.x}
        onChange={(x) => setField({ x })}
      />
      <FilterArgEditor
        label="drop-shadow offset-y"
        kind="length"
        value={item.y}
        onChange={(y) => setField({ y })}
      />
      <FilterArgEditor
        label="drop-shadow blur"
        kind="length"
        value={item.blur ?? ""}
        onChange={(blur) => setField({ blur: blur === "" ? undefined : blur })}
      />
      {item.color === undefined ? (
        <button
          type="button"
          aria-label="Add drop-shadow color"
          onClick={() => setField({ color: "rgb(0 0 0 / 0.5)" })}
          className="h-8 rounded border border-dashed px-2 font-mono text-[10px] text-muted-foreground"
        >
          + color
        </button>
      ) : (
        <span className="inline-flex items-center gap-1">
          <ColorPicker
            native
            value={item.color}
            onChange={(color) => setField({ color })}
            aria-label="drop-shadow color"
          />
          <button
            type="button"
            aria-label="Remove drop-shadow color"
            onClick={() => setField({ color: undefined })}
            className="rounded p-0.5 text-[10px] text-muted-foreground hover:text-destructive"
          >
            ×
          </button>
        </span>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// FilterArgEditor (public)
// ---------------------------------------------------------------------------

export interface FilterArgEditorProps {
  label: string
  kind: ArgKind
  value: string
  onChange: (value: string) => void
  className?: string
}

export function FilterArgEditor({
  label,
  kind,
  value,
  onChange,
  className,
}: FilterArgEditorProps) {
  const units =
    kind === "angle"
      ? ANGLE_UNITS
      : kind === "amount"
        ? AMOUNT_UNITS
        : LENGTH_UNITS

  // Split a value like "10px" / "150%" / "1.2" into number + unit.
  const m = value.match(/^(-?\d*\.?\d*)([a-z%]*)$/i)
  const numPart = m ? m[1] : value
  const unitPart = m ? m[2] : ""
  const opaque = m === null // calc()/var() etc — show raw

  if (opaque) {
    return (
      <Input
        aria-label={label}
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 w-[120px] font-mono text-xs", className)}
      />
    )
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <Input
        aria-label={label}
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-[72px] rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label={`${label} unit`}
        value={unitPart || units[0]}
        onChange={(e) => onChange(`${numPart || "0"}${e.target.value}`)}
        className="h-8 rounded-r-md rounded-l-none border border-input bg-background px-1 font-mono text-xs"
      >
        {units.map((u) => (
          <option key={u || "none"} value={u}>
            {u === "" ? "×" : u}
          </option>
        ))}
      </select>
    </span>
  )
}
