export const pluginPermissions = [
  'clipboard.read',
  'clipboard.write',
  'storage',
  'shell.openExternal',
  'dialog.pickFile',
  'dialog.pickDirectory',
  'notification',
] as const

export type PluginPermission = (typeof pluginPermissions)[number]

export type PluginCommand = {
  id: string
  title: string
  description?: string
  keywords?: string[]
  entry?: string
}

export type PluginManifest = {
  manifestVersion: 1
  id: string
  name: string
  version: string
  description?: string
  author?: string
  entry: string
  icon?: string
  keywords?: string[]
  permissions?: PluginPermission[]
  commands: PluginCommand[]
}

export type InstalledPlugin = PluginManifest & {
  dir: string
}

export type LauncherCommand = PluginCommand & {
  pluginId: string
  pluginName: string
  pluginDescription?: string
  pluginIcon?: string
  permissions: PluginPermission[]
}

export type PluginContext = {
  pluginId: string
  pluginName: string
  commandId?: string
}
