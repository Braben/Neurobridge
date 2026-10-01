# Design-System Foundation

Source file: [NEURO-BRIDGE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=0-1). Inspected on 2026-09-17.

## Verified Sources

| Family | Source | Code |
| --- | --- | --- |
| Color palettes | `19:144` | `frontend/src/styles/tokens.css` |
| Primary buttons | `35:41` | `frontend/src/components/ui/AppButton.tsx` |
| Secondary buttons | `35:63` | Same shared button with `variant="secondary"` |
| Text fields and dropdowns | `43:169` | `frontend/src/components/ui/FormField.tsx` |
| Dropdown caret | `211:999` inside `43:169` | `frontend/public/design-assets/icons/caret-down.svg` |
| OTP default/error cells | `43:105` within `59:1339`; `60:1438` | `frontend/src/components/ui/OtpInput.tsx` (inspected 2026-09-18) |
| Shared auth panel and OTP composition | `59:1339`, `60:1438`, `60:1485` | `AuthFrame` and `OtpVerificationPage`; see `authentication-reference.md` (inspected 2026-09-29) |
| Signin and password visibility | `53:1167`, `1037:11324`, `58:585`, `43:230` | `LoginPage`; see `signin-reference.md` (inspected 2026-09-29) |

## Geometry And Typography

| Property | Reference |
| --- | --- |
| Small / medium / large button width | 158 / 237 / 361px |
| Button height, radius, inset | 60 / 16 / 12px |
| Button label | Plus Jakarta Sans, 18px / 28px, weight 500 |
| Text/select field height, radius, inset | 60 / 16 / 16px |
| Standalone field reference width | 361px, adapted to its form column |
| Label typography and label gap | 16px / 24px, weight 400; 12px gap |
| Input-value typography | 16px / 24px, weight 500 |
| Error/help typography and gap | 12px / 16px; 8px gap |
| Dropdown glyph | Exact exported asset, 24 x 24px |
| OTP row and cells | 361px row, six 48 x 48px cells, 8px corners, 16px / 24px regular text |

The existing 120px multiline height is carried forward from the previously inspected landing contact frame; its entire design-system family remains to be audited. Title and remaining spacing tokens are also a partial foundation, not a claim of a fully extracted variable library.

## Conflicts And Decisions

- Palette prose calls the hover blue `#1E90FF`; primary/secondary components bind their focused/pressed state to `#0071D7`. Implement the component binding and preserve `#1E90FF` as a separate palette accent.
- The rich-gold prose repeats a blue hex. Use the actual swatches (`#FFD700`, `#FFB84D`, `#FFF5CC`), not that description.
- Secondary disabled buttons use `#757575` borders and text. Primary disabled buttons use `#B5D3EE` with the normal light label. Do not fade the entire control with opacity.
- Active text fields use primary `#0A3D62` borders; they do not share the button focused fill color.
- Keyboard focus outlines are an accessibility addition around the reference geometry; they do not change control size.
- Legacy `outline`, `ghost`, and `danger` buttons remain compatibility variants. They are not yet visually signed off against their own Figma families.
- Desktop reference widths are bounded by the parent on narrow screens. `fullWidth` explicitly fills a form column; `size="content"` is a compatibility option for compact actions, not a new Figma size.
- OTP cells keep the reference square size on desktop and shrink equally below the available row width on narrow phones. Letter spacing is normalized to zero; the source cell specifies 0.2px. Native input labels, paste/autofill distribution, pending locks, and keyboard focus are accessibility/behavior additions.
- Next may load a CSS module before global CSS. Each shared module declares the layer order so the Tailwind reset cannot override its borders, radius, or typography.

## Review And Verification

Run `npm run dev -- --port 3100` from `frontend`, then open `http://localhost:3100/design-system`. The page is disabled in production and has no connection to real backend records. It renders the same shared components used by the app, not duplicate mock components.

`e2e/design-system.spec.ts` checks dimensions, token colors, keyboard focus, disabled navigation, ref forwarding, native form behavior, local asset availability, and viewport overflow. It captures screenshots at 1440, 390, and 320px under Playwright's ignored `test-results` directory. Review them against the Figma reference screenshots; do not automatically bless self-generated screenshots as Figma baselines.

`e2e/auth-otp.spec.ts` checks keyboard editing, leading-zero paste/autofill, pending request locks, error/retry behavior, and desktop/mobile OTP geometry. `e2e/auth-visual.spec.ts` additionally checks the source frame's default OTP rail, original logo crop, arrow, footer, local assets, resend failure recovery, elapsed-time countdown, and pre-hydration input protection. The shared side panel and default OTP composition have been visually reviewed; the other authentication form compositions remain separate audits.

Signin, parent/therapist signup, and reset-password now use original default/hidden/visible password icons, with geometry and interaction coverage in the login, register, and recovery-contact tests. The next component pass must inspect the remaining password variants, checkboxes, radio buttons, toggles, dialogs, tables, and navigation before implementing their exact variants. Use this same source ledger for each family.
