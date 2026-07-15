import { Heart, TrendingDown, TrendingUp } from 'lucide-react';
import type { FilterState } from '../../types';
import { Dialogo } from './Dialogo';
import { Boton } from './Boton';
import { FilterSection } from './FilterSection';
import { FilterSectionTitle } from './FilterSectionTitle';
import { FilterGrid } from './FilterGrid';
import { FilterGridFour } from './FilterGridFour';
import { FilterPillButton } from './FilterPillButton';

interface ModalFiltrosProps {
  abierto: boolean;
  on_close: () => void;
  filtros: FilterState;
  set_filtros: React.Dispatch<React.SetStateAction<FilterState>>;
  toggle_alergia: (alergia: string) => void;
  toggle_dieta: (dieta: string) => void;
  on_aplicar: () => void;
}

export const ModalFiltros = ({
  abierto,
  on_close,
  filtros,
  set_filtros,
  toggle_alergia,
  toggle_dieta,
  on_aplicar
}: ModalFiltrosProps) => {
  const set_ingredients_count = (valor: 'all' | 'few' | 'many'): void => {
    set_filtros(prev => ({ ...prev, ingredients_count: valor }));
  };

  const set_price = (valor: 'all' | 'economica' | 'cara'): void => {
    set_filtros(prev => ({ ...prev, price: valor }));
  };

  const set_difficulty = (valor: 'all' | 'facil' | 'intermedia' | 'dificil'): void => {
    set_filtros(prev => ({ ...prev, difficulty: valor }));
  };

  const set_health = (valor: 'all' | 'saludable' | 'no saludable'): void => {
    set_filtros(prev => ({ ...prev, health: valor }));
  };

  return (
    <Dialogo
      abierto={abierto}
      on_close={on_close}
      titulo="Filtros de Recetas"
    >
      <FilterSection>
        <FilterSectionTitle>Cantidad de Ingredientes</FilterSectionTitle>
        <FilterGrid>
          <FilterPillButton
            active={filtros.ingredients_count === 'all'}
            onClick={() => set_ingredients_count('all')}
          >
            Cualquiera
          </FilterPillButton>
          <FilterPillButton
            active={filtros.ingredients_count === 'few'}
            onClick={() => set_ingredients_count('few')}
          >
            Pocos (≤ 5)
          </FilterPillButton>
          <FilterPillButton
            active={filtros.ingredients_count === 'many'}
            onClick={() => set_ingredients_count('many')}
          >
            Muchos (&gt; 5)
          </FilterPillButton>
        </FilterGrid>
      </FilterSection>

      <FilterSection>
        <FilterSectionTitle>Tipo de Alimentación</FilterSectionTitle>
        <FilterGrid>
          {[
            { id: 'omnivoro', label: 'Omnívoro' },
            { id: 'vegetariano', label: 'Vegetariano' },
            { id: 'vegano', label: 'Vegano' },
            { id: 'pescetariano', label: 'Pescetariano' },
            { id: 'keto', label: 'Keto' },
            { id: 'paleo', label: 'Paleo' },
            { id: 'sin_gluten', label: 'Sin Gluten' },
            { id: 'sin_lactosa', label: 'Sin Lactosa' },
            { id: 'mediterranea', label: 'Mediterranea' }
          ].map(diet => (
            <FilterPillButton
              key={diet.id}
              active={filtros.diets.includes(diet.id)}
              onClick={() => toggle_dieta(diet.id)}
            >
              {diet.label}
            </FilterPillButton>
          ))}
        </FilterGrid>
      </FilterSection>

      <FilterSection>
        <FilterSectionTitle>Evitar Alérgenos</FilterSectionTitle>
        <FilterGrid>
          {['gluten', 'lactosa', 'frutos secos', 'pescado', 'soja'].map(alergia => (
            <FilterPillButton
              key={alergia}
              active={filtros.allergies.includes(alergia)}
              onClick={() => toggle_alergia(alergia)}
            >
              Sin {alergia}
            </FilterPillButton>
          ))}
        </FilterGrid>
      </FilterSection>

      <FilterSection>
        <FilterSectionTitle>Precio de la Receta</FilterSectionTitle>
        <FilterGrid>
          <FilterPillButton
            active={filtros.price === 'all'}
            onClick={() => set_price('all')}
          >
            Todos
          </FilterPillButton>
          <FilterPillButton
            active={filtros.price === 'economica'}
            onClick={() => set_price('economica')}
          >
            <TrendingDown size={14} /> Económico
          </FilterPillButton>
          <FilterPillButton
            active={filtros.price === 'cara'}
            onClick={() => set_price('cara')}
          >
            <TrendingUp size={14} /> Caro
          </FilterPillButton>
        </FilterGrid>
      </FilterSection>

      <FilterSection>
        <FilterSectionTitle>Dificultad</FilterSectionTitle>
        <FilterGridFour>
          <FilterPillButton
            active={filtros.difficulty === 'all'}
            onClick={() => set_difficulty('all')}
          >
            Cualquiera
          </FilterPillButton>
          <FilterPillButton
            active={filtros.difficulty === 'facil'}
            onClick={() => set_difficulty('facil')}
          >
            Fácil
          </FilterPillButton>
          <FilterPillButton
            active={filtros.difficulty === 'intermedia'}
            onClick={() => set_difficulty('intermedia')}
          >
            Media
          </FilterPillButton>
          <FilterPillButton
            active={filtros.difficulty === 'dificil'}
            onClick={() => set_difficulty('dificil')}
          >
            Difícil
          </FilterPillButton>
        </FilterGridFour>
      </FilterSection>

      <FilterSection>
        <FilterSectionTitle>Saludable</FilterSectionTitle>
        <FilterGrid>
          <FilterPillButton
            active={filtros.health === 'all'}
            onClick={() => set_health('all')}
          >
            Todos
          </FilterPillButton>
          <FilterPillButton
            active={filtros.health === 'saludable'}
            onClick={() => set_health('saludable')}
          >
            <Heart size={14} /> Saludable
          </FilterPillButton>
          <FilterPillButton
            active={filtros.health === 'no saludable'}
            onClick={() => set_health('no saludable')}
          >
            Menos saludable
          </FilterPillButton>
        </FilterGrid>
      </FilterSection>

      <Boton
        texto="Aplicar Preferencias"
        on_click={on_aplicar}
        variante="contained"
        color="primary"
        clase_css="btn-apply-filters"
      />
    </Dialogo>
  );
};

