import { fireEvent, render } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { GradientEditor } from "@/components/ui/gradient-editor/gradient-editor"

// jsdom doesn't implement pointer capture; the editor calls it on pointerdown.
beforeAll(() => {
  Element.prototype.setPointerCapture ??= vi.fn()
  Element.prototype.releasePointerCapture ??= vi.fn()
})

describe("GradientEditor shell", () => {
  it("renders fallback span for unparseable value", () => {
    render(<GradientEditor value="not a gradient" onChange={() => {}} />)
    const fallback = document.querySelector(
      '[data-slot="gradient-editor-fallback"]',
    )
    expect(fallback).toBeTruthy()
  })

  it("renders trigger when value parses", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    )
    expect(trigger).toBeTruthy()
  })
})

describe("GradientEditor popover interactions", () => {
  it("hides type switcher when `type` prop is set", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        type="linear"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector(
      '[data-slot="gradient-editor-types"]',
    )
    expect(switcher).toBeNull()
  })

  it("shows type switcher when `type` prop is unset", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector(
      '[data-slot="gradient-editor-types"]',
    )
    expect(switcher).toBeTruthy()
  })

  it("fires onChange when switching gradient type", () => {
    const onChange = vi.fn()
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        onChange={onChange}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const tabs = document.querySelectorAll('[role="tab"]')
    const radialTab = Array.from(tabs).find(
      (t) => t.textContent === "radial",
    ) as HTMLElement
    fireEvent.click(radialTab)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0]).toMatch(/^radial-gradient\(/)
  })

  it("renders one handle per stop", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const handles = document.querySelectorAll(
      '[data-slot="gradient-editor-handle"]',
    )
    expect(handles.length).toBe(3)
  })

  it("disables delete button when at min 2 stops", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000 0%, #0000ff 100%)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const deleteBtn = document.querySelector(
      '[data-slot="gradient-editor-delete-stop"]',
    ) as HTMLButtonElement
    expect(deleteBtn.disabled).toBe(true)
  })

  /**
   * Drag a handle past a neighbor and assert the emitted gradient lists stops
   * in ascending position order. `formatGradient` emits stops in array order,
   * so failing to re-sort on move produces e.g. `#ff0000 80%, #00ff00 50%`,
   * which browsers render wrong (a stop below its predecessor is clamped).
   */
  function positionsFromGradient(value: string): number[] {
    return Array.from(value.matchAll(/(\d+(?:\.\d+)?)%/g), (m) =>
      Number.parseFloat(m[1]),
    )
  }

  function stubTrackWidth(width: number) {
    const track = document.querySelector(
      '[data-slot="gradient-editor-track"]',
    ) as HTMLElement
    track.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: width,
        bottom: 20,
        width,
        height: 20,
        x: 0,
        y: 0,
        toJSON: () => {},
      }) as DOMRect
    return track
  }

  it("re-sorts stops when a handle is dragged past a neighbor", () => {
    const onChange = vi.fn()
    render(
      <GradientEditor
        value="linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)"
        type="linear"
        onChange={onChange}
      />,
    )
    fireEvent.click(
      document.querySelector(
        '[data-slot="gradient-editor-trigger"]',
      ) as HTMLButtonElement,
    )
    const width = 100
    stubTrackWidth(width)
    const handles = document.querySelectorAll(
      '[data-slot="gradient-editor-handle"]',
    )
    // Drag the first stop (0%) rightward past the middle stop (50%), to 80%.
    const first = handles[0] as HTMLButtonElement
    fireEvent.pointerDown(first, { pointerId: 1 })
    fireEvent.pointerMove(first, { pointerId: 1, buttons: 1, clientX: 80 })

    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.at(-1)?.[0] as string
    const positions = positionsFromGradient(last)
    const sorted = [...positions].sort((a, b) => a - b)
    expect(positions).toEqual(sorted)
  })

  it("keeps dragging the same handle after a re-sort within one press", () => {
    const onChange = vi.fn()
    render(
      <GradientEditor
        value="linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)"
        type="linear"
        onChange={onChange}
      />,
    )
    fireEvent.click(
      document.querySelector(
        '[data-slot="gradient-editor-trigger"]',
      ) as HTMLButtonElement,
    )
    stubTrackWidth(100)
    const handles = document.querySelectorAll(
      '[data-slot="gradient-editor-handle"]',
    )
    // Grab the RED stop (index 0) and drag it across the green stop, then keep
    // dragging it further right within the same press. The same red handle must
    // continue moving — not the stop it leapfrogged.
    const red = handles[0] as HTMLButtonElement
    fireEvent.pointerDown(red, { pointerId: 1 })
    fireEvent.pointerMove(red, { pointerId: 1, buttons: 1, clientX: 60 })
    fireEvent.pointerMove(red, { pointerId: 1, buttons: 1, clientX: 90 })

    const last = onChange.mock.calls.at(-1)?.[0] as string
    // Red ended at 90%; green is still at 50%, blue at 100%. Sorted by position
    // the order is green(50) red(90) blue(100). Assert the dragged color (red)
    // landed at 90%, and order is ascending.
    expect(last).toMatch(/#00ff00 50%.*#ff0000 90%.*#0000ff 100%/)
    const positions = positionsFromGradient(last)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })
})
