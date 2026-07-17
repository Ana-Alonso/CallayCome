import { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { PantryForm } from './PantryForm';
import { PantryItemCard } from './PantryItemCard';
import { Box } from '../common/Box';
import { PageContainer, Spacer, TitleH2, TextMuted } from '../common';
import { Dialogo } from '../common/Dialogo';
import { Boton } from '../common/Boton';
import { CampoTexto } from '../common/CampoTexto';
import type { PantryItem } from '../../types';

interface PantryProps {
  pantry_items: PantryItem[];
  on_add: (name: string, qty: number, unit: string) => void;
  on_delete: (id: number) => void;
  on_update_qty?: (id: number, qty: number) => void;
}

export const Pantry = ({
  pantry_items,
  on_add,
  on_delete,
  on_update_qty
}: PantryProps) => {
  const [confirm_subtract_item, set_confirm_subtract_item] = useState<PantryItem | null>(null);
  const [subtract_qty, set_subtract_qty] = useState<number>(0);
  const [search_query, set_search_query] = useState('');

  const handle_delete_click = (item: PantryItem) => {
    set_confirm_subtract_item(item);
    set_subtract_qty(item.quantity);
  };

  const filtered_items = pantry_items.filter(item =>
    item.ingredient_name.toLowerCase().includes(search_query.toLowerCase())
  );

  return (
    <PageContainer>
      <TitleH2>Mi Despensa</TitleH2>
      <TextMuted>
        Registra los ingredientes que tienes y sus cantidades disponibles.
      </TextMuted>

      <Spacer height={10} />

      <PantryForm on_add={on_add} />

      {pantry_items.length > 0 && (
        <>
          <Spacer height={15} />
          <CampoTexto
            etiqueta="🔍 Buscar ingrediente en la despensa..."
            valor={search_query}
            on_change={set_search_query}
            marcador_posicion="Ej. Sal, Azúcar..."
          />
        </>
      )}

      <Spacer />

      <Box className="pantry-grid">
        {pantry_items.length === 0 ? (
          <Box className="empty-state">
            <ChefHat className="empty-icon" />
            <Box component="p" className="empty-text">
              Tu despensa está vacía. Registra alimentos para que ordenemos las recetas según lo que tienes.
            </Box>
          </Box>
        ) : filtered_items.length === 0 ? (
          <Box className="empty-state" style={{ padding: '24px 16px', gridColumn: '1 / -1' }}>
            <ChefHat className="empty-icon" style={{ opacity: 0.5 }} />
            <Box component="p" className="empty-text">
              No se encontraron ingredientes que coincidan con la búsqueda "{search_query}".
            </Box>
          </Box>
        ) : (
          filtered_items.map((item, index) => (
            <PantryItemCard
              key={index}
              item={item}
              on_delete={() => handle_delete_click(item)}
            />
          ))
        )}
      </Box>

      <Dialogo
        abierto={confirm_subtract_item !== null}
        on_close={() => set_confirm_subtract_item(null)}
        titulo="🗑️ Eliminar de Despensa"
      >
        {confirm_subtract_item && (
          <Box style={{ minWidth: "300px", padding: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 12 }}>
              ¿Cuánto quieres eliminar de <strong>{confirm_subtract_item.ingredient_name}</strong>?
            </span>
            <TextMuted style={{ fontSize: 13, marginBottom: 16, display: 'block' }}>
              Cantidad actual: {confirm_subtract_item.quantity} {confirm_subtract_item.unit}
            </TextMuted>

            <CampoTexto
              etiqueta={`Cantidad a restar (${confirm_subtract_item.unit})`}
              valor={subtract_qty || ''}
              on_change={(val) => set_subtract_qty(Number(val))}
              tipo="number"
              requerido
            />

            <Spacer height={20} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Boton
                texto="Restar Cantidad"
                color="primary"
                on_click={() => {
                  if (on_update_qty && confirm_subtract_item.id !== undefined) {
                    const remaining = confirm_subtract_item.quantity - subtract_qty;
                    if (remaining <= 0) {
                      on_delete(confirm_subtract_item.id);
                    } else {
                      on_update_qty(confirm_subtract_item.id, Number(remaining.toFixed(2)));
                    }
                  }
                  set_confirm_subtract_item(null);
                }}
              />
              <Boton
                texto="Eliminar Todo"
                color="error"
                on_click={() => {
                  if (confirm_subtract_item.id !== undefined) {
                    on_delete(confirm_subtract_item.id);
                  }
                  set_confirm_subtract_item(null);
                }}
              />
              <Boton
                texto="Cancelar"
                variante="text"
                on_click={() => set_confirm_subtract_item(null)}
              />
            </div>
          </Box>
        )}
      </Dialogo>
    </PageContainer>
  );
};
