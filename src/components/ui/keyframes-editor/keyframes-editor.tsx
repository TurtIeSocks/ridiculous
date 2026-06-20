"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { DeclarationRow } from "./declaration-row"
import { KeyframePreview } from "./keyframe-preview"
import { KeyframeTimeline } from "./keyframe-timeline"
import {
  defaultKeyframes,
  formatKeyframes,
  parseKeyframes,
  percentToSelector,
  selectorToPercent,
} from "./keyframes-editor.helpers"
import type {
  Declaration,
  KeyframeBlock,
  KeyframesString,
} from "./keyframes-editor.types"

// Re-export the public sub-components + their prop types so consumers (and the
// barrel) can import them from `./keyframes-editor`.
export type { DeclarationRowProps } from "./declaration-row"
export { DeclarationRow } from "./declaration-row"
export type { KeyframePreviewProps } from "./keyframe-preview"
export { KeyframePreview } from "./keyframe-preview"
export type { KeyframeTimelineProps } from "./keyframe-timeline"
export { KeyframeTimeline } from "./keyframe-timeline"
export type { MiniSelectProps } from "./mini-select"
export { MiniSelect } from "./mini-select"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface KeyframesEditorPanelProps {
  value: KeyframesString | (string & {})
  onChange: (value: KeyframesString) => void
  className?: string
  "aria-label"?: string
}

export interface KeyframesEditorProps extends KeyframesEditorPanelProps {}

// ---------------------------------------------------------------------------
// KeyframesEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function KeyframesEditor(props: KeyframesEditorProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS @keyframes body",
  } = props
  const { blocks, error } = parseKeyframes(String(value))
  const label =
    error !== null
      ? "invalid"
      : `${blocks.length} stop${blocks.length === 1 ? "" : "s"}`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span aria-hidden="true" className="text-foreground/60">
            ⏱
          </span>
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <span className="max-w-[220px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <KeyframesEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// KeyframesEditorPanel — inline
// ---------------------------------------------------------------------------

export function KeyframesEditorPanel({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "CSS @keyframes editor",
}: KeyframesEditorPanelProps) {
  const [blocks, setBlocks] = useState<KeyframeBlock[]>(() => {
    const parsed = parseKeyframes(String(value) || defaultKeyframes())
    return parsed.error === null ? parsed.blocks : []
  })
  const [selected, setSelected] = useState(0)
  const [position, setPosition] = useState(0)
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from an external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseKeyframes(String(value))
    if (parsed.error === null) {
      setBlocks(parsed.blocks)
      setSelected((s) => Math.min(s, Math.max(0, parsed.blocks.length - 1)))
    }
  }, [value])

  const commit = (next: KeyframeBlock[]) => {
    setBlocks(next)
    const str = formatKeyframes(next)
    lastEmittedRef.current = str
    onChange(str as KeyframesString)
  }

  const updateDeclaration = (declIndex: number, decl: Declaration) => {
    commit(
      blocks.map((b, i) =>
        i === selected
          ? {
              ...b,
              declarations: b.declarations.map((d, j) =>
                j === declIndex ? decl : d,
              ),
            }
          : b,
      ),
    )
  }

  const removeDeclaration = (declIndex: number) => {
    commit(
      blocks.map((b, i) =>
        i === selected
          ? {
              ...b,
              declarations: b.declarations.filter((_, j) => j !== declIndex),
            }
          : b,
      ),
    )
  }

  const addDeclaration = () => {
    commit(
      blocks.map((b, i) =>
        i === selected
          ? {
              ...b,
              declarations: [
                ...b.declarations,
                { property: "opacity", value: "1" },
              ],
            }
          : b,
      ),
    )
  }

  const addStop = () => {
    // Insert a stop at a free percent between the selected stop and the next.
    const used = new Set(
      blocks.map((b) => selectorToPercent(b.selectors[0] ?? "from")),
    )
    let pct = 50
    for (let p = 50; p <= 95; p += 5) {
      if (!used.has(p)) {
        pct = p
        break
      }
    }
    const fresh: KeyframeBlock = {
      selectors: [percentToSelector(pct)],
      declarations: [{ property: "opacity", value: "1" }],
    }
    commit([...blocks, fresh])
  }

  const removeStop = (index: number) => {
    const next = blocks.filter((_, i) => i !== index)
    commit(next)
    setSelected((s) => Math.min(s, Math.max(0, next.length - 1)))
  }

  const selectedBlock = blocks[selected]
  const produced = formatKeyframes(blocks)

  return (
    <fieldset
      className={cn(
        "m-0 w-[560px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <KeyframeTimeline
        blocks={blocks}
        selected={selected}
        position={position}
        onSelect={setSelected}
        onPosition={setPosition}
        onAddStop={addStop}
        onRemoveStop={removeStop}
      />

      <div data-testid="keyframe-declarations" className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground uppercase">
            {selectedBlock
              ? `stop ${selectorToPercent(selectedBlock.selectors[0] ?? "from")}% declarations`
              : "declarations"}
          </span>
          <button
            type="button"
            aria-label="Add declaration"
            onClick={addDeclaration}
            disabled={!selectedBlock}
            className="rounded border border-dashed px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            + declaration
          </button>
        </div>

        <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
          {selectedBlock?.declarations.map((decl, i) => (
            <DeclarationRow
              // biome-ignore lint/suspicious/noArrayIndexKey: declarations are a positional list edited in place; index is the stable identity.
              key={i}
              index={i}
              declaration={decl}
              onChange={(next) => updateDeclaration(i, next)}
              onRemove={() => removeDeclaration(i)}
            />
          ))}
        </div>
      </div>

      <LiveString value={produced} />

      <KeyframePreview
        blocks={blocks}
        position={position}
        onPosition={setPosition}
      />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// LiveString — the produced keyframes body in a `<code>` (internal helper,
// exported for parity with the sibling sub-components and demos).
// ---------------------------------------------------------------------------

export function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value || " "}
    </code>
  )
}
