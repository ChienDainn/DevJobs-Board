import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, MaxLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService, COOKIE, SESSION_MS } from './auth.service';

class LoginDto {
  @IsString()
  @MaxLength(200)
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // tối đa 8 lần thử / 15 phút / IP
  @Throttle({ default: { limit: 8, ttl: 15 * 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!this.auth.checkPassword(dto.password)) throw new UnauthorizedException('Sai mật khẩu');
    res.cookie(COOKIE, this.auth.makeToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure || process.env.COOKIE_SECURE === 'true',
      maxAge: SESSION_MS,
      path: '/',
    });
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me() {
    return { ok: true };
  }
}
