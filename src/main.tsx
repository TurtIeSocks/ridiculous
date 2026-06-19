import { ViteReactSSG } from "vite-react-ssg"
import { routes } from "@/routes"
import "@/index.css"

// BASE_URL is "/" (served at the domain root); strip the trailing slash so
// react-router's basename is "" rather than "/".
const basename = import.meta.env.BASE_URL.replace(/\/$/, "")

export const createRoot = ViteReactSSG({ routes, basename })
