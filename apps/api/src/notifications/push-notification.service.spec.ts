import { jest } from '@jest/globals';

import { PushNotificationService } from './push-notification.service';

const notification = {
    id: 'notification-1',
    userId: 'user-1',
    outageId: 'outage-1',
    title: 'Planned outage',
    message: 'Electricity outage in Gasabo, Remera.',
    status: 'queued',
};

const outage = {
    id: 'outage-1',
    utility: { code: 'ELECTRICITY' },
    outageLocations: [
        { location: { district: 'Gasabo', sector: 'Remera', cell: null, village: null } },
    ],
};

function createService(devices: any[]) {
    const update = jest.fn().mockResolvedValue(undefined);
    const save = jest.fn().mockImplementation(async (device) => device);
    const service = new PushNotificationService(
        {
            find: jest.fn().mockResolvedValue(devices),
            save,
        } as any,
        {
            findOne: jest.fn().mockResolvedValue(notification),
            update,
        } as any,
        {
            findOne: jest.fn().mockResolvedValue(outage),
        } as any,
    );

    return { service, update, save };
}

function expoResponse(body: any, ok = true) {
    return {
        ok,
        status: ok ? 200 : 503,
        json: jest.fn().mockResolvedValue(body),
    } as any;
}

describe('PushNotificationService', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('sends to every active device and marks the notification sent', async () => {
        const devices = [
            { id: 'device-android', userId: 'user-1', pushToken: 'ExponentPushToken[android]', isActive: true },
            { id: 'device-ios', userId: 'user-1', pushToken: 'ExpoPushToken[ios]', isActive: true },
        ];
        const { service, update } = createService(devices);
        const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
            expoResponse({ data: [{ status: 'ok', id: 'ticket-1' }] }),
        );

        const results = await service.deliverNotification(notification.id);

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(results).toHaveLength(2);
        expect(results.every((result) => result.status === 'sent')).toBe(true);
        expect(update).toHaveBeenLastCalledWith(notification.id, expect.objectContaining({ status: 'sent' }));
        const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
        expect(payload.data).toEqual(expect.objectContaining({
            type: 'outage',
            outageId: 'outage-1',
            utility: 'ELECTRICITY',
        }));
    });

    it('does not send to inactive devices', async () => {
        const { service, update } = createService([]);
        const fetchMock = jest.spyOn(globalThis, 'fetch');

        const results = await service.deliverNotification(notification.id);

        expect(results).toHaveLength(0);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalledWith(notification.id, expect.objectContaining({ status: 'sent' }));
    });

    it('deactivates permanently invalid Expo tokens', async () => {
        const device = { id: 'device-invalid', userId: 'user-1', pushToken: 'ExponentPushToken[invalid]', isActive: true };
        const { service, save, update } = createService([device]);
        jest.spyOn(globalThis, 'fetch').mockResolvedValue(
            expoResponse({ data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }] }),
        );

        const results = await service.deliverNotification(notification.id);

        expect(results[0]).toEqual(expect.objectContaining({ status: 'failed', permanent: true }));
        expect(device.isActive).toBe(false);
        expect(save).toHaveBeenCalledWith(device);
        expect(update).toHaveBeenLastCalledWith(notification.id, expect.objectContaining({ status: 'failed' }));
    });

    it('rejects malformed tokens without calling Expo', async () => {
        const device = { id: 'device-malformed', userId: 'user-1', pushToken: 'not-an-expo-token', isActive: true };
        const { service, save } = createService([device]);
        const fetchMock = jest.spyOn(globalThis, 'fetch');

        const results = await service.deliverNotification(notification.id);

        expect(results[0]).toEqual(expect.objectContaining({ status: 'skipped' }));
        expect(fetchMock).not.toHaveBeenCalled();
        expect(device.isActive).toBe(false);
        expect(save).toHaveBeenCalledWith(device);
    });

    it('preserves the database notification when Expo fails', async () => {
        const device = { id: 'device-failing', userId: 'user-1', pushToken: 'ExpoPushToken[failing]', isActive: true };
        const { service, update } = createService([device]);
        jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Expo unavailable'));

        const results = await service.deliverNotification(notification.id);

        expect(results[0]).toEqual(expect.objectContaining({ status: 'failed', permanent: false }));
        expect(update).toHaveBeenLastCalledWith(notification.id, expect.objectContaining({ status: 'failed' }));
    });

    it('handles missing active devices without failing', async () => {
        const { service } = createService([]);

        await expect(service.deliverNotification(notification.id)).resolves.toEqual([]);
    });
});
