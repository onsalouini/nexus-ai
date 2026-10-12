import type { ReactNode } from "react";
import i18n from "../../i18n";

export const cardCls =
  "rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0c1a33]/80 via-[#081325]/80 to-[#070f1f]/80 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl";
export const inputCls =
  "w-full rounded-xl border border-white/[0.1] bg-[#0B1628] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 px-4 py-2.5 text-sm font-semibold text-[#04101f] shadow-[0_8px_24px_rgba(34,211,238,0.18)] transition hover:shadow-[0_10px_30px_rgba(139,92,246,0.3)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07] disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50";

export function Field({ label, children, group }: { label: string; children: ReactNode; group?: boolean }) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </Tag>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0A1424] p-6 ${wide ? "max-w-2xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label={i18n.t("common.close")}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex gap-3">
        <span className="mt-1 h-10 w-1 shrink-0 rounded-full bg-gradient-to-b from-cyan-400 via-sky-400 to-violet-500" />
        <div>
          <h1 className="bg-gradient-to-r from-white via-white to-cyan-100 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            {title}
          </h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export type Tone = "cyan" | "violet" | "emerald" | "amber" | "rose" | "sky";

const TONES: Record<Tone, { line: string; glow: string; dot: string }> = {
  cyan: { line: "from-cyan-400", glow: "bg-cyan-400/10", dot: "bg-cyan-400" },
  violet: { line: "from-violet-400", glow: "bg-violet-500/10", dot: "bg-violet-400" },
  emerald: { line: "from-emerald-400", glow: "bg-emerald-400/10", dot: "bg-emerald-400" },
  amber: { line: "from-amber-400", glow: "bg-amber-400/10", dot: "bg-amber-400" },
  rose: { line: "from-rose-400", glow: "bg-rose-500/10", dot: "bg-rose-400" },
  sky: { line: "from-sky-400", glow: "bg-sky-400/10", dot: "bg-sky-400" },
};

export function Stat({ label, value, hint, tone = "cyan" }: { label: string; value: ReactNode; hint?: string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <div className={`${cardCls} relative overflow-hidden p-5`}>
      <span className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${t.line} to-transparent`} />
      <span className={`pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full blur-2xl ${t.glow}`} />
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 transition-all duration-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function errMsg(e: unknown, fallback = i18n.t("common.genericError")): string {
  const anyE = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
  const errors = anyE?.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join(" ");
  return anyE?.response?.data?.message ?? fallback;
}

export const PROJECT_STATUSES = ["planifie", "en_cours", "termine", "suspendu"] as const;

/* Libellé traduit d'un statut projet (suit la langue active) */
export function statusLabel(status: string): string {
  return i18n.t(`common.projectStatus.${status}`, { defaultValue: status });
}

/* Objet { statut: libellé } recalculé à chaque accès pour suivre la langue */
export const STATUS_LABEL: Record<string, string> = new Proxy({} as Record<string, string>, {
  get: (_, key) => (typeof key === "string" ? statusLabel(key) : undefined),
  ownKeys: () => [...PROJECT_STATUSES],
  getOwnPropertyDescriptor: (_, key) => ({
    enumerable: true,
    configurable: true,
    value: statusLabel(String(key)),
  }),
});
