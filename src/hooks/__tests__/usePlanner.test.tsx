import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePlanner } from '../usePlanner';
import { get_supabase_client } from '../../services/supabase_client';
import type { MealPlanDay, Profile } from '../../types';
import type { User } from '@supabase/supabase-js';

// Mock get_supabase_client
vi.mock('../../services/supabase_client', () => ({
  get_supabase_client: vi.fn()
}));

describe('usePlanner hook', () => {
  const mockSetMealPlan = vi.fn();
  const mockSetStartDate = vi.fn();
  const mockSetPantryItems = vi.fn();
  const mockTriggerPush = vi.fn();
  const mockGetPantryMatchInfo = vi.fn().mockReturnValue({ matches: 0, pct: 0 });
  const mockGetFilteredRecipes = vi.fn().mockReturnValue([]);

  const mockUser = { id: 'user-789' } as User;
  const mockFamilyProfile = { active_family_id: 'family-123' } as Profile;
  const mockIndividualProfile = { active_family_id: null } as Profile;

  const mockMealPlan: MealPlanDay[] = [
    { day: 1, desayuno: [1], comida: [2], cena: [] }
  ];

  // Helper mock builder for Supabase queries
  const createSupabaseMock = (responseData: any = null, responseError: any = null) => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.is = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: responseData, error: responseError });
    chain.then = (onfulfilled: any) => Promise.resolve({ data: responseData, error: responseError }).then(onfulfilled);
    return {
      from: vi.fn().mockReturnValue(chain),
      auth: { getSession: vi.fn() }
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('load_planner_data in family mode queries by family_id', async () => {
    const mockDb = createSupabaseMock([]);
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => usePlanner({
      meal_plan: mockMealPlan,
      set_meal_plan: mockSetMealPlan,
      start_date: '2026-07-17',
      set_start_date: mockSetStartDate,
      pantry_items: [],
      set_pantry_items: mockSetPantryItems,
      shopping_items: [],
      profile: mockFamilyProfile,
      trigger_push: mockTriggerPush,
      get_pantry_match_info: mockGetPantryMatchInfo,
      get_filtered_recipes: mockGetFilteredRecipes,
      user: mockUser
    }));

    await result.current.load_planner_data('family-123');

    expect(mockDb.from).toHaveBeenCalledWith('meal_plans');
    const chain = mockDb.from('meal_plans');
    expect(chain.eq).toHaveBeenCalledWith('family_id', 'family-123');
  });

  test('load_planner_data in individual mode queries by user_id and filters family_id as null', async () => {
    const mockDb = createSupabaseMock([]);
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => usePlanner({
      meal_plan: mockMealPlan,
      set_meal_plan: mockSetMealPlan,
      start_date: '2026-07-17',
      set_start_date: mockSetStartDate,
      pantry_items: [],
      set_pantry_items: mockSetPantryItems,
      shopping_items: [],
      profile: mockIndividualProfile,
      trigger_push: mockTriggerPush,
      get_pantry_match_info: mockGetPantryMatchInfo,
      get_filtered_recipes: mockGetFilteredRecipes,
      user: mockUser
    }));

    await result.current.load_planner_data(null, 'user-789');

    expect(mockDb.from).toHaveBeenCalledWith('meal_plans');
    const chain = mockDb.from('meal_plans');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-789');
    expect(chain.is).toHaveBeenCalledWith('family_id', null);
  });

  test('handle_clear_plan in family mode deletes by family_id', async () => {
    const mockDb = createSupabaseMock();
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => usePlanner({
      meal_plan: mockMealPlan,
      set_meal_plan: mockSetMealPlan,
      start_date: '2026-07-17',
      set_start_date: mockSetStartDate,
      pantry_items: [],
      set_pantry_items: mockSetPantryItems,
      shopping_items: [],
      profile: mockFamilyProfile,
      trigger_push: mockTriggerPush,
      get_pantry_match_info: mockGetPantryMatchInfo,
      get_filtered_recipes: mockGetFilteredRecipes,
      user: mockUser
    }));

    await result.current.handle_clear_plan();

    const chain = mockDb.from('meal_plans');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('family_id', 'family-123');
  });

  test('handle_clear_plan in individual mode deletes by user_id where family_id is null', async () => {
    const mockDb = createSupabaseMock();
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => usePlanner({
      meal_plan: mockMealPlan,
      set_meal_plan: mockSetMealPlan,
      start_date: '2026-07-17',
      set_start_date: mockSetStartDate,
      pantry_items: [],
      set_pantry_items: mockSetPantryItems,
      shopping_items: [],
      profile: mockIndividualProfile,
      trigger_push: mockTriggerPush,
      get_pantry_match_info: mockGetPantryMatchInfo,
      get_filtered_recipes: mockGetFilteredRecipes,
      user: mockUser
    }));

    await result.current.handle_clear_plan();

    const chain = mockDb.from('meal_plans');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-789');
    expect(chain.is).toHaveBeenCalledWith('family_id', null);
  });

  test('handle_auto_generate_plan selects weighted recipes based on votes', async () => {
    const mockDb = createSupabaseMock();
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const mockGetRecipeVotes = vi.fn((id: number) => {
      if (id === 1) return 100; // highly weighted
      return 0;
    });

    const testRecipes = [
      { id: 1, name: 'Desayuno Fav', meal_type: 'desayuno', ingredients: [] },
      { id: 2, name: 'Desayuno Normal', meal_type: 'desayuno', ingredients: [] },
      { id: 3, name: 'Comida', meal_type: 'comida', ingredients: [] },
      { id: 4, name: 'Cena', meal_type: 'cena', ingredients: [] }
    ];

    const { result } = renderHook(() => usePlanner({
      meal_plan: [],
      set_meal_plan: mockSetMealPlan,
      start_date: '2026-07-17',
      set_start_date: mockSetStartDate,
      pantry_items: [],
      set_pantry_items: mockSetPantryItems,
      shopping_items: [],
      profile: mockIndividualProfile,
      trigger_push: mockTriggerPush,
      get_pantry_match_info: mockGetPantryMatchInfo,
      get_filtered_recipes: mockGetFilteredRecipes,
      get_recipe_votes: mockGetRecipeVotes,
      user: mockUser
    }));

    await result.current.handle_auto_generate_plan(testRecipes as any);

    expect(mockGetRecipeVotes).toHaveBeenCalled();
    expect(mockSetMealPlan).toHaveBeenCalled();
  });
});
