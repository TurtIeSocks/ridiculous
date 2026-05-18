import { BasicUsage } from "./examples/color-picker/basic-usage"
import { ModeLocked } from "./examples/color-picker/mode-locked"

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-5xl font-bold tracking-tight">ridiculous</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            ridiculously typed shadcn components
          </p>
          <p className="mt-2">
            <a
              href="https://github.com/TurtIeSocks/ridiculous"
              className="underline"
            >
              github.com/TurtIeSocks/ridiculous
            </a>
          </p>
        </div>
      </header>
      <main className="container mx-auto px-6 py-12 space-y-16">
        <section>
          <h2 className="text-2xl font-semibold mb-6">Color Picker</h2>
          <BasicUsage />
          <ModeLocked />
        </section>
      </main>
      <footer className="border-t mt-24">
        <div className="container mx-auto px-6 py-6 text-sm text-muted-foreground">
          MIT License ·{" "}
          <a
            href="https://github.com/TurtIeSocks/ridiculous"
            className="underline"
          >
            Source
          </a>
        </div>
      </footer>
    </div>
  )
}
