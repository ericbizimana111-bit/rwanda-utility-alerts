import { create } from 'zustand';
import { api, ApiError, ApiUser } from '../api/client';
import { ensurePushRegistration } from '../notifications/service';

type AuthState = {
    user: ApiUser | null;
    loading: boolean;
    pushStatus: 'idle' | 'registered' | 'unavailable';
    signIn: (phone: string, password: string) => Promise<void>;
    signUp: (phone: string, password: string, firstName: string, lastName: string, email?: string) => Promise<void>;
    restore: () => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: ApiUser) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    pushStatus: 'idle',
    async signIn(phone, password) {
        const result = await api.login(phone, password);
        set({ user: result.user });
        void ensurePushRegistration().then((outcome) => {
            if (outcome === 'registered') set({ pushStatus: 'registered' });
        });
    },
    async signUp(phone, password, firstName, lastName, email) {
        const result = await api.register(phone, password, firstName, lastName, email);
        set({ user: result.user });
        void ensurePushRegistration().then((outcome) => {
            if (outcome === 'registered') set({ pushStatus: 'registered' });
        });
    },
    async restore() {
        const user = await api.restoreSession();
        set({ user, loading: false });
        if (user) {
            void ensurePushRegistration().then((outcome) => {
                if (outcome === 'registered') set({ pushStatus: 'registered' });
            });
        }
    },
    async signOut() {
        await api.unregisterDevice();
        await api.logout();
        set({ user: null, pushStatus: 'idle' });
    },
    setUser(user) {
        set({ user });
    },
}));

export { ApiError };
