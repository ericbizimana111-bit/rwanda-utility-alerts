import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OutagesService } from './outages.service';
import { CreateOutageDto } from './dto/create-outage.dto';
import { InternalCollectorGuard } from '../auth/guards/collector-api-key.guard';

@Controller('outages')
export class OutagesController {
    constructor(
        private readonly outagesService: OutagesService,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('USER', 'ADMIN')
    @Get()
    async findAll() {
        return this.outagesService.findAll();
    }

    @Get('upcoming')
    async findUpcoming() {
        return this.outagesService.findUpcoming();
    }

    @Get('active')
    async findActive() {
        return this.outagesService.findActive();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.outagesService.findById(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async create(@Body() dto: CreateOutageDto, @Req() req: any) {
        return this.outagesService.create({
            ...dto,
            locationId: dto.locationId,
            status: dto.status ?? 'planned',
            sourceType: dto.sourceType ?? 'official',
            sourceName: dto.sourceName ?? 'admin',
            sourceUrl: dto.sourceUrl ?? null,
        });
    }

    @UseGuards(InternalCollectorGuard)
    @Post('internal/collector')
    async createFromCollector(@Body() dto: any) {
        return this.outagesService.createFromCollector(dto);
    }
}