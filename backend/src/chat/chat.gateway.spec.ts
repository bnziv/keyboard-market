import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

function makeSocket(overrides: {
  cookie?: string;
  userId?: string;
  valid?: boolean;
} = {}) {
  return {
    handshake: {
      headers: { cookie: overrides.cookie ?? '' },
      query: { userId: overrides.userId ?? 'u1' },
    },
    disconnect: jest.fn(),
    join: jest.fn(),
  } as any;
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: { verify: jest.Mock; sign?: jest.Mock };
  let chatService: { saveMessage: jest.Mock };
  let server: { to: jest.Mock };

  beforeEach(async () => {
    jwtService = { verify: jest.fn() };
    chatService = { saveMessage: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: ChatService, useValue: chatService },
      ],
    }).compile();

    gateway = module.get(ChatGateway);

    const emitChain = { emit: jest.fn() };
    server = { to: jest.fn().mockReturnValue(emitChain) };
    gateway.server = server as any;
  });

  describe('handleConnection', () => {
    it('joins the user room when the JWT is valid and userId matches', () => {
      jwtService.verify.mockReturnValue({ sub: 'u1' });
      const socket = makeSocket({ cookie: 'jwt=valid-token', userId: 'u1' });

      gateway.handleConnection(socket);

      expect(socket.disconnect).not.toHaveBeenCalled();
      expect(socket.join).toHaveBeenCalledWith('u1');
    });

    it('disconnects when no cookie is present', () => {
      const socket = makeSocket({ cookie: '' });

      gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
      expect(socket.join).not.toHaveBeenCalled();
    });

    it('disconnects when the JWT token is invalid', () => {
      jwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
      const socket = makeSocket({ cookie: 'jwt=bad-token', userId: 'u1' });

      gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('disconnects when userId does not match the token subject', () => {
      jwtService.verify.mockReturnValue({ sub: 'u1' });
      const socket = makeSocket({ cookie: 'jwt=valid-token', userId: 'u2' });

      gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('disconnects when userId query param is missing', () => {
      jwtService.verify.mockReturnValue({ sub: '' });
      const socket = makeSocket({ cookie: 'jwt=valid-token', userId: '' });

      gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('saves the message and emits to sender and receiver rooms', async () => {
      const dto = { senderId: 'u1', receiverId: 'u2', content: 'hello' };
      const saved = { ...dto, _id: 'msg1' };
      chatService.saveMessage.mockResolvedValue(saved);

      const socket = makeSocket({ userId: 'u1' });
      await gateway.handleMessage(socket, dto as any);

      expect(chatService.saveMessage).toHaveBeenCalledWith(dto);
      expect(server.to).toHaveBeenCalledWith('u1');
      expect(server.to).toHaveBeenCalledWith('u2');
    });

    it('ignores the message when senderId does not match socket userId', async () => {
      const dto = { senderId: 'u2', receiverId: 'u3', content: 'spoofed' };
      const socket = makeSocket({ userId: 'u1' });

      await gateway.handleMessage(socket, dto as any);

      expect(chatService.saveMessage).not.toHaveBeenCalled();
    });
  });
});
