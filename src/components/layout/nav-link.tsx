import type { ReactNode } from "react"
import { NavLink as RouterNavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  /** Basename-relative target, e.g. "/" or "/calc-editor". */
  to: string
  children: ReactNode
  className?: string
}

export function NavLink({ to, children, className }: NavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      end
      data-active-link
      className={({ isActive }) =>
        cn(
          "block rounded-md px-3 py-2 text-sm transition",
          isActive
            ? "bg-white/10 text-foreground"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
          className,
        )
      }
    >
      {children}
    </RouterNavLink>
  )
}
