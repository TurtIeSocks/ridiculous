import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CoordinateInput } from "@/components/ui/coordinate-input"

describe("CoordinateInput shell", () => {
  it("renders lon + lat axis inputs", () => {
    const { container } = render(
      <CoordinateInput value={[-122.42, 37.77]} onChange={() => {}} />,
    )
    const inputs = container.querySelectorAll("input")
    expect(inputs).toHaveLength(2)
    expect((inputs[0] as HTMLInputElement).value).toBe("-122.42")
    expect((inputs[1] as HTMLInputElement).value).toBe("37.77")
  })

  it("renders a third axis when axes='3d'", () => {
    const { container } = render(
      <CoordinateInput value={[1, 2]} axes="3d" onChange={() => {}} />,
    )
    expect(container.querySelectorAll("input")).toHaveLength(3)
  })

  it("labels each axis", () => {
    const { getByText } = render(
      <CoordinateInput value={[1, 2, 3]} onChange={() => {}} />,
    )
    expect(getByText("lon")).toBeTruthy()
    expect(getByText("lat")).toBeTruthy()
    expect(getByText("alt")).toBeTruthy()
  })
})
