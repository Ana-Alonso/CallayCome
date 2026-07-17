-- Drop the recursive policy on family_members
DROP POLICY IF EXISTS user_family_members ON public.family_members;

-- Create a non-recursive select policy for family_members:
-- Any authenticated user can read family memberships to resolve names and roles.
CREATE POLICY select_family_members ON public.family_members
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Create a non-recursive write policy for family_members:
-- Users can only join/insert/modify memberships if they are authenticated.
CREATE POLICY write_family_members ON public.family_members
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
