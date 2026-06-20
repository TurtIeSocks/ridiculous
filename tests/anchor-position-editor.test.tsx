import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import {
  AnchorExprFields,
  AnchorPositionEditor,
  AnchorPositionEditorPanel,
  AnchorPreview,
  LiveString,
  MiniSelect,
  PositionAreaGrid,
  TryFallbackChain,
} from "@/components/ui/anchor-position-editor/anchor-position-editor"
import {
  cssAnchor,
  cssPositionArea,
  cssPositionTry,
} from "@/components/ui/anchor-position-editor/anchor-position-editor.types"

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

test("cssPositionArea returns its argument unchanged at runtime", () => {
  expect(cssPositionArea("top left")).toBe("top left")
})

test("cssAnchor returns its argument unchanged at runtime", () => {
  expect(cssAnchor("anchor(--btn bottom)")).toBe("anchor(--btn bottom)")
})

test("cssPositionTry returns its argument unchanged at runtime", () => {
  expect(cssPositionTry("flip-block, none")).toBe("flip-block, none")
})

describe("LiveString", () => {
  test("renders the value when present", () => {
    render(<LiveString value="anchor(--btn top)" />)
    expect(screen.getByText("anchor(--btn top)")).toBeInTheDocument()
  })

  test("renders a non-breaking blank for an empty value", () => {
    const { container } = render(<LiveString value="" />)
    const code = container.querySelector("code")
    expect(code).not.toBeNull()
    // the `value || " "` fallback keeps a single-space placeholder
    expect(code?.textContent).toBe(" ")
  })
})

// ===========================================================================
// AnchorPositionEditorPanel — position-area mode (the hero)
// ===========================================================================

describe("AnchorPositionEditorPanel (position-area)", () => {
  test("renders a 3×3 grid of cell buttons", () => {
    render(<AnchorPositionEditorPanel value="center" onChange={() => {}} />)
    expect(screen.getAllByLabelText(/^place at /i)).toHaveLength(9)
  })

  test("clicking a corner cell emits the physical keyword pair", () => {
    const onChange = vi.fn()
    render(<AnchorPositionEditorPanel value="center" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("place at top left"))
    expect(onChange).toHaveBeenLastCalledWith("top left")
  })

  test("clicking the center cell emits the single keyword center", () => {
    const onChange = vi.fn()
    render(<AnchorPositionEditorPanel value="top left" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("place at center center"))
    expect(onChange).toHaveBeenLastCalledWith("center")
  })

  test("the logical toggle swaps the emitted vocabulary to block/inline", () => {
    const onChange = vi.fn()
    render(<AnchorPositionEditorPanel value="center" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/logical/i))
    fireEvent.click(screen.getByLabelText("place at top left"))
    expect(onChange).toHaveBeenLastCalledWith("block-start inline-start")
  })

  test("the span toggle switches the emitted keyword to its span- form", () => {
    const onChange = vi.fn()
    render(<AnchorPositionEditorPanel value="center" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/span/i))
    fireEvent.click(screen.getByLabelText("place at top left"))
    expect(onChange).toHaveBeenLastCalledWith("span-top span-left")
  })

  test("the selected cell is marked aria-pressed", () => {
    render(<AnchorPositionEditorPanel value="top left" onChange={() => {}} />)
    const cell = screen.getByLabelText("place at top left")
    expect(cell).toHaveAttribute("aria-pressed", "true")
    const other = screen.getByLabelText("place at bottom right")
    expect(other).toHaveAttribute("aria-pressed", "false")
  })

  test("the live string shows the produced value", () => {
    render(<AnchorPositionEditorPanel value="top left" onChange={() => {}} />)
    expect(screen.getByText("top left")).toBeInTheDocument()
  })
})

// ===========================================================================
// AnchorPositionEditorPanel — anchor mode
// ===========================================================================

describe("AnchorPositionEditorPanel (anchor)", () => {
  test("renders the function select, not the grid", () => {
    render(
      <AnchorPositionEditorPanel
        mode="anchor"
        value="anchor(--btn bottom)"
        onChange={() => {}}
      />,
    )
    expect(screen.queryByLabelText(/^place at /i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/anchor function/i)).toBeInTheDocument()
  })

  test("editing the side emits an updated anchor() string", () => {
    const onChange = vi.fn()
    render(
      <AnchorPositionEditorPanel
        mode="anchor"
        value="anchor(--btn bottom)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/anchor side/i), {
      target: { value: "top" },
    })
    expect(onChange).toHaveBeenLastCalledWith("anchor(--btn top)")
  })

  test("switching to anchor-size offers size keywords", () => {
    const onChange = vi.fn()
    render(
      <AnchorPositionEditorPanel
        mode="anchor"
        value="anchor(--btn bottom)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/anchor function/i), {
      target: { value: "anchor-size" },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringContaining("anchor-size("),
    )
  })
})

// ===========================================================================
// AnchorPositionEditorPanel — position-try mode
// ===========================================================================

describe("AnchorPositionEditorPanel (position-try)", () => {
  test("renders one chip per fallback", () => {
    render(
      <AnchorPositionEditorPanel
        mode="position-try"
        value="--a flip-block, none"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^fallback /i)).toHaveLength(2)
  })

  test("the add button appends a fallback", () => {
    const onChange = vi.fn()
    render(
      <AnchorPositionEditorPanel
        mode="position-try"
        value="flip-block"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/add a fallback/i))
    expect(onChange).toHaveBeenCalled()
    // an added fallback widens the chain — the comma list grows
    expect(onChange.mock.calls.at(-1)?.[0]).toMatch(/,/)
  })

  test("removing a fallback drops it", () => {
    const onChange = vi.fn()
    render(
      <AnchorPositionEditorPanel
        mode="position-try"
        value="flip-block, none"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Remove fallback 2"))
    expect(onChange).toHaveBeenLastCalledWith("flip-block")
  })

  test("moving a fallback down reorders the chain", () => {
    const onChange = vi.fn()
    render(
      <AnchorPositionEditorPanel
        mode="position-try"
        value="flip-block, none"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Move fallback 1 down"))
    expect(onChange).toHaveBeenLastCalledWith("none, flip-block")
  })
})

// ===========================================================================
// AnchorPositionEditorPanel — resync + mode switch
// ===========================================================================

describe("AnchorPositionEditorPanel resync", () => {
  test("an external value change re-syncs the grid selection", () => {
    const { rerender } = render(
      <AnchorPositionEditorPanel value="top left" onChange={() => {}} />,
    )
    expect(screen.getByLabelText("place at top left")).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    rerender(
      <AnchorPositionEditorPanel value="bottom right" onChange={() => {}} />,
    )
    expect(screen.getByLabelText("place at bottom right")).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })

  test("switching mode re-renders the matching editor", () => {
    const { rerender } = render(
      <AnchorPositionEditorPanel value="center" onChange={() => {}} />,
    )
    expect(screen.getByLabelText("place at top left")).toBeInTheDocument()
    rerender(
      <AnchorPositionEditorPanel
        mode="anchor"
        value="anchor(--btn bottom)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/anchor function/i)).toBeInTheDocument()
  })

  test("an external anchor value re-syncs the side select", () => {
    const { rerender } = render(
      <AnchorPositionEditorPanel
        mode="anchor"
        value="anchor(--btn bottom)"
        onChange={() => {}}
      />,
    )
    const side = screen.getByLabelText(/anchor side/i) as HTMLSelectElement
    expect(side.value).toBe("bottom")
    rerender(
      <AnchorPositionEditorPanel
        mode="anchor"
        value="anchor(--btn top)"
        onChange={() => {}}
      />,
    )
    expect(
      (screen.getByLabelText(/anchor side/i) as HTMLSelectElement).value,
    ).toBe("top")
  })

  test("an unparseable external anchor value keeps the prior expression", () => {
    const { rerender } = render(
      <AnchorPositionEditorPanel
        mode="anchor"
        value="anchor(--btn bottom)"
        onChange={() => {}}
      />,
    )
    // a non-anchor string can't be parsed — the `if (parsed)` guard skips the
    // resync and the editor keeps showing the previous side.
    rerender(
      <AnchorPositionEditorPanel
        mode="anchor"
        value="not-a-function"
        onChange={() => {}}
      />,
    )
    expect(
      (screen.getByLabelText(/anchor side/i) as HTMLSelectElement).value,
    ).toBe("bottom")
  })

  test("an external position-try value re-syncs the chips", () => {
    const { rerender } = render(
      <AnchorPositionEditorPanel
        mode="position-try"
        value="flip-block"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^fallback /i)).toHaveLength(1)
    rerender(
      <AnchorPositionEditorPanel
        mode="position-try"
        value="flip-block, none, top left"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^fallback /i)).toHaveLength(3)
  })

  test("a self-emitted value does not trigger a redundant resync", () => {
    const onChange = vi.fn()
    render(<AnchorPositionEditorPanel value="center" onChange={onChange} />)
    // clicking emits; the editor records lastEmittedRef so an echoed value
    // would be ignored by the resync effect (no throw, selection holds)
    fireEvent.click(screen.getByLabelText("place at top left"))
    expect(onChange).toHaveBeenLastCalledWith("top left")
    expect(screen.getByLabelText("place at top left")).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })
})

// ===========================================================================
// PositionAreaGrid (public sub-component)
// ===========================================================================

describe("PositionAreaGrid", () => {
  test("emits the keyword pair on cell click", () => {
    const onChange = vi.fn()
    render(
      <PositionAreaGrid
        system="physical"
        span={false}
        row={1}
        col={1}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("place at bottom right"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ row: 2, col: 2 }),
    )
  })

  test("renders the logical checkbox checked and the live string in block/inline", () => {
    render(
      <PositionAreaGrid
        system="logical"
        span={false}
        row={2}
        col={2}
        onChange={() => {}}
      />,
    )
    const logical = screen.getByLabelText(
      /use the logical .* coordinate system/i,
    ) as HTMLInputElement
    expect(logical.checked).toBe(true)
    // bottom-right in logical = block-end inline-end (exercises toLogical's
    // `bottom` and `right` cases). jsdom has no CSS support so the embedded
    // preview degrades to a static diagram whose accessible name carries the
    // live value.
    expect(screen.getByRole("img")).toHaveAccessibleName(/block-end inline-end/)
  })

  test("the span checkbox renders checked and emits span- reach keywords", () => {
    render(
      <PositionAreaGrid
        system="physical"
        span={true}
        row={2}
        col={2}
        onChange={() => {}}
      />,
    )
    const spanBox = screen.getByLabelText(
      /span the chosen edges/i,
    ) as HTMLInputElement
    expect(spanBox.checked).toBe(true)
    expect(screen.getByRole("img")).toHaveAccessibleName(
      /span-bottom span-right/,
    )
  })

  test("toggling the logical checkbox on emits a logical system", () => {
    const onChange = vi.fn()
    render(
      <PositionAreaGrid
        system="physical"
        span={false}
        row={0}
        col={0}
        onChange={onChange}
      />,
    )
    fireEvent.click(
      screen.getByLabelText(/use the logical .* coordinate system/i),
    )
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ system: "logical" }),
    )
  })

  test("toggling the logical checkbox off returns to the physical system", () => {
    const onChange = vi.fn()
    render(
      <PositionAreaGrid
        system="logical"
        span={false}
        row={0}
        col={0}
        onChange={onChange}
      />,
    )
    fireEvent.click(
      screen.getByLabelText(/use the logical .* coordinate system/i),
    )
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ system: "physical" }),
    )
  })

  test("toggling the span checkbox emits an updated span flag", () => {
    const onChange = vi.fn()
    render(
      <PositionAreaGrid
        system="physical"
        span={false}
        row={0}
        col={0}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/span the chosen edges/i))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ span: true }),
    )
  })

  test("logical + span together compose both transforms", () => {
    render(
      <PositionAreaGrid
        system="logical"
        span={true}
        row={0}
        col={0}
        onChange={() => {}}
      />,
    )
    // top-left → block-start/inline-start → span-prefixed
    expect(screen.getByRole("img")).toHaveAccessibleName(
      /span-block-start span-inline-start/,
    )
  })

  test("the center cell stays neutral under logical + span", () => {
    render(
      <PositionAreaGrid
        system="logical"
        span={true}
        row={1}
        col={1}
        onChange={() => {}}
      />,
    )
    // center collapses to a single `center` — neither toLogical nor toSpan
    // rewrites the neutral keyword
    expect(screen.getByRole("img")).toHaveAccessibleName(/box at center /)
  })
})

// ===========================================================================
// AnchorExprFields (public sub-component)
// ===========================================================================

describe("AnchorExprFields", () => {
  test("editing the name emits an updated expression", () => {
    const onChange = vi.fn()
    render(
      <AnchorExprFields
        expr={{ fn: "anchor", name: "--btn", side: "bottom" }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/anchor name/i), {
      target: { value: "--tip" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: "--tip" }),
    )
  })

  test("clearing the name emits `name: undefined`", () => {
    const onChange = vi.fn()
    render(
      <AnchorExprFields
        expr={{ fn: "anchor", name: "--btn", side: "bottom" }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/anchor name/i), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: undefined }),
    )
  })

  test("checking the fallback checkbox seeds a `0px` fallback", () => {
    const onChange = vi.fn()
    render(
      <AnchorExprFields
        expr={{ fn: "anchor", name: "--btn", side: "bottom" }}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/add a fallback length/i))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fallback: "0px" }),
    )
  })

  test("unchecking the fallback checkbox clears the fallback", () => {
    const onChange = vi.fn()
    render(
      <AnchorExprFields
        expr={{ fn: "anchor", name: "--btn", side: "bottom", fallback: "8px" }}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/add a fallback length/i))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fallback: undefined }),
    )
  })

  test("the fallback length input shows when a fallback is present and edits it", () => {
    const onChange = vi.fn()
    render(
      <AnchorExprFields
        expr={{ fn: "anchor", name: "--btn", side: "bottom", fallback: "8px" }}
        onChange={onChange}
      />,
    )
    const fallback = screen.getByLabelText("fallback length")
    expect(fallback).toBeInTheDocument()
    // UnitInput holds a draft on change and commits on blur/Enter.
    fireEvent.change(fallback, { target: { value: "12" } })
    fireEvent.blur(fallback)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fallback: expect.stringContaining("12") }),
    )
  })

  test("switching the function to anchor-size snaps an incompatible side to the first size", () => {
    const onChange = vi.fn()
    render(
      <AnchorExprFields
        expr={{ fn: "anchor", name: "--btn", side: "bottom" }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/anchor function/i), {
      target: { value: "anchor-size" },
    })
    const next = onChange.mock.calls.at(-1)?.[0]
    expect(next.fn).toBe("anchor-size")
    // "bottom" is not a valid anchor-size dimension — it snaps to a size keyword
    expect([
      "width",
      "height",
      "block",
      "inline",
      "self-block",
      "self-inline",
    ]).toContain(next.side)
  })

  test("switching the function keeps a side that is valid in both vocabularies", () => {
    const onChange = vi.fn()
    render(
      <AnchorExprFields
        expr={{ fn: "anchor-size", name: "--btn", side: "width" }}
        onChange={onChange}
      />,
    )
    // anchor-size labels the dimension select "anchor size"
    expect(screen.getByLabelText(/anchor size/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/anchor function/i), {
      target: { value: "anchor" },
    })
    const next = onChange.mock.calls.at(-1)?.[0]
    expect(next.fn).toBe("anchor")
  })

  test("an out-of-vocabulary side falls back to the first option in the select", () => {
    render(
      <AnchorExprFields
        expr={{ fn: "anchor", name: "--btn", side: "not-a-side" }}
        onChange={() => {}}
      />,
    )
    const sideSelect = screen.getByLabelText(
      /anchor side/i,
    ) as HTMLSelectElement
    expect(sideSelect.value).not.toBe("not-a-side")
  })
})

// ===========================================================================
// TryFallbackChain (public sub-component)
// ===========================================================================

describe("TryFallbackChain", () => {
  test("renders a chip per fallback and an add control", () => {
    render(
      <TryFallbackChain fallbacks={[{ kind: "none" }]} onChange={() => {}} />,
    )
    expect(screen.getAllByLabelText(/^fallback /i)).toHaveLength(1)
    expect(screen.getByLabelText(/add a fallback/i)).toBeInTheDocument()
  })

  test("a `none` chip renders the literal none body and no inputs", () => {
    render(
      <TryFallbackChain fallbacks={[{ kind: "none" }]} onChange={() => {}} />,
    )
    const chip = screen.getByLabelText("fallback 1")
    expect(chip.textContent).toMatch(/none/)
    expect(
      screen.queryByLabelText(/position-area for fallback/i),
    ).not.toBeInTheDocument()
  })

  test("the add button appends a default tactics fallback", () => {
    const onChange = vi.fn()
    render(<TryFallbackChain fallbacks={[]} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/add a fallback/i))
    expect(onChange).toHaveBeenCalledWith([
      { kind: "tactics", idents: [], tactics: ["flip-block"] },
    ])
  })

  test("an `area` chip exposes a position-area input and edits it", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[{ kind: "area", area: "top" }]}
        onChange={onChange}
      />,
    )
    const input = screen.getByLabelText(/position-area for fallback 1/i)
    fireEvent.change(input, { target: { value: "bottom right" } })
    expect(onChange).toHaveBeenCalledWith([
      { kind: "area", area: "bottom right" },
    ])
  })

  test("a `tactics` chip edits its dashed-ident", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[{ kind: "tactics", idents: [], tactics: ["flip-block"] }]}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/dashed-ident for fallback 1/i), {
      target: { value: "--alt" },
    })
    expect(onChange).toHaveBeenCalledWith([
      { kind: "tactics", idents: ["--alt"], tactics: ["flip-block"] },
    ])
  })

  test("clearing the dashed-ident empties the idents list", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[
          { kind: "tactics", idents: ["--alt"], tactics: ["flip-block"] },
        ]}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/dashed-ident for fallback 1/i), {
      target: { value: "   " },
    })
    expect(onChange).toHaveBeenCalledWith([
      { kind: "tactics", idents: [], tactics: ["flip-block"] },
    ])
  })

  test("editing the tactic select updates the tactic", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[{ kind: "tactics", idents: [], tactics: ["flip-block"] }]}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/tactic for fallback 1/i), {
      target: { value: "flip-inline" },
    })
    expect(onChange).toHaveBeenCalledWith([
      { kind: "tactics", idents: [], tactics: ["flip-inline"] },
    ])
  })

  test("choosing the (no tactic) option empties the tactics list", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[{ kind: "tactics", idents: [], tactics: ["flip-block"] }]}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/tactic for fallback 1/i), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith([
      { kind: "tactics", idents: [], tactics: [] },
    ])
  })

  test("changing the kind to `area` re-seeds the body with a default area", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain fallbacks={[{ kind: "none" }]} onChange={onChange} />,
    )
    fireEvent.change(screen.getByLabelText(/kind of fallback 1/i), {
      target: { value: "area" },
    })
    expect(onChange).toHaveBeenCalledWith([{ kind: "area", area: "top" }])
  })

  test("changing the kind to `none` collapses the body", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[{ kind: "area", area: "top left" }]}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/kind of fallback 1/i), {
      target: { value: "none" },
    })
    expect(onChange).toHaveBeenCalledWith([{ kind: "none" }])
  })

  test("changing the kind to `tactics` re-seeds idents + tactics defaults", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain fallbacks={[{ kind: "none" }]} onChange={onChange} />,
    )
    fireEvent.change(screen.getByLabelText(/kind of fallback 1/i), {
      target: { value: "tactics" },
    })
    expect(onChange).toHaveBeenCalledWith([
      { kind: "tactics", idents: [], tactics: ["flip-block"] },
    ])
  })

  test("the move-up button on the first chip is disabled and is a no-op", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[{ kind: "none" }, { kind: "area", area: "top" }]}
        onChange={onChange}
      />,
    )
    const up = screen.getByLabelText("Move fallback 1 up")
    expect(up).toBeDisabled()
    fireEvent.click(up)
    expect(onChange).not.toHaveBeenCalled()
  })

  test("the move-down button on the last chip is disabled and is a no-op", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[{ kind: "none" }, { kind: "area", area: "top" }]}
        onChange={onChange}
      />,
    )
    const down = screen.getByLabelText("Move fallback 2 down")
    expect(down).toBeDisabled()
    fireEvent.click(down)
    expect(onChange).not.toHaveBeenCalled()
  })

  test("moving the second chip up reorders the chain", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[{ kind: "none" }, { kind: "area", area: "top" }]}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Move fallback 2 up"))
    expect(onChange).toHaveBeenCalledWith([
      { kind: "area", area: "top" },
      { kind: "none" },
    ])
  })

  test("removing a chip drops it from the chain", () => {
    const onChange = vi.fn()
    render(
      <TryFallbackChain
        fallbacks={[{ kind: "none" }, { kind: "area", area: "top" }]}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Remove fallback 1"))
    expect(onChange).toHaveBeenCalledWith([{ kind: "area", area: "top" }])
  })

  test("an empty chain shows a blank live string placeholder", () => {
    render(<TryFallbackChain fallbacks={[]} onChange={() => {}} />)
    // no chips, but the add control + live <code> still render
    expect(screen.queryAllByLabelText(/^fallback /i)).toHaveLength(0)
  })
})

// ===========================================================================
// MiniSelect (local copy)
// ===========================================================================

describe("MiniSelect", () => {
  test("emits the chosen value", () => {
    const onValueChange = vi.fn()
    render(
      <MiniSelect aria-label="pick" value="a" onValueChange={onValueChange}>
        <option value="a">a</option>
        <option value="b">b</option>
      </MiniSelect>,
    )
    fireEvent.change(screen.getByLabelText("pick"), { target: { value: "b" } })
    expect(onValueChange).toHaveBeenCalledWith("b")
  })
})

// ===========================================================================
// AnchorPreview — support-gated degrade
// ===========================================================================

describe("AnchorPreview", () => {
  test("renders the live preview when CSS.supports is true", () => {
    setSupports(() => true)
    render(<AnchorPreview value="top left" />)
    expect(screen.queryByText(/not supported/i)).not.toBeInTheDocument()
    expect(screen.getByRole("img")).toBeInTheDocument()
  })

  test("degrades with a support note when CSS.supports is false", () => {
    setSupports(() => false)
    render(<AnchorPreview value="top left" />)
    expect(screen.getByText(/not supported/i)).toBeInTheDocument()
  })

  test("degrades when CSS is entirely absent", () => {
    setSupports(null)
    render(<AnchorPreview value="top left" />)
    expect(screen.getByText(/not supported/i)).toBeInTheDocument()
  })

  test("degrades when CSS.supports throws (caught support probe)", () => {
    setSupports(() => {
      throw new Error("boom")
    })
    render(<AnchorPreview value="top left" />)
    expect(screen.getByText(/not supported/i)).toBeInTheDocument()
  })

  test("the live preview falls back to `center` for an empty value", () => {
    setSupports(() => true)
    render(<AnchorPreview value="" />)
    // supported path renders the live img (not the degraded note)
    expect(screen.queryByText(/not supported/i)).not.toBeInTheDocument()
    expect(screen.getByRole("img")).toBeInTheDocument()
  })
})

// ===========================================================================
// AnchorPositionEditor (popover)
// ===========================================================================

describe("AnchorPositionEditor (popover)", () => {
  test("trigger shows the mode badge and the value", () => {
    render(<AnchorPositionEditor value="top left" onChange={() => {}} />)
    const btn = screen.getByRole("button")
    expect(btn.textContent).toMatch(/position-area/i)
    expect(btn.textContent).toMatch(/top left/)
  })

  test("anchor mode badge", () => {
    render(
      <AnchorPositionEditor
        mode="anchor"
        value="anchor(--btn bottom)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole("button").textContent).toMatch(/anchor/i)
  })

  test("opening the popover reveals the panel", async () => {
    render(<AnchorPositionEditor value="center" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    const cells = await screen.findAllByLabelText(/^place at /i)
    expect(cells.length).toBe(9)
  })
})
