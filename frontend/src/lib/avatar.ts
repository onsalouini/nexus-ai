/*
| Le backend stocke un chemin relatif ("avatars/xyz.jpg") sur le disque public de Laravel.
| L'image est servie par Laravel sous /storage : on reconstruit l'URL complète à partir de l'API.
*/
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/api\/?$/, "");

export function avatarUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_ORIGIN}/storage/${path.replace(/^\/?(storage\/)?/, "")}`;
}

export function initials(firstName?: string | null, lastName?: string | null): string {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "N";
}
