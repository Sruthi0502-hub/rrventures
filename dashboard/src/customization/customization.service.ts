import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customization, CustomizationDocument } from './schemas/customization.schema';
import { UpdateCustomizationDto } from './dto/update-customization.dto';

@Injectable()
export class CustomizationService {
  constructor(
    @InjectModel(Customization.name)
    private customizationModel: Model<CustomizationDocument>,
  ) {}

  async findOne() {
    try {
      let item = await this.customizationModel.findOne().exec();
      if (!item) {
        // Create a default singleton document if none exists
        item = await this.customizationModel.create({
          companyName: 'RRventures',
          companyEmail: 'info@rrventures.com',
          companyDescription: 'Premium marketing and real estate services.',
          contactPhone: '+1 (555) 123-4567',
          contactAddress: '123 Business St, New York, NY 10001',
          footerText: '© 2026 RRventures. All rights reserved.',
        });
      }
      return item;
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async update(dto: UpdateCustomizationDto) {
    try {
      // Find the first document and update/upsert it
      return await this.customizationModel.findOneAndUpdate(
        {},
        { $set: dto },
        { new: true, upsert: true }
      ).exec();
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
