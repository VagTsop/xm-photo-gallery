import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeStore, THEME_STORAGE_KEY } from '../theme.store';
import { StorageService } from '../storage.service';

describe('ThemeStore', () => {
  let storageMock: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };
  const originalMatchMedia = globalThis.matchMedia;

  // jsdom doesn't implement matchMedia at all, so there is nothing to spy on;
  // ThemeStore only needs the `matches` flag the real API would report.
  function mockPrefersDark(prefersDark: boolean) {
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: prefersDark } as MediaQueryList);
  }

  function createStore(stored?: 'light' | 'dark') {
    storageMock = {
      getItem: vi.fn((_key: string, fallback: unknown) => stored ?? fallback),
      setItem: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [ThemeStore, { provide: StorageService, useValue: storageMock }],
    });
    return TestBed.inject(ThemeStore);
  }

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    globalThis.matchMedia = originalMatchMedia;
  });

  it('loads its initial mode from storage', () => {
    mockPrefersDark(false);
    const store = createStore('dark');

    expect(storageMock.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light');
    expect(store.mode()).toBe('dark');
    expect(store.isDark()).toBe(true);
  });

  it('falls back to the OS preference when nothing is stored', () => {
    mockPrefersDark(true);
    storageMock = {
      getItem: vi.fn((_key: string, fallback: unknown) => fallback),
      setItem: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [ThemeStore, { provide: StorageService, useValue: storageMock }],
    });
    const store = TestBed.inject(ThemeStore);

    expect(store.mode()).toBe('dark');
  });

  it('toggles between light and dark', () => {
    mockPrefersDark(false);
    const store = createStore('light');

    store.toggle();
    expect(store.mode()).toBe('dark');
    expect(store.isDark()).toBe(true);

    store.toggle();
    expect(store.mode()).toBe('light');
    expect(store.isDark()).toBe(false);
  });

  it('persists the mode to storage whenever it changes', () => {
    mockPrefersDark(false);
    const store = createStore('light');
    storageMock.setItem.mockClear();

    store.toggle();
    TestBed.tick();

    expect(storageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
  });

  it('writes the mode onto <html data-theme> so the Material theme can key off it', () => {
    mockPrefersDark(false);
    createStore('dark');
    TestBed.tick();

    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
