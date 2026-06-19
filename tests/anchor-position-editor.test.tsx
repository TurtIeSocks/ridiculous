import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import {
  AnchorExprFields,
  AnchorPositionEditor,
  AnchorPositionEditorPanel,
  AnchorPreview,
  MiniSelect,
  PositionAreaGrid,
  TryFallbackChain,
} from "@/components/ui/anchor-position-editor/anchor-position-editor"
import { cssPositionArea } from "@/components/ui/anchor-position-editor/anchor-position-editor.types"

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
