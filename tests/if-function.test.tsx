import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  AddBranchButton,
  BranchRow,
  ConditionKindSelect,
  IfFunction,
  IfFunctionPanel,
  IfPreview,
} from "@/components/ui/if-function/if-function"
import { parseIf } from "@/components/ui/if-function/if-function.helpers"
import { cssIf } from "@/components/ui/if-function/if-function.types"

test("cssIf returns its argument unchanged at runtime", () => {
  expect(cssIf("if(media(width >= 800px): red)")).toBe(
    "if(media(width >= 800px): red)",
  )
})

// ===========================================================================
// IfFunctionPanel
// ===========================================================================

describe("IfFunctionPanel", () => {
  test("renders one row per branch", () => {
    render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red; else: blue)"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^condition-kind/i)).toHaveLength(2)
    expect(screen.getByLabelText("value 1")).toHaveValue("red")
    expect(screen.getByLabelText("value 2")).toHaveValue("blue")
  })

  test("renders the condition body for a kind branch", () => {
    render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText("condition 1")).toHaveValue("width >= 800px")
  })

  test("editing the condition emits an updated string", () => {
    const onChange = vi.fn()
    render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("condition 1"), {
      target: { value: "width >= 600px" },
    })
    expect(onChange).toHaveBeenCalledWith("if(media(width >= 600px): red)")
  })

  test("editing the value emits an updated string", () => {
    const onChange = vi.fn()
    render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("value 1"), {
      target: { value: "green" },
    })
    expect(onChange).toHaveBeenCalledWith("if(media(width >= 800px): green)")
  })

  test("changing the kind recomposes the branch", () => {
    const onChange = vi.fn()
    render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("condition-kind 1"), {
      target: { value: "supports" },
    })
    // condition body is kept; only the kind wrapper changes
    expect(onChange).toHaveBeenCalledWith("if(supports(width >= 800px): red)")
  })

  test("AddBranchButton appends the default media branch", () => {
    const onChange = vi.fn()
    render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red)"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/add a branch/i))
    expect(onChange).toHaveBeenCalledWith(
      "if(media(width >= 800px): red; media(width >= 600px): red)",
    )
  })

  test("adding a branch when the last is else keeps else last (round-trippable)", () => {
    const onChange = vi.fn()
    render(
      <IfFunctionPanel
        value="if(media(width >= 600px): red; else: blue)"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/add a branch/i))
    const emitted = onChange.mock.calls.at(-1)?.[0] as string
    // The emitted value must round-trip: `else` has to remain the final branch
    // or parseIf rejects it and the editor silently loses all branches on
    // remount.
    expect(parseIf(emitted)).not.toBeNull()
  })

  test("removing a branch drops it from the value", () => {
    const onChange = vi.fn()
    render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red; else: blue)"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Remove branch 1"))
    expect(onChange).toHaveBeenCalledWith("if(else: blue)")
  })

  test("only the last row offers the else option", () => {
    render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red; supports(display: grid): grid)"
        onChange={() => {}}
      />,
    )
    const first = screen.getByLabelText("condition-kind 1") as HTMLSelectElement
    const last = screen.getByLabelText("condition-kind 2") as HTMLSelectElement
    const firstOptions = Array.from(first.options).map((o) => o.value)
    const lastOptions = Array.from(last.options).map((o) => o.value)
    expect(firstOptions).not.toContain("else")
    expect(lastOptions).toContain("else")
  })

  test("an empty / invalid value renders no rows but an add control", () => {
    render(<IfFunctionPanel value="" onChange={() => {}} />)
    expect(screen.queryAllByLabelText(/^condition-kind/i)).toHaveLength(0)
    expect(screen.getByLabelText(/add a branch/i)).toBeInTheDocument()
  })

  test("an external value change re-syncs the rows", () => {
    const { rerender } = render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red)"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^condition-kind/i)).toHaveLength(1)
    rerender(
      <IfFunctionPanel
        value="if(media(width >= 800px): red; else: blue)"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^condition-kind/i)).toHaveLength(2)
  })

  test("switching the last branch to else hides its condition input", () => {
    const onChange = vi.fn()
    render(
      <IfFunctionPanel
        value="if(media(width >= 800px): red; supports(display: grid): grid)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("condition-kind 2"), {
      target: { value: "else" },
    })
    expect(onChange).toHaveBeenCalledWith(
      "if(media(width >= 800px): red; else: grid)",
    )
  })
})

// ===========================================================================
// BranchRow (public)
// ===========================================================================

describe("BranchRow", () => {
  test("renders the condition + value for a kind branch", () => {
    render(
      <BranchRow
        branch={{ kind: "media", condition: "width >= 1px", value: "red" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("condition")).toHaveValue("width >= 1px")
    expect(screen.getByLabelText("value")).toHaveValue("red")
  })

  test("an else branch shows '(always)' instead of a condition input", () => {
    render(
      <BranchRow
        branch={{ kind: "else", condition: "", value: "blue" }}
        allowElse
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.queryByLabelText("condition")).not.toBeInTheDocument()
    expect(screen.getByText(/always/i)).toBeInTheDocument()
  })

  test("clears the condition when switching to else", () => {
    const onChange = vi.fn()
    render(
      <BranchRow
        branch={{ kind: "media", condition: "width >= 1px", value: "red" }}
        allowElse
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("condition-kind"), {
      target: { value: "else" },
    })
    expect(onChange).toHaveBeenCalledWith({
      kind: "else",
      condition: "",
      value: "red",
    })
  })

  test("calls onRemove when the × button is clicked", () => {
    const onRemove = vi.fn()
    render(
      <BranchRow
        branch={{ kind: "media", condition: "width >= 1px", value: "red" }}
        onChange={() => {}}
        onRemove={onRemove}
      />,
    )
    fireEvent.click(screen.getByLabelText(/remove branch/i))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// ConditionKindSelect (public)
// ===========================================================================

describe("ConditionKindSelect", () => {
  test("omits else when allowElse is false", () => {
    render(
      <ConditionKindSelect label="kind" value="media" onChange={() => {}} />,
    )
    const select = screen.getByLabelText("kind") as HTMLSelectElement
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      "media",
      "supports",
      "style",
    ])
  })

  test("includes else when allowElse is true", () => {
    render(
      <ConditionKindSelect
        label="kind"
        value="else"
        allowElse
        onChange={() => {}}
      />,
    )
    const select = screen.getByLabelText("kind") as HTMLSelectElement
    expect(Array.from(select.options).map((o) => o.value)).toContain("else")
  })

  test("emits the selected kind", () => {
    const onChange = vi.fn()
    render(
      <ConditionKindSelect label="kind" value="media" onChange={onChange} />,
    )
    fireEvent.change(screen.getByLabelText("kind"), {
      target: { value: "style" },
    })
    expect(onChange).toHaveBeenCalledWith("style")
  })
})

// ===========================================================================
// AddBranchButton
// ===========================================================================

describe("AddBranchButton", () => {
  test("calls onAdd when clicked", () => {
    const onAdd = vi.fn()
    render(<AddBranchButton onAdd={onAdd} />)
    fireEvent.click(screen.getByLabelText(/add a branch/i))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// IfPreview
// ===========================================================================

describe("IfPreview", () => {
  test("renders a preview target bound to the value's color", () => {
    // jsdom's CSSOM drops unrecognized color values (it does not know if()),
    // so assert the binding with a value jsdom accepts — this proves the
    // `style={{ color: value }}` wiring without depending on if() support.
    const { container } = render(<IfPreview value="rebeccapurple" />)
    const target = container.querySelector("[data-preview-target]")
    expect(target).not.toBeNull()
    expect((target as HTMLElement).style.color).toBe("rebeccapurple")
  })

  test("carries a cutting-edge support caption", () => {
    render(<IfPreview value="if(else: red)" />)
    expect(
      screen.getByText(/cutting-edge browser support/i),
    ).toBeInTheDocument()
  })
})

// ===========================================================================
// IfFunction (popover)
// ===========================================================================

describe("IfFunction (popover)", () => {
  test("trigger shows the branch count", () => {
    render(
      <IfFunction
        value="if(media(width >= 800px): red; else: blue)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole("button").textContent).toMatch(/2 branches/)
    expect(screen.getByRole("button").textContent).toMatch(/if/i)
  })

  test("singular branch count for one branch", () => {
    render(
      <IfFunction value="if(media(width >= 800px): red)" onChange={() => {}} />,
    )
    expect(screen.getByRole("button").textContent).toMatch(/1 branch/)
  })

  test("opening the popover reveals the panel", async () => {
    render(
      <IfFunction value="if(media(width >= 800px): red)" onChange={() => {}} />,
    )
    fireEvent.click(screen.getByRole("button"))
    const fields = await screen.findAllByLabelText(/^condition-kind/i)
    expect(fields.length).toBeGreaterThan(0)
  })
})
