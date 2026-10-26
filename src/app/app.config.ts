import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { ScrollRestorationService } from './core/services/scroll-restoration.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Scroll restoration is handled by ScrollRestorationService rather than
      // `withInMemoryScrolling`, which the view transition below interferes
      // with — see the comment in that file.
      withViewTransitions({
        skipInitialTransition: true,
        // Runs in an injection context.
        onViewTransitionCreated: ({ transition }) =>
          inject(ScrollRestorationService).track(transition),
      }),
    ),
    // Eager: the service has to be listening from the first navigation to
    // record where each page was left. Nothing else constructs it in time.
    provideEnvironmentInitializer(() => void inject(ScrollRestorationService)),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
  ],
};
