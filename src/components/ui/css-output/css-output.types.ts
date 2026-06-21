export interface TailwindForm {
  /** Inline class, e.g. "shadow-[0_4px_8px_#0006]" or "[filter:blur(4px)]". */
  inline: string
  /** Present only for the 4 namespace-backed properties. */
  theme?: {
    /** Full @theme block, e.g. "@theme {\n  --shadow-custom: …;\n}". */
    atRule: string
    /** The class the token enables, e.g. "shadow-custom". */
    className: string
  }
}

export interface CssToTailwindOptions {
  /** @theme token suffix; default "custom". e.g. "brand" → --color-brand. */
  name?: string
  /** Only used when property === "color". Default "bg". */
  colorPrefix?: "bg" | "text" | "border"
}

export interface CssOutputProps {
  /** The formatted CSS value the host already produces. */
  value: string
  /** CSS property the value targets; drives conversion. Omit/null → css-only. */
  property?: string | null
  /** "css" | "tailwind" | "both" — default "both". */
  output?: "css" | "tailwind" | "both"
  /** Only meaningful when property === "color". Default "bg". */
  colorPrefix?: "bg" | "text" | "border"
  className?: string
}
