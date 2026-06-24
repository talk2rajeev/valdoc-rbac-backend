import { Controller, Get, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { UserPermissionsService } from './user-permissions.service';

@Controller('userpermissions')
export class UserPermissionsController {
    constructor(private readonly userPermissionsService: UserPermissionsService) { }

    @Get(':userId')
    @HttpCode(HttpStatus.OK)
    async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
        return this.userPermissionsService.findAllByUserId(userId);
    }
}