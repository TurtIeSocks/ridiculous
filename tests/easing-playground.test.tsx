import { describe, expect, test } from "vitest"
import { fireEvent, render } from "@testing-library/react"
import { EasingPlayground } from "@/examples/easing-picker/playground"

describe("EasingPlayground", () => {
  test("renders the playground container with eyebrow + heading", () => {
    const { container, getByText } = render(<EasingPlayground />)
    expect(container.querySelector("[data-slot='easing-playground']")).not.toBeNull()
    expect(getByText("Easing Picker")).toBeInTheDocument()
  })

  test("clicking a family pill updates the displayed easing string", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    // Initially: Cubic + InOut → cubic-bezier(0.45, 0, 0.55, 1)
    const initial = container.querySelector(
      "[data-slot='easing-playground-value']",
    )?.textContent
    expect(initial).toContain("cubic-bezier")
    // Click Sine pill
    const sinePill = await findByRole("button", { name: /^Sine$/i })
    fireEvent.click(sinePill)
    // Sine + InOut → cubic-bezier(0.37, 0, 0.63, 1)
    const after = container.querySelector(
      "[data-slot='easing-playground-value']",
    )?.textContent
    expect(after).not.toBe(initial)
    expect(after).toContain("0.37")
  })
})
