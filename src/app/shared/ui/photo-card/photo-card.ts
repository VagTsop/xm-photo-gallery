import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PhotoTransitionStore } from '../../../core/services/photo-transition.store';
import type { Photo } from '../../../core/models/photo.model';

// Column width tops out around 320px on the widest (4-column) layout and runs
// to full width on phones, so these cover every slot at 1x and 2x.
const CANDIDATE_WIDTHS = [320, 480, 640, 960];

@Component({
  selector: 'app-photo-card',
  imports: [RouterLink, MatIconModule],
  templateUrl: './photo-card.html',
  styleUrl: './photo-card.scss',
})
export class PhotoCard {
  private readonly transitions = inject(PhotoTransitionStore);

  readonly photo = input.required<Photo>();
  readonly isFavorite = input(false);
  readonly favoriteToggled = output<Photo>();

  // Mirrors the breakpoints in photo-grid.scss (4 / 3 / 2 / 1 columns).
  protected readonly SIZES =
    '(min-width: 1200px) 320px, (min-width: 900px) 30vw, (min-width: 600px) 46vw, 92vw';

  protected readonly loaded = signal(false);

  protected readonly thumbnailUrl = computed(() => this.urlAtWidth(600));

  protected readonly thumbnailSrcset = computed(() =>
    CANDIDATE_WIDTHS.filter((width) => width <= this.photo().width)
      .map((width) => `${this.urlAtWidth(width)} ${width}w`)
      .join(', '),
  );

  // Reserving the real aspect ratio keeps the masonry from reflowing as images
  // stream in, and gives the skeleton the right shape while it waits.
  protected readonly aspectRatio = computed(() => {
    const p = this.photo();
    return p.width > 0 && p.height > 0 ? `${p.width} / ${p.height}` : '3 / 2';
  });

  protected readonly transitionName = computed(() => this.transitions.nameFor(this.photo().id));

  // Runs before the router's own click handler, so the name is on the element
  // by the time the browser snapshots the outgoing page.
  onNavigateIntent(): void {
    this.transitions.mark(this.photo().id);
  }

  onImageSettled(): void {
    this.loaded.set(true);
  }

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.favoriteToggled.emit(this.photo());
  }

  private urlAtWidth(target: number): string {
    const p = this.photo();
    const width = Math.min(p.width, target);
    const height = Math.round((width / p.width) * p.height);
    return `https://picsum.photos/id/${p.id}/${width}/${height}`;
  }
}
