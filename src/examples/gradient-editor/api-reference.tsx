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
            "<GradientEditor<TType extends GradientType | undefined>\n  value: GradientString | (string & {})\n  onChange: (next: TType extends GradientType ? GradientStringMap[TType] : GradientString) => void\n  type?: TType\n  maxStops?: number\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <PropsTable
          rows={[
            {
              name: "value",
              type: "GradientString | (string & {})",
              desc: "Current gradient. Any string accepted; IntelliSense suggests literal shapes.",
            },
            {
              name: "onChange",
              type: "(next) => void",
              desc: "Emits next gradient. Return type discriminated by `type` prop.",
            },
            {
              name: "type",
              type: "GradientType | undefined",
              desc: "Lock gradient type. When unset, in-popover type switcher is shown.",
            },
            {
              name: "maxStops",
              type: "number (default 8)",
              desc: "Max number of stops the editor allows. Min (2) always enforced.",
            },
            {
              name: "className",
              type: "string",
              desc: "Applied to the trigger preview swatch.",
            },
            {
              name: "aria-label",
              type: "string",
              desc: 'Trigger label. Defaults to "Edit gradient".',
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature={
            "isGradientString(value: string): value is GradientString\nisGradientString<S extends string>(value: S): value is S & (LinearGradientString | RadialGradientString | ConicGradientString)"
          }
          desc="Runtime type guard. Narrows wide strings to GradientString."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "GradientString",
              desc: "Union of all suggestion-string literal types. Default `onChange` return type.",
            },
            {
              name: "GradientStringMap",
              desc: "{ linear: LinearGradientString, radial: RadialGradientString, conic: ConicGradientString }",
            },
            { name: "GradientType", desc: '"linear" | "radial" | "conic"' },
            {
              name: "GradientStop",
              desc: "{ color: ColorString, position: number }. Reuses ColorString from color-picker.",
            },
            {
              name: "InterpolationSpace",
              desc: '"srgb" | "oklch" | "oklab" | "hsl" | "hwb"',
            },
            {
              name: "InterpolationHueMethod",
              desc: '"shorter" | "longer"',
            },
            {
              name: "PolarSpace",
              desc: 'Subset of InterpolationSpace that supports hue methods: "oklch" | "hsl" | "hwb".',
            },
            {
              name: "GradientTypeOf<S>",
              desc: 'Extract the type from a gradient literal. GradientTypeOf<"linear-gradient(...)"> = "linear".',
            },
            {
              name: "InterpolationOf<S>",
              desc: "Extract the interpolation space from a literal, if declared.",
            },
          ]}
        />
      </ApiSection>
    </div>
  )
}
