import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Planner } from '../Planner';
import type { MealPlanDay, Recipe } from '../../../types';

// Mock use_app_state hook to avoid connecting to Supabase in tests
vi.mock('../../../hooks/useGlobalState', () => ({
  useGlobalState: () => ({
    suggestions: [],
    handle_approve_suggestion: vi.fn(),
    handle_reject_suggestion: vi.fn(),
    handle_vote_suggestion: vi.fn(),
    get_panic_recipe: vi.fn().mockReturnValue(null),
    pantry_items: [],
    profile: { active_family_id: 'family-123' }
  })
}));

describe('Planner Component', () => {
  const mockAutoGenerate = vi.fn();
  const mockClear = vi.fn();
  const mockOpenFilters = vi.fn();
  const mockSlotClick = vi.fn();
  const mockSlotClear = vi.fn();
  const mockAddSlot = vi.fn();
  const mockRemoveSlot = vi.fn();
  const mockMoveSlot = vi.fn();
  const mockChangeStartDate = vi.fn();
  const mockCook = vi.fn();
  const mockGetMembers = vi.fn().mockResolvedValue([]);
  const mockGetComplaints = vi.fn().mockResolvedValue({});
  const mockOpenNevera = vi.fn();

  const mockMealPlan: MealPlanDay[] = [
    { day: 1, desayuno: [1], comida: [2], cena: [] }
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

  test('renders planner and configures portions/leftovers per recipe', async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    render(
      <Planner
        meal_plan={mockMealPlan}
        recipes={mockRecipes}
        on_auto_generate={mockAutoGenerate}
        on_clear={mockClear}
        on_open_filters={mockOpenFilters}
        on_slot_click={mockSlotClick}
        on_slot_clear={mockSlotClear}
        on_add_slot={mockAddSlot}
        on_remove_slot={mockRemoveSlot}
        on_move_slot={mockMoveSlot}
        current_role="cocinitas"
        pending_suggestions={0}
        start_date={todayStr}
        on_change_start_date={mockChangeStartDate}
        on_cook={mockCook}
        get_family_members={mockGetMembers}
        get_family_complaints={mockGetComplaints}
        on_open_nevera={mockOpenNevera}
        hide_breakfasts={false}
        set_hide_breakfasts={vi.fn()}
        show_quejometro={true}
        set_show_quejometro={vi.fn()}
        cooked_days={[]}
      />
    );

    // Wait for the async family/complaints load inside act to avoid warnings
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify Title renders
    expect(screen.getByText('Planificación 30 Días')).toBeInTheDocument();

    // Verify "Marcar como Cocinado" button is visible for current day (Day 1)
    const cookButton = screen.getByText('Marcar como Cocinado/Comido 🍽️');
    expect(cookButton).toBeInTheDocument();

    // Click to open the cook dialogue
    await act(async () => {
      fireEvent.click(cookButton);
    });

    // Verify Dialogue Header and description are visible
    expect(screen.getByText('🍽️ Marcar día como Cocinado')).toBeInTheDocument();
    expect(screen.getByText(/Ajusta para cuántas raciones has cocinado cada plato/i)).toBeInTheDocument();

    // Verify both day recipes are listed in the modal
    expect(screen.getAllByText('Tostadas').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Lentejas').length).toBeGreaterThanOrEqual(1);

    // Test portions increment/decrement for Tostadas (desayuno)
    // There are portions and leftovers counters for both recipes.
    // The portion counters default to 1, leftover counters default to 0.
    // Let's test the + button for portions on Tostadas.
    // In our component, we render portions first then leftovers. We can find button with + text.
    // We have four buttons with "+" text (portions and leftovers for two recipes).
    const plusButtons = screen.getAllByText('+');
    const minusButtons = screen.getAllByText('-');
    
    // Tostadas Portions is index 0 of plusButtons
    await act(async () => {
      fireEvent.click(plusButtons[0]); // Increment portions from 1 to 2
    });
    await act(async () => {
      fireEvent.click(plusButtons[0]); // Increment portions from 2 to 3
    });
    await act(async () => {
      fireEvent.click(minusButtons[0]); // Decrement portions from 3 to 2
    });

    // Tostadas Leftovers is index 1 of plusButtons
    await act(async () => {
      fireEvent.click(plusButtons[1]); // Increment leftovers from 0 to 1
    });

    // Click confirm cook button
    const confirmButton = screen.getByText('Confirmar y Cocinar 🍽️');
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Verify callback was invoked with correct configs:
    // Tostadas (ID 1): portions=2, leftovers=1
    // Lentejas (ID 2): portions=1, leftovers=0 (defaults)
    expect(mockCook).toHaveBeenCalledWith(
      1,
      [
        { recipe_id: 1, portions: 2, leftovers: 1 },
        { recipe_id: 2, portions: 1, leftovers: 0 }
      ]
    );
  });
});
