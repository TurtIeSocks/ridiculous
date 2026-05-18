import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ColorPicker } from "@/components/ui/color-picker/color-picker"

describe("ColorPicker native path", () => {
  it("renders a native input when native=true", () => {
    render(<ColorPicker value="#ff0000" native onChange={() => {}} />)
    const input = screen.getByLabelText("Pick a color") as HTMLInputElement
    expect(input).toBeInstanceOf(HTMLInputElement)
    expect(input.type).toBe("color")
    expect(input.value).toBe("#ff0000")
  })
})

describe("ColorPicker invalid fallback", () => {
  it("renders a static swatch span when value is unparseable", () => {
    render(<ColorPicker value="not-a-color" onChange={() => {}} />)
    const swatch = document.querySelector('[aria-hidden="true"]')
    expect(swatch).toBeTruthy()
  })
})

describe("ColorPicker popover path", () => {
  it("renders trigger button when value parses", () => {
    render(<ColorPicker value="#ff0000" onChange={() => {}} />)
    const trigger = document.querySelector('[data-slot="color-picker-trigger"]')
    expect(trigger).toBeTruthy()
  })

  it("hides mode switcher when mode prop is set", async () => {
    render(<ColorPicker value="#ff0000" mode="hex" onChange={() => {}} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector('[data-slot="color-picker-modes"]')
    expect(switcher).toBeNull()
  })

  it("shows mode switcher when mode prop is unset", async () => {
    render(<ColorPicker value="#ff0000" onChange={() => {}} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector('[data-slot="color-picker-modes"]')
    expect(switcher).toBeTruthy()
  })

  it("fires onChange in active mode when switcher tab clicked", async () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#ff0000" onChange={onChange} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const tabs = document.querySelectorAll('[role="tab"]')
    const rgbTab = Array.from(tabs).find((t) => t.textContent === "rgb")
    fireEvent.click(rgbTab as Element)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0]).toMatch(/^rgb\(/)
  })
})
