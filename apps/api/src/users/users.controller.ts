import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    getMe(@Req() req: any) {
        return this.usersService.getProfile(req.user.id);
    }

    @Patch('me')
    updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user.id, dto);
    }

    @Patch('me/password')
    changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
    }
}
