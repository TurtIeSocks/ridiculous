import { expectTypeOf, test } from "vitest"
import type {
  Feature,
  FeatureCollection,
  GeoJSON,
  GeojsonError,
  GeojsonPath,
  Geometry,
  Point,
  Polygon,
  Position,
} from "@/components/ui/geojson-editor"

test("Position is a 2- or 3-number tuple", () => {
  expectTypeOf<[1, 2]>().toMatchTypeOf<Position>()
  expectTypeOf<[1, 2, 3]>().toMatchTypeOf<Position>()
})

test("Geometry is the 7-arm discriminated union", () => {
  expectTypeOf<Point>().toMatchTypeOf<Geometry>()
  expectTypeOf<Polygon>().toMatchTypeOf<Geometry>()
  const p: Point = { type: "Point", coordinates: [0, 0] }
  expectTypeOf(p.type).toEqualTypeOf<"Point">()
})

test("Feature is generic over geometry + properties", () => {
  const f: Feature<Polygon, { name: string }> = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    },
    properties: { name: "x" },
  }
  expectTypeOf(f.geometry).toEqualTypeOf<Polygon>()
  expectTypeOf(f.properties.name).toEqualTypeOf<string>()
})

test("GeoJSON unions geometry, Feature, and FeatureCollection", () => {
  expectTypeOf<Polygon>().toMatchTypeOf<GeoJSON>()
  expectTypeOf<Feature>().toMatchTypeOf<GeoJSON>()
  expectTypeOf<FeatureCollection>().toMatchTypeOf<GeoJSON>()
})

test("GeojsonPath + GeojsonError shapes", () => {
  expectTypeOf<["features", 2, "geometry"]>().toMatchTypeOf<GeojsonPath>()
  expectTypeOf<GeojsonError["severity"]>().toEqualTypeOf<"error" | "warning">()
})

import type {
  GeometryLiteral,
  PositionLiteral,
} from "@/components/ui/geojson-editor"
import { geojson } from "@/components/ui/geojson-editor"

test("PositionLiteral checks arity + lon/lat range", () => {
  expectTypeOf<
    PositionLiteral<"[-122.42,37.77]">
  >().toEqualTypeOf<"[-122.42,37.77]">()
  expectTypeOf<PositionLiteral<"[1,2,3]">>().toEqualTypeOf<"[1,2,3]">()
  expectTypeOf<PositionLiteral<"[200,0]">>().toBeNever()
  expectTypeOf<PositionLiteral<"[0,91]">>().toBeNever()
  expectTypeOf<PositionLiteral<"[0]">>().toBeNever()
})

test("GeometryLiteral validates type tag → coordinates shape", () => {
  expectTypeOf<
    GeometryLiteral<'{"type":"Point","coordinates":[1,2]}'>
  >().toEqualTypeOf<'{"type":"Point","coordinates":[1,2]}'>()
  expectTypeOf<
    GeometryLiteral<'{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,0]]]}'>
  >().not.toBeNever()
  // unclosed ring
  expectTypeOf<
    GeometryLiteral<'{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1]]]}'>
  >().toBeNever()
  // unknown type
  expectTypeOf<
    GeometryLiteral<'{"type":"Wat","coordinates":[0,0]}'>
  >().toBeNever()
})

test("geojson() accepts valid, rejects invalid (compact canonical)", () => {
  geojson('{"type":"Point","coordinates":[-122.42,37.77]}')
  // @ts-expect-error — longitude 200 > 180
  geojson('{"type":"Point","coordinates":[200,0]}')
  // @ts-expect-error — unclosed polygon ring
  geojson('{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1]]]}')
})

test("geojson() accepts an object (casual escape hatch)", () => {
  geojson({ type: "Point", coordinates: [0, 0] })
})
