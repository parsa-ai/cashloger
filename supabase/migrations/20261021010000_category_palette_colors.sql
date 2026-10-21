-- Category colors come from the 64-color OKLCH palette in lib/palette.ts.
-- Safe to run more than once: every existing color is snapped to the
-- vivid palette color with the nearest hue, then the format is enforced.

with palette(hue, color) as (
  values
    (25, 'oklch(0.655 0.22 25)'),
    (45, 'oklch(0.69 0.189 45)'),
    (65, 'oklch(0.725 0.156 65)'),
    (90, 'oklch(0.77 0.151 90)'),
    (120, 'oklch(0.808 0.184 120)'),
    (145, 'oklch(0.773 0.22 145)'),
    (165, 'oklch(0.783 0.158 165)'),
    (185, 'oklch(0.788 0.133 185)'),
    (205, 'oklch(0.77 0.126 205)'),
    (230, 'oklch(0.72 0.138 230)'),
    (255, 'oklch(0.653 0.181 255)'),
    (275, 'oklch(0.578 0.22 275)'),
    (295, 'oklch(0.608 0.22 295)'),
    (315, 'oklch(0.65 0.22 315)'),
    (340, 'oklch(0.678 0.22 340)'),
    (5, 'oklch(0.66 0.22 5)')
),
current_hue as (
  select id,
    case
      when color ~ '^oklch\([0-9. ]{5,30}\)$'
        then split_part(trim(trailing ')' from color), ' ', 3)::numeric
      else case color
      when 'var(--chart-1)' then 25
      when 'var(--chart-2)' then 65
      when 'var(--chart-3)' then 105
      when 'var(--chart-4)' then 130
      when 'var(--chart-5)' then 170
      when 'var(--chart-6)' then 210
      when 'var(--chart-7)' then 250
      when 'var(--chart-8)' then 290
      when 'var(--chart-9)' then 315
      when 'var(--chart-10)' then 345
        else 255
      end
    end as hue
  from public.categories
)
update public.categories c
set color = (
  select p.color from palette p
  order by least(abs(p.hue - h.hue), 360 - abs(p.hue - h.hue))
  limit 1
)
from current_hue h
where h.id = c.id
  and c.color not in (
    'oklch(0.713 0.162 25)',
    'oklch(0.744 0.149 45)',
    'oklch(0.776 0.154 65)',
    'oklch(0.816 0.15 90)',
    'oklch(0.85 0.17 120)',
    'oklch(0.818 0.17 145)',
    'oklch(0.827 0.157 165)',
    'oklch(0.832 0.132 185)',
    'oklch(0.816 0.125 205)',
    'oklch(0.771 0.131 230)',
    'oklch(0.71 0.138 255)',
    'oklch(0.643 0.17 275)',
    'oklch(0.67 0.17 295)',
    'oklch(0.708 0.17 315)',
    'oklch(0.733 0.17 340)',
    'oklch(0.717 0.169 5)',
    'oklch(0.655 0.22 25)',
    'oklch(0.69 0.189 45)',
    'oklch(0.725 0.156 65)',
    'oklch(0.77 0.151 90)',
    'oklch(0.808 0.184 120)',
    'oklch(0.773 0.22 145)',
    'oklch(0.783 0.158 165)',
    'oklch(0.788 0.133 185)',
    'oklch(0.77 0.126 205)',
    'oklch(0.72 0.138 230)',
    'oklch(0.653 0.181 255)',
    'oklch(0.578 0.22 275)',
    'oklch(0.608 0.22 295)',
    'oklch(0.65 0.22 315)',
    'oklch(0.678 0.22 340)',
    'oklch(0.66 0.22 5)',
    'oklch(0.605 0.22 25)',
    'oklch(0.64 0.176 45)',
    'oklch(0.675 0.145 65)',
    'oklch(0.72 0.141 90)',
    'oklch(0.758 0.173 120)',
    'oklch(0.723 0.218 145)',
    'oklch(0.733 0.148 165)',
    'oklch(0.738 0.125 185)',
    'oklch(0.72 0.118 205)',
    'oklch(0.67 0.128 230)',
    'oklch(0.603 0.191 255)',
    'oklch(0.528 0.22 275)',
    'oklch(0.558 0.22 295)',
    'oklch(0.6 0.22 315)',
    'oklch(0.628 0.22 340)',
    'oklch(0.61 0.22 5)',
    'oklch(0.548 0.2 25)',
    'oklch(0.579 0.156 45)',
    'oklch(0.611 0.129 65)',
    'oklch(0.651 0.125 90)',
    'oklch(0.685 0.153 120)',
    'oklch(0.653 0.193 145)',
    'oklch(0.662 0.131 165)',
    'oklch(0.667 0.111 185)',
    'oklch(0.651 0.105 205)',
    'oklch(0.606 0.114 230)',
    'oklch(0.545 0.169 255)',
    'oklch(0.478 0.2 275)',
    'oklch(0.505 0.2 295)',
    'oklch(0.543 0.2 315)',
    'oklch(0.568 0.2 340)',
    'oklch(0.552 0.2 5)'
  );

-- only plain oklch() values, so nothing else can end up in a style attribute
alter table public.categories drop constraint if exists categories_color_format;
alter table public.categories
  add constraint categories_color_format check (color ~ '^oklch\([0-9. ]{5,30}\)$');

create or replace function private.seed_default_categories(target_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.categories (user_id, kind, label, color)
  values
    (target_user, 'cost', 'تفریح', 'oklch(0.725 0.156 65)'),
    (target_user, 'cost', 'قشنگم', 'oklch(0.65 0.22 315)'),
    (target_user, 'cost', 'پوشاک', 'oklch(0.808 0.184 120)'),
    (target_user, 'cost', 'خوراکی', 'oklch(0.783 0.158 165)'),
    (target_user, 'cost', 'پس انداز', 'oklch(0.77 0.126 205)'),
    (target_user, 'cost', 'خونه', 'oklch(0.653 0.181 255)'),
    (target_user, 'cost', 'ماشین', 'oklch(0.608 0.22 295)'),
    (target_user, 'cost', 'حمل و نقل', 'oklch(0.77 0.151 90)'),
    (target_user, 'cost', 'سلامتی', 'oklch(0.678 0.22 340)'),
    (target_user, 'cost', 'سایر', 'oklch(0.655 0.22 25)'),
    (target_user, 'income', 'حقوق', 'oklch(0.773 0.22 145)'),
    (target_user, 'income', 'پاداش', 'oklch(0.77 0.151 90)'),
    (target_user, 'income', 'خانواده', 'oklch(0.678 0.22 340)'),
    (target_user, 'income', 'پارتنر', 'oklch(0.65 0.22 315)'),
    (target_user, 'income', 'فریلنسری', 'oklch(0.653 0.181 255)'),
    (target_user, 'income', 'فروش', 'oklch(0.69 0.189 45)'),
    (target_user, 'income', 'سرمایه‌گذاری', 'oklch(0.788 0.133 185)'),
    (target_user, 'income', 'اجاره', 'oklch(0.578 0.22 275)'),
    (target_user, 'income', 'وام', 'oklch(0.655 0.22 25)'),
    (target_user, 'income', 'یارانه', 'oklch(0.808 0.184 120)')
  on conflict (user_id, kind, label) do nothing;
$$;

revoke execute on function private.seed_default_categories(uuid) from public, anon, authenticated;
