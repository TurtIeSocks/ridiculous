import { fireEvent, render } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { EasingPlayground } from "@/examples/easing-picker/playground"

describe("EasingPlayground", () => {
  test("renders the playground container with eyebrow + heading", () => {
    const { container, getByText } = render(<EasingPlayground />)
    expect(
      container.querySelector("[data-slot='easing-playground']"),
    ).not.toBeNull()
    expect(getByText("Easing Picker")).toBeInTheDocument()
  })

  test("clicking a family pill updates the displayed easing string", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const code = () =>
      container.querySelector("[data-slot='easing-playground-code']")
        ?.textContent ?? ""
    const initial = code()
    expect(initial).toContain("cubic-bezier")
    const sinePill = await findByRole("button", { name: /^Sine$/i })
    fireEvent.click(sinePill)
    // Sine + InOut → cubic-bezier(0.37, 0, 0.63, 1)
    const after = code()
    expect(after).not.toBe(initial)
    expect(after).toContain("0.37")
  })

  test("switching basis to spring renders SpringControls and emits linear(...)", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const springTab = await findByRole("button", { name: /^spring$/i })
    fireEvent.click(springTab)
    const sliders = container.querySelectorAll('input[type="range"]')
    // 3 spring sliders + 1 duration slider = 4
    expect(sliders.length).toBeGreaterThanOrEqual(3)
    const code = container.querySelector(
      "[data-slot='easing-playground-code']",
    )?.textContent
    expect(code).toMatch(/^linear\(/)
  })

  test("switching basis to bounce renders BounceControls and emits linear(...)", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const bounceTab = await findByRole("button", { name: /^bounce$/i })
    fireEvent.click(bounceTab)
    const code = container.querySelector(
      "[data-slot='easing-playground-code']",
    )?.textContent
    expect(code).toMatch(/^linear\(/)
  })

  test("switching basis to wiggle renders WiggleControls and emits linear(...)", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const wiggleTab = await findByRole("button", { name: /^wiggle$/i })
    fireEvent.click(wiggleTab)
    const code = container.querySelector(
      "[data-slot='easing-playground-code']",
    )?.textContent
    expect(code).toMatch(/^linear\(/)
  })

  test("switching basis to steps renders StepsControls and emits steps(...)", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const stepsTab = await findByRole("button", { name: /^steps$/i })
    fireEvent.click(stepsTab)
    const code = container.querySelector(
      "[data-slot='easing-playground-code']",
    )?.textContent
    expect(code).toMatch(/^steps\(/)
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

  test("loop checkbox toggles loop on EasingPreview", async () => {
    const { findByRole } = render(<EasingPlayground />)
    const loopBox = (await findByRole("checkbox", {
      name: /loop/i,
    })) as HTMLInputElement
    expect(loopBox.checked).toBe(true)
    fireEvent.click(loopBox)
    expect(loopBox.checked).toBe(false)
  })

  test("switching format tab changes the displayed code snippet", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const codeBlock = () =>
      container.querySelector("[data-slot='easing-playground-code']")
        ?.textContent ?? ""
    expect(codeBlock()).toMatch(/cubic-bezier/)
    expect(codeBlock()).not.toMatch(/ease-\[/)
    const tw3 = await findByRole("button", { name: /tailwind v3/i })
    fireEvent.click(tw3)
    expect(codeBlock()).toMatch(/ease-\[/)
    const tw4 = await findByRole("button", { name: /tailwind v4/i })
    fireEvent.click(tw4)
    expect(codeBlock()).toMatch(/@theme/)
  })
})
