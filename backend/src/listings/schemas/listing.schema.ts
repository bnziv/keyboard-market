import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ListingDocument = HydratedDocument<Listing>;

@Schema({ timestamps: { createdAt: 'createdOn', updatedAt: false } })
export class Listing {
  @Prop({ required: true })
  title!: string;

  @Prop({ maxlength: 1000 })
  description?: string;

  @Prop()
  price?: number;

  @Prop({ default: false })
  offers!: boolean;

  @Prop({ required: true })
  condition!: string;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true })
  userId!: string;

  createdOn?: Date;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);
ListingSchema.index({ title: 'text' });
