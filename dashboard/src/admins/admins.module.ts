import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { Property, PropertySchema } from 'src/properties/schemas/property.schema';

@Module({
    imports: [MongooseModule.forFeature([
        { name: Admin.name, schema: AdminSchema }, { name: Property.name, schema: PropertySchema }])],
    controllers: [AdminsController],
    providers: [AdminsService],
    exports: [MongooseModule, AdminsService],
})
export class AdminsModule { }
