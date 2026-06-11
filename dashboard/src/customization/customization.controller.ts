import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CustomizationService } from './customization.service';
import { UpdateCustomizationDto } from './dto/update-customization.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/admins/schemas/admin.schema';

@Controller('customization')
export class CustomizationController {
  constructor(private svc: CustomizationService) {}

  @Get()
  @ApiTags('customization')
  async get() {
    return this.svc.get();
  }

  @Patch()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(@Body() dto: UpdateCustomizationDto) {
    return this.svc.update(dto);
  }
}
