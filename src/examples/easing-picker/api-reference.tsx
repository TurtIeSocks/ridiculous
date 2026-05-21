import type * as React from "react"

export function ApiReference() {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-10">
      <Section title="EasingPicker">
        <Signature>
          {
            "<EasingPicker\n  value: EasingString | (string & {})\n  onChange: (next: EasingString | string) => void\n  basis?: EasingBasis\n  output?: 'css' | 'tailwind-v3' | 'tailwind-v4'\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-sm text-muted-foreground">
          Popover-wrapped composed wizard.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "EasingString | (string & {})",
              desc: "Current CSS easing function or keyword. Required.",
            },
            {
              name: "onChange",
              type: "(next) => void",
              desc: "Called when the easing changes. Return type narrows by `basis`.",
            },
            {
              name: "basis",
              type: "EasingBasis?",
              desc: 'Lock the wizard to "bezier" | "spring" | "bounce" | "wiggle" | "steps". Narrows onChange.',
            },
            {
              name: "output",
              type: "'css' | 'tailwind-v3' | 'tailwind-v4'",
              desc: "Default snippet format in the OutputPanel.",
            },
            {
              name: "className",
              type: "string",
              desc: "Applied to the trigger button wrapper.",
            },
            {
              name: "aria-label",
              type: "string",
              desc: "Required when no visible label is associated externally.",
            },
          ]}
        />
      </Section>

      <Section title="EasingPanel">
        <Signature>
          {"<EasingPanel /* same props as EasingPicker */ />"}
        </Signature>
        <p className="text-sm text-muted-foreground">
          Renders the wizard inline without a popover wrapper. Same prop surface
          as <code className="font-mono">EasingPicker</code>.
        </p>
      </Section>

      <Section title="Sub-components">
        <p className="text-sm text-muted-foreground">
          All controlled-only — <code className="font-mono">value</code> +{" "}
          <code className="font-mono">onChange</code> required.
        </p>
        <TypesList
          rows={[
            {
              name: "BezierCanvas",
              desc: "Draggable P1/P2 SVG canvas.",
            },
            {
              name: "PresetGallery",
              desc: "39-preset card grid.",
            },
            {
              name: "EasingPreview",
              desc: "CSS-animated preview with 6 property options.",
            },
            {
              name: "StepsControls",
              desc: "n + position editor.",
            },
            {
              name: "SpringControls",
              desc: "Stiffness / damping / mass sliders.",
            },
            {
              name: "BounceControls",
              desc: "Bounces / stiffness sliders.",
            },
            {
              name: "WiggleControls",
              desc: "Wiggles / damping sliders.",
            },
          ]}
        />
      </Section>

      <Section title="Runtime helpers">
        <ApiRow
          signature="easing<S extends string>(value: S & EasingLiteral<S>): S"
          desc="Call-site validator. Mirrors color() and gradient()."
        />
        <ApiRow
          signature="parseEasing(s: string): EasingState | null"
          desc="String → EasingState, or null when unrecognized."
        />
        <ApiRow
          signature="formatEasing(state: EasingState): string"
          desc="EasingState → CSS-valid string."
        />
        <ApiRow
          signature="bezierFromPreset(name: PresetName): string"
          desc="Preset name → cubic-bezier(...) literal."
        />
        <ApiRow
          signature="matchPreset(x1, y1, x2, y2): PresetName | null"
          desc="Reverse lookup by coords with tolerance 0.005."
        />
        <ApiRow
          signature="sampleSpring(k, c, m, n) / sampleBounce(n, k) / sampleWiggle(n, d)"
          desc="Physics samplers — emit sample arrays for baking."
        />
        <ApiRow
          signature="bakeLinear(samples): string"
          desc="Sample array → linear(...) string with collinear-prune pass."
        />
      </Section>

      <Section title="Types">
        <TypesList
          rows={[
            {
              name: "EasingString",
              desc: "Union of all valid output strings.",
            },
            {
              name: "EasingLiteral<S>",
              desc: "Strict literal validator for call-site validation.",
            },
            {
              name: "EasingBasis",
              desc: '"bezier" | "spring" | "bounce" | "wiggle" | "steps".',
            },
            {
              name: "EasingStringMap",
              desc: "Basis → output-string map for type narrowing.",
            },
            {
              name: "PresetName",
              desc: "Named preset union (39 entries).",
            },
            {
              name: "EasingState",
              desc: "Internal discriminated union (exported for advanced use).",
            },
          ]}
        />
      </Section>

      <Section title="Limitations">
        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
          <li>
            Round-trip from <code className="font-mono">linear()</code> back to
            physics params is lossy — the baked output erases the source{" "}
            <code className="font-mono">{"{stiffness, damping, mass}"}</code>.
          </li>
          <li>
            Preset selection emits the underlying{" "}
            <code className="font-mono">cubic-bezier(...)</code> literal, never
            the keyword form.
          </li>
          <li>
            <code className="font-mono">LinearLiteral&lt;S&gt;</code> does weak
            validation (variadic stop ranges not checked at type level); the
            runtime parser is authoritative.
          </li>
        </ul>
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">§</span> {title}
      </h3>
      {children}
    </div>
  )
}

function Signature({ children }: { children: string }) {
  return (
    <pre className="text-[11px] md:text-xs leading-relaxed font-mono bg-black/40 border border-white/10 p-4 rounded-lg overflow-x-auto whitespace-pre">
      {children}
    </pre>
  )
}

function ApiRow({ signature, desc }: { signature: string; desc: string }) {
  return (
    <div className="space-y-2">
      <Signature>{signature}</Signature>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function PropsTable({
  rows,
}: {
  rows: { name: string; type: string; desc: string }[]
}) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <div className="grid grid-cols-[minmax(7rem,auto)_minmax(12rem,auto)_1fr] gap-x-4 px-4 py-2 bg-black/40 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
        <div>Prop</div>
        <div>Type</div>
        <div>Description</div>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[minmax(7rem,auto)_minmax(12rem,auto)_1fr] gap-x-4 px-4 py-3 items-baseline text-sm"
          >
            <code className="font-mono text-foreground">{r.name}</code>
            <code className="font-mono text-xs text-cyan-glow break-all">
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
    <div className="rounded-lg border border-white/10 divide-y divide-white/5 overflow-hidden">
      {rows.map((r) => (
        <div
          key={r.name}
          className="grid grid-cols-1 sm:grid-cols-[minmax(10rem,auto)_1fr] gap-x-4 gap-y-1 px-4 py-3 text-sm"
        >
          <code className="font-mono text-foreground">{r.name}</code>
          <span className="text-muted-foreground">{r.desc}</span>
        </div>
      ))}
    </div>
  )
}
