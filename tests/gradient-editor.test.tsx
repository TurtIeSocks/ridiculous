import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { GradientEditor } from "@/components/ui/gradient-editor/gradient-editor"

describe("GradientEditor shell", () => {
  it("renders fallback span for unparseable value", () => {
    render(<GradientEditor value="not a gradient" onChange={() => {}} />)
    const fallback = document.querySelector(
      '[data-slot="gradient-editor-fallback"]',
    )
    expect(fallback).toBeTruthy()
  })

  it("renders trigger when value parses", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    )
    expect(trigger).toBeTruthy()
  })
})
