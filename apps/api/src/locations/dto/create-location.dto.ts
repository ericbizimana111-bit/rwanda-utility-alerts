import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLocationDto {
    @IsString()
    @MinLength(2)
    province: string;

    @IsString()
    @MinLength(2)
    district: string;

    @IsOptional()
    @IsString()
    sector?: string;

    @IsOptional()
    @IsString()
    cell?: string;

    @IsOptional()
    @IsString()
    village?: string;
}