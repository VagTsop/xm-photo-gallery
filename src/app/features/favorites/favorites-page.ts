import { Component, inject } from '@angular/core';
import { PhotoGrid } from '../../shared/ui/photo-grid/photo-grid';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { FavoritesStore } from '../../core/services/favorites.store';
import type { Photo } from '../../core/models/photo.model';

@Component({
  selector: 'app-favorites-page',
  imports: [PhotoGrid, PageHeader],
  templateUrl: './favorites-page.html',
})
export class FavoritesPage {
  private readonly favorites = inject(FavoritesStore);

  protected readonly photos = this.favorites.favorites;
  protected readonly favoriteIds = this.favorites.favoriteIds;

  onFavoriteToggled(photo: Photo): void {
    this.favorites.toggle(photo);
  }
}
