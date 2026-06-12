import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from 'src/admins/schemas/admin.schema';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { AdsService } from './ads.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueName = Date.now() + extname(file.originalname);
          cb(null, uniqueName);
        },
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
        price: { type: 'number' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['title', 'description', 'price', 'image'],
    },
  })
  async create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateAdDto, @Req() req) {
    const ad = await this.adsService.create(dto, file, req.user);
    if (!ad) {
      throw new NotFoundException('Failed to create ad');
    }
    const obj = ad.toObject();
    return {
      ...obj,
      image: obj.imageUrl
    };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAds(@Req() req) {
    const ads = await this.adsService.findByAdmin(req.user.userId, req.user);
    return ads.map(ad => {
      const obj = ad.toObject();
      return {
        ...obj,
        id: obj._id,
        image: obj.imageUrl
      };
    });
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueName = Date.now() + extname(file.originalname);
          cb(null, uniqueName);
        },
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
        price: { type: 'number' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() dto: UpdateAdDto, @Req() req, @UploadedFile() file: Express.Multer.File) {
    const ad = await this.adsService.update(id, dto, req.user, file);
    if (!ad) {
      throw new NotFoundException('Ad Not Found');
    }
    const obj = ad.toObject();
    return {
      ...obj,
      image: obj.imageUrl
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string, @Req() req) {
    return this.adsService.remove(id, req.user);
  }
}
