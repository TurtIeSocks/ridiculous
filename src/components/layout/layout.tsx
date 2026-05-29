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
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-mesh"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-grid"
      />
      <Header variant={variant} />
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex gap-8 py-12">
          {variant === "compact" && <DesktopSidebar />}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
