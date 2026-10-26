import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { ScrollRestorationService } from '../scroll-restoration.service';

/** A window whose scroll is clamped, the way a not-yet-laid-out page behaves. */
function createFakeView() {
  const pending: (() => void)[] = [];
  const listeners = new Map<string, EventListener>();

  const view = {
    scrollY: 0,
    /** Scroll offsets beyond this are clamped. */
    maxScroll: 0,
    scrollTo: (_x: number, y: number) => {
      view.scrollY = Math.min(y, view.maxScroll);
    },
    setTimeout: (cb: () => void) => pending.push(cb),
    clearTimeout: vi.fn(),
    addEventListener: (type: string, listener: EventListener) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
  };

  return {
    view,
    /** Runs every retry queued so far; returns how many ran. */
    flushFrame(): number {
      const due = pending.splice(0, pending.length);
      due.forEach((cb) => cb());
      return due.length;
    },
    drain(limit = 200): number {
      let ran = 0;
      while (this.flushFrame() > 0 && ran < limit) {
        ran++;
      }
      return ran;
    },
    fire(type: string) {
      listeners.get(type)?.(new Event(type));
    },
  };
}

describe('ScrollRestorationService', () => {
  let events: Subject<NavigationStart | NavigationEnd>;
  let harness: ReturnType<typeof createFakeView>;

  function start(id: number, url: string, restoredNavigationId?: number) {
    const event = new NavigationStart(id, url);
    if (restoredNavigationId !== undefined) {
      event.navigationTrigger = 'popstate';
      event.restoredState = { navigationId: restoredNavigationId };
    }
    events.next(event);
  }

  function end(id: number, url: string) {
    events.next(new NavigationEnd(id, url, url));
  }

  /** The app's own first navigation, which lands on the gallery. */
  function bootstrapNavigation() {
    start(1, '/');
    end(1, '/');
    harness.drain();
  }

  /** Opens a photo from a gallery scrolled to `from`, then goes back. */
  function openPhotoAndReturn(from: number) {
    bootstrapNavigation();
    harness.view.maxScroll = 5000;
    harness.view.scrollTo(0, from);

    start(2, '/photo/5');
    end(2, '/photo/5');
    harness.drain();

    // The incoming gallery has not been laid out yet, so it cannot scroll.
    harness.view.maxScroll = 0;
    start(3, '/', 1);
    end(3, '/');
  }

  beforeEach(() => {
    events = new Subject();
    harness = createFakeView();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events } },
        { provide: DOCUMENT, useValue: { defaultView: harness.view } },
      ],
    });

    TestBed.inject(ScrollRestorationService);
  });

  it('returns to where the gallery was left once the page can hold the scroll', () => {
    openPhotoAndReturn(1200);

    // Still clamped while the gallery renders.
    expect(harness.view.scrollY).toBe(0);

    harness.flushFrame();
    expect(harness.view.scrollY).toBe(0);

    // The gallery finishes rendering and the document regains its height.
    harness.view.maxScroll = 5000;
    harness.drain();

    expect(harness.view.scrollY).toBe(1200);
  });

  it('restores immediately when the page is already tall enough', () => {
    bootstrapNavigation();
    harness.view.maxScroll = 5000;
    harness.view.scrollTo(0, 900);

    start(2, '/photo/5');
    end(2, '/photo/5');
    harness.drain();

    start(3, '/', 1);
    end(3, '/');

    expect(harness.view.scrollY).toBe(900);
  });

  it('sends forward navigations to the top', () => {
    bootstrapNavigation();
    harness.view.maxScroll = 5000;
    harness.view.scrollTo(0, 1200);

    start(2, '/photo/5');
    end(2, '/photo/5');
    harness.drain();

    expect(harness.view.scrollY).toBe(0);
  });

  it('gives up after a bounded number of frames rather than looping forever', () => {
    openPhotoAndReturn(1200);
    const ran = harness.drain();

    expect(ran).toBeLessThan(200);
    expect(harness.view.scrollY).toBe(0);
  });

  it('stops correcting as soon as the reader scrolls themselves', () => {
    openPhotoAndReturn(1200);

    harness.fire('wheel');
    harness.view.maxScroll = 5000;
    harness.drain();

    expect(harness.view.scrollY).toBe(0);
  });

  it('skips the transition animation on back navigation', () => {
    const skipTransition = vi.fn();
    const transition = { skipTransition, finished: Promise.resolve() } as unknown as ViewTransition;

    bootstrapNavigation();
    harness.view.maxScroll = 5000;
    start(2, '/photo/5');
    TestBed.inject(ScrollRestorationService).track(transition);

    expect(skipTransition).not.toHaveBeenCalled();

    end(2, '/photo/5');
    start(3, '/', 1);
    TestBed.inject(ScrollRestorationService).track(transition);

    expect(skipTransition).toHaveBeenCalledTimes(1);
  });
});
