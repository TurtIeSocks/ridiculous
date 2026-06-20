"use client"

import { ColorPicker } from "@/components/ui/color-picker"
import { EasingPicker } from "@/components/ui/easing-picker"
import { FilterBuilder } from "@/components/ui/filter-builder"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { Input } from "@/components/ui/input"
import { TransformBuilder } from "@/components/ui/transform-builder"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import { propertyEditorKind } from "./keyframes-editor.helpers"
import type { Declaration } from "./keyframes-editor.types"
import { MiniSelect } from "./mini-select"

// ---------------------------------------------------------------------------
// DeclarationRow (public) — one `<property> : <value>` row inside a keyframe
// stop. The property `<select>` chooses the CSS property; the VALUE editor is
// dispatched by `propertyEditorKind` — the runtime mirror of the type's
// `DispatchValue` table — into the matching sibling editor:
//   transform → TransformBuilder · filter → FilterBuilder · color → ColorPicker
//   background → GradientEditor · easing → EasingPicker · length → UnitInput
//   opacity → a 0–1 UnitInput-style number input · plain → a bare <input>.
//
// This is the composition spectacle (spec §4.1): real typed editors per
// declaration. The container owns the `Declaration`; this is presentational.
// Add/remove are driven from the container via the parent's callbacks.
// ---------------------------------------------------------------------------

/** The property menu — common animatable properties, grouped by editor kind. */
const PROPERTY_OPTIONS: readonly string[] = [
  "transform",
  "opacity",
  "filter",
  "backdrop-filter",
  "color",
  "background-color",
  "border-color",
  "fill",
  "stroke",
  "background",
  "background-image",
  "animation-timing-function",
  "transition-timing-function",
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "margin",
  "padding",
  "border-radius",
  "font-size",
  "line-height",
  "visibility",
]

/** `background`/`background-image` route to the gradient editor (spec §3.2, A4). */
function isGradientProp(property: string): boolean {
  return property === "background" || property === "background-image"
}

/** Split a `<length-percentage>` into its unit so UnitInput can edit it. */
function unitOf(value: string): string {
  const m = value.match(/[a-z%]+$/i)
  return m ? m[0] : "px"
}

export interface DeclarationRowProps {
  index: number
  declaration: Declaration
  onChange: (next: Declaration) => void
  onRemove: () => void
  className?: string
}

export function DeclarationRow({
  index,
  declaration,
  onChange,
  onRemove,
  className,
}: DeclarationRowProps) {
  const n = index + 1
  const { property, value } = declaration
  const kind = propertyEditorKind(property)
  const setValue = (next: string) => onChange({ property, value: next })

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <MiniSelect
        aria-label={`declaration ${n} property`}
        value={property}
        onValueChange={(p) => onChange({ property: p, value })}
        className="w-[150px]"
      >
        {PROPERTY_OPTIONS.includes(property) ? null : (
          <option value={property}>{property}</option>
        )}
        {PROPERTY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </MiniSelect>

      <span aria-hidden="true" className="text-muted-foreground text-xs">
        :
      </span>

      <ValueEditor
        index={index}
        property={property}
        kind={kind}
        value={value}
        onChange={setValue}
      />

      <button
        type="button"
        aria-label={`Remove declaration ${n}`}
        onClick={onRemove}
        className="ml-auto rounded p-1 text-muted-foreground hover:text-destructive"
      >
        ×
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ValueEditor — the dispatched value control. Pure routing over the kind.
// ---------------------------------------------------------------------------

interface ValueEditorProps {
  index: number
  property: string
  kind: ReturnType<typeof propertyEditorKind>
  value: string
  onChange: (next: string) => void
}

function ValueEditor({
  index,
  property,
  kind,
  value,
  onChange,
}: ValueEditorProps) {
  const n = index + 1

  // `background`/`background-image` are `plain` per the dispatch table, but the
  // UI still embeds the gradient editor for them (spec §3.2, A4).
  if (isGradientProp(property)) {
    return <GradientEditor value={value} onChange={onChange} />
  }

  switch (kind) {
    case "transform":
      return <TransformBuilder value={value} onChange={onChange} />
    case "filter":
      return <FilterBuilder value={value} onChange={onChange} />
    case "color":
      return <ColorPicker value={value} onChange={onChange} />
    case "easing":
      return <EasingPicker value={value} onChange={onChange} />
    case "opacity":
      return (
        <UnitInput
          aria-label={`declaration ${n} value`}
          unit=""
          value={value}
          onChange={onChange}
          min={0}
          max={1}
          step={0.05}
          precision={2}
          className="w-[110px]"
        />
      )
    case "length":
      return (
        <UnitInput
          aria-label={`declaration ${n} value`}
          unit={unitOf(value)}
          value={value}
          onChange={onChange}
          className="w-[110px]"
        />
      )
    default:
      return (
        <Input
          aria-label={`declaration ${n} value`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-[160px] font-mono text-xs"
        />
      )
  }
}
