"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { LENGTH_UNITS, TRACK_KEYWORDS } from "./grid-builder.constants"
import { defaultTrack, type TrackToken } from "./grid-builder.helpers"

// ---------------------------------------------------------------------------
// TrackListEditor (public)
// ---------------------------------------------------------------------------

export interface TrackListEditorProps {
  tokens: TrackToken[]
  onChange: (tokens: TrackToken[]) => void
  className?: string
}

export function TrackListEditor({
  tokens,
  onChange,
  className,
}: TrackListEditorProps) {
  const updateAt = (i: number, token: TrackToken) => {
    onChange(tokens.map((t, idx) => (idx === i ? token : t)))
  }
  const removeAt = (i: number) => {
    onChange(tokens.filter((_, idx) => idx !== i))
  }
  const add = (kind: TrackToken["kind"]) => {
    onChange([...tokens, defaultTrack(kind)])
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1.5">
        {tokens.map((token, i) => (
          <TrackTokenRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional, reordered only by add/remove
            key={`${token.kind}-${i}`}
            token={token}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))}
        {tokens.length === 0 ? (
          <p className="px-1 py-2 text-muted-foreground text-xs">
            No tracks yet — add a size, function, or named line.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <AddButton label="+ size" onClick={() => add("size")} />
        <AddButton label="+ function" onClick={() => add("fn")} />
        <AddButton label="+ [line]" onClick={() => add("line")} />
      </div>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-dashed bg-background px-2.5 py-1.5 font-mono text-muted-foreground text-xs hover:bg-muted/50"
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// TrackTokenRow (public)
// ---------------------------------------------------------------------------

export interface TrackTokenRowProps {
  token: TrackToken
  onChange: (token: TrackToken) => void
  onRemove: () => void
  className?: string
}

/** Split "10px"/"1fr"/"50%" into number + unit; opaque (calc/keyword) → null. */
function splitSize(value: string): { num: string; unit: string } | null {
  const m = value.match(/^(-?\d*\.?\d+)([a-z%]*)$/i)
  if (!m) return null
  return { num: m[1], unit: m[2] }
}

export function TrackTokenRow({
  token,
  onChange,
  onRemove,
  className,
}: TrackTokenRowProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        {token.kind}
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {token.kind === "size" ? (
          <SizeEditor
            value={token.value}
            onChange={(value) => onChange({ kind: "size", value })}
          />
        ) : token.kind === "line" ? (
          <Input
            aria-label="line names"
            value={token.names.join(" ")}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              const names = e.target.value.split(/\s+/).filter(Boolean)
              onChange({
                kind: "line",
                names,
                value: `[${names.join(" ")}]`,
              })
            }}
            className="h-8 w-full font-mono text-xs"
          />
        ) : (
          <Input
            aria-label="function track"
            value={token.value}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              const value = e.target.value
              const name = value.match(/^([a-zA-Z-]+)\(/)?.[1] ?? token.name
              onChange({ kind: "fn", name, value })
            }}
            className="h-8 w-full font-mono text-xs"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${token.kind} track`}
        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

function SizeEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const parts = splitSize(value)
  const isKeyword = (TRACK_KEYWORDS as readonly string[]).includes(value)

  if (parts === null || isKeyword) {
    // keyword or opaque (calc/var) — raw input + keyword shortcut select
    return (
      <span className="inline-flex w-full items-center gap-1">
        <Input
          aria-label="track size"
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className="h-8 flex-1 font-mono text-xs"
        />
        <select
          aria-label="track keyword"
          value={isKeyword ? value : ""}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="h-8 rounded border bg-background px-1 font-mono text-xs"
        >
          <option value="">kw…</option>
          {TRACK_KEYWORDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center">
      <Input
        aria-label="track size"
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-[80px] rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label="track size unit"
        value={parts.unit || LENGTH_UNITS[0]}
        onChange={(e) => onChange(`${parts.num || "1"}${e.target.value}`)}
        className="h-8 rounded-r-md rounded-l-none border border-input bg-background px-1 font-mono text-xs"
      >
        {LENGTH_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </span>
  )
}
