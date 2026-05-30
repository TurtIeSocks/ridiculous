import { render, screen } from "@testing-library/react"
import { Pipette } from "lucide-react"
import { describe, expect, it } from "vitest"
import { SectionHeader } from "@/components/layout/section-header"

describe("SectionHeader", () => {
  it("renders the eyebrow and title", () => {
    render(<SectionHeader eyebrow="component" title="Color Picker" />)
    expect(
      screen.getByRole("heading", { name: "Color Picker" }),
    ).toBeInTheDocument()
  })

  it("renders a decorative icon when given one", () => {
    const { container } = render(
      <SectionHeader eyebrow="component" title="Color Picker" icon={Pipette} />,
    )
    const icon = container.querySelector("svg")
    expect(icon).not.toBeNull()
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })

  it("renders no icon when none is given", () => {
    const { container } = render(
      <SectionHeader eyebrow="component" title="Color Picker" />,
    )
    expect(container.querySelector("svg")).toBeNull()
  })
})
