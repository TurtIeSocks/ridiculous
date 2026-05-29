import {
  ApiRow,
  ApiSection,
  PropsTable,
  Signature,
  TypesList,
} from "@/examples/_shared/api-reference"

export function ApiReference() {
  return (
    <div className="glass-card space-y-10 rounded-2xl p-6 md:p-8">
      <ApiSection title="EasingPicker">
        <Signature>
          {
            "<EasingPicker\n  value: EasingString | (string & {})\n  onChange: (next: EasingString | string) => void\n  basis?: EasingBasis\n  output?: 'css' | 'tailwind-v3' | 'tailwind-v4'\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
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
      </ApiSection>

      <ApiSection title="EasingPanel">
        <Signature>
          {"<EasingPanel /* same props as EasingPicker */ />"}
        </Signature>
        <p className="text-muted-foreground text-sm">
          Renders the wizard inline without a popover wrapper. Same prop surface
          as <code className="font-mono">EasingPicker</code>.
        </p>
      </ApiSection>

      <ApiSection title="Sub-components">
        <p className="text-muted-foreground text-sm">
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
      </ApiSection>

      <ApiSection title="Runtime helpers">
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
      </ApiSection>

      <ApiSection title="Types">
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
      </ApiSection>

      <ApiSection title="Limitations">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
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
      </ApiSection>
    </div>
  )
}
