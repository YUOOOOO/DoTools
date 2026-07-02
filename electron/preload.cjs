const { contextBridge, ipcRenderer } = require('electron')

const api = {
  plugins: {
    listCommands: () => ipcRenderer.invoke('plugins:listCommands'),
    reload: () => ipcRenderer.invoke('plugins:reload'),
    open: (pluginId, commandId) => ipcRenderer.invoke('plugins:open', pluginId, commandId),
  },

  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard:readText'),
    writeText: (text) => ipcRenderer.invoke('clipboard:writeText', text),
  },

  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },

  dialog: {
    pickFile: () => ipcRenderer.invoke('dialog:pickFile'),
    pickDirectory: () => ipcRenderer.invoke('dialog:pickDirectory'),
  },

  notification: {
    show: (options) => ipcRenderer.invoke('notification:show', options),
  },

  storage: {
    get: (key) => ipcRenderer.invoke('storage:get', key),
    set: (key, value) => ipcRenderer.invoke('storage:set', key, value),
    remove: (key) => ipcRenderer.invoke('storage:remove', key),
    clear: () => ipcRenderer.invoke('storage:clear'),
  },

  app: {
    getPluginContext: () => ipcRenderer.invoke('app:getPluginContext'),
    getLauncherShortcut: () => ipcRenderer.invoke('app:getLauncherShortcut'),
    hideLauncher: () => ipcRenderer.invoke('app:hideLauncher'),
    closePlugin: () => ipcRenderer.invoke('app:closePlugin'),
    setAlwaysOnTop: (pinned) => ipcRenderer.invoke('app:setAlwaysOnTop', pinned),
    isAlwaysOnTop: () => ipcRenderer.invoke('app:isAlwaysOnTop'),
    onLauncherShow: (callback) => {
      const listener = () => callback()
      ipcRenderer.on('launcher:show', listener)

      return () => {
        ipcRenderer.removeListener('launcher:show', listener)
      }
    },
  },
}

contextBridge.exposeInMainWorld('doTools', api)
