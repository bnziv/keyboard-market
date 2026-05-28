import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({ collection: 'messages' })
export class ChatMessage {
  @Prop({ required: true }) senderId!: string;
  @Prop({ required: true }) receiverId!: string;
  @Prop({ required: true }) content!: string;
  @Prop({ default: () => new Date() }) timestamp?: Date;
  @Prop({ default: false }) read?: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ senderId: 1, receiverId: 1 });
ChatMessageSchema.index({ timestamp: -1 });
