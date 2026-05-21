import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { NavLink } from "@/components/layout/nav-link"

describe("NavLink", () => {
  it("renders the children inside an anchor with the given href", () => {
    render(<NavLink href="/ridiculous/color-picker/">Color Picker</NavLink>)
    const link = screen.getByRole("link", { name: "Color Picker" })
    expect(link).toHaveAttribute("href", "/ridiculous/color-picker/")
  })

  it("marks the link active via data-active when href matches current pathname", () => {
    window.history.pushState({}, "", "/ridiculous/color-picker/")
    render(<NavLink href="/ridiculous/color-picker/">Color Picker</NavLink>)
    expect(screen.getByRole("link")).toHaveAttribute("data-active", "true")
  })

  it("does not apply the active state when pathname differs", () => {
    window.history.pushState({}, "", "/ridiculous/gradient-editor/")
    render(<NavLink href="/ridiculous/color-picker/">Color Picker</NavLink>)
    expect(screen.getByRole("link")).toHaveAttribute("data-active", "false")
  })
})
