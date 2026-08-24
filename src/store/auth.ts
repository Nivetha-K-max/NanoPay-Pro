import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

type Role = "CUSTOMER" | "MERCHANT" | "ADMIN";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  cardLast4?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstName: string, lastName: string, email: string, password: string, role?: Role) => Promise<void>;
  signOut: () => void;
  isAuthenticated: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      signIn: async (email, password) => {
        const response = await api.login(email, password);
        set({ user: response.user, token: response.token });
      },
      signUp: async (firstName, lastName, email, password, role = "CUSTOMER") => {
        const response = await api.register({ firstName, lastName, email, password, role });
        set({ user: response.user, token: response.token });
      },
      signOut: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
    }),
    { name: "nanopay-auth" },
  ),
);
