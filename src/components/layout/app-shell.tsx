import { Outlet, useLocation } from "react-router-dom"
import { Layout } from "./layout"

/**
 * Persistent shell mounted once by the parent route. Only the routed
 * <Outlet/> content swaps on navigation, so the header / sidebar / footer
 * never unmount — this is what removes the full-document white flash.
 *
 * react-router strips the basename, so the home route resolves to "/" and
 * uses the hero variant (big header, no sidebar); every other route uses the
 * compact variant (sticky header + sidebar).
 */
export function AppShell() {
  const { pathname } = useLocation()
  const isHome = pathname === "/"
  return (
    <Layout variant={isHome ? "hero" : "compact"}>
      <Outlet />
    </Layout>
  )
}
