-- New users pick their own categories in the app's onboarding instead of
-- getting every default. Existing users and their categories are untouched.

drop trigger if exists on_auth_user_created_seed_categories on auth.users;
