-- ============================================
-- Love Map — Supabase schema (Этап 1)
-- Выполнить целиком в Supabase Dashboard → SQL Editor
-- ============================================

create extension if not exists pgcrypto with schema extensions;

-- код приглашения: 8 символов без 0/O и 1/I, криптостойкий генератор
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(8);
  result text := '';
begin
  for i in 0..7 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end;
$$;

-- ============================================
-- Tables
-- ============================================

create table couple_info (
  id uuid primary key default gen_random_uuid(),
  partner_1 text not null,
  partner_2 text not null,
  start_date date not null,
  invite_code text not null unique default public.generate_invite_code(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table couple_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid not null references couple_info(id) on delete cascade,
  primary key (user_id, couple_id),
  -- один пользователь — одна пара
  constraint couple_members_user_id_key unique (user_id)
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couple_info(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  category text not null check (category in ('date','travel','food','concert','home','adventure','milestone')),
  emoji text,
  lat float8 not null,
  lng float8 not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  url text not null,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================
-- updated_at trigger for memories
-- ============================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger memories_set_updated_at
  before update on memories
  for each row execute function set_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

alter table couple_info enable row level security;
alter table couple_members enable row level security;
alter table memories enable row level security;
alter table memory_photos enable row level security;

-- couple_members: пользователь видит только свою запись членства
create policy "select own membership" on couple_members
  for select using (auth.uid() = user_id);

-- напрямую вставить себя можно только в свою созданную пару (setupCouple);
-- в чужую — только через join_couple с кодом
create policy "insert own membership as creator" on couple_members
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from couple_info ci
      where ci.id = couple_members.couple_id
        and ci.created_by = auth.uid()
    )
  );

-- couple_info: видно/редактируемо только участникам этой пары
create policy "select own couple" on couple_info
  for select using (
    -- created_by нужен для insert().select() в setupCouple: couple_members ещё пуст
    created_by = auth.uid()
    or exists (
      select 1 from couple_members
      where couple_members.couple_id = couple_info.id
        and couple_members.user_id = auth.uid()
    )
  );

create policy "insert own couple" on couple_info
  for insert with check (auth.uid() = created_by);

create policy "update own couple" on couple_info
  for update using (
    exists (
      select 1 from couple_members
      where couple_members.couple_id = couple_info.id
        and couple_members.user_id = auth.uid()
    )
  );

-- memories: только участники пары
create policy "select own memories" on memories
  for select using (
    exists (
      select 1 from couple_members
      where couple_members.couple_id = memories.couple_id
        and couple_members.user_id = auth.uid()
    )
  );

create policy "insert own memories" on memories
  for insert with check (
    exists (
      select 1 from couple_members
      where couple_members.couple_id = memories.couple_id
        and couple_members.user_id = auth.uid()
    )
  );

create policy "update own memories" on memories
  for update using (
    exists (
      select 1 from couple_members
      where couple_members.couple_id = memories.couple_id
        and couple_members.user_id = auth.uid()
    )
  );

create policy "delete own memories" on memories
  for delete using (
    exists (
      select 1 from couple_members
      where couple_members.couple_id = memories.couple_id
        and couple_members.user_id = auth.uid()
    )
  );

-- memory_photos: только участники пары, которой принадлежит memory
create policy "select own memory photos" on memory_photos
  for select using (
    exists (
      select 1 from memories
      join couple_members on couple_members.couple_id = memories.couple_id
      where memories.id = memory_photos.memory_id
        and couple_members.user_id = auth.uid()
    )
  );

create policy "insert own memory photos" on memory_photos
  for insert with check (
    exists (
      select 1 from memories
      join couple_members on couple_members.couple_id = memories.couple_id
      where memories.id = memory_photos.memory_id
        and couple_members.user_id = auth.uid()
    )
  );

create policy "delete own memory photos" on memory_photos
  for delete using (
    exists (
      select 1 from memories
      join couple_members on couple_members.couple_id = memories.couple_id
      where memories.id = memory_photos.memory_id
        and couple_members.user_id = auth.uid()
    )
  );

-- ============================================
-- Присоединение к паре по коду
-- ============================================

-- security definer: RLS не дал бы найти пару по коду тому, кто в ней ещё не состоит
create or replace function public.join_couple(code text)
returns public.couple_info
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target public.couple_info;
  member_count int;
begin
  if current_user_id is null then
    raise exception 'Нужно войти в аккаунт';
  end if;

  if exists (select 1 from public.couple_members where user_id = current_user_id) then
    raise exception 'Ты уже состоишь в паре';
  end if;

  -- for update: двое с одним кодом одновременно не проскочат проверку «не больше двух»
  select * into target
  from public.couple_info
  where invite_code = upper(trim(code))
  for update;

  if not found then
    raise exception 'Пара с таким кодом не найдена';
  end if;

  select count(*) into member_count
  from public.couple_members
  where couple_id = target.id;

  if member_count >= 2 then
    raise exception 'В этой паре уже двое';
  end if;

  insert into public.couple_members (user_id, couple_id)
  values (current_user_id, target.id);

  return target;
end;
$$;

revoke execute on function public.join_couple(text) from public, anon;
grant execute on function public.join_couple(text) to authenticated;

-- ============================================
-- Storage: bucket "photos" (public)
-- ============================================

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Путь файла: memories/{memoryId}/{uuid}.jpg — доступ только к воспоминаниям своей пары
create or replace function public.is_own_memory_path(object_name text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select (storage.foldername(object_name))[1] = 'memories'
    and exists (
      select 1
      from public.memories m
      join public.couple_members cm on cm.couple_id = m.couple_id
      where m.id::text = (storage.foldername(object_name))[2]
        and cm.user_id = auth.uid()
    );
$$;

-- select нужен для remove(); показ фото идёт через публичные URL и политик не требует
create policy "couple read own photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photos' and public.is_own_memory_path(name));

create policy "couple upload own photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos' and public.is_own_memory_path(name));

create policy "couple delete own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos' and public.is_own_memory_path(name));
