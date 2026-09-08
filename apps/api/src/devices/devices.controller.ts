import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
    constructor(
        private readonly devicesService: DevicesService,
    ) { }

    @Post()
    async registerDevice(
        @Req() req: any,
        @Body()
        body: {
            pushToken: string;
            platform?: string;
        },
    ) {
        return this.devicesService.registerDevice(
            req.user.id,
            body.pushToken,
            body.platform,
        );
    }

    @Get()
    async getMyDevices(@Req() req: any) {
        return this.devicesService.getUserDevices(
            req.user.id,
        );
    }

    @Delete(':id')
    async deactivateDevice(
        @Req() req: any,
        @Param('id') deviceId: string,
    ) {
        return this.devicesService.deactivateDevice(
            req.user.id,
            deviceId,
        );
    }
}