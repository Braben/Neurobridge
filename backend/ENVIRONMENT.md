# Backend Environment Configuration

## Email OTP and Password Reset

Neuro Bridge Africa uses Resend for transactional email when `RESEND_API_KEY` is set. SMTP remains available as a fallback when Resend is not configured.

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_API_URL=https://api.resend.com/emails
EMAIL_FROM="Neuro Bridge Africa <noreply@your-verified-domain.com>"
EMAIL_REPLY_TO=support@your-verified-domain.com
EMAIL_TIMEOUT_MS=10000
```

Use an email address on a verified Resend domain for `EMAIL_FROM` before production delivery.

## SMS OTP and Password Reset

Arkesel powers SMS delivery. The sender ID must be 11 characters or fewer.

```env
ARKESEL_API_KEY=xxxxxxxxxxxxxxxxx
ARKESEL_SMS_URL=https://sms.arkesel.com/api/v2/sms/send
ARKESEL_SENDER_ID=NeuroBridge
SMS_TIMEOUT_MS=10000
```

## Out-of-App Notifications

In-app notifications are always stored in the database and pushed through Socket.IO. Enable outbound email or SMS notification copies explicitly:

```env
EMAIL_NOTIFICATIONS_ENABLED=true
SMS_NOTIFICATIONS_ENABLED=true
```

Leave those flags as `false` in development unless you want real provider traffic.
