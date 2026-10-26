import { Injectable, inject, signal } from '@angular/core';
import { PhotoApiService } from './photo-api.service';
import type { Photo } from '../models/photo.model';

const PAGE_LIMIT = 30;

@Injectable({ providedIn: 'root' })
export class PhotoStreamStore {
  private readonly photoApi = inject(PhotoApiService);

  private readonly nextPage = signal(1);
  readonly photos = signal<Photo[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasMore = signal(true);

  loadMore(): void {
    if (this.loading() || !this.hasMore()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.photoApi.getPhotos(this.nextPage(), PAGE_LIMIT).subscribe({
      next: (page) => {
        this.photos.update((existing) => [...existing, ...page]);
        this.nextPage.update((p) => p + 1);
        if (page.length < PAGE_LIMIT) {
          this.hasMore.set(false);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load photos. Please try again.');
        this.loading.set(false);
      },
    });
  }

  reset(): void {
    this.nextPage.set(1);
    this.photos.set([]);
    this.loading.set(false);
    this.error.set(null);
    this.hasMore.set(true);
  }
}
