import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { Header } from '../header';
import { FavoritesStore } from '../../../../core/services/favorites.store';
import { ThemeStore } from '../../../../core/services/theme.store';

describe('Header', () => {
  let favoritesCount: ReturnType<typeof signal<number>>;
  let themeMock: { isDark: ReturnType<typeof signal<boolean>>; toggle: ReturnType<typeof vi.fn> };

  function createFixture(count: number) {
    favoritesCount = signal(count);
    themeMock = { isDark: signal(false), toggle: vi.fn() };

    TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: FavoritesStore,
          useValue: { count: favoritesCount, toggle: vi.fn(), isFavorite: vi.fn() },
        },
        { provide: ThemeStore, useValue: themeMock },
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

  it('updates the favorites count badge when the store signal changes after the initial render', async () => {
    const fixture = createFixture(0);
    expect(fixture.nativeElement.querySelector('[data-testid="favorites-count"]')).toBeNull();

    favoritesCount.set(2);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="favorites-count"]').textContent).toContain(
      '2',
    );
  });

  it('calls theme.toggle when the theme button is clicked', () => {
    const fixture = createFixture(0);

    fixture.nativeElement.querySelector('[data-testid="theme-toggle"]').click();

    expect(themeMock.toggle).toHaveBeenCalledTimes(1);
  });

  it('shows the dark-mode icon and label once the theme signal flips, with no manual change detection', async () => {
    const fixture = createFixture(0);
    const button = fixture.nativeElement.querySelector('[data-testid="theme-toggle"]');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark theme');

    themeMock.isDark.set(true);
    await fixture.whenStable();

    expect(button.getAttribute('aria-label')).toBe('Switch to light theme');
    expect(fixture.nativeElement.textContent).toContain('light_mode');
  });
});
