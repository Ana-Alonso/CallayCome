import { useState } from 'react';
import { ShoppingCart, PenLine, RefreshCw, AlertTriangle, Store, Plus, Search, Loader2 } from 'lucide-react';
import { Boton } from '../common/Boton';
import { ShoppingItemCard } from './ShoppingItemCard';
import { Box } from '../common/Box';
import { PageContainer, Spacer, PlannerHeader, TitleH2, CardContainer } from '../common';
import { Dialogo } from '../common/Dialogo';
import type { ShoppingItem } from '../../types';
import { get_current_planner_day } from '../../utils/planner_helpers';
import { calculateBasketSupermarketComparison, type SupermarketBasketResult } from '../../services/supermarket_api';

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
  const [show_compare_modal, set_show_compare_modal] = useState(false);
  const [is_loading_comparison, set_is_loading_comparison] = useState(false);
  const [supermarketEstimates, setSupermarketEstimates] = useState<SupermarketBasketResult[]>([]);

  const current_day = get_current_planner_day(start_date);

  const filtered_items = shopping_items.filter(item =>
    item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const auto_items  = filtered_items.filter(item => !item.manual && !item.purchased);
  const manual_items = filtered_items.filter(item => item.manual && !item.purchased);
  const purchased_count = shopping_items.filter(item => item.purchased).length;
  const pending_count = shopping_items.filter(i => !i.purchased).length;

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
    await on_recalculate();
    set_is_recalculating(false);
  };

  const handle_open_compare = async () => {
    set_show_compare_modal(true);
    set_is_loading_comparison(true);
    try {
      const results = await calculateBasketSupermarketComparison(shopping_items);
      setSupermarketEstimates(results);
    } catch (e) {
      console.error('Error calculando cesta:', e);
    } finally {
      set_is_loading_comparison(false);
    }
  };

  const handle_share_whatsapp = async () => {
    if (shopping_items.length === 0) return;

    const pending = shopping_items.filter(i => !i.purchased);
    const header = `🛒 *Lista de la Compra - Calla y Come* 🍳\n\n`;
    const body = pending.length > 0 
      ? pending.map(item => `⬜ ${item.quantity} ${item.unit} ${item.ingredient_name}`).join('\n')
      : `✅ ¡Todo comprado!`;
    const footer = `\n\n_Enviado desde Calla y Come_`;

    const fullText = `${header}${body}${footer}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullText);
      }
    } catch {
      // Clipboard fallback
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
    window.open(waUrl, '_blank');
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {shopping_items.length > 0 && (
            <>
              <Boton
                texto="Comparar Cesta 🛒"
                on_click={handle_open_compare}
                variante="outlined"
                color="secondary"
                clase_css="btn-sm"
              />
              <Boton
                texto="WhatsApp 💬"
                on_click={handle_share_whatsapp}
                variante="outlined"
                color="success"
                clase_css="btn-sm"
              />
            </>
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

      {/* Input custom item form with modern glassmorphism */}
      <form
        onSubmit={handle_add_submit}
        style={{
          background: 'rgba(18, 24, 38, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          backdropFilter: 'blur(12px)',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}
      >
        <input
          type="text"
          placeholder="Añadir ítem manual..."
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          style={{
            flex: '1 1 180px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <input
          type="number"
          min={1}
          value={customQty}
          onChange={e => setCustomQty(Number(e.target.value))}
          style={{
            width: '75px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '10px 8px',
            color: '#ffffff',
            fontSize: '14px',
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <select
          value={customUnit}
          onChange={e => setCustomUnit(e.target.value)}
          style={{
            background: '#121826',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '10px 12px',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box'
          }}
        >
          <option value="uds">uds</option>
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="L">L</option>
          <option value="pack">pack</option>
        </select>
        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #f26841 0%, #ff8c42 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(242,104,65,0.4)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Plus size={16} /> Añadir
        </button>
      </form>

      {/* Search box with glassmorphism style & Search icon */}
      {shopping_items.length > 0 && (
        <div style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
          <Search
            size={18}
            color="rgba(255, 255, 255, 0.5)"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }}
          />
          <input
            type="text"
            placeholder="Buscar en la lista de la compra..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(18, 24, 38, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '12px 14px 12px 42px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              boxSizing: 'border-box',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
            }}
          />
        </div>
      )}

      {/* Shopping List Items */}
      {shopping_items.length === 0 ? (
        <Box className="empty-state">
          <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>Tu lista de la compra está vacía.</p>
          <p style={{ fontSize: 13, opacity: 0.6 }}>
            Pulsa "🔄 Calcular Faltantes" para generarla automáticamente según tu plan de comidas.
          </p>
        </Box>
      ) : (
        <>
          {/* Automatic items */}
          {auto_items.length > 0 && (
            <div>
              {section_header(<RefreshCw size={14} color="rgba(255,255,255,0.5)" />, "Planificador (Auto)", auto_items.length)}
              {auto_items.map(item => {
                const globalIndex = shopping_items.findIndex(i => i === item);
                return (
                  <ShoppingItemCard
                    key={`auto-${globalIndex}`}
                    item={item}
                    on_toggle={() => on_toggle(globalIndex)}
                  />
                );
              })}
            </div>
          )}

          {/* Manual items */}
          {manual_items.length > 0 && (
            <div style={{ marginTop: auto_items.length > 0 ? 16 : 0 }}>
              {section_header(<PenLine size={14} color="rgba(255,255,255,0.5)" />, "Añadidos Manualmente", manual_items.length)}
              {manual_items.map(item => {
                const globalIndex = shopping_items.findIndex(i => i === item);
                return (
                  <ShoppingItemCard
                    key={`manual-${globalIndex}`}
                    item={item}
                    on_toggle={() => on_toggle(globalIndex)}
                  />
                );
              })}
            </div>
          )}

          {/* Purchased items */}
          {purchased_count > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                Comprados ({purchased_count})
              </div>
              {filtered_items.filter(i => i.purchased).map(item => {
                const globalIndex = shopping_items.findIndex(i => i === item);
                return (
                  <ShoppingItemCard
                    key={`purchased-${globalIndex}`}
                    item={item}
                    on_toggle={() => on_toggle(globalIndex)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Comparativo de Cesta por Supermercado */}
      <Dialogo
        abierto={show_compare_modal}
        on_close={() => set_show_compare_modal(false)}
        titulo="🛒 Comparador de Cesta Completa en Supermercados"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Cálculo dinámico en tiempo real para tus <strong>{pending_count} productos pendientes</strong> consultando la base de datos de productos reales de SuperMarket API:
          </p>

          {is_loading_comparison ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0', gap: 10 }}>
              <Loader2 size={32} className="spinner" color="#a78bfa" />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Consultando catálogo y precios reales en SuperMarket API...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {supermarketEstimates.map((s, idx) => (
                <div
                  key={s.id}
                  style={{
                    background: idx === 0 ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                    border: idx === 0 ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Store size={20} color={s.logoColor} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {s.name}
                        {s.badge && (
                          <span style={{ fontSize: 10, backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: s.logoColor }}>
                            {s.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {s.matchedCount > 0 ? `${s.matchedCount}/${pending_count} coincidencias directas en BBDD` : `${pending_count} productos calculados`}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: idx === 0 ? '#10b981' : '#fff' }}>
                    {s.totalCost.toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <Boton
              texto="Cerrar"
              on_click={() => set_show_compare_modal(false)}
              variante="contained"
              color="primary"
            />
          </div>
        </div>
      </Dialogo>
    </PageContainer>
  );
};
