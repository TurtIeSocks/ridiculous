import type { RouteRecord } from "vite-react-ssg"
import { AppShell } from "@/components/layout/app-shell"

/**
 * Route table consumed by vite-react-ssg. The parent route renders the
 * persistent <AppShell/> (Layout + <Outlet/>); each child contributes only
 * its page content via `lazy` for per-route code-splitting. The "*" child is
 * the prerendered 404.
 */
export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <AppShell />,
    entry: "src/components/layout/app-shell.tsx",
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import("@/pages/index/page")).IndexPage,
        }),
      },
      {
        path: "ridiculous-type-kit",
        lazy: async () => ({
          Component: (await import("@/pages/ridiculous-type-kit/page"))
            .RidiculousTypeKitPage,
        }),
      },
      {
        path: "color-picker",
        lazy: async () => ({
          Component: (await import("@/pages/color-picker/page"))
            .ColorPickerPage,
        }),
      },
      {
        path: "unit-input",
        lazy: async () => ({
          Component: (await import("@/pages/unit-input/page")).UnitInputPage,
        }),
      },
      {
        path: "gradient-editor",
        lazy: async () => ({
          Component: (await import("@/pages/gradient-editor/page"))
            .GradientEditorPage,
        }),
      },
      {
        path: "easing-picker",
        lazy: async () => ({
          Component: (await import("@/pages/easing-picker/page"))
            .EasingPickerPage,
        }),
      },
      {
        path: "calc-editor",
        lazy: async () => ({
          Component: (await import("@/pages/calc-editor/page")).CalcEditorPage,
        }),
      },
      {
        path: "transform-builder",
        lazy: async () => ({
          Component: (await import("@/pages/transform-builder/page"))
            .TransformBuilderPage,
        }),
      },
      {
        path: "filter-builder",
        lazy: async () => ({
          Component: (await import("@/pages/filter-builder/page"))
            .FilterBuilderPage,
        }),
      },
      {
        path: "grid-builder",
        lazy: async () => ({
          Component: (await import("@/pages/grid-builder/page"))
            .GridBuilderPage,
        }),
      },
      {
        path: "clip-path-editor",
        lazy: async () => ({
          Component: (await import("@/pages/clip-path-editor/page"))
            .ClipPathEditorPage,
        }),
      },
      {
        path: "box-shadow-editor",
        lazy: async () => ({
          Component: (await import("@/pages/box-shadow-editor/page"))
            .BoxShadowEditorPage,
        }),
      },
      {
        path: "transition-editor",
        lazy: async () => ({
          Component: (await import("@/pages/transition-editor/page"))
            .TransitionEditorPage,
        }),
      },
      {
        path: "font-editor",
        lazy: async () => ({
          Component: (await import("@/pages/font-editor/page")).FontEditorPage,
        }),
      },
      {
        path: "color-function",
        lazy: async () => ({
          Component: (await import("@/pages/color-function/page"))
            .ColorFunctionPage,
        }),
      },
      {
        path: "if-function",
        lazy: async () => ({
          Component: (await import("@/pages/if-function/page")).IfFunctionPage,
        }),
      },
      {
        path: "query-builder",
        lazy: async () => ({
          Component: (await import("@/pages/query-builder/page"))
            .QueryBuilderPage,
        }),
      },
      {
        path: "*",
        lazy: async () => ({
          Component: (await import("@/pages/not-found/page")).NotFoundPage,
        }),
      },
    ],
  },
]
