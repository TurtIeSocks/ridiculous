"use client"

import { Input } from "@/components/ui/input"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import { MiniSelect } from "./mini-select"
import {
  enumOptionsFor,
  featureKind,
  featuresFor,
  reshape,
  unitOf,
} from "./query-builder.helpers"
import type {
  FeatureOperator,
  FeatureTest,
  QueryMode,
} from "./query-builder.types"

const OPERATORS: readonly FeatureOperator[] = ["<", "<=", ">", ">=", "="]

// ---------------------------------------------------------------------------
// FeatureTestRow (public)
// ---------------------------------------------------------------------------

export interface FeatureTestRowProps {
  mode: QueryMode
  test: FeatureTest
  onChange: (test: FeatureTest) => void
  onRemove: () => void
  /** Positional index — used only for stable control labels. */
  index?: number
  className?: string
}

export function FeatureTestRow({
  mode,
  test,
  onChange,
  onRemove,
  index,
  className,
}: FeatureTestRowProps) {
  const n = index === undefined ? "" : ` ${index + 1}`
  const features = featuresFor(mode)
  const kind = featureKind(test.feature, mode)
  const enums = enumOptionsFor(test.feature)
  const shape = test.kind

  const setFeature = (feature: string) => {
    // when the new feature is an enum, snap a plain value into a valid keyword
    const opts = enumOptionsFor(feature)
    if (opts && "value" in test && !opts.includes(test.value)) {
      onChange({ kind: "plain", feature, value: opts[0] })
      return
    }
    onChange({ ...test, feature })
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <span className="font-mono text-muted-foreground text-xs">(</span>
      <MiniSelect
        aria-label={`feature${n}`}
        value={features.includes(test.feature) ? test.feature : ""}
        onValueChange={setFeature}
      >
        {!features.includes(test.feature) && (
          <option value="">{test.feature || "(feature)"}</option>
        )}
        {features.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </MiniSelect>

      <ShapeSelect
        label={`shape${n}`}
        value={shape}
        onChange={(s) => onChange(reshape(test, s, mode))}
      />

      {test.kind === "plain" && (
        <>
          <span className="font-mono text-muted-foreground text-xs">:</span>
          <ValueField
            label={`value${n}`}
            kind={kind}
            value={test.value}
            onChange={(value) => onChange({ ...test, value })}
            enums={enums}
          />
        </>
      )}

      {test.kind === "range2" && (
        <>
          <OperatorSelect
            label={`operator${n}`}
            value={test.op}
            onChange={(op) => onChange({ ...test, op })}
          />
          <ValueField
            label={`value${n}`}
            kind={kind}
            value={test.value}
            onChange={(value) => onChange({ ...test, value })}
            enums={enums}
          />
        </>
      )}

      {test.kind === "range3" && (
        <>
          <OperatorSelect
            label={`operator${n}`}
            value={test.op}
            onChange={(op) => onChange({ ...test, op })}
          />
          <ValueField
            label={`value${n}`}
            kind="length"
            value={test.value}
            onChange={(value) => onChange({ ...test, value })}
            enums={null}
          />
          <OperatorSelect
            label={`operator2${n}`}
            value={test.op2}
            onChange={(op2) => onChange({ ...test, op2 })}
          />
          <ValueField
            label={`value2${n}`}
            kind="length"
            value={test.value2}
            onChange={(value2) => onChange({ ...test, value2 })}
            enums={null}
          />
        </>
      )}

      <span className="font-mono text-muted-foreground text-xs">)</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove feature test${n}`}
        className="ml-auto rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ShapeSelect (internal) — boolean / : / op / range
// ---------------------------------------------------------------------------

function ShapeSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: FeatureTest["kind"]
  onChange: (value: FeatureTest["kind"]) => void
}) {
  return (
    <MiniSelect
      aria-label={label}
      value={value}
      onValueChange={(v) => onChange(v as FeatureTest["kind"])}
    >
      <option value="boolean">exists</option>
      <option value="plain">: value</option>
      <option value="range2">op value</option>
      <option value="range3">v op f op v</option>
    </MiniSelect>
  )
}

// ---------------------------------------------------------------------------
// OperatorSelect (internal)
// ---------------------------------------------------------------------------

function OperatorSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: FeatureOperator
  onChange: (value: FeatureOperator) => void
}) {
  return (
    <MiniSelect
      aria-label={label}
      value={value}
      onValueChange={(v) => onChange(v as FeatureOperator)}
    >
      {OPERATORS.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
    </MiniSelect>
  )
}

// ---------------------------------------------------------------------------
// ValueField (internal) — length → unit-input; enum → select; else → input
// ---------------------------------------------------------------------------

function ValueField({
  label,
  kind,
  value,
  onChange,
  enums,
}: {
  label: string
  kind: ReturnType<typeof featureKind>
  value: string
  onChange: (value: string) => void
  enums: readonly string[] | null
}) {
  if (enums) {
    return (
      <MiniSelect
        aria-label={label}
        value={enums.includes(value) ? value : ""}
        onValueChange={onChange}
      >
        {!enums.includes(value) && <option value="">{value || "—"}</option>}
        {enums.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </MiniSelect>
    )
  }
  if (kind === "length") {
    return (
      <div className="w-[120px]">
        <UnitInput
          aria-label={label}
          unit={unitOf(value)}
          value={value}
          onChange={onChange}
        />
      </div>
    )
  }
  return (
    <Input
      aria-label={label}
      value={value}
      spellCheck={false}
      autoComplete="off"
      placeholder={kind === "ratio" ? "16/9" : "value"}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-[110px] font-mono text-xs"
    />
  )
}
