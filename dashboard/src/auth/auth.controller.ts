import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SetupSuperAdminDto } from './dto/setup-super-admin.dto';
import { loginDto } from './dto/login.dto';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdateSuperAdminDto } from './dto/update-super-admin.dto';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('create-super-admin')
  @ApiTags('create-super-admin')
  setupSuperAdmin(@Body() dto: SetupSuperAdminDto) {
    return this.authService.setupSuperAdmin(dto)
  }


  @Post('login')
  @ApiTags('login')
  login(@Body() dto: loginDto) {
    return this.authService.Login(dto)
  }

  // @Patch('update-super-admin')
  // @UseGuards(AuthGuard)
  // updateSuperAdmin(@Body() dto: UpdateSuperAdminDto, @Req() req) {
  //   return this.authService.updatesuperAdmin(req.admin.userId, dto)
  // }

}
