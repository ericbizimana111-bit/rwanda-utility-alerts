import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

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
}