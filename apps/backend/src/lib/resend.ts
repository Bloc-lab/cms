type ResendSendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  text: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM ?? '';

export function canSendResend(): boolean {
  return typeof RESEND_API_KEY === 'string' && RESEND_API_KEY.trim().length > 0 && RESEND_FROM.trim().length > 0;
}

export async function sendLeadNotificationEmail(args: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canSendResend()) return { ok: false, error: 'Resend not configured' };

  const payload: ResendSendEmailPayload = {
    from: RESEND_FROM.trim(),
    to: [args.to],
    subject: args.subject,
    text: args.text,
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY!.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    return { ok: false, error: msg || res.statusText };
  }

  return { ok: true };
}

