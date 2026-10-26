import { ChangeDetectorRef, Component, OnInit, effect, inject } from '@angular/core';
import { PhotoGrid } from '../../shared/ui/photo-grid/photo-grid';
import { PhotoStreamStore } from '../../core/services/photo-stream.store';
import { FavoritesStore } from '../../core/services/favorites.store';
import type { Photo } from '../../core/models/photo.model';

@Component({
  selector: 'app-photos-page',
  imports: [PhotoGrid],
  templateUrl: './photos-page.html',
})
export class PhotosPage implements OnInit {
  private readonly photoStream = inject(PhotoStreamStore);
  private readonly favorites = inject(FavoritesStore);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly photos = this.photoStream.photos;
  protected readonly loading = this.photoStream.loading;
  protected readonly error = this.photoStream.error;
  protected readonly hasMore = this.photoStream.hasMore;
  protected readonly favoriteIds = this.favorites.favoriteIds;

  constructor() {
    effect(() => {
      this.photos();
      this.loading();
      this.error();
      this.hasMore();
      this.favoriteIds();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    if (this.photos().length === 0) {
      this.photoStream.loadMore();
    }
  }

  onLoadMore(): void {
    this.photoStream.loadMore();
  }

  onRetry(): void {
    this.photoStream.loadMore();
  }

  onFavoriteToggled(photo: Photo): void {
    this.favorites.toggle(photo);
  }
}
