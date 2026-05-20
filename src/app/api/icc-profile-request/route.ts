import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

type IccProfileRequestPayload = {
  printerModel?: unknown;
  email?: unknown;
  companyName?: unknown;
  phone?: unknown;
  materialTitle?: unknown;
};

function buildEmailHtml(data: {
  printerModel: string;
  email: string;
  companyName: string;
  phone: string;
  materialTitle: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://businesslabels.nl';
  const logoUrl = `${siteUrl}/logo.png`;

  const infoRows = [
    { label: 'Material', value: data.materialTitle },
    { label: 'Printer Model', value: data.printerModel },
    { label: 'Email', value: data.email },
    ...(data.companyName ? [{ label: 'Company', value: data.companyName }] : []),
    ...(data.phone ? [{ label: 'Phone', value: data.phone }] : []),
  ];

  const rowsHtml = infoRows
    .map(
      (row, i) => `
      <tr style="background-color:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
        <td style="padding:13px 20px;border-bottom:1px solid #e2e8f0;width:36%;vertical-align:top;">
          <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">${row.label}</span>
        </td>
        <td style="padding:13px 20px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
          <span style="font-size:14px;font-weight:600;color:#0f172a;">${row.value || '&#8212;'}</span>
        </td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>ICC Profile Request — Businesslabels</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header: navy bar with logo -->
        <tr>
          <td style="background-color:#0c2a3a;border-radius:16px 16px 0 0;padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="${logoUrl}" alt="Businesslabels" width="160"
                    style="display:block;height:auto;max-height:34px;object-fit:contain;" />
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="font-size:11px;color:#64748b;letter-spacing:0.06em;text-transform:uppercase;">
                    Admin Notification
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Orange title stripe -->
        <tr>
          <td style="background-color:#f08500;padding:20px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">
              New ICC Profile Request
            </p>
            <p style="margin:5px 0 0;font-size:13px;color:#fff3e0;line-height:1.5;">
              A customer has requested an ICC colour profile via the material page.
            </p>
          </td>
        </tr>

        <!-- White body -->
        <tr>
          <td style="background-color:#ffffff;padding:32px;">

            <!-- Info grid -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
              ${rowsHtml}
            </table>

            <!-- Reply callout -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="margin-top:24px;border-left:4px solid #f08500;background-color:#fff7ed;border-radius:0 8px 8px 0;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:0.05em;">
                    Next Step
                  </p>
                  <p style="margin:6px 0 0;font-size:13px;color:#7c2d12;line-height:1.6;">
                    Reply to this email or send the ICC profile directly to
                    <a href="mailto:${data.email}" style="color:#f08500;font-weight:600;">${data.email}</a>.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer: navy bar -->
        <tr>
          <td style="background-color:#0c2a3a;border-radius:0 0 16px 16px;padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:top;">
                  <p style="margin:0;font-size:13px;font-weight:600;color:#f1f5f9;">Businesslabels</p>
                  <p style="margin:5px 0 0;font-size:12px;color:#475569;line-height:1.6;">
                    <a href="mailto:verkoop@businesslabels.nl"
                      style="color:#64748b;text-decoration:none;">verkoop@businesslabels.nl</a>
                    &nbsp;&middot;&nbsp;
                    <a href="tel:+31318590465"
                      style="color:#64748b;text-decoration:none;">+31 (0)318 590 465</a>
                  </p>
                </td>
                <td align="right" style="vertical-align:top;">
                  <p style="margin:0;font-size:11px;color:#334155;line-height:1.5;">
                    Auto-generated by<br/>businesslabels.nl
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

/**
 * POST /api/icc-profile-request
 * Sends a branded ICC profile request email to the admin via SMTP.
 *
 * Required env vars:
 *   SMTP_HOST        — e.g. "sandbox.smtp.mailtrap.io"
 *   SMTP_PORT        — e.g. "587"
 *   SMTP_USER        — SMTP username
 *   SMTP_PASS        — SMTP password
 *   ADMIN_EMAIL      — recipient address for admin notifications
 *   SMTP_FROM        — (optional) From display address
 *   NEXT_PUBLIC_SITE_URL — (optional) site base URL for logo; defaults to https://businesslabels.nl
 */
export async function POST(request: NextRequest) {
  let body: IccProfileRequestPayload;
  try {
    body = (await request.json()) as IccProfileRequestPayload;
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const printerModel = typeof body.printerModel === 'string' ? body.printerModel.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const materialTitle = typeof body.materialTitle === 'string' ? body.materialTitle.trim() : '';

  if (!printerModel || !email) {
    return NextResponse.json(
      {
        message: 'Printer model and email are required.',
        errors: {
          ...(!printerModel && { printerModel: ['The printer model field is required.'] }),
          ...(!email && { email: ['The email field is required.'] }),
        },
      },
      { status: 422 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { message: 'Invalid email address.', errors: { email: ['Invalid email address.'] } },
      { status: 422 },
    );
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL ?? smtpUser;
  const fromEmail = process.env.SMTP_FROM ?? smtpUser ?? 'noreply@businesslabels.nl';

  if (!smtpHost || !smtpUser || !smtpPass || !adminEmail) {
    console.error(
      '[ICC Profile] SMTP not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL to .env',
    );
    return NextResponse.json(
      { message: 'Email service is not configured. Please contact us directly.' },
      { status: 503 },
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const subject = materialTitle
      ? `ICC Profile Request: ${materialTitle} — ${printerModel}`
      : `ICC Profile Request — ${printerModel}`;

    await transporter.sendMail({
      from: `"Businesslabels" <${fromEmail}>`,
      to: adminEmail,
      replyTo: email,
      subject,
      html: buildEmailHtml({ printerModel, email, companyName, phone, materialTitle }),
    });

    return NextResponse.json({ message: 'Request sent successfully.' }, { status: 200 });
  } catch (error) {
    console.error('[ICC Profile] Failed to send email:', error);
    return NextResponse.json(
      { message: 'Failed to send request. Please try again later.' },
      { status: 500 },
    );
  }
}
