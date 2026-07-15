import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Boton } from '../common/Boton';
import { ShoppingItemCard } from './ShoppingItemCard';
import { Box } from '../common/Box';
import { PageContainer, Spacer, PlannerHeader, TitleH2, CardContainer } from '../common';
import type { ShoppingItem } from '../../types';

interface ShoppingListProps {
  shopping_items: ShoppingItem[];
  on_recalculate: () => void;
  on_toggle: (index: number) => void;
  on_add_custom: (name: string, quantity: number, unit: string) => void;
}

export const ShoppingList = ({
  shopping_items,
  on_recalculate,
  on_toggle,
  on_add_custom
}: ShoppingListProps) => {
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState('uds');

  const handle_add_submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    on_add_custom(customName, customQty, customUnit);
    setCustomName('');
    setCustomQty(1);
    setCustomUnit('uds');
  };

  const handle_share_whatsapp = async () => {
    if (shopping_items.length === 0) return;

    const header = `🛒 *Lista de la Compra - Calla y Come* 🍳\n\n`;
    const body = shopping_items
      .map(item => `${item.purchased ? '✅' : '⬜'} ${item.quantity} ${item.unit} de ${item.ingredient_name}`)
      .join('\n');
    const footer = `\n\n_Generado por Calla y Come_`;

    const fullText = `${header}${body}${footer}`;

    try {
      await navigator.clipboard.writeText(fullText);
      const toastEvent = new CustomEvent('in-app-notification', {
        detail: {
          title: "Lista Copiada 📋",
          body: "Se ha copiado el texto formateado al portapapeles. ¡Ya puedes pegarlo en WhatsApp!"
        }
      });
      window.dispatchEvent(toastEvent);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageContainer>
      <PlannerHeader>
        <TitleH2>Lista de la Compra</TitleH2>
        <div style={{ display: 'flex', gap: 8 }}>
          {shopping_items.length > 0 && (
            <Boton
              texto="WhatsApp 💬"
              on_click={handle_share_whatsapp}
              variante="outlined"
              color="success"
              clase_css="btn-sm"
            />
          )}
          <Boton
            texto="Calcular Faltantes"
            on_click={on_recalculate}
            variante="outlined"
            color="primary"
            clase_css="btn-sm"
          />
        </div>
      </PlannerHeader>

      <Spacer height={10} />

      <CardContainer component="form" onSubmit={handle_add_submit} style={{ padding: '12px 16px', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 'bold', color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: 8 }}>
          ➕ Añadir artículo personalizado (papel, leche, etc.):
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Ej: Servilletas"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            style={{
              flex: 2,
              minWidth: '150px',
              backgroundColor: '#1c1c24',
              color: '#ffffff',
              border: '1px solid #32323e',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
              outline: 'none'
            }}
            required
          />
          <input
            type="number"
            min="0.1"
            step="any"
            value={customQty}
            onChange={e => setCustomQty(parseFloat(e.target.value) || 1)}
            style={{
              width: '70px',
              backgroundColor: '#1c1c24',
              color: '#ffffff',
              border: '1px solid #32323e',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
              outline: 'none'
            }}
            required
          />
          <input
            type="text"
            placeholder="uds"
            value={customUnit}
            onChange={e => setCustomUnit(e.target.value)}
            style={{
              width: '80px',
              backgroundColor: '#1c1c24',
              color: '#ffffff',
              border: '1px solid #32323e',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
              outline: 'none'
            }}
          />
          <Boton
            texto="Añadir"
            tipo="submit"
            color="primary"
            clase_css="btn-sm"
          />
        </div>
      </CardContainer>

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
