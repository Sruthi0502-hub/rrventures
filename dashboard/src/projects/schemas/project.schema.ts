import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true })
  client!: string;

  @Prop({ required: true })
  year!: string;

  @Prop({ required: false })
  image?: string;

  @Prop({ type: [String], default: [] })
  gallery?: string[];

  @Prop({ required: true })
  description!: string;

  @Prop({ type: mongoose.Schema.Types.Map, of: String, default: {} })
  specifications?: Map<string, string>;

  @Prop({ default: 'Active' })
  status!: string; // 'Active' or 'Inactive'

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true })
  createdBy!: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
export type ProjectDocument = Project & Document;
