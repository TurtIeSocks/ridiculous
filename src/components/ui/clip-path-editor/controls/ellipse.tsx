import type { ClipPathShapeState } from "../clip-path-editor.types"
import { LabeledField } from "../primitives/labeled-field"
import { PositionControls } from "./position"
import { RadiusEditor } from "./radius"

export interface EllipseControlsProps {
  state: Extract<ClipPathShapeState, { shape: "ellipse" }>
  onChange: (state: ClipPathShapeState) => void
}

export function EllipseControls({ state, onChange }: EllipseControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LabeledField label="radius x">
        <RadiusEditor
          label="ellipse radius x"
          value={state.rx ?? "50%"}
          onChange={(rx) => onChange({ ...state, rx })}
        />
      </LabeledField>
      <LabeledField label="radius y">
        <RadiusEditor
          label="ellipse radius y"
          value={state.ry ?? "35%"}
          onChange={(ry) => onChange({ ...state, ry })}
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
