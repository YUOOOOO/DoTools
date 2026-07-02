# Window Behavior

## Launcher Window

The launcher window is created in `electron/main.ts`.

Current behavior:

- Frameless window.
- Hidden on startup.
- Shown by global shortcut.
- Always on top.
- Skipped from taskbar.
- User resizing is disabled by locking minimum and maximum size to the active launcher size.
- Hidden on blur.
- Hidden on `Esc`.
- Initial size: `760 x 92`.
- Expanded size: `760 x 430`.

Expansion is controlled by the Electron main process using `before-input-event`.

Programmatic expansion changes the locked minimum and maximum size together. This keeps the launcher from being manually resized while preserving the `92px` to `430px` expansion behavior.

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

## Settings Window

The settings window is opened from the launcher's gear button.

Current behavior:

- Frameless window.
- Fixed two-column layout.
- Left column contains the logo and built-in menu.
- Right column displays the selected built-in menu content.
- Menu selection changes right-side content in the same window.
- The header area is draggable.
