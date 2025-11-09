# Electron Auto-Update Implementation Plan

**Version:** 1.0
**Date:** 2025-11-09
**Status:** Planning
**Author:** Claude Code

## Executive Summary

This document outlines the implementation plan for adding automatic update functionality to the Thread Note Electron application. The implementation will enable seamless, secure updates for users without requiring manual downloads and installations.

## Current State

### Existing Architecture

The Thread Note Electron app currently has:

- **Main Process**: `frontend/electron/main/index.ts` - Creates BrowserWindow and manages app lifecycle
- **Preload Script**: `frontend/electron/preload/index.ts` - Minimal IPC bridge for platform detection
- **Build System**:
  - `electron-vite` - Builds main, preload, and renderer processes
  - `electron-builder` - Packages macOS DMG installer
- **No Auto-Update Mechanism**: Users must manually download and install updates

### Current Limitations

1. No automatic update checking
2. No update download capability
3. No user notification system for updates
4. No code signing configuration
5. No release automation

## Goals

### Primary Goals

1. **Automatic Update Detection**: Check for updates on app start and periodically
2. **Seamless Downloads**: Download updates in background without blocking user
3. **User Notifications**: Inform users about available updates and installation status
4. **Secure Updates**: Implement code signing for macOS Gatekeeper compliance
5. **Easy Deployment**: Automate release process via GitHub Actions

### Non-Goals

- Multi-channel support (beta/staging) in MVP
- Delta updates (differential downloads)
- Forced updates (always user-initiated install)
- Cross-platform support beyond macOS in initial release

## Implementation Phases

### Phase 1: Dependencies & Basic Configuration

**Duration:** 1 day
**Effort:** Low

#### Tasks

1. **Install electron-updater**
   ```bash
   cd frontend
   bun add electron-updater
   ```

2. **Update electron-builder.json**
   - Add publish configuration for GitHub Releases
   - Configure update channel
   - Set up artifact naming

   ```json
   {
     "appId": "com.threadnote.app",
     "productName": "Thread Note",
     "publish": {
       "provider": "github",
       "owner": "ta21cos",
       "repo": "thread-type-note-app",
       "releaseType": "release"
     },
     "mac": {
       "hardenedRuntime": true,
       "gatekeeperAssess": false,
       "entitlements": "build/entitlements.mac.plist",
       "entitlementsInherit": "build/entitlements.mac.plist"
     }
   }
   ```

**Deliverables:**
- Updated `package.json` with electron-updater
- Updated `electron-builder.json` with publish config

---

### Phase 2: Main Process Update Logic

**Duration:** 2 days
**Effort:** Medium

#### Tasks

1. **Create Update Manager Module**

   File: `frontend/electron/main/updater.ts`

   Features:
   - Initialize autoUpdater with configuration
   - Check for updates on app start (with 5s delay)
   - Handle all update lifecycle events
   - Logging for debugging
   - Error handling

2. **Update Event Handlers**

   Events to handle:
   - `checking-for-update` - Log check started
   - `update-available` - Notify renderer, start download
   - `update-not-available` - Log current version is latest
   - `download-progress` - Send progress to renderer
   - `update-downloaded` - Notify user, prepare for install
   - `error` - Log errors, notify user if critical

3. **Integrate with Main Process**

   File: `frontend/electron/main/index.ts`

   - Import updater module
   - Initialize after app ready
   - Set up periodic checks (every 4 hours)

**Code Structure:**
```typescript
// frontend/electron/main/updater.ts
import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

export class UpdateManager {
  private mainWindow: BrowserWindow | null = null

  constructor(window: BrowserWindow) {
    this.mainWindow = window
    this.setupAutoUpdater()
  }

  private setupAutoUpdater() {
    // Configure autoUpdater
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    // Event handlers
    autoUpdater.on('checking-for-update', () => {
      this.log('Checking for updates...')
    })

    autoUpdater.on('update-available', (info) => {
      this.log('Update available:', info.version)
      this.sendToRenderer('update-available', info)
    })

    autoUpdater.on('update-not-available', (info) => {
      this.log('No updates available')
    })

    autoUpdater.on('download-progress', (progress) => {
      this.sendToRenderer('update-download-progress', progress)
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.log('Update downloaded:', info.version)
      this.sendToRenderer('update-downloaded', info)
    })

    autoUpdater.on('error', (error) => {
      this.log('Update error:', error)
      this.sendToRenderer('update-error', error.message)
    })
  }

  checkForUpdates() {
    if (process.env.NODE_ENV === 'development') {
      this.log('Skipping update check in development')
      return
    }
    autoUpdater.checkForUpdates()
  }

  quitAndInstall() {
    autoUpdater.quitAndInstall()
  }

  private sendToRenderer(channel: string, data: any) {
    this.mainWindow?.webContents.send(`updater:${channel}`, data)
  }

  private log(...args: any[]) {
    console.log('[Updater]', ...args)
  }
}
```

**Deliverables:**
- `frontend/electron/main/updater.ts` - Update manager module
- Updated `frontend/electron/main/index.ts` - Integration
- Update logging system

---

### Phase 3: IPC Communication Bridge

**Duration:** 1 day
**Effort:** Low

#### Tasks

1. **Extend Preload Script**

   File: `frontend/electron/preload/index.ts`

   Add update-related APIs:
   - Listen for update events from main process
   - Expose install update trigger
   - Type-safe event callbacks

2. **Type Definitions**

   Create TypeScript interfaces for update data:
   - UpdateInfo
   - DownloadProgress
   - Update event types

**Code Structure:**
```typescript
// frontend/electron/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,

  // Update APIs
  updates: {
    onUpdateAvailable: (callback: (info: any) => void) => {
      ipcRenderer.on('updater:update-available', (_event, info) => callback(info))
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('updater:update-download-progress', (_event, progress) => callback(progress))
    },
    onUpdateDownloaded: (callback: (info: any) => void) => {
      ipcRenderer.on('updater:update-downloaded', (_event, info) => callback(info))
    },
    onUpdateError: (callback: (message: string) => void) => {
      ipcRenderer.on('updater:update-error', (_event, message) => callback(message))
    },
    installUpdate: () => {
      ipcRenderer.send('updater:install-update')
    }
  }
})

// Type declarations
declare global {
  interface Window {
    electron: {
      platform: NodeJS.Platform
      updates: {
        onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void
        onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void
        onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void
        onUpdateError: (callback: (message: string) => void) => void
        installUpdate: () => void
      }
    }
  }
}

interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
}

interface DownloadProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}
```

**Deliverables:**
- Updated `frontend/electron/preload/index.ts`
- Type definitions for update events
- IPC channel documentation

---

### Phase 4: User Interface Components

**Duration:** 2-3 days
**Effort:** Medium

#### Tasks

1. **Create Update Hook**

   File: `frontend/src/hooks/useUpdater.ts`

   React hook to manage update state:
   - Subscribe to update events
   - Track download progress
   - Trigger installation

2. **Update Notification Components**

   Using existing Sonner toast system:
   - "Checking for updates..." notification
   - "Update available - Downloading..." with progress
   - "Update ready - Restart to install" with action button

3. **Update Settings (Optional)**

   Add to settings page:
   - Manual check for updates button
   - Auto-update toggle
   - Current version display

**Code Structure:**
```typescript
// frontend/src/hooks/useUpdater.ts
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface UpdateState {
  available: boolean
  downloading: boolean
  downloaded: boolean
  progress: number
  version?: string
  error?: string
}

export function useUpdater() {
  const [updateState, setUpdateState] = useState<UpdateState>({
    available: false,
    downloading: false,
    downloaded: false,
    progress: 0
  })

  useEffect(() => {
    if (!window.electron?.updates) return

    // Update available
    window.electron.updates.onUpdateAvailable((info) => {
      setUpdateState(prev => ({
        ...prev,
        available: true,
        downloading: true,
        version: info.version
      }))

      toast.info(`Update available: v${info.version}`, {
        description: 'Downloading in background...',
        duration: 5000
      })
    })

    // Download progress
    window.electron.updates.onDownloadProgress((progress) => {
      setUpdateState(prev => ({
        ...prev,
        progress: Math.round(progress.percent)
      }))
    })

    // Update downloaded
    window.electron.updates.onUpdateDownloaded((info) => {
      setUpdateState(prev => ({
        ...prev,
        downloading: false,
        downloaded: true
      }))

      toast.success(`Update ready: v${info.version}`, {
        description: 'Restart to install',
        action: {
          label: 'Restart Now',
          onClick: () => window.electron.updates.installUpdate()
        },
        duration: Infinity // Don't auto-dismiss
      })
    })

    // Error handling
    window.electron.updates.onUpdateError((message) => {
      setUpdateState(prev => ({
        ...prev,
        error: message,
        downloading: false
      }))

      toast.error('Update failed', {
        description: message
      })
    })
  }, [])

  return updateState
}
```

**Usage in App:**
```typescript
// frontend/src/App.tsx
import { useUpdater } from './hooks/useUpdater'

function App() {
  useUpdater() // Subscribe to update events

  return (
    // ... existing app code
  )
}
```

**Deliverables:**
- `frontend/src/hooks/useUpdater.ts` - Update hook
- Toast notifications for update lifecycle
- Optional: Settings UI for manual checks

---

### Phase 5: Code Signing & Security

**Duration:** 2-3 days
**Effort:** High (requires Apple Developer account)

#### Tasks

1. **macOS Code Signing Setup**

   Requirements:
   - Apple Developer account ($99/year)
   - Developer ID Application certificate
   - App-specific password for notarization

2. **Create Entitlements File**

   File: `frontend/build/entitlements.mac.plist`

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>com.apple.security.cs.allow-jit</key>
     <true/>
     <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
     <true/>
     <key>com.apple.security.cs.disable-library-validation</key>
     <true/>
   </dict>
   </plist>
   ```

3. **Configure Notarization**

   Add to `electron-builder.json`:
   ```json
   {
     "afterSign": "scripts/notarize.js",
     "mac": {
       "hardenedRuntime": true,
       "gatekeeperAssess": false
     }
   }
   ```

4. **Environment Variables**

   Set for CI/CD:
   - `APPLE_ID` - Apple Developer email
   - `APPLE_ID_PASSWORD` - App-specific password
   - `APPLE_TEAM_ID` - Team ID from developer account
   - `CSC_LINK` - Base64-encoded certificate
   - `CSC_KEY_PASSWORD` - Certificate password

**Alternative for Testing:**
- Skip code signing initially
- Test with developer builds
- Add signing before production release

**Deliverables:**
- `frontend/build/entitlements.mac.plist`
- `frontend/scripts/notarize.js` (if using notarization)
- Updated `electron-builder.json`
- Documentation for certificate setup

---

### Phase 6: Release Automation

**Duration:** 2 days
**Effort:** Medium

#### Tasks

1. **Create GitHub Actions Workflow**

   File: `.github/workflows/release.yml`

   Triggers:
   - Manual workflow dispatch
   - Tag push (e.g., `v1.0.1`)

   Steps:
   - Checkout code
   - Setup Bun
   - Install dependencies
   - Run tests
   - Build Electron app
   - Sign and notarize (if configured)
   - Create GitHub Release
   - Upload DMG as release asset
   - Trigger auto-update for users

2. **Version Bump Script**

   File: `scripts/bump-version.sh`

   Automate version updates:
   - Prompt for version (patch/minor/major)
   - Update `package.json`
   - Create git tag
   - Push to trigger release

3. **Release Checklist**

   Document process:
   - Pre-release testing
   - Version bump
   - Tag creation
   - Release notes
   - Post-release verification

**GitHub Actions Workflow:**
```yaml
name: Release Electron App

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  release:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: |
          cd frontend
          bun install

      - name: Run tests
        run: |
          cd frontend
          bun test

      - name: Build Electron app
        run: |
          cd frontend
          bun run build:production
          bun run package:mac:production
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload release assets
        uses: softprops/action-gh-release@v1
        with:
          files: frontend/release/*.dmg
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Deliverables:**
- `.github/workflows/release.yml`
- `scripts/bump-version.sh`
- Release process documentation

---

### Phase 7: Testing & Documentation

**Duration:** 2 days
**Effort:** Medium

#### Tasks

1. **Update Testing**

   Test scenarios:
   - ✅ Check for updates when none available
   - ✅ Check for updates when new version exists
   - ✅ Download progress tracking
   - ✅ Update installation on restart
   - ✅ Error handling (network failures)
   - ✅ Multiple rapid checks (debouncing)
   - ✅ Update while app is in use

2. **Mock Update Server (Development)**

   Create test releases:
   - Set up staging GitHub repo
   - Create test release with higher version
   - Verify update flow end-to-end

3. **Documentation**

   Files to create/update:
   - `docs/auto-update-user-guide.md` - User-facing docs
   - `docs/auto-update-development.md` - Developer guide
   - `README.md` - Update with auto-update info
   - `CHANGELOG.md` - Track update feature release

**Test Checklist:**
```markdown
## Auto-Update Test Checklist

### Setup
- [ ] Build production app with version 1.0.0
- [ ] Install on test machine
- [ ] Create GitHub release with version 1.0.1

### Test Cases
- [ ] App checks for updates on launch
- [ ] Update notification appears
- [ ] Download progress shows correctly
- [ ] "Restart to install" prompt appears
- [ ] App installs update on restart
- [ ] New version number displays after update

### Edge Cases
- [ ] No internet connection - graceful failure
- [ ] Download interrupted - retry logic
- [ ] User closes app during download - resume
- [ ] Already on latest version - no notification

### Security
- [ ] Code signature valid on downloaded update
- [ ] macOS Gatekeeper allows installation
- [ ] Update only from official GitHub releases
```

**Deliverables:**
- Test scenarios documented
- Test checklist completed
- User documentation
- Developer documentation

---

## Technical Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  UpdateManager (updater.ts)                        │ │
│  │  - autoUpdater initialization                      │ │
│  │  - Event handling                                  │ │
│  │  - Periodic checks                                 │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│                          │ IPC Events                    │
│                          ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Preload Script (preload/index.ts)                 │ │
│  │  - contextBridge API                               │ │
│  │  - Type-safe event forwarding                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ window.electron.updates
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    React Renderer Process                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  useUpdater Hook (hooks/useUpdater.ts)            │ │
│  │  - Subscribe to events                             │ │
│  │  - Manage update state                             │ │
│  │  - Trigger toast notifications                     │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  UI Components                                      │ │
│  │  - Toast notifications (Sonner)                    │ │
│  │  - Settings page (optional)                        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│              GitHub Releases (Update Server)             │
│  - latest.yml (update metadata)                          │
│  - Thread-Note-1.0.1.dmg (installer)                    │
│  - Code signature verification                           │
└─────────────────────────────────────────────────────────┘
```

### Update Flow Sequence

```
User Opens App
    │
    ├─→ Main Process starts
    │       │
    │       ├─→ UpdateManager.checkForUpdates() (after 5s delay)
    │       │       │
    │       │       ├─→ electron-updater → GitHub API
    │       │       │       │
    │       │       │       ├─→ Compare versions
    │       │       │       │
    │       │       │       └─→ [No update] → Silent, log only
    │       │       │           [Update available] → Download
    │       │       │                   │
    │       │       │                   ├─→ Send 'update-available' to renderer
    │       │       │                   │       │
    │       │       │                   │       └─→ Toast: "Downloading update..."
    │       │       │                   │
    │       │       │                   ├─→ Download progress events
    │       │       │                   │       │
    │       │       │                   │       └─→ Toast updates with %
    │       │       │                   │
    │       │       │                   └─→ Download complete
    │       │       │                           │
    │       │       │                           ├─→ Send 'update-downloaded'
    │       │       │                           │       │
    │       │       │                           │       └─→ Toast: "Restart to install"
    │       │       │                           │               │
    │       │       │                           │               └─→ User clicks "Restart"
    │       │       │                           │                       │
    │       │       │                           │                       └─→ installUpdate()
    │       │       │                           │
    │       │       │                           └─→ App quits & installs
    │       │       │                                   │
    │       │       │                                   └─→ New version launches
    │       │       │
    │       │       └─→ [Error] → Send error to renderer
    │       │               │
    │       │               └─→ Toast: "Update failed"
    │       │
    │       └─→ Periodic checks every 4 hours
    │
    └─→ Continue normal app operation
```

---

## Dependencies

### New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| electron-updater | ^6.1.0 | Auto-update implementation |

### Existing Dependencies (Utilized)

| Package | Purpose |
|---------|---------|
| electron-builder | Build and package app with publish config |
| sonner | Toast notifications for update UI |
| react | UI components for update status |

---

## Configuration Changes

### Files to Modify

1. **frontend/package.json**
   - Add `electron-updater` dependency
   - Add version field (semantic versioning)

2. **frontend/electron-builder.json**
   - Add `publish` configuration
   - Add `mac.hardenedRuntime`
   - Add `mac.entitlements`

3. **frontend/electron/main/index.ts**
   - Import and initialize UpdateManager
   - Set up periodic check interval

### Files to Create

1. **frontend/electron/main/updater.ts** - Update manager
2. **frontend/build/entitlements.mac.plist** - macOS entitlements
3. **frontend/src/hooks/useUpdater.ts** - React update hook
4. **.github/workflows/release.yml** - CI/CD pipeline
5. **scripts/bump-version.sh** - Version management
6. **scripts/notarize.js** - Apple notarization (optional)
7. **docs/auto-update-user-guide.md** - User documentation
8. **docs/auto-update-development.md** - Developer guide

---

## Environment Variables

### Required for CI/CD (GitHub Secrets)

```bash
# Apple Developer Account
APPLE_ID=your-apple-id@example.com
APPLE_ID_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App-specific password
APPLE_TEAM_ID=XXXXXXXXXX

# Code Signing Certificate
CSC_LINK=base64-encoded-certificate
CSC_KEY_PASSWORD=certificate-password

# GitHub Token (auto-provided)
GITHUB_TOKEN=automatically-provided-by-actions
```

### Local Development

```bash
# .env (optional, for testing)
ELECTRON_UPDATER_ENDPOINT=http://localhost:3000/updates
SKIP_NOTARIZATION=true
```

---

## Rollout Strategy

### MVP Release (v1.1.0)

**Scope:**
- Basic auto-update checking
- Background downloads
- Simple toast notifications
- GitHub Releases integration
- macOS only

**Timeline:** 2-3 weeks

### Enhanced Release (v1.2.0)

**Scope:**
- Code signing & notarization
- Settings page for manual checks
- Download progress UI
- Better error handling
- Release notes display

**Timeline:** +2 weeks

### Future Enhancements (v2.0+)

**Potential Features:**
- Multi-channel support (beta/stable)
- Windows/Linux support
- Delta updates (smaller downloads)
- Rollback capability
- Usage analytics for update success rates

---

## Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Code signing issues | Users can't install updates | Set up test environment, thorough testing |
| Broken update kills app | Users stuck on broken version | Implement rollback, staged rollout |
| Large download sizes | Poor user experience | Optimize build, consider delta updates |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| GitHub API rate limits | Update checks fail | Implement caching, retry logic |
| Network failures | Updates don't download | Retry with exponential backoff |
| Users ignore updates | Fragmented versions | Add manual check option |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Notification fatigue | Users disable updates | Reasonable check frequency (4 hrs) |
| Version confusion | Support issues | Clear version display in app |

---

## Success Metrics

### Technical Metrics

- ✅ Update check success rate > 95%
- ✅ Download completion rate > 90%
- ✅ Install success rate > 95%
- ✅ Average download time < 2 minutes (10MB app)
- ✅ Update check latency < 5 seconds

### User Metrics

- ✅ % of users on latest version within 7 days > 80%
- ✅ Support tickets related to manual updates reduced by 50%
- ✅ User satisfaction with update process > 4/5

---

## Decision Log

### Key Decisions

1. **Update Provider: GitHub Releases**
   - Rationale: Free, simple, well-integrated with electron-updater
   - Alternative: S3, custom server (rejected - added complexity)

2. **Auto-download: Enabled by default**
   - Rationale: Seamless user experience
   - Alternative: Manual download (rejected - friction)

3. **Auto-install: On app quit**
   - Rationale: Balance between seamless and user control
   - Alternative: Silent install (rejected - risky), always prompt (rejected - annoying)

4. **Update frequency: On start + every 4 hours**
   - Rationale: Reasonable balance, not intrusive
   - Alternative: Daily only (rejected - too slow), hourly (rejected - too aggressive)

5. **Initial platform: macOS only**
   - Rationale: Current build targets macOS
   - Alternative: Cross-platform (deferred to v1.2.0)

### Open Questions

1. **Code signing setup?**
   - Status: Pending decision
   - Options: Set up now vs. defer to later phase
   - Blocker: Requires Apple Developer account ($99/year)

2. **Beta channel support?**
   - Status: Deferred to v1.2.0
   - Options: Add now vs. wait for user demand

3. **Release notes display?**
   - Status: Deferred to v1.2.0
   - Options: Show in-app vs. link to GitHub

---

## Timeline & Milestones

### Week 1
- ✅ Install dependencies
- ✅ Create UpdateManager module
- ✅ Basic update checking
- ✅ IPC bridge setup

### Week 2
- ✅ React hook implementation
- ✅ Toast notifications
- ✅ Testing infrastructure
- ✅ Documentation

### Week 3 (Optional - Code Signing)
- ⏳ Apple Developer setup
- ⏳ Certificate configuration
- ⏳ Notarization setup
- ⏳ Testing with signed builds

### Week 4
- ✅ GitHub Actions workflow
- ✅ Release process documentation
- ✅ First production release
- ✅ User rollout

---

## References

### Documentation
- [electron-updater Official Docs](https://www.electron.build/auto-update)
- [Electron Code Signing](https://www.electron.build/code-signing)
- [Apple Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

### Similar Implementations
- VS Code auto-update
- Slack desktop app
- Discord desktop app

---

## Appendix

### Glossary

- **Auto-updater**: electron-updater library that handles update lifecycle
- **Code Signing**: Digital signature proving app authenticity
- **Notarization**: Apple's malware scanning process
- **DMG**: macOS disk image installer format
- **IPC**: Inter-Process Communication between main and renderer
- **Gatekeeper**: macOS security feature blocking unsigned apps

### Version Numbering

Following semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backwards compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (e.g., 1.0.0 → 1.0.1)

Auto-update feature will be released as **v1.1.0** (new feature, no breaking changes).

---

**Next Steps:** Proceed with Phase 1 implementation upon approval.
