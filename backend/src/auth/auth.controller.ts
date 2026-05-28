import { Controller, Post, Get, Body, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { UsersService } from '../users/users.service';
import { RegisterDto } from '../users/dto/register.dto';
import { LoginDto } from '../users/dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  maxAge: 2 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const token = await this.usersService.register(dto);
    res.cookie('jwt', token, COOKIE_OPTIONS);
    return { message: 'Registration successful' };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, id, username } = await this.usersService.login(dto);
    res.cookie('jwt', token, COOKIE_OPTIONS);
    return { id, username };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('jwt', '', { ...COOKIE_OPTIONS, maxAge: 0 });
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request) {
    const userId = (req.user as any).userId;
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return { id: user._id.toString(), username: user.username };
  }
}
