# Signin Reference

Inspected on 2026-09-29 in the Neuro Bridge Figma file.

## Sources And Routes

| Source | Route / decision |
| --- | --- |
| [Parent default, 53:1167](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=53-1167) | `/login?role=PARENT` uses the parent greeting |
| [Therapist default, 1037:11324](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=1037-11324) | `/login?role=THERAPIST` uses the therapist greeting |
| [Filled shared screen, 58:585](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-585) | `/login` retains the neutral heading; explicit role headings remain stable as fields are edited |
| [Error/loading, 58:642](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-642) | Original warning and loading assets; messages reflect actual API responses rather than Figma's sample errors |
| [Visible password, 43:230](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=43-230) | Native text/password toggle using the original visibility asset |

The role query controls only greeting and signup destination. Authentication still uses the backend-returned role. Unknown or repeated query values use the neutral screen. The default parent and therapist frames share identical geometry, so their headings can be selected without duplicating forms.

## Geometry

On the 1440 x 1024 source canvas, the rail begins at x603. The heading block begins at y268, with the 32px/38px title at y314. The first 361 x 60 field begins at y428; the password field begins at y548; its native 24px icon is at x924/y566. Recovery sits eight pixels below the password field. The 361 x 60 primary button begins at y656, and the signup line follows by 16px. The shared footer remains at y960.

The heading is not constrained to the form's 361px width. Mobile wraps the fixed-size heading and footer, bounds fields to the viewport, and places error feedback in document flow to prevent overlap. Longer native input placeholders use ellipsis rather than clipping through a letter. Letter spacing is normalized to zero as in the shared controls.

The side panel reuses the assets and crop recorded in `authentication-reference.md`. All new SVG files are unmodified local Figma assets with native 24 x 24 dimensions; their provenance is recorded in `frontend/public/design-assets/icons/README.md`.

## Interaction And Remaining Differences

- Empty credentials keep the primary action disabled. The existing backend login rules are preserved; no new password-strength restriction is applied to signin.
- Filled fields retain the source primary-blue border after blur. Revealing and hiding a password preserves its value and dimensions, and the icon action has a hover tooltip.
- Inputs and actions stay locked across credentials submission and any subsequent OTP-delivery request. The original loading-loop asset respects reduced-motion preferences.
- API errors remain truthful: a delivery failure or service outage is not labelled as an invalid email and password. Correcting a field clears stale feedback. The hardcoded simultaneous field errors in the Figma sample are not fabricated from a generic backend error.
- The admin source (`58:817`) includes a special admin login code. The current backend `loginSchema` accepts only email/phone and password. `/login?role=ADMIN` retains working authentication and the admin signup destination, but this extra-code design is not signed off or implemented as a nonfunctional input. Its security contract requires a separate backend task.

`frontend/e2e/login-visual.spec.ts` covers both default-frame coordinates, the original icon files, disabled/filled states, visibility, request locking, error recovery, reduced motion, mobile overflow, error positioning, and the recovery link. Existing handoff tests cover email/SMS and parent/therapist/admin registration. These tests mock APIs and do not establish live delivery or backend authorization correctness.
