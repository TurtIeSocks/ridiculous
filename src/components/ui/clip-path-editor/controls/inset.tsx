import { Input } from "@/components/ui/input"
import type { ClipPathShapeState } from "../clip-path-editor.types"
import { LabeledField } from "../primitives/labeled-field"
import { LengthPctEditor } from "./length-pct"

export interface InsetControlsProps {
  state: Extract<ClipPathShapeState, { shape: "inset" }>
  onChange: (state: ClipPathShapeState) => void
}

export function InsetControls({ state, onChange }: InsetControlsProps) {
  const set = (patch: Partial<typeof state>) => onChange({ ...state, ...patch })
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <LabeledField label="top">
          <LengthPctEditor
            label="inset top"
            value={state.top}
            onChange={(top) => set({ top })}
          />
        </LabeledField>
        <LabeledField label="right">
          <LengthPctEditor
            label="inset right"
            value={state.right ?? ""}
            onChange={(right) =>
              set({ right: right === "" ? undefined : right })
            }
          />
        </LabeledField>
        <LabeledField label="bottom">
          <LengthPctEditor
            label="inset bottom"
            value={state.bottom ?? ""}
            onChange={(bottom) =>
              set({ bottom: bottom === "" ? undefined : bottom })
            }
          />
        </LabeledField>
        <LabeledField label="left">
          <LengthPctEditor
            label="inset left"
            value={state.left ?? ""}
            onChange={(left) => set({ left: left === "" ? undefined : left })}
          />
        </LabeledField>
      </div>
      <LabeledField label="round">
        {state.round === undefined ? (
          <button
            type="button"
            aria-label="Add round radius"
            onClick={() => set({ round: "8px" })}
            className="h-8 rounded border border-dashed px-2 font-mono text-[10px] text-muted-foreground"
          >
            + round
          </button>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Input
              aria-label="inset round radius"
              value={state.round}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => set({ round: e.target.value })}
              className="h-8 w-[140px] font-mono text-xs"
            />
            <button
              type="button"
              aria-label="Remove round radius"
              onClick={() => set({ round: undefined })}
              className="rounded p-0.5 text-[10px] text-muted-foreground hover:text-destructive"
            >
              ×
            </button>
          </span>
        )}
      </LabeledField>
    </div>
  )
}
