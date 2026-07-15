import { ShoppingCart } from 'lucide-react';
import { Boton } from '../common/Boton';
import { ShoppingItemCard } from './ShoppingItemCard';
import { Box } from '../common/Box';
import { PageContainer, Spacer, PlannerHeader, TitleH2 } from '../common';
import type { ShoppingItem } from '../../types';

interface ShoppingListProps {
  shopping_items: ShoppingItem[];
  on_recalculate: () => void;
  on_toggle: (index: number) => void;
}

export const ShoppingList = ({
  shopping_items,
  on_recalculate,
  on_toggle
}: ShoppingListProps) => {
  return (
    <PageContainer>
      <PlannerHeader>
        <TitleH2>Lista de la Compra</TitleH2>
        <Boton
          texto="Calcular Faltantes"
          on_click={on_recalculate}
          variante="outlined"
          color="primary"
          clase_css="btn-sm"
        />
      </PlannerHeader>

      <Spacer height={10} />

      <Box className="shopping-summary">
        <Box component="span" className="shopping-summary-text">
          Ingredientes necesarios que no tienes en la despensa
        </Box>
        <Box component="span" className="shopping-summary-count">{shopping_items.length}</Box>
      </Box>

      <Spacer />

      <Box className="shopping-list-items">
        {shopping_items.length === 0 ? (
          <Box className="empty-state">
            <ShoppingCart className="empty-icon" />
            <Box component="p" className="empty-text">
              La lista de compra está vacía. Genera el menú del mes o haz clic en "Calcular Faltantes".
            </Box>
          </Box>
        ) : (
          shopping_items.map((item, index) => (
            <ShoppingItemCard
              key={index}
              item={item}
              on_toggle={() => on_toggle(index)}
            />
          ))
        )}
      </Box>
    </PageContainer>
  );
};
