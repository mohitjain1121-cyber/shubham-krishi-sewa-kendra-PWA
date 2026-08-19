-- Redefine get_email_by_mobile RPC to check the profile and return the synthetic auth email
create or replace function public.get_email_by_mobile(mobile_number text)
returns text
security definer
as $$
declare
  clean_mobile text;
  profile_exists boolean;
begin
  -- Normalize mobile number (keep only last 10 digits)
  clean_mobile := regexp_replace(mobile_number, '\D', '', 'g');
  clean_mobile := right(clean_mobile, 10);
  
  -- Check if profile exists in public.profiles
  select exists (
    select 1 from public.profiles where mobile = clean_mobile
  ) into profile_exists;
  
  if profile_exists then
    -- If it's the admin mobile, return the admin email
    if clean_mobile = '9999999999' then
      return 'admin@shubhamkrishisewa.com';
    else
      return 'dealer-' || clean_mobile || '@shubhamkrishisewa.com';
    end if;
  else
    return null;
  end if;
end;
$$ language plpgsql;
