import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PhotoStreamStore } from '../../core/services/photo-stream.store';
import { FavoritesStore } from '../../core/services/favorites.store';
import { PhotoApiService } from '../../core/services/photo-api.service';
import { PhotoTransitionStore } from '../../core/services/photo-transition.store';

@Component({
  selector: 'app-photo-detail-page',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './photo-detail-page.html',
  styleUrl: './photo-detail-page.scss',
})
export class PhotoDetailPage {
  private readonly photoStream = inject(PhotoStreamStore);
  private readonly favorites = inject(FavoritesStore);
  private readonly photoApi = inject(PhotoApiService);
  private readonly transitions = inject(PhotoTransitionStore);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  private readonly localPhoto = computed(
    () =>
      this.photoStream.photos().find((p) => p.id === this.id()) ??
      this.favorites.favorites().find((p) => p.id === this.id()),
  );

  private readonly remotePhoto = rxResource({
    params: () => (this.localPhoto() ? undefined : this.id()),
    stream: ({ params: id }) => this.photoApi.getPhotoById(id),
  });

  protected readonly photo = computed(() => this.localPhoto() ?? this.remotePhoto.value());
  protected readonly loading = computed(() => !this.localPhoto() && this.remotePhoto.isLoading());
  protected readonly error = computed(() =>
    !this.localPhoto() && this.remotePhoto.error() ? 'This photo could not be found.' : null,
  );
  protected readonly isFavorite = computed(() => this.favorites.isFavorite(this.id()));

  // The API's `download_url` is the full 5000px original — far more than a
  // viewport-sized stage needs, and slow enough to show a blank page.
  protected readonly displayUrl = computed(() => {
    const photo = this.photo();
    if (!photo) {
      return '';
    }
    const width = Math.min(photo.width, 1600);
    const height = Math.round((width / photo.width) * photo.height);
    return `https://picsum.photos/id/${photo.id}/${width}/${height}`;
  });

  // Numeric ratio so the stage can cap its height without letterboxing.
  protected readonly ratio = computed(() => {
    const photo = this.photo();
    return photo && photo.height > 0 ? photo.width / photo.height : 1.5;
  });

  protected readonly imageLoaded = signal(false);

  // Pairs the stage with the grid card of the same photo, so the thumbnail
  // morphs into the full image instead of the pages cross-fading.
  protected readonly transitionName = computed(() => `photo-${this.id()}`);

  constructor() {
    // Deep links and reloads have no outgoing card; marking the id here means
    // the card is already named when the back navigation snapshots the grid.
    effect(() => this.transitions.mark(this.id()));
  }

  onImageSettled(): void {
    this.imageLoaded.set(true);
  }

  onFavoriteClick(): void {
    const photo = this.photo();
    if (photo) {
      this.favorites.toggle(photo);
    }
  }

  /**
   * A `routerLink="/"` is always a forward navigation, so the router never
   * marks it as "restored" and `ScrollRestorationService` has nothing to
   * replay — the gallery would always land back at the top. Going through
   * real browser history instead fires a popstate, which the service already
   * knows how to restore the scroll position for. Deep links/reloads have no
   * app history to go back to, so those fall back to a normal navigation.
   */
  onBackClick(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    const navigationId = (history.state as { navigationId?: number } | null)?.navigationId ?? 0;
    if (navigationId > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/');
    }
  }
}
