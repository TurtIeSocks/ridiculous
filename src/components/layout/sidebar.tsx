import { Home } from "lucide-react"
import type { ReactNode } from "react"
import { iconForComponent } from "@/components/layout/component-icons"
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
      <NavLink to="/" icon={Home}>
        Home
      </NavLink>
      <div className="mt-4 px-3 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        Components
      </div>
      {NAV.map((item) => (
        <NavLink
          key={item.name}
          to={`/${item.name}`}
          icon={iconForComponent(item.name)}
        >
          {item.title}
        </NavLink>
      ))}
    </nav>
  )
}

export function DesktopSidebar() {
  return (
    <aside className="sticky top-24 hidden w-56 shrink-0 self-start md:block">
      <SidebarNav />
    </aside>
  )
}

export function MobileSidebarSheet({ children }: { children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="w-72 border-white/10 bg-background">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="mt-8">
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  )
}
