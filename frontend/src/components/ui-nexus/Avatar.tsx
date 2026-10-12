import { useState } from "react";
import { avatarUrl, initials } from "../../lib/avatar";

type Person = {
  first_name?: string | null;
  last_name?: string | null;
  avatar_path?: string | null;
};

const SIZES = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

// Teinte stable par personne : les initiales ne sont pas toutes de la même couleur
const GRADIENTS = [
  "from-cyan-400/40 to-blue-500/30",
  "from-violet-400/40 to-fuchsia-500/30",
  "from-emerald-400/40 to-teal-500/30",
  "from-amber-400/40 to-orange-500/30",
  "from-rose-400/40 to-pink-500/30",
  "from-sky-400/40 to-indigo-500/30",
];

/* Photo de profil, ou initiales colorées si pas de photo / image introuvable */
export default function Avatar({
  person,
  size = "md",
  className = "",
  ring = true,
}: {
  person?: Person | null;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = avatarUrl(person?.avatar_path);
  const name = `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim();
  const gradient = GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length];
  const base = `relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${SIZES[size]} ${
    ring ? "ring-1 ring-white/15" : ""
  } ${className}`;

  if (src && !failed) {
    return <img src={src} alt={name} title={name} onError={() => setFailed(true)} className={`${base} object-cover`} />;
  }

  return (
    <span className={`${base} bg-gradient-to-br ${gradient}`} title={name} aria-label={name}>
      {initials(person?.first_name, person?.last_name)}
    </span>
  );
}
