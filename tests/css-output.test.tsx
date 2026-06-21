import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CssOutput } from "@/components/ui/css-output"

describe("CssOutput core", () => {
  it("shows raw CSS by default in 'both' mode", () => {
    render(<CssOutput value="0 4px 8px #000" property="box-shadow" />)
    expect(screen.getByText("0 4px 8px #000")).toBeInTheDocument()
  })

  it("toggles to the Tailwind inline class", async () => {
    const user = userEvent.setup()
    render(<CssOutput value="0 4px 8px #000" property="box-shadow" />)
    await user.click(screen.getByRole("tab", { name: /tailwind/i }))
    expect(screen.getByText("shadow-[0_4px_8px_#000]")).toBeInTheDocument()
  })

  it("hides the toggle when output='css'", () => {
    render(<CssOutput value="x" property="box-shadow" output="css" />)
    expect(screen.queryByRole("tab", { name: /tailwind/i })).toBeNull()
  })

  it("hides the toggle when property is null (css-only)", () => {
    render(<CssOutput value="@media x" property={null} />)
    expect(screen.queryByRole("tab", { name: /tailwind/i })).toBeNull()
  })

  it("pins to tailwind when output='tailwind'", () => {
    render(<CssOutput value="blur(4px)" property="filter" output="tailwind" />)
    expect(screen.getByText("filter-[blur(4px)]")).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: /^css$/i })).toBeNull()
  })

  it("copies the currently shown string", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
    render(
      <CssOutput value="0 4px 8px #000" property="box-shadow" output="css" />,
    )
    fireEvent.click(screen.getByRole("button", { name: /copy/i }))
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("0 4px 8px #000"),
    )
  })
})
