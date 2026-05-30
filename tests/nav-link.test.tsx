import { render, screen } from "@testing-library/react"
import { Pipette } from "lucide-react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { NavLink } from "@/components/layout/nav-link"

function renderAt(initialPath: string, to: string, label: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavLink to={to}>{label}</NavLink>
    </MemoryRouter>,
  )
}

describe("NavLink", () => {
  it("renders the children inside an anchor with the resolved href", () => {
    renderAt("/", "/color-picker", "Color Picker")
    const link = screen.getByRole("link", { name: "Color Picker" })
    expect(link).toHaveAttribute("href", "/color-picker")
  })

  it("marks the link active (aria-current=page) when the path matches", () => {
    renderAt("/color-picker", "/color-picker", "Color Picker")
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page")
  })

  it("does not mark the link active when the path differs", () => {
    renderAt("/gradient-editor", "/color-picker", "Color Picker")
    expect(screen.getByRole("link")).not.toHaveAttribute("aria-current")
  })

  it("renders a decorative icon when given one", () => {
    const { container } = render(
      <MemoryRouter>
        <NavLink to="/color-picker" icon={Pipette}>
          Color Picker
        </NavLink>
      </MemoryRouter>,
    )
    const icon = container.querySelector("svg")
    expect(icon).not.toBeNull()
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })

  it("renders no icon when none is given", () => {
    const { container } = render(
      <MemoryRouter>
        <NavLink to="/color-picker">Color Picker</NavLink>
      </MemoryRouter>,
    )
    expect(container.querySelector("svg")).toBeNull()
  })
})
