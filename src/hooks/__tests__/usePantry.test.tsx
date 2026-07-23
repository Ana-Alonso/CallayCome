import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePantry } from '../usePantry';
import { get_supabase_client } from '../../services/supabase_client';
import type { Profile } from '../../types';
import type { User } from '@supabase/supabase-js';

// Mock get_supabase_client
vi.mock('../../services/supabase_client', () => ({
  get_supabase_client: vi.fn()
}));

describe('usePantry hook', () => {
  const mockSetPantryItems = vi.fn();
  const mockTriggerPush = vi.fn();

  const mockUser = { id: 'user-789' } as User;
  const mockFamilyProfile = { active_family_id: 'family-123' } as Profile;
  const mockIndividualProfile = { active_family_id: null } as Profile;

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
      from: vi.fn().mockReturnValue(chain)
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('load_pantry_data in family mode queries by family_id', async () => {
    const mockDb = createSupabaseMock([]);
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => usePantry({
      pantry_items: [],
      set_pantry_items: mockSetPantryItems,
      profile: mockFamilyProfile,
      trigger_push: mockTriggerPush,
      user: mockUser
    }));

    await result.current.load_pantry_data('family-123');

    expect(mockDb.from).toHaveBeenCalledWith('pantry');
    const chain = mockDb.from('pantry');
    expect(chain.eq).toHaveBeenCalledWith('family_id', 'family-123');
  });

  test('load_pantry_data in individual mode queries by user_id and filters family_id as null', async () => {
    const mockDb = createSupabaseMock([]);
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => usePantry({
      pantry_items: [],
      set_pantry_items: mockSetPantryItems,
      profile: mockIndividualProfile,
      trigger_push: mockTriggerPush,
      user: mockUser
    }));

    await result.current.load_pantry_data(null, 'user-789');

    expect(mockDb.from).toHaveBeenCalledWith('pantry');
    const chain = mockDb.from('pantry');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-789');
    expect(chain.is).toHaveBeenCalledWith('family_id', null);
  });

  test('handle_add_pantry in family mode inserts with family_id', async () => {
    const mockDb = createSupabaseMock({ id: 50, ingredient_name: 'Manzana', quantity: 2, unit: 'uds' });
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => usePantry({
      pantry_items: [],
      set_pantry_items: mockSetPantryItems,
      profile: mockFamilyProfile,
      trigger_push: mockTriggerPush,
      user: mockUser
    }));

    await result.current.handle_add_pantry('Manzana', 2, 'uds');

    const chain = mockDb.from('pantry');
    expect(chain.insert).toHaveBeenCalledWith([{
      family_id: 'family-123',
      ingredient_name: 'Manzana',
      quantity: 2,
      unit: 'uds'
    }]);
  });

  test('handle_add_pantry in individual mode inserts with user_id', async () => {
    const mockDb = createSupabaseMock({ id: 51, ingredient_name: 'Plátano', quantity: 3, unit: 'uds' });
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => usePantry({
      pantry_items: [],
      set_pantry_items: mockSetPantryItems,
      profile: mockIndividualProfile,
      trigger_push: mockTriggerPush,
      user: mockUser
    }));

    await result.current.handle_add_pantry('Plátano', 3, 'uds');

    const chain = mockDb.from('pantry');
    expect(chain.insert).toHaveBeenCalledWith([{
      user_id: 'user-789',
      ingredient_name: 'Plátano',
      quantity: 3,
      unit: 'uds'
    }]);
  });
});
