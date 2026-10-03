# Home page redesign plan

Branch: `design/home-carousel`. Nothing goes live until it is merged and deployed.

## Goal

The home page should feel alive and always show what is new: new events, new dishes and news. Booking moves to the end of the page as its own section, so visitors first get a feel for the place and then reserve.

## New page order

1. **Header**: unchanged (logo, menu, language, "Reservieren" button stays visible in the header).
2. **Highlight carousel**: full-width, large photos that slide automatically.
   - Slides are built automatically from the admin data, so there is no extra work:
     - **published events** (image, date, title, "Mehr erfahren"),
     - **dishes marked "featured"** in the menu (photo, name, price, "Zur Speisekarte"),
     - optional **news slides** (e.g. "Jetzt geöffnet", "Neue Cocktailkarte"), edited in the admin under Content.
   - Changes every ~6 s, with a slow image zoom (Ken Burns) and a smooth fade.
   - Arrows, dots, swipe on mobile; pauses on hover/touch; stops when the user prefers reduced motion.
   - Small label on each slide: "NEUES EVENT", "NEUES GERICHT", "NEU".
3. **Short welcome**: one sentence about Bailamos plus 2 photos (the current "Die Bailamos Art" section, shortened).
4. **Signature dishes**: 3 featured dishes with photo and price → "Ganze Speisekarte".
5. **Events**: upcoming published events as cards → "Alle Events".
6. **Atmosphere / Instagram**: horizontally scrolling photo strip (the existing story rail), with real photos once available.
7. **Reserve a table (moved to the bottom)**: a large, calm section with a photo of a table, short text, quick picks (date, guests) and the button "Verfügbarkeit prüfen" → /reservieren.
8. **Contact & opening hours + footer**: as now.

## What stays the same

Colours (deep green, warm gold, cream), fonts, logo, DE/EN, the booking flow on /reservieren, the admin.

## Technical notes

- Carousel = one small client component; no new library, CSS transitions only. Images use `next/image` with proper sizes so mobile loads fast.
- Data comes from the existing `marketing_content` (events, new optional `highlights` list) and `menu_content` (`featured` dishes). The admin gets a small "Highlights" editor for the news slides.
- If there are no events/featured dishes, the carousel falls back to the hero photo, so the page never looks empty.
- Accessible: keyboard arrows, pause button, `aria-live` off during autoplay, readable contrast on photos.
- Opening mode stays: while "opening soon" is on, visitors still only see /opening. The new home page can be previewed locally and on the test address before the opening mode is switched off.

## Needed from the owner

- Real photos: dishes (at least 3 signature dishes), interior, terrace, cocktails. Current images are placeholders.
- The real menu with which dishes are "featured".
- First events and news for the carousel.
