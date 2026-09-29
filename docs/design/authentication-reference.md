# Authentication Reference

Inspected against the Neuro Bridge Figma file on 2026-09-29.

## Sources

- [OTP default, 59:1339](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=59-1339): 1440 x 1024 reference canvas.
- [OTP error, 60:1438](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1438): inline rejection feedback and countdown.
- [OTP expired, 60:1485](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1485): available resend link.

## Assets And Composition

| Local asset | Figma source | Rendering contract |
| --- | --- | --- |
| `frontend/public/design-assets/auth-logo.png` | Image fill in `59:1342` | Original transparent 1280 x 1280 image, clipped to a 414 x 216 slot at x40/y281; source fill transform retained in `AuthFrame.module.css` |
| `frontend/public/design-assets/icons/auth-back.png` | `59:1345` | Unmodified 24 x 24 node export, positioned at x40/y64 |
| `frontend/public/design-assets/children-classroom.jpg` | Matching existing image used in `59:1340` | Centered cover image beneath the source gold overlay; 483px desktop panel |

The flattened logo-node export included an opaque background that differed from the full-frame render. The implementation uses the original transparent image fill instead. No temporary Figma asset URLs are used by the application.

On the reference canvas, the OTP rail begins at x603. The first cell is at y483, cells are 48 x 48, and the 361 x 60 primary button begins at y555. The footer starts at y960. The heading uses 24px/30px medium text, supporting text 18px/28px medium, and the resend line 16px/24px medium. Letter spacing is normalized to zero as in the shared controls.

## Behavior And Responsive Decisions

- Real account names and contact details replace Figma sample data.
- Direct visitors retain an editable email/phone field; the known-account design hides it.
- A fresh in-session handoff starts a two-minute resend cooldown. An absolute deadline prevents browser timer throttling from extending that period. Failed delivery restores retry immediately; successful resend clears the old digits.
- This display timer is not persisted across reloads and is not a server rate limit. Backend authorization and delivery protections require separate verification.
- Pending verification and resend requests lock editing. Rejections and successful delivery feedback appear inline.
- Shared controlled inputs remain disabled before hydration so typing cannot disappear before event handlers attach.
- On narrow viewports, the decorative side panel is hidden, long account details wrap, the OTP cells shrink evenly, and footer links wrap. These are responsive adaptations, not additional mobile Figma frames.

## Verification Scope

`frontend/e2e/auth-visual.spec.ts` asserts source-frame coordinates, asset availability, logo crop dimensions, resend retry/expiry behavior, and pre-hydration input protection. `auth-otp.spec.ts` covers keyboard, paste/autofill, request locking, and desktop/mobile sizing. Screenshots are review evidence, not automatically approved visual baselines.

This pass verifies the shared side panel and OTP default composition plus interactive error/resend states. Other authentication form compositions, all role screens, and the complete landing page remain separate visual audits.
