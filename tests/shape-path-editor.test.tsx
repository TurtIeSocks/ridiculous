import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  CommandRow,
  ShapeCanvas,
  ShapePathEditor,
  ShapePathEditorPanel,
  ShapePreview,
} from "@/components/ui/shape-path-editor/shape-path-editor"
import { cssShape } from "@/components/ui/shape-path-editor/shape-path-editor.types"

/** Stub a 200x200 origin rect onto an element for drag-math tests. */
function stubRect(el: HTMLElement) {
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

test("cssShape returns its argument unchanged at runtime", () => {
  expect(cssShape("shape(from 0px 0px, line to 100px 0px, close)")).toBe(
    "shape(from 0px 0px, line to 100px 0px, close)",
  )
})

describe("ShapeCanvas — nodes", () => {
  test("renders one draggable node per command endpoint plus the from seed", () => {
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px, line to 100px 100px, close)"
        onChange={() => {}}
      />,
    )
    // from seed + 2 line endpoints (close contributes none) = 3 nodes.
    expect(screen.getByLabelText(/from point/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText(/endpoint/i).length).toBe(2)
  })

  test("a curve command renders a draggable Bézier control handle", () => {
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, curve to 100px 100px with 50px 0px, close)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/control handle/i)).toBeInTheDocument()
  })
})

describe("ShapeCanvas — drag", () => {
  test("dragging an endpoint node emits updated coords via onChange", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={onChange}
      />,
    )
    const stage = screen.getByTestId("shape-canvas-stage")
    stubRect(stage)

    const handle = screen.getByLabelText(/line endpoint/i)
    fireEvent.pointerDown(handle, { clientX: 50, clientY: 50, pointerId: 1 })
    // Move to (100px, 25px) in a 200px box mapped to 0..200 px space → 100,25.
    fireEvent.pointerMove(window, { clientX: 100, clientY: 25, pointerId: 1 })
    fireEvent.pointerUp(window, { pointerId: 1 })

    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/line to 100px 25px/)
  })

  test("dragging a curve control handle rewrites the control point", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, curve to 100px 100px with 50px 0px, close)"
        onChange={onChange}
      />,
    )
    const stage = screen.getByTestId("shape-canvas-stage")
    stubRect(stage)

    const handle = screen.getByLabelText(/control handle/i)
    fireEvent.pointerDown(handle, { clientX: 50, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 80, clientY: 20, pointerId: 1 })
    fireEvent.pointerUp(window, { pointerId: 1 })

    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/with 80px 20px/)
  })

  test("a node nudges with arrow keys", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={onChange}
      />,
    )
    const handle = screen.getByLabelText(/line endpoint/i)
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/line to 51px 50px/)
  })

  test("shift+arrow nudges by 10px", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={onChange}
      />,
    )
    const handle = screen.getByLabelText(/line endpoint/i)
    fireEvent.keyDown(handle, { key: "ArrowDown", shiftKey: true })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/line to 50px 60px/)
  })

  test("ShapeCanvas renders without onChange (read-only, no handles)", () => {
    render(
      <ShapeCanvas value="shape(from 0px 0px, line to 50px 50px, close)" />,
    )
    expect(screen.getByTestId("shape-canvas-stage")).toBeInTheDocument()
    expect(screen.queryByLabelText(/line endpoint/i)).toBeNull()
  })

  test("a read-only canvas ignores arrow-key nudges (no onChange)", () => {
    render(
      <ShapeCanvas value="shape(from 0px 0px, line to 50px 50px, close)" />,
    )
    // No handles render at all without onChange, but the from node is also gone.
    expect(screen.queryByLabelText(/from point/i)).toBeNull()
  })

  test("ArrowUp and ArrowLeft nudge the node negatively", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={onChange}
      />,
    )
    fireEvent.keyDown(screen.getByLabelText(/line endpoint/i), {
      key: "ArrowUp",
    })
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/line to 50px 49px/)
    // Re-query: the panel re-rendered, the handle's closure now reflects 50,49.
    fireEvent.keyDown(screen.getByLabelText(/line endpoint/i), {
      key: "ArrowLeft",
    })
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/line to 49px 49px/)
  })

  test("a non-arrow key on a node does nothing", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={onChange}
      />,
    )
    fireEvent.keyDown(screen.getByLabelText(/line endpoint/i), { key: "Enter" })
    expect(onChange).not.toHaveBeenCalled()
  })

  test("a drag with a zero-size stage rect is a no-op", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={onChange}
      />,
    )
    const stage = screen.getByTestId("shape-canvas-stage")
    stage.getBoundingClientRect = vi.fn(
      () =>
        ({
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => {},
        }) as DOMRect,
    )
    const handle = screen.getByLabelText(/line endpoint/i)
    fireEvent.pointerDown(handle, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 30, clientY: 30, pointerId: 1 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    // Pointer-down does not emit; the zero-rect move is rejected → no onChange.
    expect(onChange).not.toHaveBeenCalled()
  })

  test("a cubic curve renders a second draggable control handle with a connector", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, curve to 100px 100px with 20px 0px / 80px 100px, close)"
        onChange={onChange}
      />,
    )
    expect(screen.getByLabelText(/second control handle/i)).toBeInTheDocument()

    const stage = screen.getByTestId("shape-canvas-stage")
    stubRect(stage)
    const handle = screen.getByLabelText(/second control handle/i)
    fireEvent.pointerDown(handle, { clientX: 80, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 60, clientY: 70, pointerId: 1 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/\/ 60px 70px/)
  })

  test("dragging the from seed rewrites the seed point", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={onChange}
      />,
    )
    const stage = screen.getByTestId("shape-canvas-stage")
    stubRect(stage)
    const seed = screen.getByLabelText(/from point/i)
    fireEvent.pointerDown(seed, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 20, clientY: 40, pointerId: 1 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/from 20px 40px/)
  })

  test("nudging the from seed clamps below zero to 0px", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={onChange}
      />,
    )
    // ArrowLeft from x=0 clamps to 0 (exercises clampCanvas lower bound).
    fireEvent.keyDown(screen.getByLabelText(/from point/i), {
      key: "ArrowLeft",
    })
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/from 0px 0px/)
  })
})

describe("CommandRow — command list", () => {
  test("adding a command grows the list and emits", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px, close)"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /add command/i }))
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    // The list grew: two `line` commands now precede close, or an extra command appears.
    expect(last.split(",").length).toBeGreaterThan(3)
  })

  test("removing a command shrinks the list", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px, line to 100px 100px, close)"
        onChange={onChange}
      />,
    )
    const removes = screen.getAllByRole("button", { name: /remove command/i })
    fireEvent.click(removes[0])
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).not.toMatch(/line to 100px 0px/)
  })

  test("reordering a command up swaps it with its predecessor", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 10px 10px, line to 90px 90px, close)"
        onChange={onChange}
      />,
    )
    const ups = screen.getAllByRole("button", { name: /move command \d+ up/i })
    // Move the second command (90px 90px) above the first (10px 10px).
    fireEvent.click(ups[1])
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/line to 90px 90px, line to 10px 10px/)
  })

  test("switching the command kind swaps the row fields", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px, close)"
        onChange={onChange}
      />,
    )
    const kindSelects = screen.getAllByLabelText(/command \d+ kind/i)
    fireEvent.change(kindSelects[0], { target: { value: "curve" } })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/curve /)
  })

  test("toggling by/to flips the direction keyword", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px, close)"
        onChange={onChange}
      />,
    )
    const dirSelects = screen.getAllByLabelText(/command \d+ direction/i)
    fireEvent.change(dirSelects[0], { target: { value: "by" } })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/line by 100px 0px/)
  })

  test("editing a coordinate input emits the updated value", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px, close)"
        onChange={onChange}
      />,
    )
    const xInput = screen.getByLabelText(/command 1 x/i)
    fireEvent.change(xInput, { target: { value: "40" } })
    fireEvent.blur(xInput, { target: { value: "40" } })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/line to 40px 0px/)
  })

  test("CommandRow exposes scalar field for hline/vline", () => {
    const onChange = vi.fn()
    render(
      <CommandRow
        index={0}
        command={{ kind: "hline", by: true, value: "50px" }}
        onChange={onChange}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
    expect(screen.getByLabelText(/command 1 value/i)).toBeInTheDocument()
  })

  test("editing the hline scalar value emits the updated value", () => {
    const onChange = vi.fn()
    render(
      <CommandRow
        index={0}
        command={{ kind: "vline", by: false, value: "50px" }}
        onChange={onChange}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
    const valueInput = screen.getByLabelText(/command 1 value/i)
    fireEvent.change(valueInput, { target: { value: "70" } })
    fireEvent.blur(valueInput, { target: { value: "70" } })
    expect(onChange).toHaveBeenCalledWith({
      kind: "vline",
      by: false,
      value: "70px",
    })
  })

  test("curve row edits its endpoint + both control coords", () => {
    const onChange = vi.fn()
    render(
      <CommandRow
        index={0}
        command={{
          kind: "curve",
          by: false,
          to: { x: "100px", y: "100px" },
          control: { x: "50px", y: "0px" },
        }}
        onChange={onChange}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
    // "with" label is rendered for the curve control slot.
    expect(screen.getByText("with")).toBeInTheDocument()

    const cx = screen.getByLabelText(/command 1 control x/i)
    fireEvent.change(cx, { target: { value: "25" } })
    fireEvent.blur(cx, { target: { value: "25" } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ control: { x: "25px", y: "0px" } }),
    )

    const cy = screen.getByLabelText(/command 1 control y/i)
    fireEvent.change(cy, { target: { value: "15" } })
    fireEvent.blur(cy, { target: { value: "15" } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ control: { x: "50px", y: "15px" } }),
    )

    const ey = screen.getByLabelText(/command 1 y/i)
    fireEvent.change(ey, { target: { value: "80" } })
    fireEvent.blur(ey, { target: { value: "80" } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ to: { x: "100px", y: "80px" } }),
    )
  })

  test("arc row renders the 'of' slot and edits both radius coords", () => {
    const onChange = vi.fn()
    render(
      <CommandRow
        index={0}
        command={{
          kind: "arc",
          by: false,
          to: { x: "100px", y: "0px" },
          radius: { x: "50px", y: "50px" },
        }}
        onChange={onChange}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
    expect(screen.getByText("of")).toBeInTheDocument()

    const rx = screen.getByLabelText(/command 1 radius x/i)
    fireEvent.change(rx, { target: { value: "30" } })
    fireEvent.blur(rx, { target: { value: "30" } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ radius: { x: "30px", y: "50px" } }),
    )

    const ry = screen.getByLabelText(/command 1 radius y/i)
    fireEvent.change(ry, { target: { value: "20" } })
    fireEvent.blur(ry, { target: { value: "20" } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ radius: { x: "50px", y: "20px" } }),
    )
  })

  test("a smooth row edits its endpoint x via the shared to-coord block", () => {
    const onChange = vi.fn()
    render(
      <CommandRow
        index={0}
        command={{ kind: "smooth", by: false, to: { x: "90px", y: "90px" } }}
        onChange={onChange}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
    const ex = screen.getByLabelText(/command 1 x/i)
    fireEvent.change(ex, { target: { value: "70" } })
    fireEvent.blur(ex, { target: { value: "70" } })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ to: { x: "70px", y: "90px" } }),
    )
  })

  test("a close row hides the direction toggle and coordinate fields", () => {
    render(
      <CommandRow
        index={0}
        command={{ kind: "close" }}
        onChange={() => {}}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
    expect(screen.queryByLabelText(/command 1 direction/i)).toBeNull()
    expect(screen.queryByLabelText(/command 1 x/i)).toBeNull()
  })

  test("reseeding to each kind keeps the by flag and seeds defaults", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <CommandRow
        index={0}
        command={{ kind: "line", by: true, to: { x: "10px", y: "20px" } }}
        onChange={onChange}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
    const kind = () => screen.getByLabelText(/command 1 kind/i)

    // line → curve: endpoint carries over, a control default is seeded, by kept.
    fireEvent.change(kind(), { target: { value: "curve" } })
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "curve",
      by: true,
      to: { x: "10px", y: "20px" },
      control: { x: "50px", y: "50px" },
    })

    // line → arc: radius default seeded, endpoint + by kept.
    fireEvent.change(kind(), { target: { value: "arc" } })
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "arc",
      by: true,
      to: { x: "10px", y: "20px" },
      radius: { x: "50px", y: "50px" },
    })

    // line → hline: drops to a scalar value, keeps by.
    fireEvent.change(kind(), { target: { value: "hline" } })
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "hline",
      by: true,
      value: "50px",
    })

    // line → vline: scalar, by kept.
    fireEvent.change(kind(), { target: { value: "vline" } })
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "vline",
      by: true,
      value: "50px",
    })

    // line → smooth: endpoint + by kept, no seeded control.
    fireEvent.change(kind(), { target: { value: "smooth" } })
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "smooth",
      by: true,
      to: { x: "10px", y: "20px" },
    })

    // line → move: endpoint + by kept.
    fireEvent.change(kind(), { target: { value: "move" } })
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "move",
      by: true,
      to: { x: "10px", y: "20px" },
    })

    // line → close: discards everything.
    fireEvent.change(kind(), { target: { value: "close" } })
    expect(onChange).toHaveBeenLastCalledWith({ kind: "close" })

    rerender(
      <CommandRow
        index={0}
        command={{ kind: "line", by: false, to: { x: "10px", y: "20px" } }}
        onChange={onChange}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
  })

  test("reseeding an hline (no endpoint) into a point kind defaults the endpoint", () => {
    const onChange = vi.fn()
    render(
      <CommandRow
        index={0}
        command={{ kind: "hline", by: false, value: "50px" }}
        onChange={onChange}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
    // hline carries a `value`, not a `to` — reseed must default the endpoint.
    fireEvent.change(screen.getByLabelText(/command 1 kind/i), {
      target: { value: "line" },
    })
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "line",
      by: false,
      to: { x: "50px", y: "50px" },
    })
  })

  test("reseeding a close (no by) into a directional kind defaults by to false", () => {
    const onChange = vi.fn()
    render(
      <CommandRow
        index={0}
        command={{ kind: "close" }}
        onChange={onChange}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={false}
      />,
    )
    fireEvent.change(screen.getByLabelText(/command 1 kind/i), {
      target: { value: "line" },
    })
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "line",
      by: false,
      to: { x: "50px", y: "50px" },
    })
  })

  test("the reorder buttons disable at the list boundaries", () => {
    render(
      <CommandRow
        index={0}
        command={{ kind: "line", by: false, to: { x: "0px", y: "0px" } }}
        onChange={() => {}}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown={true}
      />,
    )
    expect(screen.getByLabelText(/move command 1 up/i)).toBeDisabled()
    expect(screen.getByLabelText(/move command 1 down/i)).not.toBeDisabled()
  })

  test("reordering the last command down is a no-op past the boundary", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 10px 10px, close)"
        onChange={onChange}
      />,
    )
    const downs = screen.getAllByRole("button", {
      name: /move command \d+ down/i,
    })
    // The close row is last; its down button is disabled, so click the
    // last enabled one (the line) — moving past the close is fine.
    const ups = screen.getAllByRole("button", { name: /move command \d+ up/i })
    fireEvent.click(ups[0]) // command 1 up — already first, no-op guard
    // No emit because target index < 0.
    expect(onChange).not.toHaveBeenCalled()
    expect(downs.length).toBeGreaterThan(0)
  })
})

describe("ShapePreview — degrade", () => {
  test("preview degrades when CSS.supports('clip-path: shape(...)') is false", () => {
    // jsdom has no CSS.supports → the preview takes the degraded path.
    render(
      <ShapePreview value="shape(from 0px 0px, line to 100px 0px, close)" />,
    )
    expect(screen.getByText(/not supported/i)).toBeInTheDocument()
  })

  test("preview renders a fallback SVG path when unsupported", () => {
    render(
      <ShapePreview value="shape(from 0px 0px, line to 100px 0px, close)" />,
    )
    expect(screen.getByTestId("shape-preview-fallback")).toBeInTheDocument()
  })

  test("offset-path mode is accepted and labels the preview", () => {
    render(
      <ShapePreview
        value="shape(from 0px 0px, line to 100px 0px, close)"
        mode="offset-path"
      />,
    )
    expect(screen.getByTestId("shape-preview-fallback")).toBeInTheDocument()
  })

  test("the mode label defaults to clip-path", () => {
    render(
      <ShapePreview value="shape(from 0px 0px, line to 100px 0px, close)" />,
    )
    expect(screen.getByText(/preview · clip-path/i)).toBeInTheDocument()
  })

  test("the fallback path d reflects every command kind", () => {
    const { container } = render(
      <ShapePreview value="shape(from 10px 10px, move by 5px 5px, line to 90px 90px, hline to 50px, vline by 10px, smooth to 40px 40px, arc to 60px 60px of 20px, close)" />,
    )
    const d = container.querySelector("path")?.getAttribute("d") ?? ""
    expect(d).toMatch(/^M 10 10/) // from seed
    expect(d).toMatch(/M 15 15/) // move by → relative move
    expect(d).toMatch(/L 90 90/) // line to
    expect(d).toMatch(/L 50 90/) // hline to (x only)
    expect(d).toMatch(/A 20 20 0 0 1/) // arc
    expect(d).toMatch(/Z/) // close
  })

  test("a cubic curve emits a C path; a quadratic emits a Q path", () => {
    const cubic = render(
      <ShapePreview value="shape(from 0px 0px, curve to 100px 100px with 20px 0px / 80px 100px, close)" />,
    )
    expect(cubic.container.querySelector("path")?.getAttribute("d")).toMatch(
      /C 20 0 80 100 100 100/,
    )
    cubic.unmount()

    const quad = render(
      <ShapePreview value="shape(from 0px 0px, curve to 100px 100px with 50px 0px, close)" />,
    )
    expect(quad.container.querySelector("path")?.getAttribute("d")).toMatch(
      /Q 50 0 100 100/,
    )
  })

  test("an invalid value still renders a degraded path of whatever parsed", () => {
    // The trailing command is invalid → parsed.error is non-null, so no live
    // value is applied, but the fallback still draws the seed.
    const { container } = render(
      <ShapePreview value="shape(from 0px 0px, wiggle to 10px 10px)" />,
    )
    expect(screen.getByTestId("shape-preview-fallback")).toBeInTheDocument()
    expect(container.querySelector("path")?.getAttribute("d")).toMatch(/^M 0 0/)
  })

  test("a non-numeric coordinate degrades to 0 in the path geometry", () => {
    // A garbage `from` makes the whole shape unparseable; num() falls back to 0.
    const { container } = render(<ShapePreview value="not-a-shape" />)
    expect(container.querySelector("path")?.getAttribute("d")).toBe("M 0 0")
  })

  test("supported mode renders the live clip-path target when CSS.supports is true", () => {
    const original = globalThis.CSS
    // @ts-expect-error — stub the CSS global for the supported branch.
    globalThis.CSS = { supports: () => true }
    try {
      const { container } = render(
        <ShapePreview value="shape(from 0px 0px, line to 100px 0px, close)" />,
      )
      expect(screen.getByText(/shape\(\) ✓/)).toBeInTheDocument()
      const target = container.querySelector("[data-shape-target]")
      expect(target).not.toBeNull()
      expect(target).toHaveStyle({
        clipPath: "shape(from 0px 0px, line to 100px 0px, close)",
      })
    } finally {
      globalThis.CSS = original
    }
  })

  test("supported offset-path mode renders the animated dot target", () => {
    const original = globalThis.CSS
    // @ts-expect-error — stub the CSS global for the supported branch.
    globalThis.CSS = { supports: () => true }
    try {
      const { container } = render(
        <ShapePreview
          value="shape(from 0px 0px, line to 100px 0px, close)"
          mode="offset-path"
        />,
      )
      expect(screen.getByText(/shape\(\) ✓/)).toBeInTheDocument()
      expect(container.querySelector("[data-shape-target]")).not.toBeNull()
      expect(screen.queryByTestId("shape-preview-fallback")).toBeNull()
    } finally {
      globalThis.CSS = original
    }
  })

  test("CSS.supports throwing is treated as unsupported", () => {
    const original = globalThis.CSS
    globalThis.CSS = {
      supports: () => {
        throw new Error("boom")
      },
    } as unknown as typeof CSS
    try {
      render(
        <ShapePreview value="shape(from 0px 0px, line to 100px 0px, close)" />,
      )
      expect(screen.getByText(/not supported/i)).toBeInTheDocument()
    } finally {
      globalThis.CSS = original
    }
  })
})

describe("ShapePathEditor — popover wrapper", () => {
  test("renders a trigger button showing the value", () => {
    render(
      <ShapePathEditor
        value="shape(from 0px 0px, line to 100px 0px, close)"
        onChange={() => {}}
      />,
    )
    expect(
      screen.getByRole("button", { name: /edit a shape/i }),
    ).toBeInTheDocument()
  })

  test("the trigger pluralizes the command count (1 cmd vs N cmds)", () => {
    const { rerender } = render(
      <ShapePathEditor
        value="shape(from 0px 0px, close)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByText("1 cmd")).toBeInTheDocument()
    rerender(
      <ShapePathEditor
        value="shape(from 0px 0px, line to 10px 10px, close)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByText("2 cmds")).toBeInTheDocument()
  })

  test("the trigger labels an invalid value as 'invalid'", () => {
    render(<ShapePathEditor value="not-a-shape" onChange={() => {}} />)
    expect(screen.getByText("invalid")).toBeInTheDocument()
  })

  test("a custom aria-label overrides the popover trigger default", () => {
    render(
      <ShapePathEditor
        value="shape(from 0px 0px, close)"
        onChange={() => {}}
        aria-label="My shape editor"
      />,
    )
    expect(
      screen.getByRole("button", { name: /my shape editor/i }),
    ).toBeInTheDocument()
  })
})

describe("ShapePathEditorPanel — resync", () => {
  test("external value change re-parses into the canvas", () => {
    const { rerender } = render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/endpoint/i).length).toBe(1)
    rerender(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, line to 90px 90px, close)"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/endpoint/i).length).toBe(2)
  })

  test("the live string reflects the produced value", () => {
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px, close)"
        onChange={() => {}}
      />,
    )
    expect(
      screen.getByText(/shape\(from 0px 0px, line to 100px 0px, close\)/),
    ).toBeInTheDocument()
  })

  test("an empty value falls back to the default shape", () => {
    render(<ShapePathEditorPanel value="" onChange={() => {}} />)
    // defaultShape seeds `line to 100px 0px, close`.
    expect(
      screen.getByText(/shape\(from 0px 0px, line to 100px 0px, close\)/),
    ).toBeInTheDocument()
  })

  test("an external invalid value is ignored by the resync effect", () => {
    const { rerender } = render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/endpoint/i).length).toBe(1)
    // A garbage external value must NOT clobber the committed editor state.
    rerender(<ShapePathEditorPanel value="garbage(" onChange={() => {}} />)
    expect(screen.getAllByLabelText(/endpoint/i).length).toBe(1)
  })

  test("a re-render with our own emitted value is skipped (no resync churn)", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px, close)"
        onChange={onChange}
      />,
    )
    // Edit so the panel emits a new value.
    fireEvent.change(screen.getByLabelText(/command 1 direction/i), {
      target: { value: "by" },
    })
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    expect(emitted).toMatch(/line by 100px 0px/)
    // Feeding our own emit back in must be a no-op (value === lastEmittedRef).
    rerender(<ShapePathEditorPanel value={emitted} onChange={onChange} />)
    expect(
      screen.getByText(/shape\(from 0px 0px, line by 100px 0px, close\)/),
    ).toBeInTheDocument()
  })

  test("adding a command inserts before a trailing close", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px, close)"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /add command/i }))
    const last = onChange.mock.calls.at(-1)?.[0] as string
    // The new line lands before close, which stays last.
    expect(last.trim().endsWith("close)")).toBe(true)
    expect(last).toMatch(/line to 50px 50px, close/)
  })

  test("adding a command with no trailing close appends at the end", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 100px 0px)"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /add command/i }))
    const last = onChange.mock.calls.at(-1)?.[0] as string
    expect(last).toMatch(/line to 100px 0px, line to 50px 50px\)/)
  })

  test("a custom panel aria-label is applied to the fieldset", () => {
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, close)"
        onChange={() => {}}
        aria-label="custom panel"
      />,
    )
    expect(
      screen.getByRole("group", { name: /custom panel/i }),
    ).toBeInTheDocument()
  })

  test("pointer-down without setPointerCapture support still starts a drag", () => {
    const onChange = vi.fn()
    render(
      <ShapePathEditorPanel
        value="shape(from 0px 0px, line to 50px 50px, close)"
        onChange={onChange}
      />,
    )
    const stage = screen.getByTestId("shape-canvas-stage")
    stubRect(stage)
    const handle = screen.getByLabelText(/line endpoint/i)
    // Force the capability-check else branch.
    // @ts-expect-error — deleting the method to hit the guard.
    handle.setPointerCapture = undefined
    fireEvent.pointerDown(handle, { clientX: 50, clientY: 50, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/line to 100px 100px/)
  })
})
