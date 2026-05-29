import { useRef } from "react"

/**
 * Stable React keys for a positional list whose item shape is serialized and
 * therefore cannot carry an `id` of its own (e.g. polygon `vertices`, which
 * round-trip through parse/format as bare `{ x, y }`).
 *
 * Each slot gets a UUID generated when the slot first appears. The id array is
 * reconciled to `count` on every render: new tail slots get a fresh id, and a
 * shrunk list drops trailing ids. For mid-list removals call `removeIdAt`
 * BEFORE the list shrinks so the surviving slots keep their ids (otherwise a
 * removal would shift every id after the gap, the exact remount hazard a
 * stable key is meant to avoid).
 */
export interface ListIds {
  /** Current ids, one per slot, index-aligned with the data array. */
  ids: readonly string[]
  /** Drop the id at `index` so a mid-list removal stays item-stable. */
  removeIdAt: (index: number) => void
}

function freshId(): string {
  // `crypto.randomUUID` is available in every browser target + jsdom/node 19+.
  // Guard for exotic runtimes without it.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

export function useListIds(count: number): ListIds {
  const idsRef = useRef<string[]>([])
  const ids = idsRef.current

  // Reconcile length: grow with fresh ids, shrink by truncation.
  if (ids.length < count) {
    while (ids.length < count) ids.push(freshId())
  } else if (ids.length > count) {
    ids.length = count
  }

  const removeIdAt = (index: number) => {
    if (index >= 0 && index < idsRef.current.length) {
      idsRef.current.splice(index, 1)
    }
  }

  return { ids, removeIdAt }
}
