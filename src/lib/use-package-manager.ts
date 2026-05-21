import { useSyncExternalStore } from "react"

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun"

export const PACKAGE_MANAGERS: readonly PackageManager[] = [
  "npm",
  "yarn",
  "pnpm",
  "bun",
]

const STORAGE_KEY = "ridiculous:pm"
const DEFAULT_PM: PackageManager = "pnpm"

function read(): PackageManager {
  if (typeof window === "undefined") return DEFAULT_PM
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === "npm" || v === "yarn" || v === "pnpm" || v === "bun"
    ? v
    : DEFAULT_PM
}

const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}

export function setPackageManager(pm: PackageManager) {
  window.localStorage.setItem(STORAGE_KEY, pm)
  for (const cb of listeners) cb()
}

export function usePackageManager(): PackageManager {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_PM)
}

export function commandFor(pm: PackageManager, args: string): string {
  switch (pm) {
    case "npm":
      return `npx shadcn@latest ${args}`
    case "yarn":
      return `yarn dlx shadcn@latest ${args}`
    case "pnpm":
      return `pnpm dlx shadcn@latest ${args}`
    case "bun":
      return `bunx --bun shadcn@latest ${args}`
  }
}
