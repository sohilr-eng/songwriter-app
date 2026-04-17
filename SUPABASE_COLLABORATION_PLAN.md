# Supabase Collaboration Migration Plan

## Handoff Status

This section is the current handoff state for another coding agent taking over implementation.

### Current Code State

The codebase is past planning and well into implementation.

Completed in code:

- Phase `1 alpha`
- Phase `1 beta`
- Phase `2 alpha`
- most of Phase `2 beta`

### What Is Already Implemented

#### Architecture

- repository abstraction exists
- local DB access is mostly behind repository and local adapter boundaries
- app-level event layer exists
- domain and persistence type boundaries exist

#### Auth and Account Foundation

- Supabase client/bootstrap scaffold exists
- auth provider/context exists
- email and social auth entry points exist
- auth callback handling exists
- profile bootstrap and editing exist
- cloud action gating exists

#### Owner-Only Cloud Backup

- owner-only song schema exists remotely in Supabase
- local sync sidecar exists in SQLite
- manual per-song backup exists
- manual per-song restore exists
- cloud song discovery exists
- full-library owner backup exists
- pending-song sync exists

#### Owner-Only Sync Reliability

- song soft delete propagates remotely
- deleted songs can be restored locally
- section and line recordings are included in cloud backup/restore
- sync issues are classified into useful categories
- settings shows sync problems with retry/restore actions
- owner sync retries automatically with cooldowns
- owner sync status is exposed in UI

### Current Phase Position

The project is currently at:

- `Phase 2 beta`

More specifically:

- owner-only backup and restore are functional
- cross-device restore is functional
- audio recording sync for section and line recordings is functional
- automatic retry behavior exists
- sync error surfacing exists

### What Is Not Done Yet

The following are not implemented yet:

- public read-only share links
- invite tokens for private sharing
- membership model
- comments
- editable collaboration
- edit locks
- shared custom chord cloud model
- realtime presence or notifications

### Phase 2 Beta Remaining Polish

Phase `2 beta` is close enough that another agent can either:

1. do a short cleanup/polish pass, then begin Phase `3`
2. or begin Phase `3` immediately

Minor remaining polish items:

- clean up settings UI text that contains mojibake separators like `Â·` / `Ã‚Â·`
- optionally improve user-facing messages around automatic sync timing
- optionally add richer recovery paths for specific sync issue classes

None of those should block starting public sharing.

### Recommended Next Starting Point

Claude should start with:

- `Phase 3`

That means:

1. create the public read-only sharing schema
2. add a constrained public read path for shared live songs
3. add owner UI to generate/revoke public song links
4. add the public song view route/screen

### Important Implementation Guidance for Handoff

- Keep SQLite as the on-device source of truth.
- Do not move Supabase calls into screens.
- Keep sharing access narrow and explicit.
- Do not relax table permissions for public sharing.
- Keep brainstorm and snapshots private.
- Do not start editable collaboration before the public sharing and membership layers are clean.

## Goal

Evolve the app from a local-first songwriting tool into a local-first, account-aware, cloud-backed product with:

- accounts
- owner cloud backup
- cross-device restore
- public read-only song sharing
- private invites and membership
- comments
- editable collaboration with owner-controlled conflict resolution

This plan assumes:

- SQLite remains the on-device source of truth
- Supabase is the remote system of record for synced and shared data
- offline editing remains first-class
- `.swsong` remains backup/export, not the main collaboration model
- iOS and Android are the real priority

## Product Rules Locked In

- Local draft first.
- Account required before cloud backup, sharing, or collaboration.
- Public read-only links should work without sign-in.
- Private invite tokens should grant access after redemption.
- Sharing starts with individual songs, not albums.
- Brainstorm stays private.
- Snapshots stay private.
- Live document is what gets shared.
- Roles start as `owner`, `editor`, `viewer`.
- Viewers can comment.
- Owner retains ownership permanently.
- No duplicating another user’s song into a separate private library entry.
- Custom chord name and fretboard diagram should be shared with the song later.
- Offline conflict policy: owner version wins if conflicting offline edits collide.
- Editable collaboration should use a coarse lock before richer conflict handling.
- Notifications, presence, and realtime awareness can wait.

## Architectural Principles

- Components and screens must not import Supabase directly.
- Hooks should depend on repositories and domain types, not raw storage rows.
- Local and remote concerns stay separated.
- Sync logic stays in dedicated services, not UI code.
- Database and storage authorization must use RLS and table relationships, not `user_metadata`.
- Public sharing must use narrow, explicit access paths, not relaxed table permissions.

## Target Architecture

### App Layers

- `types/domain/*`
  Domain-facing models used by hooks and screens.
- `repositories/*`
  Contracts such as `SongsRepository`, `ProfilesRepository`, `CommentsRepository`.
- `data/local/*`
  SQLite-backed implementations.
- `data/remote/*`
  Supabase-backed implementations.
- `auth/*`
  Session state, login flows, profile bootstrap.
- `sync/*`
  Push, pull, retry, reconciliation, conflict policies.
- `features/sharing/*`
  Public links, invites, memberships.
- `features/collaboration/*`
  Comments, edit lock, later realtime behavior.
- `storage/*`
  Audio, covers, exported assets.

### Data Boundaries

- SQLite stays authoritative on device.
- Sync metadata stays local-side unless remote metadata is required.
- Remote schema stores canonical shared state.
- UI should continue to consume stable hook and repository APIs while internals evolve.

## Supabase Data Model

### Implemented or Planned Core Tables

- `profiles`
- `songs`
- `song_sections`
- `song_lines`
- `song_audio_assets`
- `song_members`
- `song_invites`
- `song_comments`
- `song_edit_locks`
- `song_custom_chords`
- `public_song_links`
- `brainstorm_entries`
- `snapshots`

### Current Remote Foundation

Already created:

- `profiles`
- `songs`
- `song_sections`
- `song_lines`
- `song_audio_assets`
- private storage bucket `song-audio`

### Local Sync Metadata

Current local sync sidecar tracks:

- `entity_type`
- `entity_id`
- `remote_id`
- `owner_id`
- `updated_by`
- `sync_status`
- `local_updated_at`
- `remote_updated_at`
- `last_synced_at`
- `sync_version`
- `deleted_at`
- `last_error`

## Security Model

### Current Principles

- owner-only access for current synced song tables
- RLS enabled on exposed tables
- private storage bucket for song audio
- storage object paths scoped by owner id

### Future Access Model

- owner: full control
- editor: can edit live shared copy when lock rules allow
- viewer: read and comment
- public link: constrained read-only projection only

## Phased Roadmap

## Phase 1 Alpha

### Purpose

Prepare the codebase structurally before auth and sync behavior.

### Scope

- introduce repository contracts
- move local DB calls behind local adapters
- separate app-level events from DB event details
- split domain-facing types from persistence record types
- add Supabase client scaffolding and env wiring without product dependence

### Status

Completed.

### Outcomes

- app code no longer depends directly on most `db/*` modules
- a reusable repository seam exists for future remote adapters
- Supabase client/bootstrap scaffolding is present

## Phase 1 Beta

### Purpose

Add auth and account-aware behavior without collapsing local-first usage.

### Scope

- session bootstrap
- account context/provider
- email and social auth entry points
- auth callback handling
- profile bootstrap and editing
- cloud readiness gating

### Status

Completed as the current baseline.

### Outcomes

- local drafting still works without account
- account exists for cloud-capable flows
- profile editing exists
- cloud-only features can be gated consistently

## Phase 2 Alpha

### Purpose

Ship owner-only cloud persistence before multi-user access.

### Scope

- remote owner-only schema
- local sync sidecar
- manual song backup
- manual restore
- cloud song discovery
- owner-only text structure sync

### Status

Completed.

### Outcomes

- owner can back up songs to Supabase
- owner can restore songs on another device
- settings can show cloud library state

## Phase 2 Beta

### Purpose

Turn owner sync from manual-only into a reliable cloud backup loop.

### Scope

- pending sync coordination
- partial-success bulk sync behavior
- song soft delete propagation
- local deleted-song recovery
- audio recording upload and restore
- automatic retry on app resume/session readiness
- sync issue classification and recovery UI
- background retry visibility

### Status

In progress and mostly complete for owner-only backup reliability.

### Implemented

- pending/conflict song sync coordinator
- auto owner-sync retry with cooldowns
- local deleted-song restore flow
- remote soft delete propagation for songs
- section/line recording sync via `song_audio_assets` and `song-audio`
- sync issue classification
- retry/restore affordances in settings
- owner-sync activity status in UI

### Remaining Before Declaring Phase 2 Beta Fully Done

- optional cleanup pass on UI copy and mojibake separators in settings strings
- optional richer manual recovery for specific failure classes
- optional explicit toast/banner when background owner sync starts or finishes
- optional stronger device/network awareness if later needed

## Phase 3

### Purpose

Add public read-only sharing.

### Scope

- `public_song_links`
- owner-generated public share tokens
- unauthenticated read-only song view
- constrained public read access path
- no write access

### Requirements

- public consumers can view current live song
- no authentication required
- no exposure of private brainstorm, snapshots, or owner-only metadata

### Suggested Implementation

- create `public_song_links`
- create a narrow query path for shared songs
- add public route/screen for preview
- later add revoke/regenerate link behavior

## Phase 4 Alpha

### Purpose

Add private sharing and lightweight collaboration without true shared editing.

### Scope

- `song_members`
- `song_invites`
- invite token redemption
- shared library visibility
- viewer and editor roles
- song-level and anchored comments

### Requirements

- invite token grants access after redemption
- viewers can comment
- comments can be song-level or attached to section/line

## Phase 4 Beta

### Purpose

Add editable collaboration with coarse locking and owner-wins conflict policy.

### Scope

- `song_edit_locks`
- editor role behavior
- owner manual lock takeover
- offline conflict handling aligned with owner precedence

### Requirements

- owner can reclaim editing control manually
- collaborator edits remain constrained
- owner wins in conflicting offline write collisions

## Phase 5

### Purpose

Add higher-order collaboration features only if product traction justifies it.

### Scope

- realtime presence
- collaboration awareness
- notifications
- richer comment UX
- maybe live edit indicators

## Detailed Implementation Order

## Current Completed Work

### Codebase Refactor and Auth

- repository abstraction
- local adapters
- app event layer
- domain/persistence type split
- Supabase bootstrap
- auth provider/context
- auth screen and callback handling
- profile bootstrap/editing
- cloud action gating

### Owner Sync Foundation

- remote song schema
- local sync metadata
- manual backup/restore
- cloud song listing
- per-song sync state UI

### Reliability Work

- pending sync coordination
- auto retry bootstrap
- soft delete propagation
- deleted-song recovery
- audio sync
- sync issue UI
- auto sync status UI

## Next Recommended Implementation Order

1. Close the remaining `2 beta` polish items.
2. Start `3` with public read-only sharing.
3. Add `4 alpha` invite and membership model.
4. Add comments.
5. Add `4 beta` edit locks and editor flows.

## Planned Future Schema Additions

### Public Sharing

- `public_song_links`
  - `id`
  - `song_id`
  - `owner_id`
  - `token`
  - `revoked_at`
  - timestamps

### Membership

- `song_members`
  - `song_id`
  - `user_id`
  - `role`
  - timestamps

- `song_invites`
  - `id`
  - `song_id`
  - `owner_id`
  - `token`
  - `role`
  - `redeemed_by`
  - `expires_at`
  - timestamps

### Comments

- `song_comments`
  - `id`
  - `song_id`
  - `author_id`
  - `section_id`
  - `line_id`
  - `body`
  - timestamps

### Editing Control

- `song_edit_locks`
  - `song_id`
  - `held_by`
  - `granted_by_owner`
  - `expires_at`
  - timestamps

### Shared Custom Chords

- `song_custom_chords`
  - `id`
  - `song_id`
  - `name`
  - `frets`
  - `fingers`
  - `barre`
  - `base_fret`
  - timestamps

## Open Technical Notes

### Audio

- current synced audio is limited to section and line recordings
- bucket is private
- object path format is owner-scoped and song-scoped
- server-side audio processing is intentionally not part of v1

### Custom Chords

- local custom chords are currently broader than the future shared model
- remote sync for custom chords should wait until the per-song/shared contract is finalized

### Albums

- sharing starts with songs only
- albums remain out of scope until the song sharing model is stable

### Web

- web is not a primary target right now
- avoid architecture choices that make later web support impossible

## Definition of Done by Phase

### Phase 2 Beta Done Means

- owner backup is reliable enough for real use
- restore works across devices
- song deletion and recovery sync coherently
- section/line recordings are part of backup/restore
- failures are visible and recoverable
- automatic retry exists with sane guardrails

### Phase 3 Done Means

- owner can create or revoke a public read-only link
- unauthenticated visitor can open shared live song
- no unauthorized write path exists

### Phase 4 Alpha Done Means

- owner can invite viewer/editor
- invite token redemption works
- shared song appears in recipient library
- comments work

### Phase 4 Beta Done Means

- editors can edit only when lock rules allow
- owner can take over lock manually
- owner-wins conflict rule is enforced

## Current Recommendation

Do not keep stretching owner-only sync indefinitely. The codebase now has enough foundation to begin Phase 3 after a short polish pass on current `2 beta` UI and recovery details.
