import { Controller, Get, Param, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('api/emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  async list() {
    return this.emailService.listAll();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.emailService.getById(id);
  }

  @Post('refresh')
  async refresh() {
    await this.emailService.triggerManualPoll();
    return { ok: true };
  }
}
