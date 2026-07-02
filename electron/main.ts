import { app, BrowserWindow, clipboard, dialog, globalShortcut, ipcMain, Notification, shell } from 'electron'
import path from 'node:path'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  assertPluginPermission,
  getLauncherCommands,
  getPlugin,
  getPluginEntry,
  loadPlugins,
} from './pluginRegistry.js'
import type { PluginContext } from '../shared/plugin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pluginContexts = new Map<number, PluginContext>()

let mainWindow: BrowserWindow | null = null
let launcherShortcut = ''

function setLauncherExpanded(expanded: boolean) {
  if (!mainWindow) return

  const bounds = mainWindow.getBounds()
  mainWindow.setResizable(true)
  mainWindow.setBounds({
    ...bounds,
    height: expanded ? 430 : 92,
  })
  mainWindow.setResizable(false)
}

function getPreloadPath() {
  return path.join(process.cwd(), 'electron', 'preload.cjs')
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 760,
    height: 92,
    minWidth: 640,
    minHeight: 92,
    title: 'DoTools',
    show: false,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#101318',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: getPreloadPath(),
    },
  })

  mainWindow.on('blur', () => {
    mainWindow?.hide()
  })

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') return

    if (input.key === 'Escape') {
      mainWindow?.hide()
      return
    }

    if (input.control || input.alt || input.meta) return

    if (input.key.length === 1 || input.key === 'Backspace' || input.key === 'Delete') {
      setLauncherExpanded(true)
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    return
  }

  void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

function showLauncher() {
  if (!mainWindow) return

  mainWindow.center()
  setLauncherExpanded(false)
  mainWindow.show()
  mainWindow.focus()
  mainWindow.webContents.send('launcher:show')
}

function toggleLauncher() {
  if (!mainWindow) return

  if (mainWindow.isVisible()) {
    mainWindow.hide()
    return
  }

  showLauncher()
}

function registerLauncherShortcut() {
  const shortcuts = ['Alt+Space', 'CommandOrControl+Space']

  for (const shortcut of shortcuts) {
    if (globalShortcut.register(shortcut, toggleLauncher)) {
      launcherShortcut = shortcut
      return
    }
  }
}

function createPluginWindow(pluginId: string, commandId?: string) {
  const plugin = getPlugin(pluginId)
  const entry = getPluginEntry(pluginId, commandId)

  if (!plugin || !entry) {
    throw new Error('Plugin not found')
  }

  const pluginWindow = new BrowserWindow({
    width: 840,
    height: 620,
    minWidth: 600,
    minHeight: 420,
    title: plugin.name,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: '#111318',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: getPreloadPath(),
    },
  })

  pluginContexts.set(pluginWindow.webContents.id, {
    pluginId,
    pluginName: plugin.name,
    commandId,
  })

  pluginWindow.on('closed', () => {
    pluginContexts.delete(pluginWindow.webContents.id)
  })

  void pluginWindow.loadFile(entry)
}

function getPluginContext(webContentsId: number) {
  return pluginContexts.get(webContentsId)
}

function requirePluginContext(webContentsId: number) {
  const context = getPluginContext(webContentsId)
  if (!context) throw new Error('Plugin context not found')
  return context
}

function getPluginStoragePath(pluginId: string) {
  const dir = path.join(app.getPath('userData'), 'plugin-data', pluginId)
  mkdirSync(dir, { recursive: true })
  return path.join(dir, 'storage.json')
}

function readPluginStorage(pluginId: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(getPluginStoragePath(pluginId), 'utf-8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

function writePluginStorage(pluginId: string, data: Record<string, unknown>) {
  writeFileSync(getPluginStoragePath(pluginId), JSON.stringify(data, null, 2), 'utf-8')
}

app.whenReady().then(() => {
  loadPlugins()
  createMainWindow()
  registerLauncherShortcut()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('plugins:listCommands', () => getLauncherCommands())

ipcMain.handle('plugins:reload', () => {
  loadPlugins()
  return getLauncherCommands()
})

ipcMain.handle('plugins:open', (_event, pluginId: string, commandId?: string) => {
  createPluginWindow(pluginId, commandId)
})

ipcMain.handle('app:getPluginContext', (event) => getPluginContext(event.sender.id) ?? null)

ipcMain.handle('app:closePlugin', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

ipcMain.handle('app:setAlwaysOnTop', (event, pinned: boolean) => {
  BrowserWindow.fromWebContents(event.sender)?.setAlwaysOnTop(Boolean(pinned))
})

ipcMain.handle('app:isAlwaysOnTop', (event) => {
  return BrowserWindow.fromWebContents(event.sender)?.isAlwaysOnTop() ?? false
})

ipcMain.handle('app:getLauncherShortcut', () => launcherShortcut)

ipcMain.handle('app:hideLauncher', () => {
  mainWindow?.hide()
})

ipcMain.handle('clipboard:readText', (event) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'clipboard.read')
  return clipboard.readText()
})

ipcMain.handle('clipboard:writeText', (event, text: string) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'clipboard.write')
  clipboard.writeText(String(text))
})

ipcMain.handle('shell:openExternal', async (event, url: string) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'shell.openExternal')

  const parsed = new URL(url)
  if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
    throw new Error('Unsupported URL protocol')
  }

  await shell.openExternal(parsed.toString())
})

ipcMain.handle('dialog:pickFile', async (event) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'dialog.pickFile')

  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
  })

  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:pickDirectory', async (event) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'dialog.pickDirectory')

  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })

  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('notification:show', (event, options: { title?: string; body?: string }) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'notification')

  new Notification({
    title: options.title || context.pluginName,
    body: options.body || '',
  }).show()
})

ipcMain.handle('storage:get', (event, key: string) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'storage')
  return readPluginStorage(context.pluginId)[key]
})

ipcMain.handle('storage:set', (event, key: string, value: unknown) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'storage')

  const data = readPluginStorage(context.pluginId)
  data[key] = value
  writePluginStorage(context.pluginId, data)
})

ipcMain.handle('storage:remove', (event, key: string) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'storage')

  const data = readPluginStorage(context.pluginId)
  delete data[key]
  writePluginStorage(context.pluginId, data)
})

ipcMain.handle('storage:clear', (event) => {
  const context = requirePluginContext(event.sender.id)
  assertPluginPermission(context.pluginId, 'storage')
  rmSync(getPluginStoragePath(context.pluginId), { force: true })
})
