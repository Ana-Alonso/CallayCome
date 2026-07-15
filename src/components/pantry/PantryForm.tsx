import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Box } from '../common/Box';
import { Boton } from '../common/Boton';
import { CampoTexto } from '../common/CampoTexto';
import { FormGroup, FormLabel, PantryInputGrid, SelectControl } from '../common';

interface PantryFormProps {
  on_add: (name: string, qty: number, unit: string) => void;
}

export const PantryForm = ({ on_add }: PantryFormProps) => {
  const [nombre, set_nombre] = useState<string>('');
  const [cantidad, set_cantidad] = useState<number>(0);
  const [unidad, set_unidad] = useState<string>('g');

  const handle_submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!nombre || cantidad <= 0) {
      return;
    }
    on_add(nombre, cantidad, unidad);
    set_nombre('');
    set_cantidad(0);
  };

  const handle_nombre_change = (valor: string): void => {
    set_nombre(valor);
  };

  const handle_cantidad_change = (valor: string): void => {
    set_cantidad(Number(valor));
  };

  const handle_unidad_change = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    set_unidad(e.target.value);
  };

  return (
    <Box component="form" onSubmit={handle_submit} className="despensa-form">
      <FormGroup>
        <FormLabel>Nombre del Alimento</FormLabel>
        <CampoTexto
          etiqueta=""
          valor={nombre}
          on_change={handle_nombre_change}
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
            on_change={handle_cantidad_change}
            tipo="number"
            requerido
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Unidad</FormLabel>
          <SelectControl 
            value={unidad}
            onChange={handle_unidad_change}
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
    </Box>
  );
};
