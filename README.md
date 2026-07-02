# DoTools

DoTools is an Electron + Vue plugin platform inspired by uTools.

The current app focuses on a global launcher, a secure preload bridge, and a local third-party plugin model.

## Development

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## Current Behavior

- Press `Alt+Space` to show the launcher.
- If `Alt+Space` cannot be registered, the app tries `Ctrl+Space`.
- The launcher opens as a frameless floating input box.
- Empty launcher height is `92px`.
- Typing in the launcher expands the window to `430px`.
- Search results use a tile layout: plugin logo/initial on top, command title below.
- Press `Esc` or blur the launcher to hide it.
- Press `Enter` to open the first matched command.

## Project Structure

```text
electron/
  main.ts              Electron main process
  preload.cjs          Runtime preload bridge loaded by BrowserWindow
  preload.ts           TypeScript shape for renderer typings
  pluginRegistry.ts    Local plugin discovery and command registry

shared/
  plugin.ts            Plugin manifest, permission, and command types

src/
  App.vue              Launcher UI
  style.css            Launcher styling and draggable regions

plugins/
  text-tools/          Example local plugin

docs/
  FEATURES.md          Feature log
  PLUGIN_SYSTEM.md     Plugin protocol and bridge notes
  WINDOWS.md           Window behavior notes
```

## Documentation Rule

When adding or changing a feature, update the related markdown file in `docs/` in the same change.

Use:

- `docs/FEATURES.md` for user-visible behavior.
- `docs/PLUGIN_SYSTEM.md` for plugin protocol, permissions, and preload API.
- `docs/WINDOWS.md` for launcher or plugin window behavior.
