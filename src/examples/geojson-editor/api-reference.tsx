export function ApiReference() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h3>{"<GeojsonEditor<V> />"}</h3>
      <ul>
        <li>
          <code>value: V</code> / <code>onChange(value: V): void</code> —
          controlled, generic over <code>V extends GeoJSON</code>.
        </li>
        <li>
          <code>variant?: "drill-down" | "dual-pane" | "toggle"</code> (default{" "}
          <code>drill-down</code>).
        </li>
        <li>
          <code>selection?</code> / <code>onSelectionChange?</code> —{" "}
          <code>GeojsonPath</code> seam for a co-mounted map view.
        </li>
        <li>
          <code>lockGeometryType?</code> — disable the type switcher when{" "}
          <code>V</code> is narrowed (e.g. <code>Feature&lt;Polygon&gt;</code>)
          so <code>onChange(V)</code> stays sound.
        </li>
      </ul>
      <h3>Composition</h3>
      <p>
        Wrap <code>{"<GeojsonEditorProvider>"}</code> and compose{" "}
        <code>FeatureTree</code>, <code>GeometryFields</code>,{" "}
        <code>PropertiesGrid</code>, <code>RawJsonPane</code>,{" "}
        <code>ErrorRail</code> — or a custom <code>{"<MapView>"}</code> that
        reads <code>useGeojsonEditorContext()</code>.
      </p>
      <h3>Strict helper</h3>
      <p>
        <code>geojson("…")</code> validates compact canonical GeoJSON geometry
        strings at the type level (geometry-deep; FeatureCollection is a shallow
        tag check — runtime validation covers everything).
      </p>
      <h3>Runtime helpers</h3>
      <ul>
        <li>
          <code>parseGeojson(src: string): {"{ value, errors }"}</code> — parse
          + validate; errors are path-addressed.
        </li>
        <li>
          <code>validateGeojson(value: unknown): GeojsonError[]</code> — RFC
          7946 validator (range, arity, ring closure, winding).
        </li>
        <li>
          <code>formatGeojson(value: GeoJSON): string</code> — pretty-print,
          preserving foreign members.
        </li>
        <li>
          <code>blankGeometry(type)</code> / <code>blankFeature()</code> —
          canonical seed values.
        </li>
        <li>
          <code>closeRing(ring)</code> / <code>reverseRing(ring)</code> — ring
          fix helpers.
        </li>
        <li>
          <code>getAtPath</code> / <code>setAtPath</code> — immutable path
          utilities.
        </li>
      </ul>
    </div>
  )
}
