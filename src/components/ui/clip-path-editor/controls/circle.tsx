import type { ClipPathShapeState } from "../clip-path-editor.types"
import { LabeledField } from "../primitives/labeled-field"
import { PositionControls } from "./position"
import { RadiusEditor } from "./radius"

export interface CircleControlsProps {
  state: Extract<ClipPathShapeState, { shape: "circle" }>
  onChange: (state: ClipPathShapeState) => void
}

export function CircleControls({ state, onChange }: CircleControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LabeledField label="radius">
        <RadiusEditor
          label="circle radius"
          value={state.radius ?? "50%"}
          onChange={(radius) => onChange({ ...state, radius })}
        />
      </LabeledField>
      <LabeledField label="position">
        <PositionControls
          atX={state.atX}
          atY={state.atY}
          onChange={(atX, atY) => onChange({ ...state, atX, atY })}
        />
      </LabeledField>
    </div>
  )
}
