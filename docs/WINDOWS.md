# Window Behavior

## Launcher Window

The launcher window is created in `electron/main.ts`.

Current behavior:

- Frameless window.
- Hidden on startup.
- Shown by global shortcut.
- Always on top.
- Skipped from taskbar.
- User resizing is disabled.
- Hidden on blur.
- Hidden on `Esc`.
- Initial size: `760 x 92`.
- Expanded size: `760 x 430`.

Expansion is controlled by the Electron main process using `before-input-event`.

Programmatic expansion temporarily enables resizing, applies the new bounds, and disables resizing again. This keeps the launcher from being manually resized while preserving the `92px` to `430px` expansion behavior.

Reason:

- Renderer-side resize through preload was unreliable while the preload bridge format was being adjusted.
- Main-process input handling is now the primary launcher resize behavior.

## Draggable Regions

Frameless windows need explicit draggable regions.

Launcher:

```css
.shell {
  -webkit-app-region: drag;
}

.search,
.settings-button,
.command {
  -webkit-app-region: no-drag;
}
```

Plugin pages should define their own draggable title area:

```css
.titlebar {
  -webkit-app-region: drag;
}

.window-actions {
  -webkit-app-region: no-drag;
}
```

## Plugin Windows

Plugin windows are created in `createPluginWindow()`.

Current behavior:

- Frameless.
- Always on top by default.
- Uses the same secure preload bridge as the launcher.
- Supports `setAlwaysOnTop()` and `isAlwaysOnTop()` through `window.doTools.app`.

The sample `Text Tools` plugin includes:

- draggable titlebar
- pin button
- close button
