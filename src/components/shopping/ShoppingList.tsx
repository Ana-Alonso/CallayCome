import { useState } from 'react';
import { ShoppingCart, PenLine, RefreshCw, AlertTriangle } from 'lucide-react';
import { Boton } from '../common/Boton';
import { ShoppingItemCard } from './ShoppingItemCard';
import { Box } from '../common/Box';
import { PageContainer, Spacer, PlannerHeader, TitleH2, CardContainer } from '../common';
import type { ShoppingItem } from '../../types';
import { get_current_planner_day, get_active_week_info } from '../../utils/planner_helpers';

interface ShoppingListProps {
  shopping_items: ShoppingItem[];
  on_recalculate: () => void;
  on_toggle: (index: number) => void;
  on_add_custom: (name: string, quantity: number, unit: string) => void;
  start_date: string | null;
}

export const ShoppingList = ({
  shopping_items,
  on_recalculate,
  on_toggle,
  on_add_custom,
  start_date
}: ShoppingListProps) => {
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState('uds');
  const [is_recalculating, set_is_recalculating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const current_day = get_current_planner_day(start_date);
  const week_info = get_active_week_info(current_day);

  const filtered_items = shopping_items.filter(item =>
    item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const auto_items  = filtered_items.filter(item => !item.manual && !item.purchased);
  const manual_items = filtered_items.filter(item => item.manual && !item.purchased);
  const purchased_count = shopping_items.filter(item => item.purchased).length;

  const handle_add_submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    on_add_custom(customName, customQty, customUnit);
    setCustomName('');
    setCustomQty(1);
    setCustomUnit('uds');
  };

  const handle_recalculate = async () => {
    set_is_recalculating(true);
    try {
      await on_recalculate();
    } finally {
      set_is_recalculating(false);
    }
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
          body: "Texto copiado al portapapeles. ¡Ya puedes pegarlo en WhatsApp!"
        }
      });
      window.dispatchEvent(toastEvent);
    } catch (e) {
      console.error(e);
    }
  };

  const section_header = (icon: React.ReactNode, label: string, count: number) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 0 10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      marginBottom: 10
    }}>
      {icon}
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </span>
      <span style={{
        marginLeft: 'auto',
        fontSize: 11,
        fontWeight: 700,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '2px 8px',
        color: 'rgba(255,255,255,0.6)'
      }}>
        {count}
      </span>
    </div>
  );

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
            texto={is_recalculating ? "Calculando…" : "🔄 Calcular Faltantes"}
            on_click={handle_recalculate}
            variante="contained"
            color="primary"
            clase_css="btn-sm"
          />
        </div>
      </PlannerHeader>

      <Spacer height={10} />

      {/* Alert if reached the last day */}
      {current_day !== null && current_day >= 30 && (
        <CardContainer style={{ padding: '12px 16px', marginBottom: 12, backgroundColor: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle color="#ef5350" size={24} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>
            ⚠️ Has llegado al último día de la planificación (Día {current_day}). Necesitas una nueva lista de la compra. Por favor, actualiza la fecha de inicio del plan y calcula los faltantes.
          </span>
        </CardContainer>
      )}

      {/* Info banner */}
      <CardContainer style={{ padding: '10px 14px', marginBottom: 12, backgroundColor: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.2)', borderRadius: 10 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, display: 'block' }}>
          💡 <strong style={{ color: '#64b5f6' }}>Calcular Faltantes</strong> revisa tu menú de la <strong style={{ color: '#64b5f6' }}>{week_info.label}</strong>, compara con tu despensa y genera aquí los ingredientes que te faltan comprar.
        </span>
      </CardContainer>

      {/* Stats row */}
      {shopping_items.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: shopping_items.length, color: '#90caf9' },
            { label: 'Pendientes', value: shopping_items.length - purchased_count, color: '#ef5350' },
            { label: 'Comprados', value: purchased_count, color: '#66bb6a' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1,
              minWidth: 80,
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '8px 12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Custom item form */}
      <CardContainer component="form" onSubmit={handle_add_submit} style={{ padding: '12px 16px', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 'bold', color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: 8 }}>
          ➕ Añadir artículo personalizado:
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

      {/* Search Bar */}
      {shopping_items.length > 0 && (
        <CardContainer style={{ padding: '12px 16px', marginBottom: 16 }}>
          <input
            type="text"
            placeholder="🔍 Buscar artículo en la lista..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1c1c24',
              color: '#ffffff',
              border: '1px solid #32323e',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </CardContainer>
      )}

      <Spacer />

      {/* Empty state */}
      {shopping_items.length === 0 ? (
        <Box className="empty-state">
          <ShoppingCart className="empty-icon" />
          <Box component="p" className="empty-text">
            La lista está vacía. Pulsa <strong>"🔄 Calcular Faltantes"</strong> para comparar tu menú con la despensa y generar la lista de la compra automáticamente.
          </Box>
          <Boton
            texto="🔄 Calcular Faltantes Ahora"
            on_click={handle_recalculate}
            variante="contained"
            color="primary"
          />
        </Box>
      ) : filtered_items.length === 0 ? (
        <Box className="empty-state" style={{ padding: '24px 16px' }}>
          <ShoppingCart className="empty-icon" style={{ opacity: 0.5 }} />
          <Box component="p" className="empty-text">
            No se encontraron artículos que coincidan con la búsqueda "{searchQuery}".
          </Box>
        </Box>
      ) : (
        <Box className="shopping-list-items">
          {auto_items.length === 0 && manual_items.length === 0 ? (
            <Box className="empty-state" style={{ padding: '24px 16px' }}>
              <ShoppingCart className="empty-icon" style={{ opacity: 0.5 }} />
              <Box component="p" className="empty-text" style={{ fontSize: 15, fontWeight: '500', color: '#a5d6a7' }}>
                ¡Todo comprado! 🎉 Todos los ingredientes están listos en tu despensa.
              </Box>
            </Box>
          ) : (
            <>
              {/* Auto-generated section */}
              {auto_items.length > 0 && (
                <CardContainer style={{ padding: '12px 14px', marginBottom: 14 }}>
                  {section_header(<RefreshCw size={13} color="#90caf9" />, 'Ingredientes del menú', auto_items.length)}
                  {auto_items.map((item) => {
                    const global_index = shopping_items.indexOf(item);
                    return (
                      <ShoppingItemCard
                        key={item.id ?? global_index}
                        item={item}
                        on_toggle={() => on_toggle(global_index)}
                      />
                    );
                  })}
                </CardContainer>
              )}

              {/* Manual section */}
              {manual_items.length > 0 && (
                <CardContainer style={{ padding: '12px 14px', marginBottom: 14 }}>
                  {section_header(<PenLine size={13} color="#a5d6a7" />, 'Artículos personalizados', manual_items.length)}
                  {manual_items.map((item) => {
                    const global_index = shopping_items.indexOf(item);
                    return (
                      <ShoppingItemCard
                        key={item.id ?? global_index}
                        item={item}
                        on_toggle={() => on_toggle(global_index)}
                      />
                    );
                  })}
                </CardContainer>
              )}
            </>
          )}
        </Box>
      )}
    </PageContainer>
  );
};
