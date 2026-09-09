import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateReportDto {
    @IsUUID()
    locationId: string;

    @IsUUID()
    utilityId: string;

    @IsString()
    @MinLength(10)
    description: string;
}
