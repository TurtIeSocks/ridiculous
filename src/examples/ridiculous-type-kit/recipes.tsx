interface Recipe {
  slug: string
  title: string
  blurb: string
  code: string
}

const RECIPES: Recipe[] = [
  {
    slug: "strict-length",
    title: "A length-only helper",
    blurb:
      "Compose IsLength with KeepIf to accept any valid CSS length and reject everything else at compile time.",
    code: `import type { IsLength, KeepIf } from "@/lib/ridiculous-type-kit"

type Length<S extends string> = KeepIf<IsLength<S>, S>

export const len = <S extends string>(v: S & Length<S>): S => v

len("16px")   // ✓
len("1.5rem") // ✓
// @ts-expect-error — "16deg" is an angle, not a length
len("16deg")`,
  },
  {
    slug: "bounded-alpha",
    title: "A 0–1 alpha helper",
    blurb:
      "Swap in a different predicate and the same idiom now clamps a number to the 0–1 opacity range.",
    code: `import type { IsNumber0To1, KeepIf } from "@/lib/ridiculous-type-kit"

type Alpha<S extends string> = KeepIf<IsNumber0To1<S>, S>

export const alpha = <S extends string>(v: S & Alpha<S>): S => v

alpha("0.5") // ✓
// @ts-expect-error — 1.1 is outside the 0–1 range
alpha("1.1")`,
  },
  {
    slug: "classify-parse",
    title: "Classify & parse",
    blurb:
      "The non-boolean exports: tag a token by its CSS dimension, or pull a function call apart into name + comma-separated args.",
    code: `import type {
  DimensionOf,
  ParseFunction,
  SplitByComma,
} from "@/lib/ridiculous-type-kit"

type T1 = DimensionOf<"200ms">       // "time"
type T2 = DimensionOf<"1fr">         // "flex"

type Fn = ParseFunction<"minmax(0, 1fr)">
//   ^? { name: "minmax"; args: "0, 1fr" }
type Args = SplitByComma<Fn["args"]> // ["0", "1fr"]`,
  },
]

export function Recipes() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 text-muted-foreground text-sm md:p-8">
        Validation lives entirely in the type system. The runtime helper is a
        one-line identity function that simply carries the constraint — there is
        no runtime cost and nothing to execute. It cannot be factored into a
        shared helper because TypeScript has no higher-kinded types, so each
        component copies this one line, swapping in its own{" "}
        <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-foreground text-xs">
          Literal
        </code>{" "}
        validator:
        <pre className="mt-4 overflow-x-auto whitespace-pre rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] text-foreground leading-relaxed md:text-xs">
          {"const x = <S extends string>(v: S & XLiteral<S>): S => v"}
        </pre>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {RECIPES.map((recipe) => (
          <div
            key={recipe.slug}
            className="glass-card flex flex-col rounded-2xl p-6"
          >
            <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
              <span className="text-gradient">/</span> {recipe.slug}
            </div>
            <h3 className="font-semibold text-lg tracking-tight">
              {recipe.title}
            </h3>
            <p className="mt-2 text-muted-foreground text-sm">{recipe.blurb}</p>
            <pre className="mt-4 overflow-x-auto whitespace-pre rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
              <code>{recipe.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
