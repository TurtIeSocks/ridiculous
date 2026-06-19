"use client"

import { cn } from "@/lib/utils"
import { formatPositionTry, tryTactics } from "./anchor-position-editor.helpers"
import type { TryFallback } from "./anchor-position-editor.types"
import { MiniSelect } from "./mini-select"

// ---------------------------------------------------------------------------
// TryFallbackChain (public) — a reorderable list of `position-try-fallbacks`
// chips. Each chip is `none`, a `<position-area>` (free text), or the
// `<dashed-ident> || <try-tactic>` arm (an ident input + a tactic select).
// Reorder via up/down buttons — no drag-and-drop dependency (A11). Add appends
// a default tactic fallback; remove drops the chip. The container owns the
// array; this edits it immutably.
// ---------------------------------------------------------------------------

const KINDS: readonly TryFallback["kind"][] = ["tactics", "area", "none"]

function defaultFallback(): TryFallback {
  return { kind: "tactics", idents: [], tactics: ["flip-block"] }
}

export interface TryFallbackChainProps {
  fallbacks: TryFallback[]
  onChange: (next: TryFallback[]) => void
  className?: string
}

export function TryFallbackChain({
  fallbacks,
  onChange,
  className,
}: TryFallbackChainProps) {
  const updateAt = (index: number, f: TryFallback) =>
    onChange(fallbacks.map((it, i) => (i === index ? f : it)))
  const removeAt = (index: number) =>
    onChange(fallbacks.filter((_, i) => i !== index))
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= fallbacks.length) return
    const next = [...fallbacks]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  const add = () => onChange([...fallbacks, defaultFallback()])

  return (
    <div className={cn("space-y-2", className)}>
      <ul className="space-y-2">
        {fallbacks.map((f, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: chips are positional, reordered only by move/remove
            key={`fallback-${i}`}
            aria-label={`fallback ${i + 1}`}
            className="flex flex-wrap items-center gap-1.5 rounded-md border border-input p-1.5"
          >
            <MiniSelect
              aria-label={`kind of fallback ${i + 1}`}
              value={f.kind}
              onValueChange={(v) =>
                updateAt(i, snapKind(v as TryFallback["kind"], f))
              }
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </MiniSelect>

            <FallbackBody
              index={i}
              fallback={f}
              onChange={(next) => updateAt(i, next)}
            />

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                aria-label={`Move fallback ${i + 1} up`}
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="h-6 w-6 rounded border font-mono text-xs hover:bg-muted/50 disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move fallback ${i + 1} down`}
                onClick={() => move(i, 1)}
                disabled={i === fallbacks.length - 1}
                className="h-6 w-6 rounded border font-mono text-xs hover:bg-muted/50 disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Remove fallback ${i + 1}`}
                onClick={() => removeAt(i)}
                className="h-6 w-6 rounded border font-mono text-xs hover:bg-muted/50"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={add}
        aria-label="Add a fallback"
        className="h-9 w-full rounded-md border border-dashed bg-background px-2 font-mono text-muted-foreground text-xs hover:text-foreground"
      >
        + add fallback
      </button>

      <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
        {formatPositionTry(fallbacks) || " "}
      </code>
    </div>
  )
}

/** Re-seed a fallback's body when its kind changes. */
function snapKind(kind: TryFallback["kind"], prev: TryFallback): TryFallback {
  if (kind === "none") return { kind: "none" }
  if (kind === "area") return { kind: "area", area: prev.area ?? "top" }
  return {
    kind: "tactics",
    idents: prev.idents ?? [],
    tactics: prev.tactics ?? ["flip-block"],
  }
}

// ---------------------------------------------------------------------------
// FallbackBody — the per-kind editor body.
// ---------------------------------------------------------------------------

function FallbackBody({
  index,
  fallback,
  onChange,
}: {
  index: number
  fallback: TryFallback
  onChange: (next: TryFallback) => void
}) {
  if (fallback.kind === "none") {
    return <span className="font-mono text-muted-foreground text-xs">none</span>
  }

  if (fallback.kind === "area") {
    return (
      <input
        aria-label={`position-area for fallback ${index + 1}`}
        value={fallback.area ?? ""}
        spellCheck={false}
        autoComplete="off"
        placeholder="top left"
        onChange={(e) => onChange({ ...fallback, area: e.target.value })}
        className="h-8 w-[140px] rounded-md border border-input bg-background px-2 font-mono text-xs"
      />
    )
  }

  // tactics arm — an ident input + a tactic select
  const idents = fallback.idents ?? []
  const tactics = fallback.tactics ?? []
  return (
    <>
      <input
        aria-label={`dashed-ident for fallback ${index + 1}`}
        value={idents[0] ?? ""}
        spellCheck={false}
        autoComplete="off"
        placeholder="--name"
        onChange={(e) => {
          const v = e.target.value.trim()
          onChange({ ...fallback, idents: v === "" ? [] : [v] })
        }}
        className="h-8 w-[120px] rounded-md border border-input bg-background px-2 font-mono text-xs"
      />
      <MiniSelect
        aria-label={`tactic for fallback ${index + 1}`}
        value={tactics[0] ?? ""}
        onValueChange={(v) =>
          onChange({ ...fallback, tactics: v === "" ? [] : [v] })
        }
      >
        <option value="">(no tactic)</option>
        {tryTactics().map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </MiniSelect>
    </>
  )
}
