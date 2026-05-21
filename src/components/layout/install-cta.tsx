import { useEffect, useState } from "react"
import {
  commandFor,
  PACKAGE_MANAGERS,
  setPackageManager,
  usePackageManager,
} from "@/lib/use-package-manager"
import { cn } from "@/lib/utils"

interface InstallCtaProps {
  /**
   * shadcn CLI args after the `shadcn@latest` part — e.g. "init" or
   * "add https://...json". Pass an array of strings to render multiple
   * commands stacked in one block (each line shares the active PM prefix).
   */
  args: string | string[]
  /** Show the package-manager tab strip. Defaults to true. When false, the block still binds to the global PM selection but renders without its own tabs — useful when multiple blocks share a single tab strip above. */
  showTabs?: boolean
}

export function InstallCta({ args, showTabs = true }: InstallCtaProps) {
  const pm = usePackageManager()
  const lines = Array.isArray(args) ? args : [args]
  const commands = lines.map((line) => commandFor(pm, line))
  const copyPayload = commands.join("\n")
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-2">
        {showTabs ? (
          <div role="tablist" aria-label="Package manager" className="flex">
            {PACKAGE_MANAGERS.map((option) => {
              const active = option === pm
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPackageManager(option)}
                  className={cn(
                    "px-3 py-2 text-xs font-mono uppercase tracking-[0.12em] transition border-b-2 -mb-px",
                    active
                      ? "text-foreground border-violet-glow"
                      : "text-muted-foreground border-transparent hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        ) : (
          <span aria-hidden="true" />
        )}
        <CopyButton text={copyPayload} />
      </div>
      <pre className="px-6 md:px-8 py-5 text-sm md:text-base font-mono overflow-x-auto whitespace-pre">
        {commands.map((command, index) => (
          <CommandLine
            // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional and stable
            key={index}
            command={command}
            isLast={index === commands.length - 1}
          />
        ))}
      </pre>
    </div>
  )
}

function CommandLine({
  command,
  isLast,
}: {
  command: string
  isLast: boolean
}) {
  const tokens = command.split(" ")
  const last = tokens[tokens.length - 1]
  const head = tokens.slice(0, -1).join(" ")
  return (
    <>
      <span className="text-muted-foreground select-none">$ </span>
      <span className="text-foreground">{head} </span>
      <span className="text-gradient">{last}</span>
      {isLast ? null : "\n"}
    </>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(id)
  }, [copied])

  return (
    <button
      type="button"
      aria-label="Copy command"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
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
