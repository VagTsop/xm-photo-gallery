import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PhotoDetailPage } from '../photo-detail-page';
import { PhotoStreamStore } from '../../../core/services/photo-stream.store';
import { FavoritesStore } from '../../../core/services/favorites.store';
import { PhotoApiService } from '../../../core/services/photo-api.service';
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

describe('PhotoDetailPage', () => {
  let photoStreamMock: { photos: ReturnType<typeof signal<Photo[]>> };
  let favoritesMock: {
    favorites: ReturnType<typeof signal<Photo[]>>;
    isFavorite: ReturnType<typeof vi.fn>;
    toggle: ReturnType<typeof vi.fn>;
  };
  let photoApiMock: { getPhotoById: ReturnType<typeof vi.fn> };

  function createFixture(id: string) {
    TestBed.configureTestingModule({
      imports: [PhotoDetailPage],
      providers: [
        provideRouter([]),
        { provide: PhotoStreamStore, useValue: photoStreamMock },
        { provide: FavoritesStore, useValue: favoritesMock },
        { provide: PhotoApiService, useValue: photoApiMock },
      ],
    });
    const fixture = TestBed.createComponent(PhotoDetailPage);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    photoStreamMock = { photos: signal<Photo[]>([]) };
    favoritesMock = {
      favorites: signal<Photo[]>([]),
      isFavorite: vi.fn().mockReturnValue(false),
      toggle: vi.fn(),
    };
    photoApiMock = { getPhotoById: vi.fn() };
  });

  it('renders a photo already present in the photo stream without calling the API', () => {
    photoStreamMock.photos.set([buildPhoto('1'), buildPhoto('2')]);

    const fixture = createFixture('2');

    expect(fixture.nativeElement.textContent).toContain('Author 2');
    expect(photoApiMock.getPhotoById).not.toHaveBeenCalled();
  });

  it('renders a photo already present in favorites without calling the API', () => {
    favoritesMock.favorites.set([buildPhoto('9')]);

    const fixture = createFixture('9');

    expect(fixture.nativeElement.textContent).toContain('Author 9');
    expect(photoApiMock.getPhotoById).not.toHaveBeenCalled();
  });

  it('fetches the photo from the API when it is not available locally', async () => {
    photoApiMock.getPhotoById.mockReturnValue(of(buildPhoto('77')));

    const fixture = createFixture('77');
    await fixture.whenStable();

    expect(photoApiMock.getPhotoById).toHaveBeenCalledWith('77');
    expect(fixture.nativeElement.textContent).toContain('Author 77');
  });

  it('shows an error message when the API fetch fails', async () => {
    photoApiMock.getPhotoById.mockReturnValue(throwError(() => new Error('not found')));

    const fixture = createFixture('404');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('not be found');
  });

  it('calls favorites.toggle with the resolved photo when the favorite button is clicked', () => {
    photoStreamMock.photos.set([buildPhoto('5')]);

    const fixture = createFixture('5');
    fixture.nativeElement.querySelector('[data-testid="favorite-toggle"]').click();

    expect(favoritesMock.toggle).toHaveBeenCalledWith(expect.objectContaining({ id: '5' }));
  });
});
