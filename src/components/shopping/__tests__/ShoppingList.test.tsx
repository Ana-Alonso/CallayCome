import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShoppingList } from '../ShoppingList';
import type { ShoppingItem } from '../../../types';

describe('ShoppingList Component', () => {
  const mockRecalculate = vi.fn();
  const mockToggle = vi.fn();
  const mockAddCustom = vi.fn();

  const mockItems: ShoppingItem[] = [
    { id: 1, ingredient_name: 'Tomates', quantity: 3, unit: 'unidades', purchased: false, manual: false },
    { id: 2, ingredient_name: 'Servilletas', quantity: 2, unit: 'uds', purchased: false, manual: true }
  ];

  test('renders calculated and manual items correctly', () => {
    render(
      <ShoppingList
        shopping_items={mockItems}
        on_recalculate={mockRecalculate}
        on_toggle={mockToggle}
        on_add_custom={mockAddCustom}
        start_date={null}
      />
    );

    // Verify list headers and summary count
    expect(screen.getByText('Lista de la Compra')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // count of items in total/pendientes stats

    // Verify items are displayed
    expect(screen.getByText('Tomates')).toBeInTheDocument();
    expect(screen.getByText('Servilletas')).toBeInTheDocument();
    expect(screen.getByText('comprar 3 unidades')).toBeInTheDocument();
    expect(screen.getByText('comprar 2 uds')).toBeInTheDocument();
  });

  test('calls on_add_custom when adding a manual item', () => {
    render(
      <ShoppingList
        shopping_items={mockItems}
        on_recalculate={mockRecalculate}
        on_toggle={mockToggle}
        on_add_custom={mockAddCustom}
        start_date={null}
      />
    );

    const inputName = screen.getByPlaceholderText('Ej: Servilletas');
    const inputQty = screen.getByRole('spinbutton');
    const inputUnit = screen.getByPlaceholderText('uds');
    const addButton = screen.getByRole('button', { name: 'Añadir' });

    fireEvent.change(inputName, { target: { value: 'Leche' } });
    fireEvent.change(inputQty, { target: { value: '4' } });
    fireEvent.change(inputUnit, { target: { value: 'litros' } });

    fireEvent.click(addButton);

    expect(mockAddCustom).toHaveBeenCalledWith('Leche', 4, 'litros');
  });

  test('calls on_toggle when clicking on a shopping item card', () => {
    render(
      <ShoppingList
        shopping_items={mockItems}
        on_recalculate={mockRecalculate}
        on_toggle={mockToggle}
        on_add_custom={mockAddCustom}
        start_date={null}
      />
    );

    const itemCard = screen.getByText('Tomates');
    fireEvent.click(itemCard);

    expect(mockToggle).toHaveBeenCalledWith(0); // Tomates is index 0
  });
});
