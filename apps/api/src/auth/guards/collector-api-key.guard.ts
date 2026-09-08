import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalCollectorGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();
        const apiKey =
            req.headers['x-api-key'] ??
            req.headers.authorization?.replace(/^Bearer\s+/i, '');

        const expected = process.env.COLLECTOR_API_KEY;

        if (!expected || !apiKey) {
            throw new UnauthorizedException('Missing or invalid collector API key');
        }

        const expectedBuffer = Buffer.from(expected);
        const actualBuffer = Buffer.from(String(apiKey));

        if (expectedBuffer.length !== actualBuffer.length) {
            throw new UnauthorizedException('Missing or invalid collector API key');
        }

        const match = timingSafeEqual(expectedBuffer, actualBuffer);

        if (!match) {
            throw new UnauthorizedException('Missing or invalid collector API key');
        }

        return true;
    }
}
