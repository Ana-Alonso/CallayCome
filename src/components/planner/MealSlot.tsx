import { X } from 'lucide-react';
import { IconoBoton } from '../common/IconoBoton';
import { MealSlotContainer, MealLabel, MealPlaceholder, MealName, FlexRow } from '../common';

interface MealSlotProps {
  etiqueta: string;
  receta_nombre: string | null;
  on_click: () => void;
  on_clear: (e: React.MouseEvent) => void;
}

export const MealSlot = ({
  etiqueta,
  receta_nombre,
  on_click,
  on_clear
}: MealSlotProps) => {
  const handle_clear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    on_clear(e);
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
          <IconoBoton 
            on_click={handle_clear}
            clase_css="month-btn"
          >
            <X size={14} />
          </IconoBoton>
        </FlexRow>
      ) : (
        <MealPlaceholder>+ Añadir {etiqueta.toLowerCase()}</MealPlaceholder>
      )}
    </MealSlotContainer>
  );
};
