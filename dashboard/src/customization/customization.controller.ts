import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { CustomizationService } from './customization.service';
import { UpdateCustomizationDto } from './dto/update-customization.dto';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/admins/schemas/admin.schema';

@Controller('customization')
@ApiTags('customization')
export class CustomizationController {
  constructor(private readonly customizationService: CustomizationService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getCustomization() {
    return this.customizationService.findOne();
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBody({ type: UpdateCustomizationDto })
  async updateCustomization(@Body() dto: UpdateCustomizationDto) {
    return this.customizationService.update(dto);
  }
}
