import { InstallCta } from "@/components/layout/install-cta"
import { SectionHeader } from "@/components/layout/section-header"

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
      "IsByte",
      "IsNumber",
      "IsNonNegativeNumber",
      "IsSignedDecimal",
      "IsPositiveInt",
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
      "SplitByComma",
      "SplitBySpace",
      "ParseFunction",
      "StartsWith",
      "EndsWith",
    ],
  },
]

const HELPER_SNIPPET = `import type { IsLength, KeepIf } from "@/lib/ridiculous-type-kit"

// Compose a strict validator from kit primitives…
type PxLiteral<S extends string> = S extends \`\${infer N}px\`
  ? KeepIf<IsLength<S>, S>
  : never

// …then a one-line call-site helper that rejects bad input at compile time:
export const px = <S extends string>(v: S & PxLiteral<S>): S => v

px("16px") // ✓ ok
// @ts-expect-error — "16deg" is not a length
px("16deg")`

export function RidiculousTypeKitPage() {
  return (
    <>
      <SectionHeader
        eyebrow="foundation"
        title="Ridiculous Type Kit"
        description="The shared template-literal machinery every ridiculous component is built on — character and number primitives, CSS dimension validators, and paren-aware parser combinators. Pure types, zero runtime."
      />

      <div className="mt-8 glass-card rounded-2xl p-6 text-sm text-muted-foreground">
        Installed automatically as a{" "}
        <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-xs text-foreground">
          registryDependency
        </code>{" "}
        of every component — you rarely add it by hand. Import from{" "}
        <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-xs text-foreground">
          @/lib/ridiculous-type-kit
        </code>{" "}
        when you want to compose your own ridiculously-typed CSS validators.
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="exports"
        title="What's in the box"
        description="All pure types — no runtime cost. Combine them into your own template-literal CSS validators."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {GROUPS.map((group) => (
          <div key={group.label} className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold tracking-tight">
              {group.label}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{group.blurb}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.names.map((name) => (
                <code
                  key={name}
                  className="rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-xs text-foreground"
                >
                  {name}
                </code>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="pattern"
        title="The call-site helper idiom"
        description="Validation lives entirely in the type system; the runtime helper is a one-line identity that carries the constraint."
      />
      <div className="mt-6 glass-card rounded-2xl overflow-hidden">
        <pre className="px-6 md:px-8 py-5 text-sm font-mono overflow-x-auto whitespace-pre">
          <code>{HELPER_SNIPPET}</code>
        </pre>
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="install"
        title="Drop it in"
        description="Usually pulled in transitively, but you can install the kit on its own."
      />
      <div className="mt-6">
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/ridiculous-type-kit.json" />
      </div>
    </>
  )
}
