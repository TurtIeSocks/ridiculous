"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MiniSelect } from "./mini-select"
import type { MediaModifier, MediaType } from "./query-builder.types"

// ---------------------------------------------------------------------------
// Shared query-level field controls: the media type/modifier or container-name
// header, the and/or joiner, the negate toggle, plus the add-row + live-string
// affordances. All are presentational; the container owns the state.
// ---------------------------------------------------------------------------

const MEDIA_TYPES: readonly MediaType[] = ["all", "screen", "print"]

// ---------------------------------------------------------------------------
// MediaTypeSelect (public)
// ---------------------------------------------------------------------------

export interface MediaTypeSelectProps {
  modifier: MediaModifier | undefined
  mediaType: MediaType | undefined
  onChange: (next: {
    modifier: MediaModifier | undefined
    mediaType: MediaType | undefined
  }) => void
  className?: string
}

export function MediaTypeSelect({
  modifier,
  mediaType,
  onChange,
  className,
}: MediaTypeSelectProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <MiniSelect
        aria-label="media modifier"
        value={modifier ?? ""}
        onValueChange={(v) =>
          onChange({
            modifier: (v || undefined) as MediaModifier | undefined,
            mediaType,
          })
        }
      >
        <option value="">(no modifier)</option>
        <option value="only">only</option>
        <option value="not">not</option>
      </MiniSelect>
      <MiniSelect
        aria-label="media type"
        value={mediaType ?? ""}
        onValueChange={(v) =>
          onChange({
            modifier,
            mediaType: (v || undefined) as MediaType | undefined,
          })
        }
      >
        <option value="">(any)</option>
        {MEDIA_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </MiniSelect>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ContainerNameInput (public)
// ---------------------------------------------------------------------------

export interface ContainerNameInputProps {
  name: string
  onChange: (name: string) => void
  className?: string
}

export function ContainerNameInput({
  name,
  onChange,
  className,
}: ContainerNameInputProps) {
  return (
    <Input
      aria-label="container name"
      value={name}
      spellCheck={false}
      autoComplete="off"
      placeholder="(optional name)"
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-8 w-[160px] font-mono text-xs", className)}
    />
  )
}

// ---------------------------------------------------------------------------
// JoinerSelect (public)
// ---------------------------------------------------------------------------

export interface JoinerSelectProps {
  value: "and" | "or"
  onChange: (value: "and" | "or") => void
  className?: string
}

export function JoinerSelect({
  value,
  onChange,
  className,
}: JoinerSelectProps) {
  return (
    <MiniSelect
      aria-label="combine tests with"
      value={value}
      onValueChange={(v) => onChange(v as "and" | "or")}
      className={className}
    >
      <option value="and">and</option>
      <option value="or">or</option>
    </MiniSelect>
  )
}

// ---------------------------------------------------------------------------
// NotToggle (public)
// ---------------------------------------------------------------------------

export interface NotToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function NotToggle({ checked, onChange, className }: NotToggleProps) {
  return (
    <label
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md border border-input px-2 font-mono text-muted-foreground text-xs",
        className,
      )}
    >
      <input
        type="checkbox"
        aria-label="negate the whole query (not)"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5"
      />
      not
    </label>
  )
}

// ---------------------------------------------------------------------------
// AddTestButton (internal — used by the container)
// ---------------------------------------------------------------------------

export function AddTestButton({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label="Add a feature test"
      className="h-9 w-full rounded-md border border-dashed bg-background px-2 font-mono text-muted-foreground text-xs hover:text-foreground"
    >
      + add feature test
    </button>
  )
}

// ---------------------------------------------------------------------------
// LiveString (internal — used by the container)
// ---------------------------------------------------------------------------

export function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value || " "}
    </code>
  )
}
