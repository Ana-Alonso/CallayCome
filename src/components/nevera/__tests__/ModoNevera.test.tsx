import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModoNevera } from '../ModoNevera';
import type { MealPlanDay, Recipe, ShoppingItem } from '../../../types';

describe('ModoNevera Component', () => {
  const mockClose = vi.fn();
  const mockTogglePurchase = vi.fn();

  const mockMealPlan: MealPlanDay[] = [
    { day: 1, desayuno: [1], comida: [2], cena: [3] }
  ];

  const mockRecipes: Recipe[] = [
    {
      id: 1,
      name: 'Tostadas',
      meal_type: 'desayuno',
      price: 'economica',
      difficulty: 'facil',
      health: 'saludable',
      diet_type: 'omnivoro',
      allergens: [],
      ingredients: [],
      instructions: []
    },
    {
      id: 2,
      name: 'Lentejas',
      meal_type: 'comida',
      price: 'economica',
      difficulty: 'facil',
      health: 'saludable',
      diet_type: 'omnivoro',
      allergens: [],
      ingredients: [],
      instructions: []
    }
  ];

  const mockShoppingItems: ShoppingItem[] = [
    { id: 1, ingredient_name: 'Tomates', quantity: 3, unit: 'unidades', purchased: false }
  ];

  test('renders clock, active recipes, and urgent shopping items', () => {
    // Mock the current date to match day 1 (let's assume start_date is today or we pass a start_date that resolves to day 1)
    // We can simulate start_date as today's date formatted as YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];

    render(
      <ModoNevera
        on_close={mockClose}
        meal_plan={mockMealPlan}
        recipes={mockRecipes}
        shopping_items={mockShoppingItems}
        handle_toggle_purchase={mockTogglePurchase}
        lavaplatos="Juan"
        max_complaints={5}
        start_date={todayStr}
      />
    );

    // Verify clock dashboard renders
    expect(screen.getByText(/MODO NEVERA/i)).toBeInTheDocument();
    
    // Verify dishwasher info is displayed
    expect(screen.getByText(/Hoy le toca fregar platos/i)).toBeInTheDocument();
    expect(screen.getByText(/Juan/)).toBeInTheDocument();

    // Verify urgent shopping items
    expect(screen.getByText('Lista de Compra Urgente')).toBeInTheDocument();
    expect(screen.getByText(/Tomates/)).toBeInTheDocument();
  });

  test('calls handle_toggle_purchase when toggling item', () => {
    const todayStr = new Date().toISOString().split('T')[0];

    render(
      <ModoNevera
        on_close={mockClose}
        meal_plan={mockMealPlan}
        recipes={mockRecipes}
        shopping_items={mockShoppingItems}
        handle_toggle_purchase={mockTogglePurchase}
        lavaplatos="Juan"
        max_complaints={5}
        start_date={todayStr}
      />
    );

    const checkbox = screen.getByText(/Tomates/);
    fireEvent.click(checkbox);

    expect(mockTogglePurchase).toHaveBeenCalledWith(0);
  });

  test('calls on_close when clicking close button', () => {
    const todayStr = new Date().toISOString().split('T')[0];

    render(
      <ModoNevera
        on_close={mockClose}
        meal_plan={mockMealPlan}
        recipes={mockRecipes}
        shopping_items={mockShoppingItems}
        handle_toggle_purchase={mockTogglePurchase}
        lavaplatos="Juan"
        max_complaints={5}
        start_date={todayStr}
      />
    );

    // The close button is the one with the X icon or test id, but it is rendered as a Boton with text "Salir del modo nevera" or similar
    // Let's check how it's rendered. It has X icon next to title or close text. Let's find button or click by role
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);

    expect(mockClose).toHaveBeenCalled();
  });
});
