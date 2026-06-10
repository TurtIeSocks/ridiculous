// =====================================================================
// coordinate-input.types.ts — tiered types for a GeoJSON Position.
//
// casual / intellisense: `Position` tuple (the value type).
// strict (opt-in, literals only): `coordinate([lon, lat])` validates a
//   numeric-literal tuple by stringifying each literal and reusing the
//   ridiculous-type-kit digit range machinery. See spec §3.7.
// =====================================================================

import type {
  And,
  IntRange,
  IsNumberInClosedRange,
} from "@/lib/ridiculous-type-kit"

// --- value type (casual / intellisense tier) -------------------------

export type Position = [number, number] | [number, number, number]

// --- string-form range predicates (kit-based) ------------------------

// |value| ≤ 180: integers 0..180; a non-zero fraction only below 180;
// exactly 180 requires an all-zero fraction (180.0). Mirrors IsNumber0To360.
type Magnitude180<S extends string> = IsNumberInClosedRange<
  S,
  `${IntRange<0, 181>}`,
  `${IntRange<0, 180>}`,
  "180"
>
type Magnitude90<S extends string> = IsNumberInClosedRange<
  S,
  `${IntRange<0, 91>}`,
  `${IntRange<0, 90>}`,
  "90"
>

// Sign-aware: strip a single leading "-", then magnitude-check.
export type IsLongitude<S extends string> = S extends `-${infer R}`
  ? Magnitude180<R>
  : Magnitude180<S>
export type IsLatitude<S extends string> = S extends `-${infer R}`
  ? Magnitude90<R>
  : Magnitude90<S>

// --- numeric-literal tier (the opt-in flex) --------------------------

type IsNever<T> = [T] extends [never] ? true : false

// `${N}` stringifies the number literal; widened `number` → `string`
// (so non-literals reject — this is an authoring helper only). Then the
// string predicate decides. Booleans returned so `And` can compose.
type ValidLon<N extends number> =
  IsNever<
    `${N}` extends infer S extends string
      ? IsLongitude<S> extends true
        ? N
        : never
      : never
  > extends true
    ? false
    : true
type ValidLat<N extends number> =
  IsNever<
    `${N}` extends infer S extends string
      ? IsLatitude<S> extends true
        ? N
        : never
      : never
  > extends true
    ? false
    : true

export type CoordinateLiteral<P extends readonly number[]> = P extends
  | readonly [infer Lon extends number, infer Lat extends number]
  | readonly [infer Lon extends number, infer Lat extends number, number]
  ? And<ValidLon<Lon>, ValidLat<Lat>> extends true
    ? P
    : never
  : never

// Call-site helper: pass a numeric-literal tuple, get it back validated.
// `const` infers the literal tuple; `P & CoordinateLiteral<P>` collapses
// to `never` (a type error) when any axis is out of range or arity ≠ 2–3.
// Return is `Readonly<P>`: the `& CoordinateLiteral<P>` intersection on the
// parameter suppresses the `const` deep-readonly inference, so `P` resolves
// to a mutable tuple — `Readonly<P>` restores the `readonly [lon, lat]` shape
// the literal tuple actually represents.
export const coordinate = <const P extends readonly number[]>(
  value: P & CoordinateLiteral<P>,
): Readonly<P> => value
