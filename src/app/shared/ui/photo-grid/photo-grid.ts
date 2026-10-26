import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PhotoCard } from '../photo-card/photo-card';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';
import type { Photo } from '../../../core/models/photo.model';

@Component({
  selector: 'app-photo-grid',
  imports: [
    PhotoCard,
    InfiniteScrollDirective,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
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
  readonly emptyIcon = input('photo_library');
  readonly emptyActionLabel = input('');
  readonly emptyActionLink = input('');

  readonly favoriteToggled = output<Photo>();
  readonly loadMore = output<void>();
  readonly retry = output<void>();

  // Mixed shapes so the placeholder grid reads like real masonry, not a table.
  protected readonly skeletonRatios = [
    '3 / 2',
    '2 / 3',
    '1 / 1',
    '4 / 3',
    '3 / 4',
    '3 / 2',
    '2 / 3',
    '16 / 10',
    '1 / 1',
    '3 / 4',
    '4 / 3',
    '3 / 2',
  ];

  // An error only takes over the page when there is nothing to show. Once
  // photos are on screen they stay, and the error degrades to an inline strip.
  protected readonly fatalError = computed(() => !!this.error() && this.photos().length === 0);

  // Only the very first load gets skeletons; appended pages use the spinner so
  // the photos already on screen stay put.
  protected readonly showSkeletons = computed(() => this.loading() && this.photos().length === 0);

  private readonly favoriteIdSet = computed(() => new Set(this.favoriteIds()));

  isFavorite(id: string): boolean {
    return this.favoriteIdSet().has(id);
  }
}
