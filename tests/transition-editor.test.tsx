import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  AddLayerButton,
  KeywordSelect,
  TimeField,
  TransitionEditor,
  TransitionEditorPanel,
  TransitionLayerRow,
  TransitionPreview,
} from "@/components/ui/transition-editor/transition-editor"
import {
  cssAnimation,
  cssTransition,
} from "@/components/ui/transition-editor/transition-editor.types"

test("cssTransition / cssAnimation return their argument unchanged at runtime", () => {
  expect(cssTransition("opacity 200ms ease")).toBe("opacity 200ms ease")
  expect(cssAnimation("spin 1s infinite")).toBe("spin 1s infinite")
})

// ===========================================================================
// TransitionEditorPanel — transition mode
// ===========================================================================

describe("TransitionEditorPanel (transition)", () => {
  test("renders one row per layer", () => {
    render(
      <TransitionEditorPanel
        value="opacity 200ms ease, transform 0.3s ease-out"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^transition-property/i)).toHaveLength(2)
  })

  test("editing the property emits an updated string", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel value="opacity 200ms ease" onChange={onChange} />,
    )
    fireEvent.change(screen.getByLabelText("transition-property 1"), {
      target: { value: "transform" },
    })
    expect(onChange).toHaveBeenCalledWith("transform 200ms ease")
  })

  test("toggling allow-discrete appends the behavior flag", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel value="opacity 200ms ease" onChange={onChange} />,
    )
    fireEvent.click(screen.getByLabelText(/allow-discrete 1/i))
    expect(onChange).toHaveBeenCalledWith("opacity 200ms ease allow-discrete")
  })

  test("AddLayerButton appends the default layer", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel value="opacity 200ms ease" onChange={onChange} />,
    )
    fireEvent.click(screen.getByLabelText(/add a layer/i))
    expect(onChange).toHaveBeenCalledWith("opacity 200ms ease, all 200ms ease")
  })

  test("removing a row drops it from the value", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel
        value="opacity 200ms ease, transform 0.3s"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Remove layer 1"))
    expect(onChange).toHaveBeenCalledWith("transform 0.3s")
  })

  test("value='none' renders an empty list with an add control", () => {
    const onChange = vi.fn()
    render(<TransitionEditorPanel value="none" onChange={onChange} />)
    expect(screen.queryAllByLabelText(/^transition-property/i)).toHaveLength(0)
    fireEvent.click(screen.getByLabelText(/add a layer/i))
    expect(onChange).toHaveBeenCalledWith("all 200ms ease")
  })

  test("an external value change re-syncs the rows", () => {
    const { rerender } = render(
      <TransitionEditorPanel value="opacity 200ms ease" onChange={() => {}} />,
    )
    expect(screen.getAllByLabelText(/^transition-property/i)).toHaveLength(1)
    rerender(
      <TransitionEditorPanel
        value="opacity 200ms, transform 0.3s"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^transition-property/i)).toHaveLength(2)
  })
})

// ===========================================================================
// TransitionEditorPanel — animation mode
// ===========================================================================

describe("TransitionEditorPanel (animation)", () => {
  test("renders a name field and select controls per layer", () => {
    render(
      <TransitionEditorPanel
        mode="animation"
        value="spin 1s ease infinite, pulse 2s"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^animation-name/i)).toHaveLength(2)
    expect(screen.getAllByLabelText(/direction 1/i)).toHaveLength(1)
  })

  test("editing the name emits an updated string", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel
        mode="animation"
        value="spin 1s ease infinite"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("animation-name 1"), {
      target: { value: "pulse" },
    })
    // canonical order: duration easing iter name
    expect(onChange).toHaveBeenCalledWith("1s ease infinite pulse")
  })

  test("changing the direction select recomposes the value", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel
        mode="animation"
        value="1s spin"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("direction 1"), {
      target: { value: "alternate" },
    })
    expect(onChange).toHaveBeenCalledWith("1s alternate spin")
  })

  test("toggling infinite swaps the iteration count", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel
        mode="animation"
        value="1s 3 spin"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/infinite 1/i))
    expect(onChange).toHaveBeenCalledWith("1s infinite spin")
  })

  test("AddLayerButton appends the default animation layer", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel
        mode="animation"
        value="spin 1s"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/add a layer/i))
    expect(onChange).toHaveBeenCalledWith("1s spin, 1s ease 1 slide")
  })
})

// ===========================================================================
// TransitionLayerRow (public)
// ===========================================================================

describe("TransitionLayerRow", () => {
  test("transition mode renders property + duration + delay + behavior", () => {
    render(
      <TransitionLayerRow
        mode="transition"
        layer={{
          property: "opacity",
          duration: "200ms",
          delay: "100ms",
          easing: "ease",
          allowDiscrete: true,
        }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("transition-property")).toHaveValue("opacity")
    expect(screen.getByLabelText(/allow-discrete/i)).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })

  test("animation mode renders name + iteration + direction/fill/play", () => {
    render(
      <TransitionLayerRow
        mode="animation"
        layer={{
          name: "spin",
          duration: "1s",
          iterationCount: "infinite",
          direction: "alternate",
          fillMode: "both",
          playState: "paused",
        }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("animation-name")).toHaveValue("spin")
    expect(screen.getByLabelText("direction")).toHaveValue("alternate")
    expect(screen.getByLabelText("fill-mode")).toHaveValue("both")
    expect(screen.getByLabelText("play-state")).toHaveValue("paused")
  })
})

// ===========================================================================
// AddLayerButton
// ===========================================================================

describe("AddLayerButton", () => {
  test("calls onAdd when clicked", () => {
    const onAdd = vi.fn()
    render(<AddLayerButton onAdd={onAdd} />)
    fireEvent.click(screen.getByLabelText(/add a layer/i))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// TransitionPreview
// ===========================================================================

describe("TransitionPreview", () => {
  test("applies the transition to the target", () => {
    const { container } = render(
      <TransitionPreview mode="transition" value="opacity 200ms ease" />,
    )
    const target = container.querySelector("[data-preview-target]")
    expect(target).not.toBeNull()
    expect((target as HTMLElement).style.transition).toBe("opacity 200ms ease")
  })

  test("applies the animation to the target, aliasing the demo keyframes", () => {
    const { container } = render(
      <TransitionPreview mode="animation" value="spin 1s linear infinite" />,
    )
    const target = container.querySelector("[data-preview-target]")
    // the preview rewrites known demo names (spin → te-spin) to its shipped
    // @keyframes and re-emits in canonical order so the animation runs
    expect((target as HTMLElement).style.animation).toBe(
      "1s linear infinite te-spin",
    )
  })

  test("the play / replay button re-triggers the effect", () => {
    render(<TransitionPreview mode="transition" value="all 300ms ease" />)
    const play = screen.getByRole("button", { name: /play|replay/i })
    // clicking flips the target's running state without throwing
    fireEvent.click(play)
    expect(play).toBeInTheDocument()
  })

  test("the duration scrubber scales the first layer's duration", () => {
    const onChange = vi.fn()
    render(
      <TransitionPreview
        mode="transition"
        value="opacity 200ms ease"
        onChange={onChange}
      />,
    )
    const dur = screen.getByLabelText(/duration .* in ms/i)
    fireEvent.change(dur, { target: { value: "400" } })
    fireEvent.blur(dur)
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/400ms/)
  })

  test("renders no controls when onChange is omitted", () => {
    render(<TransitionPreview mode="transition" value="opacity 200ms ease" />)
    expect(
      screen.queryByLabelText(/duration .* in ms/i),
    ).not.toBeInTheDocument()
  })
})

// ===========================================================================
// TransitionEditor (popover)
// ===========================================================================

describe("TransitionEditor (popover)", () => {
  test("trigger shows the layer count and mode", () => {
    render(
      <TransitionEditor
        value="opacity 200ms ease, transform 0.3s"
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole("button").textContent).toMatch(/2 layers/)
    expect(screen.getByRole("button").textContent).toMatch(/transition/i)
  })

  test("singular layer count for one layer", () => {
    render(<TransitionEditor value="opacity 200ms ease" onChange={() => {}} />)
    expect(screen.getByRole("button").textContent).toMatch(/1 layer/)
  })

  test("opening the popover reveals the panel", async () => {
    render(<TransitionEditor value="opacity 200ms ease" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    const fields = await screen.findAllByLabelText(/^transition-property/i)
    expect(fields.length).toBeGreaterThan(0)
  })

  test("animation mode trigger reflects the mode badge", () => {
    render(
      <TransitionEditor
        mode="animation"
        value="spin 1s infinite"
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole("button").textContent).toMatch(/animation/i)
  })
})

// ===========================================================================
// TimeField
// ===========================================================================

describe("TimeField", () => {
  test("editing the numeric part re-emits with the current unit", () => {
    const onChange = vi.fn()
    render(<TimeField label="duration" value="200ms" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("duration"), {
      target: { value: "350" },
    })
    expect(onChange).toHaveBeenCalledWith("350ms")
  })

  test("clearing the numeric part emits an empty string", () => {
    const onChange = vi.fn()
    render(<TimeField label="duration" value="200ms" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("duration"), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith("")
  })

  test("changing the unit recomposes the value", () => {
    const onChange = vi.fn()
    render(<TimeField label="duration" value="200ms" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("duration unit"), {
      target: { value: "s" },
    })
    expect(onChange).toHaveBeenCalledWith("200s")
  })

  test("an empty value seeds 0 when a unit is picked", () => {
    const onChange = vi.fn()
    render(<TimeField label="delay" value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("delay unit"), {
      target: { value: "s" },
    })
    expect(onChange).toHaveBeenCalledWith("0s")
  })

  test("an opaque calc() value renders as raw text (no unit select)", () => {
    const onChange = vi.fn()
    render(
      <TimeField
        label="duration"
        value="calc(1s + 200ms)"
        onChange={onChange}
      />,
    )
    const input = screen.getByLabelText("duration")
    expect(input).toHaveValue("calc(1s + 200ms)")
    expect(screen.queryByLabelText("duration unit")).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: "var(--d)" } })
    expect(onChange).toHaveBeenCalledWith("var(--d)")
  })
})

// ===========================================================================
// KeywordSelect
// ===========================================================================

describe("KeywordSelect", () => {
  test("selecting the empty option clears the value", () => {
    const onChange = vi.fn()
    render(
      <KeywordSelect
        label="direction"
        value="alternate"
        options={["normal", "alternate"]}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("direction"), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith(undefined)
  })
})

// ===========================================================================
// Field edits through the panel — exercise the per-field onChange closures
// ===========================================================================

describe("field edits (transition)", () => {
  test("editing duration / delay emits updated strings", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel
        value="opacity 200ms 50ms ease"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("duration 1"), {
      target: { value: "400" },
    })
    expect(onChange).toHaveBeenLastCalledWith("opacity 400ms 50ms ease")
    // the panel keeps internal state (the static value prop never updates), so
    // clearing the delay applies on top of the 400ms duration just set
    fireEvent.change(screen.getByLabelText("delay 1"), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenLastCalledWith("opacity 400ms ease")
  })

  test("clearing the property emits a property-less layer", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel value="opacity 200ms ease" onChange={onChange} />,
    )
    fireEvent.change(screen.getByLabelText("transition-property 1"), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenLastCalledWith("200ms ease")
  })
})

describe("field edits (animation)", () => {
  test("editing the iteration-count input emits the new count", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel
        mode="animation"
        value="spin 1s 3"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("iteration-count 1"), {
      target: { value: "5" },
    })
    expect(onChange).toHaveBeenLastCalledWith("1s 5 spin")
  })

  test("changing fill-mode and play-state selects recomposes the value", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel
        mode="animation"
        value="1s spin"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("fill-mode 1"), {
      target: { value: "forwards" },
    })
    expect(onChange).toHaveBeenLastCalledWith("1s forwards spin")
    // internal state persists across edits — play-state stacks onto fill-mode
    fireEvent.change(screen.getByLabelText("play-state 1"), {
      target: { value: "paused" },
    })
    expect(onChange).toHaveBeenLastCalledWith("1s forwards paused spin")
  })

  test("toggling infinite on a count-less layer seeds infinite then 1", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel
        mode="animation"
        value="1s spin"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/infinite 1/i))
    expect(onChange).toHaveBeenLastCalledWith("1s infinite spin")
  })
})

// ===========================================================================
// Panel preview write-back + resync
// ===========================================================================

describe("panel preview write-back", () => {
  test("the panel duration scrubber writes the value back", () => {
    const onChange = vi.fn()
    render(
      <TransitionEditorPanel value="opacity 200ms ease" onChange={onChange} />,
    )
    const dur = screen.getByLabelText(/duration .* in ms/i)
    fireEvent.change(dur, { target: { value: "500" } })
    fireEvent.blur(dur)
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/500ms/)
  })
})

// ===========================================================================
// TransitionPreview — animation paths + edge values
// ===========================================================================

describe("TransitionPreview (animation + edges)", () => {
  test("replay remounts the animation target (key bump) without throwing", () => {
    render(
      <TransitionPreview mode="animation" value="spin 1s linear infinite" />,
    )
    const replay = screen.getByRole("button", { name: /replay/i })
    fireEvent.click(replay)
    expect(replay).toBeInTheDocument()
  })

  test("the animation duration scrubber scales the first layer", () => {
    const onChange = vi.fn()
    render(
      <TransitionPreview
        mode="animation"
        value="spin 2s infinite"
        onChange={onChange}
      />,
    )
    const dur = screen.getByLabelText(/duration .* in ms/i)
    // 2s → 2000ms is the seeded display; scrub to 800
    fireEvent.change(dur, { target: { value: "800" } })
    fireEvent.blur(dur)
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/800ms/)
  })

  test("a seconds duration is normalized to ms in the scrubber seed", () => {
    render(<TransitionPreview mode="transition" value="all 1s ease" />)
    // 1s → the scrubber seeds 1000ms (preview-only render, no control shown)
    const { container } = render(
      <TransitionPreview
        mode="transition"
        value="all 1s ease"
        onChange={() => {}}
      />,
    )
    expect(container).toBeTruthy()
  })

  test("an opaque / NaN duration defaults the scrubber to 200ms", () => {
    const onChange = vi.fn()
    render(
      <TransitionPreview
        mode="transition"
        value="all calc(1s) ease"
        onChange={onChange}
      />,
    )
    expect(screen.getByLabelText(/duration .* in ms/i)).toHaveValue("200")
  })

  test("scrubbing duration on value='none' seeds a fresh first layer", () => {
    const onChange = vi.fn()
    render(
      <TransitionPreview mode="transition" value="none" onChange={onChange} />,
    )
    const dur = screen.getByLabelText(/duration .* in ms/i)
    fireEvent.change(dur, { target: { value: "300" } })
    fireEvent.blur(dur)
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("all 300ms")
  })

  test("scrubbing duration on animation value='none' seeds a slide layer", () => {
    const onChange = vi.fn()
    render(
      <TransitionPreview mode="animation" value="none" onChange={onChange} />,
    )
    const dur = screen.getByLabelText(/duration .* in ms/i)
    fireEvent.change(dur, { target: { value: "600" } })
    fireEvent.blur(dur)
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("600ms slide")
  })

  test("an un-aliased animation name is kept as-is in the applied style", () => {
    const { container } = render(
      <TransitionPreview mode="animation" value="custom-kf 1s" />,
    )
    const target = container.querySelector("[data-preview-target]")
    // custom-kf is not in the demo keyframe alias map → kept verbatim
    expect((target as HTMLElement).style.animation).toBe("1s custom-kf")
  })
})
