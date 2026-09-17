-- ============================================
-- Love Map — приглашение партнёра по коду
-- Выполнить ОДИН раз в Supabase Dashboard → SQL Editor
-- (schema.sql уже содержит эти изменения — для новых проектов этот файл не нужен)
-- ============================================

-- gen_random_bytes — криптостойкий генератор; random() для кодов доступа не годится
create extension if not exists pgcrypto with schema extensions;

-- 8 символов из 32: без 0/O и 1/I, чтобы код не путали при переписывании.
-- 32^8 ≈ 1,1 трлн вариантов — перебором не угадать
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
    -- 256 делится на 32 без остатка, поэтому все символы равновероятны
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end;
$$;

-- у существующих пар код сгенерируется для каждой строки отдельно (default — volatile)
alter table public.couple_info
  add column if not exists invite_code text unique default public.generate_invite_code();
alter table public.couple_info
  alter column invite_code set not null;

-- один пользователь — одна пара (fetchCouple и так рассчитывает на одну строку)
alter table public.couple_members
  add constraint couple_members_user_id_key unique (user_id);

-- раньше можно было вставить себя в ЛЮБУЮ пару, зная её id.
-- теперь напрямую — только в свою только что созданную (setupCouple),
-- а в чужую — только через join_couple с кодом
drop policy if exists "insert own membership" on public.couple_members;
create policy "insert own membership as creator" on public.couple_members
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.couple_info ci
      where ci.id = couple_members.couple_id
        and ci.created_by = auth.uid()
    )
  );

-- security definer: выполняется с правами владельца, иначе RLS не дал бы
-- найти пару по коду тому, кто в ней ещё не состоит
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

  -- for update блокирует строку пары до конца транзакции:
  -- двое, вводящие один код одновременно, не проскочат проверку «не больше двух» оба
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

-- Supabase по умолчанию выдаёт anon право вызывать функции — забираем
revoke execute on function public.join_couple(text) from public, anon;
grant execute on function public.join_couple(text) to authenticated;
