import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { UnitInput } from "@/components/ui/unit-input"

describe("UnitInput shell", () => {
  it("renders an input element and a suffix node", () => {
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={() => {}}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input")
    const suffix = container.querySelector(
      '[data-slot="unit-input-suffix"]',
    )
    expect(input).toBeTruthy()
    expect(suffix?.textContent).toBe("deg")
  })

  it("displays the parsed numeric portion of value in the input", () => {
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={() => {}}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.value).toBe("45")
  })

  it("applies aria-label to the input", () => {
    const { getByLabelText } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={() => {}}
        aria-label="Angle in degrees"
      />,
    )
    expect(getByLabelText("Angle in degrees")).toBeTruthy()
  })
})
