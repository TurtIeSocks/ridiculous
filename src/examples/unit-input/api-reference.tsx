import { ApiRow, ApiSection, Signature } from "@/examples/_shared/api-reference"

export function ApiReference() {
  return (
    <div className="glass-card space-y-10 rounded-2xl p-6 md:p-8">
      <ApiSection title="Component">
        <Signature>
          {
            "<UnitInput<TUnit extends KnownUnit | (string & {})>\n  value: UnitStringMap[TUnit] | (string & {}) | string\n  onChange: (next: UnitStringMap[TUnit] | string) => void\n  unit: TUnit\n  min?: number\n  max?: number\n  step?: number\n  precision?: number\n  dragSensitivity?: number\n  prefix?: React.ReactNode\n  suffix?: React.ReactNode\n  disabled?: boolean\n  aria-label?: string\n  className?: string\n/>"
          }
        </Signature>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "UnitStringMap[TUnit] | (string & {})",
              desc: 'Current value, e.g. "45deg". Any string accepted; IntelliSense narrows by `unit`.',
            },
            {
              name: "onChange",
              type: "(next) => void",
              desc: "Called on commit (blur, Enter, arrow, scrub). Return type narrows by `unit`.",
            },
            {
              name: "unit",
              type: "KnownUnit | (string & {})",
              desc: "Suffix label. Known units (deg/%/px/rem/em/vw/vh) get strict typing; unknown widens to string.",
            },
            {
              name: "min",
              type: "number?",
              desc: "Inclusive lower bound. Soft-clamps on commit.",
            },
            {
              name: "max",
              type: "number?",
              desc: "Inclusive upper bound. Soft-clamps on commit.",
            },
            {
              name: "step",
              type: "number (default 1)",
              desc: "Arrow-key step. Shift=×10, Alt=÷10.",
            },
            {
              name: "precision",
              type: "number (default 0)",
              desc: "Decimal places. Round via toFixed on commit.",
            },
            {
              name: "dragSensitivity",
              type: "number (default 1)",
              desc: "Scrub: 1px = step × sensitivity.",
            },
            {
              name: "prefix",
              type: "React.ReactNode?",
              desc: "Left-side slot inside the shell, shares focus ring.",
            },
            {
              name: "suffix",
              type: "React.ReactNode?",
              desc: "Override the default unit-text suffix. Scrub handle attaches here.",
            },
            {
              name: "disabled",
              type: "boolean",
              desc: "Disables typing, arrow nudge, and scrub.",
            },
            {
              name: "aria-label",
              type: "string",
              desc: "Required when no visible label is associated externally.",
            },
            {
              name: "className",
              type: "string",
              desc: "Applied to the shell wrapper for sizing/spacing.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="deg<S extends string>(value: S & DegLiteral<S>): S"
          desc="Validate a deg literal at the call site."
        />
        <ApiRow
          signature="percent<S extends string>(value: S & PercentLiteral<S>): S"
          desc="Validate a % literal at the call site."
        />
        <ApiRow
          signature="px<S extends string>(value: S & PxLiteral<S>): S"
          desc="Validate a px literal."
        />
        <ApiRow
          signature="rem<S extends string>(value: S & RemLiteral<S>): S"
          desc="Validate a rem literal."
        />
        <ApiRow
          signature="em<S extends string>(value: S & EmLiteral<S>): S"
          desc="Validate an em literal."
        />
        <ApiRow
          signature="vw<S extends string>(value: S & VwLiteral<S>): S"
          desc="Validate a vw literal."
        />
        <ApiRow
          signature="vh<S extends string>(value: S & VhLiteral<S>): S"
          desc="Validate a vh literal."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "UnitString",
              desc: "Union of all 7 suggestion strings (DegString | PercentString | …).",
            },
            {
              name: "UnitStringMap",
              desc: '{ deg: DegString, "%": PercentString, px: PxString, rem: RemString, em: EmString, vw: VwString, vh: VhString }',
            },
            {
              name: "KnownUnit",
              desc: 'keyof UnitStringMap — "deg" | "%" | "px" | "rem" | "em" | "vw" | "vh".',
            },
            {
              name: "UnitLiteral<S>",
              desc: "Union of all strict literal validators. Returns S if S is a valid unit literal in any of the known shapes, otherwise never.",
            },
          ]}
        />
      </ApiSection>
    </div>
  )
}

function PropsTable({
  rows,
}: {
  rows: { name: string; type: string; desc: string }[]
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="grid grid-cols-[minmax(7rem,auto)_minmax(12rem,auto)_1fr] gap-x-4 bg-black/40 px-4 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
        <div>Prop</div>
        <div>Type</div>
        <div>Description</div>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[minmax(7rem,auto)_minmax(12rem,auto)_1fr] items-baseline gap-x-4 px-4 py-3 text-sm"
          >
            <code className="font-mono text-foreground">{r.name}</code>
            <code className="break-all font-mono text-cyan-glow text-xs">
              {r.type}
            </code>
            <span className="text-muted-foreground text-sm">{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TypesList({ rows }: { rows: { name: string; desc: string }[] }) {
  return (
    <div className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/10">
      {rows.map((r) => (
        <div
          key={r.name}
          className="grid grid-cols-1 gap-x-4 gap-y-1 px-4 py-3 text-sm sm:grid-cols-[minmax(10rem,auto)_1fr]"
        >
          <code className="font-mono text-foreground">{r.name}</code>
          <span className="text-muted-foreground">{r.desc}</span>
        </div>
      ))}
    </div>
  )
}
