import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { InfiniteScrollDirective } from '../infinite-scroll.directive';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

@Component({
  selector: 'app-host',
  standalone: true,
  imports: [InfiniteScrollDirective],
  template: `<div appInfiniteScroll (loadMore)="onLoadMore()"></div>`,
})
class HostComponent {
  loadMoreCalls = 0;
  onLoadMore() {
    this.loadMoreCalls++;
  }
}

@Component({
  selector: 'app-disabled-host',
  standalone: true,
  imports: [InfiniteScrollDirective],
  template: `<div
    appInfiniteScroll
    [infiniteScrollDisabled]="true"
    (loadMore)="onLoadMore()"
  ></div>`,
})
class DisabledHostComponent {
  loadMoreCalls = 0;
  onLoadMore() {
    this.loadMoreCalls++;
  }
}

function setupObserverMock() {
  MockIntersectionObserver.instances = [];
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    MockIntersectionObserver;
}

describe('InfiniteScrollDirective', () => {
  let originalIntersectionObserver: typeof IntersectionObserver;

  beforeEach(() => {
    originalIntersectionObserver = globalThis.IntersectionObserver;
    setupObserverMock();
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  describe('enabled (default)', () => {
    let fixture: ComponentFixture<HostComponent>;

    beforeEach(async () => {
      TestBed.configureTestingModule({ imports: [HostComponent] });
      fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('observes the host element once rendered', () => {
      expect(MockIntersectionObserver.instances.length).toBe(1);
      expect(MockIntersectionObserver.instances[0].observe).toHaveBeenCalledTimes(1);
    });

    it('uses a root margin so loading starts before the sentinel is fully visible', () => {
      expect(MockIntersectionObserver.instances[0].options?.rootMargin).toBe('300px');
    });

    it('emits loadMore when the sentinel intersects', () => {
      MockIntersectionObserver.instances[0].trigger(true);

      expect(fixture.componentInstance.loadMoreCalls).toBe(1);
    });

    it('does not emit when the sentinel is not intersecting', () => {
      MockIntersectionObserver.instances[0].trigger(false);

      expect(fixture.componentInstance.loadMoreCalls).toBe(0);
    });

    it('disconnects the observer when the directive is destroyed', () => {
      const observerInstance = MockIntersectionObserver.instances[0];

      fixture.destroy();

      expect(observerInstance.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled', () => {
    let fixture: ComponentFixture<DisabledHostComponent>;

    beforeEach(async () => {
      TestBed.configureTestingModule({ imports: [DisabledHostComponent] });
      fixture = TestBed.createComponent(DisabledHostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('does not emit loadMore while disabled', () => {
      MockIntersectionObserver.instances[0].trigger(true);

      expect(fixture.componentInstance.loadMoreCalls).toBe(0);
    });
  });
});
