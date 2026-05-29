// =====================================================================
// if-function.helpers.ts
//
// Pure runtime parse / format for the CSS `if()` conditional value function.
// This is the SUPERSET of the strict type tier: it validates the wrapper, the
// top-level `;` branch split, the first top-level `:` per branch, the condition
// kind, paren balance, and value presence — but keeps condition bodies + values
// verbatim (it does NOT parse the media/supports/style grammar, per design §7).
// It is the single source of truth the UI drives off.
//
//   if( <branch> [ ; <branch> ]* )
//   <branch>    = <condition> : <value>
//   <condition> = media(...) | supports(...) | style(...) | else (last only)
// =====================================================================

import type { ConditionKind, IfBranch } from "./if-function.types"

// ---------------------------------------------------------------------------
// Top-level splitter (paren-aware, runtime mirror of the kit combinator)
// ---------------------------------------------------------------------------

/** Split `src` on `sep` only at bracket depth 0. */
function splitTopLevel(src: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ""
  for (const ch of src) {
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    if (ch === sep && depth === 0) {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

/** Index of the first `:` at bracket depth 0, or -1. */
function firstTopLevelColon(src: string): number {
  let depth = 0
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    else if (ch === ":" && depth === 0) return i
  }
  return -1
}

/** True iff every `(`/`[` is matched and depth never goes negative. */
function isBalanced(src: string): boolean {
  let depth = 0
  for (const ch of src) {
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") {
      depth--
      if (depth < 0) return false
    }
  }
  return depth === 0
}

// ---------------------------------------------------------------------------
// Condition classification
// ---------------------------------------------------------------------------

interface ParsedCondition {
  kind: ConditionKind
  condition: string
}

const KIND_RE = /^(media|supports|style)\(([\s\S]*)\)$/

/**
 * Classify a condition string into a kind + inner body. `else` → empty body.
 * Returns null on an unknown kind or an unbalanced / empty-body kind call.
 */
function parseCondition(raw: string): ParsedCondition | null {
  const cond = raw.trim()
  if (cond === "else") return { kind: "else", condition: "" }
  const m = cond.match(KIND_RE)
  if (m === null) return null
  const kind = m[1] as ConditionKind
  const body = m[2]
  if (body.trim() === "" || !isBalanced(body)) return null
  return { kind, condition: body.trim() }
}

// ---------------------------------------------------------------------------
// parseIf — string → branches | null
// ---------------------------------------------------------------------------

const IF_WRAPPER_RE = /^if\(([\s\S]*)\)$/

/**
 * Parse a CSS `if()` value into typed branches, or `null` on any error:
 * bad wrapper, no branches, a branch without a top-level colon, an empty value,
 * an unknown condition kind, an unbalanced condition body, or `else` not last.
 * A trailing `;` (and interior empty branches) are tolerated (dropped).
 */
export function parseIf(src: string): IfBranch[] | null {
  const trimmed = src.trim()
  const wrap = trimmed.match(IF_WRAPPER_RE)
  if (wrap === null || !isBalanced(trimmed)) return null
  const body = wrap[1]

  const branchStrings = splitTopLevel(body, ";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (branchStrings.length === 0) return null

  const branches: IfBranch[] = []
  for (let i = 0; i < branchStrings.length; i++) {
    const branchStr = branchStrings[i]
    const colon = firstTopLevelColon(branchStr)
    if (colon === -1) return null
    const condRaw = branchStr.slice(0, colon)
    const value = branchStr.slice(colon + 1).trim()
    if (value === "") return null
    const parsed = parseCondition(condRaw)
    if (parsed === null) return null
    // else only allowed as the final branch
    if (parsed.kind === "else" && i !== branchStrings.length - 1) return null
    branches.push({ kind: parsed.kind, condition: parsed.condition, value })
  }
  return branches
}

// ---------------------------------------------------------------------------
// branchToCss / format — canonical serialization
// ---------------------------------------------------------------------------

/** Serialize one branch: `else: value` or `kind(condition): value`. */
export function branchToCss(branch: IfBranch): string {
  if (branch.kind === "else") return `else: ${branch.value}`
  return `${branch.kind}(${branch.condition}): ${branch.value}`
}

/** Canonical re-serialization of a branch list → `if( b1; b2; … )`. */
export function formatIf(branches: IfBranch[]): string {
  return `if(${branches.map(branchToCss).join("; ")})`
}

// ---------------------------------------------------------------------------
// defaults — seed a fresh branch
// ---------------------------------------------------------------------------

const DEFAULT_CONDITION: Record<ConditionKind, string> = {
  media: "width >= 600px",
  supports: "display: grid",
  style: "--x: 1",
  else: "",
}

/** A sensible default branch for a kind (defaults to a media branch). */
export function defaultBranch(kind: ConditionKind = "media"): IfBranch {
  return { kind, condition: DEFAULT_CONDITION[kind], value: "red" }
}

// ---------------------------------------------------------------------------
// branchCount — runtime mirror of BranchCountOf (invalid → 0)
// ---------------------------------------------------------------------------

/** The number of branches in a value, or 0 if it does not parse. */
export function branchCount(src: string): number {
  const branches = parseIf(src)
  return branches === null ? 0 : branches.length
}
