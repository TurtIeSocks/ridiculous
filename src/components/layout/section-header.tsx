import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description?: string
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
      <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.18em]">
        <span className="text-gradient">/</span> {eyebrow}
      </div>
      <h2 className="mt-3 font-bold text-3xl tracking-tight md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
