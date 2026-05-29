import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  AddFilterMenu,
  FilterBuilder,
  FilterBuilderPanel,
  FilterFunctionRow,
  FilterPreview,
} from "@/components/ui/filter-builder/filter-builder"
import { cssFilter } from "@/components/ui/filter-builder/filter-builder.types"

test("cssFilter returns its argument unchanged at runtime", () => {
  expect(cssFilter("blur(4px)")).toBe("blur(4px)")
})

describe("FilterBuilderPanel", () => {
  test("renders a row per function with the right controls", () => {
    render(
      <FilterBuilderPanel
        value="blur(4px) brightness(1.2)"
        onChange={() => {}}
      />,
    )
    const selects = screen.getAllByLabelText("Filter function")
    expect(selects.length).toBe(2)
    expect((selects[0] as HTMLSelectElement).value).toBe("blur")
    expect((selects[1] as HTMLSelectElement).value).toBe("brightness")
  })

  test("editing a length argument emits onChange with the updated string", () => {
    const onChange = vi.fn()
    render(<FilterBuilderPanel value="blur(4px)" onChange={onChange} />)
    const input = screen.getByLabelText("blur radius")
    fireEvent.change(input, { target: { value: "8px" } })
    expect(onChange).toHaveBeenCalledWith("blur(8px)")
  })

  test("editing an amount argument emits onChange", () => {
    const onChange = vi.fn()
    render(<FilterBuilderPanel value="brightness(1)" onChange={onChange} />)
    const input = screen.getByLabelText("brightness amount")
    fireEvent.change(input, { target: { value: "1.5" } })
    expect(onChange).toHaveBeenCalledWith("brightness(1.5)")
  })

  test("changing a row function dispatches new arg editors and re-seeds", () => {
    const onChange = vi.fn()
    render(<FilterBuilderPanel value="blur(4px)" onChange={onChange} />)
    fireEvent.change(screen.getAllByLabelText("Filter function")[0], {
      target: { value: "hue-rotate" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/^hue-rotate\(/),
    )
    expect(screen.getByLabelText("hue-rotate angle")).toBeInTheDocument()
  })

  test("AddFilterMenu appends a new function row", () => {
    const onChange = vi.fn()
    render(<FilterBuilderPanel value="blur(4px)" onChange={onChange} />)
    const adder = screen.getByLabelText(/add a filter function/i)
    fireEvent.change(adder, { target: { value: "saturate" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/blur\(4px\) saturate\(/),
    )
  })

  test("removing a row drops it from the value", () => {
    const onChange = vi.fn()
    render(
      <FilterBuilderPanel
        value="blur(4px) brightness(1.2)"
        onChange={onChange}
      />,
    )
    const removes = screen.getAllByRole("button", { name: /remove/i })
    fireEvent.click(removes[0])
    expect(onChange).toHaveBeenCalledWith("brightness(1.2)")
  })

  test("value='none' renders an empty list with an add control", () => {
    const onChange = vi.fn()
    render(<FilterBuilderPanel value="none" onChange={onChange} />)
    expect(screen.queryAllByLabelText("Filter function")).toHaveLength(0)
    fireEvent.change(screen.getByLabelText(/add a filter function/i), {
      target: { value: "blur" },
    })
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^blur\(/))
  })
})

describe("FilterFunctionRow — drop-shadow", () => {
  test("renders x/y/blur length editors plus a color control", () => {
    render(
      <FilterFunctionRow
        item={{
          fn: "drop-shadow",
          x: "2px",
          y: "2px",
          blur: "4px",
          color: "rgb(0 0 0 / 0.5)",
        }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("drop-shadow offset-x")).toHaveValue("2px")
    expect(screen.getByLabelText("drop-shadow offset-y")).toHaveValue("2px")
    expect(screen.getByLabelText("drop-shadow blur")).toHaveValue("4px")
    expect(screen.getByLabelText("drop-shadow color")).toBeInTheDocument()
  })

  test("editing the blur slot emits the updated drop-shadow item", () => {
    const onChange = vi.fn()
    render(
      <FilterFunctionRow
        item={{ fn: "drop-shadow", x: "2px", y: "2px", blur: "4px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("drop-shadow blur"), {
      target: { value: "10px" },
    })
    expect(onChange).toHaveBeenCalledWith({
      fn: "drop-shadow",
      x: "2px",
      y: "2px",
      blur: "10px",
    })
  })

  test("a colorless drop-shadow shows a + color affordance that adds a color", () => {
    const onChange = vi.fn()
    render(
      <FilterFunctionRow
        item={{ fn: "drop-shadow", x: "2px", y: "2px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    // no color control yet
    expect(screen.queryByLabelText("drop-shadow color")).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole("button", { name: /add drop-shadow color/i }),
    )
    expect(onChange).toHaveBeenCalledWith({
      fn: "drop-shadow",
      x: "2px",
      y: "2px",
      color: "rgb(0 0 0 / 0.5)",
    })
  })

  test("clearing the color removes it from the item", () => {
    const onChange = vi.fn()
    render(
      <FilterFunctionRow
        item={{ fn: "drop-shadow", x: "2px", y: "2px", color: "#000" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.click(
      screen.getByRole("button", { name: /remove drop-shadow color/i }),
    )
    expect(onChange).toHaveBeenCalledWith({
      fn: "drop-shadow",
      x: "2px",
      y: "2px",
    })
  })

  test("editing a drop-shadow offset clears the blur when emptied is not triggered here", () => {
    const onChange = vi.fn()
    render(
      <FilterFunctionRow
        item={{ fn: "drop-shadow", x: "2px", y: "2px", blur: "4px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    // typing into the blur slot updates it; emptying it drops the key
    fireEvent.change(screen.getByLabelText("drop-shadow blur"), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith({
      fn: "drop-shadow",
      x: "2px",
      y: "2px",
    })
  })
})

describe("FilterFunctionRow — amount + opaque", () => {
  test("an amount editor exposes a % unit toggle that recomposes the value", () => {
    const onChange = vi.fn()
    render(
      <FilterFunctionRow
        item={{ fn: "saturate", value: "1.5" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("saturate amount unit"), {
      target: { value: "%" },
    })
    expect(onChange).toHaveBeenCalledWith({ fn: "saturate", value: "1.5%" })
  })

  test("an opaque calc() argument renders as a raw text input (no unit select)", () => {
    const onChange = vi.fn()
    render(
      <FilterFunctionRow
        item={{ fn: "blur", value: "calc(2px + 1px)" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    const input = screen.getByLabelText("blur radius")
    expect(input).toHaveValue("calc(2px + 1px)")
    expect(screen.queryByLabelText("blur radius unit")).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: "var(--b)" } })
    expect(onChange).toHaveBeenCalledWith({ fn: "blur", value: "var(--b)" })
  })
})

describe("FilterFunctionRow — url", () => {
  test("renders a raw text input for the url body", () => {
    const onChange = vi.fn()
    render(
      <FilterFunctionRow
        item={{ fn: "url", url: "#f" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    const input = screen.getByLabelText("url body")
    expect(input).toHaveValue("#f")
    fireEvent.change(input, { target: { value: "#blur" } })
    expect(onChange).toHaveBeenCalledWith({ fn: "url", url: "#blur" })
  })
})

describe("FilterFunctionRow — unit recompose", () => {
  test("changing the length unit recomposes the value", () => {
    const onChange = vi.fn()
    render(
      <FilterFunctionRow
        item={{ fn: "blur", value: "4px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("blur radius unit"), {
      target: { value: "rem" },
    })
    expect(onChange).toHaveBeenCalledWith({ fn: "blur", value: "4rem" })
  })
})

describe("AddFilterMenu", () => {
  test("calls onAdd with the chosen function", () => {
    const onAdd = vi.fn()
    render(<AddFilterMenu onAdd={onAdd} />)
    fireEvent.change(screen.getByLabelText(/add a filter function/i), {
      target: { value: "drop-shadow" },
    })
    expect(onAdd).toHaveBeenCalledWith("drop-shadow")
  })
})

describe("FilterPreview", () => {
  test("applies the filter to the target in filter mode", () => {
    const { container } = render(
      <FilterPreview value="blur(4px)" mode="filter" />,
    )
    const target = container.querySelector("[data-filter-target]")
    expect(target).not.toBeNull()
    expect((target as HTMLElement).style.filter).toBe("blur(4px)")
  })

  test("applies backdrop-filter to the target in backdrop-filter mode", () => {
    const { container } = render(
      <FilterPreview value="blur(4px)" mode="backdrop-filter" />,
    )
    const target = container.querySelector("[data-backdrop-target]")
    expect(target).not.toBeNull()
    const style = (target as HTMLElement).style
    expect(
      style.backdropFilter || style.getPropertyValue("backdrop-filter"),
    ).toBe("blur(4px)")
  })

  test("toggling the mode switches which element is filtered", () => {
    const { container } = render(<FilterPreview value="blur(4px)" />)
    // default mode = filter
    expect(container.querySelector("[data-filter-target]")).not.toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /backdrop-filter/i }))
    expect(container.querySelector("[data-backdrop-target]")).not.toBeNull()
  })

  test("a scrubber updates the value via onChange", () => {
    const onChange = vi.fn()
    render(<FilterPreview value="none" onChange={onChange} />)
    const slider = screen.getByLabelText(/^blur$/i)
    fireEvent.change(slider, { target: { value: "6" } })
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/blur\(6px\)/))
  })

  test("a scrubber replaces the matching function in an existing list", () => {
    const onChange = vi.fn()
    render(
      <FilterPreview value="blur(2px) saturate(1.5)" onChange={onChange} />,
    )
    fireEvent.change(screen.getByLabelText(/^blur$/i), {
      target: { value: "9" },
    })
    expect(onChange).toHaveBeenCalledWith("blur(9px) saturate(1.5)")
  })

  test("a unitless scrubber (saturate) writes a bare number", () => {
    const onChange = vi.fn()
    render(<FilterPreview value="none" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/^saturate$/i), {
      target: { value: "2" },
    })
    expect(onChange).toHaveBeenCalledWith("saturate(2)")
  })

  test("renders without scrubbers when onChange is omitted", () => {
    render(<FilterPreview value="none" />)
    expect(screen.queryByLabelText(/^blur$/i)).not.toBeInTheDocument()
  })
})

describe("FilterBuilder (popover)", () => {
  test("renders a trigger button showing the function count", () => {
    render(
      <FilterBuilder value="blur(4px) brightness(1.2)" onChange={() => {}} />,
    )
    expect(screen.getByRole("button").textContent).toMatch(/2 fns/)
  })

  test("singular fn count for one function", () => {
    render(<FilterBuilder value="blur(4px)" onChange={() => {}} />)
    expect(screen.getByRole("button").textContent).toMatch(/1 fn/)
  })

  test("opening the popover reveals the panel", async () => {
    render(<FilterBuilder value="blur(4px)" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    const selects = await screen.findAllByLabelText("Filter function")
    expect(selects.length).toBeGreaterThan(0)
  })
})
