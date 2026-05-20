// frontend/lib/auth.ts
import { create } from "zustand";

interface AuthState {
  token: string | null;
  creditBalance: number;
  tier: string;
  setAuth: (token: string, creditBalance: number, tier: string) => void;
  logout: () => void;
  updateBalance: (balance: number) => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  creditBalance: 0,
  tier: "free",
  setAuth: (token, creditBalance, tier) => {
    localStorage.setItem("token", token);
    set({ token, creditBalance, tier });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, creditBalance: 0, tier: "free" });
  },
  updateBalance: (balance) => set({ creditBalance: balance }),
}));
