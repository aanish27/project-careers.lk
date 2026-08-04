import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import { MailService } from '@/shared/mail/mail.service';

const OTP_EXPIRES_IN_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_REQUEST_WINDOW_MS = 10 * 60 * 1000;
const OTP_MAX_REQUESTS_PER_WINDOW = 3;

// 6-digit codes only have 1,000,000 possibilities, so the real defense here
// is the attempt cap + expiry (online guessing), not the hash function
// (offline guessing). Hashed with a keyed HMAC rather than bcrypt — bcrypt's
// slow-hash property is built for high-entropy secrets; against a 1e6-value
// space its cost factor doesn't raise attacker cost enough to matter within
// the 10-minute expiry if the codeHash column is ever read out-of-band, while
// still adding real latency to every legitimate verify() call. The HMAC key
// (OTP_HASH_SECRET) is what actually makes an out-of-band DB read useless to
// an attacker: without it, there's no way to test candidate codes at all.
@Injectable()
export class WebUserEmailOtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private hashCode(email: string, code: string): string {
    const secret = this.config.getOrThrow<string>('otp.hashSecret');
    return crypto
      .createHmac('sha256', secret)
      .update(`${email}:${code}`)
      .digest('hex');
  }

  async generate(email: string): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - OTP_REQUEST_WINDOW_MS);

    const recentRequests = await this.prisma.webUserEmailOtp.findMany({
      where: { email, createdAt: { gte: windowStart } },
      orderBy: { createdAt: 'desc' },
      take: OTP_MAX_REQUESTS_PER_WINDOW + 1,
    });

    // Cooldown is checked first and independently of the window cap: it
    // exists so "a new request supersedes the old code" can't be used to
    // lock someone out of a code they're actively about to enter (whether
    // that's an attacker re-requesting against a victim, or just an
    // impatient legitimate user mashing "resend").
    const mostRecent = recentRequests[0];
    if (mostRecent) {
      const sinceLastRequestMs = now.getTime() - mostRecent.createdAt.getTime();
      if (sinceLastRequestMs < OTP_RESEND_COOLDOWN_MS) {
        throw new HttpException(
          'Please wait a bit before requesting another code',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    if (recentRequests.length >= OTP_MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException(
        'Too many code requests — please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Only reachable past the cooldown check above, so this can't supersede
    // a code the user is mid-typing.
    await this.prisma.webUserEmailOtp.updateMany({
      where: { email, consumedAt: null, invalidatedAt: null },
      data: { invalidatedAt: now },
    });

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = this.hashCode(email, code);
    const expiresAt = new Date(
      now.getTime() + OTP_EXPIRES_IN_MINUTES * 60 * 1000,
    );

    await this.prisma.webUserEmailOtp.create({
      data: { email, codeHash, expiresAt },
    });

    await this.mail.sendOtpEmail(email, code, OTP_EXPIRES_IN_MINUTES);
  }

  async verify(email: string, code: string): Promise<void> {
    const now = new Date();

    const row = await this.prisma.webUserEmailOtp.findFirst({
      where: {
        email,
        consumedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!row) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    // Atomic: the WHERE clause's `attempts: { lt: MAX }` is checked and the
    // increment applied in a single DB operation, so concurrent verify
    // requests can't each read attempts:0 and all get to compare before any
    // commits — that race is how a 1-in-1,000,000 cap actually gets
    // defeated despite the low attempt count. The comparison below only
    // runs if this claim succeeds.
    const claimed = await this.prisma.webUserEmailOtp.updateMany({
      where: {
        id: row.id,
        attempts: { lt: OTP_MAX_ATTEMPTS },
        consumedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
      },
      data: { attempts: { increment: 1 } },
    });

    if (claimed.count === 0) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    const expectedHash = Buffer.from(this.hashCode(email, code));
    const actualHash = Buffer.from(row.codeHash);

    const matches =
      expectedHash.length === actualHash.length &&
      crypto.timingSafeEqual(expectedHash, actualHash);

    if (!matches) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    await this.prisma.webUserEmailOtp.update({
      where: { id: row.id },
      data: { consumedAt: now },
    });
  }
}
