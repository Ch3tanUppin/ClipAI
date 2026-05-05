"use client";

import { create } from "zustand";
import type { UserProfile } from "@/lib/types";

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  hydrated: boolean;
  setSession: (token: string, user: UserProfile) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setSession: (token, user) => {
    localStorage.setItem("clipai_token", token);
    localStorage.setItem("clipai_user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("clipai_token");
    localStorage.removeItem("clipai_user");
    set({ token: null, user: null });
  },
  hydrate: () => {
    const token = localStorage.getItem("clipai_token");
    const user = localStorage.getItem("clipai_user");
    set({ token, user: user ? JSON.parse(user) : null, hydrated: true });
  }
}));

