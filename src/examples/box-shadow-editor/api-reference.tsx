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
      <ApiSection title="BoxShadowEditor / BoxShadowEditorPanel">
        <Signature>
          {
            "<BoxShadowEditor\n  value: BoxShadowString | (string & {})\n  onChange: (next: BoxShadowString) => void\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">BoxShadowEditor</code> is popover-wrapped;{" "}
          <code className="font-mono">BoxShadowEditorPanel</code> renders the
          same editor inline. Both are controlled.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "BoxShadowString | (string & {})",
              desc: "Current CSS box-shadow value. Required. `none` is the empty state.",
            },
            {
              name: "onChange",
              type: "(next: BoxShadowString) => void",
              desc: "Fires when the edited stack changes. Emits the normalized comma-separated string (inset leading, color last) or `none`.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<ShadowLayerRow layer onChange onRemove index? />"
          desc="One editable layer — an inset toggle, offset-x / offset-y / blur / spread length editors, a per-layer color control (a ColorPicker with an add / remove affordance), and a remove button."
        />
        <ApiRow
          signature="<ShadowLengthEditor label value onChange allowNegative? />"
          desc="A single length editor: a numeric field plus a unit select (px/rem/em/%/vw/vh); raw text passthrough for opaque calc()/var(). `allowNegative` gates the leading minus (offsets + spread allow it; blur does not)."
        />
        <ApiRow
          signature="<AddLayerButton onAdd />"
          desc="Appends a fresh layer (a soft drop shadow) via onAdd."
        />
        <ApiRow
          signature="<BoxShadowPreview value onChange? />"
          desc="The showcase: a card carrying the stacked shadow, a draggable light source that re-casts every layer's offsets away from it, and a UnitInput elevation scrubber that scales blur across the stack."
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="cssBoxShadow<S extends string>(value: S & BoxShadowLiteral<S>): S"
          desc="Call-site validator. Mirrors cssFilter() / cssTransform() / color() / easing()."
        />
        <ApiRow
          signature="parseBoxShadow(src: string): ShadowLayer[] | null"
          desc="String → typed layers, or null on arity / duplicate / syntax error. `none` and empty → []. Tolerates calc()/var(), bare keyword colors, and a leading color (normalized to color-last)."
        />
        <ApiRow
          signature="formatBoxShadow(layers: ShadowLayer[]): string"
          desc="Canonical re-serialization (inset leading, color last; layers joined by `, `). Empty list → `none`."
        />
        <ApiRow
          signature="layerToCss(layer: ShadowLayer): string"
          desc="One layer → its CSS string."
        />
        <ApiRow
          signature="boxShadowLayerCount(src: string): number"
          desc="Runtime mirror of LayerCountOf — the number of layers (invalid → 0)."
        />
        <ApiRow
          signature="defaultLayer(): ShadowLayer"
          desc="Seed a fresh layer — a soft drop shadow (0px 4px 8px rgb(0 0 0 / 0.25))."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "BoxShadowLiteral<S>",
              desc: "Strict validator — S if every layer validates (inset placement + 2-4 lengths + optional trailing ColorLiteral; blur non-negative), else never.",
            },
            {
              name: "ShadowLayerLiteral<S>",
              desc: "Strict single-layer validator (a comma-list is not a single layer).",
            },
            {
              name: "BoxShadowString",
              desc: "Suggestion union: a single space-separated layer, a comma-joined list, or `none`.",
            },
            {
              name: "BoxShadowStringMap / BoxShadowKind",
              desc: "Layer-kind → output-string map (inset / outset) and its key union.",
            },
            {
              name: "LayersOf<S> / LayerCountOf<S>",
              desc: "Tuple of the raw per-layer strings; and its length.",
            },
            {
              name: "HasInset<S> / IsInsetLayer<S>",
              desc: "Whether any layer is inset; whether a single layer is inset.",
            },
            {
              name: "ShadowLayer",
              desc: "Per-layer record state — { inset, offsetX, offsetY, blur?, spread?, color? }. Exported for advanced use.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            Full <strong>per-layer token validation</strong>:{" "}
            <code className="font-mono">SplitByComma</code> → per-layer{" "}
            <code className="font-mono">SplitBySpace</code> → 2-4{" "}
            <code className="font-mono">IsLength</code> tokens (offset-x,
            offset-y required; blur, spread optional), with{" "}
            <code className="font-mono">blur</code> non-negative.
          </li>
          <li>
            At most one <code className="font-mono">inset</code> keyword,{" "}
            <strong>leading or trailing</strong> only. A mid-token or doubled{" "}
            <code className="font-mono">inset</code> resolves to{" "}
            <code className="font-mono">never</code>.
          </li>
          <li>
            At most one <strong>trailing</strong> color, validated against the
            color-picker&apos;s <code className="font-mono">ColorLiteral</code>.
            A functional color whose own body has spaces and a slash —{" "}
            <code className="font-mono">rgb(0 0 0 / 0.2)</code> — stays one
            token thanks to the paren-aware split.
          </li>
          <li>
            Bare keyword colors (<code className="font-mono">red</code>) are{" "}
            <em>not</em> in <code className="font-mono">ColorLiteral</code> —
            they resolve to <code className="font-mono">never</code> at the
            strict tier (use hex / functional). The runtime parser accepts them.
          </li>
          <li>
            Strict accepts <strong>color-last only</strong>. A leading-color
            layer (<code className="font-mono">#000 0px 4px</code>) resolves to{" "}
            <code className="font-mono">never</code>, but the runtime parser
            accepts it and normalizes to color-last.
          </li>
          <li>
            Dimension + arity + placement only — numeric magnitudes are{" "}
            <em>not</em> range-checked (beyond the blur-non-negative rule).
          </li>
          <li>
            <code className="font-mono">calc()</code> /{" "}
            <code className="font-mono">var()</code> inside a token resolve to{" "}
            <code className="font-mono">never</code> at the strict tier
            (undecidable at compile time). The runtime parser accepts them.
          </li>
          <li>
            The comma layer-list recursion is capped at 32 layers (the tail is
            weak-validated past the cap); the runtime parser validates fully.
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
