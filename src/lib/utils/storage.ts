/**
 * Typed localStorage utilities for the LMS application
 */

const STORAGE_KEYS = {
  SESSION: 'lms.session',
  USERS: 'lms.users',
  CLASSES: 'lms.classes',
  ASSIGNMENTS: 'lms.assignments',
  MESSAGES: 'lms.messages',
  RESOURCES: 'lms.resources',
  INVOICES: 'lms.invoices',
  THEME: 'lms.theme',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Get item from localStorage with JSON parsing
 */
export function getStorageItem<T>(key: StorageKey): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting storage item ${key}:`, error);
    return null;
  }
}

/**
 * Set item in localStorage with JSON stringification
 */
export function setStorageItem<T>(key: StorageKey, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting storage item ${key}:`, error);
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing storage item ${key}:`, error);
  }
}

/**
 * Clear all LMS data from localStorage
 */
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorageItem(key);
  });
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export { STORAGE_KEYS };