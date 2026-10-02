import type { ReactNode } from "react";

export const cardCls =
  "rounded-2xl border border-white/[0.08] bg-[#071021]/70 backdrop-blur-xl";
export const inputCls =
  "w-full rounded-xl border border-white/[0.1] bg-[#0B1628] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-[#04101f] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
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
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Fermer">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className={`${cardCls} p-5`}>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
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
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function errMsg(e: unknown, fallback = "Une erreur est survenue."): string {
  const anyE = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
  const errors = anyE?.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join(" ");
  return anyE?.response?.data?.message ?? fallback;
}

export const STATUS_LABEL: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  suspendu: "Suspendu",
};
