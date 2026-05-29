import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  AddLayerButton,
  BoxShadowEditor,
  BoxShadowEditorPanel,
  BoxShadowPreview,
  ShadowLayerRow,
  ShadowLengthEditor,
} from "@/components/ui/box-shadow-editor/box-shadow-editor"
import { cssBoxShadow } from "@/components/ui/box-shadow-editor/box-shadow-editor.types"

/** Stub a 200x200 stage at the origin for pointer-math assertions. */
function stubRect(el: HTMLElement): void {
  el.getBoundingClientRect = vi.fn(
    () =>
      ({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => {},
      }) as DOMRect,
  )
}

test("cssBoxShadow returns its argument unchanged at runtime", () => {
  expect(cssBoxShadow("0px 4px 8px #000")).toBe("0px 4px 8px #000")
})

describe("BoxShadowEditorPanel", () => {
  test("renders one row per layer", () => {
    render(
      <BoxShadowEditorPanel
        value="0px 1px 2px #000, inset 0px 0px 2px"
        onChange={() => {}}
      />,
    )
    // each row has an inset toggle
    expect(screen.getAllByLabelText(/^inset shadow/i)).toHaveLength(2)
  })

  test("editing offset-x emits onChange with the updated string", () => {
    const onChange = vi.fn()
    render(<BoxShadowEditorPanel value="0px 4px 8px" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("offset-x 1"), {
      target: { value: "2px" },
    })
    expect(onChange).toHaveBeenCalledWith("2px 4px 8px")
  })

  test("toggling inset emits an inset-prefixed string", () => {
    const onChange = vi.fn()
    render(<BoxShadowEditorPanel value="0px 4px 8px" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Inset shadow 1"))
    expect(onChange).toHaveBeenCalledWith("inset 0px 4px 8px")
  })

  test("AddLayerButton appends a layer", () => {
    const onChange = vi.fn()
    render(<BoxShadowEditorPanel value="0px 4px 8px" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/add a shadow layer/i))
    // default layer is 0px 4px 8px rgb(0 0 0 / 0.25)
    expect(onChange).toHaveBeenCalledWith(
      "0px 4px 8px, 0px 4px 8px rgb(0 0 0 / 0.25)",
    )
  })

  test("removing a row drops it from the value", () => {
    const onChange = vi.fn()
    render(
      <BoxShadowEditorPanel
        value="0px 1px 2px #000, 0px 4px 8px"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Remove layer 1"))
    expect(onChange).toHaveBeenCalledWith("0px 4px 8px")
  })

  test("value='none' renders an empty list with an add control", () => {
    const onChange = vi.fn()
    render(<BoxShadowEditorPanel value="none" onChange={onChange} />)
    expect(screen.queryAllByLabelText(/^inset shadow/i)).toHaveLength(0)
    fireEvent.click(screen.getByLabelText(/add a shadow layer/i))
    expect(onChange).toHaveBeenCalledWith("0px 4px 8px rgb(0 0 0 / 0.25)")
  })
})

describe("ShadowLayerRow", () => {
  test("renders inset toggle, four length editors, and a color control", () => {
    render(
      <ShadowLayerRow
        layer={{
          inset: true,
          offsetX: "0px",
          offsetY: "4px",
          blur: "8px",
          spread: "1px",
          color: "rgb(0 0 0 / 0.5)",
        }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("offset-x")).toHaveValue("0px")
    expect(screen.getByLabelText("offset-y")).toHaveValue("4px")
    expect(screen.getByLabelText("blur")).toHaveValue("8px")
    expect(screen.getByLabelText("spread")).toHaveValue("1px")
    expect(screen.getByLabelText("color")).toBeInTheDocument()
    // the inset toggle reflects pressed state
    expect(screen.getByLabelText("Inset shadow")).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })

  test("editing the blur slot emits the updated layer; emptying it drops the key", () => {
    const onChange = vi.fn()
    render(
      <ShadowLayerRow
        layer={{ inset: false, offsetX: "0px", offsetY: "4px", blur: "8px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("blur"), {
      target: { value: "12px" },
    })
    expect(onChange).toHaveBeenCalledWith({
      inset: false,
      offsetX: "0px",
      offsetY: "4px",
      blur: "12px",
    })
    fireEvent.change(screen.getByLabelText("blur"), { target: { value: "" } })
    expect(onChange).toHaveBeenLastCalledWith({
      inset: false,
      offsetX: "0px",
      offsetY: "4px",
    })
  })

  test("a colorless layer shows a + color affordance that adds a color", () => {
    const onChange = vi.fn()
    render(
      <ShadowLayerRow
        layer={{ inset: false, offsetX: "0px", offsetY: "4px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    expect(screen.queryByLabelText("color")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /add color/i }))
    expect(onChange).toHaveBeenCalledWith({
      inset: false,
      offsetX: "0px",
      offsetY: "4px",
      color: "rgb(0 0 0 / 0.5)",
    })
  })

  test("clearing the color removes it from the layer", () => {
    const onChange = vi.fn()
    render(
      <ShadowLayerRow
        layer={{ inset: false, offsetX: "0px", offsetY: "4px", color: "#000" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /remove color/i }))
    expect(onChange).toHaveBeenCalledWith({
      inset: false,
      offsetX: "0px",
      offsetY: "4px",
    })
  })

  test("changing a length unit recomposes the value", () => {
    const onChange = vi.fn()
    render(
      <ShadowLayerRow
        layer={{ inset: false, offsetX: "4px", offsetY: "4px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("offset-x unit"), {
      target: { value: "rem" },
    })
    expect(onChange).toHaveBeenCalledWith({
      inset: false,
      offsetX: "4rem",
      offsetY: "4px",
    })
  })

  test("choosing a unit on an empty blur slot seeds a 0 value", () => {
    const onChange = vi.fn()
    render(
      <ShadowLayerRow
        layer={{ inset: false, offsetX: "0px", offsetY: "4px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    // the blur slot is empty; picking a unit recomposes from "0"
    fireEvent.change(screen.getByLabelText("blur unit"), {
      target: { value: "rem" },
    })
    expect(onChange).toHaveBeenCalledWith({
      inset: false,
      offsetX: "0px",
      offsetY: "4px",
      blur: "0rem",
    })
  })
})

describe("ShadowLengthEditor — opaque values", () => {
  test("an opaque calc() value renders as a raw text input (no unit select)", () => {
    const onChange = vi.fn()
    render(
      <ShadowLengthEditor
        label="offset-x"
        value="calc(2px + 1px)"
        onChange={onChange}
      />,
    )
    const input = screen.getByLabelText("offset-x")
    expect(input).toHaveValue("calc(2px + 1px)")
    expect(screen.queryByLabelText("offset-x unit")).not.toBeInTheDocument()
  })
})

describe("AddLayerButton", () => {
  test("calls onAdd when clicked", () => {
    const onAdd = vi.fn()
    render(<AddLayerButton onAdd={onAdd} />)
    fireEvent.click(screen.getByLabelText(/add a shadow layer/i))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})

describe("BoxShadowPreview", () => {
  test("applies the stacked shadow to the target", () => {
    const { container } = render(
      <BoxShadowPreview value="0px 4px 8px rgb(0 0 0 / 0.2)" />,
    )
    const target = container.querySelector("[data-shadow-target]")
    expect(target).not.toBeNull()
    expect((target as HTMLElement).style.boxShadow).toBe(
      "0px 4px 8px rgb(0 0 0 / 0.2)",
    )
  })

  test("value='none' applies no shadow", () => {
    const { container } = render(<BoxShadowPreview value="none" />)
    const target = container.querySelector("[data-shadow-target]")
    expect((target as HTMLElement).style.boxShadow).toBe("")
  })

  test("dragging the light source re-casts every layer's offset", () => {
    const onChange = vi.fn()
    render(<BoxShadowPreview value="0px 4px 8px #000" onChange={onChange} />)
    stubRect(screen.getByTestId("box-shadow-stage"))
    const light = screen.getByRole("slider", { name: /light source/i })
    // press at the top-left corner, then drag to the bottom-right corner.
    fireEvent.pointerDown(light, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    // light bottom-right ⇒ shadow cast up-left ⇒ negative offsets
    expect(last).toMatch(/^-\d+px -\d+px 8px #000$/)
  })

  test("arrow keys nudge the light and re-cast offsets", () => {
    const onChange = vi.fn()
    render(<BoxShadowPreview value="0px 0px 8px #000" onChange={onChange} />)
    const light = screen.getByRole("slider", { name: /light source/i })
    fireEvent.keyDown(light, { key: "ArrowRight" })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    // light moved right ⇒ x offset goes negative
    expect(last).toMatch(/^-\d+px 0px 8px #000$/)
  })

  test("every arrow direction nudges; a non-arrow key is a no-op", () => {
    const onChange = vi.fn()
    render(<BoxShadowPreview value="0px 0px 8px #000" onChange={onChange} />)
    const light = screen.getByRole("slider", { name: /light source/i })
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) {
      fireEvent.keyDown(light, { key })
    }
    expect(onChange).toHaveBeenCalledTimes(4)
    onChange.mockClear()
    // shift makes a bigger nudge; still fires
    fireEvent.keyDown(light, { key: "ArrowUp", shiftKey: true })
    expect(onChange).toHaveBeenCalledTimes(1)
    onChange.mockClear()
    fireEvent.keyDown(light, { key: "Enter" })
    expect(onChange).not.toHaveBeenCalled()
  })

  test("dragging re-casts a multi-layer stack (layers fan out)", () => {
    const onChange = vi.fn()
    render(
      <BoxShadowPreview
        value="0px 1px 2px #000, 0px 4px 8px #0008"
        onChange={onChange}
      />,
    )
    stubRect(screen.getByTestId("box-shadow-stage"))
    const light = screen.getByRole("slider", { name: /light source/i })
    fireEvent.pointerDown(light, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200, pointerId: 1 })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    // two layers, both re-cast; the second fans out further than the first
    const layers = String(last).split(", ")
    expect(layers).toHaveLength(2)
    const x1 = Number.parseInt(layers[0], 10)
    const x2 = Number.parseInt(layers[1], 10)
    expect(Math.abs(x2)).toBeGreaterThan(Math.abs(x1))
  })

  test("a layer with a non-numeric blur falls back to default elevation", () => {
    render(
      <BoxShadowPreview value="0px 4px var(--b) #000" onChange={() => {}} />,
    )
    // dominantBlur skips the NaN blur and defaults to 8
    expect(screen.getByLabelText(/elevation .* in px/i)).toHaveValue("8")
  })

  test("the elevation scrubber scales blur across layers", () => {
    const onChange = vi.fn()
    render(<BoxShadowPreview value="0px 4px 8px #000" onChange={onChange} />)
    const elevation = screen.getByLabelText(/elevation .* in px/i)
    fireEvent.change(elevation, { target: { value: "20" } })
    fireEvent.blur(elevation)
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/0px 4px 20px #000/)
  })

  test("renders no controls when onChange is omitted", () => {
    render(<BoxShadowPreview value="0px 4px 8px #000" />)
    expect(
      screen.queryByRole("slider", { name: /light source/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/elevation/i)).not.toBeInTheDocument()
  })

  test("value='none' still shows a draggable light (default position)", () => {
    const onChange = vi.fn()
    render(<BoxShadowPreview value="none" onChange={onChange} />)
    const light = screen.getByRole("slider", { name: /light source/i })
    expect(light).toBeInTheDocument()
    // dragging from none produces a single freshly-cast layer
    stubRect(screen.getByTestId("box-shadow-stage"))
    fireEvent.pointerDown(light, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200, pointerId: 1 })
    expect(onChange).toHaveBeenCalled()
  })

  test("the elevation scrubber seeds a layer from an empty stack", () => {
    const onChange = vi.fn()
    render(<BoxShadowPreview value="none" onChange={onChange} />)
    const elevation = screen.getByLabelText(/elevation .* in px/i)
    fireEvent.change(elevation, { target: { value: "16" } })
    fireEvent.blur(elevation)
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    // applyElevation on [] seeds one soft drop shadow at the new blur
    expect(last).toMatch(/16px rgb\(0 0 0 \/ 0\.25\)/)
  })

  test("a colorless, blurless layer defaults the elevation to 8px", () => {
    render(<BoxShadowPreview value="0px 4px" onChange={() => {}} />)
    // dominantBlur falls back to 8 when no layer carries a blur
    const elevation = screen.getByLabelText(/elevation .* in px/i)
    expect(elevation).toHaveValue("8")
  })

  test("a non-default light position renders the dot off-corner", () => {
    // a layer whose offsets are already cast should place the light away from
    // the default top-left, exercising the lightFromState non-default branch.
    render(
      <BoxShadowPreview value="-12px -12px 8px #000" onChange={() => {}} />,
    )
    const light = screen.getByRole("slider", { name: /light source/i })
    // light vector inverts the negative offset → past center (>50%)
    expect(light.style.left).not.toBe("30%")
  })
})

describe("BoxShadowEditorPanel — resync + preview write-back", () => {
  test("an external value change re-syncs the rows", () => {
    const { rerender } = render(
      <BoxShadowEditorPanel value="0px 4px 8px" onChange={() => {}} />,
    )
    expect(screen.getAllByLabelText(/^inset shadow/i)).toHaveLength(1)
    rerender(
      <BoxShadowEditorPanel
        value="0px 1px 2px #000, 0px 4px 8px"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^inset shadow/i)).toHaveLength(2)
  })

  test("dragging the light inside the panel writes the value back", () => {
    const onChange = vi.fn()
    render(
      <BoxShadowEditorPanel value="0px 4px 8px #000" onChange={onChange} />,
    )
    stubRect(screen.getByTestId("box-shadow-stage"))
    const light = screen.getByRole("slider", { name: /light source/i })
    fireEvent.pointerDown(light, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200, pointerId: 1 })
    expect(onChange).toHaveBeenCalled()
  })
})

describe("BoxShadowEditor (popover)", () => {
  test("renders a trigger button showing the layer count", () => {
    render(
      <BoxShadowEditor
        value="0px 1px 2px #000, 0px 4px 8px"
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole("button").textContent).toMatch(/2 layers/)
  })

  test("singular layer count for one layer", () => {
    render(<BoxShadowEditor value="0px 4px 8px" onChange={() => {}} />)
    expect(screen.getByRole("button").textContent).toMatch(/1 layer/)
  })

  test("opening the popover reveals the panel", async () => {
    render(<BoxShadowEditor value="0px 4px 8px" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    const toggles = await screen.findAllByLabelText(/^inset shadow/i)
    expect(toggles.length).toBeGreaterThan(0)
  })
})
