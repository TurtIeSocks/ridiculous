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
      <ApiSection title="KeyframesEditor / KeyframesEditorPanel">
        <Signature>
          {
            "<KeyframesEditor\n  value: KeyframesString | (string & {})\n  onChange: (next: KeyframesString) => void\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">KeyframesEditor</code> is popover-wrapped
          (a trigger showing the stop count + truncated body);{" "}
          <code className="font-mono">KeyframesEditorPanel</code> renders the
          same editor inline. Both are controlled. The component edits the{" "}
          <strong>body</strong> of a{" "}
          <code className="font-mono">@keyframes</code> rule — the block list —
          not the rule name; the consumer owns the{" "}
          <code className="font-mono">@keyframes name {"{ … }"}</code> wrapper.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "KeyframesString | (string & {})",
              desc: "Current @keyframes body. Required. An empty / unparseable value seeds a default two-stop body in the editor.",
            },
            {
              name: "onChange",
              type: "(next: KeyframesString) => void",
              desc: "Fires when the body changes. Emits the canonical re-serialized body (stops sorted from → % → to).",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<KeyframeTimeline blocks selected position onSelect onPosition onAddStop onRemoveStop />"
          desc="The 0–100% track. One labelled stop marker per block (from=0%, to=100%, N% between) with add / remove, and a labelled play-head <input type=range> that scrubs the preview. Selecting a marker raises onSelect; the container reveals that stop's declarations."
        />
        <ApiRow
          signature="<DeclarationRow index declaration onChange onRemove />"
          desc="One property: value row. A property select picks the property; the value editor is chosen by propertyEditorKind — TransformBuilder, FilterBuilder, ColorPicker, GradientEditor, EasingPicker, UnitInput, or a plain input. Add / remove declarations."
        />
        <ApiRow
          signature="<KeyframePreview blocks position onPosition? />"
          desc="The live scrubbed preview box. A LIGHTWEIGHT JS interpolation between adjacent stops (numbers / lengths / opacity); non-numeric values snap to the nearest stop. A play/pause toggle auto-advances when onPosition is wired. NOT a full CSS animation engine (spec A6)."
        />
        <ApiRow
          signature="<MiniSelect value options onChange />"
          desc="The local compact <select> chrome. Each component owns its copy (registry self-containment) — it is not imported from query-builder."
        />
        <ApiRow
          signature="<CssOutput value property />"
          desc="The shared readout (from css-output): the produced value with a copy button (css-only — keyframes have no Tailwind class form)."
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="cssKeyframes<S>(value: S & KeyframesLiteral<S>): S"
          desc="Call-site validator for a @keyframes body. Mirrors cssTransform() / cssPositionArea()."
        />
        <ApiRow
          signature="parseKeyframes(src): { blocks: KeyframeBlock[]; error: string | null }"
          desc="String → editor state. The runtime superset of the strict tier: splits the block list (sel { decls }), selectors on commas, declarations on `;` then the first `:`; surfaces a parse error message."
        />
        <ApiRow
          signature="formatKeyframes(blocks): string"
          desc="Canonical re-serialization. Stops are sorted by their first selector's percent (from=0 < N% < to=100)."
        />
        <ApiRow
          signature="propertyEditorKind(property): KeyframePropertyKind"
          desc='Which embedded editor a declaration opens — the runtime mirror of the type DispatchValue table. Returns "transform" | "filter" | "color" | "easing" | "opacity" | "length" | "plain".'
        />
        <ApiRow
          signature="selectorToPercent(sel)  ·  percentToSelector(n)"
          desc="The timeline coordinate map: from ⇄ 0, to ⇄ 100, an N% selector ⇄ its numeric part."
        />
        <ApiRow
          signature="defaultKeyframes()"
          desc="A valid, parseable two-stop seed (from { opacity: 0 } to { opacity: 1 }) for a freshly-created editor."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "KeyframesLiteral<S>",
              desc: "Strict validator — S if S is a valid @keyframes body, else never. The two-level fold (block selectors + per-property value dispatch) is the namesake.",
            },
            {
              name: "KeyframesString",
              desc: "Suggestion type (body-shaped string). The onChange return type.",
            },
            {
              name: "StopsOf<S>",
              desc: "The block (stop) count of a body, at the type level.",
            },
            {
              name: "KeyframePropertyKind",
              desc: 'The embedded-editor / validator dispatch tag: "transform" | "filter" | "color" | "easing" | "opacity" | "length" | "plain".',
            },
            {
              name: "KeyframeBlock / Declaration / KeyframesValue",
              desc: "The internal editor state — a stop ({ selectors; declarations }), a single { property; value } declaration, and the whole-body container. Exported for advanced use.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope (validated vs deferred)">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            <strong>Validated:</strong> block structure (
            <code className="font-mono">sel {"{ decls }"}</code>); selector
            range (<code className="font-mono">from</code> /{" "}
            <code className="font-mono">to</code> /{" "}
            <code className="font-mono">0–100%</code>); and the KNOWN-property
            values via dispatch into the four sibling validators —{" "}
            <code className="font-mono">transform</code> →{" "}
            <code className="font-mono">TransformLiteral</code>,{" "}
            <code className="font-mono">filter</code>/
            <code className="font-mono">backdrop-filter</code> →{" "}
            <code className="font-mono">FilterLiteral</code>, the color
            properties → <code className="font-mono">ColorLiteral</code>,{" "}
            <code className="font-mono">*-timing-function</code> →{" "}
            <code className="font-mono">EasingLiteral</code> — plus{" "}
            <code className="font-mono">opacity</code> 0–1 and length properties{" "}
            <code className="font-mono">&lt;length-percentage&gt;</code>.
          </li>
          <li>
            <strong>Deferred (lenient → runtime parser):</strong> unknown
            properties&apos; values;{" "}
            <code className="font-mono">background</code>/
            <code className="font-mono">background-image</code> (the gradient
            editor exports suggestion strings, not a strict literal — the UI
            still embeds <code className="font-mono">GradientEditor</code> for
            them); <code className="font-mono">!important</code>;{" "}
            <code className="font-mono">var()</code>/
            <code className="font-mono">env()</code>/
            <code className="font-mono">calc()</code> values; and
            monotonic-ordering of stops (the UI sorts on format).
          </li>
          <li>
            The component edits the{" "}
            <code className="font-mono">@keyframes</code> body in isolation —
            the rule name, animation shorthand, and{" "}
            <code className="font-mono">animation-*</code> longhands are out of
            strict scope.
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
