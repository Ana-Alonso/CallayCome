-- Migration for automatic cleanup of resolved recipe suggestions (status != 'pendiente')

-- 1. Create or replace the function to delete non-pending suggestions
create or replace function public.clean_resolved_recipe_suggestions()
returns trigger as $$
begin
  delete from public.recipe_suggestions
  where status != 'pendiente';
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the trigger to execute after any insert
drop trigger if exists trigger_clean_resolved_recipe_suggestions on public.recipe_suggestions;
create trigger trigger_clean_resolved_recipe_suggestions
  after insert on public.recipe_suggestions
  for each statement
  execute function public.clean_resolved_recipe_suggestions();
