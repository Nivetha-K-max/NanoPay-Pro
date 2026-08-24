import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useWalletStore = create(
  devtools(
    (set) => ({
      balance:  null,
      currency: 'USD',

      updateBalance: (balance, currency) => set({ balance, currency }),
    }),
    { name: 'wallet-store' }
  )
);
