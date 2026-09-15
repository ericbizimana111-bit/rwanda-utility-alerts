import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'dev_secret_change_me'),
        });
    }

    async validate(payload: { sub: string; phone: string; role: string }) {
        const user = await this.usersService.findByPhone(payload.phone);

        if (!user || user.id !== payload.sub) {
            throw new UnauthorizedException('Invalid or revoked session');
        }

        const { password: _password, ...safeUser } = user;

        return safeUser;
    }
}