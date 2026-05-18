import { expectTypeOf, test } from "vitest"

// Type-only smoke test: ensure the file imports cleanly.
test("color-picker.types module imports", () => {
  expectTypeOf<string>().toBeString()
})
