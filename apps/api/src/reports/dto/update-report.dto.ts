import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateReportDto {
    @IsOptional()
    @IsString()
    @MinLength(10)
    description?: string;
}
