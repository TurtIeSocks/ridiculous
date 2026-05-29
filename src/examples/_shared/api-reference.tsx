import type * as React from "react"
import { cn } from "@/lib/utils"

export function ApiSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-muted-foreground text-sm uppercase tracking-[0.18em]">
        <span className="text-gradient">§</span> {title}
      </h3>
      {children}
    </div>
  )
}

export function Signature({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <pre
      className={cn(
        "overflow-x-auto whitespace-pre rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed md:text-xs",
        className,
      )}
    >
      {children}
    </pre>
  )
}

export function ApiRow({
  signature,
  desc,
}: {
  signature: string
  desc: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Signature>{signature}</Signature>
      <p className="text-muted-foreground text-sm">{desc}</p>
    </div>
  )
}

export interface PropRow {
  name: string
  type: string
  desc: React.ReactNode
}

export function PropsTable({ rows }: { rows: ReadonlyArray<PropRow> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-white/10 border-b text-muted-foreground text-xs uppercase tracking-wider">
            <th className="py-2 pr-4 font-medium">Prop</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-white/5 border-b align-top">
              <td className="py-2 pr-4 font-mono text-foreground text-xs">
                {row.name}
              </td>
              <td className="py-2 pr-4 font-mono text-muted-foreground text-xs">
                {row.type}
              </td>
              <td className="py-2 text-muted-foreground">{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export interface TypeRow {
  name: string
  desc: React.ReactNode
}

export function TypesList({ rows }: { rows: ReadonlyArray<TypeRow> }) {
  return (
    <dl className="space-y-2 text-sm">
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex flex-col gap-0.5 md:flex-row md:gap-3"
        >
          <dt className="min-w-[180px] font-mono text-foreground text-xs">
            {row.name}
          </dt>
          <dd className="text-muted-foreground">{row.desc}</dd>
        </div>
      ))}
    </dl>
  )
}
