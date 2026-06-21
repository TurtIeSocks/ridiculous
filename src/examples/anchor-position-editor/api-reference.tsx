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
      <ApiSection title="AnchorPositionEditor / AnchorPositionEditorPanel">
        <Signature>
          {
            '<AnchorPositionEditor\n  value: AnchorPositionString | (string & {})\n  onChange: (next: AnchorPositionString) => void\n  mode?: "position-area" | "anchor" | "position-try"  // default "position-area"\n  className?: string\n  aria-label?: string\n/>'
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">AnchorPositionEditor</code> is
          popover-wrapped (a trigger showing the mode badge + truncated value);{" "}
          <code className="font-mono">AnchorPositionEditorPanel</code> renders
          the same editor inline. Both are controlled. The{" "}
          <code className="font-mono">mode</code> prop selects the
          position-area, anchor, or position-try dialect.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "AnchorPositionString | (string & {})",
              desc: "Current anchor-positioning value string. Required. An empty / unparseable value seeds an empty editor for the mode.",
            },
            {
              name: "onChange",
              type: "(next: AnchorPositionString) => void",
              desc: "Fires when the value changes. Emits the canonical value string for the active mode.",
            },
            {
              name: "mode",
              type: '"position-area" | "anchor" | "position-try"',
              desc: 'Dialect. Default "position-area" (the 3×3 grid). "anchor" edits an anchor()/anchor-size() expression; "position-try" edits a reorderable fallback chain.',
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<PositionAreaGrid system span row col onChange />"
          desc="The 3×3 placement grid. Cells are labelled <button>s with aria-pressed; a logical/physical toggle swaps the keyword vocabulary and a span toggle switches the chosen axis keyword to its span- reach form. Emits a PositionAreaState."
        />
        <ApiRow
          signature="<AnchorExprFields expr onChange />"
          desc="anchor mode: a function select (anchor/anchor-size), an optional --name input, a side/size select (options swap with the function), and an optional unit-input <length-percentage> fallback."
        />
        <ApiRow
          signature="<TryFallbackChain fallbacks onChange />"
          desc="position-try mode: a reorderable list of fallback chips (none / a position-area / a dashed-ident + try-tactic), with up/down/remove buttons (no drag-drop dependency) and an add control."
        />
        <ApiRow
          signature="<AnchorPreview value />"
          desc="The live mock-anchor + positioned-box preview. Gated on CSS.supports('position-area: center'); degrades to a static diagram with a support note where anchor positioning is unavailable."
        />
        <ApiRow
          signature="<MiniSelect value options onChange />"
          desc="The local compact <select> chrome. Each component owns its copy (registry self-containment) — it is not imported from query-builder."
        />
        <ApiRow
          signature="<CssOutput value property />"
          desc="The shared readout (from css-output): the produced value as raw CSS or a Tailwind v4 class, with a copy button."
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="cssPositionArea<S>(value: S & PositionAreaLiteral<S>): S"
          desc="Call-site validator for a position-area value. Mirrors cssMediaQuery() / cssTransform()."
        />
        <ApiRow
          signature="cssAnchor<S>(value: S & AnchorLiteral<S>): S"
          desc="Call-site validator for an anchor() / anchor-size() value."
        />
        <ApiRow
          signature="cssPositionTry<S>(value: S & PositionTryLiteral<S>): S"
          desc="Call-site validator for a position-try-fallbacks value."
        />
        <ApiRow
          signature="parsePositionArea(src): { keywords; error }  ·  parseAnchor(src): AnchorExpr | null  ·  parsePositionTry(src): TryFallback[]"
          desc="String → editor state. The runtime superset of the strict tier: it tokenizes the structure and surfaces the cross-axis verdict, parsing exotic keywords the strict tier defers."
        />
        <ApiRow
          signature="formatPositionArea(keywords)  ·  formatAnchor(expr)  ·  formatPositionTry(fallbacks)"
          desc="Canonical re-serialization. A duplicate center pair collapses to the single keyword center."
        />
        <ApiRow
          signature="axisOf(keyword)  ·  areCompatible(a, b)"
          desc="Runtime mirrors of the type AxisOf / Compatible: a keyword's axis tag (x/y/block/inline/neutral/unknown), and whether two keywords pair (different axes of the same system)."
        />
        <ApiRow
          signature="cellToKeywords(row, col)  ·  keywordsToCell(keywords)"
          desc="The 3×3 grid ⇄ keyword-pair mapping (physical default). keywordsToCell is order-insensitive and maps logical pairs onto the same cells."
        />
        <ApiRow
          signature="positionAreaKeywords()  ·  anchorSides()  ·  anchorSizes()  ·  tryTactics()  ·  defaultFor(mode)"
          desc="The <select> option sources (the strict whitelists) and a sensible seed value per mode."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "PositionAreaLiteral<S> / AnchorLiteral<S> / PositionTryLiteral<S>",
              desc: "Strict validators — S if S is a valid value for its dialect, else never. The position-area cross-axis rule is the namesake.",
            },
            {
              name: "PositionAreaString / AnchorString / PositionTryString / AnchorPositionString",
              desc: "Suggestion unions (value-shaped strings). AnchorPositionString is the onChange return type.",
            },
            {
              name: "AnchorStringMap / AnchorPositionMode",
              desc: "Mode → output-string map, and the mode discriminant (position-area | anchor | position-try).",
            },
            {
              name: "PaKeyword / AnchorSideKeyword / AnchorSizeKeyword / TryTactic",
              desc: "The position-area keyword union, the anchor() side and anchor-size() dimension keywords, and the three try-tactics (flip-block | flip-inline | flip-start).",
            },
            {
              name: "PositionAxis / AxisOf<K> / Compatible<A, B>",
              desc: "The axis tag union (x|y|block|inline|neutral), the keyword→axis lookup, and the 5×5 cross-axis compatibility check.",
            },
            {
              name: "KeywordsOf<S>",
              desc: "The keyword tuple of a position-area value.",
            },
            {
              name: "AnchorExpr / TryFallback / PositionAreaState",
              desc: "The internal editor state (a parsed anchor() expression; a single try-fallback by kind; the grid state). Exported for advanced use.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope (validated vs deferred)">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            <strong>Validated:</strong> keyword membership; the position-area{" "}
            <strong>cross-axis + system-mix rule</strong> for physical / logical
            pairs (<code className="font-mono">top bottom</code> →{" "}
            <code className="font-mono">never</code>;{" "}
            <code className="font-mono">left block-start</code> →{" "}
            <code className="font-mono">never</code>); the{" "}
            <code className="font-mono">anchor()</code>/
            <code className="font-mono">anchor-size()</code> function name, side
            / size keyword, and{" "}
            <code className="font-mono">&lt;length-percentage&gt;</code>{" "}
            fallback dimension; and every try-fallback&apos;s well-formedness.
          </li>
          <li>
            <strong>Deferred (lenient → runtime parser):</strong> the ambiguous{" "}
            <code className="font-mono">start</code>/
            <code className="font-mono">end</code>/
            <code className="font-mono">self-start</code>/
            <code className="font-mono">self-end</code> keywords (tagged neutral
            — their axis depends on writing-mode);{" "}
            <code className="font-mono">&lt;dashed-ident&gt;</code> validity
            beyond the <code className="font-mono">--</code> prefix;{" "}
            <code className="font-mono">calc()</code>/
            <code className="font-mono">var()</code>/
            <code className="font-mono">env()</code> fallbacks; and order /
            duplication in the{" "}
            <code className="font-mono">
              &lt;dashed-ident&gt; || &lt;try-tactic&gt;
            </code>{" "}
            arm.
          </li>
          <li>
            The <code className="font-mono">@position-try</code> at-rule,{" "}
            <code className="font-mono">position-try-order</code>, and{" "}
            <code className="font-mono">position-visibility</code> are out of
            strict scope — the component edits the three value grammars in
            isolation.
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
