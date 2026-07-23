import { useEffect } from 'react';
import type { PantryItem, ShoppingItem, MealPlanDay } from '../types';

export const useLocalStorageSync = (
  pantry_items: PantryItem[],
  shopping_items: ShoppingItem[],
  meal_plan: MealPlanDay[],
  hide_breakfasts: boolean,
  show_quejometro: boolean,
  cooked_days: number[]
) => {
  useEffect(() => {
    localStorage.setItem('local_pantry', JSON.stringify(pantry_items));
  }, [pantry_items]);

  useEffect(() => {
    localStorage.setItem('local_shopping', JSON.stringify(shopping_items));
  }, [shopping_items]);

  useEffect(() => {
    localStorage.setItem('local_plan', JSON.stringify(meal_plan));
  }, [meal_plan]);

  useEffect(() => {
    localStorage.setItem('calla_y_come_hide_breakfasts', String(hide_breakfasts));
  }, [hide_breakfasts]);

  useEffect(() => {
    localStorage.setItem('calla_y_come_show_quejometro', String(show_quejometro));
  }, [show_quejometro]);

  useEffect(() => {
    localStorage.setItem('calla_y_come_cooked_days', JSON.stringify(cooked_days));
  }, [cooked_days]);
};
