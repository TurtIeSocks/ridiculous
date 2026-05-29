import type React from "react"

interface BezierInputsValue {
  x1: number
  y1: number
  x2: number
  y2: number
  extraTop: number
  extraBottom: number
}

interface BezierInputsProps {
  value: BezierInputsValue
  onChange: (v: BezierInputsValue) => void
}

export function BezierInputs({ value, onChange }: BezierInputsProps) {
  const set =
    (k: keyof BezierInputsValue) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value)
      if (!Number.isFinite(n)) return
      onChange({ ...value, [k]: n })
    }
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <Field
        label="X1"
        value={value.x1}
        min={0}
        max={1}
        step={0.01}
        onChange={set("x1")}
      />
      <Field label="Y1" value={value.y1} step={0.01} onChange={set("y1")} />
      <Field
        label="X2"
        value={value.x2}
        min={0}
        max={1}
        step={0.01}
        onChange={set("x2")}
      />
      <Field label="Y2" value={value.y2} step={0.01} onChange={set("y2")} />
      <Field
        label="Extra Top"
        value={value.extraTop}
        min={0}
        step={0.05}
        onChange={set("extraTop")}
      />
      <Field
        label="Extra Bottom"
        value={value.extraBottom}
        min={0}
        step={0.05}
        onChange={set("extraBottom")}
      />
    </div>
  )
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        className="rounded bg-muted px-2 py-1 text-foreground"
      />
    </label>
  )
}
