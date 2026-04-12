import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private from: string;
  private frontendUrl: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = this.config.getOrThrow<string>('MAIL_FROM');
    this.frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${this.frontendUrl}/verify-email?token=${token}`;
    await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Verify your Projexa account',
      html: verificationTemplate(url),
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = `${this.frontendUrl}/reset-password?token=${token}`;
    await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Reset your Projexa password',
      html: passwordResetTemplate(url),
    });
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Projexa</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#4f46e5;border-radius:12px;padding:12px 28px;">
                    <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                      Projexa
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:48px 48px 40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0 0 0;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">
                © ${new Date().getFullYear()} Projexa. All rights reserved.
              </p>
              <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function verificationTemplate(url: string): string {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
      Confirm your email
    </h1>
    <p style="margin:0 0 32px;font-size:16px;color:#6b7280;line-height:1.6;">
      Thanks for signing up for Projexa! Click the button below to verify your email address and activate your account.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 36px;">
      <tr>
        <td style="background-color:#4f46e5;border-radius:8px;">
          <a href="${url}"
            style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e5e7eb;padding-top:28px;margin-top:4px;">
      <tr>
        <td>
          <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
            Button not working? Paste this link into your browser:
          </p>
          <p style="margin:0;font-size:13px;word-break:break-all;">
            <a href="${url}" style="color:#4f46e5;text-decoration:none;">${url}</a>
          </p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;background-color:#f9fafb;border-radius:8px;padding:16px;">
      <tr>
        <td>
          <p style="margin:0;font-size:13px;color:#6b7280;">
            ⏱ This link expires in <strong>24 hours</strong>.
          </p>
        </td>
      </tr>
    </table>
  `);
}

function passwordResetTemplate(url: string): string {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
      Reset your password
    </h1>
    <p style="margin:0 0 32px;font-size:16px;color:#6b7280;line-height:1.6;">
      We received a request to reset your Projexa password. Click the button below to choose a new one.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 36px;">
      <tr>
        <td style="background-color:#dc2626;border-radius:8px;">
          <a href="${url}"
            style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e5e7eb;padding-top:28px;margin-top:4px;">
      <tr>
        <td>
          <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
            Button not working? Paste this link into your browser:
          </p>
          <p style="margin:0;font-size:13px;word-break:break-all;">
            <a href="${url}" style="color:#dc2626;text-decoration:none;">${url}</a>
          </p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;background-color:#fef2f2;border-radius:8px;padding:16px;">
      <tr>
        <td>
          <p style="margin:0;font-size:13px;color:#6b7280;">
            ⏱ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email — your account is safe.
          </p>
        </td>
      </tr>
    </table>
  `);
}

// import { Injectable } from '@nestjs/common';
// import { MailerService } from '@nestjs-modules/mailer';

// @Injectable()
// export class MailService {
//   constructor(private mailer: MailerService) {
//     console.log('MAIL_HOST:', process.env.MAIL_HOST);
//     console.log('MAIL_PORT:', process.env.MAIL_PORT);
//   }

//   async sendVerificationEmail(email: string, token: string) {
//     const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
//     await this.mailer.sendMail({
//       to: email,
//       subject: 'Verify your email',
//       template: './verification',
//       context: { url },
//     });
//   }

//   async sendPasswordResetEmail(email: string, token: string) {
//     const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
//     await this.mailer.sendMail({
//       to: email,
//       subject: 'Reset your password',
//       template: './reset-password',
//       context: { url },
//     });
//   }
// }