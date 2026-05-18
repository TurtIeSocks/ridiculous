import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
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
