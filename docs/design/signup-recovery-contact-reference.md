# Signup, Recovery, and Contact

Implemented and inspected on 2026-09-30. Scope is the source default compositions and the listed functional flows, not all 119 Figma states.

## Source Geometry

- Parent signup `83:1167` and therapist signup `300:1903`: x603 rail, 746px content, two 361px columns with 24px gap; title y243, first inputs y357, password inputs y597, centered button x795.5/y681 at 1440x1024.
- Parent redesign alternatives `1049:8419` and `1049:8655` remain separate inventory entries. This batch preserves the original two-column parent form; it does not silently switch to the redesign.
- Forgot password `60:1619`: title x603/y345 at 24px/30px, input x603/y495 at 361x60. Lost-access navigation maps to `/contact?subject=Account%20recovery`.
- Create password `71:660`: title x603/y289 at 32px/38px; first input x603/y447 at 361x60. Supplementary recovery links sit below the measured desktop composition and return to normal flow on mobile.
- Contact administrator `111:770`: 797px heading rail at x603/y183, description width682, 361px form starting at y361, first input y397, message input y637 at361x120, button y781 at361x60. No footer in this source frame.

## Assets

Signup reuses the original password visibility assets and the calendar exported from `I83:1182;211:964`. The initial parent-frame generated code incorrectly identified the overridden icon as a caret; the instance screenshot and its own context confirm a calendar.

Contact uses original `contact-side.png` from source asset `8eaea.png`, not the shared authentication photo. Its fill transform is width317.97%, height100%, left-167.35%, top-0.04%. The shared transparent logo crop is unchanged. The textarea resize icon is the unchanged original `9b946.svg`, stored as `icons/contact-resize.svg`. No temporary Figma URL is used by the application.

## API Mapping

- Registration retains the existing role-specific name/expertise payload and email/SMS OTP target. All inputs and visibility actions lock while pending; rejected values survive and stale errors clear on correction.
- Reset requests retain the account-neutral response contract. A separate code-entry step collects the target and six cells before displaying the two-password source composition. This is an explicit implementation adaptation because the backend requires a code; advancing locally does not claim verification. The final `/auth/reset-password` transaction alone verifies the code and changes the password. Codes/passwords remain in component memory and clear after success.
- `/contact` and the landing form submit to `POST /contact`. The contact frame's 1000-character UI limit is stricter than the backend's2000-character maximum. Email placeholder copy is corrected to request a reachable email rather than suggesting a phone value for an email-only field.
- Receipt means a row was saved, not that an email was sent. Failure preserves typed content. `/admin/complaints` has an inquiry queue separate from its existing platform conversations. The added queue/tabs are a functional backend-integration adaptation, not a claim of exact Figma state parity.

## Remaining Sign-Off

Administrator signup and administrator special-code login still need source/contract completion. Signup/recovery/contact success, error, and loading frames have functional behavior but have not all received individual visual comparisons. The full landing page and remaining role dashboards remain pending. Real database, delivery-provider, payment, and deployed-cookie checks are separate from mocked browser coverage.
