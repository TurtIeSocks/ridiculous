"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  type ArgKind,
  argSpec,
  defaultItem,
  formatFilter,
  parseFilter,
} from "./filter-builder.helpers"
import type {
  FilterFunctionName,
  FilterItem,
  FilterString,
} from "./filter-builder.types"

// ---------------------------------------------------------------------------
// Function groups (for the select option-groups)
// ---------------------------------------------------------------------------

const FUNCTION_GROUPS: ReadonlyArray<{
  label: string
  fns: readonly FilterFunctionName[]
}> = [
  { label: "blur", fns: ["blur"] },
  {
    label: "color",
    fns: [
      "brightness",
      "contrast",
      "grayscale",
      "invert",
      "opacity",
      "saturate",
      "sepia",
      "hue-rotate",
    ],
  },
  { label: "shadow", fns: ["drop-shadow"] },
  { label: "svg", fns: ["url"] },
]

const LENGTH_UNITS = ["px", "rem", "em", "%", "vw", "vh"] as const
const ANGLE_UNITS = ["deg", "grad", "rad", "turn"] as const
const AMOUNT_UNITS = ["", "%"] as const

type FilterMode = "filter" | "backdrop-filter"

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
// item ↔ args helpers (UI-local)
// ---------------------------------------------------------------------------

/** The single editable value for the non-shadow / non-url families. */
function singleValue(item: FilterItem): string {
  switch (item.fn) {
    case "drop-shadow":
      return ""
    case "url":
      return item.url
    default:
      return item.value
  }
}

/** Rebuild a single-arg item from an edited value string. */
function withSingleValue(fn: FilterFunctionName, value: string): FilterItem {
  if (fn === "url") return { fn, url: value }
  // blur / hue-rotate / amount families all carry `value`
  return { fn, value } as FilterItem
}

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
      {FUNCTION_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.fns.map((fn) => (
            <option key={fn} value={fn}>
              {fn}
            </option>
          ))}
        </optgroup>
      ))}
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
        className="h-8 rounded-l-none rounded-r-md border border-input bg-background px-1 font-mono text-xs"
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
      {FUNCTION_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.fns.map((fn) => (
            <option key={fn} value={fn}>
              {fn}
            </option>
          ))}
        </optgroup>
      ))}
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

// ---------------------------------------------------------------------------
// FilterPreview (public) — the showcase
// ---------------------------------------------------------------------------

export interface FilterPreviewProps {
  value: string
  mode?: FilterMode
  onChange?: (value: string) => void
  className?: string
}

interface Scrub {
  fn: FilterFunctionName
  label: string
  min: number
  max: number
  step: number
  unit: string
}

const SCRUBS: readonly Scrub[] = [
  { fn: "blur", label: "blur", min: 0, max: 20, step: 0.5, unit: "px" },
  {
    fn: "brightness",
    label: "brightness",
    min: 0,
    max: 3,
    step: 0.05,
    unit: "",
  },
  { fn: "contrast", label: "contrast", min: 0, max: 3, step: 0.05, unit: "" },
  { fn: "saturate", label: "saturate", min: 0, max: 3, step: 0.05, unit: "" },
  {
    fn: "hue-rotate",
    label: "hue-rotate",
    min: 0,
    max: 360,
    step: 1,
    unit: "deg",
  },
]

/** Read the current scalar for a scrub fn from a parsed list (or a default). */
function scrubValue(items: FilterItem[], scrub: Scrub): number {
  const item = items.find((it) => it.fn === scrub.fn)
  if (!item || !("value" in item)) {
    return scrub.fn === "blur" || scrub.fn === "hue-rotate" ? 0 : 1
  }
  const n = Number.parseFloat(item.value)
  if (Number.isNaN(n)) {
    return scrub.fn === "blur" || scrub.fn === "hue-rotate" ? 0 : 1
  }
  return n
}

/** Merge a scrub change into the list (replace or append the function). */
function applyScrub(
  items: FilterItem[],
  scrub: Scrub,
  n: number,
): FilterItem[] {
  const next = withSingleValue(scrub.fn, `${n}${scrub.unit}`)
  const idx = items.findIndex((it) => it.fn === scrub.fn)
  if (idx === -1) return [...items, next]
  return items.map((it, i) => (i === idx ? next : it))
}

export function FilterPreview({
  value,
  mode: modeProp = "filter",
  onChange,
  className,
}: FilterPreviewProps) {
  const id = useId()
  const [mode, setMode] = useState<FilterMode>(modeProp)
  useEffect(() => setMode(modeProp), [modeProp])

  const items = parseFilter(value) ?? []
  const applied = value === "none" ? undefined : value

  return (
    <div className={cn("space-y-3 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        <div className="inline-flex overflow-hidden rounded-md border text-[10px]">
          {(["filter", "backdrop-filter"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2 py-1 font-mono",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative flex h-40 items-center justify-center overflow-hidden rounded-md bg-[conic-gradient(at_30%_30%,#6366f1,#ec4899,#f59e0b,#10b981,#6366f1)]"
        aria-hidden="true"
      >
        {mode === "filter" ? (
          <div
            data-filter-target
            className="flex h-24 w-40 items-center justify-center rounded-lg bg-white/90 font-mono text-[10px] text-black shadow-lg"
            style={{ filter: applied }}
          >
            filter
          </div>
        ) : (
          <div
            data-backdrop-target
            className="flex h-24 w-40 items-center justify-center rounded-lg border border-white/30 bg-white/10 font-mono text-[10px] text-white"
            style={{ backdropFilter: applied }}
          >
            backdrop-filter
          </div>
        )}
      </div>

      {onChange ? (
        <div className="space-y-1.5">
          {SCRUBS.map((scrub) => {
            const current = scrubValue(items, scrub)
            return (
              <label
                key={scrub.fn}
                htmlFor={`${id}-${scrub.fn}`}
                className="flex items-center gap-2 text-xs"
              >
                <span className="w-20 font-mono text-muted-foreground">
                  {scrub.label}
                </span>
                <input
                  id={`${id}-${scrub.fn}`}
                  type="range"
                  aria-label={scrub.label}
                  min={scrub.min}
                  max={scrub.max}
                  step={scrub.step}
                  value={current}
                  onChange={(e) =>
                    onChange(
                      formatFilter(
                        applyScrub(items, scrub, Number(e.target.value)),
                      ),
                    )
                  }
                  className="flex-1"
                />
                <span className="w-14 text-right font-mono text-muted-foreground">
                  {current}
                  {scrub.unit}
                </span>
              </label>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
