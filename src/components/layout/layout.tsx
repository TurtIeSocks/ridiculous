import type { ReactNode } from "react"
import { Footer } from "./footer"
import { Header } from "./header"
import { DesktopSidebar } from "./sidebar"

interface LayoutProps {
  variant: "hero" | "compact"
  children: ReactNode
}

export function Layout({ variant, children }: LayoutProps) {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <div
        aria-hidden="true"
        className="bg-mesh pointer-events-none fixed inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none fixed inset-0 -z-10"
      />
      <Header variant={variant} />
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex gap-8 py-12">
          <DesktopSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
