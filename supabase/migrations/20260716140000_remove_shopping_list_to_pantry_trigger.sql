-- Dynamic script to drop all triggers on public.shopping_list to prevent crossed-off items from going to the pantry
DO $$
DECLARE
  tname TEXT;
BEGIN
  FOR tname IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'shopping_list'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(tname) || ' ON public.shopping_list CASCADE;';
  END LOOP;
END $$;

-- Drop common trigger function names just in case
DROP FUNCTION IF EXISTS public.handle_shopping_list_purchase() CASCADE;
DROP FUNCTION IF EXISTS public.transfer_to_pantry() CASCADE;
DROP FUNCTION IF EXISTS public.copy_to_pantry() CASCADE;
DROP FUNCTION IF EXISTS public.add_purchased_to_pantry() CASCADE;
