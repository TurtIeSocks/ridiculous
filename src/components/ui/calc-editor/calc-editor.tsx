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
import { computeCalc, evaluateCalc, parseCalc } from "./calc-editor.helpers"
import type {
  CalcFn,
  CalcString,
  CalcStringMap,
  Dimension,
} from "./calc-editor.types"

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export interface CalcEditorPanelProps<
  TFn extends CalcFn | undefined = undefined,
> {
  value: CalcString | (string & {})
  onChange: (
    value: TFn extends CalcFn ? CalcStringMap[TFn] : CalcString,
  ) => void
  /** Lock the outer function; narrows `onChange` to that flavor. */
  fn?: TFn
  /** Viewport width (px) used for the computed-value readout. Default 1280. */
  referenceViewport?: number
  className?: string
  "aria-label"?: string
}

export interface CalcEditorProps<TFn extends CalcFn | undefined = undefined>
  extends CalcEditorPanelProps<TFn> {}

const ALL_FNS: readonly CalcFn[] = ["calc", "clamp", "min", "max"] as const

// Seed expression text when switching to / starting on a function.
function seedFor(fn: CalcFn, inner: string): string {
  const body = inner.trim() || "1rem"
  switch (fn) {
    case "calc":
      return `calc(${body})`
    case "clamp":
      return `clamp(1rem, ${body}, 3rem)`
    case "min":
      return `min(${body}, 2rem)`
    case "max":
      return `max(${body}, 2rem)`
  }
}

// Pull the "inner" of a calc()/single-arg expression for re-wrapping.
function innerOf(expr: string): string {
  const node = parseCalc(expr)
  if (node && node.kind === "fn" && node.name === "calc") {
    // re-serialize the single calc arg roughly by stripping the wrapper
    const m = expr.trim().match(/^calc\((.*)\)$/s)
    if (m) return m[1].trim()
  }
  return expr.trim()
}

// ---------------------------------------------------------------------------
// CalcEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function CalcEditor<TFn extends CalcFn | undefined = undefined>(
  props: CalcEditorProps<TFn>,
) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS math expression",
  } = props
  const { dimension } = evaluateCalc(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span aria-hidden="true" className="text-foreground/60 italic">
            fx
          </span>
          <span className="max-w-[180px] truncate text-xs">{value}</span>
          <DimensionBadge dimension={dimension} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalcEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// CalcEditorPanel — inline
// ---------------------------------------------------------------------------

export function CalcEditorPanel<TFn extends CalcFn | undefined = undefined>({
  value,
  onChange,
  fn: fnProp,
  referenceViewport = 1280,
  className,
  "aria-label": ariaLabel = "CSS math value editor",
}: CalcEditorPanelProps<TFn>) {
  const initialFn = detectFn(value) ?? fnProp ?? "calc"
  const [activeFn, setActiveFn] = useState<CalcFn>(initialFn)
  const [expr, setExpr] = useState<string>(value)
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    setExpr(value)
    const detected = detectFn(value)
    if (detected) setActiveFn(detected)
  }, [value])

  const result = evaluateCalc(expr)
  const valid = result.error === null && result.dimension !== null

  const commit = (next: string) => {
    setExpr(next)
    const r = evaluateCalc(next)
    if (r.error === null && r.dimension !== null) {
      lastEmittedRef.current = next
      onChange(next as never)
    }
  }

  const switchFn = (next: CalcFn) => {
    setActiveFn(next)
    commit(seedFor(next, innerOf(expr)))
  }

  const insert = (token: string) => {
    commit(expr + token)
  }

  const available: readonly CalcFn[] = fnProp ? [fnProp] : ALL_FNS

  return (
    <fieldset
      className={cn(
        "w-[460px] space-y-3 border-0 bg-background p-3 m-0",
        className,
      )}
      aria-label={ariaLabel}
    >
      <FunctionTabs
        value={activeFn}
        onChange={switchFn}
        available={available}
      />
      <ExpressionField
        value={expr}
        onChange={commit}
        dimension={valid ? result.dimension : null}
        error={result.error}
      />
      <TokenPalette onInsert={insert} />
      <ResultReadout
        expr={expr}
        dimension={result.dimension}
        error={result.error}
        referenceViewport={referenceViewport}
      />
      <FluidTypePlayground expression={expr} />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// FunctionTabs (internal)
// ---------------------------------------------------------------------------

interface FunctionTabsProps {
  value: CalcFn
  onChange: (fn: CalcFn) => void
  available?: readonly CalcFn[]
}

function FunctionTabs({
  value,
  onChange,
  available = ALL_FNS,
}: FunctionTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Math function"
      className="flex gap-1 border-b text-xs"
    >
      {available.map((fn) => (
        <button
          key={fn}
          type="button"
          role="tab"
          aria-selected={value === fn}
          onClick={() => onChange(fn)}
          className={cn(
            "px-3 py-1.5 font-mono transition-colors",
            value === fn
              ? "border-primary border-b-2 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {fn}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExpressionField (public)
// ---------------------------------------------------------------------------

export interface ExpressionFieldProps {
  value: string
  onChange: (value: string) => void
  dimension?: Dimension | null
  error?: string | null
  className?: string
}

export function ExpressionField({
  value,
  onChange,
  dimension,
  error,
  className,
}: ExpressionFieldProps) {
  const id = useId()
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={id} className="sr-only">
        Expression
      </label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 pr-24 font-mono text-sm",
            error ? "border-destructive focus-visible:ring-destructive" : "",
          )}
          aria-invalid={error ? true : undefined}
        />
        <div className="-translate-y-1/2 absolute top-1/2 right-2">
          <DimensionBadge dimension={dimension ?? null} />
        </div>
      </div>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function DimensionBadge({ dimension }: { dimension: Dimension | null }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 font-mono text-[10px]",
        dimension
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {dimension ?? "—"}
    </span>
  )
}

// ---------------------------------------------------------------------------
// TokenPalette (public)
// ---------------------------------------------------------------------------

export interface TokenPaletteProps {
  onInsert: (token: string) => void
  className?: string
}

const OPERATOR_TOKENS: ReadonlyArray<{ label: string; insert: string }> = [
  { label: "+", insert: " + " },
  { label: "-", insert: " - " },
  { label: "*", insert: " * " },
  { label: "/", insert: " / " },
]
const UNIT_TOKENS: readonly string[] = ["px", "rem", "em", "%", "vw", "vh"]
const FN_TOKENS: ReadonlyArray<{ label: string; insert: string }> = [
  { label: "clamp()", insert: "clamp(, , )" },
  { label: "min()", insert: "min(, )" },
  { label: "max()", insert: "max(, )" },
  { label: "var()", insert: "var(--)" },
  { label: "( )", insert: "()" },
]

export function TokenPalette({ onInsert, className }: TokenPaletteProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap gap-1">
        {OPERATOR_TOKENS.map((t) => (
          <PaletteButton
            key={t.label}
            label={t.label}
            onClick={() => onInsert(t.insert)}
          />
        ))}
        <span className="mx-1 w-px self-stretch bg-border" aria-hidden="true" />
        {UNIT_TOKENS.map((u) => (
          <PaletteButton key={u} label={u} onClick={() => onInsert(u)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {FN_TOKENS.map((t) => (
          <PaletteButton
            key={t.label}
            label={t.label}
            onClick={() => onInsert(t.insert)}
          />
        ))}
      </div>
    </div>
  )
}

function PaletteButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border bg-muted px-2 py-1 font-mono text-xs hover:bg-accent"
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// ResultReadout (internal)
// ---------------------------------------------------------------------------

interface ResultReadoutProps {
  expr: string
  dimension: Dimension | null
  error: string | null
  referenceViewport: number
}

function ResultReadout({
  expr,
  dimension,
  error,
  referenceViewport,
}: ResultReadoutProps) {
  if (error) return null
  const node = parseCalc(expr)
  const computed =
    node && dimension === "length"
      ? computeCalc(node, { viewport: referenceViewport })
      : null
  return (
    <div className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-muted-foreground text-xs">
      <span>
        resolves to <span className="text-foreground">{dimension ?? "—"}</span>
      </span>
      {computed !== null ? (
        <span className="font-mono">
          ≈ {round(computed)}px @ {referenceViewport}px
        </span>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FluidTypePlayground (public) — the showcase
// ---------------------------------------------------------------------------

export interface FluidTypePlaygroundProps {
  expression: string
  minViewport?: number
  maxViewport?: number
  className?: string
}

export function FluidTypePlayground({
  expression,
  minViewport = 320,
  maxViewport = 1920,
  className,
}: FluidTypePlaygroundProps) {
  const id = useId()
  const [vw, setVw] = useState<number>(
    Math.round((minViewport + maxViewport) / 2),
  )
  const node = parseCalc(expression)
  const computed = node ? computeCalc(node, { viewport: vw, basis: vw }) : null

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">
          Fluid-type playground
        </span>
        <span className="font-mono">
          {computed !== null ? `${round(computed)}px` : "—"}
        </span>
      </div>
      <label htmlFor={id} className="flex flex-col gap-1 text-xs">
        <span className="flex justify-between text-muted-foreground">
          <span>viewport width</span>
          <span className="font-mono">{vw}px</span>
        </span>
        <input
          id={id}
          type="range"
          aria-label="Viewport width"
          min={minViewport}
          max={maxViewport}
          step={1}
          value={vw}
          onChange={(e) => setVw(Number(e.target.value))}
        />
      </label>
      {/* live visual: a bar whose size tracks the computed length */}
      {computed !== null ? (
        <div className="flex h-6 items-center">
          <div
            className="h-2 rounded bg-primary transition-[width] duration-75"
            style={{ width: `${Math.min(Math.max(computed, 0), 320)}px` }}
            aria-hidden="true"
          />
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function detectFn(value: string): CalcFn | null {
  const v = value.trim()
  if (v.startsWith("calc(")) return "calc"
  if (v.startsWith("clamp(")) return "clamp"
  if (v.startsWith("min(")) return "min"
  if (v.startsWith("max(")) return "max"
  return null
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
