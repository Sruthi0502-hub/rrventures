import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ad, AdDocument } from './schemas/ad.schema';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { Role } from 'src/admins/schemas/admin.schema';

@Injectable()
export class AdsService {
  constructor(
    @InjectModel(Ad.name)
    private adModel: Model<AdDocument>,
  ) {}

  async create(dto: CreateAdDto, file: Express.Multer.File, user: any) {
    try {
      return await this.adModel.create({
        ...dto,
        imageUrl: file ? file.filename || file.path : '',
        createdBy: user.userId || user.id,
      });
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll() {
    try {
      return await this.adModel.find().populate('createdBy').exec();
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async findByAdmin(userId: string, user: any) {
    try {
      if (user.role === Role.SUPER_ADMIN) {
        return await this.adModel.find().populate('createdBy').exec();
      }
      return await this.adModel.find({ createdBy: userId }).populate('createdBy').exec();
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async update(id: string, dto: UpdateAdDto, user: any, file: Express.Multer.File) {
    try {
      const ad = await this.adModel.findById(id);
      if (!ad) {
        throw new NotFoundException('Ad Not Found');
      }
      if (user.role === Role.ADMIN && ad.createdBy.toString() !== user.userId) {
        throw new ForbiddenException('You can update only own ads');
      }
      const updateData = { ...dto };
      if (file) {
        updateData['imageUrl'] = file.filename;
      }
      return await this.adModel.findByIdAndUpdate(id, updateData, { new: true });
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async remove(id: string, user: any) {
    try {
      const ad = await this.adModel.findById(id);
      if (!ad) {
        throw new NotFoundException('Ad Not Found');
      }
      if (user.role === Role.ADMIN && ad.createdBy.toString() !== user.userId) {
        throw new ForbiddenException('You can delete only own ads');
      }
      await this.adModel.findByIdAndDelete(id);
      return { message: 'Ad Deleted Successfully' };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
