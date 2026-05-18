import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { BezierCanvas, PresetGallery, StepsControls } from "@/components/ui/easing-picker/easing-picker"

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
