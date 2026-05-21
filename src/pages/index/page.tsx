import { ComponentCard } from "@/components/layout/component-card"
import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { TierCasual } from "@/examples/color-picker/tier-casual"
import { TierIntellisense } from "@/examples/color-picker/tier-intellisense"
import { TierStrict } from "@/examples/color-picker/tier-strict"
import { NAV } from "@/generated/nav"

const REGISTRY_TEMPLATE =
  "https://turtiesocks.github.io/ridiculous/r/{name}.json"

export function IndexPage() {
  return (
    <Layout variant="hero">
      <section id="install" className="scroll-mt-24">
        <SectionHeader eyebrow="install" title="Installation" />
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Install <span className="text-foreground">ridiculous</span> components
          via the shadcn CLI. First, set up shadcn and add the registry:
        </p>
        <div className="mt-6">
          <InstallCta
            args={["init", `registry add @ridiculous=${REGISTRY_TEMPLATE}`]}
          />
        </div>

        <p className="mt-8 max-w-2xl text-muted-foreground">
          Then install components individually:
        </p>
        <div className="mt-4">
          <InstallCta
            args="add @ridiculous/{component-name}"
            showTabs={false}
          />
        </div>

        <p className="mt-8 max-w-2xl text-muted-foreground">
          Or install every component at once:
        </p>
        <div className="mt-4">
          <InstallCta args="add @ridiculous/all" showTabs={false} />
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
