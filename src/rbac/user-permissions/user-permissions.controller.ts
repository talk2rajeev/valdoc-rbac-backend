import { Controller, Get, Param, ParseIntPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UserPermissionsService } from './user-permissions.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('userpermissions')
@UseGuards(JwtAuthGuard)
export class UserPermissionsController {
    constructor(private readonly userPermissionsService: UserPermissionsService) { }

    @Get(':userId')
    @HttpCode(HttpStatus.OK)
    async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
        return this.userPermissionsService.findAllByUserId(userId);
    }
}