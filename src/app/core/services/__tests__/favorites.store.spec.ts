import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FavoritesStore, FAVORITES_STORAGE_KEY } from '../favorites.store';
import { StorageService } from '../storage.service';

describe('FavoritesStore', () => {
  let storageMock: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };

  function createStore(initial: string[] = []) {
    storageMock = {
      getItem: vi.fn().mockReturnValue(initial),
      setItem: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [FavoritesStore, { provide: StorageService, useValue: storageMock }],
    });
    return TestBed.inject(FavoritesStore);
  }

  it('loads its initial state from storage', () => {
    const store = createStore(['1', '2']);

    expect(storageMock.getItem).toHaveBeenCalledWith(FAVORITES_STORAGE_KEY, []);
    expect(store.favoriteIds()).toEqual(['1', '2']);
  });

  it('reports whether a photo id is favorited', () => {
    const store = createStore(['1']);

    expect(store.isFavorite('1')).toBe(true);
    expect(store.isFavorite('2')).toBe(false);
  });

  it('adds an id to favorites when toggled on', () => {
    const store = createStore([]);

    store.toggle('5');

    expect(store.favoriteIds()).toEqual(['5']);
    expect(store.isFavorite('5')).toBe(true);
  });

  it('removes an id from favorites when toggled off', () => {
    const store = createStore(['5', '6']);

    store.toggle('5');

    expect(store.favoriteIds()).toEqual(['6']);
    expect(store.isFavorite('5')).toBe(false);
  });

  it('persists to storage whenever favorites change', () => {
    const store = createStore([]);
    storageMock.setItem.mockClear();

    store.toggle('7');
    TestBed.tick();

    expect(storageMock.setItem).toHaveBeenCalledWith(FAVORITES_STORAGE_KEY, ['7']);
  });

  it('exposes the favorite count', () => {
    const store = createStore(['1', '2', '3']);

    expect(store.count()).toBe(3);
  });
});
