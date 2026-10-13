/*
| Photo de profil :
|  - "api/avatars/12?v=abc" : photo stockée en base, servie par l'API Laravel ;
|  - "avatars/xyz.jpg"      : ancienne photo sur le disque public (servie sous /storage).
| Sans photo, on affiche les initiales sur la couleur choisie (avatar_color).
*/
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/api\/?$/, "");

export function avatarUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  if (path.startsWith("api/")) return `${API_ORIGIN}/${path}`;
  return `${API_ORIGIN}/storage/${path.replace(/^\/?(storage\/)?/, "")}`;
}

export function initials(firstName?: string | null, lastName?: string | null): string {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "N";
}

/* Couleurs proposées pour les initiales (mêmes clés que AvatarService::COLORS côté Laravel) */
export const AVATAR_COLORS = {
  cyan: "from-cyan-400 to-blue-600",
  violet: "from-violet-400 to-fuchsia-600",
  emerald: "from-emerald-400 to-teal-600",
  amber: "from-amber-400 to-orange-600",
  rose: "from-rose-400 to-pink-600",
  sky: "from-sky-400 to-indigo-600",
  indigo: "from-indigo-400 to-purple-700",
  slate: "from-slate-400 to-slate-700",
} as const;

export type AvatarColor = keyof typeof AVATAR_COLORS;

export type AvatarChoice = {
  mode: "photo" | "initials";
  file: File | null;
  color: AvatarColor;
};

export const DEFAULT_AVATAR_CHOICE: AvatarChoice = { mode: "initials", file: null, color: "cyan" };

/** Ajoute le choix d'avatar à un formulaire d'inscription (photo en base ou couleur des initiales). */
export function appendAvatarChoice(data: FormData, choice: AvatarChoice) {
  data.append("avatar_color", choice.color);
  if (choice.mode === "photo" && choice.file) data.append("avatar", choice.file);
}

/** Dégradé des initiales : couleur choisie, sinon une teinte stable dérivée du nom. */
export function avatarGradient(color?: string | null, name = ""): string {
  if (color && color in AVATAR_COLORS) return AVATAR_COLORS[color as AvatarColor];
  const keys = Object.keys(AVATAR_COLORS) as AvatarColor[];
  return AVATAR_COLORS[keys[(name.charCodeAt(0) || 0) % 6]];
}

/** Réduit une photo à 320 px (carré centré) avant l'envoi : image légère stockée en base. */
export async function resizeAvatar(file: File, size = 320): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(size, side);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    return blob ? new File([blob], "avatar.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // format non décodable par le navigateur : le serveur validera
  }
}
