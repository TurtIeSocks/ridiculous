"use client"

import type { ReactNode } from "react"
import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  ABSOLUTE_SIZES,
  defaultParts,
  FONT_STRETCHES,
  FONT_STYLES,
  FONT_VARIANTS,
  FONT_WEIGHT_KEYWORDS,
  formatFont,
  GENERIC_FAMILIES,
  parseFont,
  SYSTEM_FONTS,
  WEB_SAFE_FAMILIES,
} from "./font-editor.helpers"
import type { FontParts, FontString } from "./font-editor.types"

const SIZE_UNITS = ["px", "rem", "em", "%", "vw", "vh", "pt"] as const

const SAMPLE_TEXT_DEFAULT = "The quick brown fox jumps over the lazy dog"

// Monotonic source of stable per-row ids for the family list (see FamilyEditor).
let nextFamilyId = 0

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export interface FontEditorPanelProps {
  value: FontString | (string & {})
  onChange: (value: FontString) => void
  className?: string
  "aria-label"?: string
}

export interface FontEditorProps extends FontEditorPanelProps {}

// ---------------------------------------------------------------------------
// shorthand-parts helpers (UI-local)
// ---------------------------------------------------------------------------

interface Shorthand {
  kind: "shorthand"
  style?: string
  variant?: string
  weight?: string
  stretch?: string
  size: string
  lineHeight?: string
  family: string[]
}

function asShorthand(parts: FontParts): Shorthand {
  if (parts.kind === "shorthand") return parts
  // Converting from a system keyword → seed a shorthand. `defaultParts()` is
  // typed as the wider `FontParts`, so narrow on the discriminant instead of
  // casting; the fallback keeps a real shorthand without an unchecked `as`.
  const seed = defaultParts()
  if (seed.kind === "shorthand") return seed
  return { kind: "shorthand", size: "16px", family: ["sans-serif"] }
}

// A number for the dual control: mandatory mantissa (≥1 digit, so a lone `-`
// or a bare unit never matches) with an optional exponent, then an optional
// unit. Empty / sign-only / unit-only inputs fall through to the opaque path.
const SIZE_NUM_UNIT_RE = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/i

/** Split a size like "16px" into number + unit for the dual control. */
function splitSize(size: string): {
  num: string
  unit: string
  opaque: boolean
} {
  if ((ABSOLUTE_SIZES as readonly string[]).includes(size)) {
    return { num: size, unit: "", opaque: true }
  }
  const m = size.match(SIZE_NUM_UNIT_RE)
  if (!m) return { num: size, unit: "", opaque: true }
  return { num: m[1], unit: m[2], opaque: false }
}

// ---------------------------------------------------------------------------
// FontEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function FontEditor(props: FontEditorProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS font shorthand",
  } = props
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span aria-hidden="true" className="text-foreground/60">
            Aa
          </span>
          <span className="max-w-[220px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <FontEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// FontEditorPanel — inline
// ---------------------------------------------------------------------------

export function FontEditorPanel({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "CSS font shorthand editor",
}: FontEditorPanelProps) {
  const [parts, setParts] = useState<FontParts>(
    () => parseFont(String(value)) ?? defaultParts(),
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseFont(String(value))
    if (parsed !== null) setParts(parsed)
  }, [value])

  const commit = (next: FontParts) => {
    setParts(next)
    const str = formatFont(next)
    lastEmittedRef.current = str
    onChange(str as FontString)
  }

  const setShorthand = (patch: Partial<Shorthand>) => {
    const base = asShorthand(parts)
    commit({ ...base, ...patch })
  }

  const isSystem = parts.kind === "system"

  return (
    <fieldset
      className={cn(
        "m-0 w-[420px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <ModeToggle
        mode={isSystem ? "system" : "shorthand"}
        onMode={(mode) => {
          if (mode === "system") {
            commit({ kind: "system", keyword: "caption" })
          } else {
            commit(defaultParts())
          }
        }}
      />

      {isSystem ? (
        <SystemKeywordSelect
          value={parts.kind === "system" ? parts.keyword : "caption"}
          onChange={(keyword) => commit({ kind: "system", keyword })}
        />
      ) : (
        <ShorthandFields
          parts={asShorthand(parts)}
          onChange={(patch) => setShorthand(patch)}
        />
      )}

      <LiveString value={formatFont(parts)} />
      <FontPreview value={formatFont(parts)} />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// ModeToggle (internal)
// ---------------------------------------------------------------------------

function ModeToggle({
  mode,
  onMode,
}: {
  mode: "shorthand" | "system"
  onMode: (mode: "shorthand" | "system") => void
}) {
  return (
    <div className="flex gap-1 rounded-md border p-0.5">
      {(["shorthand", "system"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onMode(m)}
          className={cn(
            "flex-1 rounded px-2 py-1 font-mono text-xs",
            mode === m
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {m === "shorthand" ? "shorthand" : "system font"}
        </button>
      ))}
    </div>
  )
}

function SystemKeywordSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (keyword: (typeof SYSTEM_FONTS)[number]) => void
}) {
  return (
    <PropertyField label="System font">
      <select
        aria-label="System font keyword"
        value={value}
        onChange={(e) =>
          onChange(e.target.value as (typeof SYSTEM_FONTS)[number])
        }
        className="h-8 w-full rounded border bg-background px-1.5 font-mono text-xs"
      >
        {SYSTEM_FONTS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
    </PropertyField>
  )
}

// ---------------------------------------------------------------------------
// ShorthandFields (internal) — the property rows
// ---------------------------------------------------------------------------

function ShorthandFields({
  parts,
  onChange,
}: {
  parts: Shorthand
  onChange: (patch: Partial<Shorthand>) => void
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <PropertyField label="Style">
          <KeywordSelect
            ariaLabel="Font style"
            options={FONT_STYLES}
            value={parts.style ?? "normal"}
            allowEmpty
            onChange={(v) => onChange({ style: v })}
          />
        </PropertyField>
        <PropertyField label="Variant">
          <KeywordSelect
            ariaLabel="Font variant"
            options={FONT_VARIANTS}
            value={parts.variant ?? "normal"}
            allowEmpty
            onChange={(v) => onChange({ variant: v })}
          />
        </PropertyField>
        <PropertyField label="Weight">
          <WeightControl
            value={parts.weight ?? "normal"}
            onChange={(v) => onChange({ weight: v })}
          />
        </PropertyField>
        <PropertyField label="Stretch">
          <KeywordSelect
            ariaLabel="Font stretch"
            options={FONT_STRETCHES}
            value={parts.stretch ?? "normal"}
            allowEmpty
            onChange={(v) => onChange({ stretch: v })}
          />
        </PropertyField>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <PropertyField label="Size">
          <SizeControl
            value={parts.size}
            onChange={(v) => onChange({ size: v })}
          />
        </PropertyField>
        <PropertyField label="Line height">
          <LineHeightControl
            value={parts.lineHeight ?? ""}
            onChange={(v) => onChange({ lineHeight: v === "" ? undefined : v })}
          />
        </PropertyField>
      </div>

      <PropertyField label="Font family">
        <FamilyEditor
          value={parts.family}
          onChange={(family) => onChange({ family })}
        />
      </PropertyField>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PropertyField (public)
// ---------------------------------------------------------------------------

export interface PropertyFieldProps {
  label: string
  children: ReactNode
  className?: string
}

export function PropertyField({
  label,
  children,
  className,
}: PropertyFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field controls (internal)
// ---------------------------------------------------------------------------

function KeywordSelect({
  ariaLabel,
  options,
  value,
  allowEmpty,
  onChange,
}: {
  ariaLabel: string
  options: readonly string[]
  value: string
  allowEmpty?: boolean
  onChange: (value: string) => void
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded border bg-background px-1.5 font-mono text-xs"
    >
      {allowEmpty ? <option value="normal">normal</option> : null}
      {options
        .filter((o) => !(allowEmpty && o === "normal"))
        .map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
    </select>
  )
}

function WeightControl({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const isNumeric = /^\d+$/.test(value)
  return (
    <span className="inline-flex w-full items-center gap-1">
      <select
        aria-label="Font weight keyword"
        value={isNumeric ? "__number" : value}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === "__number" ? "400" : v)
        }}
        className="h-8 flex-1 rounded border bg-background px-1.5 font-mono text-xs"
      >
        {FONT_WEIGHT_KEYWORDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
        <option value="__number">number…</option>
      </select>
      {isNumeric ? (
        <Input
          aria-label="Font weight number"
          value={value}
          inputMode="numeric"
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-16 font-mono text-xs"
        />
      ) : null}
    </span>
  )
}

function SizeControl({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { num, unit, opaque } = splitSize(value)
  const usingKeyword = (ABSOLUTE_SIZES as readonly string[]).includes(value)

  return (
    <span className="inline-flex w-full items-center">
      <Input
        aria-label="Font size"
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className="h-8 flex-1 rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label="Font size unit"
        value={usingKeyword ? "keyword" : opaque ? "" : unit || "px"}
        onChange={(e) => {
          const u = e.target.value
          if (u === "keyword") {
            onChange("medium")
          } else if (u !== "") {
            onChange(`${num || "16"}${u}`)
          }
        }}
        className="h-8 rounded-r-md rounded-l-none border border-input bg-background px-1 font-mono text-xs"
      >
        {SIZE_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
        <option value="keyword">abs</option>
        {opaque && !usingKeyword ? <option value="">—</option> : null}
      </select>
    </span>
  )
}

function LineHeightControl({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Input
      aria-label="Line height"
      value={value}
      placeholder="normal"
      spellCheck={false}
      autoComplete="off"
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full font-mono text-xs"
    />
  )
}

// ---------------------------------------------------------------------------
// FamilyEditor (public) — the comma-separated family list
// ---------------------------------------------------------------------------

export interface FamilyEditorProps {
  value: string[]
  onChange: (value: string[]) => void
  className?: string
}

export function FamilyEditor({
  value,
  onChange,
  className,
}: FamilyEditorProps) {
  // One stable id per row, created when the row is created. Keying on this id
  // (instead of the array index) keeps a surviving row's DOM element identity
  // across add/remove, so focus/IME state on a row above a removal is not lost.
  const idsRef = useRef<number[]>([])
  // Reconcile id count with the current value length: handler-driven mutations
  // keep them in lockstep below, so this only fires for external replacements
  // (resync / fallback). Existing ids are preserved by position; new slots get
  // fresh ids.
  if (idsRef.current.length !== value.length) {
    const next = idsRef.current.slice(0, value.length)
    while (next.length < value.length) next.push(nextFamilyId++)
    idsRef.current = next
  }
  const ids = idsRef.current

  const setAt = (index: number, next: string) => {
    onChange(value.map((f, i) => (i === index ? next : f)))
  }
  const removeAt = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    if (next.length === 0) {
      // fall back to a single default family — one fresh row, one fresh id
      idsRef.current = [nextFamilyId++]
      onChange(["sans-serif"])
      return
    }
    idsRef.current = ids.filter((_, i) => i !== index)
    onChange(next)
  }
  const add = (family: string) => {
    idsRef.current = [...ids, nextFamilyId++]
    onChange([...value, family])
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {value.map((family, i) => (
        <div key={ids[i]} className="flex items-center gap-1">
          <Input
            aria-label={`Font family ${i + 1}`}
            value={family}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setAt(i, e.target.value)}
            className="h-8 flex-1 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label={`Remove family ${i + 1}`}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ))}
      <select
        aria-label="Add a font family"
        value=""
        onChange={(e) => {
          const f = e.target.value
          if (f) add(f)
          e.target.value = ""
        }}
        className="h-8 w-full rounded-md border border-dashed bg-background px-2 font-mono text-muted-foreground text-xs"
      >
        <option value="">+ add family…</option>
        <optgroup label="generic">
          {GENERIC_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </optgroup>
        <optgroup label="web-safe">
          {WEB_SAFE_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LiveString (internal)
// ---------------------------------------------------------------------------

function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {`font: ${value};`}
    </code>
  )
}

// ---------------------------------------------------------------------------
// FontPreview (public) — the live text preview
// ---------------------------------------------------------------------------

export interface FontPreviewProps {
  value: string
  sampleText?: string
  editable?: boolean
  className?: string
}

/**
 * Live text preview: renders sample text with the built `font` shorthand
 * applied via inline style. The sample text is editable when `editable`
 * (default true). This is a React element rendering text — no browser
 * tooling involved.
 */
export function FontPreview({
  value,
  sampleText,
  editable = true,
  className,
}: FontPreviewProps) {
  const id = useId()
  const [text, setText] = useState(sampleText ?? SAMPLE_TEXT_DEFAULT)
  const shown = sampleText ?? text

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">preview</span>
        {editable && sampleText === undefined ? (
          <input
            id={`${id}-sample`}
            aria-label="Sample text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 w-40 rounded border bg-background px-1.5 text-xs"
          />
        ) : null}
      </div>
      <div
        data-font-preview
        style={{ font: value === "" ? undefined : value }}
        className="min-h-[3rem] break-words rounded-md bg-muted/30 p-3 text-foreground"
      >
        {shown}
      </div>
    </div>
  )
}
