-- Run once in a new Supabase project. All private data is protected by RLS.
begin;
create table public.spaces (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 80),
 sweet_note text not null default 'Hal terbaik dari sebuah rencana adalah menjalaninya bersamamu.' check(length(sweet_note)<=1000),
 created_by uuid not null references auth.users(id), version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.space_members (
 user_id uuid primary key references auth.users(id), space_id uuid not null references public.spaces(id) on delete cascade,
 nickname text not null check(length(trim(nickname)) between 1 and 40), slot smallint not null check(slot in (1,2)), unique(space_id,slot)
);
create table public.space_invites (
 id uuid primary key default gen_random_uuid(), space_id uuid not null references public.spaces(id) on delete cascade,
 token_hash text not null unique, created_by uuid not null references auth.users(id),
 expires_at timestamptz not null default now()+interval '7 days', used_at timestamptz, revoked boolean not null default false, created_at timestamptz not null default now()
);
create function public.is_member(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.space_members where space_id=target and user_id=auth.uid());
$$;
create function public.create_space(room_name text, nickname text) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 if auth.uid() is null then raise exception 'Masuk terlebih dahulu.'; end if;
 insert into public.spaces(name,created_by) values(trim(room_name),auth.uid()) returning id into result;
 insert into public.space_members(user_id,space_id,nickname,slot) values(auth.uid(),result,trim(nickname),1);
 return result;
end; $$;
create function public.create_invite(target uuid) returns text language plpgsql security definer set search_path = '' as $$
declare token text;
begin
 if not public.is_member(target) then raise exception 'Akses ditolak.'; end if;
 perform 1 from public.spaces where id=target for update;
 if (select count(*) from public.space_members where space_id=target)>=2 then raise exception 'Ruang sudah berisi dua orang.'; end if;
 update public.space_invites set revoked=true where space_id=target and used_at is null;
 token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 insert into public.space_invites(space_id,token_hash,created_by) values(target,encode(sha256(convert_to(token,'UTF8')),'hex'),auth.uid());
 return token;
end; $$;
create function public.accept_invite(token text, nickname text) returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation public.space_invites; target uuid;
begin
 if auth.uid() is null then raise exception 'Masuk terlebih dahulu.'; end if;
 select space_id into target from public.space_invites where token_hash=encode(sha256(convert_to(token,'UTF8')),'hex');
 if target is null then raise exception 'Undangan tidak valid.'; end if;
 perform 1 from public.spaces where id=target for update;
 select * into invitation from public.space_invites where token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') for update;
 if invitation.revoked or invitation.used_at is not null or invitation.expires_at<=now() then raise exception 'Undangan kedaluwarsa atau sudah dipakai.'; end if;
 if exists(select 1 from public.space_members where user_id=auth.uid()) then raise exception 'Kamu sudah memiliki ruang.'; end if;
 if (select count(*) from public.space_members where space_id=target)>=2 then raise exception 'Ruang sudah penuh.'; end if;
 insert into public.space_members(user_id,space_id,nickname,slot) values(auth.uid(),target,trim(nickname),2);
 update public.space_invites set used_at=now() where id=invitation.id;
 return target;
end; $$;

-- Form payloads are JSON; identity, ownership, and relationships are relational.
do $$ declare t text; begin
 foreach t in array array['plans','activities','calendar_notes','inspirations','wishlist_items','wishlist_votes','checklist_items','memories'] loop
 execute format('create table public.%I (
 id uuid primary key default gen_random_uuid(), space_id uuid not null references public.spaces(id) on delete cascade,
 author_id uuid not null default auth.uid() references auth.users(id), plan_id uuid, item_id uuid,
 data jsonb not null default ''{}''::jsonb check(jsonb_typeof(data)=''object'' and octet_length(data::text)<=20000),
 version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now())',t);
 execute format('create index on public.%I(space_id)',t);
 end loop;
end $$;
alter table public.activities add foreign key(plan_id) references public.plans(id) on delete cascade, alter column plan_id set not null;
alter table public.checklist_items add foreign key(plan_id) references public.plans(id) on delete cascade, alter column plan_id set not null;
alter table public.memories add foreign key(plan_id) references public.plans(id) on delete cascade, alter column plan_id set not null, add unique(plan_id,author_id);
alter table public.inspirations add foreign key(plan_id) references public.plans(id) on delete set null;
alter table public.wishlist_votes add foreign key(item_id) references public.wishlist_items(id) on delete cascade, alter column item_id set not null, add unique(item_id,author_id);

create function public.valid_money(value jsonb) returns boolean language sql immutable set search_path = '' as $$
 select coalesce(jsonb_typeof(value)='number' and value::text ~ '^\d+$' and (value::text)::numeric<=1000000000000,false);
$$;
create function public.check_record() returns trigger language plpgsql set search_path = '' as $$
declare d jsonb; value text; parent uuid;
begin
 d:=new.data;
 if tg_op='UPDATE' then
  if new.id<>old.id or new.space_id<>old.space_id or new.author_id<>old.author_id or new.created_at<>old.created_at or new.plan_id is distinct from old.plan_id or new.item_id is distinct from old.item_id then raise exception 'Identitas record tidak dapat dipindahkan.'; end if;
  new.version:=old.version+1; new.updated_at:=now();
 else
  new.version:=1; new.created_at:=now(); new.updated_at:=now();
 end if;
 if new.plan_id is not null then
  select space_id into parent from public.plans where id=new.plan_id;
  if parent is distinct from new.space_id then raise exception 'Rencana bukan milik ruang ini.'; end if;
 end if;
 if new.item_id is not null then
  select space_id into parent from public.wishlist_items where id=new.item_id;
  if parent is distinct from new.space_id then raise exception 'Wishlist bukan milik ruang ini.'; end if;
 end if;
 if tg_table_name not in ('memories','wishlist_votes') and coalesce(length(trim(d->>'title')),0) not between 1 and 160 then raise exception 'Judul wajib diisi, maksimal 160 karakter.'; end if;
 if tg_table_name in ('plans','calendar_notes') then
  if coalesce(d->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' or to_char((d->>'date')::date,'YYYY-MM-DD')<>d->>'date' then raise exception 'Tanggal tidak valid.'; end if;
 end if;
 if tg_table_name in ('plans','activities') then
  if coalesce(d->>'start','') !~ '^([01]\d|2[0-3]):[0-5]\d$' or coalesce(d->>'end','') !~ '^([01]\d|2[0-3]):[0-5]\d$' or d->>'end'<=d->>'start' then raise exception 'Jam selesai harus setelah jam mulai.'; end if;
 end if;
 if tg_table_name='plans' then
  if not public.valid_money(d->'budget') or not public.valid_money(d->'share') or (d->>'share')::int>100 or coalesce(d->>'status','') not in ('draft','terjadwal','selesai','dibatalkan') then raise exception 'Anggaran atau status tidak valid.'; end if;
 elsif tg_table_name='activities' then
  foreach value in array array['estimate','actual','paidFirst'] loop
   if not public.valid_money(d->value) then raise exception 'Nominal rupiah tidak valid.'; end if;
  end loop;
  if (d->>'paidFirst')::numeric>(d->>'actual')::numeric then raise exception 'Kontribusi melebihi pengeluaran.'; end if;
  if coalesce(d->>'maps','')<>'' and d->>'maps' !~ '^https://(maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|www\.google\.com|google\.com)/' then raise exception 'Tautan Maps tidak valid.'; end if;
 elsif tg_table_name='wishlist_items' then
  if not public.valid_money(d->'estimate') then raise exception 'Estimasi tidak valid.'; end if;
 elsif tg_table_name='inspirations' then
  if coalesce(d->>'url','') !~ '^https://([a-zA-Z0-9-]+\.)*tiktok\.com/' then raise exception 'Tautan TikTok tidak valid.'; end if;
 elsif tg_table_name='memories' then
  if coalesce(length(trim(d->>'content')),0)<1 or not public.valid_money(d->'rating') or (d->>'rating')::int not between 1 and 5 then raise exception 'Isi jurnal dan rating 1–5 wajib diisi.'; end if;
 elsif tg_table_name='checklist_items' then
  if coalesce(d->>'assignee','')<>'' and not exists(select 1 from public.space_members where user_id=(d->>'assignee')::uuid and space_id=new.space_id) then raise exception 'Penanggung jawab bukan anggota ruang.'; end if;
 end if;
 return new;
end; $$;
create function public.bump_space() returns trigger language plpgsql set search_path = '' as $$ begin
 if new.id<>old.id or new.created_by<>old.created_by or new.created_at<>old.created_at then raise exception 'Identitas ruang tidak dapat diubah.'; end if;
 new.version:=old.version+1; new.updated_at:=now(); return new;
end $$;
create trigger bump_space before update on public.spaces for each row execute function public.bump_space();

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_invites enable row level security;
create policy space_read on public.spaces for select to authenticated using(public.is_member(id));
create policy space_edit on public.spaces for update to authenticated using(public.is_member(id)) with check(public.is_member(id));
create policy members_read on public.space_members for select to authenticated using(public.is_member(space_id));
create policy members_edit on public.space_members for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy invite_read on public.space_invites for select to authenticated using(public.is_member(space_id));
create policy invite_revoke on public.space_invites for update to authenticated using(public.is_member(space_id)) with check(public.is_member(space_id));
revoke all on public.spaces,public.space_members,public.space_invites from anon,authenticated;
grant select on public.spaces,public.space_members,public.space_invites to authenticated;
grant update(name,sweet_note) on public.spaces to authenticated;
grant update(nickname) on public.space_members to authenticated;
grant update(revoked) on public.space_invites to authenticated;

do $$ declare t text; restriction text; begin
 foreach t in array array['plans','activities','calendar_notes','inspirations','wishlist_items','wishlist_votes','checklist_items','memories'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  execute format('create trigger validate_record before insert or update on public.%I for each row execute function public.check_record()',t);
  execute format('create policy read_member on public.%I for select to authenticated using(public.is_member(space_id))',t);
  execute format('create policy insert_member on public.%I for insert to authenticated with check(public.is_member(space_id) and author_id=auth.uid())',t);
  restriction:=case when t in ('memories','wishlist_votes') then ' and author_id=auth.uid()' else '' end;
  execute format('create policy edit_member on public.%I for update to authenticated using(public.is_member(space_id)%s) with check(public.is_member(space_id)%s)',t,restriction,restriction);
  execute format('create policy delete_member on public.%I for delete to authenticated using(public.is_member(space_id)%s)',t,restriction);
 end loop;
end $$;
revoke all on function public.create_space(text,text),public.create_invite(uuid),public.accept_invite(text,text),public.is_member(uuid),public.check_record(),public.bump_space(),public.valid_money(jsonb) from public;
grant execute on function public.create_space(text,text),public.create_invite(uuid),public.accept_invite(text,text),public.is_member(uuid),public.valid_money(jsonb) to authenticated;
do $$ declare t text; begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach t in array array['spaces','space_members','plans','activities','calendar_notes','inspirations','wishlist_items','wishlist_votes','checklist_items','memories'] loop
   execute format('alter publication supabase_realtime add table public.%I',t);
  end loop;
 end if;
end $$;
commit;
