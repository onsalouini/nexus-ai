import { useEffect, useState } from "react";
import { messagesApi } from "../services/messagesApi";

/*
| Compteur de messages non lus partagé (menus, en-têtes) : un seul appel toutes les 30 s
| quel que soit le nombre de badges affichés. refreshUnread() force une mise à jour.
*/
const POLL_MS = 30_000;
let count = 0;
let timer: number | null = null;
const listeners = new Set<(n: number) => void>();

export async function refreshUnread(): Promise<void> {
  try {
    count = await messagesApi.unread();
    listeners.forEach((l) => l(count));
  } catch {
    /* hors ligne ou session expirée : on garde la dernière valeur */
  }
}

export function useUnreadMessages(): number {
  const [value, setValue] = useState(count);
  useEffect(() => {
    listeners.add(setValue);
    if (listeners.size === 1) {
      void refreshUnread();
      timer = window.setInterval(refreshUnread, POLL_MS);
    }
    return () => {
      listeners.delete(setValue);
      if (listeners.size === 0 && timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
  }, []);
  return value;
}
