/// <reference types="vite/client" />

import type { DoToolsApi } from '../electron/preload'

declare global {
  interface Window {
    doTools?: DoToolsApi
  }
}
