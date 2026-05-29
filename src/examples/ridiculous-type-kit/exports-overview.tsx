interface ExportGroup {
  label: string
  blurb: string
  names: string[]
}

const GROUPS: ExportGroup[] = [
  {
    label: "Characters & logic",
    blurb:
      "String walking, trimming, and the boolean combinators every validator is built from.",
    names: [
      "Digit",
      "HexDigit",
      "WS",
      "TrimLeft",
      "TrimRight",
      "Trim",
      "AllChars",
      "NonEmptyAllChars",
      "And",
      "Or",
      "Not",
      "KeepIf",
      "Length",
    ],
  },
  {
    label: "Numbers & ranges",
    blurb:
      "Range-checked numeric validators — the type-level math that rejects out-of-gamut tokens.",
    names: [
      "IntRange",
      "IsNonNegativeNumber",
      "IsSignedDecimal",
      "IsNumber",
      "IsPositiveInt",
      "IsByte",
      "IsNumber0To1",
      "IsNumber0To100",
      "IsNumber0To360",
      "IsNumber0To400",
      "IsPercent0To100",
    ],
  },
  {
    label: "CSS dimensions",
    blurb:
      "Per-unit predicates plus DimensionOf — classify any value literal as length, angle, time, …",
    names: [
      "IsLength",
      "IsAngle",
      "IsTime",
      "IsResolution",
      "IsPercentage",
      "IsFlex",
      "Dimension",
      "DimensionOf",
    ],
  },
  {
    label: "Parser combinators",
    blurb:
      "Paren-aware splitting and function parsing — the backbone of every list and function grammar.",
    names: [
      "StartsWith",
      "EndsWith",
      "SplitByComma",
      "SplitBySpace",
      "ParseFunction",
    ],
  },
]

export function ExportsOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {GROUPS.map((group) => (
        <div key={group.label} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-lg tracking-tight">
            {group.label}
          </h3>
          <p className="mt-2 text-muted-foreground text-sm">{group.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {group.names.map((name) => (
              <code
                key={name}
                className="rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-foreground text-xs"
              >
                {name}
              </code>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
