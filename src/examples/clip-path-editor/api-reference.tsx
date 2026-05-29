import type * as React from "react"

export function ApiReference() {
  return (
    <div className="glass-card space-y-10 rounded-2xl p-6 md:p-8">
      <Section title="ClipPathEditor / ClipPathEditorPanel">
        <Signature>
          {
            '<ClipPathEditor\n  value: ClipPathString | (string & {})\n  onChange: (next: ClipPathString) => void\n  mode?: "clip-path" | "shape-outside"\n  className?: string\n  aria-label?: string\n/>'
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">ClipPathEditor</code> is popover-wrapped;{" "}
          <code className="font-mono">ClipPathEditorPanel</code> renders the
          same editor inline. Both are controlled.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "ClipPathString | (string & {})",
              desc: "Current CSS clip-path value. Required. `none` is the empty state.",
            },
            {
              name: "onChange",
              type: "(next: ClipPathString) => void",
              desc: "Fires when the edited shape changes. Emits the normalized basic-shape string (or `none`).",
            },
            {
              name: "mode",
              type: '"clip-path" | "shape-outside"',
              desc: "Which property the live preview targets. Both share the grammar, so this does NOT narrow the output type. Default `clip-path`.",
            },
          ]}
        />
      </Section>

      <Section title="Sub-components">
        <ApiRow
          signature="<ShapeSelect value onChange />"
          desc="Choose the basic shape (inset / circle / ellipse / polygon) or `none / box only`."
        />
        <ApiRow
          signature="<GeometryBoxSelect value onChange />"
          desc="The optional geometry-box keyword (margin/border/padding/content/fill/stroke/view-box, or none)."
        />
        <ApiRow
          signature="<InsetControls state onChange />"
          desc="Four length-percentage editors (top/right/bottom/left) plus an optional round radius."
        />
        <ApiRow
          signature="<CircleControls state onChange /> · <EllipseControls state onChange />"
          desc="Radius editor(s) — a length-% or a closest-side/farthest-side keyword — plus an optional `at <position>` clause."
        />
        <ApiRow
          signature="<PolygonControls state onChange />"
          desc="A fill-rule select and a list of vertex rows (add / remove / edit each x,y; min 3)."
        />
        <ApiRow
          signature="<LengthPctEditor label value onChange />"
          desc="A numeric field + unit select (%, px, rem, em, vw, vh) for a <length-percentage> slot; raw text for opaque calc()/var()."
        />
        <ApiRow
          signature="<ClipPathPreview value mode? onChange? />"
          desc="The showcase: a masked surface with the live clip-path / shape-outside, draggable SVG vertex handles for polygons (pointer drag → percentage vertices; arrow keys nudge), a clip-path ↔ shape-outside toggle, and a UnitInput radius scrub for circle/ellipse."
        />
      </Section>

      <Section title="Runtime helpers">
        <ApiRow
          signature="cssClipPath<S extends string>(value: S & ClipPathLiteral<S>): S"
          desc="Call-site validator. Mirrors cssFilter() / cssTransform() / cssCalc() / color() / easing()."
        />
        <ApiRow
          signature="parseClipPath(src: string): ClipPathState | null"
          desc="String → typed state, or null on unknown-shape / arity / double-box / syntax error. `none` and empty → { shape: null }. Tolerates calc()/var() coordinates and a leading or trailing geometry box."
        />
        <ApiRow
          signature="formatClipPath(state: ClipPathState): string"
          desc="Canonical re-serialization (fill-rule first, single spaces, box per stored position). Null shape with no box → `none`."
        />
        <ApiRow
          signature="shapeToCss(shape: ClipPathShapeState): string"
          desc="One shape → its CSS function string."
        />
        <ApiRow
          signature="shapeName(src: string): string"
          desc="Runtime mirror of ShapeOf — the shape name, `box`, or `none`."
        />
        <ApiRow
          signature="polygonVertices(src: string): Array<{ x; y }>"
          desc="The polygon's vertices in order, or [] if the value is not a polygon."
        />
        <ApiRow
          signature="defaultShape(shape): ClipPathShapeState"
          desc="Seed a fresh shape with sensible defaults (centered circle/ellipse, a 10% inset, a triangle polygon)."
        />
      </Section>

      <Section title="Types">
        <TypesList
          rows={[
            {
              name: "ClipPathLiteral<S>",
              desc: "Strict validator — S if the shape (arity + each argument's dimension) and optional geometry box validate, else never.",
            },
            {
              name: "ClipPathString",
              desc: "Suggestion union: per-shape heads (± a leading/trailing box), a bare box, and `none`.",
            },
            {
              name: "ClipPathStringMap / ClipPathShape",
              desc: "Shape → output-string map and its key union.",
            },
            {
              name: "BasicShapeName / GeometryBox",
              desc: "The four shape names; the seven geometry-box keywords.",
            },
            {
              name: "ShapeOf<S>",
              desc: "The basic shape of a value: the shape name, `box`, or `none`.",
            },
            {
              name: "VertexCountOf<S>",
              desc: "Number of vertices in a polygon (0 otherwise).",
            },
            {
              name: "GeometryBoxOf<S>",
              desc: "The geometry-box keyword present, or `none`.",
            },
            {
              name: "ClipPathState / ClipPathShapeState",
              desc: "The editor's discriminated-union state (exported for advanced use).",
            },
          ]}
        />
      </Section>

      <Section title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            Full <strong>basic-shape dispatch</strong>:{" "}
            <code className="font-mono">ParseFunction</code> → a per-shape
            validator after peeling an optional leading/trailing geometry box.{" "}
            <code className="font-mono">inset()</code> validates 1–4
            length-percentages; <code className="font-mono">circle()</code> a
            single radius (length-% or keyword) + an{" "}
            <code className="font-mono">at &lt;position&gt;</code> clause;{" "}
            <code className="font-mono">ellipse()</code> exactly two radii + a
            position; <code className="font-mono">polygon()</code> a variadic
            comma-separated vertex list where each vertex is two
            length-percentages.
          </li>
          <li>
            <code className="font-mono">polygon()</code> validates each vertex
            up to a <strong>32-vertex depth cap</strong>; beyond that the tail
            is weak-validated (accepted without per-coordinate checks) to bound{" "}
            <code className="font-mono">tsc</code>. The runtime parser validates
            every vertex regardless.
          </li>
          <li>
            At most <strong>one geometry box</strong>, leading or trailing; a
            bare box is valid. A double box (
            <code className="font-mono">border-box circle() padding-box</code>)
            resolves to <code className="font-mono">never</code>.
          </li>
          <li>
            <strong>Weak-validated / deferred:</strong> the{" "}
            <code className="font-mono">inset()</code> round radius tail
            (presence + non-empty), 3/4-token edge-offset{" "}
            <code className="font-mono">&lt;position&gt;</code> forms, and
            polygon vertices past the cap. The runtime parser accepts these.
          </li>
          <li>
            <code className="font-mono">calc()</code> /{" "}
            <code className="font-mono">var()</code> inside an argument resolve
            to <code className="font-mono">never</code> at the strict tier
            (undecidable at compile time) — use the casual / IntelliSense tier.
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
