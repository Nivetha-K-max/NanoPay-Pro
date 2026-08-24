import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useAuthStore = create(
  devtools(
    persist(
      (set) => ({
        token: null,
        user:  null,

        setAuth: (token, user) => {
          localStorage.setItem('accessToken', token);
          set({ token, user });
        },

        clearAuth: () => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ token: null, user: null });
        },
      }),
      { name: 'auth-store', partialize: (s) => ({ token: s.token, user: s.user }) }
    ),
    { name: 'auth-store' }
  )
);
