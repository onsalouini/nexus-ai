import { useState } from "react";
import { avatarGradient, avatarUrl, initials } from "../../lib/avatar";

export type AvatarPerson = {
  first_name?: string | null;
  last_name?: string | null;
  avatar_path?: string | null;
  avatar_color?: string | null;
};

const SIZES = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
  "2xl": "h-24 w-24 text-2xl",
};

/* Photo de profil, ou initiales sur la couleur choisie si pas de photo / image introuvable */
export default function Avatar({
  person,
  size = "md",
  className = "",
  ring = true,
  rounded = "rounded-full",
}: {
  person?: AvatarPerson | null;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
  rounded?: string;
}) {
  const src = avatarUrl(person?.avatar_path);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const name = `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim();
  const base = `relative inline-flex shrink-0 items-center justify-center overflow-hidden ${rounded} font-semibold text-white ${SIZES[size]} ${
    ring ? "ring-1 ring-white/15" : ""
  } ${className}`;

  if (src && failedSrc !== src) {
    return <img src={src} alt={name} title={name} onError={() => setFailedSrc(src)} className={`${base} object-cover`} />;
  }

  return (
    <span className={`${base} bg-gradient-to-br ${avatarGradient(person?.avatar_color, name)} shadow-inner`} title={name} aria-label={name}>
      {initials(person?.first_name, person?.last_name)}
    </span>
  );
}
