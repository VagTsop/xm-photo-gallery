import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export const FAVORITES_STORAGE_KEY = 'xm-photo-gallery:favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly storage = inject(StorageService);

  readonly favoriteIds = signal<string[]>(
    this.storage.getItem<string[]>(FAVORITES_STORAGE_KEY, [])
  );
  readonly count = computed(() => this.favoriteIds().length);

  constructor() {
    effect(() => {
      this.storage.setItem(FAVORITES_STORAGE_KEY, this.favoriteIds());
    });
  }

  isFavorite(id: string): boolean {
    return this.favoriteIds().includes(id);
  }

  toggle(id: string): void {
    this.favoriteIds.update((ids) =>
      ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]
    );
  }
}
