// heuristics-based ESP detection
export function detectESP(headersMap: any): { esp: string; confidence: number; evidence: any } {
  const evidence: any = {};
  try {
    // headersMap might be a Map-like object from mailparser
    const headersObj: any = {};
    if (headersMap && typeof headersMap.forEach === 'function') {
      headersMap.forEach((v:any,k:any)=>{ headersObj[k] = v; });
    } else {
      Object.assign(headersObj, headersMap || {});
    }
    const received = [];
    if (headersObj['received']) {
      if (Array.isArray(headersObj['received'])) received.push(...headersObj['received'].map(String));
      else received.push(String(headersObj['received']));
    }
    const messageId = String(headersObj['message-id'] || '').toLowerCase();
    const from = String(headersObj['from'] || '').toLowerCase();
    const xMailer = String(headersObj['x-mailer'] || headersObj['user-agent'] || '').toLowerCase();

    const anyContains = (arr, sub) => arr.some(a => a.toLowerCase().includes(sub));
    const candidates = [];

    if (anyContains(received, 'amazonses') || messageId.includes('amazonses') || anyContains(received, 'amazonaws')) {
      candidates.push({ name: 'Amazon SES', score: 0.95, reason: 'Found amazonses / amazonaws tokens' });
    }
    if (anyContains(received, 'sendgrid') || messageId.includes('sendgrid')) {
      candidates.push({ name: 'SendGrid', score: 0.9, reason: 'sendgrid token' });
    }
    if (anyContains(received, 'mailgun') || messageId.includes('mailgun')) {
      candidates.push({ name: 'Mailgun', score: 0.9, reason: 'mailgun token' });
    }
    if (anyContains(received, 'google') || anyContains(received, 'gmail') || messageId.includes('.google')) {
      candidates.push({ name: 'Gmail / Google Workspace', score: 0.9, reason: 'google/gmail token' });
    }
    if (anyContains(received, 'outlook') || anyContains(received, 'office365') || messageId.includes('.outlook')) {
      candidates.push({ name: 'Microsoft / Office365 / Outlook', score: 0.9, reason: 'outlook/microsoft token' });
    }
    if (anyContains(received, 'zoho') || from.includes('@zoho')) {
      candidates.push({ name: 'Zoho Mail', score: 0.9, reason: 'zoho token' });
    }
    if (anyContains(received, 'mailchimp') || anyContains(received, 'mandrill')) {
      candidates.push({ name: 'Mailchimp / Mandrill', score: 0.9, reason: 'mailchimp/mandrill token' });
    }

    if (candidates.length === 0 && messageId) {
      const domain = messageId.split('@').pop() || '';
      candidates.push({ name: `Unknown (${domain})`, score: 0.4, reason: 'Fallback from Message-ID domain' });
    }

    candidates.sort((a,b)=>b.score - a.score);
    const top = candidates[0] || { name: 'Unknown', score: 0, reason: 'No matches' };
    evidence.candidates = candidates;
    return { esp: top.name, confidence: top.score, evidence };
  } catch (e) {
    return { esp: 'Unknown', confidence: 0, evidence: { error: String(e) } };
  }
}
