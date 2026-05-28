import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessageDocument>,
    private readonly usersService: UsersService,
  ) {}

  async saveMessage(dto: SendMessageDto): Promise<ChatMessageDocument> {
    return this.chatModel.create(dto);
  }

  async getChatHistory(userId1: string, userId2: string): Promise<ChatMessageDocument[]> {
    return this.chatModel
      .find({
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      })
      .sort({ timestamp: 1 })
      .exec();
  }

  async getUserConversations(userId: string) {
    const results = await this.chatModel.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
          },
          lastMessage: { $first: '$content' },
          timestamp: { $first: '$timestamp' },
        },
      },
      { $sort: { timestamp: -1 } },
    ]);

    return Promise.all(
      results.map(async (r) => {
        const user = await this.usersService.findById(r._id);
        return {
          userId: r._id,
          username: user?.username ?? 'Unknown',
          lastMessage: r.lastMessage,
          timestamp: r.timestamp,
        };
      }),
    );
  }
}
