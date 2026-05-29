"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  CHANNEL_KEYWORDS,
  CYLINDRICAL_SPACES,
  defaultState,
  formatColorFunction,
  HUE_METHODS,
  MIX_COLOR_SPACES,
  parseColorFunction,
  RELATIVE_FNS,
} from "./color-function.helpers"
import type {
  ColorFunctionMode,
  ColorFunctionState,
  ColorFunctionStringMap,
  ColorMixState,
  LightDarkState,
  RelativeColorState,
} from "./color-function.types"

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const CYLINDRICAL_SET = new Set<string>(CYLINDRICAL_SPACES)
const MODES: readonly ColorFunctionMode[] = [
  "color-mix",
  "relative",
  "light-dark",
]

/** Parse a percentage like "30%" to a 0–100 number (fallback 50). */
function pctToNumber(pct: string | undefined): number {
  if (!pct) return 50
  const n = Number.parseFloat(pct)
  return Number.isFinite(n) ? n : 50
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ColorFunctionPanelProps<
  TMode extends ColorFunctionMode = "color-mix",
> {
  /**
   * Which family to edit. When omitted, the panel shows a family selector
   * and edits any of the three at runtime; the `onChange` string type then
   * defaults to the `color-mix` suggestion shape for typing purposes.
   */
  mode?: TMode
  value: ColorFunctionStringMap[TMode] | (string & {})
  onChange: (value: ColorFunctionStringMap[TMode]) => void
  className?: string
  "aria-label"?: string
}

export interface ColorFunctionProps<
  TMode extends ColorFunctionMode = "color-mix",
> extends ColorFunctionPanelProps<TMode> {}

// ---------------------------------------------------------------------------
// ColorFunction — popover-wrapped
// ---------------------------------------------------------------------------

export function ColorFunction<TMode extends ColorFunctionMode = "color-mix">(
  props: ColorFunctionProps<TMode>,
) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS color function",
  } = props

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span
            className="size-5 shrink-0 rounded border"
            style={{ background: String(value) }}
            aria-hidden="true"
          />
          <span className="max-w-[220px] truncate text-xs">
            {String(value)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <ColorFunctionPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// ColorFunctionPanel — inline
// ---------------------------------------------------------------------------

export function ColorFunctionPanel<
  TMode extends ColorFunctionMode = "color-mix",
>({
  value,
  onChange,
  mode,
  className,
  "aria-label": ariaLabel = "CSS color-function editor",
}: ColorFunctionPanelProps<TMode>) {
  // The runtime family: a fixed `mode` prop wins; otherwise the parsed kind
  // of the current value, falling back to color-mix.
  const parsedKind = parseColorFunction(String(value))?.kind
  const initialKind = mode ?? parsedKind ?? "color-mix"

  const [state, setState] = useState<ColorFunctionState>(
    () => parseColorFunction(String(value)) ?? defaultState(initialKind),
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseColorFunction(String(value))
    if (parsed !== null) setState(parsed)
  }, [value])

  const commit = (next: ColorFunctionState) => {
    setState(next)
    const str = formatColorFunction(next)
    lastEmittedRef.current = str
    onChange(str as ColorFunctionStringMap[TMode])
  }

  const switchFamily = (next: ColorFunctionMode) => {
    commit(defaultState(next))
  }

  return (
    <fieldset
      className={cn(
        "m-0 w-[420px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      {mode === undefined && (
        <FamilySelect kind={state.kind} onChange={switchFamily} />
      )}

      {state.kind === "color-mix" && (
        <ColorMixEditor state={state} onChange={commit} />
      )}
      {state.kind === "relative" && (
        <RelativeColorEditor state={state} onChange={commit} />
      )}
      {state.kind === "light-dark" && (
        <LightDarkEditor state={state} onChange={commit} />
      )}

      <LiveString value={formatColorFunction(state)} />
      <ColorFunctionPreview value={formatColorFunction(state)} />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// FamilySelect
// ---------------------------------------------------------------------------

interface FamilySelectProps {
  kind: ColorFunctionState["kind"]
  onChange: (next: ColorFunctionMode) => void
}

function FamilySelect({ kind, onChange }: FamilySelectProps) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Family</span>
      <select
        aria-label="Color-function family"
        value={kind}
        onChange={(e) => onChange(e.target.value as ColorFunctionMode)}
        className="h-8 rounded border bg-background px-2 font-mono text-xs"
      >
        {MODES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </label>
  )
}

// ---------------------------------------------------------------------------
// ColorMixEditor (public)
// ---------------------------------------------------------------------------

export interface ColorMixEditorProps {
  state: ColorMixState
  onChange: (state: ColorMixState) => void
  className?: string
}

export function ColorMixEditor({
  state,
  onChange,
  className,
}: ColorMixEditorProps) {
  const isCylindrical = CYLINDRICAL_SET.has(state.space)

  const setSpace = (space: string) => {
    const next: ColorMixState = { ...state, space }
    // Drop the hue method when the new space cannot carry one.
    if (!CYLINDRICAL_SET.has(space)) next.hue = undefined
    onChange(next)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">in</span>
          <select
            aria-label="Interpolation colorspace"
            value={state.space}
            onChange={(e) => setSpace(e.target.value)}
            className="h-8 rounded border bg-background px-2 font-mono text-xs"
          >
            {MIX_COLOR_SPACES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {isCylindrical && (
          <label className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">hue</span>
            <select
              aria-label="Hue interpolation method"
              value={state.hue ?? ""}
              onChange={(e) =>
                onChange({ ...state, hue: e.target.value || undefined })
              }
              className="h-8 rounded border bg-background px-2 font-mono text-xs"
            >
              <option value="">(default)</option>
              {HUE_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <MixColorRow
        label="First"
        color={state.colorA}
        pct={state.pctA}
        onColor={(colorA) => onChange({ ...state, colorA })}
        onPct={(pctA) => onChange({ ...state, pctA })}
      />
      <MixColorRow
        label="Second"
        color={state.colorB}
        pct={state.pctB}
        onColor={(colorB) => onChange({ ...state, colorB })}
        onPct={(pctB) => onChange({ ...state, pctB })}
      />

      <button
        type="button"
        onClick={() =>
          onChange({
            ...state,
            colorA: state.colorB,
            colorB: state.colorA,
            pctA: state.pctB,
            pctB: state.pctA,
          })
        }
        className="rounded border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
      >
        ⇄ swap colors
      </button>
    </div>
  )
}

interface MixColorRowProps {
  label: string
  color: string
  pct: string | undefined
  onColor: (color: string) => void
  onPct: (pct: string | undefined) => void
}

function MixColorRow({ label, color, pct, onColor, onPct }: MixColorRowProps) {
  const lower = label.toLowerCase()
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-[10px] text-muted-foreground uppercase">
        {label}
      </span>
      <ColorPicker
        native
        value={color}
        onChange={(c) => onColor(String(c))}
        aria-label={`${lower} color`}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={pctToNumber(pct)}
        onChange={(e) => onPct(`${e.target.value}%`)}
        aria-label={`${lower} color ratio`}
        className="flex-1 accent-foreground"
      />
      <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">
        {pct ?? "—"}
      </span>
      <button
        type="button"
        aria-label={`Toggle ${lower} ratio`}
        onClick={() => onPct(pct ? undefined : "50%")}
        className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {pct ? "×%" : "+%"}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RelativeColorEditor (public)
// ---------------------------------------------------------------------------

export interface RelativeColorEditorProps {
  state: RelativeColorState
  onChange: (state: RelativeColorState) => void
  className?: string
}

export function RelativeColorEditor({
  state,
  onChange,
  className,
}: RelativeColorEditorProps) {
  const keywords = CHANNEL_KEYWORDS[state.fn] ?? ["c1", "c2", "c3"]

  const setFn = (fn: string) => {
    // Reset channels to the new function's keyword defaults.
    const kw = CHANNEL_KEYWORDS[fn] ?? ["c1", "c2", "c3"]
    const next: RelativeColorState = {
      ...state,
      fn,
      c1: kw[0],
      c2: kw[1],
      c3: kw[2],
    }
    if (fn !== "color") next.space = undefined
    else if (next.space === undefined) next.space = "srgb"
    onChange(next)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">fn</span>
          <select
            aria-label="Relative function"
            value={state.fn}
            onChange={(e) => setFn(e.target.value)}
            className="h-8 rounded border bg-background px-2 font-mono text-xs"
          >
            {RELATIVE_FNS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <span className="text-xs text-muted-foreground">from</span>
        <ColorPicker
          native
          value={state.from}
          onChange={(c) => onChange({ ...state, from: String(c) })}
          aria-label="Source color"
        />

        {state.fn === "color" && (
          <input
            type="text"
            value={state.space ?? "srgb"}
            onChange={(e) => onChange({ ...state, space: e.target.value })}
            aria-label="Color space"
            className="h-8 w-24 rounded border bg-background px-2 font-mono text-xs"
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ChannelInput
          index={1}
          placeholder={keywords[0]}
          value={state.c1}
          onChange={(c1) => onChange({ ...state, c1 })}
        />
        <ChannelInput
          index={2}
          placeholder={keywords[1]}
          value={state.c2}
          onChange={(c2) => onChange({ ...state, c2 })}
        />
        <ChannelInput
          index={3}
          placeholder={keywords[2]}
          value={state.c3}
          onChange={(c3) => onChange({ ...state, c3 })}
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <span className="w-12 text-[10px] text-muted-foreground uppercase">
          Alpha
        </span>
        <input
          type="text"
          value={state.alpha ?? ""}
          placeholder="(none)"
          onChange={(e) =>
            onChange({ ...state, alpha: e.target.value || undefined })
          }
          aria-label="Alpha channel"
          className="h-8 flex-1 rounded border bg-background px-2 font-mono text-xs"
        />
      </label>
    </div>
  )
}

interface ChannelInputProps {
  index: number
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function ChannelInput({
  index,
  placeholder,
  value,
  onChange,
}: ChannelInputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground">channel {index}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Channel ${index} (${placeholder})`}
        className="h-8 rounded border bg-background px-2 font-mono text-xs"
      />
    </label>
  )
}

// ---------------------------------------------------------------------------
// LightDarkEditor (public)
// ---------------------------------------------------------------------------

export interface LightDarkEditorProps {
  state: LightDarkState
  onChange: (state: LightDarkState) => void
  className?: string
}

export function LightDarkEditor({
  state,
  onChange,
  className,
}: LightDarkEditorProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Light color</span>
        <ColorPicker
          native
          value={state.light}
          onChange={(c) => onChange({ ...state, light: String(c) })}
          aria-label="Light color"
        />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Dark color</span>
        <ColorPicker
          native
          value={state.dark}
          onChange={(c) => onChange({ ...state, dark: String(c) })}
          aria-label="Dark color"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LiveString
// ---------------------------------------------------------------------------

interface LiveStringProps {
  value: string
}

function LiveString({ value }: LiveStringProps) {
  return (
    <code className="block break-all rounded bg-muted px-2 py-1.5 font-mono text-[11px]">
      {value}
    </code>
  )
}

// ---------------------------------------------------------------------------
// ColorFunctionPreview (public)
// ---------------------------------------------------------------------------

export interface ColorFunctionPreviewProps {
  value: string
  className?: string
}

export function ColorFunctionPreview({
  value,
  className,
}: ColorFunctionPreviewProps) {
  const [scheme, setScheme] = useState<"light" | "dark">("light")
  const isLightDark = value.trimStart().startsWith("light-dark(")
  const headingId = useId()

  return (
    <section className={cn("space-y-2", className)} aria-labelledby={headingId}>
      <div className="flex items-center justify-between">
        <span id={headingId} className="text-[10px] text-muted-foreground">
          Preview
        </span>
        {isLightDark && (
          <button
            type="button"
            aria-label="Toggle color scheme"
            onClick={() => setScheme((s) => (s === "light" ? "dark" : "light"))}
            className="rounded border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            scheme: {scheme}
          </button>
        )}
      </div>
      <div
        data-testid="cf-preview-scheme"
        style={{ colorScheme: scheme }}
        className="rounded border p-2"
      >
        <div
          data-testid="cf-preview"
          style={{ background: value }}
          className="h-16 w-full rounded"
        />
      </div>
    </section>
  )
}
