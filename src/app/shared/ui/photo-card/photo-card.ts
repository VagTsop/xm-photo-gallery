import { Component, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import type { Photo } from '../../../core/models/photo.model';

@Component({
  selector: 'app-photo-card',
  imports: [MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './photo-card.html',
  styleUrl: './photo-card.scss',
})
export class PhotoCard {
  readonly photo = input.required<Photo>();
  readonly isFavorite = input(false);
  readonly favoriteToggled = output<string>();

  protected readonly thumbnailUrl = computed(() => {
    const p = this.photo();
    const width = Math.min(p.width, 600);
    const height = Math.round((width / p.width) * p.height);
    return `https://picsum.photos/id/${p.id}/${width}/${height}`;
  });

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.favoriteToggled.emit(this.photo().id);
  }
}
