import { RADIUS_KEYWORDS } from "../clip-path-editor.constants"
import { LengthPctEditor } from "./length-pct"

/** A length-% editor OR a sizing keyword (`closest-side`/`farthest-side`). */
export function RadiusEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const isKeyword = (RADIUS_KEYWORDS as readonly string[]).includes(value)
  return (
    <span className="inline-flex items-center gap-1">
      {isKeyword ? (
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded border bg-background px-1 font-mono text-xs"
        >
          {RADIUS_KEYWORDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      ) : (
        <LengthPctEditor label={label} value={value} onChange={onChange} />
      )}
      <button
        type="button"
        aria-label={`${label} toggle keyword`}
        onClick={() => onChange(isKeyword ? "50%" : "closest-side")}
        className="rounded border px-1 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted"
      >
        {isKeyword ? "lp" : "kw"}
      </button>
    </span>
  )
}
