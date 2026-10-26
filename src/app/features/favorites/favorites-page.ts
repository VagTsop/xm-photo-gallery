import { ChangeDetectorRef, Component, effect, inject } from '@angular/core';
import { PhotoGrid } from '../../shared/ui/photo-grid/photo-grid';
import { FavoritesStore } from '../../core/services/favorites.store';
import type { Photo } from '../../core/models/photo.model';

@Component({
  selector: 'app-favorites-page',
  imports: [PhotoGrid],
  templateUrl: './favorites-page.html',
})
export class FavoritesPage {
  private readonly favorites = inject(FavoritesStore);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly photos = this.favorites.favorites;
  protected readonly favoriteIds = this.favorites.favoriteIds;

  constructor() {
    effect(() => {
      this.photos();
      this.favoriteIds();
      this.cdr.markForCheck();
    });
  }

  onFavoriteToggled(photo: Photo): void {
    this.favorites.toggle(photo);
  }
}
