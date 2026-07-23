import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSuggestions } from '../useSuggestions';
import { get_supabase_client } from '../../services/supabase_client';
import type { Profile, Recipe } from '../../types';
import type { User } from '@supabase/supabase-js';

// Mock get_supabase_client
vi.mock('../../services/supabase_client', () => ({
  get_supabase_client: vi.fn()
}));

describe('useSuggestions hook', () => {
  const mockSetSuggestions = vi.fn();
  const mockTriggerPush = vi.fn();
  const mockLoadFamilyData = vi.fn();

  const mockUser = { id: 'user-789' } as User;
  const mockProfile = { active_family_id: 'family-123' } as Profile;

  const mockRecipes: Recipe[] = [
    {
      id: 10,
      name: 'Lentejas Ricas',
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

  const createSupabaseMock = (responseData: any = null, responseError: any = null) => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: responseData, error: responseError });
    chain.then = (onfulfilled: any) => Promise.resolve({ data: responseData, error: responseError }).then(onfulfilled);
    return {
      from: vi.fn().mockReturnValue(chain)
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('load_suggestions_data extracts recipe_name from array-format relation s.recipes', async () => {
    // Mock the suggestion return payload with recipes relation as an array
    const mockSuggestionsPayload = [
      {
        id: 1,
        family_id: 'family-123',
        day: 5,
        meal_type: 'comida',
        suggested_recipe_id: 10,
        suggested_by: 'user-2',
        status: 'pendiente',
        profiles: { display_name: 'Ana' },
        recipes: [
          {
            name: 'Lentejas de la abuela'
          }
        ]
      }
    ];

    const mockDb = createSupabaseMock(mockSuggestionsPayload);
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => useSuggestions({
      user: mockUser,
      profile: mockProfile,
      trigger_push: mockTriggerPush,
      load_family_data: mockLoadFamilyData,
      set_suggestions: mockSetSuggestions,
      recipes: mockRecipes
    }));

    await result.current.load_suggestions_data('family-123', 'user-789');

    // Verify it maps correctly and uses the first element of recipes array
    expect(mockSetSuggestions).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 1,
        recipe_name: 'Lentejas de la abuela' // preferred from s.recipes[0]
      })
    ]);
  });

  test('load_suggestions_data extracts recipe_name from object-format relation s.recipes', async () => {
    // Mock the suggestion return payload with recipes relation as a single object
    const mockSuggestionsPayload = [
      {
        id: 2,
        family_id: 'family-123',
        day: 6,
        meal_type: 'cena',
        suggested_recipe_id: 10,
        suggested_by: 'user-3',
        status: 'pendiente',
        profiles: { display_name: 'Luis' },
        recipes: {
          name: 'Sopa Caliente'
        }
      }
    ];

    const mockDb = createSupabaseMock(mockSuggestionsPayload);
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => useSuggestions({
      user: mockUser,
      profile: mockProfile,
      trigger_push: mockTriggerPush,
      load_family_data: mockLoadFamilyData,
      set_suggestions: mockSetSuggestions,
      recipes: mockRecipes
    }));

    await result.current.load_suggestions_data('family-123', 'user-789');

    // Verify it maps correctly and uses s.recipes object
    expect(mockSetSuggestions).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 2,
        recipe_name: 'Sopa Caliente' // preferred from s.recipes object
      })
    ]);
  });
});
