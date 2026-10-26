import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/photos/photos-page').then((m) => m.PhotosPage),
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./features/favorites/favorites-page').then((m) => m.FavoritesPage),
  },
  {
    path: 'photo/:id',
    loadComponent: () =>
      import('./features/photo-detail/photo-detail-page').then((m) => m.PhotoDetailPage),
  },
  { path: '**', redirectTo: '' },
];
