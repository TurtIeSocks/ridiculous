import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description: string
  className?: string
  id?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  id,
}: SectionHeaderProps) {
  return (
    <div className={cn(className)} id={id}>
      <div className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">/</span> {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
    </div>
  )
}
