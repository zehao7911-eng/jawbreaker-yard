# Jawbreaker Yard

A complete, original 3D hydraulic demolition arcade for touchscreens and browsers. Six structures across old-town, dockside and night yards, articulated hydraulic machinery and a seated human operator, structural cascades, bouncing rubble, salvage, 18 best-only stars and three earned machine paints.

## November 8 interaction polish

The selected cell now locks for each jaw stroke: dragging during closure aims the next stroke instead of redirecting the current hit. Contact arrives at 0.30 seconds and a repeated cycle takes 0.72 seconds. Short taps finish one accepted bite; one additional tap can queue during reopening instead of disappearing. Pointer cancellation discards an unstruck stroke. Leaving the page discards the uncommitted animation so a restored visit cannot silently resume a pending strike without its new host session. Late SDK support discovery no longer inserts a moving reward panel under a pending Resume click; optional interaction prompts live in the garage, and confirmed rewards enable paint buttons in place.

Live golden collapse previews are calculated with the same structural rules as the actual strike and never mutate progress. Steel warns that it needs two bites. Target outlines, a button-cycle bar, material-specific glass fragments/metal sparks, throttled rubble landing sounds and per-job best chain records make each bite readable. The title camera now shows the machine above the phone cover; wider structures use a wider portrait framing. Scenery and original six jobs/medal targets remain intact. The old save key/schema envelope is retained; best medals, paint, social claims and exact old block checkpoints migrate in place. Missing chain records start at zero, except the active checkpoint's known largest chain is retained.

## Play

Open `index.html` or `standalone.html` directly. Both contain the renderer, code and styles and work without a server, CDN, SDK, account or network. Drag on the 3D view to aim; hold to bite. The Support button selects a low bearing member. On keyboard use arrows and Space. Cut low supports for whole-column or girder cascades. No countdown, purchases or real prizes. Every bite and completed shift saves. Pause stops simulation and sound; reload resumes at the last committed bite, never a held touch.

`index-source.html` is the modular development entry; serve its folder with a static HTTP server. `node build.cjs` rebuilds the two identical offline entries. `node tests.mjs` runs controller, checkpoint, kinematics and SDK checks. Six finite jobs can be replayed to improve medals; this is not an endless campaign.

## Reference and assets

Observed Rezona Wreck & Rally: https://rezona.ai/game/pgcserver/pv/jhXPWpeh/v10/dist/index.html . Public first cottage, crane charge/release, 3% demolition and chain ×14 were observed. This independently built hydraulic-jaw interpretation references miniature construction and demolition feedback. It does not reproduce that game's full vehicle, free-driving, explosive or campaign systems. No reference code, models, recordings or textures are redistributed. Original geometric art, icon, interface, synthetic effects and gameplay. Original generic mesh helpers were reused from our Velvet Vanish project. Three.js r147 is bundled under its MIT license in vendor/THREE-LICENSE.txt. No AI image generation.

The collapse model uses authored bounded lateral bearing paths and detached-block gravity/bounce visuals, rather than a general-purpose rigid-body engineering simulator. The arm uses a rigid two-link inverse-kinematic solution over the whole interaction plane. Runtime quality bounds DPR to 1.5 (Light: 1); blocks, debris, windows and dust use instanced meshes, and static scenery is merged. This is a performance measure, not a physical-device FPS guarantee.

## GameWave

Official document rechecked November 8, 2026 (displayed October 30 revision): https://rg975ojk5z.feishu.cn/wiki/MQg7wMknzieOkukxyWVc4UB0nDh . The optional `window.neonlib` bridge never gates ordinary startup. A real accepted bite starts a host session; completion or abandoning an active job ends it once. Pause and result viewing create no additional lifecycle events. A restored partially completed ready job starts its new host session at its next real bite.

Only `jawbreaker-yard-v1` is read locally. A recognized `{game:'jawbreaker-yard',v:1,profile}` cloud envelope carries this game's best stars, preferences, explicit reward flags and exact removed/damaged-block checkpoint. Local active progress takes precedence over incoming cloud checkpoint; best medals and reward flags merge monotonically. Unknown/rejected cloud loads are never overwritten. Held input and uncommitted bite animation do not restore. No other game's storage is read, uploaded or cleared.

Successful async `onLike`/`onComment` registrations retain their actual unsubscribe functions, including late cleanup. Positive status and direct string project IDs are required; empty-string image comments qualify. Unlike, malformed events, count snapshots and duplicate callbacks grant nothing. Confirmed like/comment optionally unlock Cobalt/Midnight paint, also earnable via normal 6/12-star play. Claims persist per browser and recognized cloud profile; no server exactly-once promise. Unsupported prompts stay hidden. Viewport CSS dimensions are validated independently from density metadata, with a bounded local fallback.

Tests distinguish controller/static checks, mocked SDK behavior, local native-browser input and published-browser verification. Actual GameWave App/account/import, physical handset and commercial platform grading have not been certified.

## License

Original code and procedural assets: MIT, copyright 2026. Permission is granted, free of charge, to use, copy, modify, merge, publish, distribute, sublicense and sell copies, provided this notice is retained. The software is provided AS IS, without warranty of any kind. Third-party Three.js retains its separate notice.
