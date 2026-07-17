import { X, Info } from 'lucide-react';
import { IconoBoton } from '../common/IconoBoton';
import { MealSlotContainer, MealLabel, MealPlaceholder, MealName, FlexRow } from '../common';

interface MealSlotProps {
  etiqueta: string;
  receta_nombre: string | null;
  on_click: () => void;
  on_clear: (e: React.MouseEvent) => void;
  on_view_recipe?: (e: React.MouseEvent) => void;
  can_clear?: boolean;
}

export const MealSlot = ({
  etiqueta,
  receta_nombre,
  on_click,
  on_clear,
  on_view_recipe,
  can_clear = true,
}: MealSlotProps) => {
  const handle_clear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    on_clear(e);
  };

  const handle_view = (e: React.MouseEvent): void => {
    e.stopPropagation();
    on_view_recipe?.(e);
  };

  return (
    <MealSlotContainer
      className={receta_nombre ? 'assigned' : ''}
      onClick={on_click}
    >
      <MealLabel>{etiqueta}</MealLabel>
      {receta_nombre ? (
        <FlexRow>
          <MealName>{receta_nombre}</MealName>
          {on_view_recipe && (
            <IconoBoton
              on_click={handle_view}
              clase_css="month-btn"
            >
              <Info size={14} />
            </IconoBoton>
          )}
          {can_clear && (
            <IconoBoton
              on_click={handle_clear}
              clase_css="month-btn"
            >
              <X size={14} />
            </IconoBoton>
          )}
        </FlexRow>
      ) : (
        <MealPlaceholder>+ Añadir {etiqueta.toLowerCase()}</MealPlaceholder>
      )}
    </MealSlotContainer>
  );
};
