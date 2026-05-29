import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  AddLayerButton,
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
