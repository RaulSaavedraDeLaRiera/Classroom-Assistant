import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'a-magic-secret-key',
    });
  }

  // validate JWT payload
  async validate(payload: any) {
    const user = { 
      id: payload.sub, 
      email: payload.email, 
      role: payload.role 
    };
    
    return user;
  }
}
