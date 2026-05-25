import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GroupBuyDocument = HydratedDocument<GroupBuy>;

@Schema({ collection: 'group-buys', strict: false })
export class GroupBuy {
  @Prop() topic_id?: string;
  @Prop() name?: string;
  @Prop() type?: string;
  @Prop() status?: string;
  @Prop() designer?: string;
  @Prop() overview?: string;
  @Prop() poster?: string;
  @Prop() gb_start?: string;
  @Prop() gb_end?: string;
  @Prop() estimated_fulfillment?: string;
  @Prop({ type: Object }) base_price?: { amount: number; currency: string };
  @Prop({ type: [Object] }) items?: { name: string; price: number; currency: string }[];
  @Prop({ type: [Object] }) vendors?: { region: string; name: string; url: string }[];
  @Prop() discord_url?: string;
  @Prop() source_url?: string;
  @Prop({ type: [String] }) images?: string[];
  @Prop() scraped_at?: Date;
}

export const GroupBuySchema = SchemaFactory.createForClass(GroupBuy);
