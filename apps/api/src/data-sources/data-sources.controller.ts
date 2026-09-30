import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { InternalCollectorGuard } from '../auth/guards/collector-api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DataSourcesService } from './data-sources.service';

export class SourceReportDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    baseUrl?: string;

    @IsBoolean()
    success: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    itemCount?: number;

    @IsOptional()
    @IsString()
    error?: string;
}

@Controller('data-sources')
export class DataSourcesController {
    constructor(private readonly dataSourcesService: DataSourcesService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    findAll() {
        return this.dataSourcesService.findAll();
    }

    /** Heartbeat sent by the data collector after it checks a source. */
    @UseGuards(InternalCollectorGuard)
    @Post('internal/report')
    report(@Body() dto: SourceReportDto) {
        return this.dataSourcesService.recordCheck(dto);
    }
}
