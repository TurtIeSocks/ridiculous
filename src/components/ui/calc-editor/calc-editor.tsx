"use client"

import type { CalcFn, CalcString, CalcStringMap } from "./calc-editor.types"

// ---------------------------------------------------------------------------
// Props (shared by popover + inline). Implementation lands in Task 4.
// ---------------------------------------------------------------------------

export interface CalcEditorPanelProps<
  TFn extends CalcFn | undefined = undefined,
> {
  value: CalcString | (string & {})
  onChange: (
    value: TFn extends CalcFn ? CalcStringMap[TFn] : CalcString,
  ) => void
  fn?: TFn
  referenceViewport?: number
  className?: string
  "aria-label"?: string
}

export interface CalcEditorProps<TFn extends CalcFn | undefined = undefined>
  extends CalcEditorPanelProps<TFn> {}

// Temporary typed shells so type-tests + index barrel resolve. Replaced with
// full implementations in Task 4.

export function CalcEditor<TFn extends CalcFn | undefined = undefined>(
  _props: CalcEditorProps<TFn>,
): React.ReactNode {
  return null
}

export function CalcEditorPanel<TFn extends CalcFn | undefined = undefined>(
  _props: CalcEditorPanelProps<TFn>,
): React.ReactNode {
  return null
}
