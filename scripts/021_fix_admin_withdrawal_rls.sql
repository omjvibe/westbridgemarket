-- ============================================================
-- 021: Fix Admin RLS Policies for Withdrawals
-- Adds missing UPDATE/SELECT policies so admins can
-- approve/reject withdrawals and update user balances.
-- ============================================================

-- Admin can SELECT all transactions (needed to list all withdrawals)
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Admin can UPDATE transactions (needed to approve/reject)
CREATE POLICY "Admins can update transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Admin can SELECT all users (needed to view balances in withdrawal list)
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Admin can UPDATE all users (needed to deduct balance on approval)
CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Admin can INSERT notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);
