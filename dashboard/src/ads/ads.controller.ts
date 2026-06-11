import { Controller, Get, Post, UseInterceptors, UploadedFile, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/admins/schemas/admin.schema';

@Controller('ads')
export class AdsController {
  constructor(private adsService: AdsService) {}

  @Get()
  @ApiTags('ads')
  async findAll() {
    return this.adsService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => cb(null, Date.now() + extname(file.originalname)),
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['title', 'description', 'image'],
    },
  })
  async create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateAdDto, @Req() req) {
    return this.adsService.create(dto, file, req.user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async update(@Param('id') id: string, @Body() dto: Partial<CreateAdDto>, @UploadedFile() file: Express.Multer.File) {
    return this.adsService.update(id, dto, file);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.adsService.remove(id);
  }
}
