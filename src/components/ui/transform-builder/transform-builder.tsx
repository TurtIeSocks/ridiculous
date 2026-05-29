"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  AddFunctionMenu,
  ArgEditor,
  FunctionSelect,
} from "./transform-builder.arg-editor"
import {
  argSpec,
  defaultItem,
  formatTransform,
  itemArgs,
  itemFromArgs,
  parseTransform,
} from "./transform-builder.helpers"
import { TransformPreview3D } from "./transform-builder.preview"
import type {
  TransformFunctionName,
  TransformItem,
  TransformString,
} from "./transform-builder.types"

export type {
  AddFunctionMenuProps,
  ArgEditorProps,
} from "./transform-builder.arg-editor"
// Re-export the controls and the preview so the public surface of this
// module is unchanged after the split (tests + index.ts import from here).
export {
  AddFunctionMenu,
  ArgEditor,
} from "./transform-builder.arg-editor"
export type { TransformPreview3DProps } from "./transform-builder.preview"
export { TransformPreview3D } from "./transform-builder.preview"

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
