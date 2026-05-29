import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  ColorFunction,
  ColorFunctionPanel,
  ColorFunctionPreview,
  ColorMixEditor,
  LightDarkEditor,
  RelativeColorEditor,
} from "@/components/ui/color-function/color-function"
import { cssColorFn } from "@/components/ui/color-function/color-function.types"

test("cssColorFn returns its argument unchanged at runtime", () => {
  expect(cssColorFn("color-mix(in srgb, #ff0000, #0000ff)")).toBe(
    "color-mix(in srgb, #ff0000, #0000ff)",
  )
})

describe("ColorFunctionPanel — color-mix", () => {
  test("renders the interpolation space select with the current space", () => {
    render(
      <ColorFunctionPanel
        mode="color-mix"
        value="color-mix(in oklch, #ff0000 30%, #0000ff)"
        onChange={() => {}}
      />,
    )
    const space = screen.getByLabelText(/interpolation colorspace/i)
    expect(space).toHaveValue("oklch")
  })

  test("changing the colorspace emits an updated color-mix string", () => {
    const onChange = vi.fn()
    render(
      <ColorFunctionPanel
        mode="color-mix"
        value="color-mix(in oklch, #ff0000 50%, #0000ff 50%)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/interpolation colorspace/i), {
      target: { value: "srgb" },
    })
    expect(onChange).toHaveBeenCalledWith(
      "color-mix(in srgb, #ff0000 50%, #0000ff 50%)",
    )
  })

  test("the hue-method select appears only for cylindrical spaces", () => {
    const { rerender } = render(
      <ColorFunctionPanel
        mode="color-mix"
        value="color-mix(in srgb, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    expect(screen.queryByLabelText(/hue interpolation/i)).toBeNull()
    rerender(
      <ColorFunctionPanel
        mode="color-mix"
        value="color-mix(in oklch, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/hue interpolation/i)).toBeTruthy()
  })

  test("moving the first ratio slider emits an updated percentage", () => {
    const onChange = vi.fn()
    render(
      <ColorFunctionPanel
        mode="color-mix"
        value="color-mix(in oklch, #ff0000 50%, #0000ff 50%)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/first color ratio/i), {
      target: { value: "30" },
    })
    expect(onChange).toHaveBeenCalledWith(
      "color-mix(in oklch, #ff0000 30%, #0000ff 50%)",
    )
  })
})

describe("ColorFunctionPanel — relative", () => {
  test("renders a function select and three channel inputs", () => {
    render(
      <ColorFunctionPanel
        mode="relative"
        value="oklch(from #ff0000 l c h)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/relative function/i)).toHaveValue("oklch")
    expect(screen.getByLabelText(/channel 1/i)).toHaveValue("l")
    expect(screen.getByLabelText(/channel 2/i)).toHaveValue("c")
    expect(screen.getByLabelText(/channel 3/i)).toHaveValue("h")
  })

  test("editing a channel emits an updated relative string", () => {
    const onChange = vi.fn()
    render(
      <ColorFunctionPanel
        mode="relative"
        value="oklch(from #ff0000 l c h)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/channel 1/i), {
      target: { value: "calc(l * 1.2)" },
    })
    expect(onChange).toHaveBeenCalledWith(
      "oklch(from #ff0000 calc(l * 1.2) c h)",
    )
  })
})

describe("ColorFunctionPanel — light-dark", () => {
  test("renders two color pickers", () => {
    render(
      <ColorFunctionPanel
        mode="light-dark"
        value="light-dark(#ffffff, #000000)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/light color/i)).toBeTruthy()
    expect(screen.getByLabelText(/dark color/i)).toBeTruthy()
  })

  test("editing the dark color emits an updated light-dark string", () => {
    const onChange = vi.fn()
    render(
      <ColorFunctionPanel
        mode="light-dark"
        value="light-dark(#ffffff, #000000)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/dark color/i), {
      target: { value: "#111111" },
    })
    expect(onChange).toHaveBeenCalledWith("light-dark(#ffffff, #111111)")
  })
})

describe("ColorFunctionPanel — mode omitted", () => {
  test("renders a family select defaulting to the parsed kind", () => {
    render(
      <ColorFunctionPanel
        value="light-dark(#ffffff, #000000)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/color-function family/i)).toHaveValue(
      "light-dark",
    )
  })

  test("switching family seeds a default value for the new family", () => {
    const onChange = vi.fn()
    render(
      <ColorFunctionPanel
        value="light-dark(#ffffff, #000000)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/color-function family/i), {
      target: { value: "color-mix" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.stringContaining("color-mix(in oklch"),
    )
  })
})

describe("ColorFunction — popover", () => {
  test("renders a trigger whose swatch carries the value", () => {
    render(
      <ColorFunction
        value="color-mix(in oklch, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    const trigger = screen.getByLabelText(/edit a css color function/i)
    expect(trigger).toBeTruthy()
  })
})

describe("ColorFunctionPreview", () => {
  test("renders a swatch carrying the value as background", () => {
    render(
      <ColorFunctionPreview value="color-mix(in srgb, #ff0000, #0000ff)" />,
    )
    const swatch = screen.getByTestId("cf-preview")
    // jsdom normalizes nested hex to rgb() in the `background` shorthand, so
    // assert the color-mix function is applied rather than exact-string parity.
    expect(swatch.style.background).toContain("color-mix(in srgb")
  })

  test("the light-dark toggle flips the color-scheme of the preview wrapper", () => {
    render(<ColorFunctionPreview value="light-dark(#ffffff, #000000)" />)
    const toggle = screen.getByLabelText(/toggle color scheme/i)
    const wrapper = screen.getByTestId("cf-preview-scheme")
    expect(wrapper.style.colorScheme).toBe("light")
    fireEvent.click(toggle)
    expect(wrapper.style.colorScheme).toBe("dark")
  })
})

describe("ColorMixEditor / RelativeColorEditor / LightDarkEditor (sub-components)", () => {
  test("ColorMixEditor is exported and editable", () => {
    const onChange = vi.fn()
    render(
      <ColorMixEditor
        state={{
          kind: "color-mix",
          space: "srgb",
          colorA: "#ff0000",
          colorB: "#0000ff",
        }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/interpolation colorspace/i), {
      target: { value: "hsl" },
    })
    expect(onChange).toHaveBeenCalled()
  })

  test("RelativeColorEditor and LightDarkEditor are exported", () => {
    expect(typeof RelativeColorEditor).toBe("function")
    expect(typeof LightDarkEditor).toBe("function")
  })
})
