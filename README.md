# XM Photo Gallery

An infinite-scroll photo gallery built with **Angular 22** (signals, `httpResource`/`rxResource`, zoneless change detection) against the [Picsum Photos API](https://picsum.photos/). Built as practice ahead of a take-home assignment for a Senior Angular Developer role at XM.

## Features

- **Infinite scroll** photo stream, paginated from the Picsum `/v2/list` endpoint
- **Favorites** — toggle from the grid or the detail page, persisted to `localStorage`, survives reload
- **Photo detail page** — resolves instantly from already-loaded data (stream/favorites) with zero network call, falls back to a direct fetch only when needed
- Responsive **masonry grid** (1–4 columns depending on viewport)
- Loading, empty, and error states with retry
- Accessible favorite toggles (`aria-pressed`, `aria-label`), lazy-loaded images, keyboard-reachable nav

## Stack

Angular 22 · Angular Material · SCSS · Vitest (default Angular test runner, not Jasmine/Karma) · RxJS interop (`rxResource`) · No state library — plain signal-based services, which is all this app's scope justifies.

## Running it

```bash
npm install
ng serve        # http://localhost:4200
ng test         # unit tests (Vitest)
ng lint         # ESLint (angular-eslint)
ng build        # production build
```

## Architecture decisions

**Vertical-slice folders, not type-based ones.** `core/` (singleton services, models), `shared/` (reusable UI + directives), `features/` (routed pages). Each feature folder owns its component, template, and styles together rather than scattering them across `components/`, `services/`, `templates/` siblings.

**Signal-based stores instead of NgRx.** `PhotoStreamStore` and `FavoritesStore` are plain `@Injectable` services holding `signal()` state, with `computed()` derivations and an `effect()` for localStorage persistence. NgRx Signal Store's entity/event-sourcing machinery isn't justified for two entities and a handful of actions — it would be pure boilerplate here. See `core/services/`.

**Favorites store full `Photo` objects, not just ids.** The favorites page has to render thumbnails for photos that may have long since scrolled out of the paginated stream. Storing the full record (not re-fetching by id) keeps the favorites page a zero-network read, at the cost of slightly more `localStorage` usage — a clearly worthwhile trade for a photo gallery.

**`PhotoDetailPage` prefers already-loaded data over a network call.** It looks the photo up in `PhotoStreamStore`/`FavoritesStore` first; only if neither has it does an `rxResource` fire a request to Picsum's `/id/:id/info` endpoint. The resource's `params()` function returns `undefined` to skip the request entirely when local data is available — no manual `if/subscribe` branching needed.

**Dumb/smart component split.** `PhotoCard`/`PhotoGrid` (shared/ui) take plain inputs and emit outputs; they know nothing about stores or HTTP. `PhotosPage`/`FavoritesPage`/`PhotoDetailPage` (features/) inject the stores and wire them to the dumb components. This is what makes the dumb components trivially unit-testable with `fixture.componentRef.setInput()` and no DI mocking beyond the router.

**Custom `IntersectionObserver` directive instead of a scroll-event library.** `InfiniteScrollDirective` observes a 1px sentinel with a 300px `rootMargin`, so the next page starts loading before the user hits the literal bottom of the page. It guards against concurrent `loadMore()` calls in `PhotoStreamStore` itself (not the directive), so rapid-fire intersection events can't trigger overlapping requests.

**No NgOptimizedImage.** It expects a CDN/loader contract Picsum's URL scheme doesn't cleanly fit (width/height are path segments, not query params it understands out of the box), and the manual `loading="lazy"` + explicit width/height already covers the main win (no layout shift, native lazy loading) for this scope. Would reconsider for a production app with more image volume.

## Known limitations

- No tests against the **real** Picsum API — all HTTP is mocked (`HttpTestingController`) or stubbed at the service boundary. The one manual check against the live API was a `curl` sanity check during development, not an automated test.
- No E2E/browser test suite (Playwright/Cypress) — coverage is unit + component-integration tests only (67 tests across services, directives, and components). The app was smoke-tested via `ng serve` + a manual request against the dev server, not a full browser-driven walkthrough.
- `NgOptimizedImage` deliberately not used (see above) — revisit if swapping image sources.
- No skeleton loaders on first paint, just a spinner — a nice-to-have, not a correctness gap.
- Picsum has no search/filter/category API, so there's nothing to filter the gallery by beyond pagination.

## Connection to the role

Built to demonstrate the same decisions a real XM take-home would be judged on: modern Angular 22 idioms (signals, `input()`/`output()`, `rxResource`, zoneless), TDD (every piece of logic was written test-first — see the commit history), a defensible vertical-slice architecture, and restraint (no NgRx, no Tailwind-on-top-of-Material, no over-engineering) over throwing every advanced API at a small app for its own sake.
