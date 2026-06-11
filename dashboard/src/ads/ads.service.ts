import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ad, AdDocument } from './schemas/ad.schema';
import { CreateAdDto } from './dto/create-ad.dto';

@Injectable()
export class AdsService {
  constructor(@InjectModel(Ad.name) private adModel: Model<AdDocument>) {}

  async create(dto: CreateAdDto, file: Express.Multer.File, user: any) {
    try {
      const ad = await this.adModel.create({
        ...dto,
        image: file ? file.filename || file.path : '',
        createdBy: user.userId || user.id,
      });
      return ad;
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll() {
    return this.adModel.find().lean();
  }

  async update(id: string, dto: Partial<CreateAdDto>, file: Express.Multer.File) {
    return this.adModel.findByIdAndUpdate(id, { ...dto, image: file ? file.filename || file.path : undefined }, { new: true });
  }

  async remove(id: string) {
    return this.adModel.findByIdAndDelete(id);
  }
}
