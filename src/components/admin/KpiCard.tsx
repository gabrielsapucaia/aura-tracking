import { cn } from "@/lib/utils";

type Tone = "warning" | "success" | "danger" | "info";

const toneStyles: Record<Tone, { bar: string; pill: string }> = {
  warning: { bar: "from-amber-400 to-orange-400", pill: "text-amber-600" },
  success: { bar: "from-emerald-400 to-green-500", pill: "text-emerald-600" },
  danger: { bar: "from-rose-500 to-red-500", pill: "text-rose-600" },
  info: { bar: "from-sky-400 to-cyan-500", pill: "text-sky-600" },
};

export type KpiCardProps = {
  title: string;
  value: string;
  delta?: string;
  tone?: Tone;
};

export function KpiCard({ title, value, delta, tone = "info" }: KpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="relative overflow-hidden rounded-lg bg-white p-5 shadow-md">
      <span className={cn("pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r", styles.bar)} />
      <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-gray-900">{value}</span>
        {delta ? <span className={cn("text-xs font-semibold", styles.pill)}>{delta}</span> : null}
      </div>
      <div className="mt-1 text-xs text-gray-500">Atualizado há poucos instantes</div>
    </div>
  );
}
