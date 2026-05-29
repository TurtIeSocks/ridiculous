import { Link } from "react-router-dom"

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
  return (
    <Link
      to={`/${name}`}
      className="group glass-card rounded-2xl p-6 transition hover:border-white/20"
    >
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
    </Link>
  )
}
