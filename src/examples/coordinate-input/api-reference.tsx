export function ApiReference() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h3>CoordinateInput</h3>
      <ul>
        <li>
          <code>value: Position</code> — <code>[lon, lat]</code> or{" "}
          <code>[lon, lat, alt]</code>.
        </li>
        <li>
          <code>onChange(next: Position): void</code> — emits the full tuple on
          commit.
        </li>
        <li>
          <code>axes?: "2d" | "3d"</code> — show the elevation axis (default{" "}
          <code>"2d"</code>; a 3-tuple value forces 3d).
        </li>
        <li>
          <code>precision?: number</code> — display decimals (default 6).
        </li>
        <li>
          <code>disabled?</code>, <code>className?</code>,{" "}
          <code>aria-label?</code>.
        </li>
      </ul>
      <h3>Strict helper</h3>
      <p>
        <code>coordinate([lon, lat])</code> validates a numeric-literal tuple
        (lon ±180, lat ±90). Literals only — runtime values use the component +{" "}
        <code>parseCoordinate</code>.
      </p>
      <h3>Runtime helpers</h3>
      <ul>
        <li>
          <code>parseCoordinate(src: string): Position | null</code> — parses{" "}
          <code>"lon, lat[, alt]"</code>.
        </li>
        <li>
          <code>formatCoordinate(pos: Position): string</code> — serializes to{" "}
          <code>"lon, lat[, alt]"</code>.
        </li>
        <li>
          <code>clampLon(n: number): number</code> — clamps to ±180.
        </li>
        <li>
          <code>clampLat(n: number): number</code> — clamps to ±90.
        </li>
      </ul>
    </div>
  )
}
