import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class Customization {
  @Prop({ required: true })
  companyName!: string;

  @Prop({ required: true })
  companyEmail!: string;

  @Prop()
  companyDescription?: string;

  @Prop()
  contactPhone?: string;

  @Prop()
  contactAddress?: string;

  @Prop()
  footerText?: string;
}

export const CustomizationSchema = SchemaFactory.createForClass(Customization);
export type CustomizationDocument = Customization & Document;
