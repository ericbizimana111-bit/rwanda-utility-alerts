import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'rwanda-utility-alerts.access-token';
const DEVICE_KEY = 'rwanda-utility-alerts.device-id';

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
        const result = await request<{ id?: string }>('/devices', {
            method: 'POST',
            body: JSON.stringify({ pushToken, platform }),
        });
        if (result.id) await AsyncStorage.setItem(DEVICE_KEY, result.id);
        return result;
    },
    async unregisterDevice() {
        const deviceId = await AsyncStorage.getItem(DEVICE_KEY);
        if (!deviceId) return;
        try {
            await request(`/devices/${encodeURIComponent(deviceId)}`, { method: 'DELETE' });
        } finally {
            await AsyncStorage.removeItem(DEVICE_KEY);
        }
    },
    getOutage(id: string) {
        return request<Outage>(`/outages/${encodeURIComponent(id)}`);
    },
};
