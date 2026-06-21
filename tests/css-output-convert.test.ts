import { describe, expect, it } from "vitest"
import { cssToTailwind } from "@/components/ui/css-output/css-output.helpers"

describe("cssToTailwind", () => {
  it("box-shadow → named utility + --shadow token", () => {
    expect(
      cssToTailwind("box-shadow", "0px 4px 8px rgb(0 0 0 / 0.25)"),
    ).toEqual({
      inline: "shadow-[0px_4px_8px_rgb(0_0_0_/_0.25)]",
      theme: {
        atRule:
          "@theme {\n  --shadow-custom: 0px 4px 8px rgb(0 0 0 / 0.25);\n}",
        className: "shadow-custom",
      },
    })
  })

  it("color → bg prefix by default + --color token", () => {
    expect(cssToTailwind("color", "oklch(0.7 0.15 200)")).toEqual({
      inline: "bg-[oklch(0.7_0.15_200)]",
      theme: {
        atRule: "@theme {\n  --color-custom: oklch(0.7 0.15 200);\n}",
        className: "bg-custom",
      },
    })
  })

  it("color honors colorPrefix and name", () => {
    const r = cssToTailwind("color", "red", {
      colorPrefix: "text",
      name: "brand",
    })
    expect(r?.inline).toBe("text-[red]")
    expect(r?.theme).toEqual({
      atRule: "@theme {\n  --color-brand: red;\n}",
      className: "text-brand",
    })
  })

  it("filter → named utility, no token", () => {
    expect(cssToTailwind("filter", "blur(4px) brightness(1)")).toEqual({
      inline: "filter-[blur(4px)_brightness(1)]",
    })
  })

  it("clip-path → arbitrary property, no token", () => {
    expect(cssToTailwind("clip-path", "circle(50% at 50% 50%)")).toEqual({
      inline: "[clip-path:circle(50%_at_50%_50%)]",
    })
  })

  it("transition shorthand → arbitrary property", () => {
    expect(cssToTailwind("transition", "opacity 200ms ease")?.inline).toBe(
      "[transition:opacity_200ms_ease]",
    )
  })

  it("unknown concrete property → generic arbitrary-property fallback", () => {
    expect(cssToTailwind("font", "italic 16px/1.5 Inter")?.inline).toBe(
      "[font:italic_16px/1.5_Inter]",
    )
  })

  it("null/empty property → null (css-only)", () => {
    expect(cssToTailwind(null, "anything")).toBeNull()
    expect(cssToTailwind("", "anything")).toBeNull()
  })
})
