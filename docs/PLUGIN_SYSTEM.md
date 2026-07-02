# Plugin System

DoTools uses a local plugin directory and a controlled preload bridge.

## Plugin Directory

Development plugin root:

```text
plugins/
```

Each plugin lives in its own folder:

```text
plugins/
  text-tools/
    plugin.json
    index.html
```

## Manifest

Each plugin must provide `plugin.json`.

```json
{
  "manifestVersion": 1,
  "id": "com.dotools.text-tools",
  "name": "Text Tools",
  "version": "1.0.0",
  "description": "Basic clipboard and text helpers.",
  "author": "DoTools",
  "entry": "index.html",
  "keywords": ["text", "clipboard", "case"],
  "permissions": ["clipboard.read", "clipboard.write", "storage", "notification"],
  "commands": [
    {
      "id": "clipboard-text-tools",
      "title": "Clipboard Text Tools",
      "description": "Read, transform, and write clipboard text.",
      "keywords": ["clipboard", "uppercase", "lowercase", "text"]
    }
  ]
}
```

## Permissions

Known permissions are defined in `shared/plugin.ts`.

Current permissions:

- `clipboard.read`
- `clipboard.write`
- `storage`
- `shell.openExternal`
- `dialog.pickFile`
- `dialog.pickDirectory`
- `notification`

Permissions are checked in the Electron main process. Plugins should not receive direct Node.js or Electron access.

## Preload Bridge

Runtime preload file:

```text
electron/preload.cjs
```

Type shape for renderer development:

```text
electron/preload.ts
```

The bridge exposes:

```ts
window.doTools.plugins.listCommands()
window.doTools.plugins.reload()
window.doTools.plugins.open(pluginId, commandId)

window.doTools.clipboard.readText()
window.doTools.clipboard.writeText(text)

window.doTools.storage.get(key)
window.doTools.storage.set(key, value)
window.doTools.storage.remove(key)
window.doTools.storage.clear()

window.doTools.app.closePlugin()
window.doTools.app.setAlwaysOnTop(pinned)
window.doTools.app.isAlwaysOnTop()
```

## Plugin Identity

Plugin identity is tracked by the main process using:

```text
webContents.id -> pluginId
```

Plugins should not pass their own `pluginId` for privileged actions.
