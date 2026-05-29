import { cn } from "@/lib/utils"

export type Token = {
  kind: "kw" | "fn" | "type" | "str" | "err" | "com" | "plain"
  text: string
}

const KIND_CLASS: Record<Token["kind"], string> = {
  kw: "text-violet-glow",
  fn: "text-cyan-glow",
  type: "text-pink-glow",
  str: "text-emerald-400",
  err: "text-destructive",
  com: "text-muted-foreground/70",
  plain: "",
}

export function CodeBlock({
  tokens,
  className,
}: {
  tokens: Token[]
  className?: string
}) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed",
        className,
      )}
    >
      {tokens.map((token, i) => {
        const cls = KIND_CLASS[token.kind]
        return cls ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: tokens are a static, ordered render list
          <span key={i} className={cls}>
            {token.text}
          </span>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: tokens are a static, ordered render list
          <span key={i}>{token.text}</span>
        )
      })}
    </pre>
  )
}
