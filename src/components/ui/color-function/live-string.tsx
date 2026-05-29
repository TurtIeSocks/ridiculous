// ---------------------------------------------------------------------------
// LiveString — read-only echo of the canonical serialized color function.
// ---------------------------------------------------------------------------

interface LiveStringProps {
  value: string
}

export function LiveString({ value }: LiveStringProps) {
  return (
    <code className="block break-all rounded bg-muted px-2 py-1.5 font-mono text-[11px]">
      {value}
    </code>
  )
}
