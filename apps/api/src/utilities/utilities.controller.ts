import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UtilitiesService } from './utilities.service';
import { CreateUtilityDto } from './dto/create-utility.dto';

@Controller('utilities')
export class UtilitiesController {
    constructor(
        private readonly utilitiesService: UtilitiesService,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    @Post()
    async create(
        @Body() createUtilityDto: CreateUtilityDto,
    ) {
        return this.utilitiesService.create(
            createUtilityDto,
        );
    }

    @Get()
    async findAll() {
        return this.utilitiesService.findAll();
    }

    @Get('code/:code')
    async findByCode(
        @Param('code') code: string,
    ) {
        return this.utilitiesService.findByCode(code);
    }

    @Get(':id')
    async findById(
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.utilitiesService.findById(id);
    }
}