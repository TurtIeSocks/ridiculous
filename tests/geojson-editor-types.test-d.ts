import { expectTypeOf, test } from "vitest"
import type {
  Feature,
  FeatureCollection,
  GeoJSON,
  Geometry,
  GeojsonError,
  GeojsonPath,
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
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
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
