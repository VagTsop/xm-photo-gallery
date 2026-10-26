import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PhotoCard } from '../photo-card/photo-card';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';
import type { Photo } from '../../../core/models/photo.model';

@Component({
  selector: 'app-photo-grid',
  imports: [PhotoCard, InfiniteScrollDirective, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './photo-grid.html',
  styleUrl: './photo-grid.scss',
})
export class PhotoGrid {
  readonly photos = input.required<Photo[]>();
  readonly favoriteIds = input<string[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly hasMore = input(true);
  readonly emptyMessage = input('No photos found.');

  readonly favoriteToggled = output<Photo>();
  readonly loadMore = output<void>();
  readonly retry = output<void>();

  private readonly favoriteIdSet = computed(() => new Set(this.favoriteIds()));

  isFavorite(id: string): boolean {
    return this.favoriteIdSet().has(id);
  }
}
