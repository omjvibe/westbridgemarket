# How to Promote a User to Admin

To grant a user Admin access to Westbridge Market, you can follow either of the two methods below.

---

## Method 1: Using the Supabase SQL Editor (Recommended)

1. Go to your **Supabase Dashboard**.
2. Select your project.
3. Open the **SQL Editor** from the left navigation panel.
4. Paste the following SQL snippet, replace `USER_UUID_HERE` with the actual User's ID (which you can find in the `auth.users` or `public.users` table), and run it:

```sql
-- 1. Insert/Update the user in the admin_users table
INSERT INTO public.admin_users (id, full_name, email, role)
SELECT 
    id, 
    full_name, 
    email, 
    'admin'
FROM public.users
WHERE id = 'USER_UUID_HERE'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 2. Update their role in the public.users table as well
UPDATE public.users 
SET role = 'admin' 
WHERE id = 'USER_UUID_HERE';
```

---

## Method 2: During User Registration (Developer / Local seeding)

If you are signing up a user locally or programmatically using the Supabase Client SDK, you can specify the `role` in the `raw_user_meta_data` field. The database trigger `handle_new_admin` will automatically populate the `admin_users` table.

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'admin@westbridgemarket.app',
  password: 'securepassword123',
  options: {
    data: {
      full_name: 'System Admin',
      role: 'admin', // This triggers the automatic admin profile setup
    }
  }
})
```
