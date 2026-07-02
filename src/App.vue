<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { LauncherCommand } from '../shared/plugin'

const commands = ref<LauncherCommand[]>([])
const query = ref('')
const loading = ref(true)
const error = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
let removeLauncherShowListener: (() => void) | undefined

const filteredCommands = computed(() => {
  const value = query.value.trim().toLowerCase()
  if (!value) return []

  return commands.value.filter((command) => {
    const fields = [
      command.title,
      command.description,
      command.pluginName,
      command.pluginDescription,
      ...(command.keywords ?? []),
    ]

    return fields.some((field) => field?.toLowerCase().includes(value))
  })
})

async function loadCommands() {
  loading.value = true
  error.value = ''

  try {
    commands.value = (await window.doTools?.plugins.listCommands()) ?? []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load plugins'
  } finally {
    loading.value = false
  }
}

function openSettings() {
  void window.doTools?.plugins.reload().then((value) => {
    commands.value = value
  })
}

function openCommand(command: LauncherCommand) {
  void window.doTools?.plugins.open(command.pluginId, command.id)
  void window.doTools?.app.hideLauncher()
}

async function focusSearch() {
  await nextTick()
  searchInput.value?.focus()
  searchInput.value?.select()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    void window.doTools?.app.hideLauncher()
  }

  if (event.key === 'Enter' && filteredCommands.value[0]) {
    event.preventDefault()
    openCommand(filteredCommands.value[0])
  }
}

onMounted(() => {
  void loadCommands()

  removeLauncherShowListener = window.doTools?.app.onLauncherShow(() => {
    query.value = ''
    void focusSearch()
  })

  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('focus', focusSearch)
  void focusSearch()
})

onUnmounted(() => {
  removeLauncherShowListener?.()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('focus', focusSearch)
})
</script>

<template>
  <main class="shell">
    <section class="launcher" aria-label="DoTools launcher">
      <div class="searchbar">
        <input
          ref="searchInput"
          v-model="query"
          class="search"
          autofocus
          placeholder="Search"
          type="text"
        >
        <button class="settings-button" type="button" aria-label="Settings" title="Settings" @click="openSettings">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 0 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
          </svg>
        </button>
      </div>

      <div v-if="!loading && !error && filteredCommands.length > 0" class="command-list">
        <button
          v-for="command in filteredCommands"
          :key="`${command.pluginId}:${command.id}`"
          class="command"
          type="button"
          @click="openCommand(command)"
        >
          <span class="command-icon">{{ command.pluginName.slice(0, 1).toUpperCase() }}</span>
          <span class="command-main">
            <strong>{{ command.title }}</strong>
          </span>
        </button>
      </div>
    </section>
  </main>
</template>
