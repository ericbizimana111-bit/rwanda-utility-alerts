import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(60)
    firstName?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(60)
    lastName?: string;

    // Send null or an empty string to remove the email address.
    @IsOptional()
    @ValidateIf((_, value) => value !== null && value !== '')
    @IsEmail()
    email?: string | null;

    @IsOptional()
    @IsBoolean()
    notificationsEnabled?: boolean;
}

export class ChangePasswordDto {
    @IsString()
    currentPassword: string;

    @IsString()
    @MinLength(6)
    @MaxLength(128)
    newPassword: string;
}
