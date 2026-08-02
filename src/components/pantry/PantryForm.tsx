import { useState } from 'react';
import { Plus, Barcode, Search, AlertCircle } from 'lucide-react';
import { Box } from '../common/Box';
import { Boton } from '../common/Boton';
import { CampoTexto } from '../common/CampoTexto';
import { FormGroup, FormLabel, PantryInputGrid, SelectControl } from '../common';
import { Dialogo } from '../common/Dialogo';

interface PantryFormProps {
  on_add: (name: string, qty: number, unit: string) => void;
}

export const PantryForm = ({ on_add }: PantryFormProps) => {
  const [nombre, set_nombre] = useState<string>('');
  const [cantidad, set_cantidad] = useState<number>(0);
  const [unidad, set_unidad] = useState<string>('g');
  const [show_barcode_modal, set_show_barcode_modal] = useState(false);
  const [barcode, set_barcode] = useState('');
  const [loading_barcode, set_loading_barcode] = useState(false);
  const [barcode_error, set_barcode_error] = useState('');

  const handle_submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!nombre || cantidad <= 0) {
      return;
    }
    on_add(nombre, cantidad, unidad);
    set_nombre('');
    set_cantidad(0);
  };

  const handle_barcode_lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    set_loading_barcode(true);
    set_barcode_error('');

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode.trim())}.json?fields=product_name,product_name_es,brands`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const foundName = data.product.product_name_es || data.product.product_name || '';
        const brand = data.product.brands ? ` (${data.product.brands.split(',')[0]})` : '';
        set_nombre(`${foundName}${brand}`.trim());
        set_show_barcode_modal(false);
        set_barcode('');
      } else {
        set_barcode_error('Producto no encontrado en la base de OpenFoodFacts.');
      }
    } catch {
      set_barcode_error('Error al conectar con OpenFoodFacts.');
    } finally {
      set_loading_barcode(false);
    }
  };

  return (
    <Box component="form" onSubmit={handle_submit} className="despensa-form">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <FormLabel style={{ marginBottom: 0 }}>Nombre del Alimento</FormLabel>
        <button
          type="button"
          onClick={() => set_show_barcode_modal(true)}
          style={{
            background: 'rgba(242, 104, 65, 0.12)',
            border: '1px solid rgba(242, 104, 65, 0.3)',
            borderRadius: 6,
            padding: '4px 10px',
            color: '#f26841',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Barcode size={14} /> Escanear EAN / Código
        </button>
      </div>

      <FormGroup>
        <CampoTexto
          etiqueta=""
          valor={nombre}
          on_change={set_nombre}
          marcador_posicion="Ej. Harina, Pollo, Aguacate..."
          requerido
        />
      </FormGroup>

      <PantryInputGrid>
        <FormGroup>
          <FormLabel>Cantidad</FormLabel>
          <CampoTexto
            etiqueta=""
            valor={cantidad || ''}
            on_change={(v) => set_cantidad(Number(v))}
            tipo="number"
            requerido
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Unidad</FormLabel>
          <SelectControl 
            value={unidad}
            onChange={(e) => set_unidad(e.target.value)}
          >
            <option value="g">gramos (g)</option>
            <option value="ml">ml</option>
            <option value="unidades">uds</option>
            <option value="rebanadas">rebanadas</option>
            <option value="tiras">tiras</option>
            <option value="lonchas">lonchas</option>
          </SelectControl>
        </FormGroup>
      </PantryInputGrid>

      <Boton
        texto="Añadir a Despensa"
        tipo="submit"
        icono={<Plus size={18} />}
        clase_css="margin-top-sm"
      />

      {/* Modal de búsqueda por EAN / Código de barras */}
      <Dialogo
        abierto={show_barcode_modal}
        on_close={() => set_show_barcode_modal(false)}
        titulo="📷 Escanear o Buscar por Código de Barras"
      >
        <form onSubmit={handle_barcode_lookup} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
            Introduce el número EAN (código de barras de 8 a 13 dígitos) impreso en el envase del alimento:
          </p>
          <CampoTexto
            etiqueta="Código EAN"
            valor={barcode}
            on_change={set_barcode}
            marcador_posicion="Ej. 8410000000000"
            requerido
          />

          {barcode_error && (
            <div style={{ fontSize: 12, color: '#fc8181', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={14} /> {barcode_error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Boton
              texto="Cancelar"
              on_click={() => set_show_barcode_modal(false)}
              variante="outlined"
            />
            <Boton
              texto={loading_barcode ? "Buscando..." : "Buscar Alimento"}
              tipo="submit"
              icono={<Search size={16} />}
              variante="contained"
              color="primary"
              deshabilitado={loading_barcode}
            />
          </div>
        </form>
      </Dialogo>
    </Box>
  );
};
