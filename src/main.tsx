import { ViteReactSSG } from "vite-react-ssg"
import { routes } from "@/routes"
import "@/index.css"

// BASE_URL is "/ridiculous/" in prod (GitHub Pages) and "/" in dev; react-router's
// basename wants no trailing slash (and treats the resulting "" as root "/").
const basename = import.meta.env.BASE_URL.replace(/\/$/, "")

export const createRoot = ViteReactSSG({ routes, basename })
