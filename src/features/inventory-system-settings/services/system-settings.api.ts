import { api } from '@/shared/services/api'

/**
 * SiteAdmin-managed inventory master settings — a platform-level singleton stored
 * as a flexible JSON `data` blob. Lives on the **inventory backend**, reached via
 * the shared nginx `/inventory-api` route; the main {@link api} client attaches
 * the SiteAdmin token automatically for `/inventory-api/*` paths.
 *
 * - `GET  /master-settings` → the singleton row (we read its `data`).
 * - `PUT  /master-settings` with body `{ data: {...} }` → shallow-merges and saves.
 */
const BASE = '/inventory-api/api/v1/master-settings'

/** The settings singleton as stored on the backend. */
export interface ISettingsRecord {
  id: string
  data: Record<string, unknown>
  updatedAt?: string
}

/** Fetch the settings singleton and return its `data` blob. */
export async function getSettings(): Promise<Record<string, unknown>> {
  const res = await api.get<ISettingsRecord>(BASE)
  const rec = res.data as ISettingsRecord
  return (rec?.data && typeof rec.data === 'object' ? rec.data : {}) as Record<string, unknown>
}

/** Save the merged settings `data` blob (PUT body is `{ data }`). */
export async function saveSettings(data: Record<string, unknown>): Promise<void> {
  await api.put(BASE, { data }, { successMessage: 'Settings saved' })
}
