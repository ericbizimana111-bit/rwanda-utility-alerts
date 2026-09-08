import {
    IsDateString,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

export class CreateOutageDto {
    @IsString()
    @MinLength(3)
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsUUID()
    utilityId: string;

    @IsUUID()
    locationId: string;

    @IsDateString()
    startTime: string;

    @IsDateString()
    endTime: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    sourceType?: string;

    @IsOptional()
    @IsString()
    sourceName?: string;

    @IsOptional()
    @IsString()
    sourceUrl?: string;

    @IsString()
    externalId: string;
}