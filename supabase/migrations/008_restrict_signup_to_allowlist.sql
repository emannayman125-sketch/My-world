-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 لحد 007 قبل كده). آمنة تتشغّل أكتر من مرة.
--
-- ده اللي بيضمن إن محدش غير أحمد وإنتِ يقدر يعمل حساب على الموقع، حتى
-- لو حد لقى اللينك بالصدفة. أي إيميل مش في القايمة تحت، التسجيل بيتوقف
-- له من قاعدة البيانات نفسها (مش بس من الواجهة، يعني مينفعش يتلف حواليها).
-- ============================================================

create table if not exists app_allowed_emails (
  email text primary key
);

-- 👇 غيّري السطرين دول بإيميل أحمد وإيميلك إنتِ بالظبط (بحروف صغيرة)،
--    وبعدين شغّلي الملف. أي إيميل تاني تضيفيه بعدين، زوّديه بنفس الشكل:
--    insert into app_allowed_emails (email) values ('someone@example.com') on conflict do nothing;
insert into app_allowed_emails (email) values ('ahmed-email@example.com') on conflict do nothing;
insert into app_allowed_emails (email) values ('eman-email@example.com') on conflict do nothing;

create or replace function public.check_allowed_email()
returns trigger as $$
begin
  if not exists (
    select 1 from app_allowed_emails where lower(email) = lower(new.email)
  ) then
    raise exception 'signup_not_allowed';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists before_auth_user_created_check_email on auth.users;
create trigger before_auth_user_created_check_email
  before insert on auth.users
  for each row execute procedure public.check_allowed_email();
