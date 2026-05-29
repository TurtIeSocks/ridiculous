import type * as React from "react"

/** A small uppercase label stacked above its control. */
export function LabeledField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
      <span className="font-mono uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}
