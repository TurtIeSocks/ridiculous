import type { ReactNode } from "react"
import { InstallCta } from "@/components/layout/install-cta"
import { SectionHeader } from "@/components/layout/section-header"
import { registryUrl } from "@/lib/registry"

export interface ComponentPageMeta {
  /** Component display name — rendered as the page's lead heading. */
  title: string
  /** One-paragraph lead description under the title. */
  description: string
  /** Registry slug — drives the install command via `registryUrl(slug)`. */
  slug: string
}

export interface ComponentPageConfig {
  meta: ComponentPageMeta
  /** The examples — rendered inside the examples layout wrapper. */
  examples: ReactNode
  /**
   * The full "usage tiers" block (its own SectionHeader + grid). Optional:
   * tier-less pages (e.g. gradient-editor) omit it entirely. Per-page tier
   * copy + grid layout vary, so the whole block lives in the page.
   */
  tiers?: ReactNode
  /** The API reference body — rendered under the verbatim API header. */
  apiReference: ReactNode
  /** Examples wrapper classes. Defaults to `"mt-12 space-y-10"`. */
  examplesLayout?: string
  /**
   * Install-section description. Defaults to `"One command via the shadcn
   * CLI."` — override for pages that call out transitive deps.
   */
  installDescription?: string
}

export function ComponentPage({
  meta,
  examples,
  tiers,
  apiReference,
  examplesLayout = "mt-12 space-y-10",
  installDescription = "One command via the shadcn CLI.",
}: ComponentPageConfig) {
  return (
    <>
      <SectionHeader
        eyebrow="component"
        title={meta.title}
        description={meta.description}
      />
      <div className={examplesLayout}>{examples}</div>

      {tiers}

      <SectionHeader
        className="mt-24"
        eyebrow="api"
        title="API"
        description="Public surface — component props, runtime helpers, and the type exports."
      />
      <div className="mt-8">{apiReference}</div>

      <SectionHeader
        className="mt-24"
        eyebrow="install"
        title="Drop it in"
        description={installDescription}
      />
      <div className="mt-6">
        <InstallCta args={`add ${registryUrl(meta.slug)}`} />
      </div>
    </>
  )
}
