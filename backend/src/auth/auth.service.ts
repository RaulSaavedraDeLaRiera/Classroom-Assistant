import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // validate user credentials
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const userObj = JSON.parse(JSON.stringify(user));
      const { password, ...result } = userObj;
      return result;
    }
    return null;
  }

  // login user and return JWT token
  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // register new user
  async register(createUserDto: any) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userData = { ...createUserDto, password: hashedPassword };
    
    const user = await this.usersService.createUser(userData);
    return this.login(user);
  }

  // refresh token - for now, just generate a new token for the same user
  async refreshToken(refreshToken?: string) {
    // In a real implementation, you'd validate the refresh token
    // For simplicity, we'll just return a new access token
    // This is a simplified version - in production you'd have proper refresh token validation
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // For demo purposes, we'll decode the token to get user info
      const decoded = this.jwtService.decode(refreshToken) as any;
      if (!decoded || !decoded.email) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Find the user
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
