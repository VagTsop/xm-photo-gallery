import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { Header } from '../header';
import { FavoritesStore } from '../../../../core/services/favorites.store';

describe('Header', () => {
  function createFixture(count: number) {
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: FavoritesStore,
          useValue: { count: signal(count), toggle: vi.fn(), isFavorite: vi.fn() },
        },
      ],
    });
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a link to the photos page', () => {
    const fixture = createFixture(0);
    const link = fixture.nativeElement.querySelector('[data-testid="nav-photos"]');

    expect(link?.getAttribute('href')).toBe('/');
  });

  it('renders a link to the favorites page', () => {
    const fixture = createFixture(0);
    const link = fixture.nativeElement.querySelector('[data-testid="nav-favorites"]');

    expect(link?.getAttribute('href')).toBe('/favorites');
  });

  it('shows the favorites count badge when there are favorites', () => {
    const fixture = createFixture(3);

    expect(fixture.nativeElement.textContent).toContain('3');
  });

  it('hides the favorites count badge when there are none', () => {
    const fixture = createFixture(0);
    const badge = fixture.nativeElement.querySelector('[data-testid="favorites-count"]');

    expect(badge).toBeNull();
  });
});
