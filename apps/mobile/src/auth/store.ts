import { create } from 'zustand';
import { api, ApiUser } from '../api/client';

type AuthState = {
    user: ApiUser | null;
    loading: boolean;
    signIn: (phone: string, password: string) => Promise<void>;
    restore: () => Promise<void>;
    signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    async signIn(phone, password) {
        const result = await api.login(phone, password);
        set({ user: result.user });
    },
    async restore() {
        const user = await api.restoreSession();
        set({ user, loading: false });
    },
    async signOut() {
        await api.logout();
        set({ user: null });
    },
}));
