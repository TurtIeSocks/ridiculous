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
      <ApiSection title="ColorFunction / ColorFunctionPanel">
        <Signature>
          {
            "<ColorFunction\n  mode?: 'color-mix' | 'relative' | 'light-dark'\n  value: ColorFunctionStringMap[mode] | (string & {})\n  onChange: (next: ColorFunctionStringMap[mode]) => void\n  className?: string\n  aria-label?: string\n/>"
          }
        </Signature>
        <p className="text-muted-foreground text-sm">
          <code className="font-mono">ColorFunction</code> is popover-wrapped;{" "}
          <code className="font-mono">ColorFunctionPanel</code> renders the same
          editor inline. Both are controlled. With{" "}
          <code className="font-mono">mode</code> set the panel shows only that
          family and <code className="font-mono">onChange</code> narrows; omit
          it for a family selector that edits any of the three.
        </p>
        <PropsTable
          rows={[
            {
              name: "mode",
              type: "'color-mix' | 'relative' | 'light-dark'",
              desc: "Optional. Which family to edit. Narrows the onChange string type; when omitted the panel shows a family <select>.",
            },
            {
              name: "value",
              type: "ColorFunctionStringMap[mode] | (string & {})",
              desc: "Current CSS color-function value. Required.",
            },
            {
              name: "onChange",
              type: "(next: ColorFunctionStringMap[mode]) => void",
              desc: "Fires when the edited value changes. Emits the canonical string for the family.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Sub-components">
        <ApiRow
          signature="<ColorMixEditor state onChange />"
          desc="The color-mix editor: interpolation-space select, a hue-method select (cylindrical spaces only), two ColorPickers with mix-ratio sliders, and a swap-colors affordance. Emits a ColorMixState."
        />
        <ApiRow
          signature="<RelativeColorEditor state onChange />"
          desc="The relative-color editor: function select, a from-color ColorPicker, three channel inputs (with per-function keyword placeholders), an optional color() space ident, and an alpha input. Emits a RelativeColorState."
        />
        <ApiRow
          signature="<LightDarkEditor state onChange />"
          desc="Two ColorPickers — the light-scheme and dark-scheme colors. Emits a LightDarkState."
        />
        <ApiRow
          signature="<ColorFunctionPreview value />"
          desc="The result swatch — renders the produced string as a computed background-color, with a color-scheme toggle for light-dark()."
        />
      </ApiSection>

      <ApiSection title="Runtime helpers">
        <ApiRow
          signature="cssColorFn<S extends string>(value: S & ColorFunctionLiteral<S>): S"
          desc="Call-site validator. Mirrors cssBoxShadow() / cssFilter() / color()."
        />
        <ApiRow
          signature="parseColorFunction(src: string): ColorFunctionState | null"
          desc="String → typed state, or null on a syntax / unknown-function / arity error. Tolerant of calc()/var() and bare keyword colors; lenient on channel magnitudes."
        />
        <ApiRow
          signature="formatColorFunction(state: ColorFunctionState): string"
          desc="Canonical re-serialization for each family (parse ∘ format is idempotent)."
        />
        <ApiRow
          signature="colorFunctionKind(src: string): 'color-mix' | 'relative' | 'light-dark' | null"
          desc="Runtime mirror of KindOf — the family of a value, or null."
        />
        <ApiRow
          signature="defaultState(mode): ColorFunctionState"
          desc="Seed a fresh value per mode (each round-trips through format)."
        />
        <ApiRow
          signature="MIX_COLOR_SPACES / CYLINDRICAL_SPACES / HUE_METHODS / RELATIVE_FNS / CHANNEL_KEYWORDS"
          desc="The dispatch tables that drive both the parser and the UI."
        />
      </ApiSection>

      <ApiSection title="Types">
        <TypesList
          rows={[
            {
              name: "ColorFunctionLiteral<S>",
              desc: "Strict validator — dispatches on the leading function name into ColorMixLiteral / LightDarkLiteral / RelativeColorLiteral; S on success, never otherwise.",
            },
            {
              name: "ColorMixLiteral<S>",
              desc: "Full color-mix validation: in <space> with an optional <method> hue (cylindrical spaces), then two <color> <pct>?.",
            },
            {
              name: "LightDarkLiteral<S>",
              desc: "Full light-dark validation: exactly two <color> arguments.",
            },
            {
              name: "RelativeColorLiteral<S>",
              desc: "Relative-color validation with per-space channel keywords; lenient on calc() bodies and magnitudes.",
            },
            {
              name: "ColorFunctionString / …StringMap / …Mode",
              desc: "Suggestion union, the mode→string map, and the mode key — the onChange return type.",
            },
            {
              name: "KindOf / MixSpaceOf / RelativeFnOf / ColorsOf",
              desc: "Literal-level operators: the family, the mix colorspace, the relative function, and the raw color arguments.",
            },
            {
              name: "ColorFunctionState",
              desc: "Discriminated-union state (color-mix | relative | light-dark), exported for advanced use.",
            },
          ]}
        />
      </ApiSection>

      <ApiSection title="Strict-tier scope">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
          <li>
            <strong>color-mix() and light-dark()</strong> are{" "}
            <strong>fully validated</strong>: the 14-member interpolation
            colorspace set, a{" "}
            <code className="font-mono">&lt;method&gt; hue</code> suffix only on
            the four cylindrical spaces (
            <code className="font-mono">hsl / hwb / lch / oklch</code>), exactly
            two colors with optional trailing{" "}
            <code className="font-mono">&lt;percentage&gt;</code> weights.
          </li>
          <li>
            <strong>Relative color</strong> enforces{" "}
            <strong>per-space channel keywords</strong> (
            <code className="font-mono">oklch → l c h</code>,{" "}
            <code className="font-mono">rgb → r g b</code>, …) and the{" "}
            <code className="font-mono">from</code> keyword + source color +
            exactly three channels + optional{" "}
            <code className="font-mono">/ &lt;alpha&gt;</code>.
          </li>
          <li>
            <strong>Weak-validated</strong> (documented):{" "}
            <code className="font-mono">calc()</code> channel bodies are not
            parsed (any balanced <code className="font-mono">calc(…)</code>{" "}
            passes), channel magnitudes are not range-checked, and the{" "}
            <code className="font-mono">color()</code> colorspace ident is
            accepted leniently. <code className="font-mono">var()</code> is
            accepted wherever a <code className="font-mono">&lt;color&gt;</code>{" "}
            is expected.
          </li>
          <li>
            A bare color literal (
            <code className="font-mono">rgb(255 0 0)</code> with no{" "}
            <code className="font-mono">from</code>) resolves to{" "}
            <code className="font-mono">never</code> — that is color-picker's
            domain, not this component's.
          </li>
        </ul>
      </ApiSection>
    </div>
  )
}
