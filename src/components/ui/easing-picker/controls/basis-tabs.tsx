import { cn } from "@/lib/utils"
import { ALL_BASES } from "../easing-picker.constants"
import type { EasingBasis } from "../easing-picker.types"

interface BasisTabsProps {
  value: EasingBasis
  onChange: (basis: EasingBasis) => void
  available?: readonly EasingBasis[]
}

export function BasisTabs({
  value,
  onChange,
  available = ALL_BASES,
}: BasisTabsProps) {
  return (
    <div className="flex gap-1 border-b text-xs">
      {available.map((basis) => (
        <button
          key={basis}
          type="button"
          onClick={() => onChange(basis)}
          className={cn(
            "px-3 py-1.5 capitalize transition-colors",
            value === basis
              ? "border-primary border-b-2 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {basis}
        </button>
      ))}
    </div>
  )
}
