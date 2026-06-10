import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Admin } from "src/admins/schemas/admin.schema";

@Schema({ timestamps: true })

export class Property {

    @Prop({ required: true })
    title!: string

    @Prop({ required: true })
    description!: string


    @Prop({ required: true })
    price!: number

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true })
    createdBy!: string

    @Prop({ required: true })
    image!: string

    @Prop({ required: true })
    location!: string

}

export const PropertySchema = SchemaFactory.createForClass(Property)