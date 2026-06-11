import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Customization {
  @Prop({ default: '' })
  companyName!: string;

  @Prop({ default: '' })
  companyEmail!: string;

  @Prop({ default: '' })
  companyDescription!: string;

  @Prop({ default: '' })
  contactPhone!: string;

  @Prop({ default: '' })
  contactAddress!: string;

  @Prop({ default: '' })
  footerText!: string;
}

export const CustomizationSchema = SchemaFactory.createForClass(Customization);
