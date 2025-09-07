import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { Email, EmailSchema } from './email.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }])],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
