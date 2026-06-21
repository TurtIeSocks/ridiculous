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
      <ApiSection title="ShapePathEditor / ShapePathEditorPanel">
        <Signature>
          {
            '<ShapePathEditor\n  value: ShapeString | (string & {})\n  onChange: (next: ShapeString) => void\n  mode?: "clip-path" | "offset-path"  // default "clip-path" (preview only)\n  className?: string\n  aria-label?: string\n/>'
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">ShapePathEditor</code> is popover-wrapped
          (a trigger showing the command count + truncated value);{" "}
          <code className="font-mono">ShapePathEditorPanel</code> renders the
          same editor inline. Both are controlled. The{" "}
          <code className="font-mono">mode</code> prop drives the live preview
          only — both modes share the identical{" "}
          <code className="font-mono">shape()</code> grammar and validator.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "ShapeString | (string & {})",
              desc: "Current shape() value string. Required. An empty / unparseable value seeds the default shape (a triangle).",
            },
            {
              name: "onChange",
              type: "(next: ShapeString) => void",
              desc: "Fires on every edit (canvas drag/nudge, row change, add/remove/reorder). Emits the canonical re-serialized shape() string.",
            },
            {
              name: "mode",
              type: '"clip-path" | "offset-path"',
              desc: 'Which property the live preview targets. Default "clip-path" (clips a box). "offset-path" animates a dot along the path. Does NOT change validation or the onChange output.',
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<ShapeCanvas value onChange className />"
          desc="The draggable SVG path canvas. One node per command endpoint, a draggable Bézier control handle (with a connector line) per curve/smooth control point, and an arc endpoint node — each a labelled handle with arrow-key nudge. Dragging re-serializes via updatePoint → onChange. Omit onChange for a read-only canvas."
        />
        <ApiRow
          signature="<CommandRow index command onChange onRemove onMoveUp onMoveDown canMoveUp canMoveDown />"
          desc="One command's editor: a command-kind MiniSelect, a by/to toggle, coordinate unit-inputs, and the with/of/flag fields shown per kind. Includes remove + up/down reorder controls."
        />
        <ApiRow
          signature="<ShapePreview value mode />"
          desc="The live preview. clip-path mode clips a gradient box; offset-path mode animates a dot. Gated on CSS.supports('clip-path: shape(...)'); degrades to a raw SVG path render + a support note (Chrome 137 / Safari 18.4) where shape() is unavailable."
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
          signature="cssShape<S>(value: S & ShapeLiteral<S>): S"
          desc="Call-site validator for a shape() value. Mirrors cssClipPath() / cssTransform()."
        />
        <ApiRow
          signature="parseShape(src): { fillRule; from; commands; error }"
          desc="String → editor state. The runtime superset of the strict tier: tokenizes the shape() body into a fillRule, a from seed, and a discriminated ShapeCommand[], surfacing a parse error string for malformed input."
        />
        <ApiRow
          signature="formatShape(shape): string"
          desc="Canonical re-serialization of the parsed { fillRule, from, commands } back to a shape() string."
        />
        <ApiRow
          signature="shapeToPoints(shape): CanvasPoint[]  ·  updatePoint(shape, id, x, y)"
          desc="Canvas geometry: project endpoints + Bézier control handles into a flat list of draggable { id, role, cmdIndex, x, y } points in a normalized 0..200 px space, and write one back. hline/vline/close contribute no points."
        />
        <ApiRow
          signature="commandNames()  ·  isCommandName(name)  ·  commandArity(kind)  ·  defaultShape()"
          desc="The eight command names (the strict whitelist), a name guard, the coordinate-count per command kind, and a sensible default shape() seed."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "ShapeLiteral<S>",
              desc: "Strict validator — S if S is a valid shape() value, else never. Per-command dispatch is the namesake.",
            },
            {
              name: "ShapeString",
              desc: "Suggestion union (a shape(…)-prefixed template-literal string | (string & {})). The onChange return type.",
            },
            {
              name: "CommandsOf<S> / CommandCountOf<S>",
              desc: "The command segment tuple of a shape() value (everything after the from seed), and its length.",
            },
            {
              name: "ShapeCommandName",
              desc: "The eight <shape-command> names (move | line | hline | vline | curve | smooth | arc | close).",
            },
            {
              name: "ShapeCommand / Point / ShapeValue",
              desc: "The internal editor state: a discriminated command union (by kind), an { x, y } coordinate pair, and the full { fillRule, from, commands }. Exported for advanced use.",
            },
            {
              name: "CanvasPoint / PointRole",
              desc: "A draggable canvas point ({ id, role, cmdIndex, x, y }) and its role tag (endpoint | control | control2).",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope (validated vs deferred)">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            <strong>Validated:</strong> the{" "}
            <code className="font-mono">shape()</code> wrapper + optional
            fill-rule; the <code className="font-mono">from</code> seed; each
            command name; <strong>per-command arity</strong>; the{" "}
            <code className="font-mono">by</code>/
            <code className="font-mono">to</code>,{" "}
            <code className="font-mono">with</code>, and{" "}
            <code className="font-mono">of</code> keyword slots; and every
            coordinate&apos;s dimension as a{" "}
            <code className="font-mono">&lt;length-percentage&gt;</code> (
            <code className="font-mono">wiggle to 10px 10px</code> →{" "}
            <code className="font-mono">never</code>;{" "}
            <code className="font-mono">line to 100px</code> →{" "}
            <code className="font-mono">never</code>;{" "}
            <code className="font-mono">curve to 10px 10px</code> without{" "}
            <code className="font-mono">with</code> →{" "}
            <code className="font-mono">never</code>).
          </li>
          <li>
            <strong>Deferred (lenient → runtime parser):</strong> the{" "}
            <code className="font-mono">hline</code>/
            <code className="font-mono">vline</code> keyword positions (
            <code className="font-mono">left</code>/
            <code className="font-mono">center</code>/…, accepted only as{" "}
            <code className="font-mono">&lt;length-percentage&gt;</code> in
            strict); the order-free <code className="font-mono">arc</code> flags
            (<code className="font-mono">cw</code>/
            <code className="font-mono">ccw</code>/
            <code className="font-mono">large</code>/
            <code className="font-mono">small</code>/
            <code className="font-mono">rotate &lt;angle&gt;</code>, a lenient
            trailing tail); a <code className="font-mono">curve</code>&apos;s
            optional second control point validated only if present; and{" "}
            <code className="font-mono">calc()</code>/
            <code className="font-mono">var()</code> coordinates.
          </li>
          <li>
            Path closure, self-intersection, and geometric validity are never
            checked — out of strict scope.
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
