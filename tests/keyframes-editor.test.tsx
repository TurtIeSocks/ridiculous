import { fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import {
  DeclarationRow,
  KeyframePreview,
  KeyframesEditor,
  KeyframesEditorPanel,
} from "@/components/ui/keyframes-editor/keyframes-editor"
import { cssKeyframes } from "@/components/ui/keyframes-editor/keyframes-editor.types"

// jsdom ships no CSS.supports — install/remove a stub per test so the preview
// can be exercised in both the supported and degraded paths.
function setSupports(impl: ((value: string) => boolean) | null) {
  if (impl === null) {
    // biome-ignore lint/suspicious/noExplicitAny: deleting the global stub
    ;(globalThis as any).CSS = undefined
    return
  }
  Object.defineProperty(globalThis, "CSS", {
    writable: true,
    configurable: true,
    value: { supports: vi.fn(impl) },
  })
}

beforeEach(() => {
  setSupports(null)
})
afterEach(() => {
  setSupports(null)
})

test("cssKeyframes returns its argument unchanged at runtime", () => {
  expect(cssKeyframes("from { opacity: 0 } to { opacity: 1 }")).toBe(
    "from { opacity: 0 } to { opacity: 1 }",
  )
})

// ===========================================================================
// KeyframeTimeline — the 0–100% track + stop markers
// ===========================================================================

describe("KeyframeTimeline", () => {
  test("renders one stop marker per keyframe block", () => {
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } 50% { opacity: 0.5 } to { opacity: 1 }"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^stop at /i)).toHaveLength(3)
  })

  test("renders a labelled play head slider", () => {
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } to { opacity: 1 }"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/play head/i)).toBeInTheDocument()
  })

  test("adding a stop emits a body string with an extra block", () => {
    const onChange = vi.fn()
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } to { opacity: 1 }"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/add stop/i))
    expect(onChange).toHaveBeenCalled()
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    // three blocks now → three `{`.
    expect((emitted.match(/\{/g) ?? []).length).toBe(3)
  })

  test("removing a stop emits a body string with one fewer block", () => {
    const onChange = vi.fn()
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } 50% { opacity: 0.5 } to { opacity: 1 }"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("remove stop at 50%"))
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    expect((emitted.match(/\{/g) ?? []).length).toBe(2)
  })
})

// ===========================================================================
// Selecting a stop → its declarations
// ===========================================================================

describe("stop selection", () => {
  test("the selected stop's declarations are revealed", () => {
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } to { transform: translateX(100px) }"
        onChange={() => {}}
      />,
    )
    // first stop selected by default → its opacity declaration is editable.
    expect(screen.getByDisplayValue("opacity")).toBeInTheDocument()
    // select the `to` stop → its transform declaration appears.
    fireEvent.click(screen.getByLabelText("stop at 100%"))
    expect(screen.getByDisplayValue("transform")).toBeInTheDocument()
  })
})

// ===========================================================================
// DeclarationRow — embedded editors by propertyEditorKind
// ===========================================================================

describe("DeclarationRow", () => {
  test("a transform declaration embeds the transform builder", () => {
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "transform", value: "translateX(0px)" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    // The embedded TransformBuilder renders a popover trigger with this label.
    expect(screen.getByLabelText(/edit a css transform/i)).toBeInTheDocument()
  })

  test("a color declaration embeds the color picker", () => {
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "color", value: "#ff0000" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText(/pick a color/i)).toBeInTheDocument()
  })

  test("a length declaration embeds a unit input", () => {
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "width", value: "100px" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    // UnitInput shows the numeric part (100) with the unit (px) alongside.
    const input = screen.getByLabelText("declaration 1 value")
    expect(input).toBeInTheDocument()
    expect((input as HTMLInputElement).value).toBe("100")
  })

  test("a plain declaration uses a plain value input", () => {
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "visibility", value: "hidden" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByDisplayValue("hidden")).toBeInTheDocument()
  })

  test("changing the property select dispatches a new declaration", () => {
    const onChange = vi.fn()
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "opacity", value: "0" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByDisplayValue("opacity"), {
      target: { value: "transform" },
    })
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls.at(-1)?.[0].property).toBe("transform")
  })

  test("the remove button fires onRemove", () => {
    const onRemove = vi.fn()
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "opacity", value: "0" }}
        onChange={() => {}}
        onRemove={onRemove}
      />,
    )
    fireEvent.click(screen.getByLabelText(/remove declaration/i))
    expect(onRemove).toHaveBeenCalled()
  })
})

describe("adding a declaration", () => {
  test("adding a declaration to the selected stop emits a longer body", () => {
    const onChange = vi.fn()
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } to { opacity: 1 }"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/add declaration/i))
    expect(onChange).toHaveBeenCalled()
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    // the `from` block now carries two declarations.
    expect(emitted).toMatch(/from \{[^}]*;[^}]*\}/)
  })
})

// ===========================================================================
// KeyframePreview — the JS-interpolated scrubbed preview
// ===========================================================================

describe("KeyframePreview", () => {
  test("renders a preview box and a play/pause toggle", () => {
    render(
      <KeyframePreview
        blocks={[
          {
            selectors: ["from"],
            declarations: [{ property: "opacity", value: "0" }],
          },
          {
            selectors: ["to"],
            declarations: [{ property: "opacity", value: "1" }],
          },
        ]}
        position={0}
      />,
    )
    expect(screen.getByLabelText(/play|pause/i)).toBeInTheDocument()
    expect(screen.getByTestId("keyframe-preview-box")).toBeInTheDocument()
  })

  test("interpolates opacity between adjacent stops as the play head scrubs", () => {
    const { rerender } = render(
      <KeyframePreview
        blocks={[
          {
            selectors: ["from"],
            declarations: [{ property: "opacity", value: "0" }],
          },
          {
            selectors: ["to"],
            declarations: [{ property: "opacity", value: "1" }],
          },
        ]}
        position={0}
      />,
    )
    const box = screen.getByTestId("keyframe-preview-box")
    expect(box.style.opacity).toBe("0")
    rerender(
      <KeyframePreview
        blocks={[
          {
            selectors: ["from"],
            declarations: [{ property: "opacity", value: "0" }],
          },
          {
            selectors: ["to"],
            declarations: [{ property: "opacity", value: "1" }],
          },
        ]}
        position={50}
      />,
    )
    // halfway → opacity 0.5
    expect(Number.parseFloat(box.style.opacity)).toBeCloseTo(0.5, 2)
  })
})

describe("the play head scrubs the preview", () => {
  test("moving the play head slider updates the preview box style", () => {
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } to { opacity: 1 }"
        onChange={() => {}}
      />,
    )
    const slider = screen.getByLabelText(/play head/i)
    const box = screen.getByTestId("keyframe-preview-box")
    fireEvent.change(slider, { target: { value: "50" } })
    expect(Number.parseFloat(box.style.opacity)).toBeCloseTo(0.5, 2)
  })
})

// ===========================================================================
// KeyframesEditor — the popover wrapper
// ===========================================================================

describe("KeyframesEditor (popover)", () => {
  test("the trigger summarizes the stop count", () => {
    render(
      <KeyframesEditor
        value="from { opacity: 0 } 50% { opacity: 0.5 } to { opacity: 1 }"
        onChange={() => {}}
      />,
    )
    // 3 stops → trigger mentions "3".
    expect(screen.getByRole("button")).toHaveTextContent("3")
  })

  test("the trigger shows the value", () => {
    render(
      <KeyframesEditor
        value="from { opacity: 0 } to { opacity: 1 }"
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole("button")).toHaveTextContent(/opacity/)
  })
})

// ===========================================================================
// controlled resync
// ===========================================================================

describe("controlled value", () => {
  test("an external value change re-renders the timeline", () => {
    const { rerender } = render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } to { opacity: 1 }"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^stop at /i)).toHaveLength(2)
    rerender(
      <KeyframesEditorPanel
        value="from { opacity: 0 } 33% { opacity: 0.3 } 66% { opacity: 0.6 } to { opacity: 1 }"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^stop at /i)).toHaveLength(4)
  })

  test("editing a declaration value emits via onChange", () => {
    const onChange = vi.fn()
    render(
      <KeyframesEditorPanel
        value="from { visibility: visible } to { visibility: hidden }"
        onChange={onChange}
      />,
    )
    const input = within(
      screen.getByTestId("keyframe-declarations"),
    ).getByDisplayValue("visible")
    fireEvent.change(input, { target: { value: "collapse" } })
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls.at(-1)?.[0]).toContain("collapse")
  })
})
