import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from '@nestjs/common';

import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';

@Controller('locations')
export class LocationsController {
    constructor(
        private readonly locationsService: LocationsService,
    ) { }

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
        @Param('id') id: string,
    ) {
        return this.locationsService.findById(id);
    }
}