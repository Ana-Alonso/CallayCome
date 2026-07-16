import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Capacitor LocalNotifications plugin
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    checkPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    schedule: vi.fn().mockResolvedValue(null)
  }
}));

// Mock Capacitor App plugin
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockReturnValue({ remove: vi.fn() })
  }
}));

