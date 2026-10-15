begin;
alter table public.spaces add column recommendation_city text not null default 'Bandung'
  check (length(trim(recommendation_city)) between 1 and 80);
grant update(recommendation_city) on public.spaces to authenticated;
commit;
