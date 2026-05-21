import { describe, expect, test } from "vitest"
import { render } from "@testing-library/react"
import { EasingPlayground } from "@/examples/easing-picker/playground"

describe("EasingPlayground", () => {
  test("renders the playground container with eyebrow + heading", () => {
    const { container, getByText } = render(<EasingPlayground />)
    expect(container.querySelector("[data-slot='easing-playground']")).not.toBeNull()
    expect(getByText("Easing Picker")).toBeInTheDocument()
  })
})
