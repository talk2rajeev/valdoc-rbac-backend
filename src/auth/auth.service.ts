import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../rbac/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash' | 'refreshToken'>> {
    const { password, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.userRepository.create({
      ...userData,
      passwordHash: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    const { passwordHash, refreshToken, ...result } = savedUser;
    return result;
  }

  async validateUser(username: string, password: string): Promise<Omit<User, 'passwordHash' | 'refreshToken'> | null> {
    const user = await this.userRepository.findOne({ where: { username } });
    
    if (!user || !user.isActive) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) return null;

    // Update last login timestamp
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    const { passwordHash, refreshToken, ...result } = user;
    return result;
  }

  async login(user: any) {
    const tokens = await this.getTokens(user.id, user.username, user.fullName);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      username: user.username,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.refreshToken) throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.username, user.fullName);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    await this.userRepository.update(userId, { refreshToken: null });
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, { refreshToken: hashedRefreshToken });
  }

  private async getTokens(userId: number, username: string, fullName: string) {
    const payload = { sub: userId, userId, username, fullName };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'changeme-secret',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
