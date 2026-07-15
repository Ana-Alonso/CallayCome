create or replace function public.handle_cocinitas_membership_deleted()
returns trigger as $$
declare
  affected_profile_id uuid;
begin
  if old.role <> 'cocinitas' then
    return old;
  end if;

  if exists (
    select 1
    from public.family_members
    where family_id = old.family_id
      and role = 'cocinitas'
  ) then
    return old;
  end if;

  for affected_profile_id in
    select p.id
    from public.profiles p
    where p.active_family_id = old.family_id
  loop
    update public.profiles p
    set active_family_id = (
      select fm.family_id
      from public.family_members fm
      where fm.user_id = p.id
        and fm.family_id <> old.family_id
      order by fm.family_id
      limit 1
    )
    where p.id = affected_profile_id;
  end loop;

  delete from public.family_units
  where id = old.family_id;

  return old;
end;
$$ language plpgsql;

drop trigger if exists on_cocinitas_membership_deleted on public.family_members;
create trigger on_cocinitas_membership_deleted
  after delete on public.family_members
  for each row execute procedure public.handle_cocinitas_membership_deleted();

alter table public.meal_plans add column if not exists desayuno_slots jsonb not null default '[null]'::jsonb;
alter table public.meal_plans add column if not exists comida_slots jsonb not null default '[null]'::jsonb;
alter table public.meal_plans add column if not exists cena_slots jsonb not null default '[null]'::jsonb;

update public.meal_plans
set
  desayuno_slots = case
    when jsonb_typeof(desayuno_slots) = 'array' and jsonb_array_length(desayuno_slots) > 0 then desayuno_slots
    when desayuno is not null then jsonb_build_array(desayuno)
    else '[null]'::jsonb
  end,
  comida_slots = case
    when jsonb_typeof(comida_slots) = 'array' and jsonb_array_length(comida_slots) > 0 then comida_slots
    when comida is not null then jsonb_build_array(comida)
    else '[null]'::jsonb
  end,
  cena_slots = case
    when jsonb_typeof(cena_slots) = 'array' and jsonb_array_length(cena_slots) > 0 then cena_slots
    when cena is not null then jsonb_build_array(cena)
    else '[null]'::jsonb
  end;
