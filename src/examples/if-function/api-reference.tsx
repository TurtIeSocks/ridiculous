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
      <ApiSection title="IfFunction / IfFunctionPanel">
        <Signature>
          {
            "<IfFunction\n  value: IfFunctionString | (string & {})\n  onChange: (next: IfFunctionString) => void\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">IfFunction</code> is popover-wrapped;{" "}
          <code className="font-mono">IfFunctionPanel</code> renders the same
          editor inline. Both are controlled.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "IfFunctionString | (string & {})",
              desc: "Current CSS if() value. Required. An empty / unparseable value renders an empty branch list.",
            },
            {
              name: "onChange",
              type: "(next: IfFunctionString) => void",
              desc: "Fires when the branch list changes. Emits the canonical `if( b1; b2; … )` string.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<BranchRow branch onChange onRemove allowElse? index? />"
          desc="One editable branch: a condition-kind select, a condition-body input (hidden for `else`, which shows `(always)`), a value input, and a remove button. `allowElse` gates the `else` option (final row only)."
        />
        <ApiRow
          signature="<ConditionKindSelect label value onChange allowElse? />"
          desc="A labelled native select over media / supports / style (+ else when allowElse)."
        />
        <ApiRow
          signature="<AddBranchButton onAdd />"
          desc="Appends a fresh media branch via onAdd."
        />
        <ApiRow
          signature="<IfPreview value />"
          desc="Applies the built if() string to a sample element's color, with a cutting-edge browser-support caption and a graceful fallback."
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="cssIf<S>(value: S & IfFunctionLiteral<S>): S"
          desc="Call-site validator for if(). Mirrors color() / easing() / cssCalc()."
        />
        <ApiRow
          signature="parseIf(src): IfBranch[] | null"
          desc="String → typed branches, or null on a bad wrapper / no branches / a branch without a top-level colon / an empty value / an unknown kind / an unbalanced body / else-not-last. Trailing and interior empty branches are tolerated."
        />
        <ApiRow
          signature="formatIf(branches): string"
          desc="Canonical re-serialization → `if( b1; b2; … )` (kind(condition): value, joined by `; `)."
        />
        <ApiRow
          signature="branchToCss(branch): string"
          desc="One branch → `else: value` or `kind(condition): value`."
        />
        <ApiRow
          signature="branchCount(src): number"
          desc="Runtime mirror of BranchCountOf — the branch count (invalid → 0)."
        />
        <ApiRow
          signature="defaultBranch(kind?): IfBranch"
          desc="Seed a fresh branch (defaults to a media branch with a valid condition + value)."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "IfFunctionLiteral<S>",
              desc: "Strict validator — S if S is a valid if() value (wrapper, branch split, condition kind, else-last, non-empty value), else never. Condition bodies validated leniently.",
            },
            {
              name: "IfFunctionString",
              desc: "Suggestion union — an if(…)-shaped string. The onChange return type.",
            },
            {
              name: "ConditionString / ConditionKind",
              desc: "A single condition suggestion union (media()/supports()/style()/else) and the kind discriminant.",
            },
            {
              name: "BranchesOf<S> / BranchCountOf<S>",
              desc: "Tuple of the raw per-branch strings; and its length.",
            },
            {
              name: "ConditionKindsOf<S>",
              desc: "Tuple of each branch's condition kind.",
            },
            {
              name: "IfBranch",
              desc: "Per-branch record { kind; condition; value }. Exported for advanced use.",
            },
            {
              name: "IfFunctionState",
              desc: "{ branches: IfBranch[] } — the internal editor state; `kind` is the per-branch discriminant.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            The <code className="font-mono">if( … )</code> wrapper is validated
            via the kit&apos;s <code className="font-mono">ParseFunction</code>{" "}
            (name must be <code className="font-mono">if</code>).
          </li>
          <li>
            The body splits on <strong>top-level semicolons</strong> (a local
            paren-aware char-walk; the kit ships no semicolon splitter) into ≥1
            branch. A trailing <code className="font-mono">;</code> is
            tolerated.
          </li>
          <li>
            Each branch splits on its <strong>first top-level colon</strong> —
            so a colon inside <code className="font-mono">style(--x: 1)</code>{" "}
            or a value&apos;s <code className="font-mono">url(a:b)</code> is{" "}
            <em>not</em> the split point.
          </li>
          <li>
            The condition kind must be{" "}
            <code className="font-mono">media()</code> /{" "}
            <code className="font-mono">supports()</code> /{" "}
            <code className="font-mono">style()</code> or a literal{" "}
            <code className="font-mono">else</code> —{" "}
            <code className="font-mono">else</code> permitted{" "}
            <strong>only</strong> as the last branch. The value must be
            non-empty.
          </li>
          <li>
            Condition <strong>bodies</strong> are{" "}
            <strong>weak-validated</strong> (non-empty + balanced parens). The
            internal media-query / supports-condition / style-query grammar is
            deferred to the runtime parser (and the media-query builder
            component).
          </li>
          <li>
            <code className="font-mono">calc()</code> /{" "}
            <code className="font-mono">var()</code> inside a body or value is
            opaque text — accepted as long as parens balance and the slot is
            non-empty.
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
