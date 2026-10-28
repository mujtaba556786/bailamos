import { connect } from 'cloudflare:sockets';
export type MailEnv = { SMTP_HOST?: string; SMTP_PORT?: string; SMTP_USER?: string; SMTP_PASSWORD?: string };
export type MailMessage = { to: string; subject: string; text: string };
const TIMEOUT_MS = 15000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function base64(value: string) {
  let binary = '';
  for (const byte of encoder.encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function encodedWord(value: string) {
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${base64(value)}?=`;
}
export function buildMessage(from: { name: string; address: string }, message: MailMessage, now = new Date(), messageId = crypto.randomUUID()) {
  const headers = [
    `From: ${encodedWord(from.name)} <${from.address}>`,
    `To: <${message.to}>`,
    `Subject: ${encodedWord(message.subject)}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${messageId}@${from.address.split('@')[1]}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  const body = base64(message.text).replace(/.{1,76}/g, line => `${line}\r\n`);
  return `${headers.join('\r\n')}\r\n\r\n${body}`;
}
class SmtpSession {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private buffer = '';
  constructor(private socket: ReturnType<typeof connect>) {
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }
  upgrade(socket: ReturnType<typeof connect>) {
    this.reader.releaseLock();
    this.writer.releaseLock();
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
    this.buffer = '';
  }
  private async readLine() {
    while (!this.buffer.includes('\n')) {
      const { value, done } = await this.reader.read();
      if (done) throw new Error('SMTP connection closed');
      this.buffer += decoder.decode(value, { stream: true });
    }
    const index = this.buffer.indexOf('\n');
    const line = this.buffer.slice(0, index).replace(/\r$/, '');
    this.buffer = this.buffer.slice(index + 1);
    return line;
  }
  async reply(expected: number[]) {
    let line = await this.readLine();
    let text = line;
    while (/^\d{3}-/.test(line)) { line = await this.readLine(); text += `\n${line}`; }
    const code = Number(line.slice(0, 3));
    if (!expected.includes(code)) throw new Error(`SMTP unexpected reply ${code}`);
    return text;
  }
  async send(data: string, expected: number[]) {
    await this.writer.write(encoder.encode(data));
    return this.reply(expected);
  }
  close() { this.socket.close().catch(() => {}); }
}
export async function sendMail(env: MailEnv, message: MailMessage) {
  // Host and mailbox are not secret; only the password is set as a Cloudflare secret.
  const host = env.SMTP_HOST || 'smtp.ionos.de', user = env.SMTP_USER || 'info@bailamos-waldcafe.de', password = env.SMTP_PASSWORD;
  const port = Number(env.SMTP_PORT || 587);
  if (!password) throw new Error('SMTP is not configured');
  const work = async () => {
    const socket = connect({ hostname: host, port }, { secureTransport: 'starttls', allowHalfOpen: false });
    const session = new SmtpSession(socket);
    try {
      await session.reply([220]);
      await session.send('EHLO bailamos-waldcafe.de\r\n', [250]);
      await session.send('STARTTLS\r\n', [220]);
      session.upgrade(socket.startTls());
      await session.send('EHLO bailamos-waldcafe.de\r\n', [250]);
      await session.send('AUTH LOGIN\r\n', [334]);
      await session.send(`${base64(user)}\r\n`, [334]);
      await session.send(`${base64(password)}\r\n`, [235]);
      await session.send(`MAIL FROM:<${user}>\r\n`, [250]);
      await session.send(`RCPT TO:<${message.to}>\r\n`, [250, 251]);
      await session.send('DATA\r\n', [354]);
      const data = buildMessage({ name: 'Bailamos Waldcafé', address: user }, message).replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
      await session.send(`${data}\r\n.\r\n`, [250]);
      await session.send('QUIT\r\n', [221]);
    } finally {
      session.close();
    }
  };
  await Promise.race([
    work(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), TIMEOUT_MS)),
  ]);
}
