import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PhotoGrid } from '../photo-grid';
import type { Photo } from '../../../../core/models/photo.model';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as never);
  }
}

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

describe('PhotoGrid', () => {
  let originalIntersectionObserver: typeof IntersectionObserver;

  beforeEach(() => {
    originalIntersectionObserver = globalThis.IntersectionObserver;
    MockIntersectionObserver.instances = [];
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      MockIntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  function createFixture() {
    TestBed.configureTestingModule({ imports: [PhotoGrid] });
    return TestBed.createComponent(PhotoGrid);
  }

  it('renders one photo-card per photo', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('photos', buildPhotos(5));
    fixture.detectChanges();
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('app-photo-card');
    expect(cards.length).toBe(5);
  });

  it('marks cards as favorite based on favoriteIds', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('photos', buildPhotos(2));
    fixture.componentRef.setInput('favoriteIds', ['1']);
    fixture.detectChanges();
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('[data-testid="favorite-toggle"]');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('re-emits favoriteToggled from a card with the photo id', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('photos', buildPhotos(1));
    fixture.detectChanges();
    await fixture.whenStable();

    const emitted: string[] = [];
    fixture.componentInstance.favoriteToggled.subscribe((id: string) => emitted.push(id));

    fixture.nativeElement.querySelector('[data-testid="favorite-toggle"]').click();

    expect(emitted).toEqual(['1']);
  });

  it('shows the empty message when there are no photos and nothing is loading', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('photos', []);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No photos found');
  });

  it('shows an error state with a retry button instead of the grid', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('photos', buildPhotos(3));
    fixture.componentRef.setInput('error', 'Failed to load photos.');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Failed to load photos.');
    expect(fixture.nativeElement.querySelectorAll('app-photo-card').length).toBe(0);

    const emitted: void[] = [];
    fixture.componentInstance.retry.subscribe(() => emitted.push(undefined));
    fixture.nativeElement.querySelector('[data-testid="retry-button"]').click();
    expect(emitted.length).toBe(1);
  });

  it('shows a loading spinner when loading is true', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('photos', buildPhotos(3));
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="photo-grid-spinner"]')).toBeTruthy();
  });

  it('emits loadMore when the sentinel intersects and more pages are available', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('photos', buildPhotos(3));
    fixture.componentRef.setInput('hasMore', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const emitted: void[] = [];
    fixture.componentInstance.loadMore.subscribe(() => emitted.push(undefined));
    MockIntersectionObserver.instances[0].trigger(true);

    expect(emitted.length).toBe(1);
  });

  it('does not render a sentinel once hasMore is false', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('photos', buildPhotos(3));
    fixture.componentRef.setInput('hasMore', false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="photo-grid-sentinel"]')).toBeNull();
  });
});
