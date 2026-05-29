"use client"

import type { ClipPathString } from "./clip-path-editor.types"

// NOTE: Task-1 placeholder so the type-tests' `ClipPathEditor` import
// resolves. Replaced by the full implementation in Task 4.

export interface ClipPathEditorPanelProps {
  value: ClipPathString | (string & {})
  onChange: (value: ClipPathString) => void
  mode?: "clip-path" | "shape-outside"
  className?: string
  "aria-label"?: string
}

export interface ClipPathEditorProps extends ClipPathEditorPanelProps {}

export function ClipPathEditor(_props: ClipPathEditorProps) {
  return null
}

export function ClipPathEditorPanel(_props: ClipPathEditorPanelProps) {
  return null
}
