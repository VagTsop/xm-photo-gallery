import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { PhotosPage } from '../photos-page';
import { PhotoStreamStore } from '../../../core/services/photo-stream.store';
import { FavoritesStore } from '../../../core/services/favorites.store';
import type { Photo } from '../../../core/models/photo.model';

function buildPhotos(count: number): Photo[] {
  return Array.from({ length: count }, (_, i) => {
    const id = String(i + 1);
    return {
      id,
      author: `Author ${id}`,
      width: 4000,
      height: 3000,
      url: `https://unsplash.com/photos/${id}`,
      download_url: `https://picsum.photos/id/${id}/4000/3000`,
    };
  });
}

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
}

describe('PhotosPage', () => {
  let originalIntersectionObserver: typeof IntersectionObserver;
  let photoStreamMock: {
    photos: ReturnType<typeof signal<Photo[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    hasMore: ReturnType<typeof signal<boolean>>;
    loadMore: ReturnType<typeof vi.fn>;
  };
  let favoritesMock: {
    favoriteIds: ReturnType<typeof signal<string[]>>;
    toggle: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    originalIntersectionObserver = globalThis.IntersectionObserver;
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      MockIntersectionObserver;

    photoStreamMock = {
      photos: signal<Photo[]>([]),
      loading: signal(false),
      error: signal<string | null>(null),
      hasMore: signal(true),
      loadMore: vi.fn(),
    };
    favoritesMock = {
      favoriteIds: signal<string[]>([]),
      toggle: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PhotosPage],
      providers: [
        provideRouter([]),
        { provide: PhotoStreamStore, useValue: photoStreamMock },
        { provide: FavoritesStore, useValue: favoritesMock },
      ],
    });
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  it('triggers an initial load when there are no photos yet', () => {
    TestBed.createComponent(PhotosPage).detectChanges();

    expect(photoStreamMock.loadMore).toHaveBeenCalledTimes(1);
  });

  it('does not trigger an initial load when photos are already present', () => {
    photoStreamMock.photos.set(buildPhotos(5));

    TestBed.createComponent(PhotosPage).detectChanges();

    expect(photoStreamMock.loadMore).not.toHaveBeenCalled();
  });

  it('renders a photo-grid wired to the store signals', () => {
    photoStreamMock.photos.set(buildPhotos(3));
    const fixture = TestBed.createComponent(PhotosPage);
    fixture.detectChanges();

    const grid = fixture.nativeElement.querySelector('app-photo-grid');
    expect(grid).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('app-photo-card').length).toBe(3);
  });

  it('re-renders the grid when the store signal changes after the initial render', async () => {
    const fixture = TestBed.createComponent(PhotosPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-photo-card').length).toBe(0);

    photoStreamMock.photos.set(buildPhotos(3));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('app-photo-card').length).toBe(3);
  });

  it('calls favorites.toggle when a card emits favoriteToggled', () => {
    photoStreamMock.photos.set(buildPhotos(1));
    const fixture = TestBed.createComponent(PhotosPage);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="favorite-toggle"]').click();

    expect(favoritesMock.toggle).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' })
    );
  });

  it('calls photoStream.loadMore again on retry', () => {
    photoStreamMock.error.set('boom');
    const fixture = TestBed.createComponent(PhotosPage);
    fixture.detectChanges();
    photoStreamMock.loadMore.mockClear();

    fixture.nativeElement.querySelector('[data-testid="retry-button"]').click();

    expect(photoStreamMock.loadMore).toHaveBeenCalledTimes(1);
  });
});
