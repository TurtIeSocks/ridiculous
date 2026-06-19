import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react"
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

import {
  isCssVar,
  normalizeCssVar,
  pushRecent,
  resolveCssColor,
} from "@/components/ui/color-picker/color-picker.helpers"

describe("css var helpers", () => {
  it("isCssVar detects var() and bare custom properties", () => {
    expect(isCssVar("var(--x)")).toBe(true)
    expect(isCssVar("  var( --x )")).toBe(true)
    expect(isCssVar("--x")).toBe(true)
    expect(isCssVar("#ff0000")).toBe(false)
    expect(isCssVar("oklch(0.5 0.1 240)")).toBe(false)
  })

  it("normalizeCssVar wraps bare custom properties only", () => {
    expect(normalizeCssVar("--x")).toBe("var(--x)")
    expect(normalizeCssVar("var(--x)")).toBe("var(--x)")
    expect(normalizeCssVar("#ff0000")).toBe("#ff0000")
  })

  it("resolveCssColor parses concrete colors directly (lossless, no probe)", () => {
    expect(resolveCssColor("#ff0000", null)?.mode).toBe("hex")
    expect(resolveCssColor("oklch(0.7 0.2 30)", null)?.mode).toBe("oklch")
  })

  it("resolveCssColor returns null for a css var with no probe", () => {
    expect(resolveCssColor("var(--whatever)", null)).toBeNull()
  })

  it("resolveCssColor returns null for an unresolved css var via probe", () => {
    const probe = document.createElement("span")
    document.body.appendChild(probe)
    expect(resolveCssColor("var(--nope-not-defined)", probe)).toBeNull()
    probe.remove()
  })
})

describe("pushRecent", () => {
  it("prepends new values", () => {
    expect(pushRecent(["a", "b"], "c", 8)).toEqual(["c", "a", "b"])
  })
  it("dedups by moving an existing value to the front", () => {
    expect(pushRecent(["a", "b", "c"], "b", 8)).toEqual(["b", "a", "c"])
  })
  it("caps the list length", () => {
    expect(pushRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"])
  })
})

import { SwatchRow } from "@/components/ui/color-picker/swatch-row"

describe("SwatchRow", () => {
  it("returns null for empty entries", () => {
    const { container } = render(
      <SwatchRow
        entries={[]}
        onPick={() => {}}
        ariaLabelPrefix="preset"
        dataSlot="color-picker-presets"
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders one swatch per entry and fires onPick with the raw value", () => {
    const onPick = vi.fn()
    render(
      <SwatchRow
        entries={[{ value: "#ff0000", label: "red" }]}
        onPick={onPick}
        ariaLabelPrefix="preset"
        dataSlot="color-picker-presets"
      />,
    )
    fireEvent.click(screen.getByLabelText("preset red"))
    expect(onPick).toHaveBeenCalledWith("#ff0000")
  })
})

describe("ColorPicker presets prop", () => {
  function open() {
    fireEvent.click(
      document.querySelector(
        '[data-slot="color-picker-trigger"]',
      ) as HTMLElement,
    )
  }

  it("renders the default 10-swatch palette when presets is omitted", () => {
    render(<ColorPicker value="oklch(0.6 0.1 240)" onChange={() => {}} />)
    open()
    const row = document.querySelector('[data-slot="color-picker-presets"]')
    expect(row?.querySelectorAll("button").length).toBe(10)
    expect(screen.getByLabelText("preset red")).toBeTruthy()
  })

  it("renders supplied presets and emits the resolved color on click", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker
        value="oklch(0.6 0.1 240)"
        presets={["#ff0000"]}
        onChange={onChange}
      />,
    )
    open()
    expect(
      document
        .querySelector('[data-slot="color-picker-presets"]')
        ?.querySelectorAll("button").length,
    ).toBe(1)
    fireEvent.click(screen.getByLabelText("preset #ff0000"))
    expect(onChange).toHaveBeenCalled()
    // active mode is oklch (detected from value); resolved red emits oklch
    expect(String(onChange.mock.calls.at(-1)?.[0])).toMatch(/^oklch\(/)
  })

  it("renders no preset row for an empty presets array", () => {
    render(
      <ColorPicker
        value="oklch(0.6 0.1 240)"
        presets={[]}
        onChange={() => {}}
      />,
    )
    open()
    expect(
      document.querySelector('[data-slot="color-picker-presets"]'),
    ).toBeNull()
  })
})

describe("ColorPicker recents", () => {
  const trigger = () =>
    document.querySelector('[data-slot="color-picker-trigger"]') as HTMLElement

  it("records a recent on popover close and shows it on reopen (uncontrolled)", () => {
    render(<ColorPicker value="oklch(0.6 0.1 240)" onChange={() => {}} />)
    fireEvent.click(trigger()) // open
    fireEvent.click(screen.getByLabelText("preset red")) // pick -> pending
    fireEvent.click(trigger()) // close -> commit
    fireEvent.click(trigger()) // reopen
    const row = document.querySelector('[data-slot="color-picker-recents"]')
    expect(row?.querySelectorAll("button").length).toBe(1)
    // Assert the committed color is the picked red (not just a count).
    expect(
      screen.getByLabelText("recent oklch(0.637 0.237 25.331)"),
    ).toBeTruthy()
  })

  it("does not record a recent when opened without editing", () => {
    render(<ColorPicker value="oklch(0.6 0.1 240)" onChange={() => {}} />)
    fireEvent.click(trigger()) // open
    fireEvent.click(trigger()) // close, no edit
    fireEvent.click(trigger()) // reopen
    expect(
      document.querySelector('[data-slot="color-picker-recents"]'),
    ).toBeNull()
  })

  it("renders controlled history and calls onHistoryChange on close", () => {
    const onHistoryChange = vi.fn()
    render(
      <ColorPicker
        value="oklch(0.6 0.1 240)"
        history={["oklch(0.7 0.2 30)"]}
        onHistoryChange={onHistoryChange}
        onChange={() => {}}
      />,
    )
    fireEvent.click(trigger()) // open
    expect(
      document
        .querySelector('[data-slot="color-picker-recents"]')
        ?.querySelectorAll("button").length,
    ).toBe(1) // from controlled prop
    fireEvent.click(screen.getByLabelText("preset red")) // pick -> pending
    fireEvent.click(trigger()) // close -> commit -> notify
    // Assert the callback carries the committed red AND preserves the existing entry.
    expect(onHistoryChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        "oklch(0.637 0.237 25.331)",
        "oklch(0.7 0.2 30)",
      ]),
    )
  })
})

import { useControllableState } from "@/components/ui/color-picker/color-picker.hooks"

describe("useControllableState", () => {
  it("uncontrolled: owns state and notifies onChange", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState<number[]>({
        prop: undefined,
        defaultProp: [],
        onChange,
      }),
    )
    expect(result.current[0]).toEqual([])
    act(() => result.current[1]([1, 2]))
    expect(result.current[0]).toEqual([1, 2])
    expect(onChange).toHaveBeenCalledWith([1, 2])
  })

  it("controlled: does not self-update but still notifies", () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ prop }: { prop: number[] }) =>
        useControllableState<number[]>({ prop, defaultProp: [], onChange }),
      { initialProps: { prop: [1] } },
    )
    expect(result.current[0]).toEqual([1])
    act(() => result.current[1]([1, 2]))
    expect(result.current[0]).toEqual([1]) // prop still drives the value
    expect(onChange).toHaveBeenCalledWith([1, 2])
    rerender({ prop: [1, 2] })
    expect(result.current[0]).toEqual([1, 2])
  })

  it("supports a functional updater reading the previous value", () => {
    const { result } = renderHook(() =>
      useControllableState<number[]>({ prop: undefined, defaultProp: [1] }),
    )
    act(() => result.current[1]((prev) => [...prev, 2]))
    expect(result.current[0]).toEqual([1, 2])
  })
})
