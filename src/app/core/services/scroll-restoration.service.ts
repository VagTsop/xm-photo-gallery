import { DOCUMENT, Injectable, NgZone, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

/** How long to keep trying before accepting wherever the page ended up. */
const MAX_ATTEMPTS = 40;

/** Gap between attempts, in ms. Driven by a timer rather than
 * `requestAnimationFrame`, which is suspended while the tab is hidden. */
const RETRY_INTERVAL = 25;

/** Anything within this many pixels of the target counts as restored. */
const TOLERANCE = 2;

/**
 * Restores the scroll position on back/forward navigation.
 *
 * The router can do this itself, but not dependably while `withViewTransitions`
 * is on: the restore happens around the transition's DOM swap, before the
 * incoming page has been laid out, so the scroll clamps to 0 and you land at
 * the top of the gallery instead of on the photo you opened.
 *
 * So this owns the whole job rather than correcting the router afterwards: it
 * records the position on the way out, and on the way back re-applies it over
 * successive frames until it sticks — which is as soon as the page is tall
 * enough to hold it. `withInMemoryScrolling` is deliberately left off.
 */
@Injectable({ providedIn: 'root' })
export class ScrollRestorationService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);

  /** Scroll offset of each completed navigation, by its navigation id. */
  private readonly positions = new Map<number, number>();

  /** The navigation whose page is on screen right now. */
  private currentId = 0;

  /** Set while a navigation is in flight. */
  private incomingId = 0;
  private restoreTarget: number | null = null;

  private activeTransition: ViewTransition | null = null;
  private cancelPending: (() => void) | null = null;

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationStart | NavigationEnd =>
            event instanceof NavigationStart || event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.onLeaving(event);
        } else {
          this.onArrived();
        }
      });
  }

  /**
   * Called from `onViewTransitionCreated`. Back and forward navigations skip
   * the animation: the transition covers the page with a snapshot taken before
   * the scroll is restored, so the morph would play against the top of the
   * list. Forward navigation keeps it, which is where it reads best anyway.
   */
  track(transition: ViewTransition): void {
    if (this.restoreTarget !== null) {
      transition.skipTransition();
      return;
    }

    this.activeTransition = transition;
    this.settled(transition).then(() => {
      if (this.activeTransition === transition) {
        this.activeTransition = null;
      }
    });
  }

  private onLeaving(event: NavigationStart): void {
    const view = this.document.defaultView;
    if (view) {
      this.positions.set(this.currentId, view.scrollY);
    }

    this.incomingId = event.id;
    // Present only on popstate, and names the navigation being returned to.
    const restoredId = event.restoredState?.navigationId;
    this.restoreTarget = restoredId !== undefined ? (this.positions.get(restoredId) ?? 0) : null;
  }

  private onArrived(): void {
    this.currentId = this.incomingId;

    const target = this.restoreTarget;
    this.restoreTarget = null;
    this.cancelPending?.();

    // A forward navigation starts at the top, the way the router would.
    this.persist(target ?? 0);

    const transition = this.activeTransition;
    if (transition) {
      this.settled(transition).then(() => this.persist(target ?? 0));
    }
  }

  /**
   * Scrolls to `top` and keeps re-applying it each frame until it holds — the
   * page may still be growing as the incoming view renders.
   */
  private persist(top: number): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    let attempts = 0;
    let timer = 0;
    let cancelled = false;

    const stop = () => {
      cancelled = true;
      view.clearTimeout(timer);
      view.removeEventListener('wheel', stop);
      view.removeEventListener('touchstart', stop);
      if (this.cancelPending === stop) {
        this.cancelPending = null;
      }
    };

    // Whatever the reader does wins; never fight a scroll they started.
    view.addEventListener('wheel', stop, { once: true, passive: true });
    view.addEventListener('touchstart', stop, { once: true, passive: true });
    this.cancelPending = stop;

    const apply = () => {
      if (cancelled) {
        return;
      }

      view.scrollTo(0, top);
      attempts++;

      if (Math.abs(view.scrollY - top) <= TOLERANCE || attempts >= MAX_ATTEMPTS) {
        stop();
        return;
      }

      timer = view.setTimeout(apply, RETRY_INTERVAL);
    };

    // Outside Angular: this is a scroll loop, not application state.
    this.zone.runOutsideAngular(apply);
  }

  private settled(transition: ViewTransition): Promise<void> {
    // A transition is skipped outright when the tab is hidden, which rejects
    // these promises; swallow that so it never surfaces as an unhandled error.
    return transition.finished.catch(() => undefined);
  }
}
