import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  InitialValueField,
  MiniSelect,
  PropertySyntaxEditor,
  PropertySyntaxEditorPanel,
  SyntaxChipBuilder,
} from "@/components/ui/property-syntax-editor/property-syntax-editor"
import { cssSyntax } from "@/components/ui/property-syntax-editor/property-syntax-editor.types"

test("cssSyntax returns its argument unchanged at runtime", () => {
  expect(cssSyntax("<length>")).toBe("<length>")
})

// ===========================================================================
// PropertySyntaxEditorPanel — chip builder
// ===========================================================================

describe("PropertySyntaxEditorPanel (chips)", () => {
  test("renders one chip per syntax component", () => {
    render(
      <PropertySyntaxEditorPanel value="<length> | auto" onChange={() => {}} />,
    )
    expect(screen.getAllByLabelText(/^component /i)).toHaveLength(2)
  })

  test("adding a data type from the palette appends a chip and emits", () => {
    const onChange = vi.fn()
    render(<PropertySyntaxEditorPanel value="<length>" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Add <color>"))
    expect(onChange).toHaveBeenLastCalledWith("<length> | <color>")
  })

  test("removing a chip drops it from the emitted syntax", () => {
    const onChange = vi.fn()
    render(
      <PropertySyntaxEditorPanel
        value="<length> | <color>"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Remove component 1"))
    expect(onChange).toHaveBeenLastCalledWith("<color>")
  })

  test("toggling a chip's multiplier to + emits the space-list form", () => {
    const onChange = vi.fn()
    render(<PropertySyntaxEditorPanel value="<length>" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Set component 1 multiplier to +"))
    expect(onChange).toHaveBeenLastCalledWith("<length>+")
  })

  test("toggling a chip's multiplier to # emits the comma-list form", () => {
    const onChange = vi.fn()
    render(<PropertySyntaxEditorPanel value="<length>" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Set component 1 multiplier to #"))
    expect(onChange).toHaveBeenLastCalledWith("<length>#")
  })

  test("adding a literal ident appends an ident chip", () => {
    const onChange = vi.fn()
    render(<PropertySyntaxEditorPanel value="<length>" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("literal ident to add"), {
      target: { value: "auto" },
    })
    fireEvent.click(screen.getByLabelText("Add the literal ident"))
    expect(onChange).toHaveBeenLastCalledWith("<length> | auto")
  })

  test("the OR separators are visible between chips", () => {
    render(
      <PropertySyntaxEditorPanel value="<length> | auto" onChange={() => {}} />,
    )
    expect(screen.getAllByText("|").length).toBeGreaterThanOrEqual(1)
  })
})

// ===========================================================================
// PropertySyntaxEditorPanel — universal "*" switch
// ===========================================================================

describe("PropertySyntaxEditorPanel (universal)", () => {
  test("enabling the universal switch emits * and clears the chips", () => {
    const onChange = vi.fn()
    render(
      <PropertySyntaxEditorPanel
        value="<length> | <color>"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/universal/i))
    expect(onChange).toHaveBeenLastCalledWith("*")
    expect(screen.queryAllByLabelText(/^component /i)).toHaveLength(0)
  })

  test("disabling the universal switch restores an editable component", () => {
    const onChange = vi.fn()
    render(<PropertySyntaxEditorPanel value="*" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/universal/i))
    // back to a concrete component — no longer the universal "*"
    expect(onChange.mock.calls.at(-1)?.[0]).not.toBe("*")
  })
})

// ===========================================================================
// InitialValueField — live green/red badge
// ===========================================================================

describe("InitialValueField", () => {
  test("a matching initial value shows a valid status", () => {
    render(
      <InitialValueField
        syntax="<length>"
        value="0px"
        inherits={false}
        onValueChange={() => {}}
        onInheritsChange={() => {}}
      />,
    )
    const badge = screen.getByRole("status")
    expect(badge.textContent).toMatch(/valid/i)
  })

  test("a mismatching initial value shows an invalid status", () => {
    render(
      <InitialValueField
        syntax="<length>"
        value="red"
        inherits={false}
        onValueChange={() => {}}
        onInheritsChange={() => {}}
      />,
    )
    const badge = screen.getByRole("status")
    expect(badge.textContent).toMatch(/invalid/i)
  })

  test("editing the value flips the badge from valid to invalid", () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <InitialValueField
        syntax="<length>"
        value="0px"
        inherits={false}
        onValueChange={onValueChange}
        onInheritsChange={() => {}}
      />,
    )
    expect(screen.getByRole("status").textContent).toMatch(/valid/i)
    fireEvent.change(screen.getByLabelText("initial value (demo)"), {
      target: { value: "red" },
    })
    expect(onValueChange).toHaveBeenLastCalledWith("red")
    rerender(
      <InitialValueField
        syntax="<length>"
        value="red"
        inherits={false}
        onValueChange={onValueChange}
        onInheritsChange={() => {}}
      />,
    )
    expect(screen.getByRole("status").textContent).toMatch(/invalid/i)
  })

  test("a <color> initial value accepts a hex but rejects a named color", () => {
    const { rerender } = render(
      <InitialValueField
        syntax="<color>"
        value="#ff0000"
        inherits={false}
        onValueChange={() => {}}
        onInheritsChange={() => {}}
      />,
    )
    expect(screen.getByRole("status").textContent).toMatch(/valid/i)
    rerender(
      <InitialValueField
        syntax="<color>"
        value="red"
        inherits={false}
        onValueChange={() => {}}
        onInheritsChange={() => {}}
      />,
    )
    expect(screen.getByRole("status").textContent).toMatch(/invalid/i)
  })

  test("the inherits toggle emits its change", () => {
    const onInheritsChange = vi.fn()
    render(
      <InitialValueField
        syntax="<length>"
        value="0px"
        inherits={false}
        onValueChange={() => {}}
        onInheritsChange={onInheritsChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/inherits/i))
    expect(onInheritsChange).toHaveBeenCalledWith(true)
  })
})

// ===========================================================================
// SyntaxChipBuilder (public sub-component)
// ===========================================================================

describe("SyntaxChipBuilder", () => {
  test("renders a chip per component and a data-type palette", () => {
    render(
      <SyntaxChipBuilder
        universal={false}
        components={[{ base: "<length>", isType: true, multiplier: "" }]}
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^component /i)).toHaveLength(1)
    expect(screen.getByLabelText("Add <length>")).toBeInTheDocument()
  })

  test("the universal switch is reflected as pressed/checked", () => {
    render(<SyntaxChipBuilder universal components={[]} onChange={() => {}} />)
    const universal = screen.getByLabelText(/universal/i)
    expect(universal).toBeChecked()
  })
})

// ===========================================================================
// PropertySyntaxEditor (popover)
// ===========================================================================

describe("PropertySyntaxEditor (popover)", () => {
  test("the trigger shows the syntax string", () => {
    render(<PropertySyntaxEditor value="<length> | auto" onChange={() => {}} />)
    expect(screen.getByRole("button").textContent).toMatch(/<length> \| auto/)
  })

  test("opening the popover reveals the panel", async () => {
    render(<PropertySyntaxEditor value="<length>" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    expect(await screen.findByLabelText("Add <color>")).toBeInTheDocument()
  })
})

// ===========================================================================
// PropertySyntaxEditorPanel — resync
// ===========================================================================

describe("PropertySyntaxEditorPanel resync", () => {
  test("an external value change re-syncs the chips", () => {
    const { rerender } = render(
      <PropertySyntaxEditorPanel value="<length>" onChange={() => {}} />,
    )
    expect(screen.getAllByLabelText(/^component /i)).toHaveLength(1)
    rerender(
      <PropertySyntaxEditorPanel
        value="<length> | <color> | auto"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^component /i)).toHaveLength(3)
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
