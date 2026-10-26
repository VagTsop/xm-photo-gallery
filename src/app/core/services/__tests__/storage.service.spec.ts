import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { StorageService } from '../storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [StorageService] });
    service = TestBed.inject(StorageService);
  });

  it('returns the fallback when nothing is stored', () => {
    expect(service.getItem('missing-key', ['default'])).toEqual(['default']);
  });

  it('round-trips a JSON-serializable value', () => {
    service.setItem('ids', ['a', 'b', 'c']);
    expect(service.getItem<string[]>('ids', [])).toEqual(['a', 'b', 'c']);
  });

  it('returns the fallback when the stored value is corrupted JSON', () => {
    localStorage.setItem('broken', '{not json');
    expect(service.getItem('broken', 'fallback')).toBe('fallback');
  });

  it('returns the fallback when localStorage.getItem throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(service.getItem('key', 'fallback')).toBe('fallback');

    spy.mockRestore();
  });

  it('swallows errors from localStorage.setItem (e.g. quota exceeded)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => service.setItem('key', 'value')).not.toThrow();

    spy.mockRestore();
  });
});
