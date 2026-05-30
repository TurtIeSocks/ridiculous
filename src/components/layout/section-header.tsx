import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description?: string
  className?: string
  id?: string
  /** Optional decorative icon rendered as a chip beside the title. */
  icon?: LucideIcon
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  id,
  icon: Icon,
}: SectionHeaderProps) {
  return (
    <div className={cn(className)} id={id}>
      <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.18em]">
        <span className="text-gradient">/</span> {eyebrow}
      </div>
      <div className="mt-3 flex items-center gap-3">
        {Icon ? (
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-muted-foreground ring-1 ring-white/10"
          >
            <Icon className="size-6" aria-hidden="true" />
          </span>
        ) : null}
        <h2 className="font-bold text-3xl tracking-tight md:text-4xl">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
