import { jest } from '@jest/globals';
import { NotificationsService } from './notifications.service';

class InMemoryNotificationStore {
    notifications: any[] = [];

    findOne = async ({ where }: any) =>
        this.notifications.find(
            (notification) =>
                notification.userId === where.userId &&
                notification.outageId === where.outageId,
        ) ?? null;

    create = (data: any) => ({ ...data });

    save = async (notification: any) => {
        const saved = {
            ...notification,
            id: notification.id ?? `notification-${this.notifications.length + 1}`,
        };
        this.notifications.push(saved);
        return saved;
    };
}

const outage = {
    id: 'outage-1',
    utilityId: 'electricity-1',
    title: 'Planned electricity interruption',
    description: 'Maintenance works',
    startTime: new Date('2026-09-12T09:30:00.000Z'),
    endTime: null,
    sourceName: 'Rwanda Energy Group',
    sourceUrl: 'https://www.reg.rw/customer-service/power-outages/',
    utility: { name: 'Electricity' },
    outageLocations: [
        {
            locationId: 'location-gasabo',
            location: { district: 'Gasabo', sector: 'Remera', cell: null, village: null },
        },
        {
            locationId: 'location-kicukiro',
            location: { district: 'Kicukiro', sector: 'Niboye', cell: null, village: null },
        },
    ],
};

function createService(options: {
    users: any[];
    subscriptions: any[];
}) {
    const notificationStore = new InMemoryNotificationStore();
    const usersById = new Map(options.users.map((user) => [user.id, user]));

    const subscriptionsRepository = {
        createQueryBuilder: jest.fn(() => {
            const filters = {
                utilityId: '',
                locationIds: [] as string[],
            };

            const builder: any = {
                innerJoinAndSelect: jest.fn(() => builder),
                where: jest.fn(() => builder),
                andWhere: jest.fn((_query: string, parameters?: any) => {
                    if (parameters?.utilityId) {
                        filters.utilityId = parameters.utilityId;
                    }
                    if (parameters?.locationIds) {
                        filters.locationIds = parameters.locationIds;
                    }
                    return builder;
                }),
                getMany: jest.fn(async () =>
                    options.subscriptions.filter(
                        (subscription) =>
                            subscription.isActive &&
                            subscription.utilityId === filters.utilityId &&
                            filters.locationIds.includes(subscription.locationId) &&
                            usersById.get(subscription.userId)?.notificationsEnabled,
                    ),
                ),
            };

            return builder;
        }),
    };

    const service = new NotificationsService(
        notificationStore as any,
        { findOne: async ({ where }: any) => usersById.get(where.id) ?? null } as any,
        { findOne: async () => outage } as any,
        subscriptionsRepository as any,
        { find: jest.fn() } as any,
    );

    return { service, notificationStore };
}

function user(id: string, notificationsEnabled = true) {
    return { id, notificationsEnabled };
}

function subscription(userId: string, locationId: string, utilityId = 'electricity-1', isActive = true) {
    return { userId, locationId, utilityId, isActive };
}

describe('NotificationsService outage matching', () => {
    it('creates one notification for a user matching an affected location', async () => {
        const { service, notificationStore } = createService({
            users: [user('matching-user')],
            subscriptions: [subscription('matching-user', 'location-gasabo')],
        });

        const result = await service.createNotificationsForOutage('outage-1');

        expect(result.matchingSubscriptions).toBe(1);
        expect(result.notificationsCreated).toBe(1);
        expect(notificationStore.notifications).toHaveLength(1);
        expect(notificationStore.notifications[0].userId).toBe('matching-user');
        expect(notificationStore.notifications[0].outageId).toBe('outage-1');
        expect(notificationStore.notifications[0].message).toContain('Gasabo, Remera');
        expect(notificationStore.notifications[0].message).toContain('Rwanda Energy Group');
    });

    it.each([
        ['unaffected location', subscription('user-1', 'location-other')],
        ['inactive subscription', subscription('user-1', 'location-gasabo', 'electricity-1', false)],
        ['wrong utility', subscription('user-1', 'location-gasabo', 'water-1')],
    ])('does not notify for %s', async (_caseName, userSubscription) => {
        const { service, notificationStore } = createService({
            users: [user('user-1')],
            subscriptions: [userSubscription],
        });

        const result = await service.createNotificationsForOutage('outage-1');

        expect(result.notificationsCreated).toBe(0);
        expect(notificationStore.notifications).toHaveLength(0);
    });

    it('does not notify a user with notifications disabled', async () => {
        const { service, notificationStore } = createService({
            users: [user('disabled-user', false)],
            subscriptions: [subscription('disabled-user', 'location-gasabo')],
        });

        const result = await service.createNotificationsForOutage('outage-1');

        expect(result.notificationsCreated).toBe(0);
        expect(notificationStore.notifications).toHaveLength(0);
    });

    it('deduplicates a user subscribed to multiple affected locations', async () => {
        const { service, notificationStore } = createService({
            users: [user('multi-location-user')],
            subscriptions: [
                subscription('multi-location-user', 'location-gasabo'),
                subscription('multi-location-user', 'location-kicukiro'),
            ],
        });

        const result = await service.createNotificationsForOutage('outage-1');

        expect(result.matchingSubscriptions).toBe(2);
        expect(result.notificationsCreated).toBe(1);
        expect(notificationStore.notifications).toHaveLength(1);
    });

    it('is idempotent when generation runs twice', async () => {
        const { service, notificationStore } = createService({
            users: [user('repeat-user')],
            subscriptions: [subscription('repeat-user', 'location-gasabo')],
        });

        const first = await service.createNotificationsForOutage('outage-1');
        const second = await service.createNotificationsForOutage('outage-1');

        expect(first.notificationsCreated).toBe(1);
        expect(second.notificationsCreated).toBe(0);
        expect(notificationStore.notifications).toHaveLength(1);
    });

    it('creates no notifications when an outage has no affected locations', async () => {
        const { service, notificationStore } = createService({
            users: [user('user-1')],
            subscriptions: [subscription('user-1', 'location-gasabo')],
        });
        const outageRepository = (service as any).outagesRepository;
        outageRepository.findOne = async () => ({ ...outage, outageLocations: [] });

        const result = await service.createNotificationsForOutage('outage-1');

        expect(result.notificationsCreated).toBe(0);
        expect(result.matchingSubscriptions).toBe(0);
        expect(notificationStore.notifications).toHaveLength(0);
    });
});
