-- Migración para limpieza automática de notificaciones antiguas (más de 24 horas)

-- Función trigger para eliminar notificaciones antiguas
create or replace function public.clean_old_family_notifications()
returns trigger as $$
begin
  delete from public.family_notifications
  where created_at < now() - interval '24 hours';
  return new;
end;
$$ language plpgsql security definer;

-- Crear el trigger que se ejecuta después de cada inserción (por sentencia)
drop trigger if exists trigger_clean_old_family_notifications on public.family_notifications;
create trigger trigger_clean_old_family_notifications
  after insert on public.family_notifications
  for each statement
  execute function public.clean_old_family_notifications();
