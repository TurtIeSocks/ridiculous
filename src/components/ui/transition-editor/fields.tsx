"use client"

import { EasingPicker } from "@/components/ui/easing-picker"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { KeywordSelect, TimeField } from "./controls"
import type {
  AnimationDirection,
  AnimationFillMode,
  AnimationLayer,
  AnimationPlayState,
  TransitionLayer,
} from "./transition-editor.types"

// ---------------------------------------------------------------------------
// Field-group constants
// ---------------------------------------------------------------------------

const COMMON_PROPERTIES = [
  "all",
  "none",
  "opacity",
  "transform",
  "color",
  "background-color",
  "width",
  "height",
  "box-shadow",
  "filter",
] as const

const DIRECTIONS: readonly AnimationDirection[] = [
  "normal",
  "reverse",
  "alternate",
  "alternate-reverse",
]
const FILL_MODES: readonly AnimationFillMode[] = [
  "none",
  "forwards",
  "backwards",
  "both",
]
const PLAY_STATES: readonly AnimationPlayState[] = ["running", "paused"]

// ---------------------------------------------------------------------------
// TransitionFields — the transition-mode controls
// ---------------------------------------------------------------------------

interface TransitionFieldsProps {
  n: string
  layer: TransitionLayer
  onChange: (layer: TransitionLayer) => void
}

export function TransitionFields({
  n,
  layer,
  onChange,
}: TransitionFieldsProps) {
  const setField = (patch: Partial<TransitionLayer>) => {
    onChange({ ...layer, ...patch })
  }
  return (
    <>
      <Input
        aria-label={`transition-property${n}`}
        list="te-property-list"
        value={layer.property ?? ""}
        spellCheck={false}
        autoComplete="off"
        placeholder="property"
        onChange={(e) =>
          setField({
            property: e.target.value === "" ? undefined : e.target.value,
          })
        }
        className="h-8 w-[120px] font-mono text-xs"
      />
      <datalist id="te-property-list">
        {COMMON_PROPERTIES.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <TimeField
        label={`duration${n}`}
        value={layer.duration ?? ""}
        onChange={(duration) =>
          setField({ duration: duration === "" ? undefined : duration })
        }
      />
      <TimeField
        label={`delay${n}`}
        value={layer.delay ?? ""}
        onChange={(delay) =>
          setField({ delay: delay === "" ? undefined : delay })
        }
      />
      <EasingPicker
        value={layer.easing ?? "ease"}
        onChange={(easing) => setField({ easing })}
        aria-label={`easing${n}`}
        className="h-8"
      />
      <button
        type="button"
        aria-label={`allow-discrete${n}`}
        aria-pressed={layer.allowDiscrete ?? false}
        onClick={() => setField({ allowDiscrete: !layer.allowDiscrete })}
        className={cn(
          "h-8 rounded border px-2 font-mono text-[10px]",
          layer.allowDiscrete
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground",
        )}
      >
        allow-discrete
      </button>
    </>
  )
}

// ---------------------------------------------------------------------------
// AnimationFields — the animation-mode controls
// ---------------------------------------------------------------------------

interface AnimationFieldsProps {
  n: string
  layer: AnimationLayer
  onChange: (layer: AnimationLayer) => void
}

export function AnimationFields({ n, layer, onChange }: AnimationFieldsProps) {
  const setField = (patch: Partial<AnimationLayer>) => {
    onChange({ ...layer, ...patch })
  }
  const isInfinite = layer.iterationCount === "infinite"
  return (
    <>
      <Input
        aria-label={`animation-name${n}`}
        value={layer.name ?? ""}
        spellCheck={false}
        autoComplete="off"
        placeholder="name"
        onChange={(e) =>
          setField({ name: e.target.value === "" ? undefined : e.target.value })
        }
        className="h-8 w-[110px] font-mono text-xs"
      />
      <TimeField
        label={`duration${n}`}
        value={layer.duration ?? ""}
        onChange={(duration) =>
          setField({ duration: duration === "" ? undefined : duration })
        }
      />
      <TimeField
        label={`delay${n}`}
        value={layer.delay ?? ""}
        onChange={(delay) =>
          setField({ delay: delay === "" ? undefined : delay })
        }
      />
      <EasingPicker
        value={layer.easing ?? "ease"}
        onChange={(easing) => setField({ easing })}
        aria-label={`easing${n}`}
        className="h-8"
      />
      <span className="inline-flex items-center">
        <Input
          aria-label={`iteration-count${n}`}
          value={isInfinite ? "" : (layer.iterationCount ?? "")}
          disabled={isInfinite}
          inputMode="decimal"
          spellCheck={false}
          autoComplete="off"
          placeholder="count"
          onChange={(e) =>
            setField({
              iterationCount:
                e.target.value === "" ? undefined : e.target.value,
            })
          }
          className="h-8 w-[56px] rounded-r-none border-r-0 font-mono text-xs"
        />
        <button
          type="button"
          aria-label={`infinite${n}`}
          aria-pressed={isInfinite}
          onClick={() =>
            setField({ iterationCount: isInfinite ? "1" : "infinite" })
          }
          className={cn(
            "h-8 rounded-r-md border px-1.5 font-mono text-[10px]",
            isInfinite
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground",
          )}
        >
          ∞
        </button>
      </span>
      <KeywordSelect
        label={`direction${n}`}
        value={layer.direction}
        options={DIRECTIONS}
        onChange={(direction) => setField({ direction })}
      />
      <KeywordSelect
        label={`fill-mode${n}`}
        value={layer.fillMode}
        options={FILL_MODES}
        onChange={(fillMode) => setField({ fillMode })}
      />
      <KeywordSelect
        label={`play-state${n}`}
        value={layer.playState}
        options={PLAY_STATES}
        onChange={(playState) => setField({ playState })}
      />
    </>
  )
}
