import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Not, Repository } from 'typeorm';
import { User } from './user.entity';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    async findByPhone(phone: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { phone },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email },
        });
    }

    async create(data: {
        phone: string;
        email?: string;
        firstName: string;
        lastName: string;
        password: string;
    }) {
        const user = this.usersRepository.create({
            ...data,
            role: 'USER',
        });

        return this.usersRepository.save(user);
    }

    async getProfile(userId: string): Promise<SafeUser> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        return this.toSafe(user);
    }

    async updateProfile(
        userId: string,
        data: {
            firstName?: string;
            lastName?: string;
            email?: string | null;
            notificationsEnabled?: boolean;
        },
    ): Promise<SafeUser> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (data.email !== undefined) {
            const email = data.email?.trim().toLowerCase() || null;
            if (email) {
                const taken = await this.usersRepository.findOne({
                    where: { email, id: Not(userId) },
                });
                if (taken) throw new ConflictException('This email is already used by another account');
            }
            user.email = email as string;
        }
        if (data.firstName !== undefined) user.firstName = data.firstName.trim();
        if (data.lastName !== undefined) user.lastName = data.lastName.trim();
        if (data.notificationsEnabled !== undefined) user.notificationsEnabled = data.notificationsEnabled;

        return this.toSafe(await this.usersRepository.save(user));
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const matches = await bcrypt.compare(currentPassword, user.password);
        if (!matches) throw new UnauthorizedException('Current password is incorrect');

        user.password = await bcrypt.hash(newPassword, 10);
        await this.usersRepository.save(user);
        return { message: 'Password updated' };
    }

    private toSafe(user: User): SafeUser {
        const { password: _password, ...safeUser } = user;
        return safeUser;
    }
}
