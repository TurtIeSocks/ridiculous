import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, test, vi } from "vitest"
import {
  FamilyEditor,
  FontEditor,
  FontEditorPanel,
  FontPreview,
  PropertyField,
} from "@/components/ui/font-editor/font-editor"
import { cssFont } from "@/components/ui/font-editor/font-editor.types"

test("cssFont returns its argument unchanged at runtime", () => {
  expect(cssFont("16px serif")).toBe("16px serif")
})

describe("FontEditorPanel", () => {
  test("renders the property fields for a shorthand value", () => {
    render(
      <FontEditorPanel
        value="italic bold 16px/1.5 serif"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText("Font style")).toBeInTheDocument()
    expect(screen.getByLabelText("Font size")).toHaveValue("16px")
    expect(screen.getByLabelText("Font family 1")).toHaveValue("serif")
  })

  test("editing the size emits onChange with the updated string", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Font size"), {
      target: { value: "20px" },
    })
    expect(onChange).toHaveBeenCalledWith("20px serif")
  })

  test("editing the weight keyword emits onChange", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Font weight keyword"), {
      target: { value: "bold" },
    })
    expect(onChange).toHaveBeenCalledWith("bold 16px serif")
  })

  test("editing a family token emits onChange", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Font family 1"), {
      target: { value: "monospace" },
    })
    expect(onChange).toHaveBeenCalledWith("16px monospace")
  })

  test("switching to system mode emits a system keyword", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: /system font/i }))
    expect(onChange).toHaveBeenCalledWith("caption")
  })

  test("a system-keyword value renders the keyword select", () => {
    render(<FontEditorPanel value="status-bar" onChange={() => {}} />)
    expect(
      (screen.getByLabelText("System font keyword") as HTMLSelectElement).value,
    ).toBe("status-bar")
  })

  test("the embedded preview applies the font shorthand to sample text", () => {
    const { container } = render(
      <FontEditorPanel value="italic 16px serif" onChange={() => {}} />,
    )
    const preview = container.querySelector("[data-font-preview]")
    expect(preview).not.toBeNull()
    expect((preview as HTMLElement).style.font).toContain("16px")
  })
})

describe("FamilyEditor", () => {
  test("adding a family appends it", () => {
    const onChange = vi.fn()
    render(<FamilyEditor value={["serif"]} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/add a font family/i), {
      target: { value: "monospace" },
    })
    expect(onChange).toHaveBeenCalledWith(["serif", "monospace"])
  })

  test("removing the only family falls back to sans-serif", () => {
    const onChange = vi.fn()
    render(<FamilyEditor value={["serif"]} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Remove family 1"))
    expect(onChange).toHaveBeenCalledWith(["sans-serif"])
  })

  test("editing a family in a multi-family list keeps the others", () => {
    const onChange = vi.fn()
    render(<FamilyEditor value={["serif", "monospace"]} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Font family 1"), {
      target: { value: "Arial" },
    })
    expect(onChange).toHaveBeenCalledWith(["Arial", "monospace"])
  })

  test("removing a row keeps element identity of the surviving rows", () => {
    // Stable per-row keys: removing a row ABOVE the focused one must not drop
    // focus. Index keys remount the survivor under a shifted index and lose it.
    function Harness() {
      const [value, setValue] = useState(["Arial", "Georgia", "Verdana"])
      return <FamilyEditor value={value} onChange={setValue} />
    }
    render(<Harness />)
    const verdana = screen.getByLabelText("Font family 3") as HTMLInputElement
    verdana.focus()
    expect(document.activeElement).toBe(verdana)

    fireEvent.click(screen.getByLabelText("Remove family 1"))

    // "Verdana" is now row 2; with a stable key it is the SAME element, so it
    // retains focus and its value.
    const survivor = screen.getByLabelText("Font family 2") as HTMLInputElement
    expect(survivor.value).toBe("Verdana")
    expect(document.activeElement).toBe(survivor)
  })
})

describe("FontPreview", () => {
  test("renders sample text styled with the value", () => {
    const { container } = render(<FontPreview value="bold 18px monospace" />)
    const node = container.querySelector("[data-font-preview]")
    expect(node).not.toBeNull()
    expect((node as HTMLElement).style.font).toContain("monospace")
  })

  test("uses a provided fixed sample text without an editor", () => {
    render(<FontPreview value="16px serif" sampleText="Hello" />)
    expect(screen.getByText("Hello")).toBeInTheDocument()
    expect(screen.queryByLabelText("Sample text")).not.toBeInTheDocument()
  })

  test("editing the sample text updates the preview", () => {
    render(<FontPreview value="16px serif" />)
    const input = screen.getByLabelText("Sample text")
    fireEvent.change(input, { target: { value: "Custom" } })
    expect(screen.getByText("Custom")).toBeInTheDocument()
  })
})

describe("PropertyField", () => {
  test("renders the label and its control", () => {
    render(
      <PropertyField label="Size">
        <input aria-label="ctl" />
      </PropertyField>,
    )
    expect(screen.getByText("Size")).toBeInTheDocument()
    expect(screen.getByLabelText("ctl")).toBeInTheDocument()
  })
})

describe("FontEditor (popover)", () => {
  test("renders a trigger button showing the value", () => {
    render(<FontEditor value="16px serif" onChange={() => {}} />)
    expect(screen.getByRole("button").textContent).toContain("16px serif")
  })

  test("opening the popover reveals the panel", async () => {
    render(<FontEditor value="16px serif" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    expect(await screen.findByLabelText("Font size")).toBeInTheDocument()
  })
})

describe("FontEditorPanel — field controls", () => {
  test("changing the size unit recomposes the value", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Font size unit"), {
      target: { value: "rem" },
    })
    expect(onChange).toHaveBeenCalledWith("16rem serif")
  })

  test("choosing the abs unit switches the size to a keyword", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Font size unit"), {
      target: { value: "keyword" },
    })
    expect(onChange).toHaveBeenCalledWith("medium serif")
  })

  test("an absolute-size keyword renders the unit select as keyword", () => {
    render(<FontEditorPanel value="x-large serif" onChange={() => {}} />)
    expect(
      (screen.getByLabelText("Font size unit") as HTMLSelectElement).value,
    ).toBe("keyword")
  })

  test("a bare unit (no number) marks the unit select opaque, not a real unit", () => {
    render(<FontEditorPanel value="16px serif" onChange={() => {}} />)
    // Mid-edit the size field can hold a lone unit. The split must require at
    // least one digit, so a bare "px" is opaque (placeholder), not a number.
    fireEvent.change(screen.getByLabelText("Font size"), {
      target: { value: "px" },
    })
    expect(
      (screen.getByLabelText("Font size unit") as HTMLSelectElement).value,
    ).toBe("")
  })

  test("an empty size field marks the unit select opaque, not px", () => {
    render(<FontEditorPanel value="16px serif" onChange={() => {}} />)
    fireEvent.change(screen.getByLabelText("Font size"), {
      target: { value: "" },
    })
    expect(
      (screen.getByLabelText("Font size unit") as HTMLSelectElement).value,
    ).toBe("")
  })

  test("switching weight to number reveals the numeric input and seeds 400", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Font weight keyword"), {
      target: { value: "__number" },
    })
    expect(onChange).toHaveBeenCalledWith("400 16px serif")
  })

  test("editing the numeric weight emits the number", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="350 16px serif" onChange={onChange} />)
    const numeric = screen.getByLabelText("Font weight number")
    expect(numeric).toHaveValue("350")
    fireEvent.change(numeric, { target: { value: "700" } })
    expect(onChange).toHaveBeenCalledWith("700 16px serif")
  })

  test("editing the line-height emits size/lh", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Line height"), {
      target: { value: "1.5" },
    })
    expect(onChange).toHaveBeenCalledWith("16px/1.5 serif")
  })

  test("clearing the line-height drops it", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px/1.5 serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Line height"), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith("16px serif")
  })

  test("editing the variant emits the prefix token", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Font variant"), {
      target: { value: "small-caps" },
    })
    expect(onChange).toHaveBeenCalledWith("small-caps 16px serif")
  })

  test("editing the stretch emits the prefix token", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Font stretch"), {
      target: { value: "condensed" },
    })
    expect(onChange).toHaveBeenCalledWith("condensed 16px serif")
  })

  test("editing a field while in system mode seeds a shorthand", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="caption" onChange={onChange} />)
    // switch into shorthand mode first, then it edits a real shorthand
    fireEvent.click(screen.getByRole("button", { name: /^shorthand$/i }))
    expect(onChange).toHaveBeenCalledWith("16px sans-serif")
  })

  test("adding a family via the panel select appends it", () => {
    const onChange = vi.fn()
    render(<FontEditorPanel value="16px serif" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Add a font family"), {
      target: { value: "monospace" },
    })
    expect(onChange).toHaveBeenCalledWith("16px serif, monospace")
  })

  test("resyncs when the external value changes", () => {
    const { rerender } = render(
      <FontEditorPanel value="16px serif" onChange={() => {}} />,
    )
    expect(screen.getByLabelText("Font size")).toHaveValue("16px")
    rerender(
      <FontEditorPanel value="bold 24px monospace" onChange={() => {}} />,
    )
    expect(screen.getByLabelText("Font size")).toHaveValue("24px")
  })
})

describe("FontPreview — empty value", () => {
  test("omits the inline font style when value is empty", () => {
    const { container } = render(<FontPreview value="" />)
    const node = container.querySelector("[data-font-preview]")
    expect((node as HTMLElement).style.font).toBe("")
  })
})
