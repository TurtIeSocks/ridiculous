import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"

const BASE = import.meta.env.BASE_URL

export function NotFoundPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="404"
        title="Not found"
        description="That page doesn't exist (yet). Try one of the components from the sidebar, or head back home."
      />
      <div className="mt-8">
        <a
          href={BASE}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition hover:border-white/25 hover:bg-white/10"
        >
          ← Back to home
        </a>
      </div>
    </Layout>
  )
}
