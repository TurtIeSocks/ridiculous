import { expectTypeOf, test } from "vitest"
import type { ClipPathEditor } from "@/components/ui/clip-path-editor"
import type {
  BasicShapeName,
  ClipPathLiteral,
  ClipPathShape,
  ClipPathShapeState,
  ClipPathState,
  ClipPathString,
  ClipPathStringMap,
  GeometryBox,
  GeometryBoxOf,
  ShapeOf,
  VertexCountOf,
} from "@/components/ui/clip-path-editor/clip-path-editor.types"
import { cssClipPath } from "@/components/ui/clip-path-editor/clip-path-editor.types"

// ---------------------------------------------------------------------------
// Strict tier — inset (1-4 length-percentages, optional `round` tail)
// ---------------------------------------------------------------------------

test("inset accepts 1-4 length-percentages", () => {
  expectTypeOf<ClipPathLiteral<"inset(10px)">>().toEqualTypeOf<"inset(10px)">()
  expectTypeOf<
    ClipPathLiteral<"inset(10px 20px)">
  >().toEqualTypeOf<"inset(10px 20px)">()
  expectTypeOf<
    ClipPathLiteral<"inset(1px 2px 3px)">
  >().toEqualTypeOf<"inset(1px 2px 3px)">()
  expectTypeOf<
    ClipPathLiteral<"inset(1px 2px 3px 4px)">
  >().toEqualTypeOf<"inset(1px 2px 3px 4px)">()
  expectTypeOf<
    ClipPathLiteral<"inset(10% 20%)">
  >().toEqualTypeOf<"inset(10% 20%)">()
})

test("inset round tail is weak-validated (accepted)", () => {
  expectTypeOf<
    ClipPathLiteral<"inset(10px round 8px)">
  >().toEqualTypeOf<"inset(10px round 8px)">()
  expectTypeOf<
    ClipPathLiteral<"inset(10% 20% round 4px 8px)">
  >().toEqualTypeOf<"inset(10% 20% round 4px 8px)">()
})

test("inset rejects empty, bad dimension, arity > 4, empty round tail", () => {
  expectTypeOf<ClipPathLiteral<"inset()">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"inset(45deg)">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"inset(1px 2px 3px 4px 5px)">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"inset(10px round)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — circle (one radius lp|keyword, optional `at <position>`)
// ---------------------------------------------------------------------------

test("circle accepts empty / lp radius / keyword radius / at position", () => {
  expectTypeOf<ClipPathLiteral<"circle()">>().toEqualTypeOf<"circle()">()
  expectTypeOf<ClipPathLiteral<"circle(50%)">>().toEqualTypeOf<"circle(50%)">()
  expectTypeOf<
    ClipPathLiteral<"circle(10px)">
  >().toEqualTypeOf<"circle(10px)">()
  expectTypeOf<
    ClipPathLiteral<"circle(closest-side)">
  >().toEqualTypeOf<"circle(closest-side)">()
  expectTypeOf<
    ClipPathLiteral<"circle(farthest-side)">
  >().toEqualTypeOf<"circle(farthest-side)">()
  expectTypeOf<
    ClipPathLiteral<"circle(50% at center)">
  >().toEqualTypeOf<"circle(50% at center)">()
  expectTypeOf<
    ClipPathLiteral<"circle(5rem at 10px 20px)">
  >().toEqualTypeOf<"circle(5rem at 10px 20px)">()
  expectTypeOf<
    ClipPathLiteral<"circle(at left top)">
  >().toEqualTypeOf<"circle(at left top)">()
})

test("circle rejects an angle radius and a two-radius (ellipse) form", () => {
  expectTypeOf<ClipPathLiteral<"circle(45deg)">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"circle(50% 60%)">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"circle(50% at far)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — ellipse (TWO radii lp|keyword, optional `at <position>`)
// ---------------------------------------------------------------------------

test("ellipse accepts empty / two radii / keywords / at position", () => {
  expectTypeOf<ClipPathLiteral<"ellipse()">>().toEqualTypeOf<"ellipse()">()
  expectTypeOf<
    ClipPathLiteral<"ellipse(50% 60%)">
  >().toEqualTypeOf<"ellipse(50% 60%)">()
  expectTypeOf<
    ClipPathLiteral<"ellipse(10px 20px at center)">
  >().toEqualTypeOf<"ellipse(10px 20px at center)">()
  expectTypeOf<
    ClipPathLiteral<"ellipse(closest-side farthest-side)">
  >().toEqualTypeOf<"ellipse(closest-side farthest-side)">()
  expectTypeOf<
    ClipPathLiteral<"ellipse(50% 60% at 25% 75%)">
  >().toEqualTypeOf<"ellipse(50% 60% at 25% 75%)">()
})

test("ellipse rejects a single radius and a bad dimension", () => {
  expectTypeOf<ClipPathLiteral<"ellipse(50%)">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"ellipse(45deg 50%)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — polygon (optional fill-rule, variadic vertex list)
// ---------------------------------------------------------------------------

test("polygon accepts a vertex list, with an optional fill-rule", () => {
  expectTypeOf<
    ClipPathLiteral<"polygon(0% 0%, 100% 0%, 50% 100%)">
  >().toEqualTypeOf<"polygon(0% 0%, 100% 0%, 50% 100%)">()
  expectTypeOf<
    ClipPathLiteral<"polygon(0px 0px, 100% 0px, 50% 100%)">
  >().toEqualTypeOf<"polygon(0px 0px, 100% 0px, 50% 100%)">()
  expectTypeOf<
    ClipPathLiteral<"polygon(nonzero, 0% 0%, 100% 100%)">
  >().toEqualTypeOf<"polygon(nonzero, 0% 0%, 100% 100%)">()
  expectTypeOf<
    ClipPathLiteral<"polygon(evenodd, 0% 0%, 100% 0%, 50% 100%)">
  >().toEqualTypeOf<"polygon(evenodd, 0% 0%, 100% 0%, 50% 100%)">()
})

test("polygon rejects an odd-token vertex, an empty list, a bad coordinate", () => {
  expectTypeOf<ClipPathLiteral<"polygon(0% 0%, 100% 0%, 50%)">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"polygon()">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"polygon(0%)">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"polygon(45deg 0%, 1px 1px)">>().toBeNever()
})

test("polygon weak-validates vertices past the depth cap (still accepted)", () => {
  // 36 vertices — beyond the 32-vertex cap. The tail is accepted without
  // per-coordinate validation, so the literal is preserved.
  type Big =
    "polygon(0% 0%, 1% 1%, 2% 2%, 3% 3%, 4% 4%, 5% 5%, 6% 6%, 7% 7%, 8% 8%, 9% 9%, 10% 10%, 11% 11%, 12% 12%, 13% 13%, 14% 14%, 15% 15%, 16% 16%, 17% 17%, 18% 18%, 19% 19%, 20% 20%, 21% 21%, 22% 22%, 23% 23%, 24% 24%, 25% 25%, 26% 26%, 27% 27%, 28% 28%, 29% 29%, 30% 30%, 31% 31%, 32% 32%, 33% 33%, 34% 34%, 35% 35%)"
  expectTypeOf<ClipPathLiteral<Big>>().toEqualTypeOf<Big>()
})

// ---------------------------------------------------------------------------
// Strict tier — geometry box (leading OR trailing, at most one; bare box ok)
// ---------------------------------------------------------------------------

test("geometry box: bare, leading, and trailing all accept", () => {
  expectTypeOf<ClipPathLiteral<"border-box">>().toEqualTypeOf<"border-box">()
  expectTypeOf<ClipPathLiteral<"content-box">>().toEqualTypeOf<"content-box">()
  expectTypeOf<
    ClipPathLiteral<"circle(50%) border-box">
  >().toEqualTypeOf<"circle(50%) border-box">()
  expectTypeOf<
    ClipPathLiteral<"padding-box ellipse(50% 60%)">
  >().toEqualTypeOf<"padding-box ellipse(50% 60%)">()
  expectTypeOf<
    ClipPathLiteral<"polygon(0% 0%, 100% 0%, 50% 100%) margin-box">
  >().toEqualTypeOf<"polygon(0% 0%, 100% 0%, 50% 100%) margin-box">()
})

test("geometry box: double box and unknown box reject", () => {
  expectTypeOf<ClipPathLiteral<"border-box circle() padding-box">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"wobble-box">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"wobble-box circle(50%)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — none / empty / unknown shape / calc undecidable
// ---------------------------------------------------------------------------

test("none is valid; empty / unknown shape / calc are never", () => {
  expectTypeOf<ClipPathLiteral<"none">>().toEqualTypeOf<"none">()
  expectTypeOf<ClipPathLiteral<"">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"wobble(0% 0%)">>().toBeNever()
  expectTypeOf<ClipPathLiteral<"circle(calc(50% + 10px))">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Call-site helper
// ---------------------------------------------------------------------------

test("cssClipPath validates at the call site", () => {
  const a = cssClipPath("polygon(0% 0%, 100% 0%, 50% 100%)")
  expectTypeOf(a).toEqualTypeOf<"polygon(0% 0%, 100% 0%, 50% 100%)">()
  const b = cssClipPath("circle(50% at center) border-box")
  expectTypeOf(b).toEqualTypeOf<"circle(50% at center) border-box">()

  // @ts-expect-error inset wants a length-percentage, not an angle
  cssClipPath("inset(45deg)")
  // @ts-expect-error circle radius cannot be two values
  cssClipPath("circle(50% 60%)")
  // @ts-expect-error ellipse needs zero or two radii, not one
  cssClipPath("ellipse(50%)")
  // @ts-expect-error a polygon vertex needs exactly two coordinates
  cssClipPath("polygon(0% 0%, 100% 0%, 50%)")
  // @ts-expect-error at most one geometry box
  cssClipPath("border-box circle() padding-box")
  // @ts-expect-error unknown basic shape
  cssClipPath("wobble(0% 0%)")
  // @ts-expect-error calc() is undecidable at the strict tier
  cssClipPath("circle(calc(50% + 10px))")
})

// ---------------------------------------------------------------------------
// Suggestion strings + map
// ---------------------------------------------------------------------------

test("ClipPathString suggestion union + map + keys", () => {
  expectTypeOf<"circle(50%)">().toMatchTypeOf<ClipPathString>()
  expectTypeOf<"inset(10px)">().toMatchTypeOf<ClipPathString>()
  expectTypeOf<"polygon(0% 0%, 100% 100%)">().toMatchTypeOf<ClipPathString>()
  expectTypeOf<"circle(50%) border-box">().toMatchTypeOf<ClipPathString>()
  expectTypeOf<"border-box ellipse(1px 2px)">().toMatchTypeOf<ClipPathString>()
  expectTypeOf<"border-box">().toMatchTypeOf<ClipPathString>()
  expectTypeOf<"none">().toMatchTypeOf<ClipPathString>()
  expectTypeOf<
    ClipPathStringMap["circle"]
  >().toEqualTypeOf<`circle(${string})`>()
  expectTypeOf<
    ClipPathStringMap["polygon"]
  >().toEqualTypeOf<`polygon(${string})`>()
  expectTypeOf<ClipPathShape>().toEqualTypeOf<BasicShapeName>()
})

test("BasicShapeName and GeometryBox cover the sets", () => {
  expectTypeOf<"inset">().toMatchTypeOf<BasicShapeName>()
  expectTypeOf<"circle">().toMatchTypeOf<BasicShapeName>()
  expectTypeOf<"ellipse">().toMatchTypeOf<BasicShapeName>()
  expectTypeOf<"polygon">().toMatchTypeOf<BasicShapeName>()
  expectTypeOf<"border-box">().toMatchTypeOf<GeometryBox>()
  expectTypeOf<"fill-box">().toMatchTypeOf<GeometryBox>()
  expectTypeOf<"view-box">().toMatchTypeOf<GeometryBox>()
})

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

test("ShapeOf reports the basic shape, box, or none", () => {
  expectTypeOf<ShapeOf<"circle(50%)">>().toEqualTypeOf<"circle">()
  expectTypeOf<ShapeOf<"inset(10px)">>().toEqualTypeOf<"inset">()
  expectTypeOf<
    ShapeOf<"polygon(0% 0%, 100% 100%)">
  >().toEqualTypeOf<"polygon">()
  expectTypeOf<
    ShapeOf<"ellipse(1px 2px) border-box">
  >().toEqualTypeOf<"ellipse">()
  expectTypeOf<ShapeOf<"border-box">>().toEqualTypeOf<"box">()
  expectTypeOf<ShapeOf<"none">>().toEqualTypeOf<"none">()
})

test("VertexCountOf counts polygon vertices (0 otherwise)", () => {
  expectTypeOf<
    VertexCountOf<"polygon(0% 0%, 100% 0%, 50% 100%)">
  >().toEqualTypeOf<3>()
  expectTypeOf<
    VertexCountOf<"polygon(nonzero, 0% 0%, 100% 100%)">
  >().toEqualTypeOf<2>()
  expectTypeOf<VertexCountOf<"circle(50%)">>().toEqualTypeOf<0>()
  expectTypeOf<VertexCountOf<"none">>().toEqualTypeOf<0>()
})

test("GeometryBoxOf extracts the box keyword or none", () => {
  expectTypeOf<
    GeometryBoxOf<"circle(50%) border-box">
  >().toEqualTypeOf<"border-box">()
  expectTypeOf<
    GeometryBoxOf<"padding-box ellipse(1px 2px)">
  >().toEqualTypeOf<"padding-box">()
  expectTypeOf<GeometryBoxOf<"circle(50%)">>().toEqualTypeOf<"none">()
  expectTypeOf<GeometryBoxOf<"none">>().toEqualTypeOf<"none">()
})

// ---------------------------------------------------------------------------
// Internal state — discriminated union
// ---------------------------------------------------------------------------

test("ClipPathShapeState discriminates by shape", () => {
  const inset: ClipPathShapeState = {
    shape: "inset",
    top: "10px",
    right: "20px",
    bottom: "10px",
    left: "20px",
    round: "8px",
  }
  const circle: ClipPathShapeState = {
    shape: "circle",
    radius: "50%",
    atX: "50%",
    atY: "50%",
  }
  const ellipse: ClipPathShapeState = {
    shape: "ellipse",
    rx: "50%",
    ry: "35%",
  }
  const polygon: ClipPathShapeState = {
    shape: "polygon",
    fillRule: "evenodd",
    vertices: [
      { x: "0%", y: "0%" },
      { x: "100%", y: "0%" },
      { x: "50%", y: "100%" },
    ],
  }
  expectTypeOf(inset).toMatchTypeOf<ClipPathShapeState>()
  expectTypeOf(circle).toMatchTypeOf<ClipPathShapeState>()
  expectTypeOf(ellipse).toMatchTypeOf<ClipPathShapeState>()
  expectTypeOf(polygon).toMatchTypeOf<ClipPathShapeState>()
})

test("ClipPathState carries an optional box + position + nullable shape", () => {
  const withBox: ClipPathState = {
    box: "border-box",
    boxPosition: "trailing",
    shape: { shape: "circle", radius: "50%" },
  }
  const bareBox: ClipPathState = { box: "border-box", shape: null }
  const none: ClipPathState = { shape: null }
  expectTypeOf(withBox).toMatchTypeOf<ClipPathState>()
  expectTypeOf(bareBox).toMatchTypeOf<ClipPathState>()
  expectTypeOf(none).toMatchTypeOf<ClipPathState>()
})

// ---------------------------------------------------------------------------
// Component onChange — returns the open ClipPathString (mode does not narrow)
// ---------------------------------------------------------------------------

test("ClipPathEditor onChange returns ClipPathString", () => {
  type P = Parameters<typeof ClipPathEditor>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<ClipPathString>()
})
