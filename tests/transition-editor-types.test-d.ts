import { expectTypeOf, test } from "vitest"
import type { TransitionEditor } from "@/components/ui/transition-editor"
import type {
  AnimationLayer,
  AnimationLayerLiteral,
  AnimationLiteral,
  AnimationNamesOf,
  AnimationString,
  EditorMode,
  LayerCountOf,
  LayersOf,
  TransitionEditorState,
  TransitionEditorStringMap,
  TransitionLayer,
  TransitionLayerLiteral,
  TransitionLiteral,
  TransitionPropertiesOf,
  TransitionString,
} from "@/components/ui/transition-editor/transition-editor.types"
import {
  cssAnimation,
  cssTransition,
} from "@/components/ui/transition-editor/transition-editor.types"

// ===========================================================================
// TransitionLiteral — accept
// ===========================================================================

test("transition: a layer of kind-classified tokens keeps the literal", () => {
  expectTypeOf<
    TransitionLiteral<"opacity 200ms ease-in">
  >().toEqualTypeOf<"opacity 200ms ease-in">()
  expectTypeOf<
    TransitionLiteral<"transform 0.3s 100ms ease-out">
  >().toEqualTypeOf<"transform 0.3s 100ms ease-out">()
  expectTypeOf<TransitionLiteral<"all 200ms">>().toEqualTypeOf<"all 200ms">()
  // duration only — property defaults to "all" at runtime, still valid tokens
  expectTypeOf<TransitionLiteral<"200ms">>().toEqualTypeOf<"200ms">()
  // the <transition-behavior> flag
  expectTypeOf<
    TransitionLiteral<"opacity 200ms 100ms ease allow-discrete">
  >().toEqualTypeOf<"opacity 200ms 100ms ease allow-discrete">()
  // a functional easing stays one token (paren-aware split)
  expectTypeOf<
    TransitionLiteral<"color 100ms cubic-bezier(0.4, 0, 0.2, 1)">
  >().toEqualTypeOf<"color 100ms cubic-bezier(0.4, 0, 0.2, 1)">()
})

test("transition: a comma-separated list of valid layers keeps the literal", () => {
  expectTypeOf<
    TransitionLiteral<"opacity 200ms ease, transform 0.3s ease-out">
  >().toEqualTypeOf<"opacity 200ms ease, transform 0.3s ease-out">()
})

test("transition: none is valid; empty is never", () => {
  expectTypeOf<TransitionLiteral<"none">>().toEqualTypeOf<"none">()
  expectTypeOf<TransitionLiteral<"">>().toBeNever()
})

// ===========================================================================
// TransitionLiteral — reject (cardinality / unknown / easing / calc)
// ===========================================================================

test("transition: more than two <time> tokens is never", () => {
  expectTypeOf<TransitionLiteral<"opacity 200ms 100ms 50ms ease">>().toBeNever()
})

test("transition: more than one easing is never", () => {
  expectTypeOf<TransitionLiteral<"opacity ease ease-in">>().toBeNever()
})

test("transition: more than one property ident is never", () => {
  expectTypeOf<TransitionLiteral<"opacity color 200ms">>().toBeNever()
})

test("transition: a doubled allow-discrete is never", () => {
  expectTypeOf<
    TransitionLiteral<"opacity 200ms allow-discrete allow-discrete">
  >().toBeNever()
})

test("transition: an unknown / non-ident token is never", () => {
  // `@x` is not a valid <custom-ident> — fails the ident char check
  expectTypeOf<TransitionLiteral<"opacity 200ms @x">>().toBeNever()
})

test("transition: an invalid easing function is never (via EasingLiteral)", () => {
  // cubic-bezier x must be in [0,1] — 2 is out of range
  expectTypeOf<
    TransitionLiteral<"opacity 200ms cubic-bezier(2, 0, 0, 0)">
  >().toBeNever()
})

test("transition: calc()/var() inside a token is never (undecidable)", () => {
  expectTypeOf<TransitionLiteral<"opacity calc(200ms + 1s)">>().toBeNever()
  expectTypeOf<TransitionLiteral<"opacity var(--d)">>().toBeNever()
})

test("transition: one bad layer fails the whole list", () => {
  expectTypeOf<
    TransitionLiteral<"opacity 200ms, color 200ms 100ms 50ms">
  >().toBeNever()
})

// ===========================================================================
// AnimationLiteral — accept
// ===========================================================================

test("animation: a layer of kind-classified tokens keeps the literal", () => {
  expectTypeOf<
    AnimationLiteral<"spin 1s ease-in-out infinite">
  >().toEqualTypeOf<"spin 1s ease-in-out infinite">()
  expectTypeOf<
    AnimationLiteral<"slide 1s 200ms ease 3 alternate both paused">
  >().toEqualTypeOf<"slide 1s 200ms ease 3 alternate both paused">()
  expectTypeOf<AnimationLiteral<"1s">>().toEqualTypeOf<"1s">()
  expectTypeOf<
    AnimationLiteral<"pulse 2s infinite alternate">
  >().toEqualTypeOf<"pulse 2s infinite alternate">()
})

test("animation: a comma-separated list of valid layers keeps the literal", () => {
  expectTypeOf<
    AnimationLiteral<"spin 1s linear infinite, pulse 2s ease">
  >().toEqualTypeOf<"spin 1s linear infinite, pulse 2s ease">()
})

test("animation: none is valid; empty is never", () => {
  expectTypeOf<AnimationLiteral<"none">>().toEqualTypeOf<"none">()
  expectTypeOf<AnimationLiteral<"">>().toBeNever()
})

// ===========================================================================
// AnimationLiteral — reject
// ===========================================================================

test("animation: more than one iteration-count is never", () => {
  expectTypeOf<AnimationLiteral<"spin 1s 2 3">>().toBeNever()
})

test("animation: more than one direction is never", () => {
  expectTypeOf<AnimationLiteral<"spin alternate reverse">>().toBeNever()
})

test("animation: an unknown token is never", () => {
  expectTypeOf<AnimationLiteral<"spin 1s up">>().toBeNever()
})

test("animation: an invalid easing is never (steps n must be positive)", () => {
  expectTypeOf<AnimationLiteral<"spin 1s steps(0)">>().toBeNever()
})

test("animation: calc() is never (undecidable)", () => {
  expectTypeOf<AnimationLiteral<"spin calc(1s)">>().toBeNever()
})

// ===========================================================================
// Per-layer validators (a comma-list is NOT one layer)
// ===========================================================================

test("TransitionLayerLiteral validates exactly one layer", () => {
  expectTypeOf<
    TransitionLayerLiteral<"opacity 200ms ease">
  >().toEqualTypeOf<"opacity 200ms ease">()
  expectTypeOf<
    TransitionLayerLiteral<"opacity 200ms, color 100ms">
  >().toBeNever()
})

test("AnimationLayerLiteral validates exactly one layer", () => {
  expectTypeOf<
    AnimationLayerLiteral<"spin 1s infinite">
  >().toEqualTypeOf<"spin 1s infinite">()
  expectTypeOf<AnimationLayerLiteral<"spin 1s, pulse 2s">>().toBeNever()
})

// ===========================================================================
// Call-site helpers
// ===========================================================================

test("cssTransition validates at the call site", () => {
  const a = cssTransition("opacity 200ms ease-in")
  expectTypeOf(a).toEqualTypeOf<"opacity 200ms ease-in">()
  // @ts-expect-error three <time> tokens
  cssTransition("opacity 200ms 100ms 50ms ease")
  // @ts-expect-error calc() is undecidable at the strict tier
  cssTransition("opacity calc(1s)")
  // @ts-expect-error one bad layer fails the whole list
  cssTransition("opacity 200ms, color 200ms 100ms 50ms")
})

test("cssAnimation validates at the call site", () => {
  const a = cssAnimation("spin 1s infinite")
  expectTypeOf(a).toEqualTypeOf<"spin 1s infinite">()
  // @ts-expect-error two iteration counts
  cssAnimation("spin 1s 2 3")
  // @ts-expect-error unknown token
  cssAnimation("spin 1s up")
})

// ===========================================================================
// Utility types
// ===========================================================================

test("LayersOf splits the raw per-layer strings", () => {
  expectTypeOf<LayersOf<"opacity 1s, color 2s">>().toEqualTypeOf<
    ["opacity 1s", "color 2s"]
  >()
  expectTypeOf<LayersOf<"opacity 1s">>().toEqualTypeOf<["opacity 1s"]>()
  expectTypeOf<LayersOf<"none">>().toEqualTypeOf<[]>()
})

test("LayerCountOf counts the layers", () => {
  expectTypeOf<
    LayerCountOf<"opacity 1s, color 2s, all 3s">
  >().toEqualTypeOf<3>()
  expectTypeOf<LayerCountOf<"spin 1s">>().toEqualTypeOf<1>()
  expectTypeOf<LayerCountOf<"none">>().toEqualTypeOf<0>()
})

test("TransitionPropertiesOf / AnimationNamesOf extract the ident slots", () => {
  expectTypeOf<
    TransitionPropertiesOf<"opacity 1s, transform 2s">
  >().toEqualTypeOf<["opacity", "transform"]>()
  expectTypeOf<AnimationNamesOf<"spin 1s, pulse 2s">>().toEqualTypeOf<
    ["spin", "pulse"]
  >()
})

// ===========================================================================
// Suggestion strings + map + keys
// ===========================================================================

test("suggestion unions + map + keys", () => {
  expectTypeOf<"opacity 200ms ease">().toMatchTypeOf<TransitionString>()
  expectTypeOf<"none">().toMatchTypeOf<TransitionString>()
  expectTypeOf<"spin 1s infinite">().toMatchTypeOf<AnimationString>()
  expectTypeOf<"none">().toMatchTypeOf<AnimationString>()
  expectTypeOf<
    TransitionEditorStringMap["transition"]
  >().toEqualTypeOf<TransitionString>()
  expectTypeOf<
    TransitionEditorStringMap["animation"]
  >().toEqualTypeOf<AnimationString>()
  expectTypeOf<EditorMode>().toEqualTypeOf<keyof TransitionEditorStringMap>()
})

// ===========================================================================
// Internal state — discriminated union on `mode`
// ===========================================================================

test("TransitionLayer / AnimationLayer records", () => {
  const t: TransitionLayer = {
    property: "opacity",
    duration: "200ms",
    delay: "100ms",
    easing: "ease-in",
    allowDiscrete: true,
  }
  const a: AnimationLayer = {
    name: "spin",
    duration: "1s",
    delay: "0s",
    easing: "linear",
    iterationCount: "infinite",
    direction: "alternate",
    fillMode: "both",
    playState: "running",
  }
  expectTypeOf(t).toMatchTypeOf<TransitionLayer>()
  expectTypeOf(a).toMatchTypeOf<AnimationLayer>()
})

test("TransitionEditorState is discriminated on mode", () => {
  const ts: TransitionEditorState = { mode: "transition", layers: [] }
  const as: TransitionEditorState = { mode: "animation", layers: [] }
  expectTypeOf(ts).toMatchTypeOf<TransitionEditorState>()
  expectTypeOf(as).toMatchTypeOf<TransitionEditorState>()
  expectTypeOf<TransitionEditorState["mode"]>().toEqualTypeOf<EditorMode>()
})

// ===========================================================================
// Component onChange — returns the open suggestion union for its mode
// ===========================================================================

test("TransitionEditor onChange returns a string union", () => {
  type P = Parameters<typeof TransitionEditor>[0]
  // default mode = transition
  expectTypeOf<P["onChange"]>().toMatchTypeOf<
    (value: TransitionString) => void
  >()
})
