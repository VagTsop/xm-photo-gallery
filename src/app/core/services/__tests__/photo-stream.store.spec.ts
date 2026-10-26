import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { PhotoStreamStore } from '../photo-stream.store';
import { PhotoApiService } from '../photo-api.service';
import type { Photo } from '../../models/photo.model';

function buildPhotos(count: number, startId = 1): Photo[] {
  return Array.from({ length: count }, (_, i) => {
    const id = String(startId + i);
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

describe('PhotoStreamStore', () => {
  let store: PhotoStreamStore;
  let apiMock: { getPhotos: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiMock = { getPhotos: vi.fn() };
    TestBed.configureTestingModule({
      providers: [PhotoStreamStore, { provide: PhotoApiService, useValue: apiMock }],
    });
    store = TestBed.inject(PhotoStreamStore);
  });

  it('starts empty, not loading, with more pages available', () => {
    expect(store.photos()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.hasMore()).toBe(true);
  });

  it('appends the fetched page to photos and advances the page number', () => {
    apiMock.getPhotos.mockReturnValue(of(buildPhotos(30, 1)));

    store.loadMore();

    expect(apiMock.getPhotos).toHaveBeenCalledWith(1, 30);
    expect(store.photos().length).toBe(30);
    expect(store.loading()).toBe(false);

    apiMock.getPhotos.mockReturnValue(of(buildPhotos(30, 31)));
    store.loadMore();

    expect(apiMock.getPhotos).toHaveBeenCalledWith(2, 30);
    expect(store.photos().length).toBe(60);
    expect(store.photos()[0].id).toBe('1');
    expect(store.photos()[59].id).toBe('60');
  });

  it('sets loading to true while a request is in flight', () => {
    const subject = new Subject<Photo[]>();
    apiMock.getPhotos.mockReturnValue(subject.asObservable());

    store.loadMore();
    expect(store.loading()).toBe(true);

    subject.next(buildPhotos(30));
    subject.complete();
    expect(store.loading()).toBe(false);
  });

  it('ignores a loadMore call while one is already in flight', () => {
    const subject = new Subject<Photo[]>();
    apiMock.getPhotos.mockReturnValue(subject.asObservable());

    store.loadMore();
    store.loadMore();
    store.loadMore();

    expect(apiMock.getPhotos).toHaveBeenCalledTimes(1);

    subject.next(buildPhotos(30));
    subject.complete();
  });

  it('marks hasMore as false when a page returns fewer photos than the limit', () => {
    apiMock.getPhotos.mockReturnValue(of(buildPhotos(12)));

    store.loadMore();

    expect(store.hasMore()).toBe(false);
  });

  it('stops issuing requests once hasMore is false', () => {
    apiMock.getPhotos.mockReturnValue(of(buildPhotos(5)));
    store.loadMore();
    expect(store.hasMore()).toBe(false);

    store.loadMore();

    expect(apiMock.getPhotos).toHaveBeenCalledTimes(1);
  });

  it('sets an error message and stops loading when the request fails', () => {
    apiMock.getPhotos.mockReturnValue(throwError(() => new Error('network down')));

    store.loadMore();

    expect(store.loading()).toBe(false);
    expect(store.error()).toBeTruthy();
    expect(store.photos()).toEqual([]);
  });

  it('allows retrying loadMore after an error', () => {
    apiMock.getPhotos.mockReturnValueOnce(throwError(() => new Error('network down')));
    store.loadMore();
    expect(store.error()).toBeTruthy();

    apiMock.getPhotos.mockReturnValue(of(buildPhotos(30)));
    store.loadMore();

    expect(store.error()).toBeNull();
    expect(store.photos().length).toBe(30);
  });

  it('resets state back to the initial values', () => {
    apiMock.getPhotos.mockReturnValue(of(buildPhotos(30)));
    store.loadMore();
    expect(store.photos().length).toBe(30);

    store.reset();

    expect(store.photos()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.hasMore()).toBe(true);
  });
});
