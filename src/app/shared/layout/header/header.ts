import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FavoritesStore } from '../../../core/services/favorites.store';
import { ThemeStore } from '../../../core/services/theme.store';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly favorites = inject(FavoritesStore);
  private readonly theme = inject(ThemeStore);

  protected readonly favoritesCount = this.favorites.count;
  protected readonly isDark = this.theme.isDark;

  onThemeToggle(): void {
    this.theme.toggle();
  }
}
