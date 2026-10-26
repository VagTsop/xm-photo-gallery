import { TestBed } from '@angular/core/testing';
import { PhotoTransitionStore } from '../photo-transition.store';

describe('PhotoTransitionStore', () => {
  let store: PhotoTransitionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PhotoTransitionStore] });
    store = TestBed.inject(PhotoTransitionStore);
  });

  it('names no photo before one has been marked', () => {
    expect(store.nameFor('1')).toBeNull();
  });

  it('names only the marked photo', () => {
    store.mark('42');

    expect(store.nameFor('42')).toBe('photo-42');
    expect(store.nameFor('7')).toBeNull();
  });

  it('switches the name to the most recently marked photo', () => {
    store.mark('1');
    store.mark('2');

    expect(store.nameFor('1')).toBeNull();
    expect(store.nameFor('2')).toBe('photo-2');
  });
});
