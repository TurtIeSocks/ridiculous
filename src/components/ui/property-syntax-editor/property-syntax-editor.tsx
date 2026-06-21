"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CssOutput } from "@/components/ui/css-output"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { InitialValueField } from "./initial-value-field"
import {
  defaultInitialValue,
  formatSyntax,
  parseSyntax,
} from "./property-syntax-editor.helpers"
import type {
  PropertySyntaxState,
  SyntaxString,
} from "./property-syntax-editor.types"
import { SyntaxChipBuilder } from "./syntax-chip-builder"

// Re-export the public sub-components + their prop types so consumers (and the
// barrel) can import them from `./property-syntax-editor`.
export type { InitialValueFieldProps } from "./initial-value-field"
export { InitialValueField } from "./initial-value-field"
export type { MiniSelectProps } from "./mini-select"
export { MiniSelect } from "./mini-select"
export type { SyntaxChipBuilderProps } from "./syntax-chip-builder"
export { SyntaxChipBuilder } from "./syntax-chip-builder"

// ---------------------------------------------------------------------------
// value string ⇄ editor state
// ---------------------------------------------------------------------------

function deriveState(
  value: string,
  prev?: PropertySyntaxState,
): PropertySyntaxState {
  const { universal, components } = parseSyntax(value)
  return {
    universal,
    components,
    initialValue: prev?.initialValue ?? defaultInitialValue(value),
    inherits: prev?.inherits ?? false,
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PropertySyntaxEditorPanelProps {
  value: SyntaxString | (string & {})
  onChange: (value: SyntaxString) => void
  className?: string
  "aria-label"?: string
}

export interface PropertySyntaxEditorProps
  extends PropertySyntaxEditorPanelProps {}

// ---------------------------------------------------------------------------
// PropertySyntaxEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function PropertySyntaxEditor(props: PropertySyntaxEditorProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS @property syntax descriptor",
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
            syntax
          </span>
          <span className="max-w-[220px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <PropertySyntaxEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// PropertySyntaxEditorPanel — inline
// ---------------------------------------------------------------------------

export function PropertySyntaxEditorPanel({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "CSS @property syntax editor",
}: PropertySyntaxEditorPanelProps) {
  const [state, setState] = useState<PropertySyntaxState>(() =>
    deriveState(String(value)),
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from an external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    setState((prev) => deriveState(String(value), prev))
  }, [value])

  const commit = (next: PropertySyntaxState) => {
    setState(next)
    const str = formatSyntax(next.universal, next.components)
    lastEmittedRef.current = str
    onChange(str as SyntaxString)
  }

  const liveString = formatSyntax(state.universal, state.components)

  return (
    <fieldset
      className={cn(
        "m-0 w-[460px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <SyntaxChipBuilder
        universal={state.universal}
        components={state.components}
        onChange={({ universal, components }) =>
          commit({ ...state, universal, components })
        }
      />

      <CssOutput value={liveString} property={null} />

      <div className="border-input border-t pt-3">
        <p className="mb-2 font-mono text-[10px] text-muted-foreground uppercase">
          initial-value (live check)
        </p>
        <InitialValueField
          syntax={liveString}
          value={state.initialValue}
          inherits={state.inherits}
          onValueChange={(initialValue) => setState({ ...state, initialValue })}
          onInheritsChange={(inherits) => setState({ ...state, inherits })}
        />
      </div>
    </fieldset>
  )
}
