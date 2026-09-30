# Mobile App Architecture Patterns

Layering, state, and modularization defaults for Android (following the official architecture guide and Now in Android), iOS (SwiftUI + Observation), and cross-platform stacks. As of 2026-09.

## Contents
- The shape: layers and data flow
- Rules catalog
- Android reference implementation
- iOS reference implementation
- Cross-platform state
- Modularization
- Anti-patterns
- Sources

## The shape: layers and data flow

```
 UI layer         Screen (Compose / SwiftUI)  ← renders UiState, sends events
                  ScreenViewModel / @Observable model  ← combines streams into UiState
 Domain (opt.)    UseCases  ← reusable logic combining repositories
 Data layer       Repositories  ← single public API to data; own sync
                  Local data source (DB, key-value)   Remote data source (HTTP, push)
```

Data flows **up** as streams; events flow **down** as method calls. Higher layers react to lower ones; lower layers never know about the UI. Note: this is the Android-recommended layered architecture, not a full "Clean Architecture" — add ceremony only where it pays.

## Rules catalog

### Expose one immutable UI state per screen
**Rule.** Each screen's model exposes a single observable state value (sealed Loading/Success/Error, or a data class with explicit fields) built by transforming data streams.
**Apply when.** Every screen with async data.
**Do / Avoid.** Do: `val uiState: StateFlow<FeedUiState>` produced with `combine(...).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), FeedUiState.Loading)`. Avoid: five separate `MutableLiveData`/`@Published` flags that can contradict each other.
**Why.** Impossible states become unrepresentable; screens are testable by feeding state.

### Send events down as method calls, model effects as state
**Rule.** UI calls model methods (`onRetry()`, `onItemSelected(id)`); results that need a UI reaction (navigate, show a message) become part of state and are acknowledged by the UI.
**Apply when.** Navigation after save, snackbars, dialogs.
**Do / Avoid.** Do: `state.userMessage` + `onMessageShown()`. Avoid: `Channel`/`SharedFlow` one-shot events that are dropped during configuration change or when no collector is active.
**Why.** Official Android guidance; lost events are a classic mobile bug.

### Make repositories the only door to data
**Rule.** UI and ViewModels never talk to DAOs, HTTP clients, or preferences directly; repositories expose streams for reads and suspend/async functions for writes, even with a single source.
**Apply when.** Always.
**Why.** One place to add caching, sync, and offline behavior; swap sources without touching screens; fakes for tests.

### Keep the domain layer optional
**Rule.** Add use cases only when logic is reused across ViewModels or a ViewModel grows complex; name them verb-first with one `invoke`.
**Apply when.** Combining several repositories (e.g. news + user bookmarks), shared validation.
**Why.** Pass-through use cases add files, not clarity (deep modules beat shallow layers).

### Scope state holders correctly
**Rule.** Screen-level ViewModels (Android `ViewModel`, iOS `@Observable` owned by the screen); reusable components use plain state holder classes; no `Context`, `Activity`, or UIKit views in models.
**Why.** Lifecycle leaks and untestable models.

### Collect lifecycle-aware
**Rule.** Android: `collectAsStateWithLifecycle()`; iOS: `.task(id:)` for async work bound to view lifetime; RN: effects with cleanup/abort controllers.
**Why.** Background collection wastes battery and triggers crashes on destroyed UI.

### Make concurrency explicit
**Rule.** Android: coroutines with structured concurrency, dispatchers injected, no `GlobalScope`. iOS: Swift 6 strict concurrency, `@MainActor` UI models, `Sendable` value models, actors for shared mutable state.
**Why.** Data races and main-thread I/O are the top causes of crashes and jank.

## Android reference implementation

```kotlin
sealed interface FeedUiState {
    data object Loading : FeedUiState
    data class Success(val items: List<FeedItem>, val lastSynced: Instant?, val isRefreshing: Boolean) : FeedUiState
    data class Error(val message: String) : FeedUiState
}

@HiltViewModel
class FeedViewModel @Inject constructor(
    private val repo: FeedRepository,
    private val sync: SyncStatusMonitor,
) : ViewModel() {
    val uiState: StateFlow<FeedUiState> =
        combine(repo.observeFeed(), sync.status) { items, status ->
            FeedUiState.Success(items, status.lastSynced, status.isSyncing)
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), FeedUiState.Loading)

    fun onRefresh() = viewModelScope.launch { repo.requestSync() }
    fun onBookmark(id: String) = viewModelScope.launch { repo.setBookmarked(id, true) }
}
```

- Single activity, Compose, Navigation 3, Hilt (Now in Android's choices).
- Local persistence: Room for relational data, Proto/Preferences DataStore for settings.
- Sync in WorkManager with exponential backoff (see `offline-sync.md`).

## iOS reference implementation

```swift
@MainActor @Observable
final class FeedModel {
    private(set) var items: [FeedItem] = []
    private(set) var lastSynced: Date?
    var userMessage: String?
    private let repo: FeedRepository

    init(repo: FeedRepository) { self.repo = repo }

    func observe() async {                       // called from .task { await model.observe() }
        for await snapshot in repo.feedUpdates() { items = snapshot.items; lastSynced = snapshot.lastSynced }
    }
    func refresh() async {
        do { try await repo.sync() } catch { userMessage = "Couldn't refresh. Showing saved items." }
    }
}
```

- SwiftUI + Observation; the view owns the model with `@State` and passes it down with `@Bindable`/environment.
- Persistence: SwiftData or Core Data for object graphs; GRDB/SQLite when you need SQL control and predictable migrations.
- Repositories as protocols (or concrete types with injectable dependencies) exposing `AsyncSequence` streams.
- Alternatives: The Composable Architecture (TCA) for teams wanting strict reducers, exhaustive testing, and effect management — adopt deliberately; it is a framework-level commitment.
- Modularize with local Swift packages: `Features/Feed`, `Core/Data`, `Core/DesignSystem`, `Core/Networking`.

## Cross-platform state

| Stack | Server/cached data | UI/client state | Notes |
|---|---|---|---|
| React Native | TanStack Query (or a sync engine) persisted to storage | `useState`/`useReducer`, a small store (Zustand-style) for cross-screen UI state | Don't put server data in a global store by hand; derive, don't duplicate |
| Flutter | Repository + stream from local DB | Riverpod or Bloc | One pattern per app |
| KMP | Shared repositories and sync in `commonMain` | Shared state holders exposing `StateFlow`; SwiftUI wraps them in `@Observable` adapters | Keep platform UI thin |
| Compose MP | Shared everything | Shared ViewModel (lifecycle KMP) | Platform-specific pieces via `expect/actual` |

## Modularization

When: build times hurt, several teams work in parallel, or you need enforced boundaries. Not for a two-screen app.

Now in Android layout (adapt names):

| Module | Contains | May depend on |
|---|---|---|
| `:app` | Navigation host, top-level destinations, app state, DI graph | everything |
| `:feature:x:api` | Navigation keys / public entry points | `:core:*` |
| `:feature:x:impl` | Screens, ViewModels | its own `api`, other features' `api`, `:core:*` — never another `impl` |
| `:core:data` | Repositories, sync | `:core:database`, `:core:network`, `:core:datastore`, `:core:model` |
| `:core:model` | Pure Kotlin models | nothing Android |
| `:core:designsystem` | Theme, components, icons | Compose/Material |
| `:core:testing` | Fakes, test rules | — |
| `sync`, `benchmark`, catalog app | Workers, Macrobenchmarks, component catalog | — |

Core never depends on features or app. Shared Gradle config lives in convention plugins (`build-logic`). iOS mirrors this with Swift packages; enforce boundaries with package dependencies, not folders.

## Anti-patterns

- God ViewModel/model per app ("MainViewModel") — split by screen.
- ViewModels calling Retrofit/URLSession directly — go through repositories.
- `AndroidViewModel`/`Context` in models; singletons holding Activities.
- Global mutable singletons for session state without thread safety.
- Business rules duplicated in iOS, Android, and backend with drift — share via KMP or move to the server.
- Premature Clean Architecture: interfaces with one implementation for every class, mappers for identical models, use cases that forward one call.
- Navigation logic scattered in views; deep links that bypass the navigation model.

## Sources

- Android — Guide to app architecture and Architecture recommendations: https://developer.android.com/topic/architecture , https://developer.android.com/topic/architecture/recommendations
- Android — UI events guidance (ViewModel events as state): https://developer.android.com/topic/architecture/ui-layer/events
- Now in Android (architecture and modularization learning journeys, Sept 2026): https://github.com/android/nowinandroid
- Apple — Observation and managing model data in SwiftUI: https://developer.apple.com/documentation/observation , https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app
- Swift concurrency (Swift 6 language mode): https://www.swift.org/documentation/concurrency/
- The Composable Architecture: https://github.com/pointfreeco/swift-composable-architecture
