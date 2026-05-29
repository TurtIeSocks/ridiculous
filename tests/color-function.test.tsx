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

  test("editing channels 2 and 3 emits the updated tokens", () => {
    const onChange = vi.fn()
    // Use the sub-component (pure state->onChange) so each edit is isolated
    // from the controlled-panel resync.
    render(
      <RelativeColorEditor
        state={{
          kind: "relative",
          fn: "oklch",
          from: "#ff0000",
          c1: "l",
          c2: "c",
          c3: "h",
        }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/channel 2/i), {
      target: { value: "0.2" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ c2: "0.2" }),
    )
    fireEvent.change(screen.getByLabelText(/channel 3/i), {
      target: { value: "270" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ c3: "270" }),
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

  test("editing the light color emits an updated light-dark string", () => {
    const onChange = vi.fn()
    render(
      <ColorFunctionPanel
        mode="light-dark"
        value="light-dark(#ffffff, #000000)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/light color/i), {
      target: { value: "#eeeeee" },
    })
    expect(onChange).toHaveBeenCalledWith("light-dark(#eeeeee, #000000)")
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

describe("ColorMixEditor — ratio toggles, swap, second slider, hue method", () => {
  const base = {
    kind: "color-mix" as const,
    space: "oklch",
    hue: "shorter",
    colorA: "#ff0000",
    pctA: "30%",
    colorB: "#0000ff",
    pctB: "70%",
  }

  test("toggling the first ratio off drops its percentage", () => {
    const onChange = vi.fn()
    render(<ColorMixEditor state={base} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/toggle first ratio/i))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ pctA: undefined }),
    )
  })

  test("toggling a ratio back on restores a default percentage", () => {
    const onChange = vi.fn()
    render(
      <ColorMixEditor
        state={{ ...base, hue: undefined, pctA: undefined, pctB: undefined }}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/toggle first ratio/i))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ pctA: "50%" }),
    )
  })

  test("the second slider emits the second percentage", () => {
    const onChange = vi.fn()
    render(<ColorMixEditor state={base} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/second color ratio/i), {
      target: { value: "40" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ pctB: "40%" }),
    )
  })

  test("swap colors exchanges the two colors and weights", () => {
    const onChange = vi.fn()
    render(<ColorMixEditor state={base} onChange={onChange} />)
    fireEvent.click(screen.getByText(/swap colors/i))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        colorA: "#0000ff",
        colorB: "#ff0000",
        pctA: "70%",
        pctB: "30%",
      }),
    )
  })

  test("changing the hue method emits the new method", () => {
    const onChange = vi.fn()
    render(<ColorMixEditor state={base} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/hue interpolation/i), {
      target: { value: "longer" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ hue: "longer" }),
    )
  })

  test("switching to a rectangular space drops the hue method", () => {
    const onChange = vi.fn()
    render(<ColorMixEditor state={base} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/interpolation colorspace/i), {
      target: { value: "srgb" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ space: "srgb", hue: undefined }),
    )
  })
})

describe("RelativeColorEditor — fn switch, color() ident, alpha", () => {
  const base = {
    kind: "relative" as const,
    fn: "oklch",
    from: "#ff0000",
    c1: "l",
    c2: "c",
    c3: "h",
  }

  test("switching the function resets the channels to its keywords", () => {
    const onChange = vi.fn()
    render(<RelativeColorEditor state={base} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/relative function/i), {
      target: { value: "rgb" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fn: "rgb", c1: "r", c2: "g", c3: "b" }),
    )
  })

  test("switching to color() seeds a colorspace ident", () => {
    const onChange = vi.fn()
    render(<RelativeColorEditor state={base} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/relative function/i), {
      target: { value: "color" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fn: "color", space: "srgb" }),
    )
  })

  test("the color() space ident is editable", () => {
    const onChange = vi.fn()
    render(
      <RelativeColorEditor
        state={{
          ...base,
          fn: "color",
          space: "srgb",
          c1: "r",
          c2: "g",
          c3: "b",
        }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/color space/i), {
      target: { value: "display-p3" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ space: "display-p3" }),
    )
  })

  test("editing the alpha emits it; clearing it drops it", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <RelativeColorEditor state={base} onChange={onChange} />,
    )
    fireEvent.change(screen.getByLabelText(/alpha channel/i), {
      target: { value: "50%" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ alpha: "50%" }),
    )
    rerender(
      <RelativeColorEditor
        state={{ ...base, alpha: "50%" }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/alpha channel/i), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ alpha: undefined }),
    )
  })
})

describe("ColorFunction popover opens the panel", () => {
  test("clicking the trigger reveals the editor controls", () => {
    render(
      <ColorFunction
        mode="color-mix"
        value="color-mix(in oklch, #ff0000, #0000ff)"
        onChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByLabelText(/edit a css color function/i))
    // PopoverContent now mounted — the interpolation select is present.
    expect(screen.getByLabelText(/interpolation colorspace/i)).toBeTruthy()
  })
})
