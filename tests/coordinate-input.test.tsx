import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
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

describe("CoordinateInput commit", () => {
  it("commits an edited axis with the full tuple", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[-122.42, 37.77]} onChange={onChange} />,
    )
    const lon = container.querySelectorAll("input")[0] as HTMLInputElement
    fireEvent.change(lon, { target: { value: "-120" } })
    fireEvent.blur(lon)
    expect(onChange).toHaveBeenCalledWith([-120, 37.77])
  })

  it("clamps longitude on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[0, 0]} onChange={onChange} />,
    )
    const lon = container.querySelectorAll("input")[0] as HTMLInputElement
    fireEvent.change(lon, { target: { value: "999" } })
    fireEvent.blur(lon)
    expect(onChange).toHaveBeenCalledWith([180, 0])
  })

  it("clamps latitude on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[0, 0]} onChange={onChange} />,
    )
    const lat = container.querySelectorAll("input")[1] as HTMLInputElement
    fireEvent.change(lat, { target: { value: "-91" } })
    fireEvent.blur(lat)
    expect(onChange).toHaveBeenCalledWith([0, -90])
  })

  it("does not emit when the committed axis is unchanged", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[10, 20]} onChange={onChange} />,
    )
    const lon = container.querySelectorAll("input")[0] as HTMLInputElement
    fireEvent.change(lon, { target: { value: "10" } })
    fireEvent.blur(lon)
    expect(onChange).not.toHaveBeenCalled()
  })

  it("flags aria-invalid on an out-of-range draft", () => {
    const { container } = render(
      <CoordinateInput value={[0, 0]} onChange={() => {}} />,
    )
    const lat = container.querySelectorAll("input")[1] as HTMLInputElement
    fireEvent.change(lat, { target: { value: "120" } })
    expect(lat.getAttribute("aria-invalid")).toBe("true")
  })

  it("promotes to a 3-tuple when editing alt on a 2-tuple in 3d mode", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[1, 2]} axes="3d" onChange={onChange} />,
    )
    const alt = container.querySelectorAll("input")[2] as HTMLInputElement
    fireEvent.change(alt, { target: { value: "5" } })
    fireEvent.blur(alt)
    expect(onChange).toHaveBeenCalledWith([1, 2, 5])
  })
})
