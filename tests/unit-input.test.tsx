import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
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

describe("UnitInput commit lifecycle", () => {
  it("does not call onChange while typing", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "60" } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("commits on blur with the unit appended", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "60" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("60deg")
  })

  it("clamps to max on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="50%"
        unit="%"
        onChange={onChange}
        min={0}
        max={100}
        aria-label="Percent"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "150" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith("100%")
  })

  it("clamps to min on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="50%"
        unit="%"
        onChange={onChange}
        min={0}
        max={100}
        aria-label="Percent"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "-5" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith("0%")
  })

  it("rounds to precision on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="1.50rem"
        unit="rem"
        precision={2}
        onChange={onChange}
        aria-label="Size"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "1.234567" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith("1.23rem")
  })

  it("does not call onChange when committed value matches current", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "45" } })
    fireEvent.blur(input)
    expect(onChange).not.toHaveBeenCalled()
  })
})
