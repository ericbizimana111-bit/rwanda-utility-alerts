// Rwanda observes Central Africa Time (UTC+2, no daylight saving). Outage
// timestamps are stored as wall-clock time, so pin the process time zone to
// keep reads and writes consistent regardless of where the API is hosted.
process.env.TZ = process.env.TZ || 'Africa/Kigali';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { existsSync } from 'fs';
import { networkInterfaces } from 'os';
import { AppModule } from './app.module';

const PLACEHOLDER_SECRETS = new Set(['', 'change-me-in-production', 'replace-with-a-long-random-secret', 'dev_secret_change_me']);

/** Refuses to run in production with missing or placeholder secrets. */
function assertProductionConfig(logger: Logger) {
  const insecure = ['JWT_SECRET', 'COLLECTOR_API_KEY'].filter((key) => PLACEHOLDER_SECRETS.has(process.env[key] ?? ''));
  if (!insecure.length) return;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Refusing to start: set a strong value for ${insecure.join(', ')}`);
  }
  logger.warn(`Using development defaults for ${insecure.join(', ')}. Set real secrets before deploying.`);
}

function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net): net is NonNullable<typeof net> => Boolean(net && net.family === 'IPv4' && !net.internal))
    .map((net) => net.address);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  assertProductionConfig(logger);

  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  app.use(helmet());
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  // Listen on every interface so phones on the same network can connect.
  await app.listen(port, '0.0.0.0');

  logger.log(`API ready on http://localhost:${port} (health: /health, time zone: ${process.env.TZ})`);
  logger.log(`Android emulator: http://10.0.2.2:${port}`);
  if (existsSync('/.dockerenv')) {
    logger.log(`Phones on the same Wi-Fi: http://<this computer's IP address>:${port}`);
  } else {
    for (const address of lanAddresses()) {
      logger.log(`Phones on the same Wi-Fi: http://${address}:${port}`);
    }
  }
}

void bootstrap();
