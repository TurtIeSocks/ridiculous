// =====================================================================
// ridiculous-type-kit — shared template-literal type machinery.
//
// Pure types only (no runtime). Boolean predicates return `true`/`false`;
// compose with And/Or/Not then collapse with KeepIf<B, S> to build an
// `S | never` validator.
//
// CALL-SITE HELPER IDIOM (copy into each component's *.types.ts — cannot
// be factored into a runtime helper because TS has no higher-kinded types):
//
//   export const cssThing = <S extends string>(v: S & CssThingLiteral<S>): S => v
// =====================================================================

export type * from "./combinators"
export type * from "./dimensions"
export type * from "./primitives"
