import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import type { Photo } from '../models/photo.model';

export const FAVORITES_STORAGE_KEY = 'xm-photo-gallery:favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly storage = inject(StorageService);

  readonly favorites = signal<Photo[]>(this.storage.getItem<Photo[]>(FAVORITES_STORAGE_KEY, []));
  readonly favoriteIds = computed(() => this.favorites().map((photo) => photo.id));
  readonly count = computed(() => this.favorites().length);

  constructor() {
    effect(() => {
      this.storage.setItem(FAVORITES_STORAGE_KEY, this.favorites());
    });
  }

  isFavorite(id: string): boolean {
    return this.favorites().some((photo) => photo.id === id);
  }

  toggle(photo: Photo): void {
    this.favorites.update((existing) =>
      existing.some((p) => p.id === photo.id)
        ? existing.filter((p) => p.id !== photo.id)
        : [...existing, photo],
    );
  }
}
