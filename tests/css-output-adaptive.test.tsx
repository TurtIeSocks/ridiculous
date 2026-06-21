import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CssOutput } from "@/components/ui/css-output"

describe("CssOutput adaptive", () => {
  it("shows a bg/text/border selector for color in tailwind view", async () => {
    const user = userEvent.setup()
    render(<CssOutput value="red" property="color" output="tailwind" />)
    await user.click(screen.getByRole("button", { name: /^text$/i }))
    expect(screen.getByText("text-[red]")).toBeInTheDocument()
  })

  it("reveals an editable @theme token block", async () => {
    const user = userEvent.setup()
    render(
      <CssOutput
        value="0 4px 8px #000"
        property="box-shadow"
        output="tailwind"
      />,
    )
    await user.click(screen.getByRole("button", { name: /theme token/i }))
    expect(
      screen.getByText(/--shadow-custom: 0 4px 8px #000;/),
    ).toBeInTheDocument()
    const nameInput = screen.getByLabelText(/token name/i)
    await user.clear(nameInput)
    await user.type(nameInput, "card")
    expect(
      screen.getByText(/--shadow-card: 0 4px 8px #000;/),
    ).toBeInTheDocument()
  })

  it("offers no token disclosure for a non-namespace property", () => {
    render(<CssOutput value="blur(4px)" property="filter" output="tailwind" />)
    expect(screen.queryByRole("button", { name: /theme token/i })).toBeNull()
  })

  it("copies the @theme block from the token disclosure", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    // Setup clipboard mock BEFORE render
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
    render(<CssOutput value="red" property="color" output="tailwind" />)
    // Open the token disclosure with fireEvent
    const themeBtn = screen.getByRole("button", { name: /theme token/i })
    fireEvent.click(themeBtn)
    // Click the copy button
    const copyBtn = screen.getByRole("button", { name: /copy token/i })
    fireEvent.click(copyBtn)
    // Await the writeText call via waitFor
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "@theme {\n  --color-custom: red;\n}",
      ),
    )
  })
})
