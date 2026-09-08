import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'Rwanda Utility Alerts API is running',
      status: 'ok',
    };
  }
}