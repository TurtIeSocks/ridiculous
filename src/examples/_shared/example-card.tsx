import type * as React from "react"
import { cn } from "@/lib/utils"

interface ExampleCardProps {
  /** Tier number shown in the gradient badge (zero-padded to two digits). */
  tierIndex?: number
  /** Tier name shown after the number, e.g. "casual". */
  tierLabel?: string
  /** Right-aligned mono type tag in the tier header, e.g. "FilterString". */
  typeBadge?: React.ReactNode
  /**
   * Slash eyebrow for non-tier cards (basic-usage / live-preview).
   * Rendered as `/ {eyebrow}` above a larger title. Ignored when tierIndex is set.
   */
  eyebrow?: React.ReactNode
  /** Card heading. Uses text-lg in tier cards, text-xl otherwise. */
  title?: React.ReactNode
  /** Supporting copy under the title. */
  description?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function ExampleCard({
  tierIndex,
  tierLabel,
  typeBadge,
  eyebrow,
  title,
  description,
  className,
  children,
}: ExampleCardProps) {
  const isTier = tierIndex != null

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6",
        isTier && "flex flex-col",
        className,
      )}
    >
      {isTier ? (
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
            <span className="text-gradient">
              {String(tierIndex).padStart(2, "0")}
            </span>{" "}
            {tierLabel}
          </div>
          {typeBadge != null && (
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {typeBadge}
            </span>
          )}
        </div>
      ) : (
        eyebrow != null && (
          <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
            <span className="text-gradient">/</span> {eyebrow}
          </div>
        )
      )}

      {title != null &&
        (isTier ? (
          <h3 className="mt-3 font-semibold text-lg tracking-tight">{title}</h3>
        ) : (
          <h3 className="font-semibold text-xl tracking-tight">{title}</h3>
        ))}

      {description != null &&
        (isTier ? (
          <p className="mt-2 text-muted-foreground text-sm">{description}</p>
        ) : (
          <p className="mt-2 max-w-prose text-muted-foreground text-sm">
            {description}
          </p>
        ))}

      {children}
    </div>
  )
}
