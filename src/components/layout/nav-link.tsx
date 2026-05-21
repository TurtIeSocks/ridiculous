import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function NavLink({ href, children, className }: NavLinkProps) {
  const isActive =
    typeof window !== "undefined" && window.location.pathname === href
  return (
    <a
      href={href}
      data-active={isActive}
      className={cn(
        "block rounded-md px-3 py-2 text-sm transition",
        isActive
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        className,
      )}
    >
      {children}
    </a>
  )
}
