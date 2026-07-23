import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShopping } from '../useShopping';
import { get_supabase_client } from '../../services/supabase_client';
import type { Profile } from '../../types';
import type { User } from '@supabase/supabase-js';

// Mock get_supabase_client
vi.mock('../../services/supabase_client', () => ({
  get_supabase_client: vi.fn()
}));

describe('useShopping hook', () => {
  const mockSetShoppingItems = vi.fn();
  const mockTriggerPush = vi.fn();
  const mockHandleAddPantry = vi.fn();

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
    chain.then = (onfulfilled: any) => {
      const isFamilyMembers = chain.table === 'family_members';
      const resolvedData = isFamilyMembers ? [] : responseData;
      return Promise.resolve({ data: resolvedData, error: responseError }).then(onfulfilled);
    };
    return {
      from: vi.fn().mockImplementation((table) => {
        chain.table = table;
        return chain;
      })
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('load_shopping_data in family mode queries by family_id', async () => {
    const mockDb = createSupabaseMock([]);
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => useShopping({
      shopping_items: [],
      set_shopping_items: mockSetShoppingItems,
      profile: mockFamilyProfile,
      trigger_push: mockTriggerPush,
      start_date: '2026-07-17',
      handle_add_pantry: mockHandleAddPantry,
      user: mockUser
    }));

    await result.current.load_shopping_data('family-123');

    expect(mockDb.from).toHaveBeenCalledWith('shopping_list');
    const chain = mockDb.from('shopping_list');
    expect(chain.eq).toHaveBeenCalledWith('family_id', 'family-123');
  });

  test('load_shopping_data in individual mode queries by user_id and filters family_id as null', async () => {
    const mockDb = createSupabaseMock([]);
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => useShopping({
      shopping_items: [],
      set_shopping_items: mockSetShoppingItems,
      profile: mockIndividualProfile,
      trigger_push: mockTriggerPush,
      start_date: '2026-07-17',
      handle_add_pantry: mockHandleAddPantry,
      user: mockUser
    }));

    await result.current.load_shopping_data(null, 'user-789');

    expect(mockDb.from).toHaveBeenCalledWith('shopping_list');
    const chain = mockDb.from('shopping_list');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-789');
    expect(chain.is).toHaveBeenCalledWith('family_id', null);
  });

  test('handle_add_custom_shopping_item in family mode inserts with family_id', async () => {
    const mockDb = createSupabaseMock({ id: 99, ingredient_name: 'Pan', quantity: 1, unit: 'barra', purchased: false, manual: true });
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => useShopping({
      shopping_items: [],
      set_shopping_items: mockSetShoppingItems,
      profile: mockFamilyProfile,
      trigger_push: mockTriggerPush,
      start_date: '2026-07-17',
      handle_add_pantry: mockHandleAddPantry,
      user: mockUser
    }));

    await result.current.handle_add_custom_shopping_item('Pan', 1, 'barra');

    const chain = mockDb.from('shopping_list');
    expect(chain.insert).toHaveBeenCalledWith([{
      family_id: 'family-123',
      ingredient_name: 'Pan',
      quantity: 1,
      unit: 'barra',
      purchased: false,
      manual: true
    }]);
  });

  test('handle_add_custom_shopping_item in individual mode inserts with user_id', async () => {
    const mockDb = createSupabaseMock({ id: 100, ingredient_name: 'Leche', quantity: 2, unit: 'litros', purchased: false, manual: true });
    vi.mocked(get_supabase_client).mockReturnValue(mockDb as any);

    const { result } = renderHook(() => useShopping({
      shopping_items: [],
      set_shopping_items: mockSetShoppingItems,
      profile: mockIndividualProfile,
      trigger_push: mockTriggerPush,
      start_date: '2026-07-17',
      handle_add_pantry: mockHandleAddPantry,
      user: mockUser
    }));

    await result.current.handle_add_custom_shopping_item('Leche', 2, 'litros');

    const chain = mockDb.from('shopping_list');
    expect(chain.insert).toHaveBeenCalledWith([{
      user_id: 'user-789',
      ingredient_name: 'Leche',
      quantity: 2,
      unit: 'litros',
      purchased: false,
      manual: true
    }]);
  });
});
