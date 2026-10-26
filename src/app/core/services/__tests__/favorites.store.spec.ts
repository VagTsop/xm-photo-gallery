import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FavoritesStore, FAVORITES_STORAGE_KEY } from '../favorites.store';
import { StorageService } from '../storage.service';
import type { Photo } from '../../models/photo.model';

function buildPhoto(id: string): Photo {
  return {
    id,
    author: `Author ${id}`,
    width: 4000,
    height: 3000,
    url: `https://unsplash.com/photos/${id}`,
    download_url: `https://picsum.photos/id/${id}/4000/3000`,
  };
}

describe('FavoritesStore', () => {
  let storageMock: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };

  function createStore(initial: Photo[] = []) {
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
    const photo1 = buildPhoto('1');
    const photo2 = buildPhoto('2');
    const store = createStore([photo1, photo2]);

    expect(storageMock.getItem).toHaveBeenCalledWith(FAVORITES_STORAGE_KEY, []);
    expect(store.favorites()).toEqual([photo1, photo2]);
    expect(store.favoriteIds()).toEqual(['1', '2']);
  });

  it('reports whether a photo id is favorited', () => {
    const store = createStore([buildPhoto('1')]);

    expect(store.isFavorite('1')).toBe(true);
    expect(store.isFavorite('2')).toBe(false);
  });

  it('adds a photo to favorites when toggled on', () => {
    const store = createStore([]);
    const photo = buildPhoto('5');

    store.toggle(photo);

    expect(store.favorites()).toEqual([photo]);
    expect(store.isFavorite('5')).toBe(true);
  });

  it('removes a photo from favorites when toggled off', () => {
    const photo5 = buildPhoto('5');
    const photo6 = buildPhoto('6');
    const store = createStore([photo5, photo6]);

    store.toggle(photo5);

    expect(store.favorites()).toEqual([photo6]);
    expect(store.isFavorite('5')).toBe(false);
  });

  it('persists to storage whenever favorites change', () => {
    const store = createStore([]);
    storageMock.setItem.mockClear();
    const photo = buildPhoto('7');

    store.toggle(photo);
    TestBed.tick();

    expect(storageMock.setItem).toHaveBeenCalledWith(FAVORITES_STORAGE_KEY, [photo]);
  });

  it('exposes the favorite count', () => {
    const store = createStore([buildPhoto('1'), buildPhoto('2'), buildPhoto('3')]);

    expect(store.count()).toBe(3);
  });
});
