interface Example {
  expr: string
  result: string
}

interface ApiEntry {
  name: string
  desc: string
  /** For union/alias types: the right-hand side, rendered as `= …`. */
  def?: string
  examples?: Example[]
}

interface ApiGroup {
  label: string
  entries: ApiEntry[]
}

const GROUPS: ApiGroup[] = [
  {
    label: "Characters & logic",
    entries: [
      {
        name: "Digit",
        def: '"0" | "1" | … | "9"',
        desc: "Decimal-digit char union. The allow-list you hand to AllChars.",
        examples: [{ expr: 'AllChars<"42", Digit>', result: "true" }],
      },
      {
        name: "HexDigit",
        def: 'Digit | "a"…"f" | "A"…"F"',
        desc: "Hex-digit char union (both cases).",
        examples: [{ expr: 'AllChars<"FF", HexDigit>', result: "true" }],
      },
      {
        name: "WS",
        def: '" " | "\\n" | "\\t"',
        desc: "The whitespace chars Trim consumes.",
      },
      {
        name: "TrimLeft<S>",
        desc: "Drop leading whitespace.",
        examples: [{ expr: 'TrimLeft<"  x">', result: '"x"' }],
      },
      {
        name: "TrimRight<S>",
        desc: "Drop trailing whitespace.",
        examples: [{ expr: 'TrimRight<"x  ">', result: '"x"' }],
      },
      {
        name: "Trim<S>",
        desc: "Drop whitespace on both ends. Used everywhere before a predicate runs.",
        examples: [
          { expr: 'Trim<"  hi ">', result: '"hi"' },
          { expr: 'Trim<"none">', result: '"none"' },
        ],
      },
      {
        name: "AllChars<S, Allowed>",
        desc: "Is every char of S a member of the Allowed union? The empty string is true.",
        examples: [
          { expr: 'AllChars<"123", Digit>', result: "true" },
          { expr: 'AllChars<"12a", Digit>', result: "false" },
        ],
      },
      {
        name: "NonEmptyAllChars<S, Allowed>",
        desc: "AllChars, but the empty string is false — the variant most predicates want.",
        examples: [
          { expr: 'NonEmptyAllChars<"12", Digit>', result: "true" },
          { expr: 'NonEmptyAllChars<"", Digit>', result: "false" },
        ],
      },
      {
        name: "And<A, B>",
        desc: "Boolean conjunction over true | false.",
        examples: [
          { expr: "And<true, true>", result: "true" },
          { expr: "And<true, false>", result: "false" },
        ],
      },
      {
        name: "Or<A, B>",
        desc: "Boolean disjunction.",
        examples: [
          { expr: "Or<false, true>", result: "true" },
          { expr: "Or<false, false>", result: "false" },
        ],
      },
      {
        name: "Not<A>",
        desc: "Boolean negation.",
        examples: [{ expr: "Not<true>", result: "false" }],
      },
      {
        name: "KeepIf<B, S>",
        desc: "The collapse step: keep S when B is true, else never. Turns a predicate into an S | never validator.",
        examples: [
          { expr: 'KeepIf<true, "x">', result: '"x"' },
          { expr: 'KeepIf<false, "x">', result: "never" },
        ],
      },
      {
        name: "Length<S>",
        desc: "Count the characters in S as a number literal.",
        examples: [
          { expr: 'Length<"abc">', result: "3" },
          { expr: 'Length<"">', result: "0" },
        ],
      },
    ],
  },
  {
    label: "Numbers & ranges",
    entries: [
      {
        name: "IntRange<From, To>",
        desc: "Half-open numeric-literal range — From inclusive, To exclusive. Powers the bounded validators below.",
        examples: [{ expr: "IntRange<0, 3>", result: "0 | 1 | 2" }],
      },
      {
        name: "IsNonNegativeNumber<S>",
        desc: "Digits with an optional fractional part. No sign.",
        examples: [
          { expr: 'IsNonNegativeNumber<"3.14">', result: "true" },
          { expr: 'IsNonNegativeNumber<"-1">', result: "false" },
        ],
      },
      {
        name: "IsSignedDecimal<S>",
        desc: "A non-negative number with an optional leading minus.",
        examples: [
          { expr: 'IsSignedDecimal<"-0.05">', result: "true" },
          { expr: 'IsSignedDecimal<"+2">', result: "false" },
        ],
      },
      {
        name: "IsNumber<S>",
        desc: "A decimal with an optional leading + or -. The broadest numeric shape.",
        examples: [
          { expr: 'IsNumber<"+2">', result: "true" },
          { expr: 'IsNumber<"2px">', result: "false" },
        ],
      },
      {
        name: "IsPositiveInt<S>",
        desc: "An integer ≥ 1 (rejects 0 and the empty string).",
        examples: [
          { expr: 'IsPositiveInt<"3">', result: "true" },
          { expr: 'IsPositiveInt<"0">', result: "false" },
        ],
      },
      {
        name: "IsByte<S>",
        desc: "Integer 0–255 — the RGB channel range.",
        examples: [
          { expr: 'IsByte<"255">', result: "true" },
          { expr: 'IsByte<"256">', result: "false" },
          { expr: 'IsByte<"-1">', result: "false" },
        ],
      },
      {
        name: "IsNumber0To1<S>",
        desc: "Number in 0–1 inclusive — the alpha / opacity range.",
        examples: [
          { expr: 'IsNumber0To1<"0.5">', result: "true" },
          { expr: 'IsNumber0To1<"1.1">', result: "false" },
        ],
      },
      {
        name: "IsNumber0To100<S>",
        desc: "Number in 0–100 inclusive.",
        examples: [
          { expr: 'IsNumber0To100<"100">', result: "true" },
          { expr: 'IsNumber0To100<"101">', result: "false" },
        ],
      },
      {
        name: "IsNumber0To360<S>",
        desc: "Number in 0–360 inclusive — the hue-degree range.",
        examples: [{ expr: 'IsNumber0To360<"360">', result: "true" }],
      },
      {
        name: "IsNumber0To400<S>",
        desc: "Number in 0–400 inclusive.",
        examples: [
          { expr: 'IsNumber0To400<"400">', result: "true" },
          { expr: 'IsNumber0To400<"401">', result: "false" },
        ],
      },
      {
        name: "IsPercent0To100<S>",
        desc: "An N% literal whose N lands in 0–100.",
        examples: [
          { expr: 'IsPercent0To100<"50%">', result: "true" },
          { expr: 'IsPercent0To100<"150%">', result: "false" },
        ],
      },
    ],
  },
  {
    label: "CSS dimensions",
    entries: [
      {
        name: "IsLength<S>",
        desc: "A number plus a CSS length unit — px, rem, em, vh, cqmin, and the rest.",
        examples: [
          { expr: 'IsLength<"10px">', result: "true" },
          { expr: 'IsLength<"1.5rem">', result: "true" },
          { expr: 'IsLength<"45deg">', result: "false" },
          { expr: 'IsLength<"10">', result: "false" },
        ],
      },
      {
        name: "IsAngle<S>",
        desc: "A number plus deg / grad / rad / turn.",
        examples: [
          { expr: 'IsAngle<"45deg">', result: "true" },
          { expr: 'IsAngle<"0.25turn">', result: "true" },
        ],
      },
      {
        name: "IsTime<S>",
        desc: "A number plus s / ms.",
        examples: [
          { expr: 'IsTime<"200ms">', result: "true" },
          { expr: 'IsTime<"1.5s">', result: "true" },
        ],
      },
      {
        name: "IsResolution<S>",
        desc: "A number plus dpi / dpcm / dppx / x.",
        examples: [
          { expr: 'IsResolution<"2dppx">', result: "true" },
          { expr: 'IsResolution<"96dpi">', result: "true" },
        ],
      },
      {
        name: "IsPercentage<S>",
        desc: "Any N% literal (unbounded — pair with IsPercent0To100 to clamp the range).",
        examples: [{ expr: 'IsPercentage<"50%">', result: "true" }],
      },
      {
        name: "IsFlex<S>",
        desc: "A non-negative Nfr grid flex value.",
        examples: [
          { expr: 'IsFlex<"1fr">', result: "true" },
          { expr: 'IsFlex<"-1fr">', result: "false" },
        ],
      },
      {
        name: "Dimension",
        def: '"length" | "angle" | "time" | "percent" | "number" | "flex" | "resolution"',
        desc: "The tag union DimensionOf resolves to.",
      },
      {
        name: "DimensionOf<S>",
        desc: "Classify a value literal as its Dimension tag (trims first); never for nonsense.",
        examples: [
          { expr: 'DimensionOf<"10px">', result: '"length"' },
          { expr: 'DimensionOf<"45deg">', result: '"angle"' },
          { expr: 'DimensionOf<"3">', result: '"number"' },
          { expr: 'DimensionOf<"nonsense">', result: "never" },
        ],
      },
    ],
  },
  {
    label: "Parser combinators",
    entries: [
      {
        name: "StartsWith<S, P>",
        desc: "Does S begin with the prefix P?",
        examples: [
          { expr: 'StartsWith<"calc(1px)", "calc(">', result: "true" },
          { expr: 'StartsWith<"min(1px)", "calc(">', result: "false" },
        ],
      },
      {
        name: "EndsWith<S, P>",
        desc: "Does S end with the suffix P?",
        examples: [
          { expr: 'EndsWith<"10px", "px">', result: "true" },
          { expr: 'EndsWith<"10em", "px">', result: "false" },
        ],
      },
      {
        name: "SplitByComma<S>",
        desc: "Split on top-level commas, ignoring those nested in parens or brackets. Trims each token; keeps empties.",
        examples: [
          {
            expr: 'SplitByComma<"a, b(c, d), e">',
            result: '["a", "b(c, d)", "e"]',
          },
        ],
      },
      {
        name: "SplitBySpace<S>",
        desc: "Split on top-level whitespace, paren-aware. Collapses runs (drops empties).",
        examples: [
          {
            expr: 'SplitBySpace<"translateX(1px) rotate(45deg)">',
            result: '["translateX(1px)", "rotate(45deg)"]',
          },
          { expr: 'SplitBySpace<"rgb(255 0 0)">', result: '["rgb(255 0 0)"]' },
        ],
      },
      {
        name: "ParseFunction<S>",
        desc: "Split the outer call into its name and raw args; never when S is not a call.",
        examples: [
          {
            expr: 'ParseFunction<"minmax(0, 1fr)">',
            result: '{ name: "minmax"; args: "0, 1fr" }',
          },
          { expr: 'ParseFunction<"not-a-call">', result: "never" },
        ],
      },
    ],
  },
]

function resultClass(result: string): string {
  if (result === "true") return "text-emerald-300"
  if (result === "false" || result === "never") return "text-rose-300"
  return "text-violet-glow"
}

export function ApiReference() {
  return (
    <div className="glass-card space-y-10 rounded-2xl p-6 md:p-8">
      {GROUPS.map((group) => (
        <div key={group.label} className="space-y-5">
          <h3 className="font-mono text-muted-foreground text-sm uppercase tracking-[0.18em]">
            <span className="text-gradient">§</span> {group.label}
          </h3>
          <div className="space-y-5">
            {group.entries.map((entry) => (
              <EntryRow key={entry.name} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EntryRow({ entry }: { entry: ApiEntry }) {
  return (
    <div className="space-y-1.5 border-white/5 border-b pb-5 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <code className="font-mono text-foreground text-sm">{entry.name}</code>
        {entry.def ? (
          <code className="font-mono text-muted-foreground text-xs">
            = {entry.def}
          </code>
        ) : null}
      </div>
      <p className="max-w-prose text-muted-foreground text-sm">{entry.desc}</p>
      {entry.examples ? (
        <div className="flex flex-wrap gap-x-5 gap-y-1 pt-0.5">
          {entry.examples.map((ex) => (
            <span key={ex.expr} className="font-mono text-xs">
              <span className="text-muted-foreground">{ex.expr}</span>
              <span className="text-muted-foreground/60"> → </span>
              <span className={resultClass(ex.result)}>{ex.result}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
