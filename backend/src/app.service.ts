import { Injectable } from '@nestjs/common';
import { HealthStatus } from './health.dto';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  checkHealth(): HealthStatus {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
