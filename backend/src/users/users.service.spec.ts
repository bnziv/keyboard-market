import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

jest.mock('bcrypt', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn(),
  },
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import bcrypt from 'bcrypt';

function chain(resolvedValue: any) {
  const q: any = {
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
  };
  return q;
}

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    userModel = {
      exists: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('register', () => {
    it('creates a user and returns a JWT', async () => {
      userModel.exists.mockResolvedValueOnce(null);
      userModel.exists.mockResolvedValueOnce(null);
      userModel.create.mockResolvedValue({ _id: { toString: () => 'uid1' } });

      const token = await service.register({
        email: 'test@example.com',
        username: 'tester',
        password: 'pass1234',
      });

      expect(token).toBe('signed-token');
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com', password: 'hashed-password' }),
      );
    });

    it('lowercases the email before storing', async () => {
      userModel.exists.mockResolvedValue(null);
      userModel.create.mockResolvedValue({ _id: { toString: () => 'uid2' } });

      await service.register({ email: 'Upper@Example.COM', username: 'user', password: 'pass1234' });

      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'upper@example.com' }),
      );
    });

    it('throws ConflictException when email is already taken', async () => {
      userModel.exists.mockResolvedValueOnce({ _id: 'existing' });

      await expect(
        service.register({ email: 'taken@example.com', username: 'new', password: 'pass1234' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when username is already taken', async () => {
      userModel.exists.mockResolvedValueOnce(null);
      userModel.exists.mockResolvedValueOnce({ _id: 'existing' });

      await expect(
        service.register({ email: 'new@example.com', username: 'taken', password: 'pass1234' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const mockUser = {
      _id: { toString: () => 'uid1' },
      username: 'tester',
      password: 'hashed-password',
    };

    // login() awaits findOne() directly (no .exec()), so mockResolvedValue is correct here
    it('returns token, id, and username on success', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ identifier: 'tester', password: 'pass1234' });

      expect(result).toEqual({ token: 'signed-token', id: 'uid1', username: 'tester' });
    });

    it('throws UnauthorizedException when user not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(
        service.login({ identifier: 'unknown', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ identifier: 'tester', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findById', () => {
    it('returns a user without the password field', async () => {
      const mockUser = { _id: 'uid1', username: 'tester' };
      userModel.findById.mockReturnValue(chain(mockUser));

      const result = await service.findById('uid1');

      expect(result).toEqual(mockUser);
      expect(userModel.findById).toHaveBeenCalledWith('uid1');
    });

    it('returns null when user is not found', async () => {
      userModel.findById.mockReturnValue(chain(null));

      const result = await service.findById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('performs a case-insensitive lookup', async () => {
      const mockUser = { _id: 'uid1', username: 'Tester' };
      userModel.findOne.mockReturnValue(chain(mockUser));

      const result = await service.findByUsername('TESTER');

      expect(result).toEqual(mockUser);
      expect(userModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ username: expect.any(Object) }),
      );
    });
  });

  describe('findByEmail', () => {
    it('lowercases the email before querying', async () => {
      userModel.findOne.mockReturnValue(chain(null));

      await service.findByEmail('Upper@Example.COM');

      expect(userModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'upper@example.com' }),
      );
    });
  });

  describe('findByIds', () => {
    it('queries by _id $in and selects only username', async () => {
      const mockUsers = [{ _id: 'uid1', username: 'alice' }];
      userModel.find.mockReturnValue(chain(mockUsers));

      const result = await service.findByIds(['uid1']);

      expect(result).toEqual(mockUsers);
    });
  });
});
