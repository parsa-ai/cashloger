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

Shadows: only `shadow-float`, and only on things that float above content (toast, FAB, popover).
Gradients: none.

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
- Category colors come from the 64-color palette in `lib/palette.ts`: 16 hues × 4 tones, every color at
  nearly the most chroma its hue allows in sRGB, so they read as one family.

## Avatars

Blobatar is the app's mascot. The user's blob is in the header, the profile and the install prompt.
Each category gets a blob face on a circle of its color (`CategoryAvatar`). Empty states use a blob with an
expression.

## Motion

| Name | Duration | Use |
| --- | --- | --- |
| `animate-page-in` | 180ms fade | Route change (opacity only — never transform the page) |
| `animate-rise-in` | 260ms | Content appearing for the first time |
| `animate-sheet-in` / `out` | 420 / 240ms | Bottom sheets (`--ease-ios`) |
| `animate-toast-in` / `out` | 320 / 180ms | Toasts |
| `press` / `press-row` / `press-scale` | instant down, 160–260ms up | Touch feedback |

Rules: no overshoot or bounce on layout, no staggered lists, no width/height animation, and nothing
re-animates when data refreshes in the background. Everything respects `prefers-reduced-motion`.
