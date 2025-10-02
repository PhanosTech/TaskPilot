
"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * A custom hook to manage state that persists in localStorage.
 * It ensures that state is synchronized across all components using the same key.
 *
 * @param key The key to use for storing the value in localStorage.
 * @param defaultValue The default value to use if none is found in localStorage.
 * @returns A state tuple [value, setValue] similar to useState.
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    // On the server, return default value.
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch a storage event to notify other tabs/windows
        window.dispatchEvent(new StorageEvent('storage', { key }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);
  
  // This effect listens for changes in localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const storedValue = window.localStorage.getItem(key);
          if (storedValue) {
            setState(JSON.parse(storedValue));
          } else {
             setState(defaultValue);
          }
        } catch (error) {
            console.error(`Error parsing storage change for key “${key}”:`, error);
            setState(defaultValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue]);

  return [state, setValue];
}
