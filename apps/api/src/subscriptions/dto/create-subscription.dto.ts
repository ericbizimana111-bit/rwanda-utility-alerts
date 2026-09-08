import { IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
    @IsUUID()
    locationId: string;

    @IsUUID()
    utilityId: string;
}