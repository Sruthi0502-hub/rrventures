import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertiesService } from './properties.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/admins/schemas/admin.schema';
import { Roles } from 'src/common/decorators/roles.decorators';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Controller('properties')
export class PropertiesController {
    constructor(private propertyService: PropertiesService) { }

    @ApiBearerAuth()
    @Patch(':id')
    @ApiTags('update-Property')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                },
                price: {
                    type: 'number'
                },
                location: {
                    type: 'string'
                },
                image: { type: 'string', format: 'binary' },
            },
            required: [
                'title',
                'description',
                'price',
                'location',
                'image'
            ]
        },
    })
    updateProperty(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @Req() req, @UploadedFile() file: Express.Multer.File) {
        return this.propertyService.updateProperty(id, dto, req.user, file)

    }

    @Delete(':id')
    @ApiBearerAuth()
    // @ApiTags('delete-property')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    deletePropert(@Param('id') id: string, @Req() req) {
        return this.propertyService.deleteProperty(id, req.user)
    }

    @Get('admin-property')
    @ApiTags('created-admin-property')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    adminProperties(@Req() req) {
        return this.propertyService.adminProperty(req.user.userId, req.user);
    }


    // @Get('super-admin-property')
    // @ApiTags('super-admin-property')
    // @ApiBearerAuth()
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.SUPER_ADMIN)
    // superadminProperties(@Req() req) {
    //     return this.propertyService.superAdminProperty(req.user.userId);
    // }


    @Post('create-properties')
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
                title: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                },
                price: {
                    type: 'number'
                },
                location: {
                    type: 'string'
                },
                image: { type: 'string', format: 'binary' },
            },
            required: [
                'title',
                'description',
                'price',
                'location',
                'image'
            ]
        },
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    createProperty(@UploadedFile() file: Express.Multer.File, @Body() dto: CreatePropertyDto, @Req() req) {

        return this.propertyService.create(dto, file, req.user)
    }









}
