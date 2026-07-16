import type { MealPlanDay } from '../types';

/**
 * Converts an ISO date string (YYYY-MM-DD) to the display format DD/MM/YYYY.
 * Returns an empty string if the input is null or invalid.
 */
export const format_date_display = (iso_date: string | null | undefined): string => {
  if (!iso_date) return '';
  const parts = iso_date.split('-');
  if (parts.length !== 3) return iso_date;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/**
 * Converts a display date string (DD/MM/YYYY) back to ISO format (YYYY-MM-DD).
 * Returns an empty string if the input is invalid.
 */
export const parse_display_date = (display_date: string): string => {
  if (!display_date) return '';
  const parts = display_date.split('/');
  if (parts.length !== 3) return display_date;
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
};


export const create_empty_day_plan = (day: number): MealPlanDay => ({
  day,
  desayuno: [null],
  comida: [null],
  cena: [null]
});

export const ensure_slot_array = (value: unknown): Array<number | null> => {
  if (Array.isArray(value)) {
    const normalized = value.map(item => {
      if (item === null || item === undefined) return null;
      const n = Number(item); // coerce string bigints from Supabase JSONB
      return Number.isFinite(n) ? n : null;
    });
    return normalized.length > 0 ? normalized : [null];
  }
  if (value !== null && value !== undefined) {
    const n = Number(value);
    if (Number.isFinite(n)) return [n];
  }
  return [null];
};

export const normalize_day_plan = (value: unknown, day: number): MealPlanDay => {
  const row = (value || {}) as {
    desayuno?: unknown;
    comida?: unknown;
    cena?: unknown;
    desayuno_slots?: unknown;
    comida_slots?: unknown;
    cena_slots?: unknown;
  };

  return {
    day,
    desayuno: ensure_slot_array(row.desayuno_slots ?? row.desayuno),
    comida: ensure_slot_array(row.comida_slots ?? row.comida),
    cena: ensure_slot_array(row.cena_slots ?? row.cena)
  };
};

export const serialize_day_plan_for_db = (dayPlan: MealPlanDay) => ({
  day: dayPlan.day,
  desayuno: dayPlan.desayuno[0] ?? null,
  comida: dayPlan.comida[0] ?? null,
  cena: dayPlan.cena[0] ?? null,
  desayuno_slots: dayPlan.desayuno,
  comida_slots: dayPlan.comida,
  cena_slots: dayPlan.cena
});
