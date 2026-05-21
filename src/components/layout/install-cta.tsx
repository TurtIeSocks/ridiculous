interface InstallCtaProps {
  command: string
}

export function InstallCta({ command }: InstallCtaProps) {
  const tokens = command.split(" ")
  const head = tokens.slice(0, -1).join(" ")
  const tail = tokens[tokens.length - 1]
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <pre className="text-sm md:text-base font-mono overflow-x-auto">
        <span className="text-muted-foreground select-none">$ </span>
        <span className="text-foreground">{head} </span>
        <span className="text-gradient">{tail}</span>
      </pre>
    </div>
  )
}
