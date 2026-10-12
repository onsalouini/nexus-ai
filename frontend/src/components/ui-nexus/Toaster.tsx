import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { subscribeToasts, type ToastMessage } from "../../lib/toast";

const DURATION_MS = 5000;

const STYLES = {
  success: { cls: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200", Icon: CheckCircle2 },
  error: { cls: "border-red-400/25 bg-red-500/10 text-red-200", Icon: XCircle },
  info: { cls: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100", Icon: Info },
};

export default function Toaster() {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(
    () =>
      subscribeToasts((toast) => {
        setToasts((prev) => [...prev.slice(-3), toast]);
        window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== toast.id)), DURATION_MS);
      }),
    []
  );

  return (
    <div
      className="pointer-events-none fixed bottom-4 end-4 z-[200000] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map(({ id, type, text }) => {
        const { cls, Icon } = STYLES[type];
        return (
          <div
            key={id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${cls}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 leading-5">{text}</p>
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== id))}
              className="opacity-60 transition hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
