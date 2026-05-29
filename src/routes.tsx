import type { RouteRecord } from "vite-react-ssg"
import { AppShell } from "@/components/layout/app-shell"
import { NAV } from "@/generated/nav"

/**
 * Route table consumed by vite-react-ssg. The parent route renders the
 * persistent <AppShell/> (Layout + <Outlet/>); each child contributes only
 * its page content via `lazy` for per-route code-splitting.
 *
 * The component child routes are derived from the generated NAV manifest:
 * every page lives at `@/pages/<name>/page` and default-exports its component,
 * so path + import path + export are all the slug. The index ("/") and
 * catch-all 404 ("*") routes are hand-written because they aren't NAV entries;
 * the "*" child is the prerendered 404 (see vite.config.ts ssgOptions).
 */
export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <AppShell />,
    entry: "src/components/layout/app-shell.tsx",
    children: [
      {
        index: true,
        lazy: () =>
          import("@/pages/index/page").then((m) => ({ Component: m.default })),
      },
      ...NAV.map(({ name }) => ({
        path: name,
        // Relative path + explicit extension so Vite's dynamic-import-vars
        // plugin can statically enumerate the page modules (the "@/" alias and
        // an extensionless specifier are both rejected here).
        lazy: () =>
          import(`./pages/${name}/page.tsx`).then((m) => ({
            Component: m.default,
          })),
      })),
      {
        path: "*",
        lazy: () =>
          import("@/pages/not-found/page").then((m) => ({
            Component: m.default,
          })),
      },
    ],
  },
]
