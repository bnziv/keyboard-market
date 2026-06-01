import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatMessage } from './schemas/chat-message.schema';
import { UsersService } from '../users/users.service';

function chain(resolvedValue: any) {
  return {
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
  };
}

describe('ChatService', () => {
  let service: ChatService;
  let chatModel: any;
  let usersService: { findByIds: jest.Mock };

  beforeEach(async () => {
    chatModel = {
      create: jest.fn(),
      find: jest.fn(),
      aggregate: jest.fn(),
    };
    usersService = { findByIds: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken(ChatMessage.name), useValue: chatModel },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  describe('saveMessage', () => {
    it('persists and returns the new message', async () => {
      const dto = { senderId: 'u1', receiverId: 'u2', content: 'hello' };
      chatModel.create.mockResolvedValue(dto);

      const result = await service.saveMessage(dto as any);

      expect(chatModel.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });
  });

  describe('getChatHistory', () => {
    it('queries bidirectionally between two users', async () => {
      chatModel.find.mockReturnValue(chain([]));

      await service.getChatHistory('u1', 'u2');

      expect(chatModel.find).toHaveBeenCalledWith({
        $or: [
          { senderId: 'u1', receiverId: 'u2' },
          { senderId: 'u2', receiverId: 'u1' },
        ],
      });
    });

    it('returns messages sorted by timestamp ascending', async () => {
      const messages = [{ content: 'hi' }, { content: 'bye' }];
      chatModel.find.mockReturnValue(chain(messages));

      const result = await service.getChatHistory('u1', 'u2');

      expect(chatModel.find().sort).toHaveBeenCalledWith({ timestamp: 1 });
      expect(result).toEqual(messages);
    });
  });

  describe('getUserConversations', () => {
    it('returns conversations with username resolved from UsersService', async () => {
      const aggregateResult = [
        { _id: 'u2', lastMessage: 'hello', timestamp: new Date('2024-01-01') },
      ];
      chatModel.aggregate.mockResolvedValue(aggregateResult);
      usersService.findByIds.mockResolvedValue([{ _id: { toString: () => 'u2' }, username: 'alice' }]);

      const result = await service.getUserConversations('u1');

      expect(result).toEqual([
        { userId: 'u2', username: 'alice', lastMessage: 'hello', timestamp: expect.any(Date) },
      ]);
    });

    it('falls back to "Unknown" when the partner user is not found', async () => {
      chatModel.aggregate.mockResolvedValue([
        { _id: 'ghost-id', lastMessage: 'hi', timestamp: new Date() },
      ]);
      usersService.findByIds.mockResolvedValue([]);

      const result = await service.getUserConversations('u1');

      expect(result[0].username).toBe('Unknown');
    });

    it('passes the aggregation pipeline to find the most recent message per conversation', async () => {
      chatModel.aggregate.mockResolvedValue([]);
      usersService.findByIds.mockResolvedValue([]);

      await service.getUserConversations('u1');

      const pipeline = chatModel.aggregate.mock.calls[0][0];
      const stages = pipeline.map((s: any) => Object.keys(s)[0]);
      expect(stages).toContain('$match');
      expect(stages).toContain('$group');
      expect(stages).toContain('$sort');
    });
  });
});
