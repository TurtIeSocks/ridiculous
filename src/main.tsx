import { ViteReactSSG } from "vite-react-ssg"
import { routes } from "@/routes"
import "@/index.css"

// BASE_URL is "/ridiculous/"; react-router's basename wants no trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "")

export const createRoot = ViteReactSSG({ routes, basename })
