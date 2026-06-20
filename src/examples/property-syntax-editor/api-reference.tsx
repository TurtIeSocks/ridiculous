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
      <ApiSection title="PropertySyntaxEditor / PropertySyntaxEditorPanel">
        <Signature>
          {
            "<PropertySyntaxEditor\n  value: SyntaxString | (string & {})\n  onChange: (next: SyntaxString) => void\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">PropertySyntaxEditor</code> is
          popover-wrapped (a trigger showing a{" "}
          <code className="font-mono">syntax</code> badge + the truncated
          descriptor);{" "}
          <code className="font-mono">PropertySyntaxEditorPanel</code> renders
          the same editor inline. Both are controlled and single-valued — the
          controlled <code className="font-mono">value</code> is the{" "}
          <strong>syntax string</strong>. The initial-value field is a live demo
          of the dependency, held as panel-local state (it is NOT emitted via{" "}
          <code className="font-mono">onChange</code>).
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "SyntaxString | (string & {})",
              desc: "Current @property syntax descriptor string. Required. An empty / unparseable value seeds an empty editor.",
            },
            {
              name: "onChange",
              type: "(next: SyntaxString) => void",
              desc: "Fires when the descriptor changes. Emits the canonical syntax string (formatSyntax). The initial-value / inherits demo fields do NOT fire onChange.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<SyntaxChipBuilder universal components onChange />"
          desc="A palette of <data-type> buttons + an add-literal-ident input append OR'd components, rendered as pills with a visible | between them. Each chip has a none/+/# multiplier segmented control (labelled buttons with aria-pressed), reorder ←/→, and remove. A * universal switch is exclusive — flipping it on clears the chips."
        />
        <ApiRow
          signature="<InitialValueField syntax value inherits onValueChange onInheritsChange />"
          desc="The live demo of the dependent type: a candidate initial-value <input>, a green/red status badge (role=status) driven by matchesSyntax (the runtime mirror of InitialValueLiteral), and the inherits descriptor toggle. <color> defers to color-picker's isColorString — #ff0000 valid, red rejected."
        />
        <ApiRow
          signature="<MiniSelect value options onChange />"
          desc="The local compact <select> chrome. Each component owns its copy (registry self-containment) — it is not imported from query-builder."
        />
      </ApiSection>

      <ApiSection title="Validators (call-site helpers)">
        <ApiRow
          signature="cssSyntax<S>(value: S & SyntaxLiteral<S>): S"
          desc="Strict validator for a @property syntax descriptor. S if S is a valid <syntax>, else never. Validates universal *, | alternation, single +/# multiplier, and known data types / literal idents."
        />
        <ApiRow
          signature="cssProperty<Syn, Init>(syntax: Syn & SyntaxLiteral<Syn>, initialValue: Init & InitialValueLiteral<Syn, Init>): { syntax; initialValue }"
          desc={
            'The crown jewel — one CSS string typing another. Type-checks ONLY when the initialValue satisfies the declared syntax; a mismatch resolves the initialValue argument to never. cssProperty("<length>", "red") → never.'
          }
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="parseSyntax(src): { universal; components; error }"
          desc="String → editor state. The runtime superset of the strict tier: classifies the structure (universal *, the | alternation, each component's <data-type>-or-ident base + optional single +/# multiplier) and surfaces an error."
        />
        <ApiRow
          signature="formatSyntax(universal, components): string"
          desc="Serialize the editor state back to a canonical syntax string. universal → '*'; otherwise components join with ' | '."
        />
        <ApiRow
          signature="matchesSyntax(syntax, value): boolean"
          desc="Whether a candidate initial-value satisfies a syntax — the runtime mirror of InitialValueLiteral. Uses isColorString (color-picker) for <color>, a real integer check for <integer>, and kit-equivalent dimension regexes for the rest."
        />
        <ApiRow
          signature="dataTypeNames()  ·  defaultSyntax()  ·  defaultInitialValue(syntax)"
          desc="The palette option source (every <data-type> name), a sensible seed descriptor, and a representative initial-value for a syntax string."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "SyntaxLiteral<S>",
              desc: "Strict validator — S if S is a valid @property syntax descriptor, else never.",
            },
            {
              name: "InitialValueLiteral<Syntax, V>",
              desc: "The dependent validator (the namesake) — V if V satisfies Syntax, else never. One validated value string constraining another's type.",
            },
            {
              name: "SyntaxString / DataTypeName / MultiplierToken",
              desc: "The suggestion union (descriptor-shaped string, the onChange return), the data-type name union, and the multiplier token ('' | '+' | '#').",
            },
            {
              name: "ComponentsOf<S> / SatisfiesBase<Tok, Base>",
              desc: "The syntax components (split on |), and the per-token predicate. Exported for advanced use.",
            },
            {
              name: "SyntaxComponent / PropertySyntaxState",
              desc: "A single chip ({ base, isType, multiplier }) and the internal editor state ({ universal, components, initialValue, inherits }).",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope (validated vs deferred)">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            <strong>Validated:</strong> the full{" "}
            <code className="font-mono">&lt;syntax&gt;</code> grammar (universal{" "}
            <code className="font-mono">*</code>,{" "}
            <code className="font-mono">|</code> alternation,{" "}
            <code className="font-mono">+</code>/
            <code className="font-mono">#</code> multipliers, known data types,
            literal idents); and the initial-value against the syntax for the
            dimensional types, <code className="font-mono">&lt;color&gt;</code>{" "}
            (via color-picker&apos;s{" "}
            <code className="font-mono">ColorLiteral</code>), literal idents,{" "}
            <code className="font-mono">|</code> alternation, and{" "}
            <code className="font-mono">+</code>/
            <code className="font-mono">#</code> multipliers.
          </li>
          <li>
            <strong>Deferred (lenient → runtime parser):</strong>{" "}
            <code className="font-mono">&lt;integer&gt;</code> is checked as{" "}
            <code className="font-mono">&lt;number&gt;</code> at the type level
            (runtime is integer-strict);{" "}
            <code className="font-mono">&lt;image&gt;</code>/
            <code className="font-mono">&lt;url&gt;</code>/
            <code className="font-mono">&lt;transform-function&gt;</code>/
            <code className="font-mono">&lt;transform-list&gt;</code> accept any
            token (large / undecidable grammars); and{" "}
            <code className="font-mono">calc()</code>/
            <code className="font-mono">var()</code> initial values resolve to{" "}
            <code className="font-mono">never</code> in strict (the casual tier
            + runtime accept them).
          </li>
          <li>
            The <code className="font-mono">inherits</code> descriptor is a UI
            toggle, serialized only in an example&apos;s full{" "}
            <code className="font-mono">@property</code> block, not in the
            controlled <code className="font-mono">syntax</code> value.
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
