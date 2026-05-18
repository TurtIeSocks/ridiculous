export function ApiReference() {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-10">
      <Section title="Component">
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
      </Section>

      <Section title="Runtime helpers">
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
      </Section>

      <Section title="Types">
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
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-mono uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">§</span> {title}
      </h3>
      {children}
    </div>
  )
}

function Signature({ children }: { children: string }) {
  return (
    <pre className="text-[11px] md:text-xs leading-relaxed font-mono bg-black/40 border border-white/10 p-4 rounded-lg overflow-x-auto whitespace-pre">
      {children}
    </pre>
  )
}

function ApiRow({ signature, desc }: { signature: string; desc: string }) {
  return (
    <div className="space-y-2">
      <Signature>{signature}</Signature>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function PropsTable({
  rows,
}: {
  rows: { name: string; type: string; desc: string }[]
}) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <div className="grid grid-cols-[minmax(7rem,auto)_minmax(10rem,auto)_1fr] gap-x-4 px-4 py-2 bg-black/40 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
        <div>Prop</div>
        <div>Type</div>
        <div>Description</div>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[minmax(7rem,auto)_minmax(10rem,auto)_1fr] gap-x-4 px-4 py-3 items-baseline text-sm"
          >
            <code className="font-mono text-foreground">{r.name}</code>
            <code className="font-mono text-xs text-cyan-glow break-all">
              {r.type}
            </code>
            <span className="text-muted-foreground text-sm">{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TypesList({ rows }: { rows: { name: string; desc: string }[] }) {
  return (
    <div className="rounded-lg border border-white/10 divide-y divide-white/5 overflow-hidden">
      {rows.map((r) => (
        <div
          key={r.name}
          className="grid grid-cols-1 sm:grid-cols-[minmax(10rem,auto)_1fr] gap-x-4 gap-y-1 px-4 py-3 text-sm"
        >
          <code className="font-mono text-foreground">{r.name}</code>
          <span className="text-muted-foreground">{r.desc}</span>
        </div>
      ))}
    </div>
  )
}
