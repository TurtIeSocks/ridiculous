"use client"

import { useState } from "react"
import {
  cssProperty,
  cssSyntax,
  PropertySyntaxEditor,
  type SyntaxString,
} from "@/components/ui/property-syntax-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time @property validation. These calls are checked by tsc:
const validSyntax = cssSyntax("<length> | auto")
cssSyntax("<color>")
cssSyntax("*")
// The crown jewel — one CSS string typing another. cssProperty type-checks
// ONLY when the initial-value satisfies the declared syntax:
cssProperty("<length>", "0px")
cssProperty("<length>+", "0px 4px 8px")
cssProperty("<color>", "#ff0000")
cssProperty("<length> | auto", "auto")
// @ts-expect-error a second multiplier is not a valid syntax
const _doubleMult = cssSyntax("<length>++")
// @ts-expect-error <bogus> is not a known data type
const _unknownType = cssSyntax("<bogus>")
// @ts-expect-error "red" is not a <length> — the dependent type rejects it
const _badInitial = cssProperty("<length>", "red")
// @ts-expect-error a named color is not a color-picker <color> form
const _badColor = cssProperty("<color>", "notacolor")
void _doubleMult
void _unknownType
void _badInitial
void _badColor

export function TierStrict() {
  const [value, setValue] = useState<SyntaxString>(validSyntax)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={
        <>SyntaxLiteral&lt;S&gt; · InitialValueLiteral&lt;Syn, V&gt;</>
      }
      title="One CSS string typing another, at compile time"
      description={
        <>
          <code className="text-foreground">cssSyntax()</code> validates the
          full <code className="font-mono">&lt;syntax&gt;</code> grammar
          (universal, <code className="font-mono">|</code> alternation,{" "}
          <code className="font-mono">+</code>/
          <code className="font-mono">#</code> multipliers, known data types).
          The crown jewel is{" "}
          <code className="text-foreground">
            cssProperty(syntax, initialValue)
          </code>{" "}
          — the dependent{" "}
          <code className="text-foreground">
            InitialValueLiteral&lt;Syn, V&gt;
          </code>{" "}
          checks the initial-value AGAINST the syntax, resolving a mismatch (
          <code className="font-mono">
            cssProperty("&lt;length&gt;", "red")
          </code>
          ) to <code className="text-foreground">never</code> before you run the
          code. <code className="font-mono">&lt;color&gt;</code> defers to
          color-picker&apos;s <code className="font-mono">ColorLiteral</code>.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <PropertySyntaxEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssProperty" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"<length>+"' },
          { kind: "plain", text: ", " },
          { kind: "str", text: '"0px 4px 8px"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓ every space-token is a <length>" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssProperty" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"<color>"' },
          { kind: "plain", text: ", " },
          { kind: "str", text: '"#ff0000"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓ via color-picker ColorLiteral" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: '// @ts-expect-error "red" is not a <length>' },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssProperty" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"<length>"' },
          { kind: "plain", text: ", " },
          { kind: "err", text: '"red"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error <bogus> is unknown" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssSyntax" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"<bogus>"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">&lt;color&gt;</code> covers
        color-picker forms (<code className="font-mono">#ff0000</code>,{" "}
        <code className="font-mono">oklch(0.7 0.15 30)</code>), so a named color
        like <code className="font-mono">red</code> is (correctly) rejected.{" "}
        <code className="font-mono">&lt;integer&gt;</code> is validated as{" "}
        <code className="font-mono">&lt;number&gt;</code> at the type level;{" "}
        <code className="font-mono">&lt;image&gt;</code>/
        <code className="font-mono">&lt;url&gt;</code>/
        <code className="font-mono">&lt;transform-*&gt;</code> and{" "}
        <code className="font-mono">calc()</code>/
        <code className="font-mono">var()</code> initial values defer to the
        lenient runtime parser.
      </p>
    </ExampleCard>
  )
}
