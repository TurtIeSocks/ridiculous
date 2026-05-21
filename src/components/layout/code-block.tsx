import { useEffect, useState } from "react"

interface CodeBlockProps {
  /** Short label shown in the tab strip — e.g. "components.json", "JSON", "TypeScript". */
  label: string
  code: string
}

export function CodeBlock({ label, code }: CodeBlockProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-1.5">
        <span className="text-xs font-mono uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <CopyButton code={code} />
      </div>
      <pre className="px-6 md:px-8 py-5 text-sm md:text-[0.95rem] font-mono leading-relaxed overflow-x-auto whitespace-pre">
        <code className="text-foreground">{code}</code>
      </pre>
    </div>
  )
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(id)
  }, [copied])

  return (
    <button
      type="button"
      aria-label="Copy code"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code)
          setCopied(true)
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
    >
      {copied ? (
        <>
          <CheckIcon />
          <span>Copied</span>
        </>
      ) : (
        <>
          <CopyIcon />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden="true"
    >
      <title>Copy</title>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 text-violet-glow"
      aria-hidden="true"
    >
      <title>Copied</title>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
