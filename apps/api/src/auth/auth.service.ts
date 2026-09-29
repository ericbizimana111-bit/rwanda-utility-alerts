import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { normalizeRwandaPhone } from '../common/phone';

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
        const phone = normalizeRwandaPhone(data.phone);

        if (!phone) {
            throw new BadRequestException(
                'Enter a valid Rwandan mobile number, e.g. 078 123 4567',
            );
        }

        const existingUser = await this.usersService.findByPhone(phone);

        if (existingUser) {
            throw new ConflictException(
                'This phone number is already registered. Please sign in instead.',
            );
        }

        const email = data.email?.trim().toLowerCase() || undefined;

        if (email && await this.usersService.findByEmail(email)) {
            throw new ConflictException(
                'This email is already used by another account',
            );
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await this.usersService.create({
            phone,
            email,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            password: hashedPassword,
        });

        const { password: _, ...safeUser } = user;

        return {
            message: 'Registration successful',
            user: safeUser,
        };
    }

    async validateUser(phone: string, password: string) {
        // Accounts are stored in the canonical 07XXXXXXXX form; fall back to the
        // raw input for accounts created before phone normalization existed.
        const normalized = normalizeRwandaPhone(phone);
        const user =
            (normalized ? await this.usersService.findByPhone(normalized) : null) ??
            (await this.usersService.findByPhone(phone.trim()));

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
