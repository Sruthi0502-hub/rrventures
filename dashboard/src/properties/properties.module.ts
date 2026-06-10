import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { AdminsService } from 'src/admins/admins.service';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from './schemas/property.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
        AuthModule,
        MongooseModule.forFeature([
            {
                name: Property.name,
                schema: PropertySchema
            }
        ])
    ],
    controllers: [PropertiesController],
    providers: [PropertiesService],

})
export class PropertiesModule { }
