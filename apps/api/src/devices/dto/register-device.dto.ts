import { IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';

const EXPO_TOKEN_PATTERN = /^(Expo(nent)?PushToken)\[[^\]]+\]$/;

export class RegisterDeviceDto {
    @IsString()
    @MinLength(10)
    @Matches(EXPO_TOKEN_PATTERN, {
        message: 'pushToken must be a valid Expo push token',
    })
    pushToken: string;

    @IsOptional()
    @IsString()
    @IsIn(['android', 'ios', 'Android', 'iOS'])
    platform?: string;
}
