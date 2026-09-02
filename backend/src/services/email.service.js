// Transactional email service.
// Resend is used when RESEND_API_KEY is configured; SMTP remains available for
// local/dev fallback and deployments that still use SMTP credentials.
const axios = require("axios");
const nodemailer = require("nodemailer");

const fromAddress = () => process.env.EMAIL_FROM || "Neuro Bridge Africa <noreply@neurobridge.com>";
const replyToAddress = () => process.env.EMAIL_REPLY_TO || undefined;

const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    return {
      sendMail: async (mailOptions) => {
        console.log("--- EMAIL (dev mode, not sent) ---");
        console.log("To:", mailOptions.to);
        console.log("Subject:", mailOptions.subject);
        console.log("Body:", mailOptions.text || mailOptions.html);
        console.log("----------------------------------");
      },
    };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

const shouldUseResend = () => Boolean(process.env.RESEND_API_KEY);

const sendWithResend = async ({ to, subject, text, html }) => {
  const response = await axios.post(
    process.env.RESEND_API_URL || "https://api.resend.com/emails",
    {
      from: fromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
      ...(replyToAddress() ? { reply_to: replyToAddress() } : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: Number(process.env.EMAIL_TIMEOUT_MS) || 10000,
    },
  );

  return response.data;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (shouldUseResend()) {
    return sendWithResend({ to, subject, text, html });
  }

  return transporter.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
    html,
    ...(replyToAddress() ? { replyTo: replyToAddress() } : {}),
  });
};

const otpHtml = ({ title, intro, otpCode }) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="color: #0a3d62;">${title}</h2>
    <p>${intro}</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                padding: 16px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
      ${otpCode}
    </div>
    <p>This code expires in <strong>10 minutes</strong>.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #6b7280; font-size: 12px;">
      If you did not request this code, please ignore this email.
    </p>
  </div>
`;

const logDevCode = (label, recipient, code) => {
  if (shouldUseResend() || process.env.SMTP_HOST) return;
  console.log("\n========================================");
  console.log(`  ${label}`);
  console.log("========================================");
  console.log(`  Email: ${recipient}`);
  console.log(`  Code:  ${code}`);
  console.log("  Expires in 10 minutes");
  console.log("========================================\n");
};

exports.sendOtpEmail = async (email, otpCode) => {
  logDevCode("OTP VERIFICATION CODE", email, otpCode);

  await sendEmail({
    to: email,
    subject: "Your Neuro Bridge Africa verification code",
    text: `Your verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not request this code, please ignore this email.`,
    html: otpHtml({
      title: "Neuro Bridge Africa Verification",
      intro: "Your verification code is:",
      otpCode,
    }),
  });
};

exports.sendPasswordResetEmail = async (email, otpCode) => {
  logDevCode("PASSWORD RESET CODE", email, otpCode);

  await sendEmail({
    to: email,
    subject: "Reset your Neuro Bridge Africa password",
    text: `Your password reset code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not request this reset, please ignore this email.`,
    html: otpHtml({
      title: "Neuro Bridge Africa Password Reset",
      intro: "Use this code to reset your password:",
      otpCode,
    }),
  });
};

exports.sendNotificationEmail = async (email, title, body) => {
  await sendEmail({
    to: email,
    subject: `Neuro Bridge Africa: ${title}`,
    text: `${title}\n\n${body}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0a3d62;">${title}</h2>
        <p style="line-height: 1.6;">${body}</p>
      </div>
    `,
  });
};

exports.sendAdminInviteEmail = async (email, inviteCode, inviterName) => {
  await sendEmail({
    to: email,
    subject: "Neuro Bridge Africa admin invitation",
    text: [
      `${inviterName} invited you to join Neuro Bridge Africa as an administrator.`,
      "",
      `Use this special admin code when signing up: ${inviteCode}`,
      "",
      "If you were not expecting this invitation, please ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0a3d62;">Admin Invitation</h2>
        <p>${inviterName} invited you to join Neuro Bridge Africa as an administrator.</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center;
                    padding: 16px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
          ${inviteCode}
        </div>
        <p>Use this special admin code when signing up as an administrator.</p>
      </div>
    `,
  });
};

exports.sendEmail = sendEmail;
