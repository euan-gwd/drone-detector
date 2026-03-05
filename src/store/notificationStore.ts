import { create } from "zustand";
import type { NotificationItem } from "../types/drone";

interface NotificationStore {
  items: NotificationItem[];
  addNotification: (item: NotificationItem) => void;
  clearNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  items: [],
  addNotification: (item) =>
    set((state) => ({ items: [item, ...state.items].slice(0, 30) })),
  clearNotification: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
}));
