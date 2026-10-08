import { Injectable } from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

export const COOKIE = 'dj_session';
export const SESSION_MS = 30 * 24 * 3600 * 1000;

@Injectable()
export class AuthService {
  private readonly password = process.env.APP_PASSWORD as string;
  private readonly secret =
    process.env.SESSION_SECRET || createHash('sha256').update('s:' + this.password).digest('hex');

  private sign(s: string) {
    return createHmac('sha256', this.secret).update(s).digest('base64url');
  }

  checkPassword(input: unknown): boolean {
    if (typeof input !== 'string') return false;
    const a = createHash('sha256').update(input).digest();
    const b = createHash('sha256').update(this.password).digest();
    return timingSafeEqual(a, b);
  }

  makeToken(): string {
    const exp = String(Date.now() + SESSION_MS);
    return `${exp}.${this.sign(exp)}`;
  }

  validToken(token?: string): boolean {
    if (!token) return false;
    const [exp, sig] = token.split('.');
    if (!exp || !sig || Number(exp) < Date.now()) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(this.sign(exp));
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
