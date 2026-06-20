import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  BackgroundEditor,
  BackgroundEditorPanel,
  LayerCard,
  PositionPad,
} from "@/components/ui/background-editor/background-editor"
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
})
