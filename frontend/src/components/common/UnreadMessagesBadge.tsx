import { useUnreadMessages } from "../../lib/unreadMessages";

/* Pastille du nombre de messages non lus (menus de navigation) */
export default function UnreadMessagesBadge() {
  const unread = useUnreadMessages();
  if (!unread) return null;
  return (
    <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]">
      {unread > 99 ? "99+" : unread}
    </span>
  );
}
