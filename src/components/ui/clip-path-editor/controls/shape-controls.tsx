import type { ClipPathShapeState } from "../clip-path-editor.types"
import { CircleControls } from "./circle"
import { EllipseControls } from "./ellipse"
import { InsetControls } from "./inset"
import { PolygonControls } from "./polygon"

interface ShapeControlsProps {
  shape: ClipPathShapeState
  onChange: (shape: ClipPathShapeState) => void
}

/** Dispatch to the right per-shape control set. */
export function ShapeControls({ shape, onChange }: ShapeControlsProps) {
  switch (shape.shape) {
    case "inset":
      return <InsetControls state={shape} onChange={onChange} />
    case "circle":
      return <CircleControls state={shape} onChange={onChange} />
    case "ellipse":
      return <EllipseControls state={shape} onChange={onChange} />
    case "polygon":
      return <PolygonControls state={shape} onChange={onChange} />
  }
}
