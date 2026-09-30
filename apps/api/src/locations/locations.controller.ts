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

import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';

@Controller('locations')
export class LocationsController {
    constructor(
        private readonly locationsService: LocationsService,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    @Post()
    async create(
        @Body() createLocationDto: CreateLocationDto,
    ) {
        return this.locationsService.create(
            createLocationDto,
        );
    }

    @Get()
    async findAll() {
        return this.locationsService.findAll();
    }

    @Get('province/:province')
    async findByProvince(
        @Param('province') province: string,
    ) {
        return this.locationsService.findByProvince(
            province,
        );
    }

    @Get('district/:district')
    async findByDistrict(
        @Param('district') district: string,
    ) {
        return this.locationsService.findByDistrict(
            district,
        );
    }

    @Get(':id')
    async findById(
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.locationsService.findById(id);
    }
}