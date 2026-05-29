import type { ReactNode } from "react"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NAV } from "@/generated/nav"
import { NavLink } from "./nav-link"

function SidebarNav() {
  return (
    <nav aria-label="Components" className="flex flex-col gap-1">
      <NavLink to="/">Home</NavLink>
      <div className="mt-4 px-3 text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
        Components
      </div>
      {NAV.map((item) => (
        <NavLink key={item.name} to={`/${item.name}`}>
          {item.title}
        </NavLink>
      ))}
    </nav>
  )
}

export function DesktopSidebar() {
  return (
    <aside className="hidden md:block sticky top-24 self-start w-56 shrink-0">
      <SidebarNav />
    </aside>
  )
}

export function MobileSidebarSheet({ children }: { children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="w-72 bg-background border-white/10">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="mt-8">
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  )
}
