-- Habilitar réplica en tiempo real (Supabase Realtime) de forma segura para las tablas clave de la aplicación
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'family_notifications'
  ) then
    alter publication supabase_realtime add table public.family_notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'meal_plans'
  ) then
    alter publication supabase_realtime add table public.meal_plans;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'recipe_suggestions'
  ) then
    alter publication supabase_realtime add table public.recipe_suggestions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'recipe_suggestion_votes'
  ) then
    alter publication supabase_realtime add table public.recipe_suggestion_votes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'family_units'
  ) then
    alter publication supabase_realtime add table public.family_units;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pantry'
  ) then
    alter publication supabase_realtime add table public.pantry;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shopping_list'
  ) then
    alter publication supabase_realtime add table public.shopping_list;
  end if;
end;
$$;
