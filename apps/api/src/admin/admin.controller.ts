import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
	constructor(private readonly adminService: AdminService) { }
	@Get('overview') overview() { return this.adminService.overview(); }
	@Get('users') users() { return this.adminService.usersList(); }
	@Get('subscriptions') subscriptions() { return this.adminService.usersSubscriptions(); }
	@Get('outages') outages() { return this.adminService.outagesList(); }
	@Get('reports') reports() { return this.adminService.reportsList(); }
	@Get('data-sources') dataSources() { return this.adminService.dataSourcesList(); }
	@Get('notifications') notifications() { return this.adminService.notificationsList(); }
	@Get('locations') locations() { return this.adminService.locationsList(); }
	@Get('utilities') utilities() { return this.adminService.utilitiesList(); }
}
