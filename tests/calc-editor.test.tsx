import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  CalcEditor,
  CalcEditorPanel,
  ExpressionField,
  FluidTypePlayground,
  TokenPalette,
} from "@/components/ui/calc-editor/calc-editor"

describe("CalcEditorPanel", () => {
  test("renders the expression field with the current value", () => {
    render(<CalcEditorPanel value="calc(10px + 2rem)" onChange={() => {}} />)
    expect(screen.getByLabelText(/expression/i)).toHaveValue(
      "calc(10px + 2rem)",
    )
  })

  test("typing a valid expression emits onChange with the normalized string", () => {
    const onChange = vi.fn()
    render(<CalcEditorPanel value="calc(1px)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/expression/i), {
      target: { value: "calc(10px + 2rem)" },
    })
    expect(onChange).toHaveBeenCalledWith("calc(10px + 2rem)")
  })

  test("dimension mismatch does NOT emit and surfaces an error", () => {
    const onChange = vi.fn()
    render(<CalcEditorPanel value="calc(1px)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/expression/i), {
      target: { value: "calc(10px + 45deg)" },
    })
    expect(onChange).not.toHaveBeenCalled()
    expect(
      screen.getByText(/incompatible|mismatch|invalid/i),
    ).toBeInTheDocument()
  })

  test("syntax error does NOT emit", () => {
    const onChange = vi.fn()
    render(<CalcEditorPanel value="calc(1px)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/expression/i), {
      target: { value: "calc(10px +" },
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  test("shows the resolved dimension for a valid expression", () => {
    render(<CalcEditorPanel value="calc(10px + 2rem)" onChange={() => {}} />)
    // dimension appears in the field badge and the readout
    expect(screen.getAllByText("length").length).toBeGreaterThan(0)
  })

  test("function tabs lock to a single function when fn is set", () => {
    render(
      <CalcEditorPanel
        fn="clamp"
        value="clamp(1rem, 2vw, 3rem)"
        onChange={() => {}}
      />,
    )
    // only the clamp tab is shown
    expect(
      screen.queryByRole("tab", { name: /^min$/i }),
    ).not.toBeInTheDocument()
  })

  test("locked fn wins over the flavor detected from value", () => {
    render(
      <CalcEditorPanel
        fn="clamp"
        value="calc(10px + 2rem)"
        onChange={() => {}}
      />,
    )
    // the locked clamp tab must stay selected even though `value` is a calc(...)
    expect(screen.getByRole("tab", { name: /^clamp$/i })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })
})

describe("ExpressionField", () => {
  test("renders a dimension badge from the prop", () => {
    render(
      <ExpressionField
        value="calc(10px + 2rem)"
        onChange={() => {}}
        dimension="length"
      />,
    )
    expect(screen.getByText("length")).toBeInTheDocument()
  })

  test("emits raw text on change", () => {
    const onChange = vi.fn()
    render(<ExpressionField value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/expression/i), {
      target: { value: "min(1px, 2px)" },
    })
    expect(onChange).toHaveBeenCalledWith("min(1px, 2px)")
  })
})

describe("TokenPalette", () => {
  test("clicking the + token calls onInsert", () => {
    const onInsert = vi.fn()
    render(<TokenPalette onInsert={onInsert} />)
    fireEvent.click(screen.getByRole("button", { name: "+" }))
    expect(onInsert).toHaveBeenCalledWith(" + ")
  })

  test("clicking a unit token inserts it", () => {
    const onInsert = vi.fn()
    render(<TokenPalette onInsert={onInsert} />)
    fireEvent.click(screen.getByRole("button", { name: "px" }))
    expect(onInsert).toHaveBeenCalledWith("px")
  })
})

describe("FluidTypePlayground", () => {
  test("renders a viewport slider and a computed readout", () => {
    render(
      <FluidTypePlayground expression="clamp(16px, calc(0.5rem + 2vw), 48px)" />,
    )
    expect(screen.getByRole("slider")).toBeInTheDocument()
    expect(screen.getAllByText(/px/).length).toBeGreaterThan(0)
  })

  test("moving the slider updates the computed value", () => {
    render(
      <FluidTypePlayground
        expression="clamp(16px, calc(0.5rem + 2vw), 48px)"
        minViewport={320}
        maxViewport={5000}
      />,
    )
    const slider = screen.getByRole("slider")
    fireEvent.change(slider, { target: { value: "5000" } })
    // @5000 the preferred (8 + 100 = 108) clamps to the 48px max
    expect(screen.getByText("48px")).toBeInTheDocument()
  })
})

describe("CalcEditorPanel integration", () => {
  test("switching the function tab re-wraps the expression and emits", () => {
    const onChange = vi.fn()
    render(<CalcEditorPanel value="calc(2rem)" onChange={onChange} />)
    fireEvent.click(screen.getByRole("tab", { name: /^clamp$/i }))
    // wrapping seeds a clamp() and emits a valid one
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^clamp\(/))
    expect(
      (screen.getByLabelText(/expression/i) as HTMLInputElement).value,
    ).toMatch(/^clamp\(/)
  })

  test("switching among min/max re-wraps the inner value", () => {
    const onChange = vi.fn()
    render(<CalcEditorPanel value="calc(1px + 2px)" onChange={onChange} />)
    fireEvent.click(screen.getByRole("tab", { name: /^min$/i }))
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^min\(/))
    fireEvent.click(screen.getByRole("tab", { name: /^max$/i }))
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^max\(/))
  })

  test("inserting a token from the palette appends and re-emits", () => {
    const onChange = vi.fn()
    render(<CalcEditorPanel value="calc(10px)" onChange={onChange} />)
    // Type a valid expression: this commit re-emits, proving the spy is wired.
    fireEvent.change(screen.getByLabelText(/expression/i), {
      target: { value: "calc(10px + 2px)" },
    })
    expect(onChange).toHaveBeenCalledWith("calc(10px + 2px)")
    onChange.mockClear()
    // Now append a token from the palette: the field text grows.
    fireEvent.click(screen.getByRole("button", { name: "( )" }))
    expect(
      (screen.getByLabelText(/expression/i) as HTMLInputElement).value,
    ).toContain("()")
  })

  test("shows a computed px readout for a length expression", () => {
    render(
      <CalcEditorPanel
        value="calc(10px + 1rem)"
        onChange={() => {}}
        referenceViewport={1000}
      />,
    )
    // 10 + 16 = 26px @ 1000px
    expect(screen.getByText(/26px @ 1000px/)).toBeInTheDocument()
  })
})

describe("TokenPalette function tokens", () => {
  test("inserts var() and clamp() stubs", () => {
    const onInsert = vi.fn()
    render(<TokenPalette onInsert={onInsert} />)
    fireEvent.click(screen.getByRole("button", { name: "var()" }))
    expect(onInsert).toHaveBeenCalledWith("var(--)")
    fireEvent.click(screen.getByRole("button", { name: "clamp()" }))
    expect(onInsert).toHaveBeenCalledWith("clamp(, , )")
  })
})

describe("FluidTypePlayground visual", () => {
  test("renders a tracking bar for a length expression", () => {
    const { container } = render(
      <FluidTypePlayground expression="calc(1rem + 2vw)" />,
    )
    const bar = container.querySelector("[aria-hidden='true'].bg-primary")
    expect(bar).not.toBeNull()
  })

  test("shows an em-dash when the expression cannot be computed", () => {
    render(<FluidTypePlayground expression="calc(10px + var(--x))" />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })
})

describe("CalcEditorPanel function detection", () => {
  test("detects min() and switching back to calc re-wraps", () => {
    const onChange = vi.fn()
    render(<CalcEditorPanel value="min(1rem, 2rem)" onChange={onChange} />)
    // initial detection lands on the min tab
    expect(screen.getByRole("tab", { name: /^min$/i })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    // switching to calc seeds a calc() wrapper (covers seedFor "calc")
    fireEvent.click(screen.getByRole("tab", { name: /^calc$/i }))
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^calc\(/))
    expect(
      (screen.getByLabelText(/expression/i) as HTMLInputElement).value,
    ).toMatch(/^calc\(/)
  })

  test("detects max() from the initial value", () => {
    render(<CalcEditorPanel value="max(1rem, 2rem)" onChange={() => {}} />)
    expect(screen.getByRole("tab", { name: /^max$/i })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })

  test("resyncs the active tab when the external value switches functions", () => {
    const { rerender } = render(
      <CalcEditorPanel value="calc(1rem + 2rem)" onChange={() => {}} />,
    )
    rerender(<CalcEditorPanel value="min(1rem, 2rem)" onChange={() => {}} />)
    expect(screen.getByRole("tab", { name: /^min$/i })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    rerender(<CalcEditorPanel value="max(1rem, 2rem)" onChange={() => {}} />)
    expect(screen.getByRole("tab", { name: /^max$/i })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })
})

describe("CalcEditor (popover)", () => {
  test("renders a trigger button", () => {
    render(<CalcEditor value="calc(10px + 2rem)" onChange={() => {}} />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  test("trigger shows the dimension badge", () => {
    render(<CalcEditor value="calc(10px + 2rem)" onChange={() => {}} />)
    expect(screen.getByRole("button").textContent).toMatch(/length/i)
  })

  test("opening the popover reveals the expression field", async () => {
    render(<CalcEditor value="calc(10px + 2rem)" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    const fields = await screen.findAllByLabelText(/expression/i)
    expect(fields.length).toBeGreaterThan(0)
  })
})
