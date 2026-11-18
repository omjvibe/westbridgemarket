# Westbridge Market - Investment & Trading Platform

A modern, full-stack investment and trading platform built with Next.js 16 and Supabase.

## Features

### Public Features
- Modern landing pages (Home, About, Services, FAQ, Contact)
- Real-time market ticker
- Investment plan showcase
- TradingView integration
- Blog/news section
- Responsive design with light/dark mode

### User Dashboard
- Portfolio overview with balance tracking
- Trading interface with real-time data
- Investment management
- Crypto deposits (BTC, ETH, USDT, SOL)
- Copy trading system
- Signal subscriptions
- Account settings
- Notification center

### Admin Dashboard
- Comprehensive user management
- Balance and permission controls
- Deposit/withdrawal approval system
- Investment and trade monitoring
- KYC verification system
- Support ticket management
- Blog content management
- System settings configuration

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Type Safety**: TypeScript
- **State Management**: React Server Components + SWR

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (already configured via Supabase integration)

4. Run database migrations:
   - Navigate to the scripts folder
   - Execute SQL scripts in order (001, 002, 003, 004)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The platform uses a comprehensive database schema with:
- User management (auth integration)
- Investment plans and user investments
- Trading system with positions tracking
- Transaction management (deposits/withdrawals)
- Copy trading and signal providers
- KYC document storage
- Support ticket system
- Notifications
- Blog/content management

All tables are protected with Row Level Security (RLS) policies.

## Authentication

- **User Login**: `/auth/login`
- **User Signup**: `/auth/signup`
- **Admin Login**: `/admin/login`

## Key Routes

### Public
- `/` - Home page
- `/about` - About us
- `/services` - Services
- `/faq` - FAQ
- `/contact` - Contact

### User Dashboard
- `/dashboard` - Overview
- `/dashboard/trade` - Trading
- `/dashboard/portfolio` - Investments
- `/dashboard/deposits` - Make deposits
- `/dashboard/copy-trading` - Copy experts
- `/dashboard/signals` - Trading signals
- `/dashboard/settings` - Account settings

### Admin Panel
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/users/[id]` - Edit user
- `/admin/investments` - Investment management
- `/admin/trades` - Trade monitoring
- `/admin/deposits` - Deposit approvals
- `/admin/withdrawals` - Withdrawal approvals
- `/admin/kyc` - KYC verification
- `/admin/support` - Support tickets
- `/admin/settings` - System settings

## Security Features

- Row Level Security (RLS) on all tables
- Admin-only routes protected by middleware
- Secure password hashing
- Email verification for new accounts
- Trading restrictions until account activation
- Withdrawal codes for additional security

## Production Deployment

This platform is production-ready and can be deployed to Vercel:

1. Push to GitHub repository
2. Import to Vercel
3. Supabase integration is already configured
4. Deploy

## License

Proprietary - All rights reserved

## Production Setup Instructions

To get Westbridge Market up and running in a production environment, follow these steps:

### 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the `scripts/unified_setup.sql` file from this repository.
4. Copy the entire content and paste it into a new query in Supabase.
5. Run the query. This will set up all tables, enums, triggers, RLS policies, and storage buckets.

### 2. Environment Variables
1. Copy the `.env.example` file to a new file named `.env`.
2. Fill in the required values:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `RESEND_API_KEY`: Your API key from [Resend](https://resend.com).
   - `NEXT_PUBLIC_APP_URL`: Your application's URL.
   - `ADMIN_PIN_CODE`: A secure 6-digit PIN for admin actions.

### 3. Admin Account Setup
1. Sign up for a regular account on your live platform (at `/auth/signup`).
2. Once registered, go to the **SQL Editor** in Supabase.
3. Run the following command to promote your account to admin:
   ```sql
   INSERT INTO public.admin_users (id, full_name, email, role, permissions)
   SELECT id, full_name, email, 'admin', '{"all": true}'::jsonb
   FROM public.users
   WHERE email = 'your-admin-email@example.com';
   ```
4. You can now access the admin panel at `/admin`.

### 4. Authentication Providers & Security
- **Google Auth**: 
  1. Go to **Authentication > Providers > Google** in Supabase.
  2. Enable Google.
  3. Enter your Client ID and Client Secret (obtained from Google Cloud Console).
  4. Ensure the Redirect URL is set to `https://your-project.supabase.co/auth/v1/callback`.
- **hCaptcha Protection**: 
  1. Go to **Authentication > Settings > Security**.
  2. Enable hCaptcha protection.
  3. Enter the Site Key and Secret Key provided in `.env`.
- **Web3/MetaMask**: The UI is prepared; full Web3 integration requires a custom backend function or edge function for wallet signing.

### 5. Smartsupp Integration
- The live chat is pre-configured with the production key. To change it, update `components/smartsupp-chat.tsx`.

### 6. Deployment (Vercel)
1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com).
3. Add all the environment variables from your `.env` file to the Vercel project settings.
4. Deploy!

### 7. Email Verification (Supabase)
1. In Supabase Dashboard, go to **Authentication > Email Templates**.
2. Update the templates using the high-fidelity branded HTML provided in `docs/EMAIL_TEMPLATES.md`.
3. Ensure you have verified your domain in the Resend dashboard.

---
© 2026 Westbridge Market. All rights reserved.
