import {
  ApiRow,
  ApiSection,
  PropsTable,
  Signature,
  TypesList,
} from "@/examples/_shared/api-reference"

export function ApiReference() {
  return (
    <div className="glass-card space-y-10 rounded-2xl p-6 md:p-8">
      <ApiSection title="Component">
        <Signature>
          {
            "<ColorPicker<TMode extends ColorMode | undefined>\n  value: ColorString | (string & {})\n  onChange: (next: TMode extends ColorMode ? ColorStringMap[TMode] : ColorString) => void\n  mode?: TMode\n  native?: boolean\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "ColorString | (string & {})",
              desc: "Current color. Any string accepted; IntelliSense suggests literal shapes.",
            },
            {
              name: "onChange",
              type: "(next) => void",
              desc: "Emits next color. Return type discriminated by `mode` prop.",
            },
            {
              name: "mode",
              type: "ColorMode | undefined",
              desc: "Lock output format. When unset, in-picker mode switcher is shown.",
            },
            {
              name: "native",
              type: "boolean",
              desc: 'Render the browser\'s <input type="color"> instead of the popover.',
            },
            {
              name: "className",
              type: "string",
              desc: "Applied to the trigger swatch (popover) or wrapper (native).",
            },
            {
              name: "aria-label",
              type: "string",
              desc: 'Trigger label. Defaults to "Pick a color".',
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="color<S extends string>(value: S & ColorLiteral<S>): S"
          desc="Validate a color literal at the call site. Range violations type-error."
        />
        <ApiRow
          signature={
            "isColorString(value: string): value is ColorString\nisColorString<S extends string>(value: S): value is S & ColorLiteral<S>"
          }
          desc="Runtime type guard. Narrows wide strings to ColorString; narrows a literal S to S & ColorLiteral<S>."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "ColorString",
              desc: "Union of all suggestion-string literal types. Used as the IntelliSense surface and the default `onChange` return type.",
            },
            {
              name: "ColorStringMap",
              desc: "{ hex: HexString, rgb: RgbString, hsl: HslString, oklch: OklchString, oklab: OklabString, hwb: HwbString }",
            },
            {
              name: "ColorMode",
              desc: '"oklch" | "oklab" | "hex" | "rgb" | "hsl" | "hwb"',
            },
            {
              name: "ColorLiteral<S>",
              desc: "Strict template-literal validator. Range-checks every token (bytes 0–255, percents 0–100%, hue 0–360deg, etc.). Returns `S` if valid, `never` otherwise.",
            },
            {
              name: "ModeOf<S>",
              desc: 'Extract the mode tag from a color literal. ModeOf<"#ff0000"> = "hex".',
            },
            {
              name: "WithAlpha<S, A>",
              desc: 'Add or replace the alpha tag on a functional-notation color literal. WithAlpha<"rgb(255 0 0)", 50> = "rgb(255 0 0 / 50%)".',
            },
            {
              name: "WithoutAlpha<S>",
              desc: "Strip the alpha tag from a functional-notation color literal.",
            },
          ]}
        />
      </ApiSection>
    </div>
  )
}
