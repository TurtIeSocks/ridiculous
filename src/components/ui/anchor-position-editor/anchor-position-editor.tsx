"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { AnchorExprFields } from "./anchor-expr-fields"
import {
  formatAnchor,
  formatPositionArea,
  formatPositionTry,
  keywordsToCell,
  parseAnchor,
  parsePositionArea,
  parsePositionTry,
} from "./anchor-position-editor.helpers"
import type {
  AnchorExpr,
  AnchorPositionMode,
  AnchorPositionString,
  PositionAreaState,
  TryFallback,
} from "./anchor-position-editor.types"
import { AnchorPreview } from "./anchor-preview"
import { PositionAreaGrid, stateToKeywords } from "./position-area-grid"
import { TryFallbackChain } from "./try-fallback-chain"

// Re-export the public sub-components + their prop types so consumers (and the
// barrel) can import them from `./anchor-position-editor`.
export type { AnchorExprFieldsProps } from "./anchor-expr-fields"
export { AnchorExprFields } from "./anchor-expr-fields"
export type { AnchorPreviewProps } from "./anchor-preview"
export { AnchorPreview } from "./anchor-preview"
export type { MiniSelectProps } from "./mini-select"
export { MiniSelect } from "./mini-select"
export type { PositionAreaGridProps } from "./position-area-grid"
export { PositionAreaGrid } from "./position-area-grid"
export type { TryFallbackChainProps } from "./try-fallback-chain"
export { TryFallbackChain } from "./try-fallback-chain"

// ---------------------------------------------------------------------------
// position-area state derivation (value string ⇄ grid state)
// ---------------------------------------------------------------------------

function deriveAreaState(value: string): PositionAreaState {
  const { keywords } = parsePositionArea(value)
  const system: PositionAreaState["system"] = keywords.some(
    (k) => k.includes("block") || k.includes("inline"),
  )
    ? "logical"
    : "physical"
  const span =
    keywords.length > 0 &&
    keywords.every((k) => k.startsWith("span-")) &&
    !keywords.includes("span-all")
  // Strip span / logical down to the bare physical keyword for the cell lookup.
  const bare = keywords.map((k) => {
    let s = k.startsWith("span-") ? k.slice("span-".length) : k
    s = s
      .replace("block-start", "top")
      .replace("block-end", "bottom")
      .replace("inline-start", "left")
      .replace("inline-end", "right")
    return s
  })
  const cell = keywordsToCell(bare) ?? { row: 1, col: 1 }
  return { system, span, row: cell.row, col: cell.col }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AnchorPositionEditorPanelProps {
  value: AnchorPositionString | (string & {})
  onChange: (value: AnchorPositionString) => void
  /** `"position-area"` (default), `"anchor"`, or `"position-try"`. */
  mode?: AnchorPositionMode
  className?: string
  "aria-label"?: string
}

export interface AnchorPositionEditorProps
  extends AnchorPositionEditorPanelProps {}

// ---------------------------------------------------------------------------
// AnchorPositionEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function AnchorPositionEditor(props: AnchorPositionEditorProps) {
  const {
    value,
    mode = "position-area",
    className,
    "aria-label": ariaLabel = "Edit a CSS anchor-positioning value",
  } = props

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span className="text-[10px] text-muted-foreground uppercase">
            {mode}
          </span>
          <span className="max-w-[220px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <AnchorPositionEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// AnchorPositionEditorPanel — inline
// ---------------------------------------------------------------------------

export function AnchorPositionEditorPanel({
  value,
  onChange,
  mode = "position-area",
  className,
  "aria-label": ariaLabel = "CSS anchor-positioning editor",
}: AnchorPositionEditorPanelProps) {
  const lastEmittedRef = useRef<string | null>(null)

  // Per-mode editor state, seeded from the incoming value.
  const [areaState, setAreaState] = useState<PositionAreaState>(() =>
    deriveAreaState(String(value)),
  )
  const [anchorExpr, setAnchorExpr] = useState<AnchorExpr>(
    () =>
      parseAnchor(String(value)) ?? {
        fn: "anchor",
        name: "--anchor",
        side: "bottom",
      },
  )
  const [tryChain, setTryChain] = useState<TryFallback[]>(() =>
    parsePositionTry(String(value)),
  )

  // Resync from an external value or a mode change (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const v = String(value)
    if (mode === "position-area") setAreaState(deriveAreaState(v))
    else if (mode === "anchor") {
      const parsed = parseAnchor(v)
      if (parsed) setAnchorExpr(parsed)
    } else setTryChain(parsePositionTry(v))
  }, [value, mode])

  const commit = (str: string) => {
    lastEmittedRef.current = str
    onChange(str as AnchorPositionString)
  }

  const commitArea = (next: PositionAreaState) => {
    setAreaState(next)
    commit(formatPositionArea(stateToKeywords(next)))
  }
  const commitAnchor = (next: AnchorExpr) => {
    setAnchorExpr(next)
    commit(formatAnchor(next))
  }
  const commitTry = (next: TryFallback[]) => {
    setTryChain(next)
    commit(formatPositionTry(next))
  }

  return (
    <fieldset
      className={cn(
        "m-0 w-[420px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      {mode === "position-area" && (
        <>
          <PositionAreaGrid
            system={areaState.system}
            span={areaState.span}
            row={areaState.row}
            col={areaState.col}
            onChange={commitArea}
          />
          <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
            {formatPositionArea(stateToKeywords(areaState)) || " "}
          </code>
        </>
      )}

      {mode === "anchor" && (
        <>
          <AnchorExprFields expr={anchorExpr} onChange={commitAnchor} />
          <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
            {formatAnchor(anchorExpr) || " "}
          </code>
          <AnchorPreview value="center" />
        </>
      )}

      {mode === "position-try" && (
        <TryFallbackChain fallbacks={tryChain} onChange={commitTry} />
      )}
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// LiveString — the produced value in a `<code>` (internal helper, exported
// for parity with the sibling sub-components and demos).
// ---------------------------------------------------------------------------

export function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value || " "}
    </code>
  )
}
