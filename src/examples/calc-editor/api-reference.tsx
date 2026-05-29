import type * as React from "react"

export function ApiReference() {
  return (
    <div className="glass-card space-y-10 rounded-2xl p-6 md:p-8">
      <Section title="CalcEditor / CalcEditorPanel">
        <Signature>
          {
            "<CalcEditor\n  value: CalcString | (string & {})\n  onChange: (next: CalcString) => void\n  fn?: 'calc' | 'clamp' | 'min' | 'max'\n  referenceViewport?: number\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">CalcEditor</code> is popover-wrapped;{" "}
          <code className="font-mono">CalcEditorPanel</code> renders the same
          editor inline. Both are controlled.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "CalcString | (string & {})",
              desc: "Current CSS math expression. Required.",
            },
            {
              name: "onChange",
              type: "(next) => void",
              desc: "Fires only when the edited expression is dimensionally valid. Return type narrows by `fn`.",
            },
            {
              name: "fn",
              type: "CalcFn?",
              desc: "Lock the outer function to calc/clamp/min/max. Narrows onChange to that flavor.",
            },
            {
              name: "referenceViewport",
              type: "number",
              desc: "Viewport width (px) for the computed-value readout. Default 1280.",
            },
          ]}
        />
      </Section>

      <Section title="Sub-components">
        <ApiRow
          signature="<ExpressionField value onChange dimension? error? />"
          desc="The text field + live validity/dimension badge."
        />
        <ApiRow
          signature="<TokenPalette onInsert />"
          desc="Click-to-insert operators, units, functions, and var()."
        />
        <ApiRow
          signature="<FluidTypePlayground expression minViewport? maxViewport? />"
          desc="Viewport-width slider with a live computeCalc readout — the clamp() showcase."
        />
      </Section>

      <Section title="Runtime helpers">
        <ApiRow
          signature="cssCalc<S extends string>(value: S & CalcLiteral<S>): S"
          desc="Call-site validator. Mirrors color() and easing()."
        />
        <ApiRow
          signature="parseCalc(src: string): CalcNode | null"
          desc="String → AST, or null on any syntax error."
        />
        <ApiRow
          signature="evaluateCalc(src: string): { node, dimension, error }"
          desc="Parse + dimension-check facade the editor calls each keystroke."
        />
        <ApiRow
          signature="calcDimension(node: CalcNode): Dimension | null"
          desc="Resolve an AST to its dimension, or null on a unit conflict. var()-tolerant."
        />
        <ApiRow
          signature="computeCalc(node, ctx): number | null"
          desc="Numeric evaluation resolving px/rem/vw/% against a ComputeContext. Null when var() blocks it."
        />
        <ApiRow
          signature="formatCalc(node: CalcNode): CalcString"
          desc="Canonical re-serialization (normalized spacing)."
        />
        <ApiRow
          signature="tokenizeCalc(src: string): Token[]"
          desc="Lexer — numbers (with units), idents, operators, parens, commas."
        />
      </Section>

      <Section title="Types">
        <TypesList
          rows={[
            {
              name: "CalcLiteral<S>",
              desc: "Strict validator — S if dimensionally valid, else never.",
            },
            {
              name: "CalcString",
              desc: "Suggestion union: calc()/clamp()/min()/max().",
            },
            {
              name: "CalcStringMap / CalcFn",
              desc: "Function → output-string map for `fn` narrowing.",
            },
            {
              name: "FunctionOf<S>",
              desc: "Outer function family of a literal.",
            },
            {
              name: "DimensionOfCalc<S>",
              desc: "Resolved dimension of a literal at the type level.",
            },
            {
              name: "ArgCountOf<S>",
              desc: "Top-level comma-argument count of the outer function.",
            },
            {
              name: "CalcNode",
              desc: "Parse-tree discriminated union (exported for advanced use).",
            },
          ]}
        />
      </Section>

      <Section title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            Full dimensional algebra: <code className="font-mono">+ -</code>{" "}
            require equal dimensions; <code className="font-mono">*</code> needs
            a number operand; <code className="font-mono">/</code> needs a
            number divisor. <code className="font-mono">%</code> is its own
            dimension.
          </li>
          <li>
            Evaluation is right-associative at the type level — dimensionally
            lossless. The runtime parser applies real{" "}
            <code className="font-mono">* /</code> precedence for the computed
            value.
          </li>
          <li>
            Nesting is depth-capped at 8 levels (weak-accept beyond); the
            runtime parser is uncapped.
          </li>
          <li>
            <code className="font-mono">var()</code> is undecidable at compile
            time, so the strict tier rejects it. The runtime treats it as
            dimension-agnostic — use the casual / IntelliSense tier for{" "}
            <code className="font-mono">var()</code> expressions.
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
