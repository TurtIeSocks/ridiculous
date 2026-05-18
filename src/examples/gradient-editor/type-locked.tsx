import { useState } from "react"
import {
  type GradientType,
  GradientEditor,
  type GradientStringMap,
} from "@/components/ui/gradient-editor"
import { CopyButton } from "../color-picker/copy-button"

const TYPES: readonly GradientType[] = ["linear", "radial", "conic"] as const

function TypeCard<T extends GradientType>({ type }: { type: T }) {
  const initial: Record<GradientType, string> = {
    linear: "linear-gradient(45deg, #ff0000, #0000ff)",
    radial: "radial-gradient(circle at 50% 50%, #ff0000, #0000ff)",
    conic: "conic-gradient(from 0deg at 50% 50%, #ff0000, #0000ff)",
  }
  const [grad, setGrad] = useState<GradientStringMap[T]>(
    initial[type] as GradientStringMap[T],
  )
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <span className="text-gradient">→</span> {type}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <GradientEditor<T>
          value={grad}
          type={type}
          onChange={(next) => setGrad(next as GradientStringMap[T])}
        />
        <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
          {grad}
        </code>
        <CopyButton value={grad} />
      </div>
    </div>
  )
}

export function TypeLocked() {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> type-locked
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Type-Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Setting <code className="text-foreground">type</code> hides the
        switcher and locks <code className="text-foreground">onChange</code> to
        that gradient flavor.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TYPES.map((t) => (
          <TypeCard key={t} type={t} />
        ))}
      </div>
    </div>
  )
}
