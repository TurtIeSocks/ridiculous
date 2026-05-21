import { CodeBlock } from "@/components/layout/code-block"
import { ComponentCard } from "@/components/layout/component-card"
import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { TierCasual } from "@/examples/color-picker/tier-casual"
import { TierIntellisense } from "@/examples/color-picker/tier-intellisense"
import { TierStrict } from "@/examples/color-picker/tier-strict"
import { NAV } from "@/generated/nav"

const NAMESPACE_CONFIG = `{
  "registries": {
    "@ridiculous": "https://turtiesocks.github.io/ridiculous/r/{name}.json"
  }
}`

export function IndexPage() {
  return (
    <Layout variant="hero">
      <section id="install" className="scroll-mt-24">
        <SectionHeader
          eyebrow="install"
          title="Quickstart"
          description="One-time shadcn setup, then grab the whole registry or pick components below."
        />
        <div className="mt-6 space-y-3">
          <InstallCta args="init" />
          <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/all.json" />
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-gradient">§</span> Optional · shorter commands
            via namespace
          </h3>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            Add the{" "}
            <code className="font-mono text-foreground">@ridiculous</code>{" "}
            namespace to your{" "}
            <code className="font-mono text-foreground">components.json</code>{" "}
            once, then reference components by short name forever after.
          </p>
          <div className="mt-4 space-y-3">
            <CodeBlock label="components.json" code={NAMESPACE_CONFIG} />
            <InstallCta args="add @ridiculous/all" />
            <p className="text-xs text-muted-foreground font-mono">
              Or just one:{" "}
              <span className="text-foreground">
                add @ridiculous/color-picker @ridiculous/easing-picker
              </span>
            </p>
          </div>
        </div>
      </section>

      <SectionHeader
        className="mt-24"
        eyebrow="components"
        title="Browse the registry"
        description="One page per component with examples, API, and the install command."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {NAV.map((item) => (
          <ComponentCard
            key={item.name}
            name={item.name}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="Pick the level of compile-time validation you want. From useState-and-go to literal-validated."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <TierCasual />
        <TierIntellisense />
        <TierStrict />
      </div>
    </Layout>
  )
}
