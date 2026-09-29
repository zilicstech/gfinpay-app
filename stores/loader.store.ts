"use client";

import { create } from "zustand";

type LoaderState = {
  pending: number;
  releaseOnPath: string | null;
  begin: () => void;
  end: () => void;
  expectPath: (path: string) => void;
  releaseNavigation: () => void;
};

export const useLoader = create<LoaderState>((set) => ({
  pending: 0,
  releaseOnPath: null,
  begin: () => set((s) => ({ pending: s.pending + 1 })),
  end: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
  expectPath: (path) => set({ releaseOnPath: path }),
  releaseNavigation: () =>
    set((s) => {
      if (!s.releaseOnPath) return s;
      return { releaseOnPath: null, pending: Math.max(0, s.pending - 1) };
    }),
}));
