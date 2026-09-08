import {
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
    ) { }

    @Get()
    async getMyNotifications(@Req() req: any) {
        return this.notificationsService.getUserNotifications(
            req.user.id,
        );
    }

    @Patch(':id/read')
    async markAsRead(
        @Req() req: any,
        @Param('id') notificationId: string,
    ) {
        return this.notificationsService.markAsRead(
            req.user.id,
            notificationId,
        );
    }

    @Post('outage/:outageId')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    async createForOutage(
        @Param('outageId') outageId: string,
    ) {
        return this.notificationsService.createNotificationsForOutage(
            outageId,
        );
    }
}