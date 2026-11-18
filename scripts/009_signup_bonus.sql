-- Update user trigger function to grant $10 signup bonus automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_referral_code TEXT;
    ref_user_id UUID := NULL;
BEGIN
    -- Generate a unique referral code
    new_referral_code := upper(substring(md5(random()::text || NEW.id::text) from 1 for 8));
    
    -- Safely handle referred_by - only set if valid
    IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL 
       AND NEW.raw_user_meta_data->>'referred_by' != '' 
       AND NEW.raw_user_meta_data->>'referred_by' != 'null' THEN
        BEGIN
            ref_user_id := (NEW.raw_user_meta_data->>'referred_by')::UUID;
            -- Verify the referrer exists
            IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = ref_user_id) THEN
                ref_user_id := NULL;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            ref_user_id := NULL;
        END;
    END IF;

    -- Insert the new user with safe defaults ($10 Sign Up Bonus)
    INSERT INTO public.users (
        id,
        full_name,
        email,
        phone_number,
        country,
        currency,
        referral_code,
        referred_by,
        role,
        account_status,
        kyc_status,
        balance_deposit,
        balance_profit,
        balance_bonus, -- Default changed from 0.00 to 10.00 for signup bonus
        can_trade,
        can_withdraw,
        required_trades,
        completed_trades,
        current_plan,
        is_signal_provider,
        is_copy_expert
    )
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'User'),
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'country', ''), 'US'),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'currency', ''), 'USD'),
        new_referral_code,
        ref_user_id,
        'user',
        'active',
        'pending',
        0.00,
        0.00,
        10.00, -- Default changed from 0.00 to 10.00 for signup bonus
        false,
        false,
        10,
        0,
        'basic',
        false,
        false
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
