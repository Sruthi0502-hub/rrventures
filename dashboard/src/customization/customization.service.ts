import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customization } from './schemas/customization.schema';
import { UpdateCustomizationDto } from './dto/update-customization.dto';

@Injectable()
export class CustomizationService {
  constructor(@InjectModel(Customization.name) private customizationModel: Model<Customization>) {}

  async get() {
    const item = await this.customizationModel.findOne().lean();
    if (!item) {
      const created = await this.customizationModel.create({});
      return created;
    }
    return item;
  }

  async update(dto: UpdateCustomizationDto) {
    const item = await this.customizationModel.findOneAndUpdate({}, { $set: dto }, { new: true, upsert: true });
    return item;
  }
}
