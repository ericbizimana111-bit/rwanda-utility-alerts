import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
const TOKEN_KEY = 'rwanda-utility-alerts.access-token';
const DEVICE_KEY = 'rwanda-utility-alerts.device-id';

// Android emulator reaches the host PC through 10.0.2.2.
// Physical Android devices and production should set EXPO_PUBLIC_API_URL explicitly.

export type ApiUser = {
    id: string;
    phone: string;
    email?: string | null;
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
    sourceName?: string | null;
    sourceUrl?: string | null;
    sourceType?: string;
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

export type Location = {
    id: string;
    province: string;
    district: string;
    sector: string | null;
    cell: string | null;
    village: string | null;
    createdAt: string;
    updatedAt: string;
};

export type Utility = {
    id: string;
    name: string;
    code: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type Subscription = {
    id: string;
    userId: string;
    locationId: string;
    utilityId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    location?: Location;
    utility?: Utility;
};

export type Report = {
    id: string;
    userId: string;
    locationId: string;
    utilityId: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    location?: Location;
    utility?: Utility;
    user?: ApiUser;
};

export type NotificationItem = {
    id: string;
    userId: string;
    outageId: string;
    title: string;
    message: string;
    isRead: boolean;
    status: string;
    createdAt: string;
    sentAt?: string | null;
    outage?: Outage;
};

export const api = {
    async login(phone: string, password: string) {
        const result = await request<{ accessToken: string; user: ApiUser }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, password }),
        });
        await AsyncStorage.setItem(TOKEN_KEY, result.accessToken);
        return result;
    },
    async register(phone: string, password: string, firstName: string, lastName: string, email?: string) {
        const result = await request<{ message: string; user: ApiUser }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ phone, password, firstName, lastName, email }),
        });
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
    getOutages() {
        return request<Outage[]>('/outages');
    },
    getUpcomingOutages() {
        return request<Outage[]>('/outages/upcoming');
    },
    getActiveOutages() {
        return request<Outage[]>('/outages/active');
    },
    getLocations() {
        return request<Location[]>('/locations');
    },
    getUtilities() {
        return request<Utility[]>('/utilities');
    },
    getSubscriptions() {
        return request<Subscription[]>('/subscriptions');
    },
    async createSubscription(locationId: string, utilityId: string) {
        return request<Subscription>('/subscriptions', {
            method: 'POST',
            body: JSON.stringify({ locationId, utilityId }),
        });
    },
    async deleteSubscription(id: string) {
        await request(`/subscriptions/${encodeURIComponent(id)}`, { method: 'DELETE' });
        return id;
    },
    getReports() {
        return request<Report[]>('/reports');
    },
    async createReport(locationId: string, utilityId: string, description: string) {
        return request<Report>('/reports', {
            method: 'POST',
            body: JSON.stringify({ locationId, utilityId, description }),
        });
    },
    getNotificationList() {
        return request<NotificationItem[]>('/notifications');
    },
    async markNotificationRead(id: string) {
        await request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
        return id;
    },
};
