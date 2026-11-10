-- TANORA MPANDRESY IAVOLOHA — schéma Supabase
-- Peut être exécuté plusieurs fois sans erreur (SQL Editor > New query > Run)

create table if not exists admins(id uuid primary key default gen_random_uuid(),username text unique not null,auth_user_id uuid unique references auth.users(id) on delete cascade,created_at timestamptz default now());
create table if not exists boxes(id uuid primary key,name text not null,description text,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists transactions(id uuid primary key,box_id uuid not null references boxes(id) on delete cascade,transaction_date date not null,type text not null check(type in('income','expense')),amount numeric(14,0) not null check(amount>0),reason text not null,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists members(id uuid primary key,full_name text not null,phone text,registration_date date,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists app_settings(id uuid primary key default gen_random_uuid(),setting_key text unique not null,setting_value text,updated_at timestamptz default now());
create index if not exists tx_box_date on transactions(box_id,transaction_date);
create index if not exists members_name on members(full_name);

create or replace function is_admin() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from admins where auth_user_id=auth.uid())$$;

alter table admins enable row level security;
alter table boxes enable row level security;
alter table transactions enable row level security;
alter table members enable row level security;
alter table app_settings enable row level security;

-- Lecture publique (mode membre) ; écriture réservée aux administrateurs
do $$
declare t text;
begin
  foreach t in array array['boxes','transactions','members','app_settings'] loop
    execute format('drop policy if exists r on %I',t);
    execute format('drop policy if exists w on %I',t);
    execute format('create policy r on %I for select using(true)',t);
    execute format('create policy w on %I for all to authenticated using(is_admin()) with check(is_admin())',t);
  end loop;
end $$;
drop policy if exists r on admins;
create policy r on admins for select to authenticated using(is_admin());

-- ÉTAPE ADMIN (à faire APRÈS avoir créé l'utilisateur dans Authentication > Users)
-- Remplacez les deux occurrences ci-dessous par VOTRE email, puis exécutez seulement cette commande :
-- insert into admins(username,auth_user_id) select 'admin',id from auth.users where email='VOTRE_EMAIL' on conflict (username) do update set auth_user_id=excluded.auth_user_id;
