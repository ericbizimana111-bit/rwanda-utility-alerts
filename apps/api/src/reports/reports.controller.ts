import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { ModerateReportDto } from './dto/moderate-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post()
    create(@Req() req: any, @Body() dto: CreateReportDto) {
        return this.reportsService.create(req.user.id, dto);
    }

    @Get()
    findMine(@Req() req: any) {
        return this.reportsService.findMine(req.user.id);
    }

    @Get('pending')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    findPending() {
        return this.reportsService.findPending();
    }

    @Get(':id')
    findOne(@Req() req: any, @Param('id') reportId: string) {
        return this.reportsService.findById(reportId, req.user.id, req.user.role === 'ADMIN');
    }

    @Patch(':id')
    updateMine(@Req() req: any, @Param('id') reportId: string, @Body() dto: UpdateReportDto) {
        return this.reportsService.updateMine(req.user.id, reportId, dto.description as string);
    }

    @Patch(':id/status')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    moderate(@Param('id') reportId: string, @Body() dto: ModerateReportDto) {
        return this.reportsService.moderate(reportId, dto.status);
    }
}
