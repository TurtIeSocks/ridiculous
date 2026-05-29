// =====================================================================
// calc-editor.helpers.ts
//
// Pure runtime parse / evaluate / format for CSS math expressions.
// This is the SUPERSET of the type tier: it does operator precedence,
// numeric value computation, var() tolerance, and friendly errors that
// the compile-time validator (calc-editor.types.ts) cannot.
// =====================================================================

import type {
  CalcFunctionName,
  CalcNode,
  CalcString,
  Dimension,
} from "./calc-editor.types"

const CALC_FUNCTIONS: ReadonlySet<string> = new Set([
  "calc",
  "clamp",
  "min",
  "max",
])

const MATH_CONSTANTS: ReadonlySet<string> = new Set([
  "pi",
  "e",
  "infinity",
  "-infinity",
  "nan",
])

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

export type TokenType =
  | "number"
  | "ident"
  | "op"
  | "lparen"
  | "rparen"
  | "comma"

export interface Token {
  type: TokenType
  value: string
}

const IDENT_START = /[a-zA-Z_-]/
const IDENT_CHAR = /[a-zA-Z0-9_-]/
const DIGIT = /[0-9]/

/**
 * Lex a CSS math expression into tokens. Numbers carry their unit suffix
 * (`10px`, `50%`, `-5rem`); a leading sign is folded into the number when
 * it is in operand position (start, or right after `( , + - * /`).
 */
export function tokenizeCalc(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const n = src.length

  const prevMeaningful = (): Token | null =>
    tokens.length > 0 ? tokens[tokens.length - 1] : null

  // A sign is unary (part of a number) when nothing precedes it, or the
  // previous token is an operator, a comma, or an opening paren.
  const signIsUnary = (): boolean => {
    const p = prevMeaningful()
    return (
      p === null || p.type === "op" || p.type === "comma" || p.type === "lparen"
    )
  }

  while (i < n) {
    const c = src[i]

    // whitespace
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++
      continue
    }

    if (c === "(") {
      tokens.push({ type: "lparen", value: "(" })
      i++
      continue
    }
    if (c === ")") {
      tokens.push({ type: "rparen", value: ")" })
      i++
      continue
    }
    if (c === ",") {
      tokens.push({ type: "comma", value: "," })
      i++
      continue
    }

    // CSS custom property `--name` (used inside var()) — an identifier, not
    // two minus operators. Must precede the sign/number handling.
    if (c === "-" && src[i + 1] === "-") {
      let j = i
      while (j < n && IDENT_CHAR.test(src[j])) j++
      tokens.push({ type: "ident", value: src.slice(i, j) })
      i = j
      continue
    }

    // operator OR unary sign on a number
    if (c === "+" || c === "-" || c === "*" || c === "/") {
      const isSign = (c === "+" || c === "-") && signIsUnary()
      if (!isSign) {
        tokens.push({ type: "op", value: c })
        i++
        continue
      }
      // unary sign: fall through to number scanning starting at the sign
    }

    // number (optional sign, digits, optional fraction, optional unit/%)
    if (
      DIGIT.test(c) ||
      c === "." ||
      ((c === "+" || c === "-") && signIsUnary())
    ) {
      let j = i
      if (src[j] === "+" || src[j] === "-") j++
      let sawDigit = false
      while (j < n && DIGIT.test(src[j])) {
        j++
        sawDigit = true
      }
      if (src[j] === ".") {
        j++
        while (j < n && DIGIT.test(src[j])) {
          j++
          sawDigit = true
        }
      }
      // scientific notation (e.g. 1e3) — only if a digit was seen
      if (sawDigit && (src[j] === "e" || src[j] === "E")) {
        let k = j + 1
        if (src[k] === "+" || src[k] === "-") k++
        if (k < n && DIGIT.test(src[k])) {
          k++
          while (k < n && DIGIT.test(src[k])) k++
          j = k
        }
      }
      if (!sawDigit) {
        // a lone sign or dot — bail to operator handling for the sign
        if (c === "+" || c === "-") {
          tokens.push({ type: "op", value: c })
          i++
          continue
        }
        // a stray "." — emit as an unknown ident-ish token so parse fails
        tokens.push({ type: "ident", value: "." })
        i++
        continue
      }
      // unit suffix or percent
      let unit = ""
      if (src[j] === "%") {
        unit = "%"
        j++
      } else {
        let u = j
        while (u < n && IDENT_CHAR.test(src[u])) u++
        unit = src.slice(j, u)
        j = u
      }
      tokens.push({
        type: "number",
        value: src.slice(i, j - unit.length) + unit,
      })
      i = j
      continue
    }

    // identifier (function name, var, constant, custom property after var()
    if (IDENT_START.test(c)) {
      let j = i
      while (j < n && IDENT_CHAR.test(src[j])) j++
      tokens.push({ type: "ident", value: src.slice(i, j) })
      i = j
      continue
    }

    // anything else is unrecognized — emit as ident so the parser rejects it
    tokens.push({ type: "ident", value: c })
    i++
  }

  return tokens
}

// ---------------------------------------------------------------------------
// Parser — recursive descent with precedence
// ---------------------------------------------------------------------------

interface ParseError {
  message: string
}

class Parser {
  private pos = 0
  error: ParseError | null = null

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null
  }

  private next(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos++] : null
  }

  private fail(message: string): null {
    if (!this.error) this.error = { message }
    return null
  }

  atEnd(): boolean {
    return this.pos >= this.tokens.length
  }

  /** Entry: the whole source must be a single calc-family function call. */
  parseRoot(): CalcNode | null {
    const node = this.parseFactor()
    if (node === null) return null
    if (!this.atEnd()) return this.fail("unexpected trailing tokens")
    if (node.kind !== "fn") return this.fail("expected a calc-family function")
    return node
  }

  // expr := term (('+' | '-') term)*   (left-associative)
  private parseExpr(): CalcNode | null {
    let left = this.parseTerm()
    if (left === null) return null
    for (;;) {
      const t = this.peek()
      if (t && t.type === "op" && (t.value === "+" || t.value === "-")) {
        this.next()
        const right = this.parseTerm()
        if (right === null) return this.fail("expected operand after operator")
        left = { kind: "binary", op: t.value as "+" | "-", left, right }
      } else {
        break
      }
    }
    return left
  }

  // term := factor (('*' | '/') factor)*   (left-associative, tighter)
  private parseTerm(): CalcNode | null {
    let left = this.parseFactor()
    if (left === null) return null
    for (;;) {
      const t = this.peek()
      if (t && t.type === "op" && (t.value === "*" || t.value === "/")) {
        this.next()
        const right = this.parseFactor()
        if (right === null) return this.fail("expected operand after operator")
        left = { kind: "binary", op: t.value as "*" | "/", left, right }
      } else {
        break
      }
    }
    return left
  }

  // factor := number | '(' expr ')' | name '(' args ')'
  private parseFactor(): CalcNode | null {
    const t = this.peek()
    if (t === null) return this.fail("unexpected end of expression")

    if (t.type === "number") {
      this.next()
      return {
        kind: "literal",
        value: t.value,
        dimension: dimensionOf(t.value),
      }
    }

    if (t.type === "ident" && MATH_CONSTANTS.has(t.value.toLowerCase())) {
      this.next()
      return { kind: "literal", value: t.value, dimension: "number" }
    }

    if (t.type === "lparen") {
      this.next()
      const inner = this.parseExpr()
      if (inner === null) return null
      const close = this.next()
      if (!close || close.type !== "rparen")
        return this.fail("expected closing paren")
      return { kind: "group", inner }
    }

    if (t.type === "ident") {
      // function call: ident '(' ... ')'
      const after = this.tokens[this.pos + 1]
      if (!after || after.type !== "lparen")
        return this.fail(`unexpected identifier "${t.value}"`)
      const name = t.value.toLowerCase()
      this.next() // ident
      this.next() // lparen

      if (name === "var") {
        return this.parseVarRest()
      }
      if (!CALC_FUNCTIONS.has(name)) {
        return this.fail(`unsupported function "${t.value}"`)
      }
      return this.parseFnRest(name as CalcFunctionName)
    }

    return this.fail(`unexpected token "${t.value}"`)
  }

  // var(--name [, fallback]) — captured verbatim, treated as opaque.
  private parseVarRest(): CalcNode | null {
    const nameTok = this.next()
    if (!nameTok || nameTok.type !== "ident" || !nameTok.value.startsWith("--"))
      return this.fail("var() expects a custom property name")
    const parts: string[] = [nameTok.value]
    // consume optional fallback verbatim up to the matching close paren
    let depth = 0
    for (;;) {
      const t = this.peek()
      if (t === null) return this.fail("unterminated var()")
      if (t.type === "rparen" && depth === 0) {
        this.next()
        break
      }
      if (t.type === "lparen") depth++
      if (t.type === "rparen") depth--
      parts.push(t.value)
      this.next()
    }
    const raw = `var(${parts.join(" ")})`
    return { kind: "var", name: nameTok.value, raw }
  }

  // Parse the arg list of a calc-family function, then the close paren.
  private parseFnRest(name: CalcFunctionName): CalcNode | null {
    const args: CalcNode[] = []

    // calc(): single expression, no top-level commas.
    if (name === "calc") {
      if (this.peek()?.type === "rparen")
        return this.fail("calc() requires an expression")
      const expr = this.parseExpr()
      if (expr === null) return null
      const close = this.next()
      if (!close || close.type !== "rparen")
        return this.fail("expected closing paren")
      args.push(expr)
      return { kind: "fn", name, args }
    }

    // clamp/min/max: comma-separated expression list.
    if (this.peek()?.type === "rparen")
      return this.fail(`${name}() requires at least one argument`)
    for (;;) {
      const expr = this.parseExpr()
      if (expr === null) return null
      args.push(expr)
      const t = this.peek()
      if (t && t.type === "comma") {
        this.next()
        continue
      }
      break
    }
    const close = this.next()
    if (!close || close.type !== "rparen")
      return this.fail("expected closing paren")

    if (name === "clamp" && args.length !== 3)
      return this.fail("clamp() requires exactly 3 arguments")
    if ((name === "min" || name === "max") && args.length < 1)
      return this.fail(`${name}() requires at least one argument`)

    return { kind: "fn", name, args }
  }
}

/** Parse a CSS math expression into an AST, or `null` on any syntax error. */
export function parseCalc(src: string): CalcNode | null {
  const trimmed = src.trim()
  if (trimmed === "") return null
  const parser = new Parser(tokenizeCalc(trimmed))
  return parser.parseRoot()
}

// ---------------------------------------------------------------------------
// Dimension analysis (runtime mirror of the type evaluator, var()-tolerant)
// ---------------------------------------------------------------------------

const LENGTH_UNITS: ReadonlySet<string> = new Set([
  "cqmin",
  "cqmax",
  "vmin",
  "vmax",
  "svw",
  "svh",
  "svi",
  "svb",
  "lvw",
  "lvh",
  "lvi",
  "lvb",
  "dvw",
  "dvh",
  "dvi",
  "dvb",
  "cqw",
  "cqh",
  "cqi",
  "cqb",
  "rlh",
  "rem",
  "cap",
  "rex",
  "px",
  "em",
  "ex",
  "ch",
  "ic",
  "lh",
  "vw",
  "vh",
  "vi",
  "vb",
  "cm",
  "mm",
  "in",
  "pt",
  "pc",
  "q",
])
const ANGLE_UNITS: ReadonlySet<string> = new Set(["deg", "grad", "rad", "turn"])
const TIME_UNITS: ReadonlySet<string> = new Set(["s", "ms"])
const RESOLUTION_UNITS: ReadonlySet<string> = new Set([
  "dpi",
  "dpcm",
  "dppx",
  "x",
])

const NUMBER_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/

/** Classify a single value literal (e.g. "10px", "50%", "-2") to a Dimension. */
export function dimensionOf(value: string): Dimension | null {
  const v = value.trim()
  if (v === "") return null
  if (v.endsWith("%")) {
    return NUMBER_RE.test(v.slice(0, -1)) ? "percent" : null
  }
  const m = v.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)([a-zA-Z]+)$/)
  if (m) {
    const unit = m[2].toLowerCase()
    if (LENGTH_UNITS.has(unit)) return "length"
    if (ANGLE_UNITS.has(unit)) return "angle"
    if (TIME_UNITS.has(unit)) return "time"
    if (RESOLUTION_UNITS.has(unit)) return "resolution"
    if (unit === "fr") return "flex"
    return null
  }
  if (NUMBER_RE.test(v)) return "number"
  return null
}

// A var()/opaque operand is dimension-agnostic: represented as `undefined`
// during folding so it adopts a concrete sibling dimension.
type DimOrAgnostic = Dimension | "agnostic"

function combineDim(
  a: DimOrAgnostic,
  op: "+" | "-" | "*" | "/",
  b: DimOrAgnostic,
): DimOrAgnostic | null {
  if (op === "+" || op === "-") {
    if (a === "agnostic") return b
    if (b === "agnostic") return a
    return a === b ? a : null
  }
  if (op === "*") {
    if (a === "agnostic") return b === "agnostic" ? "agnostic" : b
    if (b === "agnostic") return a
    if (a === "number") return b
    if (b === "number") return a
    return null
  }
  // "/"
  if (b === "agnostic") return a
  if (a === "agnostic") return "agnostic"
  return b === "number" ? a : null
}

function dimOfNode(node: CalcNode): DimOrAgnostic | null {
  switch (node.kind) {
    case "literal":
      return node.dimension
    case "var":
      return "agnostic"
    case "group":
      return dimOfNode(node.inner)
    case "binary": {
      const a = dimOfNode(node.left)
      if (a === null) return null
      const b = dimOfNode(node.right)
      if (b === null) return null
      return combineDim(a, node.op, b)
    }
    case "fn": {
      if (node.name === "calc") return dimOfNode(node.args[0])
      // clamp/min/max: all args must agree (agnostic adopts the concrete one)
      let acc: DimOrAgnostic | null = null
      for (const arg of node.args) {
        const d = dimOfNode(arg)
        if (d === null) return null
        if (acc === null || acc === "agnostic") {
          acc = d
        } else if (d !== "agnostic" && d !== acc) {
          return null
        }
      }
      return acc
    }
  }
}

/** The dimension a parsed expression resolves to, or `null` on a violation. */
export function calcDimension(node: CalcNode): Dimension | null {
  const d = dimOfNode(node)
  if (d === null) return null
  if (d === "agnostic") return "number" // wholly-opaque expr → number-tolerant
  return d
}

// ---------------------------------------------------------------------------
// Facade
// ---------------------------------------------------------------------------

export interface EvaluateResult {
  node: CalcNode | null
  dimension: Dimension | null
  error: string | null
}

/** Parse + dimension-check in one call. UI-friendly. */
export function evaluateCalc(src: string): EvaluateResult {
  const node = parseCalc(src)
  if (node === null) {
    return { node: null, dimension: null, error: "Invalid CSS math syntax" }
  }
  const dimension = calcDimension(node)
  if (dimension === null) {
    return {
      node,
      dimension: null,
      error: "Incompatible dimensions (unit mismatch)",
    }
  }
  return { node, dimension, error: null }
}

// ---------------------------------------------------------------------------
// computeCalc — numeric evaluation where units are resolvable
// ---------------------------------------------------------------------------

export interface ComputeContext {
  /** Viewport width in px — resolves vw/vmin/etc. Required. */
  viewport: number
  /** Viewport height in px — resolves vh. Defaults to `viewport`. */
  viewportHeight?: number
  /** Root font size in px — resolves rem. Defaults to 16. */
  rootFontSize?: number
  /** Element font size in px — resolves em. Defaults to `rootFontSize`. */
  fontSize?: number
  /** The basis a percentage resolves against. If omitted, `%` blocks compute. */
  basis?: number
}

// Resolve a single value literal to px (or its raw number for unitless),
// or null when it cannot be resolved in this context.
function resolveLiteral(value: string, ctx: ComputeContext): number | null {
  const v = value.trim()
  const root = ctx.rootFontSize ?? 16
  const fontSize = ctx.fontSize ?? root
  const vw = ctx.viewport / 100
  const vh = (ctx.viewportHeight ?? ctx.viewport) / 100

  if (v.endsWith("%")) {
    const num = Number(v.slice(0, -1))
    if (!Number.isFinite(num)) return null
    return ctx.basis === undefined ? null : (num / 100) * ctx.basis
  }

  const m = v.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)([a-zA-Z]*)$/)
  if (!m) {
    const lower = v.toLowerCase()
    if (lower === "pi") return Math.PI
    if (lower === "e") return Math.E
    if (lower === "infinity") return Number.POSITIVE_INFINITY
    if (lower === "-infinity") return Number.NEGATIVE_INFINITY
    if (lower === "nan") return Number.NaN
    return null
  }
  const num = Number(m[1])
  if (!Number.isFinite(num) && m[2] !== "") return null
  const unit = m[2].toLowerCase()

  switch (unit) {
    case "":
      return num
    case "px":
      return num
    case "rem":
    case "rlh":
      return num * root
    case "em":
    case "lh":
      return num * fontSize
    case "vw":
    case "vi":
      return num * vw
    case "vh":
    case "vb":
      return num * vh
    case "vmin":
      return num * Math.min(vw, vh)
    case "vmax":
      return num * Math.max(vw, vh)
    case "cm":
      return num * 96 * (1 / 2.54)
    case "mm":
      return num * 96 * (1 / 25.4)
    case "in":
      return num * 96
    case "pt":
      return num * (96 / 72)
    case "pc":
      return num * 16
    case "q":
      return num * 96 * (1 / 25.4) * 0.25
    default:
      // Unit we don't numerically resolve (deg/s/etc.) — treat as a raw number
      // for value purposes; dimensional validity is checked separately.
      return num
  }
}

/**
 * Numerically evaluate an expression to a px value (or unitless number),
 * resolving units against `ctx`. Returns `null` when a `var()` or an
 * unresolvable `%` blocks the computation.
 */
export function computeCalc(
  node: CalcNode,
  ctx: ComputeContext,
): number | null {
  switch (node.kind) {
    case "literal":
      return resolveLiteral(node.value, ctx)
    case "var":
      return null // opaque — cannot compute
    case "group":
      return computeCalc(node.inner, ctx)
    case "binary": {
      const a = computeCalc(node.left, ctx)
      if (a === null) return null
      const b = computeCalc(node.right, ctx)
      if (b === null) return null
      switch (node.op) {
        case "+":
          return a + b
        case "-":
          return a - b
        case "*":
          return a * b
        case "/":
          return b === 0 ? null : a / b
      }
      return null
    }
    case "fn": {
      const vals: number[] = []
      for (const arg of node.args) {
        const v = computeCalc(arg, ctx)
        if (v === null) return null
        vals.push(v)
      }
      switch (node.name) {
        case "calc":
          return vals[0]
        case "min":
          return Math.min(...vals)
        case "max":
          return Math.max(...vals)
        case "clamp": {
          const [lo, pref, hi] = vals
          return Math.min(Math.max(pref, lo), hi)
        }
      }
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// formatCalc — canonical serialization
// ---------------------------------------------------------------------------

function formatNode(node: CalcNode): string {
  switch (node.kind) {
    case "literal":
      return node.value
    case "var":
      return node.raw
    case "group":
      return `(${formatNode(node.inner)})`
    case "binary":
      return `${formatNode(node.left)} ${node.op} ${formatNode(node.right)}`
    case "fn":
      return `${node.name}(${node.args.map(formatNode).join(", ")})`
  }
}

/** Re-serialize a parsed expression with canonical spacing. */
export function formatCalc(node: CalcNode): CalcString {
  return formatNode(node) as CalcString
}

export type { CalcString }
