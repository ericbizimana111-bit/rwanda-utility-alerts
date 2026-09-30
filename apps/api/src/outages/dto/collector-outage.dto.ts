import {
    ArrayMaxSize,
    IsArray,
    IsDateString,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
} from 'class-validator';

/** Payload sent by the data collector for an official REG / WASAC announcement. */
export class CollectorOutageDto {
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string | null;

    @IsUUID()
    utilityId: string;

    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(500)
    @IsUUID('all', { each: true })
    locationIds?: string[];

    @IsDateString()
    startTime: string;

    @IsOptional()
    @IsDateString()
    endTime?: string | null;

    @IsOptional()
    @IsIn(['planned', 'active', 'completed', 'cancelled'])
    status?: string;

    @IsOptional()
    @IsString()
    sourceType?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    sourceName?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    sourceUrl?: string | null;

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    externalId: string;
}
