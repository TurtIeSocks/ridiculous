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
      <ApiSection title="BackgroundEditor / BackgroundEditorPanel">
        <Signature>
          {
            "<BackgroundEditor\n  value: BackgroundString | (string & {})\n  onChange: (next: BackgroundString) => void\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">BackgroundEditor</code> is popover-wrapped
          (a trigger showing the layer count + truncated value);{" "}
          <code className="font-mono">BackgroundEditorPanel</code> renders the
          same editor inline. Both are controlled. State is the parsed{" "}
          <code className="font-mono">BgLayer[]</code> with a{" "}
          <code className="font-mono">lastEmittedRef</code> resync, and a{" "}
          <code className="font-mono">&lt;color&gt;</code> that re-homes onto
          the final layer after any reorder.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "BackgroundString | (string & {})",
              desc: "Current background shorthand string. Required. An empty / unparseable value seeds a default single-layer editor.",
            },
            {
              name: "onChange",
              type: "(next: BackgroundString) => void",
              desc: "Fires when the value changes. Emits the canonical re-serialized shorthand (color only on the final layer).",
            },
            {
              name: "className",
              type: "string",
              desc: "Forwarded to the popover trigger (BackgroundEditor) or the inline fieldset (BackgroundEditorPanel).",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<LayerStack layers onChange />"
          desc="The reorderable vertical stack of layer cards. Renders a LayerCard per layer plus up/down/remove controls (no drag-drop dependency) and an add-layer button. The parent re-derives isFinal from array position so the color always rides the last layer."
        />
        <ApiRow
          signature="<LayerCard index isFinal layer onChange onMoveUp onMoveDown onRemove />"
          desc="One layer's editors: an embedded GradientEditor (when the image is a gradient) or a url()/none input; a PositionPad + x/y UnitInputs; a size control (cover/contain/auto vs a length); repeat / attachment / origin / clip MiniSelects. The FINAL card additionally renders a ColorPicker for the layer color."
        />
        <ApiRow
          signature="<PositionPad x y onChange />"
          desc="The 2D crosshair position picker — a role='slider' control with pointer press/drag and Arrow-key nudge (Shift = 10). Locally re-implemented (registry self-containment) — not imported from gradient-editor."
        />
        <ApiRow
          signature="<BackgroundPreview value />"
          desc="The live composite tile. Renders the produced shorthand as the tile's background style so every layer composites in real time, over a checkerboard underlay that makes transparency visible."
        />
        <ApiRow
          signature="<MiniSelect value options onChange />"
          desc="The local compact <select> chrome. Each component owns its copy (registry self-containment) — it is not imported from query-builder."
        />
        <ApiRow
          signature="<LiveString value />"
          desc="The produced background value rendered in a <code> block."
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="cssBackground<S>(value: S & BackgroundLiteral<S>): S"
          desc="Call-site validator for a background shorthand. Mirrors cssTransform() / cssPositionArea(). The index-aware last-layer-color rule is the namesake."
        />
        <ApiRow
          signature="parseBackground(src): { layers: BgLayer[]; error: string | null }"
          desc="String → editor state. The runtime superset of the strict tier: a paren-aware comma split into layers, then per-layer space-token slotting. A color in any non-final layer is an error (the index-aware invariant)."
        />
        <ApiRow
          signature="formatBackground(layers): string"
          desc="Canonical re-serialization. Layers join with ', '; within a layer, position / size uses a space-separated slash; the <color> is emitted ONLY on the final layer."
        />
        <ApiRow
          signature="classifyToken(token): BgTokenKind"
          desc="The runtime mirror of the type IsBgToken: image | position | size | repeat | attachment | box | length | color | slash | unknown. A functional color (oklch(…)) is checked before the parenthesized-image rule."
        />
        <ApiRow
          signature="repeatOptions()  ·  attachmentOptions()  ·  boxOptions()  ·  sizeKeywords()  ·  defaultBackground()"
          desc="The <select> option sources (the strict whitelists) and a sensible single-layer seed value."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "BackgroundLiteral<S>",
              desc: "Strict validator — S if S is a valid background shorthand, else never. Splits into comma-stacked layers and folds them index-aware, permitting a <color> only on the final layer.",
            },
            {
              name: "BackgroundString",
              desc: "The suggestion type (a shorthand-shaped string) and the onChange return type.",
            },
            {
              name: "LayersOf<S> / LayerCountOf<S>",
              desc: "The comma-split layer tuple of a background value, and its length.",
            },
            {
              name: "BgLayer / BackgroundValue",
              desc: "The internal editor state: one layer (image, position, size, repeat, attachment, origin, clip, and an optional color meaningful only on the final layer), and the layer array. Exported for advanced use.",
            },
            {
              name: "BgTokenKind",
              desc: "The classifyToken result union (image | position | size | repeat | attachment | box | length | color | slash | unknown).",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope (validated vs deferred)">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            <strong>Validated:</strong> the comma-split layer structure; the{" "}
            <strong>last-layer-only-&lt;color&gt; invariant</strong> (a color
            token in any non-final layer →{" "}
            <code className="font-mono">never</code>); recognized per-layer
            token membership (image / position / size / repeat / attachment /
            box / <code className="font-mono">&lt;length-percentage&gt;</code>);
            and the final color via color-picker&apos;s{" "}
            <code className="font-mono">ColorLiteral</code>.
          </li>
          <li>
            <strong>Deferred (lenient → runtime parser):</strong> the{" "}
            <code className="font-mono">||</code> ordering / cardinality (at
            most one image, position-before-<code className="font-mono">/</code>
            -before-size) — tokens are validated by membership, in any order;
            gradient / image internals (any parenthesized function or{" "}
            <code className="font-mono">none</code>; the embedded{" "}
            <code className="font-mono">GradientEditor</code> validates
            gradients); multi-value position forms; and{" "}
            <code className="font-mono">calc()</code>/
            <code className="font-mono">var()</code> values.
          </li>
          <li>
            Colors use color-picker functional / hex forms (
            <code className="font-mono">#f00</code> /{" "}
            <code className="font-mono">oklch(…)</code>), not named colors; and
            the <code className="font-mono">/</code> between position and size
            is space-separated in strict (the runtime parser handles both).
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
