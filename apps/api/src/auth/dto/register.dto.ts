import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @MaxLength(20)
    phone: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsString()
    @MinLength(2)
    @MaxLength(60)
    firstName: string;

    @IsString()
    @MinLength(2)
    @MaxLength(60)
    lastName: string;

    @IsString()
    @MinLength(6)
    @MaxLength(128)
    password: string;
}
