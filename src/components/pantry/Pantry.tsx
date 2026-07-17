import { ChefHat } from 'lucide-react';
import { PantryForm } from './PantryForm';
import { PantryItemCard } from './PantryItemCard';
import { Box } from '../common/Box';
import { PageContainer, Spacer, TitleH2, TextMuted } from '../common';
import type { PantryItem } from '../../types';

interface PantryProps {
  pantry_items: PantryItem[];
  on_add: (name: string, qty: number, unit: string) => void;
  on_delete: (id: number) => void;
}

export const Pantry = ({
  pantry_items,
  on_add,
  on_delete
}: PantryProps) => {
  return (
    <PageContainer>
      <TitleH2>Mi Despensa</TitleH2>
      <TextMuted>
        Registra los ingredientes que tienes y sus cantidades disponibles.
      </TextMuted>

      <Spacer height={10} />

      <PantryForm on_add={on_add} />

      <Spacer />

      <Box className="pantry-grid">
        {pantry_items.length === 0 ? (
          <Box className="empty-state">
            <ChefHat className="empty-icon" />
            <Box component="p" className="empty-text">
              Tu despensa está vacía. Registra alimentos para que ordenemos las recetas según lo que tienes.
            </Box>
          </Box>
        ) : (
          pantry_items.map((item, index) => (
            <PantryItemCard
              key={index}
              item={item}
              on_delete={() => on_delete(item.id!)}
            />
          ))
        )}
      </Box>
    </PageContainer>
  );
};
