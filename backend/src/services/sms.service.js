// SMS delivery service for OTPs and outbound notifications.
// Arkesel is used in configured environments; development falls back to
// console logging so OTP flows remain testable without paid SMS credentials.
const axios = require("axios");

const normalizePhone = (phone) => String(phone || "").replace(/[\s()-]/g, "");

const senderId = () => process.env.ARKESEL_SENDER_ID || "NeuroBridge";

const assertSenderId = () => {
  if (senderId().length > 11) {
    throw new Error("ARKESEL_SENDER_ID must be 11 characters or fewer");
  }
};

const truncate = (value, maxLength) => {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
};

const sendSms = async ({ to, message }) => {
  const recipient = normalizePhone(to);
  if (!recipient) {
    throw new Error("SMS recipient is required");
  }

  if (!process.env.ARKESEL_API_KEY) {
    console.log("--- SMS (dev mode, not sent) ---");
    console.log("To:", recipient);
    console.log("Message:", message);
    console.log("--------------------------------");
    return { skipped: true };
  }

  assertSenderId();

  const response = await axios.post(
    process.env.ARKESEL_SMS_URL || "https://sms.arkesel.com/api/v2/sms/send",
    {
      sender: senderId(),
      message,
      recipients: [recipient],
    },
    {
      headers: {
        "api-key": process.env.ARKESEL_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: Number(process.env.SMS_TIMEOUT_MS) || 10000,
    },
  );

  return response.data;
};

exports.sendOtpSms = async (phone, otpCode) => {
  await sendSms({
    to: phone,
    message: `Your Neuro Bridge Africa verification code is ${otpCode}. It expires in 10 minutes.`,
  });
};

exports.sendPasswordResetSms = async (phone, otpCode) => {
  await sendSms({
    to: phone,
    message: `Your Neuro Bridge Africa password reset code is ${otpCode}. It expires in 10 minutes.`,
  });
};

exports.sendNotificationSms = async (phone, title, body) => {
  await sendSms({
    to: phone,
    message: truncate(`Neuro Bridge Africa: ${title}. ${body}`, 306),
  });
};

exports.normalizePhone = normalizePhone;
exports.sendSms = sendSms;
