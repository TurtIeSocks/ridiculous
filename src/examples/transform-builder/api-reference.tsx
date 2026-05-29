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
      <ApiSection title="TransformBuilder / TransformBuilderPanel">
        <Signature>
          {
            "<TransformBuilder\n  value: TransformString | (string & {})\n  onChange: (next: TransformString) => void\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">TransformBuilder</code> is
          popover-wrapped;{" "}
          <code className="font-mono">TransformBuilderPanel</code> renders the
          same editor inline. Both are controlled.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "TransformString | (string & {})",
              desc: "Current CSS transform value. Required. `none` is the empty state.",
            },
            {
              name: "onChange",
              type: "(next: TransformString) => void",
              desc: "Fires when the edited list changes. Emits the normalized space-separated string (or `none`).",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<TransformFunctionRow item onChange onRemove />"
          desc="One editable function row — a grouped function select, the right per-argument editors, and a remove button. The dispatch made visible."
        />
        <ApiRow
          signature="<ArgEditor fn label kind value onChange />"
          desc="A single argument editor: a numeric field plus a unit select for length/angle slots; unitless for number/percentage slots."
        />
        <ApiRow
          signature="<AddFunctionMenu onAdd />"
          desc="Grouped select of every supported function; calls onAdd with the chosen name."
        />
        <ApiRow
          signature="<TransformPreview3D value onChange? />"
          desc="A perspective scene with a card driven by the value, plus translate/rotate/scale/skew slider scrubbers — the 3D showcase."
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="cssTransform<S extends string>(value: S & TransformLiteral<S>): S"
          desc="Call-site validator. Mirrors cssCalc() / color() / easing()."
        />
        <ApiRow
          signature="parseTransform(src: string): TransformItem[] | null"
          desc="String → typed items, or null on unknown-function / arity / syntax error. `none` and empty → []. Tolerates calc()/var() args."
        />
        <ApiRow
          signature="formatTransform(items: TransformItem[]): string"
          desc="Canonical re-serialization (single spaces). Empty list → `none`."
        />
        <ApiRow
          signature="itemToCss(item: TransformItem): string"
          desc="One item → its CSS function string."
        />
        <ApiRow
          signature="transformFunctions(src: string): string[]"
          desc="Runtime mirror of FunctionsOf — the function names in order."
        />
        <ApiRow
          signature="defaultItem(fn): TransformItem"
          desc="Seed a fresh row with sensible defaults (translateX(0px), rotate(0deg), scale(1), identity matrix, …)."
        />
        <ApiRow
          signature="argSpec(fn): { min, max, kinds, labels }"
          desc="The runtime dispatch table — arity range, per-slot dimension kinds, and axis labels that drive the UI."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "TransformLiteral<S>",
              desc: "Strict validator — S if every function validates (arity + arg dimensions), else never.",
            },
            {
              name: "TransformString",
              desc: "Suggestion union: per-function heads + `none`.",
            },
            {
              name: "TransformStringMap / TransformFn",
              desc: "Function → output-string map and its key union.",
            },
            {
              name: "TransformFunctionName",
              desc: "Union of every supported function name.",
            },
            {
              name: "FunctionsOf<S>",
              desc: "Tuple of the function names in a transform string.",
            },
            {
              name: "FunctionCountOf<S>",
              desc: "Number of functions in the list.",
            },
            {
              name: "TransformItem",
              desc: "Per-function discriminated-union state (exported for advanced use).",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            Full <strong>function-name dispatch</strong>:{" "}
            <code className="font-mono">SplitBySpace</code> →{" "}
            <code className="font-mono">ParseFunction</code> → a signature table
            validating each function&apos;s arity and every argument&apos;s
            dimension (<code className="font-mono">IsLength</code>/
            <code className="font-mono">IsAngle</code>/
            <code className="font-mono">IsNumber</code>/
            <code className="font-mono">IsPercentage</code>).
          </li>
          <li>
            Every function is fully validated, including the 16-argument{" "}
            <code className="font-mono">matrix3d</code> — a flat fold over the
            comma list stays well inside the compile budget.
          </li>
          <li>
            Dimension + arity only — numeric values are <em>not</em>{" "}
            range-checked (no &quot;perspective must be positive&quot;).
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
