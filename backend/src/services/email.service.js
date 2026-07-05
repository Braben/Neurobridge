// Email service — sends transactional emails (OTP, notifications)
// Uses nodemailer with configurable SMTP transport
// Falls back to logging in development when SMTP is not configured

const nodemailer = require("nodemailer");

// Creates a reusable transporter from environment variables
// Expected env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
const createTransporter = () => {
  // In development without SMTP config, use a dummy transporter that logs
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

// Sends an OTP verification email to the specified recipient
// In development without SMTP, prints the OTP to the server console
exports.sendOtpEmail = async (email, otpCode) => {
  // Dev fallback — log OTP to console so developers can see it without email config
  if (!process.env.SMTP_HOST) {
    console.log("\n========================================");
    console.log("  OTP VERIFICATION CODE");
    console.log("========================================");
    console.log(`  Email: ${email}`);
    console.log(`  Code:  ${otpCode}`);
    console.log(`  Expires in 10 minutes`);
    console.log("========================================\n");
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@neurobridge.com",
    to: email,
    subject: "Your Neurobridge Verification Code",
    text: `Your verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Neurobridge Verification</h2>
        <p>Your verification code is:</p>
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
    `,
  };

  await transporter.sendMail(mailOptions);
};
