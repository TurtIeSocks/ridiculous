import type * as React from "react"

export function ApiReference() {
  return (
    <div className="glass-card space-y-10 rounded-2xl p-6 md:p-8">
      <Section title="TransitionEditor / TransitionEditorPanel">
        <Signature>
          {
            '<TransitionEditor\n  mode?: "transition" | "animation"   // default "transition"\n  value: TransitionString | AnimationString | (string & {})\n  onChange: (next) => void              // return type keyed by mode\n  className?: string\n  aria-label?: string\n/>'
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">TransitionEditor</code> is
          popover-wrapped;{" "}
          <code className="font-mono">TransitionEditorPanel</code> renders the
          same editor inline. Both are controlled and generic on{" "}
          <code className="font-mono">mode</code>.
        </p>
        <PropsTable
          rows={[
            {
              name: "mode",
              type: '"transition" | "animation"',
              desc: "Which shorthand to edit. Defaults to `transition`. Narrows the onChange return type via TransitionEditorStringMap.",
            },
            {
              name: "value",
              type: "TransitionString | AnimationString | (string & {})",
              desc: "Current CSS value. Required. `none` is the empty state.",
            },
            {
              name: "onChange",
              type: "(next: TransitionEditorStringMap[Mode]) => void",
              desc: "Fires when the edited layer list changes. Emits the canonical comma-separated string or `none`.",
            },
          ]}
        />
      </Section>

      <Section title="Sub-components">
        <ApiRow
          signature="<TransitionLayerRow mode layer onChange onRemove index? />"
          desc="One editable layer. In transition mode: a property input (with a datalist), duration / delay TimeFields, an embedded EasingPicker, and an allow-discrete toggle. In animation mode: a name input, duration / delay, EasingPicker, an iteration-count input with an ∞ toggle, and direction / fill-mode / play-state selects."
        />
        <ApiRow
          signature="<TimeField label value onChange />"
          desc="A <time> editor: a numeric field plus an ms/s unit select; raw text passthrough for opaque calc()/var()."
        />
        <ApiRow
          signature="<KeywordSelect label value options onChange />"
          desc="A labelled native select with an empty (unset) option — backs direction / fill-mode / play-state."
        />
        <ApiRow
          signature="<AddLayerButton onAdd />"
          desc="Appends a fresh layer (mode-appropriate default) via onAdd."
        />
        <ApiRow
          signature="<TransitionPreview mode value onChange? />"
          desc="The live showcase: a target element with the built transition / animation applied, a play (transition) / replay (animation) button, shipped demo @keyframes, and a UnitInput duration scrubber for the first layer."
        />
      </Section>

      <Section title="Runtime helpers">
        <ApiRow
          signature="cssTransition<S>(value: S & TransitionLiteral<S>): S"
          desc="Call-site validator for `transition`. Mirrors cssBoxShadow() / color() / easing()."
        />
        <ApiRow
          signature="cssAnimation<S>(value: S & AnimationLiteral<S>): S"
          desc="Call-site validator for `animation`."
        />
        <ApiRow
          signature="parseTransition(src): TransitionLayer[] | null"
          desc="String → typed layers, or null on excess cardinality / unknown token / syntax error. `none` and empty → []. Tolerates calc()/var()."
        />
        <ApiRow
          signature="parseAnimation(src): AnimationLayer[] | null"
          desc="The animation-mode parser, same contract."
        />
        <ApiRow
          signature="formatTransition(layers) / formatAnimation(layers): string"
          desc="Canonical re-serialization (deterministic token order; layers joined by `, `). Empty → `none`."
        />
        <ApiRow
          signature="layerCount(mode, src): number"
          desc="Runtime mirror of LayerCountOf — the number of layers (invalid → 0)."
        />
        <ApiRow
          signature="defaultTransitionLayer() / defaultAnimationLayer()"
          desc="Seed a fresh layer (all 200ms ease / slide 1s ease 1)."
        />
      </Section>

      <Section title="Types">
        <TypesList
          rows={[
            {
              name: "TransitionLiteral<S> / AnimationLiteral<S>",
              desc: "Strict validators — S if every layer's tokens classify within their per-kind caps, else never.",
            },
            {
              name: "TransitionLayerLiteral<S> / AnimationLayerLiteral<S>",
              desc: "Strict single-layer validators (a comma-list is not a single layer).",
            },
            {
              name: "TransitionString / AnimationString",
              desc: "Suggestion unions: a space-separated layer, a comma-joined list, or `none`.",
            },
            {
              name: "TransitionEditorStringMap / EditorMode",
              desc: "Mode → output-string map (transition / animation) and its key union.",
            },
            {
              name: "LayersOf<S> / LayerCountOf<S>",
              desc: "Tuple of the raw per-layer strings; and its length.",
            },
            {
              name: "TransitionPropertiesOf<S> / AnimationNamesOf<S>",
              desc: "The <custom-ident> slot of each layer (property / keyframes-name).",
            },
            {
              name: "TransitionLayer / AnimationLayer",
              desc: "Per-layer record state. Exported for advanced use.",
            },
            {
              name: "TransitionEditorState",
              desc: "Discriminated union on `mode` — { mode; layers } for the internal editor state.",
            },
          ]}
        />
      </Section>

      <Section title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            Full <strong>per-layer token-kind classification</strong>:{" "}
            <code className="font-mono">SplitByComma</code> → per-layer{" "}
            <code className="font-mono">SplitBySpace</code> → each token folded
            into a per-kind counter. Tokens are{" "}
            <strong>order-independent</strong> within a layer (CSS classifies by
            kind, not position).
          </li>
          <li>
            <strong>Transition</strong> caps: ≤2{" "}
            <code className="font-mono">&lt;time&gt;</code> (first = duration,
            second = delay), ≤1{" "}
            <code className="font-mono">&lt;easing-function&gt;</code>{" "}
            (validated via the easing-picker&apos;s{" "}
            <code className="font-mono">EasingLiteral</code>), ≤1{" "}
            <code className="font-mono">&lt;property&gt;</code> (
            <code className="font-mono">all</code> /{" "}
            <code className="font-mono">none</code> / a weak{" "}
            <code className="font-mono">&lt;custom-ident&gt;</code>), and ≤1{" "}
            <code className="font-mono">allow-discrete</code>.
          </li>
          <li>
            <strong>Animation</strong> caps: ≤2{" "}
            <code className="font-mono">&lt;time&gt;</code>, ≤1 easing, ≤1
            iteration-count (<code className="font-mono">&lt;number&gt;</code> /{" "}
            <code className="font-mono">infinite</code>), ≤1 direction, ≤1
            fill-mode, ≤1 play-state, and ≤1{" "}
            <code className="font-mono">&lt;keyframes-name&gt;</code>.
          </li>
          <li>
            Easing keywords (<code className="font-mono">ease</code>,{" "}
            <code className="font-mono">linear</code>, …) classify as the easing
            token, <em>not</em> the{" "}
            <code className="font-mono">&lt;custom-ident&gt;</code> slot — the
            real CSS interpretation. A bare{" "}
            <code className="font-mono">none</code> in animation classifies as
            the fill-mode. Both are deterministic, documented calls.
          </li>
          <li>
            The <code className="font-mono">&lt;custom-ident&gt;</code> slot is{" "}
            <strong>weak-validated</strong> (non-empty, ident-safe chars, no
            leading digit). The full grammar is deferred to the runtime parser.
          </li>
          <li>
            <code className="font-mono">calc()</code> /{" "}
            <code className="font-mono">var()</code> inside a token resolve to{" "}
            <code className="font-mono">never</code> (undecidable at compile
            time). The runtime parser accepts them.
          </li>
          <li>
            The comma layer-list recursion is capped at 32 layers (the tail is
            weak-validated past the cap); the runtime parser validates fully.
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
      <h3 className="font-mono text-muted-foreground text-sm uppercase tracking-[0.18em]">
        <span className="text-gradient">§</span> {title}
      </h3>
      {children}
    </div>
  )
}

function Signature({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto whitespace-pre rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed md:text-xs">
      {children}
    </pre>
  )
}

function ApiRow({ signature, desc }: { signature: string; desc: string }) {
  return (
    <div className="space-y-2">
      <Signature>{signature}</Signature>
      <p className="text-muted-foreground text-sm">{desc}</p>
    </div>
  )
}

function PropsTable({
  rows,
}: {
  rows: ReadonlyArray<{ name: string; type: string; desc: string }>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-white/10 border-b text-muted-foreground text-xs uppercase tracking-wider">
            <th className="py-2 pr-4 font-medium">Prop</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-white/5 border-b align-top">
              <td className="py-2 pr-4 font-mono text-foreground text-xs">
                {row.name}
              </td>
              <td className="py-2 pr-4 font-mono text-muted-foreground text-xs">
                {row.type}
              </td>
              <td className="py-2 text-muted-foreground">{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TypesList({
  rows,
}: {
  rows: ReadonlyArray<{ name: string; desc: string }>
}) {
  return (
    <dl className="space-y-2 text-sm">
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex flex-col gap-0.5 md:flex-row md:gap-3"
        >
          <dt className="min-w-[180px] font-mono text-foreground text-xs">
            {row.name}
          </dt>
          <dd className="text-muted-foreground">{row.desc}</dd>
        </div>
      ))}
    </dl>
  )
}
