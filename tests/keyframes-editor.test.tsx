import { fireEvent, render, screen, within } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import {
  DeclarationRow,
  KeyframePreview,
  KeyframesEditor,
  KeyframesEditorPanel,
  KeyframeTimeline,
  LiveString,
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

  test("a filter declaration embeds the filter builder", () => {
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "filter", value: "blur(2px)" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText(/edit a css filter/i)).toBeInTheDocument()
  })

  test("an easing declaration embeds the easing picker", () => {
    render(
      <DeclarationRow
        index={0}
        declaration={{
          property: "animation-timing-function",
          value: "ease-in-out",
        }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText(/pick an easing/i)).toBeInTheDocument()
  })

  test("an opacity declaration uses a 0–1 unit input that commits on blur", () => {
    const onChange = vi.fn()
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "opacity", value: "0.5" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    const input = screen.getByLabelText(
      "declaration 1 value",
    ) as HTMLInputElement
    expect(input).toBeInTheDocument()
    // the opacity editor is a unitless UnitInput → editing + blur commits the
    // clamped 0–1 number back through onChange.
    fireEvent.change(input, { target: { value: "0.8" } })
    fireEvent.blur(input)
    // DeclarationRow rewraps the value half into a full Declaration.
    expect(onChange).toHaveBeenCalledWith({ property: "opacity", value: "0.8" })
  })

  test("a background declaration embeds the gradient editor", () => {
    // `background`/`background-image` are `plain` in the dispatch table but the
    // row routes them to the gradient editor (spec §3.2, A4).
    render(
      <DeclarationRow
        index={0}
        declaration={{
          property: "background",
          value: "linear-gradient(#000, #fff)",
        }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText(/edit gradient/i)).toBeInTheDocument()
  })

  test("a background-image declaration also embeds the gradient editor", () => {
    render(
      <DeclarationRow
        index={0}
        declaration={{
          property: "background-image",
          value: "radial-gradient(#000, #fff)",
        }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText(/edit gradient/i)).toBeInTheDocument()
  })

  test("a custom (non-menu) property renders a leading option for itself", () => {
    // `--my-var` is not in PROPERTY_OPTIONS → the select prepends an <option>
    // so the controlled value still matches a child.
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "--my-var", value: "1" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    const select = screen.getByLabelText(/declaration 1 property/i)
    expect((select as HTMLSelectElement).value).toBe("--my-var")
    expect(screen.getByRole("option", { name: "--my-var" })).toBeInTheDocument()
  })

  test("the index drives the displayed declaration number", () => {
    render(
      <DeclarationRow
        index={2}
        declaration={{ property: "opacity", value: "1" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    // index 2 → "declaration 3 …"
    expect(screen.getByLabelText("declaration 3 property")).toBeInTheDocument()
    expect(screen.getByLabelText("Remove declaration 3")).toBeInTheDocument()
  })

  test("editing a length value commits on blur via onChange", () => {
    const onChange = vi.fn()
    render(
      <DeclarationRow
        index={0}
        declaration={{ property: "width", value: "100px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    const input = screen.getByLabelText("declaration 1 value")
    // UnitInput buffers keystrokes and commits on blur with the unit re-applied.
    fireEvent.change(input, { target: { value: "120" } })
    fireEvent.blur(input)
    // the row preserves the property and re-applies the unit to the value.
    expect(onChange).toHaveBeenCalledWith({ property: "width", value: "120px" })
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

  test("removing a declaration emits a body with one fewer declaration", () => {
    const onChange = vi.fn()
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0; transform: scale(1) } to { opacity: 1 }"
        onChange={onChange}
      />,
    )
    // the from stop is selected → two declaration rows; remove the first.
    const decls = within(screen.getByTestId("keyframe-declarations"))
    fireEvent.click(decls.getByLabelText("Remove declaration 1"))
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    // the from block now carries a single declaration (no `;` separator).
    expect(emitted).toMatch(/from \{ [^;}]+\}/)
  })
})

describe("KeyframesEditorPanel — stop add/remove edge branches", () => {
  test("adding a stop picks the first free percent when 50% is taken", () => {
    const onChange = vi.fn()
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } 50% { opacity: 0.5 } to { opacity: 1 }"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Add stop"))
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    // 50% is used → the loop advances to the next free slot (55%).
    expect(emitted).toContain("55%")
  })

  test("removing the selected last stop reselects within bounds", () => {
    const onChange = vi.fn()
    render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } 50% { transform: scale(1) } to { opacity: 1 }"
        onChange={onChange}
      />,
    )
    // select the `to` stop (index 2), then remove it.
    fireEvent.click(screen.getByLabelText("stop at 100%"))
    fireEvent.click(screen.getByLabelText("remove stop at 100%"))
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    expect((emitted.match(/\{/g) ?? []).length).toBe(2)
    // selection clamped back into range → a valid stop's declarations show.
    expect(screen.getByTestId("keyframe-declarations")).toBeInTheDocument()
  })

  test("a single stop hides its remove control", () => {
    render(
      <KeyframesEditorPanel value="from { opacity: 0 }" onChange={() => {}} />,
    )
    // only one stop → the timeline renders no remove button.
    expect(screen.queryByLabelText(/^remove stop at/i)).toBeNull()
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

describe("KeyframePreview — interpolation branches", () => {
  const lenBlocks = [
    {
      selectors: ["from"],
      declarations: [{ property: "width", value: "0px" }],
    },
    {
      selectors: ["to"],
      declarations: [{ property: "width", value: "100px" }],
    },
  ]

  test("clamps to the first stop before the earliest declared percent", () => {
    render(<KeyframePreview blocks={lenBlocks} position={0} />)
    // at/below the first stop's percent → snaps to its value (no lerp).
    expect(screen.getByTestId("keyframe-preview-box").style.width).toBe("0px")
  })

  test("clamps to the last stop past the latest declared percent", () => {
    render(<KeyframePreview blocks={lenBlocks} position={100} />)
    expect(screen.getByTestId("keyframe-preview-box").style.width).toBe("100px")
  })

  test("linearly interpolates a length declaration mid-track", () => {
    render(<KeyframePreview blocks={lenBlocks} position={50} />)
    // halfway between 0px and 100px → 50px
    expect(screen.getByTestId("keyframe-preview-box").style.width).toBe("50px")
  })

  test("interpolates within the correct bracketing pair across 3 stops", () => {
    const blocks = [
      {
        selectors: ["from"],
        declarations: [{ property: "width", value: "0px" }],
      },
      {
        selectors: ["50%"],
        declarations: [{ property: "width", value: "10px" }],
      },
      {
        selectors: ["to"],
        declarations: [{ property: "width", value: "100px" }],
      },
    ]
    // position 75 lives in the SECOND pair (50→100), so the first iteration of
    // the bracketing loop must be skipped before the right pair is found.
    render(<KeyframePreview blocks={blocks} position={75} />)
    // halfway between 10px (50%) and 100px (100%) → 55px
    expect(screen.getByTestId("keyframe-preview-box").style.width).toBe("55px")
  })

  test("a non-numeric declaration snaps to the nearest stop", () => {
    const blocks = [
      {
        selectors: ["from"],
        declarations: [{ property: "transform", value: "translateX(0px)" }],
      },
      {
        selectors: ["to"],
        declarations: [{ property: "transform", value: "translateX(100px)" }],
      },
    ]
    const { rerender } = render(
      <KeyframePreview blocks={blocks} position={40} />,
    )
    const box = screen.getByTestId("keyframe-preview-box")
    // before the midpoint → snaps to the low (from) value.
    expect(box.style.transform).toBe("translateX(0px)")
    rerender(<KeyframePreview blocks={blocks} position={60} />)
    // past the midpoint → snaps to the high (to) value.
    expect(box.style.transform).toBe("translateX(100px)")
  })

  test("mismatched units between stops snap rather than interpolate", () => {
    const blocks = [
      {
        selectors: ["from"],
        declarations: [{ property: "width", value: "0px" }],
      },
      {
        selectors: ["to"],
        declarations: [{ property: "width", value: "50%" }],
      },
    ]
    const { rerender } = render(
      <KeyframePreview blocks={blocks} position={40} />,
    )
    const box = screen.getByTestId("keyframe-preview-box")
    // px vs % → splitUnit matches but units differ → lerpValue snaps to `a`.
    expect(box.style.width).toBe("0px")
    rerender(<KeyframePreview blocks={blocks} position={60} />)
    expect(box.style.width).toBe("50%")
  })

  test("a property declared in only one stop applies everywhere", () => {
    const blocks = [
      {
        selectors: ["from"],
        declarations: [{ property: "opacity", value: "0.25" }],
      },
      {
        selectors: ["to"],
        declarations: [{ property: "width", value: "10px" }],
      },
    ]
    // at 50% the opacity has a single point → clamps; width has a single point.
    render(<KeyframePreview blocks={blocks} position={50} />)
    const box = screen.getByTestId("keyframe-preview-box")
    expect(box.style.opacity).toBe("0.25")
    expect(box.style.width).toBe("10px")
  })

  test("empty blocks produce an empty style (no crash)", () => {
    render(<KeyframePreview blocks={[]} position={50} />)
    const box = screen.getByTestId("keyframe-preview-box")
    expect(box.style.opacity).toBe("")
    expect(box.getAttribute("style")).toBeFalsy()
  })

  test("a block with an empty selector list defaults to the from track", () => {
    // selectors[0] is undefined → `?? "from"` → percent 0. Exercises the
    // nullish-coalescing branch in sortByPercent / interpolatedStyle.
    const blocks = [
      { selectors: [], declarations: [{ property: "opacity", value: "0.5" }] },
    ]
    render(<KeyframePreview blocks={blocks} position={0} />)
    expect(screen.getByTestId("keyframe-preview-box").style.opacity).toBe("0.5")
  })

  test("the play toggle is disabled when no onPosition is wired (static)", () => {
    render(
      <KeyframePreview
        blocks={[
          {
            selectors: ["from"],
            declarations: [{ property: "opacity", value: "0" }],
          },
        ]}
        position={0}
      />,
    )
    expect(screen.getByLabelText(/play/i)).toBeDisabled()
  })
})

describe("KeyframePreview — play/pause auto-advance", () => {
  test("play advances the head via onPosition then pause stops it", () => {
    // Drive requestAnimationFrame deterministically: capture the callback and
    // step it with a controlled `performance.now`.
    let rafCb: FrameRequestCallback | null = null
    let nowMs = 1000
    const rafSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        rafCb = cb
        return 1 as unknown as number
      })
    const cancelSpy = vi
      .spyOn(globalThis, "cancelAnimationFrame")
      .mockImplementation(() => {})
    const nowSpy = vi.spyOn(performance, "now").mockImplementation(() => nowMs)

    const onPosition = vi.fn()
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
        onPosition={onPosition}
      />,
    )

    const toggle = screen.getByLabelText("Play")
    fireEvent.click(toggle)
    // the effect scheduled the first frame and the label flipped to pause.
    expect(rafSpy).toHaveBeenCalled()
    expect(screen.getByLabelText("Pause")).toBeInTheDocument()

    // advance the clock 1s and run one frame → head moves ~50%.
    nowMs += 1000
    ;(rafCb as FrameRequestCallback | null)?.(nowMs)
    expect(onPosition).toHaveBeenCalled()
    const advanced = onPosition.mock.calls.at(-1)?.[0] as number
    expect(advanced).toBeGreaterThan(0)
    expect(advanced).toBeLessThanOrEqual(100.0001)

    // pause → cleanup cancels the pending frame.
    fireEvent.click(screen.getByLabelText("Pause"))
    expect(cancelSpy).toHaveBeenCalled()
    expect(screen.getByLabelText("Play")).toBeInTheDocument()

    rafSpy.mockRestore()
    cancelSpy.mockRestore()
    nowSpy.mockRestore()
  })

  test("unmounting while playing cancels the pending frame", () => {
    let rafCb: FrameRequestCallback | null = null
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(
      (cb: FrameRequestCallback) => {
        rafCb = cb
        return 7 as unknown as number
      },
    )
    const cancelSpy = vi
      .spyOn(globalThis, "cancelAnimationFrame")
      .mockImplementation(() => {})
    vi.spyOn(performance, "now").mockImplementation(() => 0)

    const { unmount } = render(
      <KeyframePreview
        blocks={[
          {
            selectors: ["from"],
            declarations: [{ property: "opacity", value: "0" }],
          },
        ]}
        position={0}
        onPosition={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByLabelText("Play"))
    expect(rafCb).not.toBeNull()
    // tearing down while playing runs the effect cleanup → cancels frame 7.
    unmount()
    expect(cancelSpy).toHaveBeenCalledWith(7)
    vi.restoreAllMocks()
  })

  test("the position wraps with the 100.0001 modulo at the track end", () => {
    let rafCb: FrameRequestCallback | null = null
    let nowMs = 0
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(
      (cb: FrameRequestCallback) => {
        rafCb = cb
        return 1 as unknown as number
      },
    )
    vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {})
    vi.spyOn(performance, "now").mockImplementation(() => nowMs)

    const onPosition = vi.fn()
    render(
      <KeyframePreview
        blocks={[
          {
            selectors: ["from"],
            declarations: [{ property: "opacity", value: "0" }],
          },
        ]}
        // start near the end so a big dt wraps past 100.
        position={99}
        onPosition={onPosition}
      />,
    )
    fireEvent.click(screen.getByLabelText("Play"))
    // a 3s jump from 99 → 99 + 150 = 249 → mod 100.0001 wraps low.
    nowMs += 3000
    ;(rafCb as FrameRequestCallback | null)?.(nowMs)
    const next = onPosition.mock.calls.at(-1)?.[0] as number
    expect(next).toBeLessThan(99)
    vi.restoreAllMocks()
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

  test("an invalid value labels the trigger 'invalid'", () => {
    render(<KeyframesEditor value="not a keyframes body" onChange={() => {}} />)
    expect(screen.getByRole("button")).toHaveTextContent("invalid")
  })

  test("a single-stop value uses the singular 'stop' label", () => {
    render(<KeyframesEditor value="from { opacity: 0 }" onChange={() => {}} />)
    // 1 stop → singular "1 stop" (no plural s before the value text).
    expect(screen.getByRole("button")).toHaveTextContent(
      "1 stopfrom { opacity: 0 }",
    )
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

  test("feeding our own emitted value back does not reset selection (skip-own-emit)", () => {
    // Drive a controlled loop: the panel emits, the parent echoes the exact
    // emitted string back as `value`. The resync effect must short-circuit on
    // `value === lastEmittedRef.current` and keep local state.
    function Controlled() {
      const [v, setV] = useState("from { opacity: 0 } to { opacity: 1 }")
      return <KeyframesEditorPanel value={v} onChange={setV} />
    }
    render(<Controlled />)
    fireEvent.click(screen.getByLabelText(/add stop/i))
    // the echoed value carried the new stop through without a reparse reset.
    expect(screen.getAllByLabelText(/^stop at /i)).toHaveLength(3)
  })

  test("an invalid external value is ignored (last good blocks kept)", () => {
    const { rerender } = render(
      <KeyframesEditorPanel
        value="from { opacity: 0 } to { opacity: 1 }"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^stop at /i)).toHaveLength(2)
    // an unparseable value → the resync effect leaves the blocks untouched.
    rerender(
      <KeyframesEditorPanel value="totally broken" onChange={() => {}} />,
    )
    expect(screen.getAllByLabelText(/^stop at /i)).toHaveLength(2)
  })

  test("an initially-invalid value renders an empty editor", () => {
    render(
      <KeyframesEditorPanel value="not valid at all" onChange={() => {}} />,
    )
    // no stops parsed → the add-declaration control is disabled and the
    // generic 'declarations' label shows (no selected block).
    expect(screen.queryByLabelText(/^stop at /i)).toBeNull()
    expect(screen.getByLabelText(/add declaration/i)).toBeDisabled()
    expect(
      within(screen.getByTestId("keyframe-declarations")).getByText(
        "declarations",
      ),
    ).toBeInTheDocument()
  })

  test("an empty value seeds the default from/to keyframes", () => {
    render(<KeyframesEditorPanel value="" onChange={() => {}} />)
    // empty initial value → defaultKeyframes() seed → two stops.
    expect(screen.getAllByLabelText(/^stop at /i)).toHaveLength(2)
  })
})

// ===========================================================================
// LiveString — the produced-body <code> mirror
// ===========================================================================

describe("LiveString", () => {
  test("renders the produced body string", () => {
    render(<LiveString value="from { opacity: 0 }" />)
    expect(screen.getByText("from { opacity: 0 }")).toBeInTheDocument()
  })

  test("an empty value renders a non-breaking placeholder (no crash)", () => {
    const { container } = render(<LiveString value="" />)
    // `value || " "` → a single space keeps the <code> box from collapsing.
    const code = container.querySelector("code")
    expect(code).not.toBeNull()
    expect(code?.textContent).toBe(" ")
  })
})

// ===========================================================================
// KeyframeTimeline (direct) — marker fallback + raw callbacks
// ===========================================================================

describe("KeyframeTimeline (direct)", () => {
  const blocks = [
    {
      selectors: ["from"],
      declarations: [{ property: "opacity", value: "0" }],
    },
    {
      selectors: ["50%"],
      declarations: [{ property: "opacity", value: "0.5" }],
    },
  ]

  test("a block with an empty selector list labels its marker as 0% (from fallback)", () => {
    // selectors[0] is undefined → `?? "from"` → percent 0 (line-19 branch).
    render(
      <KeyframeTimeline
        blocks={[{ selectors: [], declarations: [] }, ...blocks]}
        selected={0}
        position={0}
        onSelect={() => {}}
        onPosition={() => {}}
        onAddStop={() => {}}
        onRemoveStop={() => {}}
      />,
    )
    // both the empty-selector block and the `from` block render at 0%.
    expect(screen.getAllByLabelText("stop at 0%")).toHaveLength(2)
  })

  test("clicking a marker raises onSelect with its index", () => {
    const onSelect = vi.fn()
    render(
      <KeyframeTimeline
        blocks={blocks}
        selected={0}
        position={0}
        onSelect={onSelect}
        onPosition={() => {}}
        onAddStop={() => {}}
        onRemoveStop={() => {}}
      />,
    )
    fireEvent.click(screen.getByLabelText("stop at 50%"))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  test("the selected marker is aria-pressed", () => {
    render(
      <KeyframeTimeline
        blocks={blocks}
        selected={1}
        position={0}
        onSelect={() => {}}
        onPosition={() => {}}
        onAddStop={() => {}}
        onRemoveStop={() => {}}
      />,
    )
    expect(screen.getByLabelText("stop at 50%")).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByLabelText("stop at 0%")).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })

  test("the slider raises onPosition with the numeric value", () => {
    const onPosition = vi.fn()
    render(
      <KeyframeTimeline
        blocks={blocks}
        selected={0}
        position={0}
        onSelect={() => {}}
        onPosition={onPosition}
        onAddStop={() => {}}
        onRemoveStop={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText(/play head/i), {
      target: { value: "42" },
    })
    expect(onPosition).toHaveBeenCalledWith(42)
  })

  test("add + remove controls raise their callbacks", () => {
    const onAddStop = vi.fn()
    const onRemoveStop = vi.fn()
    render(
      <KeyframeTimeline
        blocks={blocks}
        selected={0}
        position={0}
        onSelect={() => {}}
        onPosition={() => {}}
        onAddStop={onAddStop}
        onRemoveStop={onRemoveStop}
      />,
    )
    fireEvent.click(screen.getByLabelText("Add stop"))
    expect(onAddStop).toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText("remove stop at 50%"))
    expect(onRemoveStop).toHaveBeenCalledWith(1)
  })
})
