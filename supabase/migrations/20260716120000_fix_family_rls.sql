-- Drop old policies to ensure idempotency
DROP POLICY IF EXISTS user_family_units ON public.family_units;
DROP POLICY IF EXISTS user_family_members ON public.family_members;
DROP POLICY IF EXISTS insert_family_units ON public.family_units;
DROP POLICY IF EXISTS select_family_units ON public.family_units;
DROP POLICY IF EXISTS update_delete_family_units ON public.family_units;
DROP POLICY IF EXISTS insert_family_members ON public.family_members;
DROP POLICY IF EXISTS select_update_delete_family_members ON public.family_members;

-- 1. Create new policies for family_units
-- Allow inserting family units for any authenticated user
CREATE POLICY insert_family_units ON public.family_units
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow selecting family units for any authenticated user (so they can verify invite codes)
CREATE POLICY select_family_units ON public.family_units
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow update and delete for family units if the user is a member/cocinitas of it
CREATE POLICY update_delete_family_units ON public.family_units
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.family_units.id AND family_members.user_id = auth.uid()
        )
    );

-- 2. Create helper security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_family_member(fid uuid, uid uuid)
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = fid AND family_members.user_id = uid
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Create new policies for family_members
-- Allow inserting family members if user_id matches authenticated user (creation/joining)
CREATE POLICY insert_family_members ON public.family_members
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow SELECT, UPDATE, DELETE for family members if the user belongs to that family
CREATE POLICY select_update_delete_family_members ON public.family_members
    FOR ALL
    USING (
        public.is_family_member(family_id, auth.uid())
    );

