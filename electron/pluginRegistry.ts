import { app } from 'electron'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type {
  InstalledPlugin,
  LauncherCommand,
  PluginCommand,
  PluginManifest,
  PluginPermission,
} from '../shared/plugin.js'

const plugins = new Map<string, InstalledPlugin>()

function getPluginsRoot() {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'plugins')
  }

  return path.join(process.cwd(), 'plugins')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function parseManifest(raw: unknown): PluginManifest | null {
  if (!isRecord(raw)) return null
  if (raw.manifestVersion !== 1) return null
  if (typeof raw.id !== 'string') return null
  if (typeof raw.name !== 'string') return null
  if (typeof raw.version !== 'string') return null
  if (typeof raw.entry !== 'string') return null
  if (!Array.isArray(raw.commands)) return null

  const commands: PluginCommand[] = raw.commands
    .filter(isRecord)
    .map((command) => ({
      id: String(command.id ?? ''),
      title: String(command.title ?? ''),
      description: typeof command.description === 'string' ? command.description : undefined,
      keywords: isStringArray(command.keywords) ? command.keywords : undefined,
      entry: typeof command.entry === 'string' ? command.entry : undefined,
    }))
    .filter((command: PluginCommand) => command.id && command.title)

  if (commands.length === 0) return null

  return {
    manifestVersion: 1,
    id: raw.id,
    name: raw.name,
    version: raw.version,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    author: typeof raw.author === 'string' ? raw.author : undefined,
    entry: raw.entry,
    icon: typeof raw.icon === 'string' ? raw.icon : undefined,
    keywords: isStringArray(raw.keywords) ? raw.keywords : undefined,
    permissions: isStringArray(raw.permissions) ? (raw.permissions as PluginPermission[]) : [],
    commands,
  }
}

export function loadPlugins() {
  plugins.clear()

  const root = getPluginsRoot()
  if (!existsSync(root)) return []

  for (const entry of readdirSync(root)) {
    const dir = path.join(root, entry)
    if (!statSync(dir).isDirectory()) continue

    const manifestPath = path.join(dir, 'plugin.json')
    if (!existsSync(manifestPath)) continue

    try {
      const manifest = parseManifest(JSON.parse(readFileSync(manifestPath, 'utf-8')))
      if (!manifest) continue

      plugins.set(manifest.id, { ...manifest, dir })
    } catch {
      continue
    }
  }

  return [...plugins.values()]
}

export function getPlugin(pluginId: string) {
  return plugins.get(pluginId)
}

export function getLauncherCommands(): LauncherCommand[] {
  return [...plugins.values()].flatMap((plugin) =>
    plugin.commands.map((command: PluginCommand) => ({
      ...command,
      pluginId: plugin.id,
      pluginName: plugin.name,
      pluginDescription: plugin.description,
      pluginIcon: plugin.icon,
      permissions: plugin.permissions ?? [],
    })),
  )
}

export function assertPluginPermission(pluginId: string, permission: PluginPermission) {
  const plugin = getPlugin(pluginId)

  if (!plugin) {
    throw new Error('Plugin context not found')
  }

  if (!(plugin.permissions ?? []).includes(permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

export function getPluginEntry(pluginId: string, commandId?: string) {
  const plugin = getPlugin(pluginId)
  if (!plugin) return null

  const commandEntry = commandId ? plugin.commands.find((command: PluginCommand) => command.id === commandId)?.entry : undefined
  return path.join(plugin.dir, commandEntry ?? plugin.entry)
}
