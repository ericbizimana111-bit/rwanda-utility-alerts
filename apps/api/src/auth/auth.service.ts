import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async register(data: {
        phone: string;
        email?: string;
        firstName: string;
        lastName: string;
        password: string;
    }) {
        const existingUser = await this.usersService.findByPhone(data.phone);

        if (existingUser) {
            throw new UnauthorizedException(
                'Phone number already registered',
            );
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await this.usersService.create({
            ...data,
            password: hashedPassword,
        });

        const { password: _, ...safeUser } = user;

        return {
            message: 'Registration successful',
            user: safeUser,
        };
    }

    async validateUser(phone: string, password: string) {
        const user = await this.usersService.findByPhone(phone);

        if (!user) {
            throw new UnauthorizedException(
                'Invalid phone number or password',
            );
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password,
        );

        if (!passwordMatches) {
            throw new UnauthorizedException(
                'Invalid phone number or password',
            );
        }

        const { password: _, ...safeUser } = user;

        return safeUser;
    }

    async login(user: any) {
        const payload = {
            sub: user.id,
            phone: user.phone,
            role: user.role,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user,
        };
    }
}