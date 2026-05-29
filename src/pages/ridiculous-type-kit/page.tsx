import { InstallCta } from "@/components/layout/install-cta"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/ridiculous-type-kit/api-reference"
import { ExportsOverview } from "@/examples/ridiculous-type-kit/exports-overview"
import { Recipes } from "@/examples/ridiculous-type-kit/recipes"

export function RidiculousTypeKitPage() {
  return (
    <>
      <SectionHeader
        eyebrow="foundation"
        title="Ridiculous Type Kit"
        description="The shared template-literal machinery every ridiculous component is built on — character and number primitives, CSS dimension validators, and paren-aware parser combinators. Pure types, zero runtime."
      />

      <div className="mt-8 glass-card rounded-2xl p-6 text-muted-foreground text-sm">
        Installed automatically as a{" "}
        <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-foreground text-xs">
          registryDependency
        </code>{" "}
        of every component — you rarely add it by hand. Import from{" "}
        <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-foreground text-xs">
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
      <div className="mt-8">
        <ExportsOverview />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="api"
        title="API reference"
        description="Every export with its signature and a worked input → output. Results are compile-time types — exactly what TypeScript resolves the expression to, mirrored from the type-test suite."
      />
      <div className="mt-8">
        <ApiReference />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="pattern"
        title="The call-site helper idiom"
        description="Predicates gate a value; KeepIf collapses the result; a one-line identity function carries the constraint to the call site. Three recipes from real components."
      />
      <div className="mt-8">
        <Recipes />
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
