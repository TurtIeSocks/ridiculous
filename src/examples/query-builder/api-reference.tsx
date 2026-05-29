import type * as React from "react"

export function ApiReference() {
  return (
    <div className="glass-card space-y-10 rounded-2xl p-6 md:p-8">
      <Section title="QueryBuilder / QueryBuilderPanel">
        <Signature>
          {
            '<QueryBuilder\n  value: QueryString | (string & {})\n  onChange: (next: QueryString) => void\n  mode?: "media" | "container"  // default "media"\n  className?: string\n  aria-label?: string\n/>'
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">QueryBuilder</code> is popover-wrapped;{" "}
          <code className="font-mono">QueryBuilderPanel</code> renders the same
          editor inline. Both are controlled. The{" "}
          <code className="font-mono">mode</code> prop selects the media or
          container dialect.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "QueryString | (string & {})",
              desc: "Current query condition string. Required. An empty / unparseable value renders an empty test list.",
            },
            {
              name: "onChange",
              type: "(next: QueryString) => void",
              desc: "Fires when the query changes. Emits the canonical condition string.",
            },
            {
              name: "mode",
              type: '"media" | "container"',
              desc: 'Dialect. Default "media". Container restricts the feature set to the size subset + orientation and shows a name input instead of a media-type select.',
            },
          ]}
        />
      </Section>

      <Section title="Sub-components">
        <ApiRow
          signature="<FeatureTestRow mode test onChange onRemove index? />"
          desc="One parenthesized feature test: a feature select, a shape select (exists / : value / op value / range), operator selects, and value field(s) — a unit-input for lengths, a keyword select for enums, a plain input otherwise."
        />
        <ApiRow
          signature="<MediaTypeSelect modifier mediaType onChange />"
          desc="Media only: the only/not modifier + all|screen|print type (with an (any) no-type option)."
        />
        <ApiRow
          signature="<ContainerNameInput name onChange />"
          desc="Container only: the optional container-name input."
        />
        <ApiRow
          signature="<JoinerSelect value onChange />"
          desc="The single and/or joiner for the flat test list — one joiner keeps the no-mix rule satisfied by construction."
        />
        <ApiRow
          signature="<NotToggle checked onChange />"
          desc="A top-level not toggle (negates the whole condition)."
        />
        <ApiRow
          signature="<QueryPreview value mode />"
          desc="Live match indicator. Media mode reads window.matchMedia and updates on change; container mode shows an explanatory note (no global live-match API)."
        />
      </Section>

      <Section title="Runtime helpers">
        <ApiRow
          signature="cssMediaQuery<S>(value: S & MediaQueryLiteral<S>): S"
          desc="Call-site validator for a media query. Mirrors cssIf() / cssTransform()."
        />
        <ApiRow
          signature="cssContainerQuery<S>(value: S & ContainerQueryLiteral<S>): S"
          desc="Call-site validator for a container query."
        />
        <ApiRow
          signature="parseQuery(src, mode): { node: QueryNode | null; error: string | null }"
          desc="String → a parsed condition tree (strips the leading modifier/type or name), or an error. Parses unknown features too (superset of the strict tier)."
        />
        <ApiRow
          signature="parseQueryState(src, mode): QueryState | null"
          desc="String → the flat editor state (lead + single joiner + not + test list). Drives the row editor."
        />
        <ApiRow
          signature="formatQuery(node, mode): string  ·  queryToString(state): string"
          desc="Canonical re-serialization of a parsed node, and of the flat editor state."
        />
        <ApiRow
          signature="featureKind(feature, mode)  ·  featuresFor(mode)  ·  enumOptionsFor(feature)"
          desc="Table lookups: a feature's class (length/resolution/ratio/integer/enum/unknown); the select options for a mode (incl. min-/max- variants); an enum feature's keyword options."
        />
        <ApiRow
          signature="matchesNow(query, mode): boolean | null"
          desc="Media only — window.matchMedia(query).matches; null for container mode or when matchMedia is unavailable."
        />
        <ApiRow
          signature="defaultFeatureTest(mode)  ·  defaultQuery(mode)"
          desc="Seed a fresh feature test / a one-test query state for a mode."
        />
      </Section>

      <Section title="Types">
        <TypesList
          rows={[
            {
              name: "MediaQueryLiteral<S> / ContainerQueryLiteral<S>",
              desc: "Strict validators — S if S is a structurally + dimensionally valid query, else never.",
            },
            {
              name: "MediaQueryString / ContainerQueryString / QueryString",
              desc: "Suggestion unions (query-shaped strings). QueryString is the onChange return type.",
            },
            {
              name: "QueryStringMap / QueryMode",
              desc: "Mode → output-string map, and the mode discriminant (media | container).",
            },
            {
              name: "FeatureOperator / MediaType / MediaModifier",
              desc: "The operator union (< <= > >= =), the media types (all|screen|print), and modifiers (only|not).",
            },
            {
              name: "Orientation / Pointer / PrefersColorScheme / …",
              desc: "Per-feature enum keyword unions (exported for IntelliSense).",
            },
            {
              name: "FeaturesOf<S> / FeatureCountOf<S>",
              desc: "Tuple of the top-level feature names used in a query; and its length.",
            },
            {
              name: "FeatureTest / QueryNode / QueryState",
              desc: "The internal discriminated-union state (a feature test by kind; a parsed node; the flat editor state). Exported for advanced use.",
            },
          ]}
        />
      </Section>

      <Section title="Strict-tier scope (validated vs deferred)">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            <strong>Validated:</strong> balanced parens; the optional leading{" "}
            <code className="font-mono">only</code>/
            <code className="font-mono">not</code> + media-type or container
            name; the top-level boolean split with the{" "}
            <strong>no-mixing-and/or</strong> rule (mix requires parens); each
            feature is in the known table for the mode; each value&apos;s{" "}
            <strong>dimension</strong> matches the feature (
            <code className="font-mono">&lt;length&gt;</code> /{" "}
            <code className="font-mono">&lt;resolution&gt;</code> /{" "}
            <code className="font-mono">&lt;ratio&gt;</code> /{" "}
            <code className="font-mono">&lt;integer&gt;</code>) or its enum
            keyword.
          </li>
          <li>
            <strong>Deferred (lenient → runtime parser):</strong> unknown/exotic
            features resolve to <code className="font-mono">never</code> in
            strict (use the casual tier); operator-direction consistency in a
            3-part range; the illegal{" "}
            <code className="font-mono">(min-width &gt; 600px)</code> combo;{" "}
            <code className="font-mono">calc()</code>/
            <code className="font-mono">var()</code> values; and nesting past a
            depth cap of 4.
          </li>
          <li>
            Container <strong>style</strong> queries (
            <code className="font-mono">style(--x: 1)</code>) are out of strict
            scope; the size-feature subset is validated, style queries are
            preserved verbatim by the runtime parser.
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
