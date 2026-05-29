import { LengthPctEditor } from "./length-pct"

/** An optional `at <x> <y>` position pair, addable/removable. */
export function PositionControls({
  atX,
  atY,
  onChange,
}: {
  atX?: string
  atY?: string
  onChange: (atX: string | undefined, atY: string | undefined) => void
}) {
  const has = atX !== undefined && atY !== undefined
  if (!has) {
    return (
      <button
        type="button"
        aria-label="Add position"
        onClick={() => onChange("50%", "50%")}
        className="h-8 rounded border border-dashed px-2 font-mono text-[10px] text-muted-foreground"
      >
        + at position
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-[10px] text-muted-foreground">at</span>
      <LengthPctEditor
        label="position x"
        value={atX ?? "50%"}
        onChange={(x) => onChange(x, atY)}
      />
      <LengthPctEditor
        label="position y"
        value={atY ?? "50%"}
        onChange={(y) => onChange(atX, y)}
      />
      <button
        type="button"
        aria-label="Remove position"
        onClick={() => onChange(undefined, undefined)}
        className="rounded p-0.5 text-[10px] text-muted-foreground hover:text-destructive"
      >
        ×
      </button>
    </span>
  )
}
