import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'rwanda-utility-alerts.access-token';

export type ApiUser = {
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
    notificationsEnabled: boolean;
};

export type Outage = {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    startTime?: string | null;
    endTime?: string | null;
    utility?: { name: string; code: string };
    outageLocations?: Array<{ location?: { district?: string; sector?: string | null; cell?: string | null } }>;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        throw new Error(`API request failed (${response.status})`);
    }

    return response.json() as Promise<T>;
}

export const api = {
    async login(phone: string, password: string) {
        const result = await request<{ accessToken: string; user: ApiUser }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, password }),
        });
        await AsyncStorage.setItem(TOKEN_KEY, result.accessToken);
        return result;
    },
    async restoreSession() {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) return null;
        try {
            return await request<ApiUser>('/auth/me');
        } catch {
            await AsyncStorage.removeItem(TOKEN_KEY);
            return null;
        }
    },
    async logout() {
        await AsyncStorage.removeItem(TOKEN_KEY);
    },
    async registerDevice(pushToken: string, platform: 'android' | 'ios') {
        return request('/devices', {
            method: 'POST',
            body: JSON.stringify({ pushToken, platform }),
        });
    },
    getOutage(id: string) {
        return request<Outage>(`/outages/${encodeURIComponent(id)}`);
    },
};
