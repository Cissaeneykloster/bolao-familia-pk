// Mock do Supabase para testes
import { vi } from "vitest";

export const createClient = vi.fn(() => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({ data: [], error: null })),
    insert: vi.fn(() => ({ data: null, error: null })),
    upsert: vi.fn(() => ({ data: null, error: null })),
    update: vi.fn(() => ({ data: null, error: null })),
    delete: vi.fn(() => ({ eq: vi.fn(() => ({ data: null, error: null })) })),
    eq: vi.fn(() => ({ data: [], error: null })),
    order: vi.fn(() => ({ data: [], error: null })),
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
}));
