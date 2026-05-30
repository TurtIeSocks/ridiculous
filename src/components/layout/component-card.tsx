import { Link } from "react-router-dom"
import { iconForComponent } from "@/components/layout/component-icons"

interface ComponentCardProps {
  name: string
  title: string
  description: string
}

export function ComponentCard({
  name,
  title,
  description,
}: ComponentCardProps) {
  const Icon = iconForComponent(name)
  return (
    <Link
      to={`/${name}`}
      className="group glass-card rounded-2xl p-6 transition hover:border-white/20"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-muted-foreground ring-1 ring-white/10 transition group-hover:text-foreground"
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
            <span
              aria-hidden="true"
              className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
            >
              →
            </span>
          </div>
          <p className="mt-3 text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
    </Link>
  )
}
