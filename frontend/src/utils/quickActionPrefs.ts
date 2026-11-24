/**
 * quickActionPrefs.ts
 *
 * AsyncStorage persistence for the user's customised Home quick action IDs.
 *
 * Key design decisions:
 * - Single storage key to keep reads/writes atomic.
 * - All errors are caught and logged; callers never throw.
 * - Validation is delegated to sanitizeQuickActionIds() in products.ts so the
 *   two are always in sync.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductId, DEFAULT_QUICK_ACTION_IDS, sanitizeQuickActionIds } from '../data/products';

const STORAGE_KEY = '@mauve/quick_action_ids';

/**
 * Load persisted quick-action IDs from AsyncStorage.
 *
 * Returns exactly 4 valid, unique ProductIds.
 * Falls back to DEFAULT_QUICK_ACTION_IDS on any error or missing data.
 */
export async function loadQuickActionIds(): Promise<ProductId[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // First launch — no saved data yet
      return [...DEFAULT_QUICK_ACTION_IDS];
    }
    const parsed: unknown = JSON.parse(raw);
    return sanitizeQuickActionIds(parsed);
  } catch (err) {
    // JSON parse error, storage unavailable, or unexpected value
    console.warn('[quickActionPrefs] Failed to load preferences:', err);
    return [...DEFAULT_QUICK_ACTION_IDS];
  }
}

/**
 * Persist the given quick-action IDs to AsyncStorage.
 *
 * Silently swallows write errors so a storage failure never interrupts
 * the user's session.
 */
export async function saveQuickActionIds(ids: ProductId[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('[quickActionPrefs] Failed to save preferences:', err);
  }
}
