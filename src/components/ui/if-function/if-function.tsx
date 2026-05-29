"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  branchCount,
  defaultBranch,
  formatIf,
  parseIf,
} from "./if-function.helpers"
import type {
  ConditionKind,
  IfBranch,
  IfFunctionString,
} from "./if-function.types"

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const ALL_KINDS: readonly ConditionKind[] = [
  "media",
  "supports",
  "style",
  "else",
]

const CONDITION_PLACEHOLDER: Record<ConditionKind, string> = {
  media: "width >= 600px",
  supports: "display: grid",
  style: "--x: 1",
  else: "",
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface IfFunctionPanelProps {
  value: IfFunctionString | (string & {})
  onChange: (value: IfFunctionString) => void
  className?: string
  "aria-label"?: string
}

export type IfFunctionProps = IfFunctionPanelProps

// ---------------------------------------------------------------------------
// IfFunction — popover-wrapped
// ---------------------------------------------------------------------------

export function IfFunction(props: IfFunctionProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS if() conditional value",
  } = props
  const count = branchCount(String(value))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span className="text-[10px] text-muted-foreground uppercase">
            if
          </span>
          <span className="text-[10px] text-muted-foreground">
            {count} {count === 1 ? "branch" : "branches"}
          </span>
          <span className="max-w-[200px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <IfFunctionPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// IfFunctionPanel — inline
// ---------------------------------------------------------------------------

export function IfFunctionPanel({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "CSS if() conditional value editor",
}: IfFunctionPanelProps) {
  const [branches, setBranches] = useState<IfBranch[]>(
    () => parseIf(String(value)) ?? [],
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseIf(String(value))
    if (parsed !== null) setBranches(parsed)
  }, [value])

  const commit = (next: IfBranch[]) => {
    setBranches(next)
    const str = formatIf(next)
    lastEmittedRef.current = str
    onChange(str as IfFunctionString)
  }

  const lastIndex = branches.length - 1

  const updateAt = (index: number, branch: IfBranch) => {
    commit(branches.map((it, i) => (i === index ? branch : it)))
  }
  const removeAt = (index: number) => {
    commit(branches.filter((_, i) => i !== index))
  }
  const add = () => {
    // `else` is only legal as the FINAL branch, so insert a new media branch
    // *before* a trailing else (keeping else last); otherwise append. Appending
    // after an else would emit a value parseIf rejects → silent data loss on
    // remount.
    const insertAt =
      branches.length > 0 && branches[branches.length - 1].kind === "else"
        ? branches.length - 1
        : branches.length
    const next = [...branches]
    next.splice(insertAt, 0, defaultBranch("media"))
    commit(next)
  }

  return (
    <fieldset
      className={cn(
        "m-0 w-[560px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="space-y-2">
        {branches.map((branch, i) => (
          <BranchRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and reorderable only by add/remove
            key={`branch-${i}`}
            index={i}
            branch={branch}
            // `else` is only offered on the final row.
            allowElse={i === lastIndex}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))}
      </div>
      <AddBranchButton onAdd={add} />
      <LiveString value={formatIf(branches)} />
      <IfPreview value={formatIf(branches)} />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// BranchRow (public)
// ---------------------------------------------------------------------------

export interface BranchRowProps {
  branch: IfBranch
  onChange: (branch: IfBranch) => void
  onRemove: () => void
  /** Whether the `else` kind is selectable (final row only). */
  allowElse?: boolean
  /** Positional index — used only for stable control labels. */
  index?: number
  className?: string
}

export function BranchRow({
  branch,
  onChange,
  onRemove,
  allowElse = false,
  index,
  className,
}: BranchRowProps) {
  const n = index === undefined ? "" : ` ${index + 1}`
  const isElse = branch.kind === "else"

  const setKind = (kind: ConditionKind) => {
    // Switching to/from else clears/keeps the condition appropriately.
    onChange({
      ...branch,
      kind,
      condition: kind === "else" ? "" : branch.condition,
    })
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <ConditionKindSelect
        label={`condition-kind${n}`}
        value={branch.kind}
        allowElse={allowElse || isElse}
        onChange={setKind}
      />
      {isElse ? (
        <span className="px-1 font-mono text-muted-foreground text-xs">
          (always)
        </span>
      ) : (
        <Input
          aria-label={`condition${n}`}
          value={branch.condition}
          spellCheck={false}
          autoComplete="off"
          placeholder={CONDITION_PLACEHOLDER[branch.kind]}
          onChange={(e) => onChange({ ...branch, condition: e.target.value })}
          className="h-8 w-[180px] font-mono text-xs"
        />
      )}
      <span className="font-mono text-muted-foreground text-xs">:</span>
      <Input
        aria-label={`value${n}`}
        value={branch.value}
        spellCheck={false}
        autoComplete="off"
        placeholder="value"
        onChange={(e) => onChange({ ...branch, value: e.target.value })}
        className="h-8 w-[120px] font-mono text-xs"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove branch${n}`}
        className="ml-auto rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ConditionKindSelect (public) — a labelled native select
// ---------------------------------------------------------------------------

export interface ConditionKindSelectProps {
  label: string
  value: ConditionKind
  onChange: (value: ConditionKind) => void
  /** Whether to offer the `else` option (final row only). */
  allowElse?: boolean
  className?: string
}

export function ConditionKindSelect({
  label,
  value,
  onChange,
  allowElse = false,
  className,
}: ConditionKindSelectProps) {
  const options = ALL_KINDS.filter((k) => k !== "else" || allowElse)
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as ConditionKind)}
      className={cn(
        "h-8 rounded-md border border-input bg-background px-1 font-mono text-xs",
        className,
      )}
    >
      {options.map((k) => (
        <option key={k} value={k}>
          {k}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// AddBranchButton (public)
// ---------------------------------------------------------------------------

export interface AddBranchButtonProps {
  onAdd: () => void
  className?: string
}

export function AddBranchButton({ onAdd, className }: AddBranchButtonProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label="Add a branch"
      className={cn(
        "h-9 w-full rounded-md border border-dashed bg-background px-2 font-mono text-muted-foreground text-xs hover:text-foreground",
        className,
      )}
    >
      + add branch
    </button>
  )
}

// ---------------------------------------------------------------------------
// LiveString (internal)
// ---------------------------------------------------------------------------

function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value}
    </code>
  )
}

// ---------------------------------------------------------------------------
// IfPreview (public) — applies the if() string to a sample element's color
// ---------------------------------------------------------------------------

export interface IfPreviewProps {
  value: string
  className?: string
}

export function IfPreview({ value, className }: IfPreviewProps) {
  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        <span className="font-mono text-[10px] text-amber-500">
          cutting-edge browser support
        </span>
      </div>
      <div className="flex h-16 items-center justify-center overflow-hidden rounded-md bg-[radial-gradient(circle_at_30%_40%,#1e293b,#0f172a)] px-4">
        {/* `if()` resolves in supporting browsers; elsewhere the declaration
            is ignored and the fallback color shows. No injection surface —
            the value is set via the style object, not innerHTML. */}
        <span
          data-preview-target
          className="font-mono font-semibold text-lg text-muted-foreground"
          style={{ color: value }}
        >
          if() value
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        The CSS <code className="font-mono">if()</code> function shipped in
        2025; support is still rolling out. Non-supporting browsers ignore the
        declaration and fall back.
      </p>
    </div>
  )
}
