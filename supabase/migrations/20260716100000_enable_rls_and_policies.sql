-- 1. Habilitar Row Level Security (RLS) en todas las tablas del esquema público
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_suggestion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar cualquier política previa (para evitar conflictos si se ejecuta de nuevo)
DROP POLICY IF EXISTS user_own_profile ON public.profiles;
DROP POLICY IF EXISTS user_family_profiles ON public.profiles;
DROP POLICY IF EXISTS user_family_units ON public.family_units;
DROP POLICY IF EXISTS user_family_members ON public.family_members;
DROP POLICY IF EXISTS user_pantry_access ON public.pantry;
DROP POLICY IF EXISTS user_shopping_list_access ON public.shopping_list;
DROP POLICY IF EXISTS user_meal_plans_access ON public.meal_plans;
DROP POLICY IF EXISTS user_recipe_suggestions_access ON public.recipe_suggestions;
DROP POLICY IF EXISTS user_recipe_suggestion_votes_access ON public.recipe_suggestion_votes;
DROP POLICY IF EXISTS user_family_notifications_access ON public.family_notifications;

-- 3. Crear Políticas para 'profiles'
-- Permite al usuario interactuar libremente con su propio perfil
CREATE POLICY user_own_profile ON public.profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Permite ver los perfiles de otros miembros que compartan la misma unidad familiar
CREATE POLICY user_family_profiles ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members AS self
            JOIN public.family_members AS other ON self.family_id = other.family_id
            WHERE self.user_id = auth.uid() AND other.user_id = public.profiles.id
        )
    );

-- 4. Crear Políticas para 'family_units'
-- Permite ver y modificar la unidad familiar si el usuario es miembro
CREATE POLICY user_family_units ON public.family_units
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.family_units.id AND family_members.user_id = auth.uid()
        )
    );

-- 5. Crear Políticas para 'family_members'
-- Permite interactuar con los miembros de una familia si el usuario forma parte de ella
CREATE POLICY user_family_members ON public.family_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members AS self
            WHERE self.family_id = public.family_members.family_id AND self.user_id = auth.uid()
        )
    );

-- 6. Crear Políticas para 'pantry'
-- Acceso total a la despensa de la familia activa del usuario
CREATE POLICY user_pantry_access ON public.pantry
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.pantry.family_id AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.pantry.family_id AND family_members.user_id = auth.uid()
        )
    );

-- 7. Crear Políticas para 'shopping_list'
-- Acceso total a la lista de compra de la familia activa del usuario
CREATE POLICY user_shopping_list_access ON public.shopping_list
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.shopping_list.family_id AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.shopping_list.family_id AND family_members.user_id = auth.uid()
        )
    );

-- 8. Crear Políticas para 'meal_plans'
-- Acceso total a la planificación del menú de la familia activa del usuario
CREATE POLICY user_meal_plans_access ON public.meal_plans
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.meal_plans.family_id AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.meal_plans.family_id AND family_members.user_id = auth.uid()
        )
    );

-- 9. Crear Políticas para 'recipe_suggestions'
-- Acceso total a las sugerencias de la familia activa del usuario
CREATE POLICY user_recipe_suggestions_access ON public.recipe_suggestions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.recipe_suggestions.family_id AND family_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.recipe_suggestions.family_id AND family_members.user_id = auth.uid()
        )
    );

-- 10. Crear Políticas para 'recipe_suggestion_votes'
-- Acceso a los votos asociados a sugerencias de la familia activa del usuario
CREATE POLICY user_recipe_suggestion_votes_access ON public.recipe_suggestion_votes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.recipe_suggestions AS sugg
            JOIN public.family_members AS mem ON sugg.family_id = mem.family_id
            WHERE sugg.id = public.recipe_suggestion_votes.suggestion_id AND mem.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.recipe_suggestions AS sugg
            JOIN public.family_members AS mem ON sugg.family_id = mem.family_id
            WHERE sugg.id = public.recipe_suggestion_votes.suggestion_id AND mem.user_id = auth.uid()
        )
    );

-- 11. Crear Políticas para 'family_notifications'
-- Acceso total a las notificaciones familiares recibidas por el usuario
CREATE POLICY user_family_notifications_access ON public.family_notifications
    FOR ALL
    USING (
        auth.uid() = recipient_user_id
    )
    WITH CHECK (
        auth.uid() = recipient_user_id
    );

-- 12. Habilitar RLS en la tabla 'recipes' y definir sus políticas
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_recipes_read ON public.recipes;
DROP POLICY IF EXISTS authenticated_recipes_write ON public.recipes;

-- Lectura pública para cualquier usuario (autenticado o no)
CREATE POLICY public_recipes_read ON public.recipes
    FOR SELECT
    USING (true);

-- Escritura completa (inserción, actualización, eliminación) para usuarios autenticados
CREATE POLICY authenticated_recipes_write ON public.recipes
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
