import { Link } from "react-router-dom"
import { MobileSidebarSheet } from "./sidebar"

function GitHubGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <title>GitHub</title>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.82 1.18 3.08 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .3.21.67.79.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}

function GitHubLink() {
  return (
    <a
      href="https://github.com/TurtIeSocks/ridiculous"
      aria-label="GitHub"
      className="inline-flex items-center justify-center size-10 rounded-full border border-transparent text-muted-foreground transition hover:border-white/15 hover:bg-white/5 hover:text-foreground"
    >
      <GitHubGlyph className="size-5" />
    </a>
  )
}

function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="size-5"
      aria-hidden="true"
    >
      <title>Menu</title>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function HeroHeader() {
  return (
    <header className="relative">
      <div className="container mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-muted-foreground backdrop-blur-sm">
          <span className="inline-block size-1.5 rounded-full bg-violet-glow shadow-[0_0_8px_var(--color-violet-glow)]" />
          v0 · ridiculous
        </div>
        <h1 className="mt-6 text-6xl md:text-7xl font-extrabold tracking-tight leading-[0.95]">
          <span className="text-gradient">ridiculous</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Ridiculously typed shadcn components. Template-literal validators,
          tiered ergonomics, zero-runtime guarantees.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <GitHubLink />
          <a
            href="#install"
            className="inline-flex items-center gap-2 rounded-full bg-linear-to-br from-violet-glow to-pink-glow px-4 py-2 text-sm font-semibold text-background shadow-[0_4px_24px_oklch(0.5_0.2_300/0.35)] transition hover:brightness-110"
          >
            Install
          </a>
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-6">
        <div className="h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
      </div>
    </header>
  )
}

export function CompactHeader() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-background/70 border-b border-white/10">
      <div className="container mx-auto max-w-6xl px-6 h-16 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="text-lg font-extrabold tracking-tight text-gradient"
        >
          ridiculous
        </Link>
        <div className="flex items-center gap-3">
          <GitHubLink />
          <MobileSidebarSheet>
            <button
              type="button"
              aria-label="Open navigation"
              className="md:hidden inline-flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/5"
            >
              <HamburgerIcon />
            </button>
          </MobileSidebarSheet>
        </div>
      </div>
    </header>
  )
}

export function Header({ variant }: { variant: "hero" | "compact" }) {
  return variant === "hero" ? <HeroHeader /> : <CompactHeader />
}
