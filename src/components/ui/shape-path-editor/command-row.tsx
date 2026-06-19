"use client"

import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import { MiniSelect } from "./mini-select"
import { commandNames } from "./shape-path-editor.helpers"
import type { Point, ShapeCommand } from "./shape-path-editor.types"

// ---------------------------------------------------------------------------
// CommandRow (public) — one `<shape-command>`'s editor: a command-kind
// `<select>`, a `by`/`to` direction toggle, and the coordinate / `with` / `of`
// / flag fields shown per kind. The container owns the `ShapeCommand`; this is
// presentational. Add/remove/reorder are driven from the container via the
// `onRemove` / `onMoveUp` / `onMoveDown` callbacks.
//
// Coordinates use `unit-input`. A `<length-percentage>` carries its own unit
// (e.g. `0px` / `0%`); `CoordInput` parses the unit off the value so the
// scrub + numeric edits round-trip in the original unit.
// ---------------------------------------------------------------------------

/** Split a `<length-percentage>` into its unit so UnitInput can edit it. */
function unitOf(value: string): string {
  const m = value.match(/[a-z%]+$/i)
  return m ? m[0] : "px"
}

interface CoordInputProps {
  label: string
  value: string
  onChange: (next: string) => void
}

function CoordInput({ label, value, onChange }: CoordInputProps) {
  const unit = unitOf(value)
  return (
    <UnitInput
      aria-label={label}
      unit={unit}
      value={value}
      onChange={onChange}
      className="w-[96px]"
    />
  )
}

/** A new endpoint / control point default, keyed to the px canvas space. */
function defaultPoint(): Point {
  return { x: "50px", y: "50px" }
}

/**
 * Reseed a command to a new kind, preserving whatever fields the new kind can
 * carry. Endpoint coordinates carry over; control points / radius get defaults.
 */
function reseedKind(
  prev: ShapeCommand,
  kind: ShapeCommand["kind"],
): ShapeCommand {
  const by = "by" in prev ? prev.by : false
  const to: Point =
    "to" in prev ? prev.to : "value" in prev ? defaultPoint() : defaultPoint()
  switch (kind) {
    case "move":
    case "line":
      return { kind, by, to }
    case "hline":
    case "vline":
      return { kind, by, value: "50px" }
    case "curve":
      return { kind, by, to, control: defaultPoint() }
    case "smooth":
      return { kind, by, to }
    case "arc":
      return { kind, by, to, radius: { x: "50px", y: "50px" } }
    case "close":
      return { kind: "close" }
  }
}

export interface CommandRowProps {
  index: number
  command: ShapeCommand
  onChange: (next: ShapeCommand) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  className?: string
}

export function CommandRow({
  index,
  command,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  className,
}: CommandRowProps) {
  const n = index + 1
  const hasDirection = command.kind !== "close"

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <span className="w-5 text-center font-mono text-[10px] text-muted-foreground">
        {n}
      </span>

      <MiniSelect
        aria-label={`command ${n} kind`}
        value={command.kind}
        onValueChange={(v) =>
          onChange(reseedKind(command, v as ShapeCommand["kind"]))
        }
      >
        {commandNames().map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </MiniSelect>

      {hasDirection ? (
        <MiniSelect
          aria-label={`command ${n} direction`}
          value={"by" in command && command.by ? "by" : "to"}
          onValueChange={(v) => onChange({ ...command, by: v === "by" })}
        >
          <option value="to">to</option>
          <option value="by">by</option>
        </MiniSelect>
      ) : null}

      {(command.kind === "move" ||
        command.kind === "line" ||
        command.kind === "smooth") && (
        <>
          <CoordInput
            label={`command ${n} x`}
            value={command.to.x}
            onChange={(x) => onChange({ ...command, to: { ...command.to, x } })}
          />
          <CoordInput
            label={`command ${n} y`}
            value={command.to.y}
            onChange={(y) => onChange({ ...command, to: { ...command.to, y } })}
          />
        </>
      )}

      {(command.kind === "hline" || command.kind === "vline") && (
        <CoordInput
          label={`command ${n} value`}
          value={command.value}
          onChange={(value) => onChange({ ...command, value })}
        />
      )}

      {command.kind === "curve" && (
        <>
          <CoordInput
            label={`command ${n} x`}
            value={command.to.x}
            onChange={(x) => onChange({ ...command, to: { ...command.to, x } })}
          />
          <CoordInput
            label={`command ${n} y`}
            value={command.to.y}
            onChange={(y) => onChange({ ...command, to: { ...command.to, y } })}
          />
          <span className="font-mono text-[10px] text-muted-foreground">
            with
          </span>
          <CoordInput
            label={`command ${n} control x`}
            value={command.control.x}
            onChange={(x) =>
              onChange({ ...command, control: { ...command.control, x } })
            }
          />
          <CoordInput
            label={`command ${n} control y`}
            value={command.control.y}
            onChange={(y) =>
              onChange({ ...command, control: { ...command.control, y } })
            }
          />
        </>
      )}

      {command.kind === "arc" && (
        <>
          <CoordInput
            label={`command ${n} x`}
            value={command.to.x}
            onChange={(x) => onChange({ ...command, to: { ...command.to, x } })}
          />
          <CoordInput
            label={`command ${n} y`}
            value={command.to.y}
            onChange={(y) => onChange({ ...command, to: { ...command.to, y } })}
          />
          <span className="font-mono text-[10px] text-muted-foreground">
            of
          </span>
          <CoordInput
            label={`command ${n} radius x`}
            value={command.radius.x}
            onChange={(x) =>
              onChange({ ...command, radius: { ...command.radius, x } })
            }
          />
          <CoordInput
            label={`command ${n} radius y`}
            value={command.radius.y}
            onChange={(y) =>
              onChange({ ...command, radius: { ...command.radius, y } })
            }
          />
        </>
      )}

      <div className="ml-auto flex items-center gap-0.5">
        <button
          type="button"
          aria-label={`Move command ${n} up`}
          disabled={!canMoveUp}
          onClick={onMoveUp}
          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          aria-label={`Move command ${n} down`}
          disabled={!canMoveDown}
          onClick={onMoveDown}
          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          aria-label={`Remove command ${n}`}
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground hover:text-destructive"
        >
          ×
        </button>
      </div>
    </div>
  )
}
