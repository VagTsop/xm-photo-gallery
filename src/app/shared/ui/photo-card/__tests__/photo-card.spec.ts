import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PhotoCard } from '../photo-card';
import type { Photo } from '../../../../core/models/photo.model';

const photo: Photo = {
  id: '42',
  author: 'Jane Doe',
  width: 4000,
  height: 3000,
  url: 'https://unsplash.com/photos/42',
  download_url: 'https://picsum.photos/id/42/4000/3000',
};

describe('PhotoCard', () => {
  function createFixture() {
    TestBed.configureTestingModule({ imports: [PhotoCard], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PhotoCard);
    fixture.componentRef.setInput('photo', photo);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the author name', () => {
    const fixture = createFixture();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Jane Doe');
  });

  it('links to the photo detail page', () => {
    const fixture = createFixture();
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');

    expect(link?.getAttribute('href')).toBe('/photo/42');
  });

  it('renders the photo image with a down-scaled url and alt text', () => {
    const fixture = createFixture();
    const img = (fixture.nativeElement as HTMLElement).querySelector('img');

    expect(img?.src).toContain('picsum.photos/id/42');
    expect(img?.alt).toContain('Jane Doe');
  });

  it('emits favoriteToggled with the whole photo when the favorite button is clicked', () => {
    const fixture = createFixture();
    const emitted: Photo[] = [];
    fixture.componentInstance.favoriteToggled.subscribe((p: Photo) => emitted.push(p));

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="favorite-toggle"]'
    );
    button?.click();

    expect(emitted).toEqual([photo]);
  });

  it('shows a filled heart icon when isFavorite is true', () => {
    TestBed.configureTestingModule({ imports: [PhotoCard], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PhotoCard);
    fixture.componentRef.setInput('photo', photo);
    fixture.componentRef.setInput('isFavorite', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="favorite-toggle"]');
    expect(button?.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows an empty heart icon when isFavorite is false', () => {
    const fixture = createFixture();

    const button = fixture.nativeElement.querySelector('[data-testid="favorite-toggle"]');
    expect(button?.getAttribute('aria-pressed')).toBe('false');
  });
});
