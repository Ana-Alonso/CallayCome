-- Fix family_notifications RLS policies to allow inserting notifications for family members

-- 1. Drop the restrictive all-in-one policy
DROP POLICY IF EXISTS user_family_notifications_access ON public.family_notifications;

-- 2. Create policy for SELECT, UPDATE, DELETE (only recipient can view or modify their notifications)
CREATE POLICY user_family_notifications_select_update_delete ON public.family_notifications
    FOR ALL
    USING (auth.uid() = recipient_user_id);

-- 3. Create policy for INSERT (any member of the same family unit can insert a notification for another member)
CREATE POLICY user_family_notifications_insert ON public.family_notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members AS self
            JOIN public.family_members AS other ON self.family_id = other.family_id
            WHERE self.user_id = auth.uid() AND other.user_id = recipient_user_id
        )
    );
