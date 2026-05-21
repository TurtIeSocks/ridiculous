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

  test("switching basis to spring renders SpringControls and emits linear(...)", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const springTab = await findByRole("button", { name: /^spring$/i })
    fireEvent.click(springTab)
    // Sliders for stiffness / damping / mass appear
    // (jsdom doesn't surface implicit role="slider" via querySelector, so
    // assert directly on the underlying <input type="range"> elements.)
    const sliders = container.querySelectorAll('input[type="range"]')
    expect(sliders.length).toBeGreaterThanOrEqual(3)
    // Easing string updates to linear(...)
    const value = container.querySelector(
      "[data-slot='easing-playground-value']",
    )?.textContent
    expect(value).toMatch(/^linear\(/)
  })

  test("switching basis to steps renders StepsControls and emits steps(...)", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const stepsTab = await findByRole("button", { name: /^steps$/i })
    fireEvent.click(stepsTab)
    const value = container.querySelector(
      "[data-slot='easing-playground-value']",
    )?.textContent
    expect(value).toMatch(/^steps\(/)
  })

  test("clicking a property toggle updates the EasingPreview keyframe name", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const initialAnim = (
      container.querySelector("[data-preview-target]") as HTMLElement
    ).style.animation
    expect(initialAnim).toContain("easing-preview-moveX")
    const scalePill = await findByRole("button", { name: /^scale$/i })
    fireEvent.click(scalePill)
    const after = (
      container.querySelector("[data-preview-target]") as HTMLElement
    ).style.animation
    expect(after).toContain("easing-preview-scale")
    expect(after).not.toContain("easing-preview-moveX")
  })
})
