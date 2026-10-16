-- Add inclusive trip dates without changing existing schedules.
begin;
lock table public.plans, public.activities in share row exclusive mode;
update public.plans set data=data||jsonb_build_object('endDate',data->>'date') where not (data ? 'endDate');
update public.activities a set data=a.data||jsonb_build_object('date',p.data->>'date','endDate',p.data->>'date') from public.plans p where p.id=a.plan_id and not (a.data ? 'date');
create or replace function public.check_record() returns trigger language plpgsql set search_path = '' as $$
declare d jsonb; value text; parent uuid; parent_data jsonb; first_date text; last_date text;
begin
 d:=new.data;
 if tg_op='UPDATE' then
  if new.id<>old.id or new.space_id<>old.space_id or new.author_id<>old.author_id or new.created_at<>old.created_at or (tg_table_name<>'inspirations' and new.plan_id is distinct from old.plan_id) or new.item_id is distinct from old.item_id then raise exception 'Identitas record tidak dapat dipindahkan.'; end if;
  new.version:=old.version+1; new.updated_at:=now();
 else
  new.version:=1; new.created_at:=now(); new.updated_at:=now();
 end if;
 if new.plan_id is not null then
  select space_id, data into parent, parent_data from public.plans where id=new.plan_id for update;
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
  -- Preserve newly added dates when an older client updates an existing record.
  if tg_op='UPDATE' then
   if not (d ? 'endDate') and old.data ? 'endDate' then d:=d||jsonb_build_object('endDate',old.data->>'endDate'); end if;
   if tg_table_name='activities' and not (d ? 'date') and old.data ? 'date' then d:=d||jsonb_build_object('date',old.data->>'date'); end if;
  end if;
  first_date:=coalesce(nullif(d->>'date',''),parent_data->>'date');
  last_date:=coalesce(nullif(d->>'endDate',''),first_date);
  foreach value in array array[first_date,last_date] loop
   if value is null or value !~ '^\d{4}-\d{2}-\d{2}$' or to_char(value::date,'YYYY-MM-DD')<>value then raise exception 'Tanggal tidak valid.'; end if;
  end loop;
  if coalesce(d->>'start','') !~ '^([01]\d|2[0-3]):[0-5]\d$' or coalesce(d->>'end','') !~ '^([01]\d|2[0-3]):[0-5]\d$' or (last_date||'T'||(d->>'end')) <= (first_date||'T'||(d->>'start')) then raise exception 'Tanggal dan jam selesai harus setelah mulai.'; end if;
  d:=d||jsonb_build_object('date',first_date,'endDate',last_date);
  if tg_table_name='activities' then
   if first_date < parent_data->>'date' or last_date > coalesce(parent_data->>'endDate',parent_data->>'date') then raise exception 'Tanggal kegiatan harus di dalam rentang rencana.'; end if;
  elsif tg_op='UPDATE' then
   if exists(select 1 from public.activities a where a.plan_id=new.id and
     (coalesce(a.data->>'date',old.data->>'date') < first_date or coalesce(a.data->>'endDate',a.data->>'date',old.data->>'date') > last_date)) then
    raise exception 'Masih ada kegiatan di luar rentang baru. Ubah tanggal kegiatan terlebih dahulu atau perluas rentang rencana.';
   end if;
  end if;
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
 new.data:=d;
 return new;
end; $$;
commit;
