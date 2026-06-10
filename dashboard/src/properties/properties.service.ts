import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property } from './schemas/property.schema';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Role } from 'src/admins/schemas/admin.schema';
import { BADFAMILY } from 'dns';



@Injectable()
export class PropertiesService {
    constructor(@InjectModel(Property.name)
    private propertyModel: Model<Property>) { }


    async create(dto: CreatePropertyDto, File: Express.Multer.File, admin) {
        try {
            return this.propertyModel.create({
                ...dto,
                image: File.filename,
                createdBy: admin.userId
            })
        }
        catch (error: any) {
            throw new BadRequestException(error.message)
        }

    }

    async adminProperty(userId: string, user) {
        try {
            if (user.role === Role.SUPER_ADMIN) {
                return this.propertyModel.find().populate('createdBy');
            }
            const property = await this.propertyModel.find({ createdBy: userId }).populate('createdBy').exec();
            return { property }
        }
        catch (error: any) {
            throw new BadRequestException(error.message)
        }
    }

    async updateProperty(id: string, dto: UpdatePropertyDto, user, file: Express.Multer.File) {
        try {
            const Property = await this.propertyModel.findById(id);
            if (!Property) {
                throw new NotFoundException('Property Not Found')
            }
            if (user.role === Role.ADMIN && Property.createdBy.toString() !== user.userId) {
                throw new ForbiddenException('You can update only own properties')
            }
            if (file) {
                dto['image'] = file.filename
            }
            // if (user.role === Role.SUPER_ADMIN) {
            //     return update
            // }
            const update = await this.propertyModel.findByIdAndUpdate(id, dto, { new: true })

            return {
                message: 'Property Successfully Updated',
                update
            }
        }
        catch (error: any) {
            throw new BadRequestException(error.message)
        }

    }


    async deleteProperty(id: string, user) {
        try {
            const property = await this.propertyModel.findById(id);
            if (!property) {
                throw new NotFoundException('Property Not Found')
            }
            if (user.role === Role.ADMIN && property.createdBy.toString() !== user.userId) {
                throw new NotFoundException('You can Delete Only Own Property')
            }
            await this.propertyModel.findByIdAndDelete(id)
            return {
                message: 'Property Deleted Successfully'
            }
        }
        catch (error: any) {
            throw new BadRequestException(error.message)
        }
    }

}
