-- Category colors now come from the 64-color OKLCH palette (lib/palette.ts)
-- instead of theme chart variables.

update public.categories
set color = case color
  when 'var(--chart-1)'  then 'oklch(0.65 0.18 25)'
  when 'var(--chart-2)'  then 'oklch(0.65 0.18 65)'
  when 'var(--chart-3)'  then 'oklch(0.65 0.18 105)'
  when 'var(--chart-4)'  then 'oklch(0.65 0.18 130)'
  when 'var(--chart-5)'  then 'oklch(0.65 0.18 170)'
  when 'var(--chart-6)'  then 'oklch(0.65 0.18 210)'
  when 'var(--chart-7)'  then 'oklch(0.65 0.18 250)'
  when 'var(--chart-8)'  then 'oklch(0.65 0.18 290)'
  when 'var(--chart-9)'  then 'oklch(0.65 0.18 315)'
  when 'var(--chart-10)' then 'oklch(0.65 0.18 345)'
  else 'oklch(0.65 0.18 230)'
end
where color !~ '^oklch\([0-9. ]{5,30}\)$';

-- only plain oklch() values, so nothing else can end up in a style attribute
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
    (target_user, 'cost', 'تفریح',       'oklch(0.65 0.18 65)'),
    (target_user, 'cost', 'قشنگم',       'oklch(0.65 0.18 315)'),
    (target_user, 'cost', 'پوشاک',       'oklch(0.65 0.18 130)'),
    (target_user, 'cost', 'خوراکی',      'oklch(0.65 0.18 170)'),
    (target_user, 'cost', 'پس انداز',    'oklch(0.65 0.18 210)'),
    (target_user, 'cost', 'خونه',        'oklch(0.65 0.18 250)'),
    (target_user, 'cost', 'ماشین',       'oklch(0.65 0.18 290)'),
    (target_user, 'cost', 'حمل و نقل',   'oklch(0.65 0.18 105)'),
    (target_user, 'cost', 'سلامتی',      'oklch(0.65 0.18 345)'),
    (target_user, 'cost', 'سایر',        'oklch(0.65 0.18 25)'),
    (target_user, 'income', 'حقوق',          'oklch(0.65 0.18 150)'),
    (target_user, 'income', 'پاداش',         'oklch(0.65 0.18 85)'),
    (target_user, 'income', 'خانواده',       'oklch(0.65 0.18 345)'),
    (target_user, 'income', 'پارتنر',        'oklch(0.65 0.18 315)'),
    (target_user, 'income', 'فریلنسری',      'oklch(0.65 0.18 250)'),
    (target_user, 'income', 'فروش',          'oklch(0.65 0.18 45)'),
    (target_user, 'income', 'سرمایه‌گذاری',  'oklch(0.65 0.18 190)'),
    (target_user, 'income', 'اجاره',         'oklch(0.65 0.18 270)'),
    (target_user, 'income', 'وام',           'oklch(0.65 0.18 25)'),
    (target_user, 'income', 'یارانه',        'oklch(0.65 0.18 130)')
  on conflict (user_id, kind, label) do nothing;
$$;

revoke execute on function private.seed_default_categories(uuid) from public, anon, authenticated;
