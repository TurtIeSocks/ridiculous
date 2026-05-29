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
