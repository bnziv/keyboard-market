import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<string> {
    const emailTaken = await this.userModel.exists({ email: dto.email.toLowerCase() });
    if (emailTaken) throw new ConflictException('Email already in use');

    const usernameTaken = await this.userModel.exists({
      username: { $regex: new RegExp(`^${dto.username}$`, 'i') },
    });
    if (usernameTaken) throw new ConflictException('Username already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      username: dto.username,
      password: hashed,
    });

    return this.jwtService.sign({ sub: user._id.toString() });
  }

  async login(dto: LoginDto): Promise<{ token: string; id: string; username: string }> {
    const user = await this.userModel.findOne({
      $or: [
        { email: dto.identifier.toLowerCase() },
        { username: { $regex: new RegExp(`^${dto.identifier}$`, 'i') } },
      ],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user._id.toString() });
    return { token, id: user._id.toString(), username: user.username };
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).select('-password').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('-password').exec();
  }

  async findByIds(ids: string[]): Promise<UserDocument[]> {
    return this.userModel.find({ _id: { $in: ids } }).select('username').exec();
  }
}
