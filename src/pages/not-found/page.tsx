import { Link } from "react-router-dom"
import { SectionHeader } from "@/components/layout/section-header"

export default function NotFoundPage() {
  return (
    <>
      <SectionHeader
        eyebrow="404"
        title="Not found"
        description="That page doesn't exist (yet). Try one of the components from the sidebar, or head back home."
      />
      <div className="mt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-medium text-foreground text-sm transition hover:border-white/25 hover:bg-white/10"
        >
          ← Back to home
        </Link>
      </div>
    </>
  )
}
