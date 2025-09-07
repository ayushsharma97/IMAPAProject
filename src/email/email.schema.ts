import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailDoc = Email & Document;

@Schema({ timestamps: true })
export class Email {
  @Prop({ required: true })
  subject: string;

  @Prop()
  from?: string;

  @Prop()
  to?: string;

  @Prop()
  date?: Date;

  @Prop()
  messageId?: string;

  @Prop({ type: Object })
  headers: any;

  @Prop({ type: String })
  rawSource: string;

  @Prop({ type: [String], default: [] })
  receivingChain: string[];

  @Prop()
  esp: string;

  @Prop()
  espConfidence: number;

  @Prop({ type: Object })
  detectionEvidence?: any;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
