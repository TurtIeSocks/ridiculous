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
})
