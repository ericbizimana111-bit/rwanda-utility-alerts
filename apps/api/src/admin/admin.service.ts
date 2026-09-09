import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Outage } from '../outages/outage.entity';
import { Report } from '../reports/report.entity';
import { Notification } from '../notifications/notification.entity';
import { Device } from '../devices/device.entity';
import { DataSource } from '../data-sources/data-source.entity';
import { Location } from '../locations/location.entity';
import { Utility } from '../utilities/utility.entity';

@Injectable()
export class AdminService {
	constructor(
		@InjectRepository(User) private readonly users: Repository<User>,
		@InjectRepository(Subscription) private readonly subscriptions: Repository<Subscription>,
		@InjectRepository(Outage) private readonly outages: Repository<Outage>,
		@InjectRepository(Report) private readonly reports: Repository<Report>,
		@InjectRepository(Notification) private readonly notifications: Repository<Notification>,
		@InjectRepository(Device) private readonly devices: Repository<Device>,
		@InjectRepository(DataSource) private readonly dataSources: Repository<DataSource>,
		@InjectRepository(Location) private readonly locations: Repository<Location>,
		@InjectRepository(Utility) private readonly utilities: Repository<Utility>,
	) { }

	async overview() {
		const [totalUsers, activeSubscriptions, upcomingOutages, activeOutages, pendingReports, notificationsSent, registeredDevices] = await Promise.all([
			this.users.count(),
			this.subscriptions.count({ where: { isActive: true } }),
			this.outages.count({ where: { status: 'planned' } }),
			this.outages.count({ where: { status: 'active' } }),
			this.reports.count({ where: { status: 'pending' } }),
			this.notifications.count({ where: { status: 'sent' } }),
			this.devices.count({ where: { isActive: true } }),
		]);
		return { totalUsers, activeSubscriptions, upcomingOutages, activeOutages, pendingReports, notificationsSent, registeredDevices };
	}

	async usersList() {
		const users = await this.users.find({ order: { createdAt: 'DESC' } });
		return users.map(({ password, ...user }) => user);
	}

	usersSubscriptions() { return this.subscriptions.find({ relations: { user: true, utility: true, location: true }, order: { createdAt: 'DESC' } }); }
	outagesList() { return this.outages.find({ relations: { utility: true, outageLocations: { location: true } }, order: { startTime: 'DESC' } }); }
	reportsList() { return this.reports.find({ relations: { user: true, utility: true, location: true }, order: { createdAt: 'DESC' } }); }
	dataSourcesList() { return this.dataSources.find({ order: { name: 'ASC' } }); }
	notificationsList() { return this.notifications.find({ relations: { user: true, outage: true }, order: { createdAt: 'DESC' } }); }
	locationsList() { return this.locations.find({ order: { province: 'ASC', district: 'ASC', sector: 'ASC' } }); }
	utilitiesList() { return this.utilities.find({ order: { name: 'ASC' } }); }
}
