import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { ColorPicker } from "@/components/ui/color-picker/color-picker"

// jsdom does not implement Pointer Capture; the L×C pad / hue / alpha strips
// all call setPointerCapture on pointerdown. Stub it so pointer-driven paths
// can run without throwing.
beforeAll(() => {
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
  }
})

afterEach(() => {
  cleanup()
  // EyeDropper is feature-detected on mount; remove between tests.
  delete (window as { EyeDropper?: unknown }).EyeDropper
})

function openPicker(value = "oklch(0.6 0.1 240)") {
  const onChange = vi.fn()
  render(<ColorPicker value={value} onChange={onChange} />)
  const trigger = document.querySelector(
    '[data-slot="color-picker-trigger"]',
  ) as HTMLButtonElement
  fireEvent.click(trigger)
  return { onChange }
}

describe("ColorPicker native path", () => {
  it("renders a native input when native=true", () => {
    render(<ColorPicker value="#ff0000" native onChange={() => {}} />)
    const input = screen.getByLabelText("Pick a color") as HTMLInputElement
    expect(input).toBeInstanceOf(HTMLInputElement)
    expect(input.type).toBe("color")
    expect(input.value).toBe("#ff0000")
  })

  it("emits a parsed color on native input change", () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#ff0000" native onChange={onChange} />)
    const input = screen.getByLabelText("Pick a color") as HTMLInputElement
    fireEvent.change(input, { target: { value: "#00ff00" } })
    expect(onChange).toHaveBeenCalledOnce()
    // default (no mode prop) emits hex for the native swatch
    expect(onChange.mock.calls[0][0]).toMatch(/^#/)
  })

  it("native input honors an explicit mode prop on emit", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker value="#ff0000" mode="rgb" native onChange={onChange} />,
    )
    const input = screen.getByLabelText("Pick a color") as HTMLInputElement
    fireEvent.change(input, { target: { value: "#0000ff" } })
    expect(onChange.mock.calls[0][0]).toMatch(/^rgb\(/)
  })
})

describe("ColorPicker invalid fallback", () => {
  it("renders a static swatch span when value is unparseable", () => {
    render(<ColorPicker value="not-a-color" onChange={() => {}} />)
    const swatch = document.querySelector('[aria-hidden="true"]')
    expect(swatch).toBeTruthy()
  })
})

describe("ColorPicker popover path", () => {
  it("renders trigger button when value parses", () => {
    render(<ColorPicker value="#ff0000" onChange={() => {}} />)
    const trigger = document.querySelector('[data-slot="color-picker-trigger"]')
    expect(trigger).toBeTruthy()
  })

  it("hides mode switcher when mode prop is set", async () => {
    render(<ColorPicker value="#ff0000" mode="hex" onChange={() => {}} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector('[data-slot="color-picker-modes"]')
    expect(switcher).toBeNull()
  })

  it("shows mode switcher when mode prop is unset", async () => {
    render(<ColorPicker value="#ff0000" onChange={() => {}} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const switcher = document.querySelector('[data-slot="color-picker-modes"]')
    expect(switcher).toBeTruthy()
  })

  it("fires onChange in active mode when switcher tab clicked", async () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#ff0000" onChange={onChange} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const tabs = document.querySelectorAll('[role="tab"]')
    const rgbTab = Array.from(tabs).find((t) => t.textContent === "rgb")
    fireEvent.click(rgbTab as Element)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0]).toMatch(/^rgb\(/)
  })
})

describe("ColorPicker external value resync", () => {
  it("does not resync when the new value equals what we just emitted", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ColorPicker value="oklch(0.6 0.1 240)" onChange={onChange} />,
    )
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const hue = document.querySelector(
      '[data-slot="color-picker-hue"]',
    ) as HTMLDivElement
    fireEvent.keyDown(hue, { key: "ArrowRight" })
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    onChange.mockClear()
    // Feeding our own emit back in must NOT reset internal state (the effect
    // early-returns when value === lastEmittedRef).
    rerender(<ColorPicker value={emitted} onChange={onChange} />)
    fireEvent.keyDown(hue, { key: "ArrowRight" })
    expect(onChange).toHaveBeenCalled()
  })

  it("resyncs internal state when the value changes from outside", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ColorPicker value="oklch(0.6 0.1 120)" onChange={onChange} />,
    )
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    // External change to a new hue should be reflected by the hue slider.
    rerender(<ColorPicker value="oklch(0.6 0.1 300)" onChange={onChange} />)
    const hue = document.querySelector(
      '[data-slot="color-picker-hue"]',
    ) as HTMLDivElement
    expect(hue.getAttribute("aria-valuenow")).toBe("300")
  })
})

describe("ColorPicker L×C pad keyboard", () => {
  it("arrow keys nudge lightness and chroma and emit", () => {
    const { onChange } = openPicker()
    const pad = document.querySelector(
      '[data-slot="color-picker-pad"]',
    ) as HTMLDivElement
    fireEvent.keyDown(pad, { key: "ArrowUp" })
    fireEvent.keyDown(pad, { key: "ArrowDown" })
    fireEvent.keyDown(pad, { key: "ArrowLeft" })
    fireEvent.keyDown(pad, { key: "ArrowRight" })
    expect(onChange.mock.calls.length).toBe(4)
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/^oklch\(/)
  })

  it("shift widens the chroma step", () => {
    const { onChange } = openPicker("oklch(0.6 0.2 240)")
    const pad = document.querySelector(
      '[data-slot="color-picker-pad"]',
    ) as HTMLDivElement
    fireEvent.keyDown(pad, { key: "ArrowRight", shiftKey: true })
    expect(onChange).toHaveBeenCalledOnce()
  })

  it("clamps chroma at the lower bound on repeated ArrowLeft", () => {
    const { onChange } = openPicker("oklch(0.6 0 240)")
    const pad = document.querySelector(
      '[data-slot="color-picker-pad"]',
    ) as HTMLDivElement
    fireEvent.keyDown(pad, { key: "ArrowLeft" })
    // c already 0, Math.max(0, ...) keeps it valid; still emits a valid color
    expect(onChange.mock.calls[0][0]).toMatch(/^oklch\(/)
  })

  it("responds to pointer down + move", () => {
    const { onChange } = openPicker()
    const pad = document.querySelector(
      '[data-slot="color-picker-pad"]',
    ) as HTMLDivElement
    fireEvent.pointerDown(pad, { pointerId: 1, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(pad, {
      pointerId: 1,
      clientX: 20,
      clientY: 20,
      buttons: 1,
    })
    expect(onChange).toHaveBeenCalled()
  })

  it("ignores pointer move without a held button", () => {
    const { onChange } = openPicker()
    const pad = document.querySelector(
      '[data-slot="color-picker-pad"]',
    ) as HTMLDivElement
    fireEvent.pointerMove(pad, {
      pointerId: 1,
      clientX: 20,
      clientY: 20,
      buttons: 0,
    })
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("ColorPicker hue strip", () => {
  it("ArrowRight increases the hue value", () => {
    const { onChange } = openPicker("oklch(0.6 0.1 100)")
    const hue = document.querySelector(
      '[data-slot="color-picker-hue"]',
    ) as HTMLDivElement
    fireEvent.keyDown(hue, { key: "ArrowRight" })
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/^oklch\(/)
    expect(hue.getAttribute("aria-valuenow")).toBe("101")
  })

  it("ArrowLeft decreases the hue value", () => {
    const { onChange } = openPicker("oklch(0.6 0.1 100)")
    const hue = document.querySelector(
      '[data-slot="color-picker-hue"]',
    ) as HTMLDivElement
    fireEvent.keyDown(hue, { key: "ArrowLeft" })
    expect(onChange).toHaveBeenCalledOnce()
    expect(hue.getAttribute("aria-valuenow")).toBe("99")
  })

  it("commits a hue from pointer drag", () => {
    const { onChange } = openPicker()
    const hue = document.querySelector(
      '[data-slot="color-picker-hue"]',
    ) as HTMLDivElement
    fireEvent.pointerDown(hue, { pointerId: 1, clientX: 5 })
    fireEvent.pointerMove(hue, { pointerId: 1, clientX: 30, buttons: 1 })
    expect(onChange).toHaveBeenCalled()
  })
})

describe("ColorPicker alpha strip", () => {
  it("ArrowRight raises alpha and ArrowLeft lowers it", () => {
    const { onChange } = openPicker("oklch(0.6 0.1 240 / 50%)")
    const alpha = document.querySelector(
      '[data-slot="color-picker-alpha"]',
    ) as HTMLDivElement
    fireEvent.keyDown(alpha, { key: "ArrowRight" })
    fireEvent.keyDown(alpha, { key: "ArrowLeft" })
    expect(onChange.mock.calls.length).toBe(2)
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/^oklch\(/)
  })

  it("commits an alpha from pointer drag", () => {
    const { onChange } = openPicker("oklch(0.6 0.1 240 / 50%)")
    const alpha = document.querySelector(
      '[data-slot="color-picker-alpha"]',
    ) as HTMLDivElement
    fireEvent.pointerDown(alpha, { pointerId: 1, clientX: 5 })
    fireEvent.pointerMove(alpha, { pointerId: 1, clientX: 30, buttons: 1 })
    expect(onChange).toHaveBeenCalled()
  })

  it("ignores alpha pointer move without a held button", () => {
    const { onChange } = openPicker("oklch(0.6 0.1 240 / 50%)")
    const alpha = document.querySelector(
      '[data-slot="color-picker-alpha"]',
    ) as HTMLDivElement
    fireEvent.pointerMove(alpha, { pointerId: 1, clientX: 30, buttons: 0 })
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("ColorPicker accessibility", () => {
  it("exposes the L×C pad as a 2-axis application region", () => {
    openPicker("oklch(0.6 0.1 240)")
    const pad = document.querySelector(
      '[data-slot="color-picker-pad"]',
    ) as HTMLDivElement
    expect(pad.getAttribute("role")).toBe("application")
    // role="application" cannot carry aria-valuetext, so both axes plus the
    // arrow-key affordance live in the accessible name itself.
    const label = pad.getAttribute("aria-label") ?? ""
    expect(label).toMatch(/lightness/i)
    expect(label).toMatch(/chroma/i)
    expect(label).toMatch(/arrow keys/i)
  })

  it("updates the pad accessible name as lightness is nudged", () => {
    openPicker("oklch(0.6 0.1 240)")
    const pad = document.querySelector(
      '[data-slot="color-picker-pad"]',
    ) as HTMLDivElement
    const before = pad.getAttribute("aria-label")
    fireEvent.keyDown(pad, { key: "ArrowUp" })
    expect(pad.getAttribute("aria-label")).not.toBe(before)
  })

  it("gives the hue slider an aria-valuetext in degrees", () => {
    openPicker("oklch(0.6 0.1 100)")
    const hue = document.querySelector(
      '[data-slot="color-picker-hue"]',
    ) as HTMLDivElement
    expect(hue.getAttribute("role")).toBe("slider")
    expect(hue.getAttribute("aria-valuetext")).toBe("100 degrees")
  })

  it("gives the alpha slider a percentage aria-valuetext", () => {
    openPicker("oklch(0.6 0.1 240 / 50%)")
    const alpha = document.querySelector(
      '[data-slot="color-picker-alpha"]',
    ) as HTMLDivElement
    expect(alpha.getAttribute("role")).toBe("slider")
    expect(alpha.getAttribute("aria-valuetext")).toBe("50%")
  })
})

describe("ColorPicker presets", () => {
  it("clicking a preset swatch emits that color", () => {
    const { onChange } = openPicker()
    const red = document.querySelector(
      '[aria-label="preset red"]',
    ) as HTMLButtonElement
    fireEvent.click(red)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0]).toMatch(/^oklch\(/)
  })
})

describe("ColorPicker eyedropper", () => {
  it("does not render the eyedropper button when EyeDropper is unavailable", () => {
    openPicker()
    expect(
      document.querySelector('[data-slot="color-picker-eyedropper"]'),
    ).toBeNull()
  })

  it("renders the eyedropper and emits the picked color", async () => {
    const open = vi.fn().mockResolvedValue({ sRGBHex: "#00ff00" })
    ;(window as { EyeDropper?: unknown }).EyeDropper = class {
      open = open
    }
    const onChange = vi.fn()
    render(<ColorPicker value="oklch(0.6 0.1 240)" onChange={onChange} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const button = document.querySelector(
      '[data-slot="color-picker-eyedropper"]',
    ) as HTMLButtonElement
    expect(button).not.toBeNull()
    fireEvent.click(button)
    await vi.waitFor(() => expect(open).toHaveBeenCalled())
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(onChange.mock.calls[0][0]).toMatch(/^oklch\(/)
  })

  it("swallows an eyedropper cancellation without emitting", async () => {
    const open = vi.fn().mockRejectedValue(new Error("cancelled"))
    ;(window as { EyeDropper?: unknown }).EyeDropper = class {
      open = open
    }
    const onChange = vi.fn()
    render(<ColorPicker value="oklch(0.6 0.1 240)" onChange={onChange} />)
    const trigger = document.querySelector(
      '[data-slot="color-picker-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(trigger)
    const button = document.querySelector(
      '[data-slot="color-picker-eyedropper"]',
    ) as HTMLButtonElement
    fireEvent.click(button)
    await vi.waitFor(() => expect(open).toHaveBeenCalled())
    expect(onChange).not.toHaveBeenCalled()
  })
})
