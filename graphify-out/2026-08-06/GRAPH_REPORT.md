# Graph Report - gym-tracker  (2026-08-06)

## Corpus Check
- 61 files · ~46,387 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 237 nodes · 247 edges · 59 communities (42 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a32340d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- useStore
- devDependencies
- package.json
- Timer.jsx
- schema.sql
- gym_tracker.sql
- AgendaView.jsx
- What You Must Do When Invoked
- StoreContext.jsx
- ExampleInstrumentedTest.java
- ExampleUnitTest.java
- gradlew
- MainActivity.java
- workout_sessions
- routines.js
- measurements
- public.users
- routines
- users
- logs
- users
- logs
- logs
- /graphify
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- React + Vite
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- CLAUDE.md
- .claude/CLAUDE.md
- extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `useStore()` - 17 edges
2. `What You Must Do When Invoked` - 12 edges
3. `/graphify` - 10 edges
4. `graphify reference: extra exports and benchmark` - 8 edges
5. `scripts` - 6 edges
6. `WorkoutDetails()` - 5 edges
7. `confirmAction()` - 5 edges
8. `graphify reference: query, path, explain` - 5 edges
9. `users` - 4 edges
10. ``users`` - 4 edges

## Surprising Connections (you probably didn't know these)
- `ProfileView()` --references--> `jspdf`  [EXTRACTED]
  src/components/ProfileView.jsx → package.json
- `AgendaView()` --calls--> `useStore()`  [EXTRACTED]
  src/components/AgendaView.jsx → src/hooks/useStore.js
- `App()` --calls--> `useStore()`  [EXTRACTED]
  src/App.jsx → src/hooks/useStore.js
- `AnalyticsView()` --calls--> `useStore()`  [EXTRACTED]
  src/components/AnalyticsView.jsx → src/hooks/useStore.js
- `LoginView()` --calls--> `useStore()`  [EXTRACTED]
  src/components/LoginView.jsx → src/hooks/useStore.js

## Import Cycles
- None detected.

## Communities (59 total, 17 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.07
Nodes (29): @capacitor/android, @capacitor/cli, @capacitor/core, @capacitor/filesystem, @capacitor/local-notifications, @capacitor/share, jspdf, jspdf-autotable (+21 more)

### Community 1 - "useStore"
Cohesion: 0.17
Nodes (19): App(), AnalyticsView(), cardStyle, modalContentStyle, modalOverlayStyle, sectionStyle, sectionTitleStyle, LoginView() (+11 more)

### Community 2 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+11 more)

### Community 3 - "package.json"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, build:android, dev, lint, preview (+2 more)

### Community 4 - "Timer.jsx"
Cohesion: 0.57
Nodes (5): Timer(), cancelNotification(), createChannel(), requestNotificationPermission(), scheduleNotification()

### Community 5 - "schema.sql"
Cohesion: 0.67
Nodes (5): exercises, logs, measurements, routines, users

### Community 6 - "gym_tracker.sql"
Cohesion: 0.67
Nodes (5): `exercises`, `logs`, `measurements`, `routines`, `users`

### Community 7 - "AgendaView.jsx"
Cohesion: 0.33
Nodes (5): addBtnStyle, AgendaView(), DAYS_OF_WEEK, MONTHS, navBtnStyle

### Community 8 - "What You Must Do When Invoked"
Cohesion: 0.13
Nodes (15): Part A - Structural extraction for code files, Part B - Semantic extraction (parallel subagents), Part C - Merge AST + semantic into final extraction, Step 0 - GitHub repos and multi-path merge (only if a URL or several paths), Step 1 - Ensure graphify is installed, Step 2.5 - Video and audio (only if video files detected), Step 2 - Detect files, Step 3 - Extract entities and relationships (+7 more)

### Community 9 - "StoreContext.jsx"
Cohesion: 0.47
Nodes (3): StoreContext, StoreProvider(), supabase

### Community 10 - "ExampleInstrumentedTest.java"
Cohesion: 0.60
Nodes (3): ExampleInstrumentedTest, Test, RunWith

### Community 12 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 47 - "/graphify"
Cohesion: 0.20
Nodes (9): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Usage (+1 more)

### Community 48 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 49 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 50 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 51 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 52 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 53 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

## Knowledge Gaps
- **90 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+85 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `jspdf` connect `dependencies` to `useStore`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `ProfileView()` connect `useStore` to `dependencies`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _90 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `What You Must Do When Invoked` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._