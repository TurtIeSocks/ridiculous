import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  BezierCanvas,
  BounceControls,
  EasingPreview,
  PresetGallery,
  SpringControls,
  StepsControls,
  WiggleControls,
} from "@/components/ui/easing-picker/easing-picker"

describe("BezierCanvas", () => {
  test("renders SVG with the cubic-bezier path", () => {
    const { container } = render(
      <BezierCanvas
        value={{ x1: 0.42, y1: 0, x2: 0.58, y2: 1 }}
        onChange={() => {}}
      />,
    )
    const path = container.querySelector("path[data-curve]")
    expect(path).not.toBeNull()
    expect(path?.getAttribute("d")).toContain("C")
  })

  test("dragging P1 handle fires onChange with new coords", () => {
    const onChange = vi.fn()
    const { container } = render(
      <BezierCanvas
        value={{ x1: 0.42, y1: 0, x2: 0.58, y2: 1 }}
        onChange={onChange}
      />,
    )
    const handle = container.querySelector("[data-handle='p1']") as HTMLElement
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 150, clientY: 80, pointerId: 1 })
    fireEvent.pointerUp(handle, { pointerId: 1 })
    expect(onChange).toHaveBeenCalled()
  })
})

describe("StepsControls", () => {
  test("renders n input and position select", () => {
    render(<StepsControls value={{ n: 3, position: "end" }} onChange={() => {}} />)
    expect(screen.getByLabelText(/steps/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/position/i)).toBeInTheDocument()
  })

  test("emits onChange when n changes", () => {
    const onChange = vi.fn()
    render(<StepsControls value={{ n: 3, position: "end" }} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/steps/i), { target: { value: "5" } })
    expect(onChange).toHaveBeenCalledWith({ n: 5, position: "end" })
  })
})

describe("SpringControls", () => {
  test("renders 3 sliders + emits onChange", () => {
    const onChange = vi.fn()
    render(
      <SpringControls
        value={{ stiffness: 100, damping: 10, mass: 1 }}
        onChange={onChange}
      />,
    )
    const sliders = screen.getAllByRole("slider")
    expect(sliders).toHaveLength(3)
    fireEvent.change(sliders[0], { target: { value: "200" } })
    expect(onChange).toHaveBeenCalledWith({ stiffness: 200, damping: 10, mass: 1 })
  })
})

describe("BounceControls", () => {
  test("renders 2 sliders", () => {
    render(<BounceControls value={{ bounces: 3, stiffness: 0.5 }} onChange={() => {}} />)
    expect(screen.getAllByRole("slider")).toHaveLength(2)
  })
})

describe("WiggleControls", () => {
  test("renders 2 sliders", () => {
    render(<WiggleControls value={{ wiggles: 4, damping: 5 }} onChange={() => {}} />)
    expect(screen.getAllByRole("slider")).toHaveLength(2)
  })
})

describe("PresetGallery", () => {
  test("renders 39 preset buttons", () => {
    render(<PresetGallery onChange={() => {}} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(39)
  })

  test("highlights the active preset", () => {
    render(<PresetGallery value="easeOutQuart" onChange={() => {}} />)
    const active = screen.getByTitle("easeOutQuart")
    expect(active.className).toContain("bg-accent")
  })

  test("fires onChange with name + bezier string on click", () => {
    const onChange = vi.fn()
    render(<PresetGallery onChange={onChange} />)
    screen.getByTitle("ease").click()
    expect(onChange).toHaveBeenCalledWith("ease", "cubic-bezier(0.25, 0.1, 0.25, 1)")
  })
})

describe("EasingPreview", () => {
  test("renders an animated element with the easing applied", () => {
    const { container } = render(
      <EasingPreview easing="cubic-bezier(0.42, 0, 0.58, 1)" />,
    )
    const target = container.querySelector("[data-preview-target]") as HTMLElement
    expect(target).not.toBeNull()
    expect(target.style.animation).toContain("cubic-bezier(0.42, 0, 0.58, 1)")
  })

  test("renders linear comparison ghost when enabled", () => {
    const { container } = render(
      <EasingPreview easing="ease" showLinearComparison />,
    )
    expect(container.querySelector("[data-preview-ghost]")).not.toBeNull()
  })

  test("Replay button increments the animation key", () => {
    const { container } = render(<EasingPreview easing="ease" />)
    const target = container.querySelector("[data-preview-target]") as HTMLElement
    const initialKey = target.dataset.animationKey
    fireEvent.click(screen.getByRole("button", { name: /replay/i }))
    const newKey = container.querySelector("[data-preview-target]")?.getAttribute("data-animation-key")
    expect(newKey).not.toBe(initialKey)
  })
})
