import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from '@nestjs/common';

import { UtilitiesService } from './utilities.service';
import { CreateUtilityDto } from './dto/create-utility.dto';

@Controller('utilities')
export class UtilitiesController {
    constructor(
        private readonly utilitiesService: UtilitiesService,
    ) { }

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
        @Param('id') id: string,
    ) {
        return this.utilitiesService.findById(id);
    }
}