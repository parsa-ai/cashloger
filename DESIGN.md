# Cashlog design system

The look borrows from iOS Settings and Telegram: flat grouped surfaces, thin separators, one accent color,
and motion that is fast and quiet. Tokens live in `app/globals.css`; shared pieces in `components/ui` and
`components/web/Group.tsx`.

## Surfaces

| Token | Use |
| --- | --- |
| `bg-background` | Page and sheet background (iOS "grouped" gray / near black) |
| `bg-card` | Grouped lists, cards — always flat, never a shadow or gradient |
| `bg-fill` / `bg-fill-strong` | Inputs, segmented controls, pressed rows, empty tiles |
| `bg-tint` + `text-primary` | Tinted buttons and selected chips |
| `border-separator` | Hairline separators inside groups, inset to the text column |

Shadows: only `shadow-float` and the soft shadow built into `glass`, and only on things that float above content.
Gradients: none, except the fade under the status bar that keeps scrolled content readable.

## Chrome (floating glass)

The header and tab bar float above the page as `glass` capsules (translucent, blurred, with a light top
edge), 16px in from the screen sides and clear of the safe areas, like Telegram on iOS.

- Header: user blob (or back button) on the right, title capsule in the middle, connection pill on the left.
  Offline, the pill says «آفلاین» and the user's blob closes its eyes (`sleepy`).
- Tab bar: full-round capsule whose selection pill can be dragged, with the `+` as a matching glass circle on
  its right. Swiping the page sideways also changes tab.
- Toasts are glass pills above the tab bar; destructive or quick actions offer "برگرداندن" (undo) there.
- Pages switch on the client (`navigate` / `NavLink` in `lib/nav.ts`, views in `AppViews`): no server round
  trip, so a tab changes the moment it's tapped and works offline. Never use `next/link` or `router.push`
  between app pages.

## Sheets

- Nav bar: confirm («ذخیره») on the right, title in the middle, «انصراف» on the left in muted text.
- Transaction sheet reads top to bottom by importance: kind → amount (hero, with the amount in words under it)
  → category wheel (3 rows, blob icons) → date / note → numpad.

## Shape and spacing

| Radius | Use |
| --- | --- |
| `rounded-md` (8) | Icon tiles, small chips |
| `rounded-lg` (10) | Buttons, inputs, segmented control |
| `rounded-xl` (12) | Groups and cards |
| `rounded-2xl` (14) | Top of sheets |
| `rounded-full` | Avatars, pills, FAB |

4px grid. Page gutter 16px. Space between groups 24px. Rows are at least 44px tall with 16px side padding.
Group headers sit 16px in from the group edge.

## Type (Vazirmatn)

| Role | Style |
| --- | --- |
| Large number | 34px / bold, tabular |
| Navigation title | 17px / semibold |
| Row title | 15px / regular |
| Secondary / footer | 13px / muted |
| Caption | 11–12px / muted |

Money always uses `.num` (tabular digits) so it doesn't jitter while counting.

## Color

- One accent per theme (`--primary`), used for actions, selection and links — not decoration.
- Income is `text-success`; costs stay in the foreground color (red is for destructive actions only).
- New categories pick from 12 `SWATCHES` in `lib/palette.ts`. Older categories may hold any color from the
  full 64-color palette; those are kept as they are and shown first in the picker.

## Avatars

Blobatar is the app's mascot. The user's blob is seeded from their username (email until they pick one) and is
the same everywhere: header, profile, empty states, install prompt, password field. The login screen uses a
fixed mascot blob that watches the password caret (`components/ui/password-field.tsx`).
Each category gets a blob face on a circle of its color (`CategoryAvatar`). Empty states use a blob with an
expression.

## Motion

| Name | Duration | Use |
| --- | --- | --- |
| `animate-slide-next` / `prev` | 320ms | Moving between tabs, from the side the new tab sits on |
| `animate-page-in` | 180ms fade | First load |
| `animate-rise-in` | 260ms | Content appearing for the first time |
| `animate-sheet-in` / `out` | 420 / 240ms | Bottom sheets (`--ease-ios`) |
| `animate-toast-in` / `out` | 320 / 180ms | Toasts |
| `press` / `press-row` / `press-scale` | instant down, 160–260ms up | Touch feedback |

Rules: no overshoot or bounce on layout, no staggered lists, no width/height animation, and nothing
re-animates when data refreshes in the background. Everything respects `prefers-reduced-motion`.
