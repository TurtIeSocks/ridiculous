import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { NavLink as RouterNavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  /** Basename-relative target, e.g. "/" or "/calc-editor". */
  to: string
  children: ReactNode
  className?: string
  /** Optional decorative icon rendered before the label. */
  icon?: LucideIcon
}

export function NavLink({ to, children, className, icon: Icon }: NavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      end
      data-active-link
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
          isActive
            ? "bg-white/10 text-foreground"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
          className,
        )
      }
    >
      {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
      {children}
    </RouterNavLink>
  )
}
