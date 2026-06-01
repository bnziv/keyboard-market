import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GroupBuyDocument = HydratedDocument<GroupBuy>;

@Schema({ collection: 'group-buys', strict: false })
export class GroupBuy {
  @Prop() topicId?: string;
  @Prop() name?: string;
  @Prop() type?: string;
  @Prop() status?: string;
  @Prop() designer?: string;
  @Prop() overview?: string;
  @Prop() poster?: string;
  @Prop() gbStart?: string;
  @Prop() gbEnd?: string;
  @Prop() estimatedFulfillment?: string;
  @Prop({ type: Object }) basePrice?: { amount: number; currency: string };
  @Prop({ type: [Object] }) items?: {
    name: string;
    price: number;
    currency: string;
  }[];
  @Prop({ type: [Object] }) vendors?: {
    region: string;
    name: string;
    url: string;
  }[];
  @Prop() discordUrl?: string;
  @Prop() sourceUrl?: string;
  @Prop({ type: [String] }) images?: string[];
  @Prop({ type: [String], default: [] }) excludedImages?: string[];
  @Prop({ default: false }) hidden?: boolean;
  @Prop() scrapedAt?: Date;
}

export const GroupBuySchema = SchemaFactory.createForClass(GroupBuy);
