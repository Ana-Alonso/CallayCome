import type { Recipe } from '../../types';
import { Dialogo } from '../common/Dialogo';
import { Box } from '../common/Box';
import { TextMuted, Spacer, FlexRow } from '../common';

interface RecipeDetailDialogProps {
  recipe: Recipe | null;
  abierto: boolean;
  al_cerrar: () => void;
}

const DIET_LABELS: Record<string, string> = {
  omnivoro: '🍖 Omnívoro',
  vegetariano: '🥦 Vegetariano',
  vegano: '🌱 Vegano',
  pescetariano: '🐟 Pescetariano',
  keto: '🥑 Keto',
  paleo: '🦕 Paleo',
  sin_gluten: '🌾 Sin Gluten',
  sin_lactosa: '🥛 Sin Lactosa',
  mediterranea: '🫒 Mediterránea',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  facil: '🟢 Fácil',
  intermedia: '🟡 Intermedia',
  dificil: '🔴 Difícil',
};

const PRICE_LABELS: Record<string, string> = {
  economica: '💚 Económica',
  cara: '💛 Premium',
};

const tag_style = (color: string, bg?: string): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: 20,
  border: `1px solid ${color}40`,
  backgroundColor: bg || `${color}20`,
  color: color,
  whiteSpace: 'nowrap',
});

export const RecipeDetailDialog = ({ recipe, abierto, al_cerrar }: RecipeDetailDialogProps) => {
  if (!recipe) return null;

  return (
    <Dialogo
      abierto={abierto}
      on_close={al_cerrar}
      titulo={recipe.name}
    >
      <Box style={{ minWidth: '320px', maxWidth: '560px', maxHeight: '70vh', overflowY: 'auto' }}>

        {/* Tags */}
        <FlexRow style={{ gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={tag_style('#4caf50')}>{DIET_LABELS[recipe.diet_type] || recipe.diet_type}</span>
          <span style={tag_style('#ff9800')}>{DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty}</span>
          <span style={tag_style('#2196f3')}>{PRICE_LABELS[recipe.price] || recipe.price}</span>
          <span style={tag_style(recipe.health === 'saludable' ? '#4caf50' : '#f44336')}>
            {recipe.health === 'saludable' ? '✅ Saludable' : '⚠️ Indulgente'}
          </span>
        </FlexRow>

        {/* Alergenos */}
        {recipe.allergens && recipe.allergens.length > 0 && (
          <>
            <TextMuted style={{ fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              ⚠️ Alérgenos
            </TextMuted>
            <FlexRow style={{ gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {recipe.allergens.map(a => (
                <span key={a} style={tag_style('#ef5350', 'rgba(239,83,80,0.15)')}>{a}</span>
              ))}
            </FlexRow>
          </>
        )}

        {/* Ingredientes */}
        <TextMuted style={{ fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          🛒 Ingredientes ({recipe.ingredients.length})
        </TextMuted>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '6px 12px',
          marginBottom: 20,
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: 12
        }}>
          {recipe.ingredients.map((ing, idx) => (
            <FlexRow key={idx} style={{ justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{ing.name}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                {ing.quantity} {ing.unit}
              </span>
            </FlexRow>
          ))}
        </div>

        {/* Pasos */}
        <TextMuted style={{ fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          👨‍🍳 Elaboración ({recipe.instructions.length} pasos)
        </TextMuted>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recipe.instructions.map((step, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <span style={{
                minWidth: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: 'rgba(242,104,65,0.2)',
                border: '1px solid rgba(242,104,65,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#f26841',
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <Spacer height={8} />
      </Box>
    </Dialogo>
  );
};
