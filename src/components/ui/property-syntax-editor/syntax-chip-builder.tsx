"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { dataTypeNames } from "./property-syntax-editor.helpers"
import type {
  MultiplierToken,
  SyntaxComponent,
} from "./property-syntax-editor.types"

// ---------------------------------------------------------------------------
// SyntaxChipBuilder (public) — the `@property` `syntax:` chip editor. A palette
// of `<data-type>` buttons + an "add literal ident" input append OR'd
// components; each chosen chip is a pill with a none / `+` / `#` multiplier
// segmented toggle, a reorder pair, and a remove. Chips render with a visible
// `|` between them. A `*` (universal) switch is exclusive — flipping it on
// clears the chips; flipping it off restores an editable component. The
// container owns the state; this edits it immutably.
// ---------------------------------------------------------------------------

const MULTIPLIERS: readonly { token: MultiplierToken; label: string }[] = [
  { token: "", label: "·" },
  { token: "+", label: "+" },
  { token: "#", label: "#" },
]

const IDENT_RE = /^[A-Za-z0-9_-]+$/

export interface SyntaxChipBuilderProps {
  universal: boolean
  components: SyntaxComponent[]
  onChange: (next: {
    universal: boolean
    components: SyntaxComponent[]
  }) => void
  className?: string
}

export function SyntaxChipBuilder({
  universal,
  components,
  onChange,
  className,
}: SyntaxChipBuilderProps) {
  const [ident, setIdent] = useState("")

  const updateAt = (index: number, c: SyntaxComponent) =>
    onChange({
      universal: false,
      components: components.map((it, i) => (i === index ? c : it)),
    })
  const removeAt = (index: number) =>
    onChange({
      universal: false,
      components: components.filter((_, i) => i !== index),
    })
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= components.length) return
    const next = [...components]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ universal: false, components: next })
  }
  const addType = (name: string) =>
    onChange({
      universal: false,
      components: [
        ...components,
        { base: `<${name}>`, isType: true, multiplier: "" },
      ],
    })
  const addIdent = () => {
    const v = ident.trim()
    if (v === "" || !IDENT_RE.test(v)) return
    onChange({
      universal: false,
      components: [...components, { base: v, isType: false, multiplier: "" }],
    })
    setIdent("")
  }
  const toggleUniversal = (next: boolean) => {
    if (next) onChange({ universal: true, components: [] })
    else
      onChange({
        universal: false,
        components: [{ base: "<length>", isType: true, multiplier: "" }],
      })
  }

  return (
    <div className={cn("space-y-3", className)}>
      <label className="flex h-8 w-fit items-center gap-1.5 rounded-md border border-input px-2 font-mono text-muted-foreground text-xs">
        <input
          type="checkbox"
          aria-label="universal — accept any value (*)"
          checked={universal}
          onChange={(e) => toggleUniversal(e.target.checked)}
          className="size-3.5"
        />
        universal (*)
      </label>

      {universal ? (
        <p className="font-mono text-muted-foreground text-xs">
          accepts any value
        </p>
      ) : (
        <>
          <ul className="flex flex-wrap items-center gap-1.5">
            {components.map((c, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: chips are positional, reordered only by move/remove
                key={`component-${i}`}
                aria-label={`component ${i + 1}`}
                className="flex items-center gap-1"
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="font-mono text-muted-foreground text-xs"
                  >
                    |
                  </span>
                )}
                <div className="flex items-center gap-1 rounded-md border border-input p-1">
                  <span className="px-1 font-mono text-foreground text-xs">
                    {c.base}
                  </span>

                  <div className="flex items-center gap-0.5">
                    {/* a labelled segmented control — each button carries its
                    own `Set component N multiplier to …` label + aria-pressed */}
                    {MULTIPLIERS.map(({ token, label }) => (
                      <button
                        key={token || "none"}
                        type="button"
                        aria-label={`Set component ${i + 1} multiplier to ${
                          token === "" ? "none" : token
                        }`}
                        aria-pressed={c.multiplier === token}
                        onClick={() => updateAt(i, { ...c, multiplier: token })}
                        className={cn(
                          "h-5 w-5 rounded font-mono text-xs hover:bg-muted/50",
                          c.multiplier === token &&
                            "bg-primary text-primary-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    aria-label={`Move component ${i + 1} left`}
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="h-5 w-5 rounded font-mono text-xs hover:bg-muted/50 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label={`Move component ${i + 1} right`}
                    onClick={() => move(i, 1)}
                    disabled={i === components.length - 1}
                    className="h-5 w-5 rounded font-mono text-xs hover:bg-muted/50 disabled:opacity-40"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove component ${i + 1}`}
                    onClick={() => removeAt(i)}
                    className="h-5 w-5 rounded font-mono text-xs hover:bg-muted/50"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-1">
            {dataTypeNames().map((name) => (
              <button
                key={name}
                type="button"
                aria-label={`Add <${name}>`}
                onClick={() => addType(name)}
                className="h-7 rounded-md border border-input bg-background px-2 font-mono text-muted-foreground text-xs hover:text-foreground"
              >
                {`<${name}>`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              aria-label="literal ident to add"
              value={ident}
              spellCheck={false}
              autoComplete="off"
              placeholder="literal ident (e.g. auto)"
              onChange={(e) => setIdent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addIdent()
                }
              }}
              className="h-8 w-[180px] rounded-md border border-input bg-background px-2 font-mono text-xs"
            />
            <button
              type="button"
              aria-label="Add the literal ident"
              onClick={addIdent}
              className="h-8 rounded-md border border-dashed bg-background px-2 font-mono text-muted-foreground text-xs hover:text-foreground"
            >
              + add ident
            </button>
          </div>
        </>
      )}
    </div>
  )
}
