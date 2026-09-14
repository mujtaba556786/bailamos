# Bailamos pre-launch quality audit

Date: 14 September 2026  
Environment: local production build at `http://127.0.0.1:5177`

## Executive result

Status: **not ready for public launch yet**. Core booking and administration logic is strong, but the launch checklist still has three material gaps: real media/social destinations, production email/AI configuration, and final physical-device/performance validation after deployment.

## Automated functional coverage

- Booking and cancellation: **17/17 passed**
- Content and marketing administration: **4/4 passed**
- Menu administration: **4/4 passed**
- Tables and operating settings: **5/5 passed**
- Total: **30/30 regression checks passed**

Covered cases include concurrent bookings, duplicate submission protection, invalid cancellation tokens, repeat cancellation, release of cancelled tables, stale owner edits, complete reservation status flow, audit history, closed days, capacity limits, invalid email, DST edge cases, newsletter consent, upload/content validation, unsafe URLs, menu prices, and future-booking table protection.

## Responsive presentation

- Desktop menu at 1440 px: cards, navigation, hierarchy and spacing rendered correctly.
- Tablet reservation at 768 px: the two-step booking surface rendered cleanly with usable controls and no visible clipping.
- Mobile homepage: responsive rules and mobile navigation are present. A final check on a physical iPhone and Android device is still required because macOS headless Chrome enforced a wider layout viewport while capturing the 390 px image.
- Touch targets inspected in the principal flows are generally 44 px or larger.

## Accessibility and keyboard

Automated axe-core WCAG 2 A/AA and 2.1 AA checks:

- Homepage: no detected violations
- Events: no detected violations
- Reservation: no detected violations
- Admin login: no detected violations
- Menu: **one serious color-contrast rule affecting four elements**

Keyboard focus order successfully reached navigation, primary actions, menu categories, dish details, event actions, reservation controls and admin authentication. A complete manual screen-reader session is still required before claiming full WCAG conformance.

## Links, images and video

- All local restaurant images returned HTTP 200 with the expected image type.
- Mixkit example-video destinations returned HTTP 200.
- Pexels preview images returned HTTP 200.
- Two Pexels destination pages returned HTTP 403 to the automated checker. They may work interactively, but they are not reliable production destinations.
- Instagram, Facebook and TikTok are still configured as `#` placeholders.
- Gallery and video content is explicitly demonstration content and must be replaced before launch.

## Local response measurements

These are server response timings on the local machine, not real-user production Core Web Vitals:

| Route | Status | HTML size | Response time |
| --- | ---: | ---: | ---: |
| `/` | 200 | 65.2 KB | 81 ms |
| `/menu` | 200 | 50.9 KB | 24 ms |
| `/events` | 200 | 32.1 KB | 41 ms |
| `/reservieren` | 200 | 21.4 KB | 24 ms |
| `/admin` | 200 | 17.9 KB | 17 ms |
| `/sitemap.xml` | 200 | 1.3 KB | 9 ms |
| `/llms.txt` | 200 | 1.4 KB | 22 ms |

The production build and TypeScript validation pass. Real Core Web Vitals, caching and geographic latency must be measured on the deployed domain.

## Required before launch

1. Fix the four menu contrast failures.
2. Replace demonstration videos/gallery items and `#` social links with Bailamos-owned destinations.
3. Configure and test the production email sender.
4. Configure `NEXT_PUBLIC_SITE_URL`, production admin secret and optional `OPENAI_API_KEY`.
5. Apply database migration `0008_seo_content.sql` in production.
6. Test one complete reservation and cancellation using real email delivery.
7. Run Lighthouse/Core Web Vitals and physical iPhone/Android checks on the deployed URL.
