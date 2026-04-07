import { Controller, Post, Request, UseGuards, HttpCode, HttpStatus, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * POST /auth/login
   * Body: { username: string, password: string }
   * Returns: { access_token: string, refresh_token: string }
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(req.user);
    
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
    });

    return { access_token: tokens.access_token };
  }

  /**
   * POST /auth/refresh
   * Body: { refresh_token: string }
   * Returns: { access_token: string, refresh_token: string }
   */
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.id;
    const refreshToken = req.user.refreshToken;
    const tokens = await this.authService.refreshTokens(userId, refreshToken);

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
    });

    return { access_token: tokens.access_token };
  }

  /**
   * POST /auth/logout
   * Header: Authorization: Bearer <access_token>
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }
}
