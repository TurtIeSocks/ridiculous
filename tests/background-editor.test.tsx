import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  BackgroundEditor,
  BackgroundEditorPanel,
  BackgroundPreview,
  LayerCard,
  LayerStack,
  PositionPad,
} from "@/components/ui/background-editor/background-editor"
import type { BgLayer } from "@/components/ui/background-editor/background-editor.types"
import { cssBackground } from "@/components/ui/background-editor/background-editor.types"

const TWO_LAYERS =
  "linear-gradient(#f00, #00f) center / cover no-repeat, url(x.png) left top, #fff"

// ===========================================================================
// cssBackground passthrough
// ===========================================================================

test("cssBackground returns its argument unchanged at runtime", () => {
  expect(cssBackground("#fff")).toBe("#fff")
})

// ===========================================================================
// PositionPad — the local 2D crosshair
// ===========================================================================

describe("PositionPad", () => {
  test("renders a labelled 2D control", () => {
    render(<PositionPad x={50} y={50} onChange={() => {}} />)
    expect(screen.getByLabelText(/background position/i)).toBeInTheDocument()
  })

  test("a keyboard nudge emits new coords", () => {
    const onChange = vi.fn()
    render(<PositionPad x={50} y={50} onChange={onChange} />)
    fireEvent.keyDown(screen.getByLabelText(/background position/i), {
      key: "ArrowRight",
    })
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls.at(-1)?.[0] as { x: number; y: number }
    expect(next.x).toBeGreaterThan(50)
    expect(next.y).toBe(50)
  })

  test("a pointer press emits coords from the click location", () => {
    const onChange = vi.fn()
    render(<PositionPad x={0} y={0} onChange={onChange} />)
    const pad = screen.getByLabelText(/background position/i)
    pad.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    fireEvent.pointerDown(pad, { clientX: 50, clientY: 25, buttons: 1 })
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls.at(-1)?.[0] as { x: number; y: number }
    expect(next.x).toBeCloseTo(50, 0)
    expect(next.y).toBeCloseTo(25, 0)
  })

  test("ArrowLeft nudges x down by 1", () => {
    const onChange = vi.fn()
    render(<PositionPad x={50} y={40} onChange={onChange} />)
    fireEvent.keyDown(screen.getByLabelText(/background position/i), {
      key: "ArrowLeft",
    })
    expect(onChange).toHaveBeenCalledWith({ x: 49, y: 40 })
  })

  test("ArrowUp nudges y down by 1", () => {
    const onChange = vi.fn()
    render(<PositionPad x={60} y={50} onChange={onChange} />)
    fireEvent.keyDown(screen.getByLabelText(/background position/i), {
      key: "ArrowUp",
    })
    expect(onChange).toHaveBeenCalledWith({ x: 60, y: 49 })
  })

  test("ArrowDown nudges y up by 1", () => {
    const onChange = vi.fn()
    render(<PositionPad x={60} y={50} onChange={onChange} />)
    fireEvent.keyDown(screen.getByLabelText(/background position/i), {
      key: "ArrowDown",
    })
    expect(onChange).toHaveBeenCalledWith({ x: 60, y: 51 })
  })

  test("Shift makes ArrowRight nudge x by 10", () => {
    const onChange = vi.fn()
    render(<PositionPad x={20} y={30} onChange={onChange} />)
    fireEvent.keyDown(screen.getByLabelText(/background position/i), {
      key: "ArrowRight",
      shiftKey: true,
    })
    expect(onChange).toHaveBeenCalledWith({ x: 30, y: 30 })
  })

  test("a nudge clamps at the 0 / 100 bounds", () => {
    const onChange = vi.fn()
    render(<PositionPad x={0} y={100} onChange={onChange} />)
    const pad = screen.getByLabelText(/background position/i)
    // ArrowLeft at x=0 stays clamped at 0; ArrowDown at y=100 stays at 100.
    fireEvent.keyDown(pad, { key: "ArrowLeft" })
    expect(onChange).toHaveBeenLastCalledWith({ x: 0, y: 100 })
    fireEvent.keyDown(pad, { key: "ArrowDown" })
    expect(onChange).toHaveBeenLastCalledWith({ x: 0, y: 100 })
  })

  test("a non-arrow key is a no-op (no emit, no preventDefault)", () => {
    const onChange = vi.fn()
    render(<PositionPad x={50} y={50} onChange={onChange} />)
    fireEvent.keyDown(screen.getByLabelText(/background position/i), {
      key: "Enter",
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  test("a pointer move with a button held tracks; without a button it does not", () => {
    const onChange = vi.fn()
    render(<PositionPad x={0} y={0} onChange={onChange} />)
    const pad = screen.getByLabelText(/background position/i)
    pad.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    // no button held → ignored.
    fireEvent.pointerMove(pad, { clientX: 30, clientY: 30, buttons: 0 })
    expect(onChange).not.toHaveBeenCalled()
    // button held → tracks.
    fireEvent.pointerMove(pad, { clientX: 70, clientY: 80, buttons: 1 })
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls.at(-1)?.[0] as { x: number; y: number }
    expect(next.x).toBeCloseTo(70, 0)
    expect(next.y).toBeCloseTo(80, 0)
  })

  test("a pointer press without setPointerCapture still emits (jsdom guard)", () => {
    const onChange = vi.fn()
    render(<PositionPad x={0} y={0} onChange={onChange} />)
    const pad = screen.getByLabelText(/background position/i)
    pad.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    // Force the optional-chaining `?.` short-circuit: no setPointerCapture.
    ;(pad as unknown as { setPointerCapture?: unknown }).setPointerCapture =
      undefined
    fireEvent.pointerDown(pad, { clientX: 10, clientY: 10, buttons: 1 })
    expect(onChange).toHaveBeenCalled()
  })
})

// ===========================================================================
// LayerCard — one layer's editors
// ===========================================================================

describe("LayerCard", () => {
  test("an image (gradient) layer embeds the gradient editor", () => {
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "linear-gradient(#f00, #00f)",
          position: "center",
          size: "cover",
          repeat: "no-repeat",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
      />,
    )
    // The embedded GradientEditor renders a popover trigger with this label.
    expect(screen.getByLabelText(/edit gradient/i)).toBeInTheDocument()
  })

  test("exposes the position pad and x/y unit inputs", () => {
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "10% 20%",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/background position/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/position x/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/position y/i)).toBeInTheDocument()
  })

  test("the repeat / attachment / origin / clip selects are present + labelled", () => {
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "no-repeat",
          attachment: "scroll",
          origin: "padding-box",
          clip: "border-box",
        }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/repeat/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/attachment/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/origin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/clip/i)).toBeInTheDocument()
  })

  test("the color picker is present ONLY on the final layer", () => {
    const nonFinal = render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
      />,
    )
    expect(screen.queryByLabelText(/layer color/i)).not.toBeInTheDocument()
    nonFinal.unmount()

    render(
      <LayerCard
        index={0}
        isFinal={true}
        layer={{
          image: "",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
          color: "#ffffff",
        }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/layer color/i)).toBeInTheDocument()
  })

  test("changing the repeat select dispatches an updated layer", () => {
    const onChange = vi.fn()
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "repeat",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/repeat/i), {
      target: { value: "no-repeat" },
    })
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls.at(-1)?.[0].repeat).toBe("no-repeat")
  })

  test("a non-gradient image renders a plain url() input that edits the image", () => {
    const onChange = vi.fn()
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={onChange}
      />,
    )
    // No embedded gradient editor for a url() image.
    expect(screen.queryByLabelText(/edit gradient/i)).not.toBeInTheDocument()
    const input = screen.getByLabelText(/layer 1 image/i)
    fireEvent.change(input, { target: { value: "url(y.png)" } })
    expect(onChange.mock.calls.at(-1)?.[0].image).toBe("url(y.png)")
  })

  test("editing the embedded gradient dispatches a new image", () => {
    const onChange = vi.fn()
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "linear-gradient(#f00, #00f)",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={onChange}
      />,
    )
    // Open the embedded gradient editor popover, then change a control inside it
    // so it emits a new gradient string up through LayerCard's image onChange.
    fireEvent.click(screen.getByLabelText(/edit gradient/i))
    const space = screen.getByLabelText(/interpolation space/i)
    fireEvent.change(space, { target: { value: "oklch" } })
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls.at(-1)?.[0].image).toContain("gradient")
  })

  test("changing attachment / origin / clip selects each dispatch", () => {
    const onChange = vi.fn()
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "",
          attachment: "scroll",
          origin: "padding-box",
          clip: "border-box",
        }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/attachment/i), {
      target: { value: "fixed" },
    })
    expect(onChange.mock.calls.at(-1)?.[0].attachment).toBe("fixed")
    fireEvent.change(screen.getByLabelText(/origin/i), {
      target: { value: "content-box" },
    })
    expect(onChange.mock.calls.at(-1)?.[0].origin).toBe("content-box")
    fireEvent.change(screen.getByLabelText(/clip/i), {
      target: { value: "content-box" },
    })
    expect(onChange.mock.calls.at(-1)?.[0].clip).toBe("content-box")
  })

  test("a keyword size hides the length input; selecting a keyword dispatches it", () => {
    const onChange = vi.fn()
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "cover",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={onChange}
      />,
    )
    // A keyword size → no length UnitInput.
    expect(
      screen.queryByLabelText(/layer 1 size length/i),
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/layer 1 size$/i), {
      target: { value: "contain" },
    })
    expect(onChange.mock.calls.at(-1)?.[0].size).toBe("contain")
  })

  test("selecting the length… option switches the size off a keyword", () => {
    const onChange = vi.fn()
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "cover",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={onChange}
      />,
    )
    // The "length…" sentinel maps the size to a non-keyword value.
    fireEvent.change(screen.getByLabelText(/layer 1 size$/i), {
      target: { value: "__length" },
    })
    expect(onChange.mock.calls.at(-1)?.[0].size).toBe("__length")
  })

  test("a non-keyword size shows + edits the length input", () => {
    const onChange = vi.fn()
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "50%",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={onChange}
      />,
    )
    const lengthInput = screen.getByLabelText(/layer 1 size length/i)
    expect(lengthInput).toBeInTheDocument()
    // UnitInput commits on blur, not on each change.
    fireEvent.change(lengthInput, { target: { value: "75" } })
    fireEvent.blur(lengthInput, { target: { value: "75" } })
    expect(onChange.mock.calls.at(-1)?.[0].size).toContain("75")
  })

  test("the final-layer color picker dispatches a new color", () => {
    const onChange = vi.fn()
    render(
      <LayerCard
        index={0}
        isFinal={true}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
          color: "#ffffff",
        }}
        onChange={onChange}
      />,
    )
    // Open the color picker popover, then nudge the Hue slider so the picker
    // emits a new color up through LayerCard's color onChange.
    fireEvent.click(screen.getByLabelText(/layer color/i))
    const hue = screen.getByLabelText(/^hue$/i)
    fireEvent.keyDown(hue, { key: "ArrowRight" })
    expect(onChange).toHaveBeenCalled()
    expect(typeof onChange.mock.calls.at(-1)?.[0].color).toBe("string")
  })

  test("the final-layer color picker falls back to white when color is undefined", () => {
    render(
      <LayerCard
        index={0}
        isFinal={true}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
      />,
    )
    // No `color` on the layer → the picker still renders (default #ffffff).
    expect(screen.getByLabelText(/layer color/i)).toBeInTheDocument()
  })

  test("reorder / remove controls are disabled when not permitted", () => {
    render(
      <LayerCard
        index={0}
        isFinal={true}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
        canMoveUp={false}
        canMoveDown={false}
        canRemove={false}
      />,
    )
    expect(screen.getByLabelText(/move layer up/i)).toBeDisabled()
    expect(screen.getByLabelText(/move layer down/i)).toBeDisabled()
    expect(screen.getByLabelText(/remove layer/i)).toBeDisabled()
  })

  test("reorder / remove controls are disabled when their handlers are absent", () => {
    render(
      <LayerCard
        index={0}
        isFinal={true}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
      />,
    )
    // No onMoveUp / onMoveDown / onRemove handlers → buttons are disabled.
    expect(screen.getByLabelText(/move layer up/i)).toBeDisabled()
    expect(screen.getByLabelText(/move layer down/i)).toBeDisabled()
    expect(screen.getByLabelText(/remove layer/i)).toBeDisabled()
  })

  test("a non-percent position falls back to the pad center (50/50)", () => {
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          // px lengths are not percentages → lengthToPercent returns null and
          // the x/y resolve to the 50% center fallback.
          image: "url(x.png)",
          position: "10px 5px",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/position x/i)).toBeInTheDocument()
    // The pad's aria-valuetext spells out the resolved x% y% (50% 50%).
    expect(screen.getByLabelText(/background position/i)).toHaveAttribute(
      "aria-valuetext",
      "50% 50%",
    )
  })

  test("an empty position string defaults the pad to center", () => {
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/background position/i)).toHaveAttribute(
      "aria-valuetext",
      "50% 50%",
    )
  })

  test("a single-token position resolves x and defaults y to 50", () => {
    render(
      <LayerCard
        index={0}
        isFinal={false}
        layer={{
          image: "url(x.png)",
          position: "25%",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
      />,
    )
    // Only an x token → y falls back to 50.
    expect(screen.getByLabelText(/background position/i)).toHaveAttribute(
      "aria-valuetext",
      "25% 50%",
    )
  })

  test("the final-layer label is annotated with (final)", () => {
    render(
      <LayerCard
        index={2}
        isFinal={true}
        layer={{
          image: "url(x.png)",
          position: "",
          size: "",
          repeat: "",
          attachment: "",
          origin: "",
          clip: "",
        }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByText(/layer 3 \(final\)/i)).toBeInTheDocument()
  })
})

// ===========================================================================
// LayerStack — add / remove / reorder
// ===========================================================================

describe("layer stack", () => {
  test("renders one card per parsed layer", () => {
    render(<BackgroundEditorPanel value={TWO_LAYERS} onChange={() => {}} />)
    expect(screen.getAllByTestId("background-layer-card")).toHaveLength(3)
  })

  test("adding a layer emits a background string with an extra comma group", () => {
    const onChange = vi.fn()
    render(
      <BackgroundEditorPanel
        value="url(x.png) left top, #fff"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/add layer/i))
    expect(onChange).toHaveBeenCalled()
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    // two top-level commas → three layers.
    expect((emitted.match(/,/g) ?? []).length).toBe(2)
  })

  test("removing a layer emits a background string with one fewer layer", () => {
    const onChange = vi.fn()
    render(<BackgroundEditorPanel value={TWO_LAYERS} onChange={onChange} />)
    const cards = screen.getAllByTestId("background-layer-card")
    fireEvent.click(within(cards[0]).getByLabelText(/remove layer/i))
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    // three → two layers → one top-level comma.
    expect((emitted.match(/,/g) ?? []).length).toBe(1)
  })

  test("moving a layer down reorders the emitted background string", () => {
    const onChange = vi.fn()
    render(
      <BackgroundEditorPanel
        value="url(a.png) left top, url(b.png) right bottom, #fff"
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    // move the first layer (a.png) down → it should follow b.png.
    fireEvent.click(within(cards[0]).getByLabelText(/move layer down/i))
    expect(onChange).toHaveBeenCalled()
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    expect(emitted.indexOf("b.png")).toBeLessThan(emitted.indexOf("a.png"))
  })

  test("moving a layer up reorders the emitted background string", () => {
    const onChange = vi.fn()
    render(
      <BackgroundEditorPanel
        value="url(a.png) left top, url(b.png) right bottom, #fff"
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    // move the second layer (b.png) up → it should precede a.png.
    fireEvent.click(within(cards[1]).getByLabelText(/move layer up/i))
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    expect(emitted.indexOf("b.png")).toBeLessThan(emitted.indexOf("a.png"))
  })

  test("reorder moves the color so it stays on the final layer", () => {
    const onChange = vi.fn()
    render(
      <BackgroundEditorPanel
        value="url(a.png) left top, #fff"
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    // move the first (image) layer down → the color layer is no longer last.
    fireEvent.click(within(cards[0]).getByLabelText(/move layer down/i))
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    // the color must now trail the a.png layer (still the final token group).
    expect(emitted.trim().endsWith("a.png")).toBe(false)
    expect(emitted).toContain("#fff")
  })
})

// ===========================================================================
// PositionPad wired into a card → emits coords into the value
// ===========================================================================

describe("position pad emits coords into the background string", () => {
  test("nudging the pad updates the emitted position", () => {
    const onChange = vi.fn()
    render(
      <BackgroundEditorPanel
        value="url(x.png) 50% 50%, #fff"
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    const pad = within(cards[0]).getByLabelText(/background position/i)
    fireEvent.keyDown(pad, { key: "ArrowRight" })
    expect(onChange).toHaveBeenCalled()
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    expect(emitted).toContain("%")
  })
})

// ===========================================================================
// final-layer color picker only on the last card
// ===========================================================================

describe("final-layer color", () => {
  test("the color picker shows only on the last card", () => {
    render(<BackgroundEditorPanel value={TWO_LAYERS} onChange={() => {}} />)
    expect(screen.getAllByLabelText(/layer color/i)).toHaveLength(1)
  })
})

// ===========================================================================
// BackgroundPreview — the live composite tile
// ===========================================================================

describe("live preview", () => {
  test("the preview tile carries a background style for the produced value", () => {
    render(<BackgroundEditorPanel value={TWO_LAYERS} onChange={() => {}} />)
    const tile = screen.getByTestId("background-preview-tile")
    const bg = tile.style.background || tile.style.backgroundImage
    expect(bg.length).toBeGreaterThan(0)
  })
})

// ===========================================================================
// BackgroundEditor — popover trigger summary
// ===========================================================================

describe("BackgroundEditor (popover)", () => {
  test("the trigger summarizes the layer count", () => {
    render(<BackgroundEditor value={TWO_LAYERS} onChange={() => {}} />)
    // 3 layers → the trigger mentions "3".
    expect(screen.getByRole("button")).toHaveTextContent("3")
  })

  test("the trigger shows the value", () => {
    render(<BackgroundEditor value={TWO_LAYERS} onChange={() => {}} />)
    expect(screen.getByRole("button")).toHaveTextContent(/linear-gradient/)
  })
})

// ===========================================================================
// controlled resync
// ===========================================================================

describe("controlled value", () => {
  test("an external value change re-renders the layer stack", () => {
    const { rerender } = render(
      <BackgroundEditorPanel
        value="url(x.png) center, #fff"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByTestId("background-layer-card")).toHaveLength(2)
    rerender(
      <BackgroundEditorPanel
        value="url(a.png) left, url(b.png) right, url(c.png) center, #fff"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByTestId("background-layer-card")).toHaveLength(4)
  })

  test("an unparseable external value is ignored (stack keeps prior layers)", () => {
    const { rerender } = render(
      <BackgroundEditorPanel
        value="url(a.png) left, url(b.png) right, #fff"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByTestId("background-layer-card")).toHaveLength(3)
    // An invalid value → parse error → the effect leaves the stack untouched.
    rerender(
      <BackgroundEditorPanel
        value="!!!not-a-background!!!"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByTestId("background-layer-card")).toHaveLength(3)
  })

  test("the panel falls back to a default when the initial value is invalid", () => {
    // An invalid initial value → useState seeds the default background.
    render(<BackgroundEditorPanel value="@@@bogus@@@" onChange={() => {}} />)
    expect(
      screen.getAllByTestId("background-layer-card").length,
    ).toBeGreaterThan(0)
  })

  test("the panel falls back to a default for an empty initial value", () => {
    render(<BackgroundEditorPanel value="" onChange={() => {}} />)
    expect(
      screen.getAllByTestId("background-layer-card").length,
    ).toBeGreaterThan(0)
  })

  test("an edit emits and the self-emit is not re-applied as an external change", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <BackgroundEditorPanel
        value="url(x.png) 50% 50%, #fff"
        onChange={onChange}
      />,
    )
    const pad = within(
      screen.getAllByTestId("background-layer-card")[0],
    ).getByLabelText(/background position/i)
    fireEvent.keyDown(pad, { key: "ArrowRight" })
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    // Feed the emitted value back as the controlled prop: the resync effect must
    // short-circuit (value === lastEmittedRef) and keep the same layer count.
    rerender(<BackgroundEditorPanel value={emitted} onChange={onChange} />)
    expect(screen.getAllByTestId("background-layer-card")).toHaveLength(2)
  })
})

// ===========================================================================
// LayerStack — direct (move guards, add, remove)
// ===========================================================================

function mkLayer(partial: Partial<BgLayer>): BgLayer {
  return {
    image: "none",
    position: "center",
    size: "cover",
    repeat: "no-repeat",
    attachment: "",
    origin: "",
    clip: "",
    ...partial,
  }
}

describe("LayerStack (direct)", () => {
  test("moving the first layer up is a no-op (guard early-return)", () => {
    const onChange = vi.fn()
    render(
      <LayerStack
        layers={[
          mkLayer({ image: "url(a.png)" }),
          mkLayer({ image: "url(b.png)" }),
        ]}
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    // The first card's up button is disabled; firing onClick is suppressed, so
    // assert it is disabled (the guard / canMoveUp=false branch).
    const up = within(cards[0]).getByLabelText(/move layer up/i)
    expect(up).toBeDisabled()
    fireEvent.click(up)
    expect(onChange).not.toHaveBeenCalled()
  })

  test("moving the last layer down is disabled (canMoveDown=false branch)", () => {
    const onChange = vi.fn()
    render(
      <LayerStack
        layers={[
          mkLayer({ image: "url(a.png)" }),
          mkLayer({ image: "url(b.png)" }),
        ]}
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    const down = within(cards[1]).getByLabelText(/move layer down/i)
    expect(down).toBeDisabled()
    fireEvent.click(down)
    expect(onChange).not.toHaveBeenCalled()
  })

  test("a valid move down emits the reordered array", () => {
    const onChange = vi.fn()
    render(
      <LayerStack
        layers={[
          mkLayer({ image: "url(a.png)" }),
          mkLayer({ image: "url(b.png)" }),
        ]}
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    fireEvent.click(within(cards[0]).getByLabelText(/move layer down/i))
    const next = onChange.mock.calls.at(-1)?.[0] as BgLayer[]
    expect(next[0].image).toBe("url(b.png)")
    expect(next[1].image).toBe("url(a.png)")
  })

  test("a valid move up emits the reordered array", () => {
    const onChange = vi.fn()
    render(
      <LayerStack
        layers={[
          mkLayer({ image: "url(a.png)" }),
          mkLayer({ image: "url(b.png)" }),
        ]}
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    fireEvent.click(within(cards[1]).getByLabelText(/move layer up/i))
    const next = onChange.mock.calls.at(-1)?.[0] as BgLayer[]
    expect(next[0].image).toBe("url(b.png)")
  })

  test("add appends a fresh layer", () => {
    const onChange = vi.fn()
    render(<LayerStack layers={[mkLayer({})]} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/add layer/i))
    const next = onChange.mock.calls.at(-1)?.[0] as BgLayer[]
    expect(next).toHaveLength(2)
  })

  test("removing a card drops that index from the array", () => {
    const onChange = vi.fn()
    render(
      <LayerStack
        layers={[
          mkLayer({ image: "url(a.png)" }),
          mkLayer({ image: "url(b.png)" }),
        ]}
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    fireEvent.click(within(cards[0]).getByLabelText(/remove layer/i))
    const next = onChange.mock.calls.at(-1)?.[0] as BgLayer[]
    expect(next).toHaveLength(1)
    expect(next[0].image).toBe("url(b.png)")
  })

  test("the only remaining layer cannot be removed", () => {
    render(<LayerStack layers={[mkLayer({})]} onChange={() => {}} />)
    expect(screen.getByLabelText(/remove layer/i)).toBeDisabled()
  })

  test("editing a card dispatches the updated array at that index", () => {
    const onChange = vi.fn()
    render(
      <LayerStack
        layers={[
          mkLayer({ image: "url(a.png)" }),
          mkLayer({ image: "url(b.png)" }),
        ]}
        onChange={onChange}
      />,
    )
    const cards = screen.getAllByTestId("background-layer-card")
    fireEvent.change(within(cards[1]).getByLabelText(/layer 2 image/i), {
      target: { value: "url(c.png)" },
    })
    const next = onChange.mock.calls.at(-1)?.[0] as BgLayer[]
    expect(next[1].image).toBe("url(c.png)")
    expect(next[0].image).toBe("url(a.png)")
  })
})

// ===========================================================================
// BackgroundPreview — direct (empty value → checkerboard fallback)
// ===========================================================================

describe("BackgroundPreview (direct)", () => {
  test("a produced value paints the tile", () => {
    render(<BackgroundPreview value="#f00" />)
    const tile = screen.getByTestId("background-preview-tile")
    const bg = tile.style.background || tile.style.backgroundColor
    // jsdom normalizes #f00 to rgb(255, 0, 0); just assert the value painted.
    expect(bg).toMatch(/rgb\(255, 0, 0\)|#f00/)
  })

  test("an empty value falls back to the checkerboard underlay", () => {
    render(<BackgroundPreview value="" />)
    const tile = screen.getByTestId("background-preview-tile")
    const bg = tile.style.background || tile.style.backgroundImage
    // The fallback CHECKER is a repeating-conic-gradient.
    expect(bg).toContain("conic-gradient")
  })

  test("the tile is a labelled img describing the painted value", () => {
    render(<BackgroundPreview value="#abc" />)
    expect(
      screen.getByRole("img", { name: /painted with the background #abc/i }),
    ).toBeInTheDocument()
  })
})

// ===========================================================================
// BackgroundEditor (popover) — label branches
// ===========================================================================

describe("BackgroundEditor label", () => {
  test("an invalid value labels the trigger 'invalid'", () => {
    render(<BackgroundEditor value="!!!garbage!!!" onChange={() => {}} />)
    expect(screen.getByRole("button")).toHaveTextContent(/invalid/i)
  })

  test("a single-layer value uses the singular 'layer'", () => {
    render(<BackgroundEditor value="#fff" onChange={() => {}} />)
    const text = screen.getByRole("button").textContent ?? ""
    expect(text).toMatch(/\b1 layer\b/)
    expect(text).not.toMatch(/1 layers/)
  })

  test("a multi-layer value uses the plural 'layers'", () => {
    render(
      <BackgroundEditor value="url(a.png) left, #fff" onChange={() => {}} />,
    )
    expect(screen.getByRole("button")).toHaveTextContent(/2 layers/)
  })

  test("a custom aria-label labels the trigger", () => {
    render(
      <BackgroundEditor
        value="#fff"
        onChange={() => {}}
        aria-label="My background"
      />,
    )
    expect(screen.getByLabelText(/my background/i)).toBeInTheDocument()
  })
})
