import { cn } from "@/lib/utils"

const SIZE_CLASS = {
  sm: "rounded-md px-2.5 py-1 text-xs",
  md: "rounded-lg px-3 py-1.5 text-sm",
} as const

export function ValueReadout({
  value,
  size = "sm",
  className,
}: {
  value: string
  size?: "sm" | "md"
  className?: string
}) {
  return (
    <code
      className={cn(
        "min-w-0 flex-1 truncate border border-white/10 bg-black/40 font-mono",
        SIZE_CLASS[size],
        className,
      )}
    >
      {value}
    </code>
  )
}
