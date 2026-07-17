-- Database migration to fix RLS policies for individual user mode (allow access when user_id = auth.uid())

-- 1. Redefine RLS Policy for 'pantry'
drop policy if exists user_pantry_access on public.pantry;
create policy user_pantry_access on public.pantry
    for all
    using (
        (user_id = auth.uid()) or
        exists (
            select 1 from public.family_members
            where family_members.family_id = public.pantry.family_id and family_members.user_id = auth.uid()
        )
    )
    with check (
        (user_id = auth.uid()) or
        exists (
            select 1 from public.family_members
            where family_members.family_id = public.pantry.family_id and family_members.user_id = auth.uid()
        )
    );

-- 2. Redefine RLS Policy for 'shopping_list'
drop policy if exists user_shopping_list_access on public.shopping_list;
create policy user_shopping_list_access on public.shopping_list
    for all
    using (
        (user_id = auth.uid()) or
        exists (
            select 1 from public.family_members
            where family_members.family_id = public.shopping_list.family_id and family_members.user_id = auth.uid()
        )
    )
    with check (
        (user_id = auth.uid()) or
        exists (
            select 1 from public.family_members
            where family_members.family_id = public.shopping_list.family_id and family_members.user_id = auth.uid()
        )
    );

-- 3. Redefine RLS Policy for 'meal_plans'
drop policy if exists user_meal_plans_access on public.meal_plans;
create policy user_meal_plans_access on public.meal_plans
    for all
    using (
        (user_id = auth.uid()) or
        exists (
            select 1 from public.family_members
            where family_members.family_id = public.meal_plans.family_id and family_members.user_id = auth.uid()
        )
    )
    with check (
        (user_id = auth.uid()) or
        exists (
            select 1 from public.family_members
            where family_members.family_id = public.meal_plans.family_id and family_members.user_id = auth.uid()
        )
    );
