import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';
import { FavoritesPage } from '../favorites-page';
import { FavoritesStore } from '../../../core/services/favorites.store';
import type { Photo } from '../../../core/models/photo.model';

function buildPhoto(id: string): Photo {
  return {
    id,
    author: `Author ${id}`,
    width: 4000,
    height: 3000,
    url: `https://unsplash.com/photos/${id}`,
    download_url: `https://picsum.photos/id/${id}/4000/3000`,
  };
}

describe('FavoritesPage', () => {
  let favoritesMock: {
    favorites: ReturnType<typeof signal<Photo[]>>;
    favoriteIds: ReturnType<typeof computed<string[]>>;
    toggle: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const favorites = signal<Photo[]>([buildPhoto('1'), buildPhoto('2')]);
    favoritesMock = {
      favorites,
      favoriteIds: computed(() => favorites().map((p) => p.id)),
      toggle: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [FavoritesPage],
      providers: [{ provide: FavoritesStore, useValue: favoritesMock }],
    });
  });

  it('renders every favorited photo', () => {
    const fixture = TestBed.createComponent(FavoritesPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-photo-card').length).toBe(2);
  });

  it('marks every rendered card as favorited', () => {
    const fixture = TestBed.createComponent(FavoritesPage);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('[data-testid="favorite-toggle"]');
    buttons.forEach((button: HTMLButtonElement) => {
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });
  });

  it('shows an empty-state message when there are no favorites', () => {
    favoritesMock.favorites.set([]);
    const fixture = TestBed.createComponent(FavoritesPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("haven't favorited");
  });

  it('calls favorites.toggle to remove a photo when its card is un-favorited', () => {
    const fixture = TestBed.createComponent(FavoritesPage);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="favorite-toggle"]').click();

    expect(favoritesMock.toggle).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  });

  it('never shows an infinite-scroll sentinel (favorites have no pagination)', () => {
    const fixture = TestBed.createComponent(FavoritesPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="photo-grid-sentinel"]')).toBeNull();
  });
});
