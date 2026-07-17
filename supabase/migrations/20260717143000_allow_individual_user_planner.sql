-- Database migration to support individual user planner data (no family unit required)

-- 1. Allow family_id to be NULL
alter table public.meal_plans alter column family_id drop not null;

-- 2. Add user_id column referencing profiles
alter table public.meal_plans add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- 3. Clean up any invalid or orphaned rows that belong to neither a family nor a user
delete from public.meal_plans where family_id is null and user_id is null;

-- 4. Drop old unique constraint if it exists
alter table public.meal_plans drop constraint if exists meal_plans_family_id_day_key;

-- 4. Re-add unique constraints
-- Enforce a unique day slot per family unit
alter table public.meal_plans add constraint meal_plans_family_id_day_key unique (family_id, day);

-- Enforce a unique day slot per individual user
alter table public.meal_plans add constraint meal_plans_user_id_day_key unique (user_id, day);

-- 5. Add validation constraint: either family_id is set OR user_id is set (but not both and not neither)
alter table public.meal_plans drop constraint if exists meal_plans_target_check;
alter table public.meal_plans add constraint meal_plans_target_check check (
  (family_id is not null and user_id is null) or
  (family_id is null and user_id is not null)
);
