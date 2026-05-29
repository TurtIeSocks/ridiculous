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
      <ApiSection title="FilterBuilder / FilterBuilderPanel">
        <Signature>
          {
            '<FilterBuilder\n  value: FilterString | (string & {})\n  onChange: (next: FilterString) => void\n  mode?: "filter" | "backdrop-filter"\n  className?: string\n  aria-label?: string\n/>'
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">FilterBuilder</code> is popover-wrapped;{" "}
          <code className="font-mono">FilterBuilderPanel</code> renders the same
          editor inline. Both are controlled.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "FilterString | (string & {})",
              desc: "Current CSS filter value. Required. `none` is the empty state.",
            },
            {
              name: "onChange",
              type: "(next: FilterString) => void",
              desc: "Fires when the edited list changes. Emits the normalized space-separated string (or `none`).",
            },
            {
              name: "mode",
              type: '"filter" | "backdrop-filter"',
              desc: "Which property the live preview targets. Both share the grammar, so this does NOT narrow the output type. Default `filter`.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<FilterFunctionRow item onChange onRemove />"
          desc="One editable function row — a grouped function select, the right per-argument editors (drop-shadow gets x/y/blur + a color control), and a remove button. The dispatch made visible."
        />
        <ApiRow
          signature="<FilterArgEditor label kind value onChange />"
          desc="A single argument editor: a numeric field plus a unit select for length/angle slots; a number + optional % for amount slots; raw text for opaque calc()/var()."
        />
        <ApiRow
          signature="<AddFilterMenu onAdd />"
          desc="Grouped select of every supported function; calls onAdd with the chosen name."
        />
        <ApiRow
          signature="<FilterPreview value mode? onChange? />"
          desc="A busy-background stage with a card driven by the value, a filter ↔ backdrop-filter toggle, plus blur/brightness/contrast/saturate/hue-rotate scrubbers — the showcase."
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="cssFilter<S extends string>(value: S & FilterLiteral<S>): S"
          desc="Call-site validator. Mirrors cssTransform() / cssCalc() / color() / easing()."
        />
        <ApiRow
          signature="parseFilter(src: string): FilterItem[] | null"
          desc="String → typed items, or null on unknown-function / arity / syntax error. `none` and empty → []. Tolerates calc()/var() args and a leading-color drop-shadow."
        />
        <ApiRow
          signature="formatFilter(items: FilterItem[]): string"
          desc="Canonical re-serialization (single spaces; drop-shadow color-last). Empty list → `none`."
        />
        <ApiRow
          signature="itemToCss(item: FilterItem): string"
          desc="One item → its CSS function string."
        />
        <ApiRow
          signature="filterFunctions(src: string): string[]"
          desc="Runtime mirror of FunctionsOf — the function names in order."
        />
        <ApiRow
          signature="defaultItem(fn): FilterItem"
          desc="Seed a fresh row with sensible defaults (blur(4px), brightness(1), hue-rotate(90deg), a soft drop-shadow, url(#filter))."
        />
        <ApiRow
          signature="argSpec(fn): { min, max, kind, label }"
          desc="The runtime dispatch table — token-count range, argument kind, and the control label that drive the UI."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "FilterLiteral<S>",
              desc: "Strict validator — S if every function validates (arity + arg dimensions, incl. drop-shadow color), else never.",
            },
            {
              name: "FilterString",
              desc: "Suggestion union: per-function heads + `none`.",
            },
            {
              name: "FilterStringMap / FilterFn",
              desc: "Function → output-string map and its key union.",
            },
            {
              name: "FilterFunctionName / AmountFn",
              desc: "Union of every function name; the amount-function subset.",
            },
            {
              name: "FunctionsOf<S>",
              desc: "Tuple of the function names in a filter string.",
            },
            {
              name: "FunctionCountOf<S>",
              desc: "Number of functions in the list.",
            },
            {
              name: "HasDropShadow<S>",
              desc: "Whether the list contains a drop-shadow (the one function with a color arg).",
            },
            {
              name: "FilterItem",
              desc: "Per-function discriminated-union state (exported for advanced use).",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            Full <strong>function-list dispatch</strong>:{" "}
            <code className="font-mono">SplitBySpace</code> →{" "}
            <code className="font-mono">ParseFunction</code> → a signature table
            validating each function&apos;s arity and every argument&apos;s
            dimension (<code className="font-mono">IsLength</code>/
            <code className="font-mono">IsAngle</code>/
            <code className="font-mono">IsNonNegativeNumber</code>/
            <code className="font-mono">IsPercentage</code>).
          </li>
          <li>
            <code className="font-mono">drop-shadow</code> validates 2–3 lengths
            plus an <em>optional trailing</em> color, checked against the
            color-picker&apos;s <code className="font-mono">ColorLiteral</code>.
            A functional color whose own body has spaces and a slash —{" "}
            <code className="font-mono">rgb(0 0 0 / 0.5)</code> — stays one
            token thanks to the paren-aware split.
          </li>
          <li>
            Strict accepts <strong>color-last only</strong>. A leading-color
            shadow (<code className="font-mono">drop-shadow(red 2px 2px)</code>)
            resolves to <code className="font-mono">never</code> at the type
            level, but the runtime parser accepts it and normalizes to
            color-last. Bare keyword colors (
            <code className="font-mono">red</code>) are not in{" "}
            <code className="font-mono">ColorLiteral</code> — use hex /
            functional colors.
          </li>
          <li>
            Dimension + arity only — numeric values are <em>not</em>{" "}
            range-checked (no &quot;opacity must be ≤ 1&quot;).
          </li>
          <li>
            <code className="font-mono">calc()</code> /{" "}
            <code className="font-mono">var()</code> inside an argument resolve
            to <code className="font-mono">never</code> at the strict tier
            (undecidable at compile time). The runtime parser accepts them — use
            the casual / IntelliSense tier.
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
