"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FeatureTestRow } from "./feature-test-row"
import {
  defaultFeatureTest,
  parseQueryState,
  queryToString,
} from "./query-builder.helpers"
import type {
  FeatureTest,
  QueryMode,
  QueryState,
  QueryString,
} from "./query-builder.types"
import {
  AddTestButton,
  ContainerNameInput,
  JoinerSelect,
  LiveString,
  MediaTypeSelect,
  NotToggle,
} from "./query-builder-fields"
import { QueryPreview } from "./query-preview"

export type { FeatureTestRowProps } from "./feature-test-row"
export { FeatureTestRow } from "./feature-test-row"
export type {
  ContainerNameInputProps,
  JoinerSelectProps,
  MediaTypeSelectProps,
  NotToggleProps,
} from "./query-builder-fields"
// Re-export the public sub-components + their prop types so consumers (and the
// barrel) can keep importing them from `./query-builder` after the split.
export {
  ContainerNameInput,
  JoinerSelect,
  MediaTypeSelect,
  NotToggle,
} from "./query-builder-fields"
export type { QueryPreviewProps } from "./query-preview"
export { QueryPreview } from "./query-preview"

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
