import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  AddFunctionMenu,
  TransformBuilder,
  TransformBuilderPanel,
  TransformFunctionRow,
  TransformPreview3D,
} from "@/components/ui/transform-builder/transform-builder"

describe("TransformBuilderPanel", () => {
  test("renders a row per function with the right controls", () => {
    render(
      <TransformBuilderPanel
        value="translateX(10px) rotate(45deg)"
        onChange={() => {}}
      />,
    )
    const selects = screen.getAllByLabelText("Transform function")
    expect(selects.length).toBe(2)
    expect((selects[0] as HTMLSelectElement).value).toBe("translateX")
    expect((selects[1] as HTMLSelectElement).value).toBe("rotate")
  })

  test("editing an argument emits onChange with the updated string", () => {
    const onChange = vi.fn()
    render(
      <TransformBuilderPanel value="translateX(10px)" onChange={onChange} />,
    )
    const input = screen.getByLabelText("translateX x")
    fireEvent.change(input, { target: { value: "20px" } })
    expect(onChange).toHaveBeenCalledWith("translateX(20px)")
  })

  test("changing a row function dispatches new arg editors and re-seeds", () => {
    const onChange = vi.fn()
    render(
      <TransformBuilderPanel value="translateX(10px)" onChange={onChange} />,
    )
    fireEvent.change(screen.getAllByLabelText("Transform function")[0], {
      target: { value: "rotate" },
    })
    // re-seeded to a rotate default
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^rotate\(/))
    // the angle editor now exists
    expect(screen.getByLabelText("rotate angle")).toBeInTheDocument()
  })

  test("AddFunctionMenu appends a new function row", () => {
    const onChange = vi.fn()
    render(
      <TransformBuilderPanel value="translateX(10px)" onChange={onChange} />,
    )
    const adder = screen.getByLabelText(/add a transform function/i)
    fireEvent.change(adder, { target: { value: "scale" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/translateX\(10px\) scale\(/),
    )
  })

  test("removing a row drops it from the value", () => {
    const onChange = vi.fn()
    render(
      <TransformBuilderPanel
        value="translateX(10px) rotate(45deg)"
        onChange={onChange}
      />,
    )
    const removes = screen.getAllByRole("button", { name: /remove/i })
    fireEvent.click(removes[0])
    expect(onChange).toHaveBeenCalledWith("rotate(45deg)")
  })

  test("value='none' renders an empty list with an add control", () => {
    const onChange = vi.fn()
    render(<TransformBuilderPanel value="none" onChange={onChange} />)
    expect(screen.queryAllByRole("combobox")).toHaveLength(1) // only the adder
    fireEvent.change(screen.getByLabelText(/add a transform function/i), {
      target: { value: "rotate" },
    })
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^rotate\(/))
  })

  test("two-arg function renders both axis inputs", () => {
    render(
      <TransformBuilderPanel value="translate(1px, 2px)" onChange={() => {}} />,
    )
    expect(screen.getByLabelText("translate x")).toBeInTheDocument()
    expect(screen.getByLabelText("translate y")).toBeInTheDocument()
  })
})

describe("TransformFunctionRow", () => {
  test("renders the function select set to the item function", () => {
    render(
      <TransformFunctionRow
        item={{ fn: "rotate", angle: "45deg" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(
      (screen.getByLabelText("Transform function") as HTMLSelectElement).value,
    ).toBe("rotate")
    expect(screen.getByLabelText("rotate angle")).toHaveValue("45deg")
  })
})

describe("AddFunctionMenu", () => {
  test("calls onAdd with the chosen function", () => {
    const onAdd = vi.fn()
    render(<AddFunctionMenu onAdd={onAdd} />)
    fireEvent.change(screen.getByLabelText(/add a transform function/i), {
      target: { value: "skew" },
    })
    expect(onAdd).toHaveBeenCalledWith("skew")
  })
})

describe("TransformPreview3D", () => {
  test("renders a card whose transform reflects the value", () => {
    const { container } = render(<TransformPreview3D value="rotate(45deg)" />)
    const card = container.querySelector("[data-transform-card]")
    expect(card).not.toBeNull()
    expect((card as HTMLElement).style.transform).toBe("rotate(45deg)")
  })

  test("a scrubber updates the value via onChange", () => {
    const onChange = vi.fn()
    render(<TransformPreview3D value="none" onChange={onChange} />)
    const slider = screen.getByLabelText(/rotate/i)
    fireEvent.change(slider, { target: { value: "30" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/rotate\(30deg\)/),
    )
  })
})

describe("TransformBuilder (popover)", () => {
  test("renders a trigger button", () => {
    render(
      <TransformBuilder
        value="translateX(10px) rotate(45deg)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  test("opening the popover reveals the panel", async () => {
    render(<TransformBuilder value="rotate(45deg)" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    const selects = await screen.findAllByRole("combobox")
    expect(selects.length).toBeGreaterThan(0)
  })
})
