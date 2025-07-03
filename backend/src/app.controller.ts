import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthStatus } from './health.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/health')
  checkHealth(): HealthStatus {
    return this.appService.checkHealth();
  }
}
