-- ============================================
-- Love Map — политики Storage только для своей пары
-- Выполнить ОДИН раз в Supabase Dashboard → SQL Editor
-- (schema.sql уже содержит эти политики — для новых проектов этот файл не нужен)
-- ============================================

-- Путь файла: memories/{memoryId}/{uuid}.jpg
-- storage.foldername('memories/abc/x.jpg') → {memories, abc}
-- Функция проверяет, что memoryId из пути — воспоминание пары текущего пользователя.
-- security invoker (по умолчанию): подзапрос выполняется с правами пользователя,
-- поэтому RLS таблиц memories и couple_members тоже работают.
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
      -- сравниваем текстом: каст пути в uuid упал бы с ошибкой на кривом пути
      where m.id::text = (storage.foldername(object_name))[2]
        and cm.user_id = auth.uid()
    );
$$;

drop policy if exists "public read photos" on storage.objects;
drop policy if exists "authenticated upload photos" on storage.objects;
drop policy if exists "authenticated delete own photos" on storage.objects;

-- select нужен не для показа фото (бакет публичный, getPublicUrl работает без политик),
-- а для remove(): Storage требует и delete, и select.
-- Раньше select был открыт всем, включая анонимов, — через API можно было получить список файлов всех пар.
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
