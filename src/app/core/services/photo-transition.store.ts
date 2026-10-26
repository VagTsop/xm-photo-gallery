import { Injectable, signal } from '@angular/core';

/**
 * Tracks which photo a navigation is travelling through, so exactly one card
 * carries a `view-transition-name` at a time. Naming every card in the grid
 * would make the browser snapshot hundreds of elements on every route change.
 */
@Injectable({ providedIn: 'root' })
export class PhotoTransitionStore {
  private readonly activeId = signal<string | null>(null);

  mark(id: string): void {
    this.activeId.set(id);
  }

  nameFor(id: string): string | null {
    return this.activeId() === id ? `photo-${id}` : null;
  }
}
