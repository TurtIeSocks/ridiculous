"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
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
  formatTransform,
  parseTransform,
} from "./transform-builder.helpers"
import type {
  TransformFunctionName,
  TransformItem,
  TransformString,
} from "./transform-builder.types"

// ---------------------------------------------------------------------------
// Function groups (for the select option-groups)
// ---------------------------------------------------------------------------

const FUNCTION_GROUPS: ReadonlyArray<{
  label: string
  fns: readonly TransformFunctionName[]
}> = [
  {
    label: "translate",
    fns: ["translate", "translateX", "translateY", "translateZ", "translate3d"],
  },
  { label: "scale", fns: ["scale", "scaleX", "scaleY", "scaleZ", "scale3d"] },
  {
    label: "rotate",
    fns: ["rotate", "rotateX", "rotateY", "rotateZ", "rotate3d"],
  },
  { label: "skew", fns: ["skew", "skewX", "skewY"] },
  { label: "matrix", fns: ["matrix", "matrix3d"] },
  { label: "perspective", fns: ["perspective"] },
]

const LENGTH_UNITS = ["px", "rem", "em", "%", "vw", "vh"] as const
const ANGLE_UNITS = ["deg", "grad", "rad", "turn"] as const

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export interface TransformBuilderPanelProps {
  value: TransformString | (string & {})
  onChange: (value: TransformString) => void
  className?: string
  "aria-label"?: string
}

export interface TransformBuilderProps extends TransformBuilderPanelProps {}

// ---------------------------------------------------------------------------
// item ↔ args helpers (UI-local)
// ---------------------------------------------------------------------------

/** Pull the per-slot argument strings out of an item, for editing. */
function itemArgs(item: TransformItem): string[] {
  switch (item.fn) {
    case "translateX":
    case "translateY":
    case "translateZ":
    case "perspective":
    case "scaleX":
    case "scaleY":
    case "scaleZ":
      return [item.value]
    case "rotate":
    case "rotateX":
    case "rotateY":
    case "rotateZ":
    case "skewX":
    case "skewY":
      return [item.angle]
    case "translate":
    case "scale":
    case "skew":
      return item.y === undefined ? [item.x] : [item.x, item.y]
    case "translate3d":
    case "scale3d":
      return [item.x, item.y, item.z]
    case "rotate3d":
      return [item.x, item.y, item.z, item.angle]
    case "matrix":
    case "matrix3d":
      return item.values
  }
}

/** Rebuild an item from edited argument strings. */
function itemFromArgs(
  fn: TransformFunctionName,
  args: string[],
): TransformItem {
  switch (fn) {
    case "translateX":
    case "translateY":
    case "translateZ":
    case "perspective":
    case "scaleX":
    case "scaleY":
    case "scaleZ":
      return { fn, value: args[0] }
    case "rotate":
    case "rotateX":
    case "rotateY":
    case "rotateZ":
    case "skewX":
    case "skewY":
      return { fn, angle: args[0] }
    case "translate":
    case "scale":
    case "skew":
      return args.length > 1 && args[1] !== undefined
        ? { fn, x: args[0], y: args[1] }
        : { fn, x: args[0] }
    case "translate3d":
    case "scale3d":
      return { fn, x: args[0], y: args[1], z: args[2] }
    case "rotate3d":
      return { fn, x: args[0], y: args[1], z: args[2], angle: args[3] }
    case "matrix":
    case "matrix3d":
      return { fn, values: args }
  }
}

// ---------------------------------------------------------------------------
// TransformBuilder — popover-wrapped
// ---------------------------------------------------------------------------

export function TransformBuilder(props: TransformBuilderProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS transform",
  } = props
  const items = parseTransform(String(value)) ?? []

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span aria-hidden="true" className="text-foreground/60">
            ⤡
          </span>
          <span className="text-[10px] text-muted-foreground">
            {items.length} {items.length === 1 ? "fn" : "fns"}
          </span>
          <span className="max-w-[180px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <TransformBuilderPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// TransformBuilderPanel — inline
// ---------------------------------------------------------------------------

export function TransformBuilderPanel({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "CSS transform builder",
}: TransformBuilderPanelProps) {
  const [items, setItems] = useState<TransformItem[]>(
    () => parseTransform(String(value)) ?? [],
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseTransform(String(value))
    if (parsed !== null) setItems(parsed)
  }, [value])

  const commit = (next: TransformItem[]) => {
    setItems(next)
    const str = formatTransform(next)
    lastEmittedRef.current = str
    onChange(str as TransformString)
  }

  const updateAt = (index: number, item: TransformItem) => {
    commit(items.map((it, i) => (i === index ? item : it)))
  }
  const removeAt = (index: number) => {
    commit(items.filter((_, i) => i !== index))
  }
  const add = (fn: TransformFunctionName) => {
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
          <TransformFunctionRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and reorderable only by add/remove
            key={`${item.fn}-${i}`}
            item={item}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))}
      </div>
      <AddFunctionMenu onAdd={add} />
      <LiveString value={formatTransform(items)} />
      <TransformPreview3D
        value={formatTransform(items)}
        onChange={(str) => {
          const parsed = parseTransform(str)
          if (parsed !== null) commit(parsed)
        }}
      />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// TransformFunctionRow (public)
// ---------------------------------------------------------------------------

export interface TransformFunctionRowProps {
  item: TransformItem
  onChange: (item: TransformItem) => void
  onRemove: () => void
  className?: string
}

export function TransformFunctionRow({
  item,
  onChange,
  onRemove,
  className,
}: TransformFunctionRowProps) {
  const spec = argSpec(item.fn)
  const args = itemArgs(item)

  const setArg = (slot: number, next: string) => {
    const nextArgs = [...args]
    nextArgs[slot] = next
    onChange(itemFromArgs(item.fn, nextArgs))
  }

  const changeFn = (fn: TransformFunctionName) => {
    onChange(defaultItem(fn))
  }

  // For optional-y functions, how many slots are currently shown.
  const visibleSlots = Math.max(args.length, spec.min)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <FunctionSelect value={item.fn} onChange={changeFn} />
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {Array.from({ length: visibleSlots }, (_, slot) => (
          <ArgEditor
            // biome-ignore lint/suspicious/noArrayIndexKey: arg slots are fixed and positional per function; the row remounts when fn changes
            key={`${item.fn}-arg-${slot}`}
            fn={item.fn}
            label={`${item.fn} ${spec.labels[slot] ?? `arg ${slot + 1}`}`}
            kind={spec.kinds[slot] ?? spec.kinds[spec.kinds.length - 1]}
            value={args[slot] ?? ""}
            onChange={(next) => setArg(slot, next)}
          />
        ))}
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
  value: TransformFunctionName
  onChange: (fn: TransformFunctionName) => void
}) {
  return (
    <select
      aria-label="Transform function"
      value={value}
      onChange={(e) => onChange(e.target.value as TransformFunctionName)}
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
// ArgEditor (public)
// ---------------------------------------------------------------------------

export interface ArgEditorProps {
  fn: TransformFunctionName
  label: string
  kind: ArgKind
  value: string
  onChange: (value: string) => void
  className?: string
}

const UNITLESS: ReadonlySet<ArgKind> = new Set<ArgKind>([
  "number",
  "number-percentage",
])

export function ArgEditor({
  label,
  kind,
  value,
  onChange,
  className,
}: ArgEditorProps) {
  const unitless = UNITLESS.has(kind)
  const units = kind === "angle" ? ANGLE_UNITS : LENGTH_UNITS

  // Split a value like "10px" into number + unit for the dual control.
  const m = value.match(/^(-?\d*\.?\d*)([a-z%]*)$/i)
  const numPart = m ? m[1] : value
  const unitPart = m ? m[2] : ""
  const opaque = m === null // calc()/var() etc — show raw

  if (opaque || unitless) {
    return (
      <Input
        aria-label={label}
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 w-[88px] font-mono text-xs", className)}
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
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </span>
  )
}

// ---------------------------------------------------------------------------
// AddFunctionMenu (public)
// ---------------------------------------------------------------------------

export interface AddFunctionMenuProps {
  onAdd: (fn: TransformFunctionName) => void
  className?: string
}

export function AddFunctionMenu({ onAdd, className }: AddFunctionMenuProps) {
  return (
    <select
      aria-label="Add a transform function"
      value=""
      onChange={(e) => {
        const fn = e.target.value
        if (fn) onAdd(fn as TransformFunctionName)
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
// TransformPreview3D (public) — the showcase
// ---------------------------------------------------------------------------

export interface TransformPreview3DProps {
  value: string
  onChange?: (value: string) => void
  className?: string
}

interface Scrub {
  fn: TransformFunctionName
  label: string
  min: number
  max: number
  step: number
  unit: string
}

const SCRUBS: readonly Scrub[] = [
  {
    fn: "translateX",
    label: "translateX",
    min: -100,
    max: 100,
    step: 1,
    unit: "px",
  },
  {
    fn: "translateY",
    label: "translateY",
    min: -100,
    max: 100,
    step: 1,
    unit: "px",
  },
  { fn: "rotate", label: "rotate", min: -180, max: 180, step: 1, unit: "deg" },
  { fn: "scale", label: "scale", min: 0, max: 2, step: 0.05, unit: "" },
  { fn: "skewX", label: "skewX", min: -45, max: 45, step: 1, unit: "deg" },
]

/** Read the current scalar for a scrub fn from a parsed list (or a default). */
function scrubValue(items: TransformItem[], scrub: Scrub): number {
  const item = items.find((it) => it.fn === scrub.fn)
  if (!item) return scrub.fn === "scale" ? 1 : 0
  const raw =
    "angle" in item
      ? item.angle
      : "value" in item
        ? item.value
        : "x" in item
          ? item.x
          : "0"
  const n = Number.parseFloat(raw)
  return Number.isNaN(n) ? (scrub.fn === "scale" ? 1 : 0) : n
}

/** Merge a scrub change into the list (replace or append the function). */
function applyScrub(
  items: TransformItem[],
  scrub: Scrub,
  n: number,
): TransformItem[] {
  const next = itemFromArgs(scrub.fn, [`${n}${scrub.unit}`])
  const idx = items.findIndex((it) => it.fn === scrub.fn)
  if (idx === -1) return [...items, next]
  return items.map((it, i) => (i === idx ? next : it))
}

export function TransformPreview3D({
  value,
  onChange,
  className,
}: TransformPreview3DProps) {
  const id = useId()
  const items = parseTransform(value) ?? []

  return (
    <div className={cn("space-y-3 rounded-lg border p-3", className)}>
      <div className="text-muted-foreground text-xs">3D preview</div>
      <div
        className="flex h-40 items-center justify-center rounded-md bg-muted/30"
        style={{ perspective: "600px" }}
      >
        <div
          data-transform-card
          className="flex h-20 w-28 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 font-mono text-[10px] text-primary-foreground shadow-lg"
          style={{ transform: value === "none" ? undefined : value }}
          aria-hidden="true"
        >
          transform
        </div>
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
                      formatTransform(
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
