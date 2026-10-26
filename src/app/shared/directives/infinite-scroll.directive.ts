import {
  Directive,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
})
export class InfiniteScrollDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly infiniteScrollDisabled = input(false);
  readonly loadMore = output<void>();

  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting && !this.infiniteScrollDisabled()) {
            this.loadMore.emit();
          }
        },
        { rootMargin: '300px' }
      );
      this.observer.observe(this.elementRef.nativeElement);
    });

    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }
}
