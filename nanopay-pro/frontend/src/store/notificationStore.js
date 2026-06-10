import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../api/axios';

export const useNotificationStore = create(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount:   0,
      loading:       false,
      hasMore:       true,
      page:          0,

      /** Fetch paginated notifications from API (initial load + infinite scroll). */
      fetchNotifications: async (reset = false) => {
        const currentPage = reset ? 0 : get().page;
        set({ loading: true });
        try {
          const res = await api.get('/notifications', {
            params: { page: currentPage, size: 20 },
          });
          const { content, last } = res.data.data;
          set((state) => ({
            notifications: reset ? content : [...state.notifications, ...content],
            unreadCount:   reset
              ? content.filter((n) => !n.read).length
              : state.unreadCount,
            page:    reset ? 1 : state.page + 1,
            hasMore: !last,
            loading: false,
          }));
        } catch (_) {
          set({ loading: false });
        }
      },

      /** Lightweight poll for badge — called on mount. */
      fetchUnreadCount: async () => {
        try {
          const res = await api.get('/notifications/unread-count');
          set({ unreadCount: res.data.data });
        } catch (_) {}
      },

      /** Called by WebSocket push — prepends instantly without refetch. */
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount:   state.unreadCount + (notification.read ? 0 : 1),
        })),

      /** Called by WebSocket unread-count push after markRead on server. */
      setUnreadCount: (count) => set({ unreadCount: count }),

      markRead: async (id) => {
        try {
          await api.patch(`/notifications/${id}/read`);
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));
        } catch (_) {}
      },

      markAllRead: async () => {
        try {
          await api.patch('/notifications/read-all');
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          }));
        } catch (_) {}
      },
    }),
    { name: 'notification-store' }
  )
);
