import { render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { PresetGallery } from "@/components/ui/easing-picker/easing-picker"

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
