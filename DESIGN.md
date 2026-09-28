# Design system — "Lantern Night"

One warm accent, used once per screen. Everything else is calm.

## Tokens (defined once in `tailwind.config.js`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` / `night` | `#F7F3E8` | `#0F2420` | page background |
| `paper-card` / `night-card` | `#FFFFFF` | `#132A26` | raised surfaces |
| `ink` / `moon` | `#17281F` | `#F7EFDD` | primary text |
| `ink-muted` / `moon-muted` | `#5C6F65` | `#9FB8AC` | secondary text |
| `lantern` (+ `lantern-ink`) | `#C6832A` (text on it: `#2B1F08`) | same | **the one accent** |
| `sage` / `sage-soft` | `#4F7A63` | `#8FAE9A` | calm: completed, active, links, focus |
| `clay` | `#B5624A` | | rare warmth (Business hub) |
| `dusk` | `#6256A8` | | Hamzawi's own identity only |
| `hairline` | `#E7E0D0` | `#1B332D` | borders |

Radii: `rounded-card` (20px) for primary cards, `rounded-chip` (14px) for small stat chips.
Light mode is always the default; dark only after Ahmed switches (ThemeProvider).

## The rule

`lantern` is reserved for the single most important thing on a screen:
the primary submit/CTA button, the "what matters now" card, the progress ring.

Do **not** use it for: active nav/tab states (use `ink` underline / `sage` tint),
icon tints, links (`sage`), focus borders (`sage`), progress fills and done
checkboxes (`sage`), selected pills (`ink` fill), hover text (`ink`/`moon`).

If a screen has two lantern things, one of them is wrong.

## Home hierarchy

greeting → how the day is going (ring + summary) → **what matters now** (the one
lantern card) → up to 3 glance chips (only ones with data) → today's list →
everything else in one quiet stack. Empty cards are never rendered.

## i18n

Dictionary values must be plain strings (a function value once crashed every page
via RSC). Interpolate in the component: `d.doneOfTotal.replace("{done}", n)`.

## Exceptions to the one-lantern rule

- **Hamzawi** is the only thing allowed to use `dusk` (indigo). It appears in the
  mobile bottom nav's centre button and on the Hamzawi/Daily Brief/Onboarding
  surfaces. It never competes with `lantern` because they live in different places.
- The welcome letter and birthday flow are one-off ceremonial screens; they use the
  serif letter font and their own pacing instead of the normal Home hierarchy.

## Privacy rules for AI features

- Anything sent to Gemini is limited to task titles, event titles, habit names and
  order item labels. Journal entries and third-party names (customers, contacts)
  are never sent.
- AI output is always a *suggestion*: Ahmed reviews and approves before anything is
  saved (onboarding proposal, Daily Brief actions).
