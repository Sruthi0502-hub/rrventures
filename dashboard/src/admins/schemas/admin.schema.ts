import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";


export type AdminDocument = HydratedDocument<Admin>;
export enum Role {
    SUPER_ADMIN = 'superAdmin',
    ADMIN = 'Admin',
}
@Schema({ timestamps: true })
export class Admin {

    @Prop({ required: true, trim: true, type: String })
    name!: string

    @Prop({ required: true, unique: true, type: String })
    email!: string

    @Prop({ required: true, type: String })
    password!: string

    @Prop({ type: String, enum: Role, required: true })
    role!: Role;

    @Prop({ default: true })
    isActive!: boolean;
    // @Prop()
    // date:

    // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'property', required: true })
    // createdBy!: string

}
export const AdminSchema = SchemaFactory.createForClass(Admin);
