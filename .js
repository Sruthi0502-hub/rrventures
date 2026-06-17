// import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
// import { ProvideService } from './provideservices.service';
// import { CreateServiceDto } from './dto/create-service.dto';
// import { UpdateServiceDto } from './dto/update-service.dto';
// import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
// import { AuthGuard } from '@nestjs/passport';
// import { Role } from 'src/admins/schemas/admin.schema';
// import { Roles } from 'src/common/decorators/roles.decorators';
// import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
// import { RolesGuard } from 'src/common/guards/roles.guard';
// import { extname, resolve } from 'path';
// import { FilesInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { existsSync, mkdirSync } from 'fs';

// @Controller('services')
// export class ServicesController {
//   constructor(private readonly provideServices: ProvideService) { }

//   @Post()
//   @ApiTags('Create-Services')
//   @UseInterceptors(
//     FilesInterceptor('images', 10, {
//       storage: diskStorage({
//         destination: (_req, _file, cb) => {
//           const targetPath = resolve(process.cwd(), 'uploads');
//           if (!existsSync(targetPath)) {
//             mkdirSync(targetPath, { recursive: true });
//           }
//           cb(null, targetPath);
//         },
//         filename: (_req, file, cb) => {
//           const uniqueName = Date.now() + extname(file.originalname);
//           cb(null, uniqueName);
//         },
//       }),
//     }),
//   )
//   @ApiConsumes('multipart/form-data')
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         title: { type: 'string' },
//         description: { type: 'string' },

//         images: {
//           type: 'array',
//           items: {
//             type: 'string',
//             format: 'binary'
//           }
//         }
//       },
//       required: ['title', 'description', 'images'],
//     },
//   })
//   @ApiBearerAuth()
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.ADMIN, Role.SUPER_ADMIN)

//   create(@Body() dto: CreateServiceDto, @Req() req, @UploadedFiles() file: Express.Multer.File[]) {
//     return this.provideServices.createService(dto, file, req.user);
//   }

//   @Get()
//   @ApiTags('getAllServices')
//   @ApiBearerAuth()
//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles(Role.SUPER_ADMIN)
//   findAll(@Req() req) {
//     return this.provideServices.findAll(req.user, req.user.userId);
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.provideServices.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
//     return this.provideServices.update(+id, updateServiceDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.provideServices.remove(+id);
//   }
// }




//   Services
// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { CreateServiceDto } from './dto/create-service.dto';
// import { UpdateServiceDto } from './dto/update-service.dto';
// import { InjectModel } from '@nestjs/mongoose';

// import { Model } from 'mongoose';
// import { Role } from 'src/admins/schemas/admin.schema';
// import { SchemaService } from './schema/provideservices.schema';

// @Injectable()
// export class ProvideService {
//   constructor(
//     @InjectModel(SchemaService.name)
//     private serviceModel: Model<SchemaService>,
//   ) { }


//   async createService(dto: CreateServiceDto, files: Express.Multer.File[], admin) {
//     try {
//       const images = files.map(e =>
//         e.filename
//       )
//       const description = Array.isArray((dto as any).description)
//         ? (dto as any).description
//         : [(dto as any).description].filter(Boolean)

//       return this.serviceModel.create({
//         ...dto,
//         description,
//         images: images,
//         createdBy: admin.userId,
//       })



//     }

//     catch (error) {
//       throw new BadRequestException(error)
//     }
//   }

//   findAll(userId: string, admin) {
//     try {
//       //const admin = this.AdminModel.find()
//       if (admin.role === Role.SUPER_ADMIN)
//         return this.serviceModel.find().populate("createdBy", "name email");
//       const service = this.serviceModel.find({ createdBy: userId }).populate('createdBy', 'name email');
//       return service
//     }
//     catch (error) {
//       throw new BadRequestException(error)
//     }
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} service`;
//   }

//   update(id: number, updateServiceDto: UpdateServiceDto) {
//     return `This action updates a #${id} service`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} service`;
//   }
// }



// @Prop({ required: true, trim: true })
// title!: string

// @Prop({ required: true, trim: true })
// description!: string[]

// @Prop({ default: [], type: [String] })
// images!: string[]

// @Prop({ default: true })
// isActive!: boolean

// @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true })
// createdBy!: Types.ObjectId