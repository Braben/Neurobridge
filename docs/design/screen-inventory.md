# Neuro Bridge Screen Inventory

Captured from MAIN DESIGN (`2:2`) on 2026-09-17. 119 visible screen/state/modal frames are recorded; these are not 119 distinct routes. Design-system components and photo asset sheets are excluded from this count.

The node IDs, names, and dimensions are read from Figma. Route and dependency assignments are engineering mappings, not Figma-provided facts; parenthesized notes identify differences to resolve. No screen is marked visually complete merely because its route exists.

## Source Pages

- [MAIN DESIGN](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=2-2): implementation reference.
- [DESIGN SYSTEM + COMPONENTS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=0-1): component and token reference.
- `458:2448` DARK THEME - UNDER TESTS: experimental, excluded from the initial release.
- `1037:11369` DISCARDED: excluded.

## Decisions And Gaps

- Parent signup has two extra frames (`1049:8419`, `1049:8655`); login also has an extra default frame. Keep these visible in the inventory; do not silently choose a redesign.
- Several parent workflows are modals in Figma but standalone routes in the app. Preserve existing links while deciding modal routing per flow.
- Contact Administrator now maps to `/contact`, backed by persisted inquiries and an admin inbox. The default frame is measured; state-specific visual comparisons remain pending. Landing Submit now uses the same endpoint. Deployment requires the ContactInquiry migration.
- School support is labelled Coming Soon on the landing page; no school dashboard section was found on MAIN DESIGN.
- Some therapist tables are designed at 1981px or 2160px; some administrator tables reach 2258px. Test at those reference widths and define horizontal scrolling for smaller viewports.
- The existing landing page uses substitute photographs and has not passed an image-overlay comparison. Its previous completion claim is not visual sign-off.
- Inventory captures visible immediate frames in each screen section, including standalone modals. Nested overlays remain part of the parent screen and need screen-level inspection.

## SIGN UP - PARENT

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [SIGN UP - PARENT - TEXTS FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=47-622) | 1440 x 1024 | PARENT | `/register?role=PARENT` |
| [SIGN UP - PARENT - DEFAULT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=83-1167) | 1440 x 1024 | PARENT | `/register?role=PARENT` |
| [SIGN UP - PARENT - TEXTS FILLED - LOADING](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=54-1470) | 1440 x 1024 | PARENT | `/register?role=PARENT` |
| [SIGN UP - PARENT - ERROR STATES](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=47-710) | 1440 x 1024 | PARENT | `/register?role=PARENT` |

## SIGN UP - PARENT - DEFAULT

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [SIGN UP - PARENT - DEFAULT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=1049-8419) | 1440 x 1024 | PARENT | `/register?role=PARENT` |

## SIGN UP - THERAPIST

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [SIGN UP - THERAPIST - TEXTS FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=300-1878) | 1440 x 1024 | THERAPIST | `/register?role=THERAPIST` |
| [SIGN UP - THERAPIST - DEFAULT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=300-1903) | 1440 x 1024 | THERAPIST | `/register?role=THERAPIST` |
| [SIGN UP - THERAPIST - TEXTS FILLED - LOADING](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=300-1928) | 1440 x 1024 | THERAPIST | `/register?role=THERAPIST` |
| [SIGN UP - THERAPIST - ERROR STATES](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=300-1957) | 1440 x 1024 | THERAPIST | `/register?role=THERAPIST` |

## LOGIN - PARENT / THERAPIST

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [LOGIN - PARENT / THERAPIST - ERROR STATES](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-642) | 1440 x 1024 | PARENT, THERAPIST | `/login` |
| [LOGIN - PARENT / THERAPIST - TEXTS FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-585) | 1440 x 1024 | PARENT, THERAPIST | `/login` |
| [LOGIN - PARENT / THERAPIST - TEXTS FILLED - SUCCESSFUL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-758) | 1440 x 1024 | PARENT, THERAPIST | `/login` |
| [LOGIN - PARENT / THERAPIST - NONE FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=1037-11324) | 1440 x 1024 | PARENT, THERAPIST | `/login` |
| [LOGIN - PARENT / THERAPIST - NONE FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=53-1167) | 1440 x 1024 | PARENT, THERAPIST | `/login` |

## HOME - LANDING PAGE - LOGIN MODAL

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [HOME - LANDING PAGE - LOGIN MODAL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=1036-11091) | 1440 x 1024 | PUBLIC | `/` |

## LOGIN - ADMINISTRATOR

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [LOGIN - ADMINISTRATOR - NONE FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-817) | 1440 x 1024 | ADMIN | `/login?role=ADMIN` |
| [LOGIN - ADMINISTRATOR - TEXTS FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-1020) | 1440 x 1024 | ADMIN | `/login?role=ADMIN` |
| [LOGIN - ADMINISTRATOR - ERROR STATES](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-1101) | 1440 x 1024 | ADMIN | `/login?role=ADMIN` |
| [LOGIN - PARENT / THERAPIST - TEXTS FILLED - SUCCESSFUL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-875) | 1440 x 1024 | ADMIN | `/login?role=ADMIN` |
| [LOGIN - PARENT / THERAPIST - TEXTS FILLED - SUCCESSFUL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=58-893) | 1440 x 1024 | ADMIN | `/login?role=ADMIN` |

## SIGN UP - ADMINISTRATOR

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [SIGN UP - ADMINISTRATOR - NONE FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=47-922) | 1440 x 1024 | ADMIN | `/register/admin` |
| [SIGN UP - ADMINISTRATOR - TEXTS FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=47-939) | 1440 x 1024 | ADMIN | `/register/admin` |
| [SIGN UP - ADMINISTRATOR - TEXTS FILLED - LOADING](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=54-1593) | 1440 x 1024 | ADMIN | `/register/admin` |
| [SIGN UP - ADMINISTRATOR - ERROR STATES](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=47-956) | 1440 x 1024 | ADMIN | `/register/admin` |

## VERIFY ACCOUNT

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [VERIFY ACCOUNT - ADMINISTRATOR - OTP DEFAULT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=59-1339) | 1440 x 1024 | ALL | `/verify-otp` |
| [VERIFY ACCOUNT - ADMINISTRATOR - OTP TYPING](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1391) | 1440 x 1024 | ALL | `/verify-otp` |
| [VERIFY ACCOUNT - ADMINISTRATOR - OTP ERROR - COUNTDOWN ON](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1438) | 1440 x 1024 | ALL | `/verify-otp` |
| [VERIFY ACCOUNT - ADMINISTRATOR - OTP ERROR - COUNTDOWN UP](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1485) | 1440 x 1024 | ALL | `/verify-otp` |
| [VERIFY ACCOUNT - ADMINISTRATOR - OTP ERROR - NEW OTP REQUESTED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1521) | 1440 x 1024 | ALL | `/verify-otp` |
| [VERIFY ACCOUNT - ADMINISTRATOR - OTP VERIFIED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1569) | 1440 x 1024 | ALL | `/verify-otp` |

## FORGOT PASSWORD - GENERAL

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [FORGOT PASSWORD - GENERAL - DEFAULT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1619) | 1440 x 1024 | PUBLIC | `/forgot-password` |
| [FORGOT PASSWORD - GENERAL - FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1658) | 1440 x 1024 | PUBLIC | `/forgot-password` |
| [FORGOT PASSWORD - GENERAL - SUCCESS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1763) | 1440 x 1024 | PUBLIC | `/forgot-password` |
| [FORGOT PASSWORD - GENERAL -  LOADING](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1689) | 1440 x 1024 | PUBLIC | `/forgot-password` |
| [FORGOT PASSWORD - GENERAL -  ERROR](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=60-1719) | 1440 x 1024 | PUBLIC | `/forgot-password` |
| [FORGOT PASSWORD - GENERAL -  LOST ACCESS TO BOTH EMAIL & PHONE - CLICKED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=61-1794) | 1440 x 1024 | PUBLIC | `/forgot-password` |

## CREATE NEW PASSWORD

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [CREATE NEW PASSWORD - DEFAULT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=71-660) | 1440 x 1024 | PUBLIC | `/reset-password` |
| [CREATE NEW PASSWORD - FILLED - ALL CORRECT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=71-711) | 1440 x 1024 | PUBLIC | `/reset-password` |
| [CREATE NEW PASSWORD - FILLED -SUBMISSION SUCCESSFUL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=71-865) | 1440 x 1024 | PUBLIC | `/reset-password` |
| [CREATE NEW PASSWORD - FILLED - LOADING](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=71-821) | 1440 x 1024 | PUBLIC | `/reset-password` |
| [CREATE NEW PASSWORD - FILLED - ERRORS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=71-770) | 1440 x 1024 | PUBLIC | `/reset-password` |

## ARBITRARY PAGES - ABOUT US & PRIVACY POLICY

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [NEURO BRIDGE - ABOUT US](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=72-970) | 1440 x 2804 | PUBLIC | `/about` |
| [NEURO BRIDGE - PRIVACY POLICY](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=96-1287) | 1440 x 3192 | PUBLIC | `/privacy` |

## CONTACT ADMINISTRATOR

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [CONTACT ADMINISTRATOR - MAIN - DEFAULT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=111-770) | 1440 x 1024 | PUBLIC | `/contact` |
| [CONTACT ADMINISTRATOR - FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=111-889) | 1440 x 1024 | PUBLIC | `/contact` |
| [CONTACT ADMINISTRATOR - FILLED [LOADING]](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=113-977) | 1440 x 1024 | PUBLIC | `/contact` |
| [CONTACT ADMINISTRATOR - FILLED [LOADING]](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=113-1017) | 1440 x 1024 | PUBLIC | `/contact` |
| [CONTACT ADMINISTRATOR - FILLED - SUBMITTED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=114-1056) | 1440 x 1024 | PUBLIC | `/contact` |
| [CONTACT ADMINISTRATOR - FILLED - SOMETHING WENT WRONG](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=114-1204) | 1440 x 1024 | PUBLIC | `/contact` |

## PARENT DASHBOARD - EMPTY + CHILD PROFILE ADDON + WAITING TO BE ASSIGNED A THERAPIST

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [PARENT DASHBOARD - EMPTY](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=158-885) | 1440 x 2302 | PARENT | `/dashboard` |
| [PARENT DASHBOARD - EMPTY](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=213-1418) | 1440 x 1024 | PARENT | `/dashboard` |
| [PARENT DASHBOARD - EMPTY](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=918-9293) | 1440 x 1024 | PARENT | `/dashboard` |
| [ADDING CHILD PROFILE - STEP 1 - EMPTY](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=210-991) | 1440 x 1024 | PARENT | `/children/add` |
| [ADDING CHILD PROFILE - STEP 2 - EMPTY ](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=212-1142) | 1440 x 1024 | PARENT | `/children/add` |
| [ADDING CHILD PROFILE - STEP 2 - FILLED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=212-1218) | 1440 x 1024 | PARENT | `/children/add` |
| [ADDING CHILD PROFILE - STEP 2 - FILLED - SUBMIT UNSUCCESSFUL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=212-1361) | 1440 x 1024 | PARENT | `/children/add` |
| [ADDING CHILD PROFILE - STEP 2 - FILLED - SENT SUCCESSFUL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=212-1300) | 1440 x 1024 | PARENT | `/children/add` |
| [ADDING CHILD PROFILE - STEP 1 - ACTIVE STATE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=212-1045) | 1440 x 1024 | PARENT | `/children/add` |

## PARENT DASHBOARD

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [PARENT DASHBOARD - WITH CHILD PROFILE ADDED & NOTES VISIBLE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=224-1067) | 1440 x 2246 | PARENT | `/dashboard` |
| [PARENT DASHBOARD - WITH CHILD PROFILE ADDED & NO NOTES YET](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=261-1221) | 1440 x 2019 | PARENT | `/dashboard` |
| [PARENT DASHBOARD - WITH CHILD PROFILE ADDED & NOTES VISIBLE - ALL SESSION NOTES](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=264-1622) | 1440 x 1024 | PARENT | `/children/[id]/sessions (Figma modal)` |
| [PARENT DASHBOARD - WITH CHILD PROFILE ADDED & NOTES VISIBLE - ALL SESSION NOTES - SEE ALL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=301-2654) | 1440 x 1024 | PARENT | `/children/[id]/sessions (Figma modal)` |
| [PARENT DASHBOARD - WITH CHILD PROFILE ADDED - OPENING CHATS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=287-1557) | 1440 x 1024 | PARENT | `/messages/[id] (Figma modal)` |
| [PARENT DASHBOARD - LOGOUT SCREEN](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=310-3211) | 1440 x 1024 | PARENT | `/dashboard` |
| [PARENT DASHBOARD - BOOKING A THERAPIST](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=340-1950) | 1440 x 1024 | PARENT | `/bookings/new (Figma modal)` |
| [PARENT DASHBOARD - BOOKING A THERAPIST - PAYMENT CONFIRMED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=340-2171) | 1440 x 1024 | PARENT | `/bookings/[id]/payment` |
| [PARENT DASHBOARD - BOOKING A THERAPIST - PAYMENT DENIED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=340-2341) | 1440 x 1024 | PARENT | `/bookings/[id]/payment` |
| [PARENT DASHBOARD - WITH CHILD PROFILE ADDED - NOTIFICATIONS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=271-1223) | 1440 x 1024 | PARENT | `/notifications (Figma overlay)` |
| [PARENT DASHBOARD - WITH CHILD PROFILE ADDED - NOTIFICATIONS - NONE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=271-1466) | 1440 x 1024 | PARENT | `/notifications (Figma overlay)` |
| [PARENT DASHBOARD - PICTURE UPLOAD - CHANGE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=277-1806) | 1440 x 1024 | PARENT | `/dashboard` |
| [PARENT DASHBOARD - PICTURE UPLOAD - COMPLETE / SUCCESSFUL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=277-2204) | 1440 x 1024 | PARENT | `/dashboard` |
| [PARENT DASHBOARD - PICTURE UPLOAD - UNSUCCESSFUL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=277-2386) | 1440 x 1024 | PARENT | `/dashboard` |

## THERAPIST DASHBOARD

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [THERAPIST DASHBOARD - MAIN SCREEN](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=309-3074) | 1440 x 2351 | THERAPIST | `/dashboard` |
| [THERAPIST DASHBOARD - MAIN SCREEN - NO ASSIGNED CHILDREN / BOOKING](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=480-2717) | 1440 x 2073 | THERAPIST | `/dashboard` |
| [THERAPIST DASHBOARD - RECENT SESSION NOTES](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=480-2300) | 1440 x 1024 | THERAPIST | `/dashboard` |
| [THERAPIST DASHBOARD - ADDING SESSION NOTES - DEFAULT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=543-2856) | 1440 x 1024 | THERAPIST | `/children/[id]/sessions/new (Figma modal)` |
| [THERAPIST DASHBOARD - ADDING SESSION NOTES - ACTIVE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=543-3329) | 1440 x 1024 | THERAPIST | `/children/[id]/sessions/new (Figma modal)` |
| [THERAPIST DASHBOARD - ASSIGNED CHILDREN](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=601-5014) | 1981 x 1191 | THERAPIST | `/children` |
| [THERAPIST DASHBOARD - ASSIGNED CHILDREN - SEARCH RESULT PAGE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=662-6772) | 1981 x 1191 | THERAPIST | `/children` |
| [THERAPIST DASHBOARD - ASSIGNED CHILDREN - BOOKING HISTORY](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=660-4038) | 1981 x 1191 | THERAPIST | `/children` |
| [THERAPIST DASHBOARD - ASSIGNED CHILDREN - VIEW FULL PROFILE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=660-4414) | 1981 x 1191 | THERAPIST | `/children` |
| [THERAPIST DASHBOARD - BOOKINGS TABLE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=628-5076) | 1440 x 1024 | THERAPIST | `/bookings` |
| [THERAPIST DASHBOARD - SESSION NOTES - FULL TABLE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=673-6094) | 2160 x 1024 | THERAPIST | `/sessions` (wide-frame comparison pending) |
| [THERAPIST DASHBOARD - SESSION NOTES - CLIPPED CONTENT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=673-6411) | 1440 x 1024 | THERAPIST | `/sessions` |
| [THERAPIST DASHBOARD - SESSION NOTES - CLIPPED CONTENT - EXPANDED VIEW](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=673-6640) | 1440 x 1024 | THERAPIST | `/sessions` (expanded field) |

## ADMIN DASHBOARD

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [ADMIN DASHBOARD - CHILDREN FULL DATABASE TABLE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=734-5060) | 2258 x 1188 | ADMIN | `/admin/children` |
| [ADMIN DASHBOARD - CHILDREN FULL DATABASE TABLE - VIEW CHILD](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=950-7537) | 2258 x 1188 | ADMIN | `/admin/children` |
| [MODAL FOR ASSIGNED CHILDREN](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=952-9671) | 246 x 264 | ADMIN | `/admin/therapists (modal placement to confirm)` |
| [MODAL FOR ASSIGNED CHILDREN](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=952-9730) | 238 x 302 | ADMIN | `/admin/therapists (modal placement to confirm)` |
| [MODAL FOR THERAPIST HIGHLIGHT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=952-9614) | 238 x 240 | ADMIN | `/admin/therapists (modal placement to confirm)` |
| [ADMIN DASHBOARD - CHILDREN FULL DATABASE TABLE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=738-5409) | 1647 x 1188 | ADMIN | `/admin/children` |
| [ADMIN DASHBOARD - CHILDREN FULL DATABASE TABLE - MORE OPTIONS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=757-6056) | 1647 x 1188 | ADMIN | `/admin/children` |
| [ADMIN DASHBOARD - OVERVIEW](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=685-6615) | 1440 x 4712 | ADMIN | `/admin` |
| [ADMIN DASHBOARD - PARENTS ACCOUNTS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=717-4752) | 1451 x 1036 | ADMIN | `/admin/parents` |
| [ADMIN DASHBOARD - COMMUNICATION MANAGEMENT - VIEWING PREVIOUS MESSAGES](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=787-7648) | 1440 x 1036 | ADMIN | `/admin/messages` |
| [ADMIN DASHBOARD - COMMUNICATION MANAGEMENT - SENDING A MESSAGE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=789-8334) | 1440 x 1036 | ADMIN | `/admin/messages` |
| [ADMIN DASHBOARD - USER MANAGEMENT - DROPDOWN](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=801-6408) | 1440 x 1036 | ADMIN | `/admin` |
| [ADMIN DASHBOARD - USER MANAGEMENT - DROPDOWN](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=961-10271) | 1440 x 1036 | ADMIN | `/admin` |
| [MAIN MODAL - NEW AMOUNT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=961-10647) | 526 x 231 | ADMIN | `/admin/revenue?edit=session-fee (modal)` |
| [MAIN MODAL - NEW AMOUNT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=963-10681) | 526 x 231 | ADMIN | `/admin/revenue?edit=session-fee (modal)` |
| [MAIN MODAL - NEW AMOUNT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=963-10699) | 526 x 231 | ADMIN | `/admin/revenue?edit=session-fee (modal)` |
| [MAIN MODAL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=961-10578) | 425 x 278 | ADMIN | `/admin` |
| [MAIN MODAL](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=961-10600) | 425 x 302 | ADMIN | `/admin` |
| [ADMIN DASHBOARD - USER MANAGEMENT - PLATFORM USERS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=801-8586) | 1440 x 1036 | ADMIN | `/admin/users` |
| [ADMIN DASHBOARD - USER MANAGEMENT - PLATFORM USERS - MODALS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=976-11174) | 1440 x 1036 | ADMIN | `/admin/users` |
| [ADMIN DASHBOARD - ADD NEW ADMIN](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=809-8321) | 1440 x 1036 | ADMIN | `/admin/add-admin` |
| [ADMIN DASHBOARD - ADD NEW ADMIN - SENT SUCCESSFULLY](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=810-8926) | 1440 x 1036 | ADMIN | `/admin/add-admin` |
| [SENDING A MESSAGE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=964-10720) | 703 x 202 | ADMIN | `/admin/messages` |
| [ADMIN DASHBOARD - NOTIFICATIONS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=819-8316) | 1440 x 1036 | ADMIN | `/admin/notifications` |
| [ADMIN DASHBOARD - COMPLAINTS CORNER](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=819-8502) | 1440 x 1036 | ADMIN | `/admin/complaints` |
| [ADMIN DASHBOARD - THERAPISTS ACCOUNTS](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=718-7205) | 1577 x 1036 | ADMIN | `/admin/therapists (modal placement to confirm)` |
| [ADMIN DASHBOARD - THERAPISTS ACCOUNTS - CHILDREN'S LIST](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=952-9836) | 1577 x 1036 | ADMIN | `/admin/therapists (modal placement to confirm)` |
| [ADMIN DASHBOARD - CONTENT MANAGEMENT PLATFORM](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=757-6000) | 1440 x 1282 | ADMIN | `/admin/content` |
| [ADMIN DASHBOARD - CONTENT MANAGEMENT PLATFORM - ADD NEW CONTENT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=758-8450) | 1440 x 1282 | ADMIN | `/admin/content/new` |
| [MODAL - DEACTIVATE ACCOUNT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=974-11146) | 356 x 212 | ADMIN | `/admin/users` |
| [MODAL - SUSPEND ACCOUNT](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=976-11165) | 356 x 212 | ADMIN | `/admin/users` |

## HOME - LANDING PAGE

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [HOME - LANDING PAGE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=849-7438) | 1440 x 5872 | PUBLIC | `/` |

## HOME - LANDING PAGE

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [HOME - LANDING PAGE](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=1036-10864) | 1440 x 1024 | PUBLIC | `/` |

## SIGN UP - PARENT - DEFAULT - REDESIGNED

| Frame | Dimensions | Role | Route / Surface |
| --- | --- | --- | --- |
| [SIGN UP - PARENT - DEFAULT - REDESIGNED](https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=1049-8655) | 1440 x 1024 | PARENT | `/register?role=PARENT` |
