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

import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
    constructor(
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    @Post()
    async create(
        @Req() req: any,
        @Body() dto: CreateSubscriptionDto,
    ) {
        return this.subscriptionsService.create(
            req.user.id,
            dto.locationId,
            dto.utilityId,
        );
    }

    @Get()
    async findMySubscriptions(@Req() req: any) {
        return this.subscriptionsService.findUserSubscriptions(
            req.user.id,
        );
    }

    @Delete(':id')
    async remove(
        @Req() req: any,
        @Param('id') subscriptionId: string,
    ) {
        return this.subscriptionsService.remove(
            req.user.id,
            subscriptionId,
        );
    }
}