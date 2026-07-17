-- Database migration to support individual user pantry and shopping lists

-- 1. Allow family_id to be NULL in pantry and shopping_list
alter table public.pantry alter column family_id drop not null;
alter table public.shopping_list alter column family_id drop not null;

-- 2. Add user_id column referencing profiles
alter table public.pantry add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.shopping_list add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- 3. Clean up any invalid or orphaned rows that belong to neither a family nor a user
delete from public.pantry where family_id is null and user_id is null;
delete from public.shopping_list where family_id is null and user_id is null;

-- 4. Add validation constraints: either family_id is set OR user_id is set (but not both and not neither)
alter table public.pantry drop constraint if exists pantry_target_check;
alter table public.pantry add constraint pantry_target_check check (
  (family_id is not null and user_id is null) or
  (family_id is null and user_id is not null)
);

alter table public.shopping_list drop constraint if exists shopping_list_target_check;
alter table public.shopping_list add constraint shopping_list_target_check check (
  (family_id is not null and user_id is null) or
  (family_id is null and user_id is not null)
);
