import { useListIds } from "../clip-path-editor.hooks"
import type { ClipPathShapeState } from "../clip-path-editor.types"
import { LengthPctEditor } from "./length-pct"

export interface PolygonControlsProps {
  state: Extract<ClipPathShapeState, { shape: "polygon" }>
  onChange: (state: ClipPathShapeState) => void
}

export function PolygonControls({ state, onChange }: PolygonControlsProps) {
  const { vertices } = state
  const { ids, removeIdAt } = useListIds(vertices.length)
  const setVertices = (next: Array<{ x: string; y: string }>) =>
    onChange({ ...state, vertices: next })

  const updateVertex = (index: number, x: string, y: string) => {
    setVertices(vertices.map((v, i) => (i === index ? { x, y } : v)))
  }
  const addVertex = () => {
    setVertices([...vertices, { x: "50%", y: "50%" }])
  }
  const removeVertex = (index: number) => {
    if (vertices.length <= 3) return
    // Drop the matching id first so survivors keep their stable keys.
    removeIdAt(index)
    setVertices(vertices.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          fill-rule
        </span>
        <select
          aria-label="Fill rule"
          value={state.fillRule ?? ""}
          onChange={(e) =>
            onChange({
              ...state,
              fillRule:
                e.target.value === ""
                  ? undefined
                  : (e.target.value as "nonzero" | "evenodd"),
            })
          }
          className="h-8 rounded border bg-background px-1.5 font-mono text-xs"
        >
          <option value="">(default)</option>
          <option value="nonzero">nonzero</option>
          <option value="evenodd">evenodd</option>
        </select>
      </div>
      <div className="max-h-[180px] space-y-1.5 overflow-y-auto pr-1">
        {vertices.map((v, i) => (
          <div key={ids[i]} className="flex items-center gap-1.5">
            <span className="w-6 font-mono text-[10px] text-muted-foreground">
              {i + 1}
            </span>
            <LengthPctEditor
              label={`vertex ${i + 1} x`}
              value={v.x}
              onChange={(x) => updateVertex(i, x, v.y)}
            />
            <LengthPctEditor
              label={`vertex ${i + 1} y`}
              value={v.y}
              onChange={(y) => updateVertex(i, v.x, y)}
            />
            <button
              type="button"
              aria-label={`Remove vertex ${i + 1}`}
              disabled={vertices.length <= 3}
              onClick={() => removeVertex(i)}
              className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Add vertex"
        onClick={addVertex}
        className="h-8 w-full rounded border border-dashed font-mono text-[10px] text-muted-foreground"
      >
        + add vertex
      </button>
    </div>
  )
}
