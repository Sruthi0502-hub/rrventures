import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomizationController } from './customization.controller';
import { CustomizationService } from './customization.service';
import { Customization, CustomizationSchema } from './schemas/customization.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Customization.name, schema: CustomizationSchema }])],
  controllers: [CustomizationController],
  providers: [CustomizationService],
  exports: [CustomizationService],
})
export class CustomizationModule {}
