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

export const get_current_planner_day = (startDate: string | null): number | null => {
  if (!startDate) return null;
  try {
    const [year, month, day] = startDate.split('-').map(Number);
    const start = new Date(year, month - 1, day);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = diffDays + 1;

    // Return the actual calculated day number (could be > 30 if past)
    return currentDay;
  } catch (e) {
    console.error(e);
  }
  return null;
};

export interface ActiveWeekInfo {
  week_number: number;
  start_day: number;
  end_day: number;
  label: string;
}

export const get_active_week_info = (current_day: number | null): ActiveWeekInfo => {
  if (!current_day || current_day < 1) {
    return { week_number: 1, start_day: 1, end_day: 7, label: "Semana 1 (Días 1-7)" };
  }
  if (current_day <= 7) {
    return { week_number: 1, start_day: 1, end_day: 7, label: "Semana 1 (Días 1-7)" };
  }
  if (current_day <= 14) {
    return { week_number: 2, start_day: 8, end_day: 14, label: "Semana 2 (Días 8-14)" };
  }
  if (current_day <= 21) {
    return { week_number: 3, start_day: 15, end_day: 21, label: "Semana 3 (Días 15-21)" };
  }
  // Return Week 4 for days 22 to 30 (or even past it)
  return { week_number: 4, start_day: 22, end_day: 30, label: "Semana 4 (Días 22-30)" };
};
