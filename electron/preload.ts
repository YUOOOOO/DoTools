import { contextBridge, ipcRenderer } from 'electron'
import type { LauncherCommand, PluginContext } from '../shared/plugin.js'

const api = {
  plugins: {
    listCommands: (): Promise<LauncherCommand[]> => ipcRenderer.invoke('plugins:listCommands'),
    reload: (): Promise<LauncherCommand[]> => ipcRenderer.invoke('plugins:reload'),
    open: (pluginId: string, commandId?: string): Promise<void> => ipcRenderer.invoke('plugins:open', pluginId, commandId),
  },

  clipboard: {
    readText: (): Promise<string> => ipcRenderer.invoke('clipboard:readText'),
    writeText: (text: string): Promise<void> => ipcRenderer.invoke('clipboard:writeText', text),
  },

  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  },

  dialog: {
    pickFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickFile'),
    pickDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickDirectory'),
  },

  notification: {
    show: (options: { title?: string; body?: string }): Promise<void> => ipcRenderer.invoke('notification:show', options),
  },

  storage: {
    get: (key: string): Promise<unknown> => ipcRenderer.invoke('storage:get', key),
    set: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke('storage:set', key, value),
    remove: (key: string): Promise<void> => ipcRenderer.invoke('storage:remove', key),
    clear: (): Promise<void> => ipcRenderer.invoke('storage:clear'),
  },

  app: {
    getPluginContext: (): Promise<PluginContext | null> => ipcRenderer.invoke('app:getPluginContext'),
    getLauncherShortcut: (): Promise<string> => ipcRenderer.invoke('app:getLauncherShortcut'),
    hideLauncher: (): Promise<void> => ipcRenderer.invoke('app:hideLauncher'),
    closePlugin: (): Promise<void> => ipcRenderer.invoke('app:closePlugin'),
    setAlwaysOnTop: (pinned: boolean): Promise<void> => ipcRenderer.invoke('app:setAlwaysOnTop', pinned),
    isAlwaysOnTop: (): Promise<boolean> => ipcRenderer.invoke('app:isAlwaysOnTop'),
    onLauncherShow: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('launcher:show', listener)

      return () => {
        ipcRenderer.removeListener('launcher:show', listener)
      }
    },
  },
}

contextBridge.exposeInMainWorld('doTools', api)

export type DoToolsApi = typeof api
