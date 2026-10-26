import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PhotoApiService } from '../photo-api.service';
import type { Photo } from '../../models/photo.model';

const mockPhotos: Photo[] = [
  {
    id: '1',
    author: 'Alice',
    width: 5000,
    height: 3333,
    url: 'https://unsplash.com/photos/1',
    download_url: 'https://picsum.photos/id/1/5000/3333',
  },
  {
    id: '2',
    author: 'Bob',
    width: 4000,
    height: 2667,
    url: 'https://unsplash.com/photos/2',
    download_url: 'https://picsum.photos/id/2/4000/2667',
  },
];

describe('PhotoApiService', () => {
  let service: PhotoApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PhotoApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PhotoApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests the given page and limit from the Picsum list endpoint', () => {
    service.getPhotos(2, 30).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === 'https://picsum.photos/v2/list' && r.params.get('page') === '2' && r.params.get('limit') === '30'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPhotos);
  });

  it('defaults to a limit of 30 when none is provided', () => {
    service.getPhotos(1).subscribe();

    const req = httpMock.expectOne((r) => r.params.get('limit') === '30');
    req.flush(mockPhotos);
  });

  it('returns the photos from the response body', () => {
    let result: Photo[] | undefined;
    service.getPhotos(1, 30).subscribe((photos) => (result = photos));

    const req = httpMock.expectOne(() => true);
    req.flush(mockPhotos);

    expect(result).toEqual(mockPhotos);
  });

  it('propagates HTTP errors to the caller', () => {
    let error: unknown;
    service.getPhotos(1, 30).subscribe({ error: (e) => (error = e) });

    const req = httpMock.expectOne(() => true);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(error).toBeTruthy();
  });
});
