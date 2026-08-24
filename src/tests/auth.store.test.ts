/**
 * Frontend store tests — verifies Zustand auth store state transitions.
 * The api module is mocked so no real HTTP calls are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Provide localStorage stub (Zustand persist needs it in Node env)
const store: Record<string, string> = {};
global.localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  length: 0,
  key: () => null,
};

// Mock the api module before importing the store
vi.mock('@/lib/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';

const mockApi = api as { login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn> };

const MOCK_USER = {
  id: 'user_1',
  email: 'jane@test.com',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'CUSTOMER' as const,
  cardLast4: '4242',
};

describe('useAuth store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset store state between tests
    useAuth.setState({ user: null, token: null });
  });

  it('initial state is unauthenticated', () => {
    const { user, token, isAuthenticated } = useAuth.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('signIn sets user and token on success', async () => {
    mockApi.login.mockResolvedValue({ user: MOCK_USER, token: 'jwt-token-123' });

    await useAuth.getState().signIn('jane@test.com', 'Test@1234');

    const { user, token, isAuthenticated } = useAuth.getState();
    expect(user?.email).toBe('jane@test.com');
    expect(token).toBe('jwt-token-123');
    expect(isAuthenticated()).toBe(true);
  });

  it('signIn throws and leaves state unchanged on API error', async () => {
    mockApi.login.mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      useAuth.getState().signIn('jane@test.com', 'WrongPass')
    ).rejects.toThrow('Invalid credentials');

    const { user, token } = useAuth.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
  });

  it('signUp sets user and token on success', async () => {
    mockApi.register.mockResolvedValue({ user: MOCK_USER, token: 'jwt-token-456' });

    await useAuth.getState().signUp('Jane', 'Doe', 'jane@test.com', 'Test@1234');

    const { user, token } = useAuth.getState();
    expect(user?.firstName).toBe('Jane');
    expect(token).toBe('jwt-token-456');
  });

  it('signOut clears user and token', () => {
    useAuth.setState({ user: MOCK_USER, token: 'jwt-token-123' });

    useAuth.getState().signOut();

    const { user, token, isAuthenticated } = useAuth.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('signUp uses CUSTOMER role by default', async () => {
    mockApi.register.mockResolvedValue({ user: MOCK_USER, token: 'token' });

    await useAuth.getState().signUp('Jane', 'Doe', 'jane@test.com', 'Test@1234');

    expect(mockApi.register).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'CUSTOMER' })
    );
  });
});
