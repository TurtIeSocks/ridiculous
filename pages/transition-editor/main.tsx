import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { TransitionEditorPage } from "@/pages/transition-editor/page"
import "@/index.css"

// biome-ignore lint/style/noNonNullAssertion: standard Vite + React bootstrap; #root is guaranteed by HTML
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TransitionEditorPage />
  </StrictMode>,
)
