import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PhotoStreamStore } from '../../core/services/photo-stream.store';
import { FavoritesStore } from '../../core/services/favorites.store';
import { PhotoApiService } from '../../core/services/photo-api.service';

@Component({
  selector: 'app-photo-detail-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './photo-detail-page.html',
  styleUrl: './photo-detail-page.scss',
})
export class PhotoDetailPage {
  private readonly photoStream = inject(PhotoStreamStore);
  private readonly favorites = inject(FavoritesStore);
  private readonly photoApi = inject(PhotoApiService);

  readonly id = input.required<string>();

  private readonly localPhoto = computed(
    () =>
      this.photoStream.photos().find((p) => p.id === this.id()) ??
      this.favorites.favorites().find((p) => p.id === this.id())
  );

  private readonly remotePhoto = rxResource({
    params: () => (this.localPhoto() ? undefined : this.id()),
    stream: ({ params: id }) => this.photoApi.getPhotoById(id),
  });

  protected readonly photo = computed(() => this.localPhoto() ?? this.remotePhoto.value());
  protected readonly loading = computed(() => !this.localPhoto() && this.remotePhoto.isLoading());
  protected readonly error = computed(() =>
    !this.localPhoto() && this.remotePhoto.error() ? 'This photo could not be found.' : null
  );
  protected readonly isFavorite = computed(() => this.favorites.isFavorite(this.id()));

  onFavoriteClick(): void {
    const photo = this.photo();
    if (photo) {
      this.favorites.toggle(photo);
    }
  }
}
