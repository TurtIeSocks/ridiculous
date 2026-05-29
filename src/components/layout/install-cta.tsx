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
    <div className="glass-card overflow-hidden rounded-2xl">
      {showTabs ? (
        <div className="border-white/10 border-b bg-black/20 px-2">
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
                    "-mb-px border-b-2 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] transition",
                    active
                      ? "border-violet-glow text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
      <div className="relative">
        <pre className="overflow-x-auto whitespace-pre px-6 py-5 pr-14 font-mono text-sm md:px-8 md:text-base">
          {commands.map((command, index) => (
            <CommandLine
              // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional and stable
              key={index}
              command={command}
              isLast={index === commands.length - 1}
            />
          ))}
        </pre>
        <CopyButton text={copyPayload} />
      </div>
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
      <span className="select-none text-muted-foreground">$ </span>
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
    <div className="absolute top-3 right-3 z-10">
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy command"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
          } catch {
            /* clipboard unavailable */
          }
        }}
        className="inline-flex size-8 items-center justify-center rounded-md border border-white/10 bg-background/80 text-muted-foreground backdrop-blur-sm transition hover:border-white/20 hover:bg-white/5 hover:text-foreground"
      >
        <span
          className={cn(
            "transition-all duration-200",
            copied ? "scale-100 opacity-100" : "absolute scale-75 opacity-0",
          )}
        >
          <CheckIcon />
        </span>
        <span
          className={cn(
            "transition-all duration-200",
            copied ? "absolute scale-75 opacity-0" : "scale-100 opacity-100",
          )}
        >
          <CopyIcon />
        </span>
      </button>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-0 bottom-full mb-2 rounded-md bg-foreground px-2 py-1 font-mono text-background text-xs shadow-lg transition-all duration-200",
          copied ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        )}
      >
        Copied
      </span>
    </div>
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
      className="size-4"
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
      className="size-4 text-violet-glow"
      aria-hidden="true"
    >
      <title>Copied</title>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
