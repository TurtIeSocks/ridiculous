import type * as React from "react"

export function ApiReference() {
  return (
    <div className="glass-card space-y-10 rounded-2xl p-6 md:p-8">
      <Section title="FontEditor / FontEditorPanel">
        <Signature>
          {
            "<FontEditor\n  value: FontString | (string & {})\n  onChange: (next: FontString) => void\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">FontEditor</code> is popover-wrapped;{" "}
          <code className="font-mono">FontEditorPanel</code> renders the same
          editor inline. Both are controlled.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "FontString | (string & {})",
              desc: "Current CSS font value. Required. A shorthand or a system-font keyword.",
            },
            {
              name: "onChange",
              type: "(next: FontString) => void",
              desc: "Fires when the edited font changes. Emits the canonically-ordered string (or the system keyword).",
            },
          ]}
        />
      </Section>

      <Section title="Sub-components">
        <ApiRow
          signature="<FontPreview value sampleText? editable? />"
          desc="The live text preview — renders sample text with the built `font` shorthand applied inline. Editable sample text by default; pass sampleText for a fixed string."
        />
        <ApiRow
          signature="<FamilyEditor value onChange />"
          desc="The comma-separated family-list editor: edit/remove tokens and add from a web-safe + generic family list. Emits string[]."
        />
        <ApiRow
          signature="<PropertyField label>{control}</PropertyField>"
          desc="A labelled control row used by the panel; exported for composition."
        />
      </Section>

      <Section title="Runtime helpers">
        <ApiRow
          signature="cssFont<S extends string>(value: S & FontLiteral<S>): S"
          desc="Call-site validator. Mirrors cssTransform() / color() / easing()."
        />
        <ApiRow
          signature="parseFont(src: string): FontParts | null"
          desc="String → typed parts, or null on missing size / missing family / duplicate prefix kind / junk. A system keyword → { kind: 'system' }. Tolerates var() family tokens."
        />
        <ApiRow
          signature="formatFont(parts: FontParts): string"
          desc="Canonical re-serialization: style variant weight stretch size[/lh] family. System keyword → itself."
        />
        <ApiRow
          signature="fontFamilies(src: string): string[]"
          desc="Runtime mirror of FamiliesOf — the comma-separated family tokens in order."
        />
        <ApiRow
          signature="defaultParts(): FontParts"
          desc="Seed a fresh editor: { kind: 'shorthand', size: '16px', family: ['sans-serif'] }."
        />
        <ApiRow
          signature="classifyStyle / classifyWeight / classifySize / classifyFamilyToken / …"
          desc="Per-slot token classifiers (runtime mirror of the type predicates) plus the option-list constants that drive the UI."
        />
      </Section>

      <Section title="Types">
        <TypesList
          rows={[
            {
              name: "FontLiteral<S>",
              desc: "Strict validator — S if the ordered grammar holds (prefix ≤1 each → size → /lh? → family), else never. System keywords pass.",
            },
            {
              name: "FontString",
              desc: "Suggestion union: system keywords + any space-containing shorthand. Also the onChange return type.",
            },
            {
              name: "FontStringMap / FontStringKey",
              desc: "Representative output-string shapes and the key union.",
            },
            {
              name: "SystemFontKeyword / FontGenericFamily",
              desc: "The system-font keywords and the generic font-family keywords.",
            },
            {
              name: "IsSystemFont<S>",
              desc: "true when S is a system-font keyword.",
            },
            {
              name: "FamiliesOf<S>",
              desc: "Tuple of the comma-separated family tokens.",
            },
            {
              name: "SizeOf<S> / LineHeightOf<S>",
              desc: "The size token, and the line-height token (never when absent).",
            },
            {
              name: "FontParts",
              desc: "Discriminated-union state (system | shorthand), exported for advanced use.",
            },
          ]}
        />
      </Section>

      <Section title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            Full <strong>ordered parse</strong>: an order-free prefix (
            <code className="font-mono">style</code> /{" "}
            <code className="font-mono">variant</code> /{" "}
            <code className="font-mono">weight</code> /{" "}
            <code className="font-mono">stretch</code>, each at most once) →
            mandatory <code className="font-mono">&lt;size&gt;</code> → optional{" "}
            <code className="font-mono">/ &lt;line-height&gt;</code> (attached{" "}
            <code className="font-mono">16px/1.5</code> and every spaced form) →
            mandatory comma-separated{" "}
            <code className="font-mono">&lt;font-family&gt;</code> list. System
            keywords (<code className="font-mono">caption</code>…
            <code className="font-mono">status-bar</code>) pass as a whole
            value.
          </li>
          <li>
            Rejects (→ <code className="font-mono">never</code>): missing size,
            missing family, duplicate prefix kind, line-height without a size,
            empty / garbage.
          </li>
          <li>
            <strong>Weak-validated</strong> (documented): bare{" "}
            <code className="font-mono">&lt;custom-ident&gt;</code> family names
            are accepted as ident-safe (letters/digits/<code>-</code>/
            <code>_</code>/spaces; quoted strings accept any content). The{" "}
            <code className="font-mono">&lt;number&gt;</code> weight range
            1–1000 is not bound-checked.
          </li>
          <li>
            A leading <code className="font-mono">normal</code> consumes the
            first free prefix kind — sound for acceptance (CSS treats prefix{" "}
            <code className="font-mono">normal</code> as a no-op).{" "}
            <code className="font-mono">oblique &lt;angle&gt;</code> is deferred
            (only bare <code className="font-mono">oblique</code> validates
            strictly).
          </li>
          <li>
            <code className="font-mono">var()</code> /{" "}
            <code className="font-mono">calc()</code> resolve to{" "}
            <code className="font-mono">never</code> at the strict tier
            (undecidable). The runtime parser accepts them — use the casual /
            IntelliSense tier.
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
