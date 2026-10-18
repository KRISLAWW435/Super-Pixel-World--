# Super Pixel World — Electron Desktop Packaging & Offline Audit Plan

A comprehensive architectural plan to audit, harden, and package **Super Pixel World** as a standalone, 100% offline desktop application for Windows using Electron and electron-builder (NSIS installer).

---

## Game Architecture Evaluation: 8.5 / 10 🎮

### Senior Game Architect Review:
* **Gameplay & Physics (9/10):** Very tight platformer controls. Implements platformer feel standards: coyote time (80ms), jump buffering (100ms), variable jump height, sub-pixel movement integration, and multi-directional AABB tile collision with velocity resolution.
* **Level Editor & Tools (9/10):** Rich canvas-based WYSIWYG editor featuring dynamic brush, line, rect, eraser, and pick tools. Auto-tiling logic with neighborhood bitmasks, multi-layer placement (background, collision, interactables, entities), and undo/redo history stack.
* **Audio Engineering (8.5/10):** Dual-mode audio combining procedural Web Audio API synthesizers (zero latency SFX) with HTML5 Audio BGM cross-faders and responsive volume/mute management.
* **Onboarding & UX (9/10):** Outstanding 12-step guided onboarding curriculum with interactive highlighting, target clamping, and anti-stuck mechanics.
* **Desktop Readiness (7.5/10 -> 10/10 after audit):** Current web build depends on external Google Fonts and default absolute asset paths; fixing these along with a privileged protocol will make it an exemplary desktop release.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during the interactive interview:
> - **Packaging Target:** Windows NSIS Installer wizard (`.exe`) with desktop & start menu shortcuts, install directory selection, and clean uninstaller.
> - **Font Bundling:** Self-contained offline fonts (**Fredoka** and **Press Start 2P**) bundled locally as WOFF2 in `src/assets/fonts/` with `@font-face` rules, removing external Google Fonts CDN links.
> - **Electron Protocol:** Custom privileged protocol (`app://`) registered with `standard`, `secure`, `supportFetchAPI`, `corsEnabled`, and `stream` capabilities. This eliminates CORS and audio decoding issues when reading local files.

---

## 1. Overview & Core Concept

Super Pixel World is transformed from a browser-dependent web app into a self-contained, offline-first native Windows application (`.exe`). The game will boot instantly without an internet connection, load all assets and music locally, and preserve player profiles, customized levels, and settings across game sessions.

---

## 2. Phase 1: Codebase Audit & Offline Hardening

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OFFLINE AUDIT MATRIX                            │
├──────────────────────┬────────────────────────┬────────────────────────┤
│ Vector               │ Current Web State      │ Desktop / Offline Fix  │
├──────────────────────┼────────────────────────┼────────────────────────┤
│ Typography           │ Google Fonts CDN       │ Local WOFF2 + @font-   │
│                      │ (fonts.googleapis.com) │ face in src/index.css  │
├──────────────────────┼────────────────────────┼────────────────────────┤
│ Asset Paths          │ Absolute / Vite root   │ base: './' in Vite     │
│                      │ (/assets/...)          │ for relative bundling  │
├──────────────────────┼────────────────────────┼────────────────────────┤
│ Audio & Streaming    │ new Audio() on paths   │ Privileged app://      │
│                      │ prone to CORS file://  │ scheme with streaming  │
├──────────────────────┼────────────────────────┼────────────────────────┤
│ LocalStorage State   │ Browser domain origin  │ Electron app origin;   │
│                      │ super_pixel_world_data │ keys 100% preserved    │
└──────────────────────┴────────────────────────┴────────────────────────┘
```

### 1.1 External Dependencies & Fonts
* **Audit:** `index.html` references `fonts.googleapis.com` and `fonts.gstatic.com`. In offline environments, typography falls back to generic system fonts.
* **Fix:**
  1. Download/provide WOFF2 font files locally in `src/assets/fonts/`:
     - `Fredoka-VariableFont_wdth,wght.woff2`
     - `PressStart2P-Regular.woff2`
  2. Add `@font-face` definitions to `src/index.css`.
  3. Strip external `<link>` tags from `index.html`.

### 1.2 Asset Paths & Vite Base Configuration
* **Audit:** Current `vite.config.ts` does not specify `base: './'`. Vite defaults to absolute paths (`/assets/script.js`), which breaks when opened through file protocols or custom schemes.
* **Fix:** Set `base: './'` in `vite.config.ts`. All compiled assets in `dist/` will use relative references (`./assets/`).

### 1.3 Audio & CORS Handling
* **Audit:** `src/audio/soundEngine.ts` instantiates BGM via `new Audio(saveStateUrl)`. When loaded via standard `file://`, Chromium restricts media streaming, Range requests, and cross-origin audio processing.
* **Fix:** In Electron's main process, register a custom privileged scheme `app://` before app ready:
  ```js
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true
      }
    }
  ]);
  ```
  And serve `dist/` files using `net.fetch(pathToFileURL(...))` or `protocol.handle('app', ...)`.

### 1.4 LocalStorage & Save Persistence
* **Audit:** `src/services/storageManager.ts` stores user profiles, game levels, and settings under keys:
  - `super_pixel_world_data`
  - `super_pixel_world_level_v5`
* **Integrity Guarantee:** Zero changes will be made to these keys. Because the app runs consistently on `app://bundle` (or `app://-`), Electron isolates LocalStorage into `%APPDATA%/super-pixel-world/Local Storage/leveldb`, keeping saves safe and persistent forever.

---

## 3. Phase 2: Safe Electron Implementation

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 ELECTRON RUNTIME (DESKTOP)                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ MAIN PROCESS (electron/main.cjs)                      │  │
│  │ ├─ Privileged Protocol: app:// -> dist/               │  │
│  │ ├─ BrowserWindow (Frameless / Titlebar, 1280x720)     │  │
│  │ ├─ webPreferences: contextIsolation: true             │  │
│  │ │                   nodeIntegration: false            │  │
│  │ └─ asar: true + asarUnpack for MP3 audio streaming    │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ IPC / Safe Protocol           │
│  ┌──────────────────────────▼────────────────────────────┐  │
│  │ RENDERER PROCESS (Chromium Sandboxed WebCore)         │  │
│  │ ├─ Local WOFF2 Fonts (Fredoka & Press Start 2P)       │  │
│  │ ├─ Game Engine Canvas (physics.ts & spriteRenderer)   │  │
│  │ ├─ SoundEngine (Web Audio SFX + HTML5 BGM)            │  │
│  │ └─ LocalStorage (super_pixel_world_data)              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 ASAR Recommendation: `asar: true` with `asarUnpack`
* **Recommendation:** Use `asar: true` combined with `"asarUnpack": ["**/*.mp3", "**/*.ogg"]`.
* **Why:**
  1. Packaging code into an ASAR archive improves filesystem read performance and keeps game assets organized in a single archive.
  2. Chromium's HTML5 Audio elements (`<audio>` and `new Audio()`) require HTTP Range request seeking for large compressed MP3 audio files. Unpacking `.mp3` files outside the ASAR archive via `asarUnpack` prevents audio playback stutter or seeking freezes, giving 100% reliability for background music.

### 2.2 Main Process (`electron/main.cjs`)
* Secure setup with `contextIsolation: true` and `nodeIntegration: false`.
* Register `app` scheme as privileged with standard streaming support.
* Load `app://./index.html` after app is ready.
* Handle window lifecycle, full-screen toggling (F11), and graceful shutdown.

### 2.3 electron-builder Configuration in `package.json`
* Target: `nsis` (Windows installer)
* Configured with installer shortcuts, custom install directory prompt, and uninstaller.

---

## 4. Phase 3: Step-by-Step Execution Plan

### Step 1: Assets & Fonts Hardening
- Create `src/assets/fonts/` directory.
- Download WOFF2 font files for Fredoka and Press Start 2P.
- Add `@font-face` declarations into `src/index.css`.
- Remove CDN `<link>` tags from `index.html`.

### Step 2: Build Pipeline Hardening
- Update `vite.config.ts` to include `base: './'`.
- Verify `npm run build` compiles with relative asset references.

### Step 3: Electron Application Scaffolding
- Create `electron/main.cjs` implementing the privileged `app://` protocol and secure BrowserWindow.
- Create `electron/preload.cjs` (clean sandbox).
- Install dev dependencies: `electron` and `electron-builder`.
- Update `package.json` with main entry, build scripts, and `electron-builder` configuration.

### Step 4: Verification & Compilation
- Run `compile_applet` and `lint_applet` to confirm no regressions in web build.
- Test packaging commands and verify `dist/` output.
