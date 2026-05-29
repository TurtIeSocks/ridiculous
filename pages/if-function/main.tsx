import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { IfFunctionPage } from "@/pages/if-function/page"
import "@/index.css"

// biome-ignore lint/style/noNonNullAssertion: standard Vite + React bootstrap; #root is guaranteed by HTML
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IfFunctionPage />
  </StrictMode>,
)
