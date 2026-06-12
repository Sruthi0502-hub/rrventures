import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Ad, AdSchema } from './schemas/ad.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Ad.name,
        schema: AdSchema
      }
    ])
  ],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService]
})
export class AdsModule {}
