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
      <ApiSection title="GridBuilder / GridBuilderPanel">
        <Signature>
          {
            '<GridBuilder\n  value: GridTemplateString | (string & {})\n  onChange: (next: GridTemplateString) => void\n  mode?: "columns" | "rows" | "areas"\n  className?: string\n  aria-label?: string\n/>'
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">GridBuilder</code> is popover-wrapped;{" "}
          <code className="font-mono">GridBuilderPanel</code> renders the same
          editor inline. Both are controlled and span all three grid-template
          properties via the mode tab strip.
        </p>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "GridTemplateString | (string & {})",
              desc: "Current template value (a track list or a quoted-areas string). Required. `none` is the empty state.",
            },
            {
              name: "onChange",
              type: "(next: GridTemplateString) => void",
              desc: "Fires on every edit. Emits the normalized string. Spans all modes, so it does NOT narrow per property — see GridTemplateStringMap for per-mode shapes.",
            },
            {
              name: "mode",
              type: '"columns" | "rows" | "areas"',
              desc: "Initial active tab + preview target. columns/rows share the track-list grammar; areas is the painter. Default `columns`.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<TrackListEditor tokens onChange />"
          desc="The columns/rows editor — one row per track (size + unit, function text, or [named-line] idents) plus add-size / add-function / add-[line] buttons."
        />
        <ApiRow
          signature="<TrackTokenRow token onChange onRemove />"
          desc="A single track row, discriminated by token.kind (size | fn | line) with the matching control + a remove button."
        />
        <ApiRow
          signature="<AreasEditor matrix onChange />"
          desc="The grid-template-areas editor — the painter plus row/column steppers."
        />
        <ApiRow
          signature="<AreasPainter matrix onChange />"
          desc="A grid of clickable cells. Clicking cycles a cell through the area-name palette + `.` (null cell), writing the new matrix back. Pure inline-style React."
        />
        <ApiRow
          signature="<GridPreview mode columns rows areas />"
          desc="A real display:grid node (inline styles). columns/rows lay out numbered cells; areas places one cell per named area by its bounding rectangle."
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="cssTracks<S>(value: S & TrackListLiteral<S>): S"
          desc="Call-site track-list validator. Mirrors cssCalc() / cssFilter()."
        />
        <ApiRow
          signature="cssGridAreas<S>(value: S & GridAreasLiteral<S>): S"
          desc="Call-site grid-template-areas validator (shape; rectangle check is runtime)."
        />
        <ApiRow
          signature="parseTracks(src: string): TrackToken[] | null"
          desc="Track list → typed tokens (size | fn | line), or null on a malformed token. `none`/empty → []. Tolerates calc()/var() as opaque fn tokens."
        />
        <ApiRow
          signature="parseAreas(src, { rectangles? }): string[][] | null"
          desc="Areas string → row-major matrix, or null on bad quoting / unequal columns / bad idents. With { rectangles: true } also enforces contiguous rectangles."
        />
        <ApiRow
          signature="validateAreasRectangles(matrix): boolean"
          desc="The type-tier punt, at runtime: every named area must form one contiguous rectangle (rejects L-shapes and split blocks)."
        />
        <ApiRow
          signature="formatTracks / formatAreas / gridAreaFor / areaNames / defaultTrack"
          desc="Canonical re-serialization, the grid-area span string for a name, the distinct area names, and a seed token for a fresh track row."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "TrackListLiteral<S>",
              desc: "Strict track-list validator — S if every token validates (sizes, minmax with inflexible min, fit-content, repeat with recursive tracks, named lines), else never.",
            },
            {
              name: "GridAreasLiteral<S>",
              desc: "Strict areas validator — S if rows are quoted with an equal cell count and valid cells; rectangle-contiguity is RUNTIME (see scope).",
            },
            {
              name: "GridTemplateString",
              desc: "Suggestion union: track-list shapes ∪ quoted-areas rows ∪ `none`. The onChange return type.",
            },
            {
              name: "TrackListString / GridAreasString",
              desc: "The per-property suggestion unions.",
            },
            {
              name: "GridTemplateStringMap / GridMode",
              desc: "mode → output-string shape, and the mode key union.",
            },
            {
              name: "TracksOf<S> / TrackCountOf<S>",
              desc: "Tuple of top-level track tokens (named lines excluded), and its length.",
            },
            {
              name: "AreaRowCountOf<S> / AreaColumnCountOf<S>",
              desc: "Row count and (uniform) column count of an areas string.",
            },
            {
              name: "GridTemplateState / TrackToken",
              desc: "Exported internal state (discriminated by mode) and the parsed track-token union.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            <strong>Track list — full validation.</strong>{" "}
            <code className="font-mono">SplitBySpace</code> →{" "}
            <code className="font-mono">ParseFunction</code> dispatch:{" "}
            <code className="font-mono">minmax</code>'s min is{" "}
            <em>inflexible</em> (a <code className="font-mono">1fr</code> min is{" "}
            <code className="font-mono">never</code>),{" "}
            <code className="font-mono">repeat</code>'s count is a positive int
            or <code className="font-mono">auto-fill</code>/
            <code className="font-mono">auto-fit</code> with a recursively-
            validated track list, <code className="font-mono">fit-content</code>{" "}
            takes a length/percentage, and{" "}
            <code className="font-mono">[idents]</code> are validated.
          </li>
          <li>
            <strong>Areas — shape at the type level.</strong> Quoting + equal
            column count + each cell a valid{" "}
            <code className="font-mono">&lt;ident&gt;</code> or null cell (a run
            of dots).
          </li>
          <li>
            <strong>
              Areas — contiguous-rectangle is a RUNTIME check (the punt).
            </strong>{" "}
            Each area name must span a single filled rectangle. This is
            borderline-undecidable as a template-literal type and would make{" "}
            <code className="font-mono">tsc</code> crawl, so it lives in{" "}
            <code className="font-mono">parseAreas</code> /{" "}
            <code className="font-mono">validateAreasRectangles</code>. The
            strict type tier guarantees a parseable shape; the runtime
            guarantees a valid grid.
          </li>
          <li>
            <code className="font-mono">repeat()</code> nesting is depth-capped
            and auto-repeat's "no intrinsic/flex track" rule is runtime-only —
            syntactic <code className="font-mono">repeat(auto-fill, 1fr)</code>{" "}
            type-checks.
          </li>
          <li>
            <code className="font-mono">calc()</code> /{" "}
            <code className="font-mono">var()</code> resolve to{" "}
            <code className="font-mono">never</code> at the strict tier
            (undecidable). The runtime parser keeps them opaque — use the casual
            / IntelliSense tier.
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
