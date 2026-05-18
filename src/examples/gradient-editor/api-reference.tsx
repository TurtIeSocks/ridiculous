export function ApiReference() {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-10">
      <Section title="Component">
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
      </Section>

      <Section title="Runtime helpers">
        <ApiRow
          signature={
            "isGradientString(value: string): value is GradientString\nisGradientString<S extends string>(value: S): value is S & (LinearGradientString | RadialGradientString | ConicGradientString)"
          }
          desc="Runtime type guard. Narrows wide strings to GradientString."
        />
      </Section>

      <Section title="Types">
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
              desc: 'Extract the interpolation space from a literal, if declared.',
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
      <div className="grid grid-cols-[minmax(7rem,auto)_minmax(12rem,auto)_1fr] gap-x-4 px-4 py-2 bg-black/40 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
        <div>Prop</div>
        <div>Type</div>
        <div>Description</div>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[minmax(7rem,auto)_minmax(12rem,auto)_1fr] gap-x-4 px-4 py-3 items-baseline text-sm"
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
