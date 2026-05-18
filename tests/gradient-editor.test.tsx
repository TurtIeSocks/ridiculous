import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
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

describe("GradientEditor popover interactions", () => {
  it("hides type switcher when `type` prop is set", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        type="linear"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector(
      '[data-slot="gradient-editor-types"]',
    )
    expect(switcher).toBeNull()
  })

  it("shows type switcher when `type` prop is unset", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector(
      '[data-slot="gradient-editor-types"]',
    )
    expect(switcher).toBeTruthy()
  })

  it("fires onChange when switching gradient type", () => {
    const onChange = vi.fn()
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000, #0000ff)"
        onChange={onChange}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const tabs = document.querySelectorAll('[role="tab"]')
    const radialTab = Array.from(tabs).find(
      (t) => t.textContent === "radial",
    ) as HTMLElement
    fireEvent.click(radialTab)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0]).toMatch(/^radial-gradient\(/)
  })

  it("renders one handle per stop", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const handles = document.querySelectorAll(
      '[data-slot="gradient-editor-handle"]',
    )
    expect(handles.length).toBe(3)
  })

  it("disables delete button when at min 2 stops", () => {
    render(
      <GradientEditor
        value="linear-gradient(45deg, #ff0000 0%, #0000ff 100%)"
        onChange={() => {}}
      />,
    )
    const trigger = document.querySelector(
      '[data-slot="gradient-editor-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const deleteBtn = document.querySelector(
      '[data-slot="gradient-editor-delete-stop"]',
    ) as HTMLButtonElement
    expect(deleteBtn.disabled).toBe(true)
  })
})
