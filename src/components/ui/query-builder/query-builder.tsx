"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import {
  defaultFeatureTest,
  enumOptionsFor,
  featureKind,
  featuresFor,
  matchesNow,
  parseQueryState,
  queryToString,
} from "./query-builder.helpers"
import type {
  FeatureOperator,
  FeatureTest,
  MediaModifier,
  MediaType,
  QueryMode,
  QueryState,
  QueryString,
} from "./query-builder.types"

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const MEDIA_TYPES: readonly MediaType[] = ["all", "screen", "print"]
const OPERATORS: readonly FeatureOperator[] = ["<", "<=", ">", ">=", "="]

type TestShape = "boolean" | "plain" | "range2" | "range3"

function shapeOf(test: FeatureTest): TestShape {
  return test.kind
}

// Extract the trailing CSS unit of a length value (defaults to px) so the
// length values flow through the unit-aware UnitInput.
function unitOf(value: string): string {
  const m = value.trim().match(/[a-z%]+$/i)
  return m ? m[0] : "px"
}

// Re-shape a feature test when its shape selector changes, keeping the feature.
function reshape(test: FeatureTest, shape: TestShape): FeatureTest {
  const feature = test.feature
  const value = "value" in test ? test.value : "0"
  switch (shape) {
    case "boolean":
      return { kind: "boolean", feature }
    case "plain":
      return { kind: "plain", feature, value }
    case "range2":
      return { kind: "range2", feature, op: ">=", value }
    case "range3":
      return {
        kind: "range3",
        feature,
        op: "<=",
        value,
        op2: "<=",
        value2: value,
      }
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QueryBuilderPanelProps {
  value: QueryString | (string & {})
  onChange: (value: QueryString) => void
  /** `"media"` (default) edits a media query; `"container"` a container query. */
  mode?: QueryMode
  className?: string
  "aria-label"?: string
}

export interface QueryBuilderProps extends QueryBuilderPanelProps {}

// ---------------------------------------------------------------------------
// QueryBuilder — popover-wrapped
// ---------------------------------------------------------------------------

export function QueryBuilder(props: QueryBuilderProps) {
  const {
    value,
    mode = "media",
    className,
    "aria-label": ariaLabel = "Edit a CSS media or container query",
  } = props

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span className="text-[10px] text-muted-foreground uppercase">
            {mode}
          </span>
          <span className="max-w-[220px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <QueryBuilderPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// QueryBuilderPanel — inline
// ---------------------------------------------------------------------------

export function QueryBuilderPanel({
  value,
  onChange,
  mode = "media",
  className,
  "aria-label": ariaLabel = "CSS media / container query editor",
}: QueryBuilderPanelProps) {
  const [state, setState] = useState<QueryState>(
    () =>
      parseQueryState(String(value), mode) ?? {
        mode,
        joiner: "and",
        not: false,
        tests: [],
      },
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value or a mode change (skip our own emits).
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-parse on value OR mode change; state is the derived target
  useEffect(() => {
    if (value === lastEmittedRef.current && state.mode === mode) return
    const parsed = parseQueryState(String(value), mode)
    if (parsed !== null) setState(parsed)
    else setState((s) => ({ ...s, mode }))
  }, [value, mode])

  const commit = (next: QueryState) => {
    setState(next)
    const str = queryToString(next)
    lastEmittedRef.current = str
    onChange(str as QueryString)
  }

  const updateAt = (index: number, test: FeatureTest) => {
    commit({
      ...state,
      tests: state.tests.map((it, i) => (i === index ? test : it)),
    })
  }
  const removeAt = (index: number) => {
    commit({ ...state, tests: state.tests.filter((_, i) => i !== index) })
  }
  const add = () => {
    commit({ ...state, tests: [...state.tests, defaultFeatureTest(mode)] })
  }

  const liveString = queryToString(state)

  return (
    <fieldset
      className={cn(
        "m-0 w-[600px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="flex flex-wrap items-center gap-2">
        {mode === "media" ? (
          <MediaTypeSelect
            modifier={state.modifier}
            mediaType={state.mediaType}
            onChange={({ modifier, mediaType }) =>
              commit({ ...state, modifier, mediaType })
            }
          />
        ) : (
          <ContainerNameInput
            name={state.containerName ?? ""}
            onChange={(containerName) => commit({ ...state, containerName })}
          />
        )}
        <NotToggle
          checked={state.not}
          onChange={(not) => commit({ ...state, not })}
        />
        {state.tests.length > 1 && (
          <JoinerSelect
            value={state.joiner}
            onChange={(joiner) => commit({ ...state, joiner })}
          />
        )}
      </div>

      <div className="space-y-2">
        {state.tests.map((test, i) => (
          <FeatureTestRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional, reordered only by add/remove
            key={`test-${i}`}
            index={i}
            mode={mode}
            test={test}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))}
      </div>

      <AddTestButton onAdd={add} />
      <LiveString value={liveString} />
      <QueryPreview value={liveString} mode={mode} />
    </fieldset>
  )
}

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
      <select
        aria-label="media modifier"
        value={modifier ?? ""}
        onChange={(e) =>
          onChange({
            modifier: (e.target.value || undefined) as
              | MediaModifier
              | undefined,
            mediaType,
          })
        }
        className="h-8 rounded-md border border-input bg-background px-1 font-mono text-xs"
      >
        <option value="">(no modifier)</option>
        <option value="only">only</option>
        <option value="not">not</option>
      </select>
      <select
        aria-label="media type"
        value={mediaType ?? ""}
        onChange={(e) =>
          onChange({
            modifier,
            mediaType: (e.target.value || undefined) as MediaType | undefined,
          })
        }
        className="h-8 rounded-md border border-input bg-background px-1 font-mono text-xs"
      >
        <option value="">(any)</option>
        {MEDIA_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
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
    <select
      aria-label="combine tests with"
      value={value}
      onChange={(e) => onChange(e.target.value as "and" | "or")}
      className={cn(
        "h-8 rounded-md border border-input bg-background px-1 font-mono text-xs",
        className,
      )}
    >
      <option value="and">and</option>
      <option value="or">or</option>
    </select>
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
// FeatureTestRow (public)
// ---------------------------------------------------------------------------

export interface FeatureTestRowProps {
  mode: QueryMode
  test: FeatureTest
  onChange: (test: FeatureTest) => void
  onRemove: () => void
  /** Positional index — used only for stable control labels. */
  index?: number
  className?: string
}

export function FeatureTestRow({
  mode,
  test,
  onChange,
  onRemove,
  index,
  className,
}: FeatureTestRowProps) {
  const n = index === undefined ? "" : ` ${index + 1}`
  const features = featuresFor(mode)
  const kind = featureKind(test.feature, mode)
  const enums = enumOptionsFor(test.feature)
  const shape = shapeOf(test)

  const setFeature = (feature: string) => {
    // when the new feature is an enum, snap a plain value into a valid keyword
    const opts = enumOptionsFor(feature)
    if (opts && "value" in test && !opts.includes(test.value)) {
      onChange({ kind: "plain", feature, value: opts[0] })
      return
    }
    onChange({ ...test, feature })
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <span className="font-mono text-muted-foreground text-xs">(</span>
      <select
        aria-label={`feature${n}`}
        value={features.includes(test.feature) ? test.feature : ""}
        onChange={(e) => setFeature(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-1 font-mono text-xs"
      >
        {!features.includes(test.feature) && (
          <option value="">{test.feature || "(feature)"}</option>
        )}
        {features.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <ShapeSelect
        label={`shape${n}`}
        value={shape}
        onChange={(s) => onChange(reshape(test, s))}
      />

      {test.kind === "plain" && (
        <>
          <span className="font-mono text-muted-foreground text-xs">:</span>
          <ValueField
            label={`value${n}`}
            kind={kind}
            value={test.value}
            onChange={(value) => onChange({ ...test, value })}
            enums={enums}
          />
        </>
      )}

      {test.kind === "range2" && (
        <>
          <OperatorSelect
            label={`operator${n}`}
            value={test.op}
            onChange={(op) => onChange({ ...test, op })}
          />
          <ValueField
            label={`value${n}`}
            kind={kind}
            value={test.value}
            onChange={(value) => onChange({ ...test, value })}
            enums={enums}
          />
        </>
      )}

      {test.kind === "range3" && (
        <>
          <OperatorSelect
            label={`operator${n}`}
            value={test.op}
            onChange={(op) => onChange({ ...test, op })}
          />
          <ValueField
            label={`value${n}`}
            kind="length"
            value={test.value}
            onChange={(value) => onChange({ ...test, value })}
            enums={null}
          />
          <OperatorSelect
            label={`operator2${n}`}
            value={test.op2}
            onChange={(op2) => onChange({ ...test, op2 })}
          />
          <ValueField
            label={`value2${n}`}
            kind="length"
            value={test.value2}
            onChange={(value2) => onChange({ ...test, value2 })}
            enums={null}
          />
        </>
      )}

      <span className="font-mono text-muted-foreground text-xs">)</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove feature test${n}`}
        className="ml-auto rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ShapeSelect (internal) — boolean / : / op / range
// ---------------------------------------------------------------------------

function ShapeSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: TestShape
  onChange: (value: TestShape) => void
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as TestShape)}
      className="h-8 rounded-md border border-input bg-background px-1 font-mono text-[11px]"
    >
      <option value="boolean">exists</option>
      <option value="plain">: value</option>
      <option value="range2">op value</option>
      <option value="range3">v op f op v</option>
    </select>
  )
}

// ---------------------------------------------------------------------------
// OperatorSelect (internal)
// ---------------------------------------------------------------------------

function OperatorSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: FeatureOperator
  onChange: (value: FeatureOperator) => void
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as FeatureOperator)}
      className="h-8 rounded-md border border-input bg-background px-1 font-mono text-xs"
    >
      {OPERATORS.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// ValueField (internal) — length → unit-input; enum → select; else → input
// ---------------------------------------------------------------------------

function ValueField({
  label,
  kind,
  value,
  onChange,
  enums,
}: {
  label: string
  kind: ReturnType<typeof featureKind>
  value: string
  onChange: (value: string) => void
  enums: readonly string[] | null
}) {
  if (enums) {
    return (
      <select
        aria-label={label}
        value={enums.includes(value) ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-1 font-mono text-xs"
      >
        {!enums.includes(value) && <option value="">{value || "—"}</option>}
        {enums.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
    )
  }
  if (kind === "length") {
    return (
      <div className="w-[120px]">
        <UnitInput
          aria-label={label}
          unit={unitOf(value)}
          value={value}
          onChange={onChange}
        />
      </div>
    )
  }
  return (
    <Input
      aria-label={label}
      value={value}
      spellCheck={false}
      autoComplete="off"
      placeholder={kind === "ratio" ? "16/9" : "value"}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-[110px] font-mono text-xs"
    />
  )
}

// ---------------------------------------------------------------------------
// AddTestButton (internal)
// ---------------------------------------------------------------------------

function AddTestButton({ onAdd }: { onAdd: () => void }) {
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
// LiveString (internal)
// ---------------------------------------------------------------------------

function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value || " "}
    </code>
  )
}

// ---------------------------------------------------------------------------
// QueryPreview (public) — live "matches now?" indicator (media only)
// ---------------------------------------------------------------------------

export interface QueryPreviewProps {
  value: string
  mode: QueryMode
  className?: string
}

export function QueryPreview({ value, mode, className }: QueryPreviewProps) {
  const [matches, setMatches] = useState<boolean | null>(() =>
    matchesNow(value, mode),
  )

  useEffect(() => {
    if (mode !== "media") {
      setMatches(null)
      return
    }
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      setMatches(null)
      return
    }
    let mql: MediaQueryList
    try {
      mql = window.matchMedia(value)
    } catch {
      setMatches(null)
      return
    }
    setMatches(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener?.("change", onChange)
    return () => mql.removeEventListener?.("change", onChange)
  }, [value, mode])

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        {mode === "media" ? (
          <span
            role="status"
            className={cn(
              "rounded px-2 py-0.5 font-mono text-[10px]",
              matches
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {matches === null
              ? "matchMedia unavailable"
              : matches
                ? "matches now ✓"
                : "no match now"}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground/70">
            container — match depends on the element size
          </span>
        )}
      </div>
      <p className="text-muted-foreground/70 text-[10px] leading-relaxed">
        {mode === "media" ? (
          <>
            Live result from{" "}
            <code className="font-mono">window.matchMedia()</code>, updated as
            the viewport changes.
          </>
        ) : (
          <>
            Container queries match against a sized container element at
            runtime; there is no global live-match API, so no indicator is shown
            here.
          </>
        )}
      </p>
    </div>
  )
}
