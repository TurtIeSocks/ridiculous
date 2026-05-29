import { BasisTabs } from "../controls/basis-tabs"
import { BezierCanvas } from "../controls/bezier-canvas"
import { BezierInputs } from "../controls/bezier-inputs"
import {
  BounceControls,
  SpringControls,
  WiggleControls,
} from "../controls/physics-controls"
import { PresetGallery } from "../controls/preset-gallery"
import { StepsControls } from "../controls/steps-controls"
import { matchPreset, parseEasing } from "../easing-picker.helpers"
import type { EasingBasis, EasingState } from "../easing-picker.types"

interface BasisControlsProps {
  state: EasingState
  available: readonly EasingBasis[]
  onSwitchBasis: (basis: EasingBasis) => void
  onChangeState: (updater: (prev: EasingState) => EasingState) => void
}

/**
 * Basis selection + the per-basis control body. Owns the tabs and the
 * branch that renders the right editor (bezier canvas + presets, the
 * physics sliders, or the steps inputs) for the current basis.
 */
export function BasisControls({
  state,
  available,
  onSwitchBasis,
  onChangeState,
}: BasisControlsProps) {
  const currentName =
    state.basis === "bezier"
      ? matchPreset(state.x1, state.y1, state.x2, state.y2)
      : null

  return (
    <>
      <BasisTabs
        value={state.basis}
        onChange={onSwitchBasis}
        available={available}
      />
      {state.basis === "bezier" && (
        <>
          <PresetGallery
            value={currentName ?? undefined}
            onChange={(_, bezier) => {
              const next = parseEasing(bezier)
              if (next) onChangeState(() => next)
            }}
          />
          <div className="grid grid-cols-[1fr_180px] gap-3">
            <div className="size-44">
              <BezierCanvas
                value={{
                  x1: state.x1,
                  y1: state.y1,
                  x2: state.x2,
                  y2: state.y2,
                }}
                extraTop={state.extraTop}
                extraBottom={state.extraBottom}
                onChange={(v) =>
                  onChangeState((prev) =>
                    prev.basis === "bezier" ? { ...prev, ...v } : prev,
                  )
                }
              />
            </div>
            <BezierInputs
              value={state}
              onChange={(v) => onChangeState(() => ({ basis: "bezier", ...v }))}
            />
          </div>
        </>
      )}
      {state.basis === "spring" && (
        <SpringControls
          value={state}
          onChange={(v) => onChangeState(() => ({ basis: "spring", ...v }))}
        />
      )}
      {state.basis === "bounce" && (
        <BounceControls
          value={state}
          onChange={(v) => onChangeState(() => ({ basis: "bounce", ...v }))}
        />
      )}
      {state.basis === "wiggle" && (
        <WiggleControls
          value={state}
          onChange={(v) => onChangeState(() => ({ basis: "wiggle", ...v }))}
        />
      )}
      {state.basis === "steps" && (
        <StepsControls
          value={state}
          onChange={(v) => onChangeState(() => ({ basis: "steps", ...v }))}
        />
      )}
    </>
  )
}
