import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email, EmailDoc } from './email.schema';
import { detectESP } from './esp-detector';

@Injectable()
export class EmailService implements OnModuleInit {
  private client: ImapFlow;
  private logger = new Logger('EmailService');
  private pollInterval = (Number(process.env.IMAP_POLL_INTERVAL_SECONDS || '15')) * 1000;
  constructor(@InjectModel(Email.name) private emailModel: Model<EmailDoc>) { }

  async onModuleInit() {
    try {
      await this.connectAndStart();
    } catch (e) {
      this.logger.error('Error starting IMAP client: ' + e);
    }
  }

  private async connectAndStart() {
    const { IMAP_HOST, IMAP_PORT, IMAP_SECURE, IMAP_USER, IMAP_PASS } = process.env;

    console.log({ IMAP_HOST, IMAP_PORT, IMAP_SECURE, IMAP_USER, IMAP_PASS })
    this.client = new ImapFlow({
      host: IMAP_HOST,
      port: Number(IMAP_PORT || 993),
      secure: IMAP_SECURE === 'true',
      auth: { user: IMAP_USER, pass: IMAP_PASS },
    });

    await this.client.connect();
    this.logger.log('IMAP connected');
    await this.client.mailboxOpen('INBOX');
    setInterval(() => this.pollOnce().catch(e => this.logger.error(e)), this.pollInterval);
    await this.pollOnce();
  }

  private async pollOnce() {
    const subjectPrefix = process.env.TEST_EMAIL_SUBJECT_PREFIX || '[LUCID-GROWTH-TEST]';
    // search for unseen messages with subject containing prefix
    const uids = await this.client.search({ seen: false, subject: subjectPrefix });
    if (!uids || uids.length === 0) return;
    for await (const message of this.client.fetch(uids, { source: true, envelope: true })) {
      const raw = message.source.toString('utf-8');
      const parsed = await simpleParser(raw, { skipHtmlToText: true });
      // build headers map simple object
      const headersObj: any = {};
      for (const [k, v] of parsed.headers) {
        if (!headersObj[k]) headersObj[k] = v;
        else if (Array.isArray(headersObj[k])) headersObj[k].push(v);
        else headersObj[k] = [headersObj[k], v];
      }
      // get Received headers into array
      const receivedArr = parsed.headerLines
        .filter(h => h.key.toLowerCase() === 'received')
        .map(h => h.line);
      const receivingChain = [...receivedArr].reverse();
      const { esp, confidence, evidence } = detectESP(parsed.headers);

      const doc = await this.emailModel.create({
        subject: parsed.subject || '',
        from: parsed.from?.text,
        to: parsed.to?.text,
        date: parsed.date,
        messageId: parsed.messageId,
        headers: headersObj,
        rawSource: raw,
        receivingChain,
        esp,
        espConfidence: confidence,
        detectionEvidence: evidence,
      });

      this.logger.log(`Saved email ${doc._id} esp=${esp}`);
      // mark seen
      try {
        await this.client.messageFlagsAdd(message.uid, ['\Seen']);
      } catch (e) { }
    }
  }

  async listAll() {
    return this.emailModel.find().sort({ createdAt: -1 }).limit(50).lean();
  }

  async getById(id: string) {
    return this.emailModel.findById(id).lean();
  }

  async triggerManualPoll() {
    return this.pollOnce();
  }
}
