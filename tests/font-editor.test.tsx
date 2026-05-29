import { fireEvent, render, screen } from "@testing-library/react"
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
