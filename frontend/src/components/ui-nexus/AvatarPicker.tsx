import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Check, Type } from "lucide-react";
import Avatar from "./Avatar";
import { AVATAR_COLORS, resizeAvatar, type AvatarChoice, type AvatarColor } from "../../lib/avatar";
import { toast } from "../../lib/toast";


const MAX_BYTES = 2 * 1024 * 1024;
const COLORS = Object.keys(AVATAR_COLORS) as AvatarColor[];


/*
| Choix de l'avatar : une photo (réduite à 320 px puis enregistrée en base de données)
| ou les initiales du nom sur une couleur au choix.
*/
export default function AvatarPicker({
  firstName,
  lastName,
  value,
  onChange,
  currentPath,
  busy = false,
  compact = false,
}: {
  firstName?: string;
  lastName?: string;
  value: AvatarChoice;
  onChange: (next: AvatarChoice) => void;
  /** Photo déjà enregistrée (paramètres du compte) */
  currentPath?: string | null;
  busy?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const preview = useMemo(() => (value.file ? URL.createObjectURL(value.file) : null), [value.file]);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setInputKey((k) => k + 1);
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_BYTES * 4) {
      toast.error(t("avatar.invalid"));
      return;
    }
    const resized = await resizeAvatar(file);
    if (resized.size > MAX_BYTES) {
      toast.error(t("avatar.invalid"));
      return;
    }
    onChange({ ...value, mode: "photo", file: resized });
  }

  const photoPath = value.mode === "photo" ? preview ?? currentPath ?? null : null;
  const person = { first_name: firstName || "?", last_name: lastName, avatar_path: photoPath, avatar_color: value.color };

  return (
    <div className={`flex ${compact ? "flex-col items-center" : "flex-col items-center sm:flex-row sm:items-start"} gap-5`}>
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-400/40 via-sky-500/20 to-violet-500/40 blur-md" />
        <Avatar key={photoPath ?? value.color} person={person} size="2xl" className="relative ring-2 ring-white/20" />
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </span>
        )}
      </div>

      <div className="w-full min-w-0 flex-1 space-y-3">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1" role="radiogroup" aria-label={t("avatar.label")}>
          {(["photo", "initials"] as const).map((mode) => {
            const Icon = mode === "photo" ? Camera : Type;
            const active = value.mode === mode;
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={busy}
                onClick={() => onChange({ ...value, mode })}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active ? "bg-gradient-to-r from-cyan-500/25 to-violet-500/25 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(`avatar.${mode}`)}
              </button>
            );
          })}
        </div>

        {value.mode === "photo" ? (
          <div className="space-y-1.5">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 ${
                busy ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Camera className="h-4 w-4" />
              {value.file || currentPath ? t("avatar.change") : t("avatar.choose")}
              <input key={inputKey} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
            </label>
            <p className="text-xs text-slate-500">{t("avatar.hint")}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400">{t("avatar.colorLabel")}</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  disabled={busy}
                  onClick={() => onChange({ ...value, mode: "initials", color })}
                  aria-label={color}
                  aria-pressed={value.color === color}
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[color]} transition hover:scale-110 ${
                    value.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#020817]" : ""
                  }`}
                >
                  {value.color === color && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
