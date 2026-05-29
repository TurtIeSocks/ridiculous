import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  AddFunctionMenu,
  TransformBuilder,
  TransformBuilderPanel,
  TransformFunctionRow,
  TransformPreview3D,
} from "@/components/ui/transform-builder/transform-builder"
import { cssTransform } from "@/components/ui/transform-builder/transform-builder.types"

test("cssTransform returns its argument unchanged at runtime", () => {
  expect(cssTransform("rotate(45deg)")).toBe("rotate(45deg)")
})

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

  test("the embedded preview scrubber commits back through the panel", () => {
    const onChange = vi.fn()
    render(<TransformBuilderPanel value="rotate(10deg)" onChange={onChange} />)
    // the panel embeds TransformPreview3D with scrubbers; move rotate
    fireEvent.change(screen.getByLabelText("rotate"), {
      target: { value: "75" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/rotate\(75deg\)/),
    )
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

  test("trigger shows a singular fn count for one function", () => {
    render(<TransformBuilder value="rotate(45deg)" onChange={() => {}} />)
    expect(screen.getByRole("button").textContent).toMatch(/1 fn/)
  })
})

describe("TransformFunctionRow — every argument shape", () => {
  test("translate3d renders three axis inputs and edits the z slot", () => {
    const onChange = vi.fn()
    render(
      <TransformFunctionRow
        item={{ fn: "translate3d", x: "1px", y: "2px", z: "3px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("translate3d x")).toHaveValue("1px")
    expect(screen.getByLabelText("translate3d y")).toHaveValue("2px")
    fireEvent.change(screen.getByLabelText("translate3d z"), {
      target: { value: "9px" },
    })
    expect(onChange).toHaveBeenCalledWith({
      fn: "translate3d",
      x: "1px",
      y: "2px",
      z: "9px",
    })
  })

  test("rotate3d renders the axis vector and the angle", () => {
    render(
      <TransformFunctionRow
        item={{ fn: "rotate3d", x: "1", y: "1", z: "1", angle: "45deg" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("rotate3d x")).toHaveValue("1")
    expect(screen.getByLabelText("rotate3d angle")).toHaveValue("45deg")
  })

  test("scale3d renders three factor inputs", () => {
    render(
      <TransformFunctionRow
        item={{ fn: "scale3d", x: "1", y: "2", z: "3" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("scale3d z")).toHaveValue("3")
  })

  test("skew renders two angle inputs", () => {
    render(
      <TransformFunctionRow
        item={{ fn: "skew", x: "10deg", y: "20deg" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("skew x")).toHaveValue("10deg")
    expect(screen.getByLabelText("skew y")).toHaveValue("20deg")
  })

  test("editing the y slot of a two-arg translate keeps both axes", () => {
    const onChange = vi.fn()
    render(
      <TransformFunctionRow
        item={{ fn: "translate", x: "1px", y: "2px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("translate y"), {
      target: { value: "5px" },
    })
    expect(onChange).toHaveBeenCalledWith({
      fn: "translate",
      x: "1px",
      y: "5px",
    })
  })

  test("editing a rotate3d component reconstructs the full item", () => {
    const onChange = vi.fn()
    render(
      <TransformFunctionRow
        item={{ fn: "rotate3d", x: "1", y: "0", z: "0", angle: "45deg" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("rotate3d y"), {
      target: { value: "1" },
    })
    expect(onChange).toHaveBeenCalledWith({
      fn: "rotate3d",
      x: "1",
      y: "1",
      z: "0",
      angle: "45deg",
    })
  })

  test("matrix renders six value inputs and edits one", () => {
    const onChange = vi.fn()
    render(
      <TransformFunctionRow
        item={{ fn: "matrix", values: ["1", "0", "0", "1", "0", "0"] }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("matrix a"), {
      target: { value: "2" },
    })
    expect(onChange).toHaveBeenCalledWith({
      fn: "matrix",
      values: ["2", "0", "0", "1", "0", "0"],
    })
  })

  test("changing the length unit recomposes the value", () => {
    const onChange = vi.fn()
    render(
      <TransformFunctionRow
        item={{ fn: "translateX", value: "10px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("translateX x unit"), {
      target: { value: "rem" },
    })
    expect(onChange).toHaveBeenCalledWith({ fn: "translateX", value: "10rem" })
  })

  test("an opaque calc() argument renders as a raw text input", () => {
    const onChange = vi.fn()
    render(
      <TransformFunctionRow
        item={{ fn: "translateX", value: "calc(1px + 2px)" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    const input = screen.getByLabelText("translateX x")
    expect(input).toHaveValue("calc(1px + 2px)")
    // no unit select for the opaque value
    expect(screen.queryByLabelText("translateX x unit")).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: "var(--x)" } })
    expect(onChange).toHaveBeenCalledWith({
      fn: "translateX",
      value: "var(--x)",
    })
  })
})

describe("TransformPreview3D — scrub merge", () => {
  test("a scrubber replaces the matching function in an existing list", () => {
    const onChange = vi.fn()
    render(
      <TransformPreview3D
        value="rotate(10deg) scale(1.2)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("rotate"), {
      target: { value: "90" },
    })
    expect(onChange).toHaveBeenCalledWith("rotate(90deg) scale(1.2)")
  })

  test("renders without scrubbers when onChange is omitted", () => {
    render(<TransformPreview3D value="none" />)
    expect(screen.queryByLabelText("rotate")).not.toBeInTheDocument()
  })
})
