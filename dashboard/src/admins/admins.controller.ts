import { Body, Controller, Delete, Get, Injectable, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { createAdminDto } from './dto/create-admin.dto';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminsService } from './admins.service';
import { Role } from './schemas/admin.schema';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { updateAdminDto } from './dto/update-admin.dto';


@Controller('admins')
export class AdminsController {
    constructor(private adminService: AdminsService) { }

    @Patch('Update-Profile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    updateProfile(@Body() body: updateAdminDto, @Req() req) {
        return this.adminService.updateAdminProfile(req.user.userId, body)
    }

    // @ApiTags('profile-update-by-superAdmin')
    @Patch('profile-update-by-superAdmin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles(Role.SUPER_ADMIN)
    updateAdminprofile(@Param('id') id: string, @Body() dto: updateAdminDto) {
        return this.adminService.updateAdminProfile(id, dto)
    }


    @Post('Create-Admin')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiTags('Create-Admin')
    create(@Body() Body: createAdminDto) {
        return this.adminService.createAdmin(Body);
    }

    @Get('find-Admin')
    @ApiTags('getByAdmin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiBearerAuth()
    findAdmin() {
        return this.adminService.getAllAdmin();
    }

    @Delete(':id')
    @ApiTags('delete-Admin')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    deleteAdmin(@Param('id') id: string,) {
        return this.adminService.deleteAdmin(id)
    }

}



