import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { Photo } from '../models/photo.model';

@Injectable({ providedIn: 'root' })
export class PhotoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://picsum.photos/v2/list';

  getPhotos(page: number, limit = 30): Observable<Photo[]> {
    return this.http.get<Photo[]>(this.baseUrl, {
      params: { page, limit },
    });
  }

  getPhotoById(id: string): Observable<Photo> {
    return this.http.get<Photo>(`https://picsum.photos/id/${id}/info`);
  }
}
