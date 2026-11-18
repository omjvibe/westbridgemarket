-- ============================================================
-- 022: Admin User Deletion RLS & Stored Procedure
-- Allows administrators to delete user accounts completely.
-- ============================================================

-- Policy allowing admins to delete records from public.users
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
ON public.users FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Security Definer function to delete user from both public.users and auth.users
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Check if calling user is an authorized admin
    IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Administrator privileges required';
    END IF;

    -- Prevent admin from deleting themselves via this function
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Self-deletion is not permitted via admin tool';
    END IF;

    -- Delete from public.users (cascades to related user tables)
    DELETE FROM public.users WHERE id = target_user_id;

    -- Delete from auth.users (cascades to public.users if still present)
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;
