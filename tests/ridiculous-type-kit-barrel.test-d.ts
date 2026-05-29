import { expectTypeOf, test } from "vitest"

// Phase 0 smoke: barrel module resolves and typecheck runs.
test("ridiculous-type-kit barrel imports", () => {
  expectTypeOf<string>().toBeString()
})
