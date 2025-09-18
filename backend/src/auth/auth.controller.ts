import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // login endpoint
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { email: string; password: string }) {
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException('Email and password are required');
    }
    
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  // register endpoint
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: any) {
    if (!registerDto.name || !registerDto.email || !registerDto.password || !registerDto.role) {
      throw new BadRequestException('Name, email, password and role are required');
    }
    
    return this.authService.register(registerDto);
  }

  // get current user profile (protected route)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req) {
    return req.user;
  }

  // refresh token endpoint
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshDto: { refreshToken?: string }) {
    // For now, we'll use the same token validation as profile
    // In a real app, you'd have a separate refresh token system
    return this.authService.refreshToken(refreshDto.refreshToken);
  }
}
