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
  defaultState,
  formatColorFunction,
  parseColorFunction,
} from "./color-function.helpers"
import type {
  ColorFunctionMode,
  ColorFunctionState,
  ColorFunctionStringMap,
} from "./color-function.types"
import { ColorFunctionPreview } from "./color-function-preview"
import { ColorMixEditor } from "./color-mix-editor"
import { FamilySelect } from "./family-select"
import { LightDarkEditor } from "./light-dark-editor"
import { LiveString } from "./live-string"
import { RelativeColorEditor } from "./relative-color-editor"

export type { ColorFunctionPreviewProps } from "./color-function-preview"
// Re-export the public sub-components so consumers (and tests) can import them
// either from this entry or from the package index — the split is invisible.
export { ColorFunctionPreview } from "./color-function-preview"
export type { ColorMixEditorProps } from "./color-mix-editor"
export { ColorMixEditor } from "./color-mix-editor"
export type { LightDarkEditorProps } from "./light-dark-editor"
export { LightDarkEditor } from "./light-dark-editor"
export type { RelativeColorEditorProps } from "./relative-color-editor"
export { RelativeColorEditor } from "./relative-color-editor"

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
