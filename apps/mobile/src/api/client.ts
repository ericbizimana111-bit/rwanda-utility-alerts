import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
};

const API_URL = getBaseUrl();
const TOKEN_KEY = 'rwanda-utility-alerts.access-token';
const DEVICE_KEY = 'rwanda-utility-alerts.device-id';
const DEVICE_TOKEN_KEY = 'rwanda-utility-alerts.device-token';
const USER_KEY = 'rwanda-utility-alerts.cached-user';

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

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

export type DeviceRegistrationResult = {
    deviceId: string;
    pushToken: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            },
        });

        clearTimeout(timeout);
        if (!response.ok) {
            let message = `API request failed (${response.status})`;
            if (response.status === 401) {
                message = 'Your session has expired. Please sign in again.';
            } else {
                const errorBody = await response.text().catch(() => '');
                try {
                    const parsed = JSON.parse(errorBody) as { message?: string | string[] };
                    const rawMessage = parsed.message;
                    const text = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
                    if (text) message = text;
                } catch {
                    if (errorBody) message = `${message}: ${errorBody.slice(0, 200)}`;
                }
            }
            throw new ApiError(response.status, message);
        }
        return (await response.json()) as T;
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

export const api = {
    async login(phone: string, password: string) {
        const result = await request<{ accessToken: string; user: ApiUser }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, password }),
        });
        await AsyncStorage.setItem(TOKEN_KEY, result.accessToken);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
        return result;
    },

    async register(phone: string, password: string, firstName: string, lastName: string, email?: string) {
        await request<{ message: string; user: ApiUser }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ phone, password, firstName, lastName, email: email || undefined }),
        });
        // Registration does not return a token: sign in immediately with the
        // real credentials so the session is a genuine authenticated one.
        return this.login(phone, password);
    },

    async restoreSession(): Promise<ApiUser | null> {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) return null;
        try {
            const user = await request<ApiUser>('/auth/me');
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
            return user;
        } catch {
            // The token is no longer valid: clear it so the next run starts
            // from a clean unauthenticated state instead of retrying forever.
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
            return null;
        }
    },

    async logout() {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
    },

    async registerDevice(pushToken: string, platform: 'android' | 'ios'): Promise<DeviceRegistrationResult> {
        const result = await request<{ id?: string }>('/devices', {
            method: 'POST',
            body: JSON.stringify({ pushToken, platform }),
        });
        const deviceId = result.id ?? null;
        if (!deviceId) {
            throw new ApiError(0, 'Device registration response did not include a device ID.');
        }
        await AsyncStorage.setItem(DEVICE_KEY, deviceId);
        await AsyncStorage.setItem(DEVICE_TOKEN_KEY, pushToken);
        return { deviceId, pushToken };
    },

    async unregisterDevice() {
        const deviceId = await AsyncStorage.getItem(DEVICE_KEY);
        if (!deviceId) return;
        try {
            await request(`/devices/${encodeURIComponent(deviceId)}`, { method: 'DELETE' });
        } catch {
            // Removing the local record is still correct if the backend call
            // fails (e.g. offline); the device can be re-registered later.
        } finally {
            await AsyncStorage.removeItem(DEVICE_KEY);
            await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
        }
    },

    async getOutage(id: string) {
        return request<Outage>(`/outages/${encodeURIComponent(id)}`);
    },

    async getOutages() {
        return request<Outage[]>('/outages');
    },

    async getUpcomingOutages() {
        const result = await request<Outage[] | { data: Outage[] }>('/outages/upcoming');
        return Array.isArray(result) ? result : result.data || [];
    },

    async getActiveOutages() {
        const result = await request<Outage[] | { data: Outage[] }>('/outages/active');
        return Array.isArray(result) ? result : result.data || [];
    },

    async getLocations() {
        const result = await request<Location[] | { data: Location[] }>('/locations');
        return Array.isArray(result) ? result : result.data || [];
    },

    async getUtilities() {
        const result = await request<Utility[] | { data: Utility[] }>('/utilities');
        return Array.isArray(result) ? result : result.data || [];
    },

    async getSubscriptions() {
        const result = await request<Subscription[] | { data: Subscription[] }>('/subscriptions');
        return Array.isArray(result) ? result : result.data || [];
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

    async getReports() {
        const result = await request<Report[] | { data: Report[] }>('/reports');
        return Array.isArray(result) ? result : result.data || [];
    },

    async createReport(locationId: string, utilityId: string, description: string) {
        return request<Report>('/reports', {
            method: 'POST',
            body: JSON.stringify({ locationId, utilityId, description }),
        });
    },

    async updateReport(id: string, description: string) {
        return request<Report>(`/reports/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ description }),
        });
    },

    async getNotificationList() {
        const result = await request<NotificationItem[] | { data: NotificationItem[] }>('/notifications');
        return Array.isArray(result) ? result : result.data || [];
    },

    async markNotificationRead(id: string) {
        await request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
        return id;
    },

    async getStoredDeviceId() {
        return AsyncStorage.getItem(DEVICE_KEY);
    },

    async getStoredDeviceToken() {
        return AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    },

    async clearStoredDevice() {
        await AsyncStorage.removeItem(DEVICE_KEY);
        await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
    },

    get apiUrl() {
        return API_URL;
    },
};

export { DEVICE_TOKEN_KEY };

export function extractOutageAreas(outage: Outage): string[] {
    const areas = (outage.outageLocations ?? [])
        .map(({ location }) => {
            const parts = [location?.district, location?.sector, location?.cell]
                .filter((part): part is string => Boolean(part));
            return parts.join(' - ');
        })
        .filter(Boolean);
    return Array.from(new Set(areas));
}
