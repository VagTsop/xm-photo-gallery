import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export const THEME_STORAGE_KEY = 'xm-photo-gallery:theme';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly storage = inject(StorageService);

  readonly mode = signal<ThemeMode>(
    this.storage.getItem<ThemeMode>(THEME_STORAGE_KEY, prefersDark() ? 'dark' : 'light'),
  );
  readonly isDark = computed(() => this.mode() === 'dark');

  constructor() {
    effect(() => {
      const mode = this.mode();
      this.storage.setItem(THEME_STORAGE_KEY, mode);
      document.documentElement.dataset['theme'] = mode;
    });
  }

  toggle(): void {
    this.mode.update((mode) => (mode === 'dark' ? 'light' : 'dark'));
  }
}

function prefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}
