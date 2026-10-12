/*
| Bus de notifications toast : utilisable partout (composants, intercepteur axios)
| sans contexte React. Le composant <Toaster /> affiche les messages.
*/
export type ToastType = "success" | "error" | "info";

export type ToastMessage = {
  id: number;
  type: ToastType;
  text: string;
};

type Listener = (toast: ToastMessage) => void;

const listeners = new Set<Listener>();
let nextId = 1;

export function pushToast(text: string, type: ToastType = "info"): void {
  const toast = { id: nextId++, type, text };
  listeners.forEach((listener) => listener(toast));
}

export const toast = {
  success: (text: string) => pushToast(text, "success"),
  error: (text: string) => pushToast(text, "error"),
  info: (text: string) => pushToast(text, "info"),
};

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
