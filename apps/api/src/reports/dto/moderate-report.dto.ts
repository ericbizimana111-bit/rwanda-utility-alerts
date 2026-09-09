import { IsIn } from 'class-validator';

export const REPORT_STATUSES = ['pending', 'verified', 'rejected', 'resolved'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export class ModerateReportDto {
    @IsIn(REPORT_STATUSES)
    status: ReportStatus;
}
