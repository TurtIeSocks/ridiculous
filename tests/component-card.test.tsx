import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { ComponentCard } from "@/components/layout/component-card"

function renderCard() {
  return render(
    <MemoryRouter>
      <ComponentCard
        name="color-picker"
        title="Color Picker"
        description="Pick a color."
      />
    </MemoryRouter>,
  )
}

describe("ComponentCard", () => {
  it("links to the component route with its title and description", () => {
    renderCard()
    const link = screen.getByRole("link", { name: /color picker/i })
    expect(link).toHaveAttribute("href", "/color-picker")
    expect(screen.getByText("Pick a color.")).toBeInTheDocument()
  })

  it("renders the component's icon as a decorative svg", () => {
    const { container } = renderCard()
    const icon = container.querySelector("svg")
    expect(icon).not.toBeNull()
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })
})
