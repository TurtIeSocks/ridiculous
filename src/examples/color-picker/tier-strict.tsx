import { useState } from "react"
import {
  ColorPicker,
  type ColorString,
  color,
} from "@/components/ui/color-picker"
import { CopyButton } from "./copy-button"

export function TierStrict() {
  const [c, setC] = useState<ColorString>(color("oklch(0.7 0.18 240)"))
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/60">
          ColorLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">
        Validate at compile time
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        <code className="text-foreground">color()</code> range-checks the
        literal. Out-of-range tokens type-error.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <ColorPicker value={c} onChange={setC} />
        <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
          {c}
        </code>
        <CopyButton value={c} />
      </div>
      <pre className="mt-6 text-[11px] leading-relaxed font-mono bg-black/40 border border-white/10 p-4 rounded-lg overflow-x-auto">
        <span className="text-violet-glow">const</span> valid ={" "}
        <span className="text-cyan-glow">color</span>(
        <span className="text-emerald-400">&quot;#ff0000&quot;</span>){" "}
        <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error 256 > 255"}
        </span>
        {"\n"}
        <span className="text-violet-glow">const</span> bad ={" "}
        <span className="text-cyan-glow">color</span>(
        <span className="text-destructive">&quot;rgb(256 0 0)&quot;</span>)
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error wrong hex length"}
        </span>
        {"\n"}
        <span className="text-violet-glow">const</span> short ={" "}
        <span className="text-cyan-glow">color</span>(
        <span className="text-destructive">&quot;#ff&quot;</span>)
      </pre>
    </div>
  )
}
