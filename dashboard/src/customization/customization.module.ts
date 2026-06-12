import { Module } from '@nestjs/common';
import { CustomizationController } from './customization.controller';
import { CustomizationService } from './customization.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Customization, CustomizationSchema } from './schemas/customization.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Customization.name,
        schema: CustomizationSchema
      }
    ])
  ],
  controllers: [CustomizationController],
  providers: [CustomizationService],
  exports: [CustomizationService]
})
export class CustomizationModule {}
