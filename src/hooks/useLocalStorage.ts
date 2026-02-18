import { useCallback, useEffect, useRef, useState } from 'react';

type Lazy<T> = T | (() => T);

type UseLocalStorageOptions<T> = {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  syncAcrossTabs?: boolean;
};

const safeGetStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const defaultSerializer = <T,>(value: T) => JSON.stringify(value);
const defaultDeserializer = <T,>(value: string) => JSON.parse(value) as T;

export function useLocalStorage<T>(
  key: string,
  initialValue: Lazy<T>,
  options: UseLocalStorageOptions<T> = {}
) {
  const { serializer = defaultSerializer, deserializer = defaultDeserializer, syncAcrossTabs = true } =
    options;

  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  const readValue = useCallback((): T => {
    const storage = safeGetStorage();
    if (!storage) {
      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    }

    try {
      const stored = storage.getItem(key);
      if (stored === null) {
        return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
      }
      return deserializer(stored);
    } catch {
      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    }
  }, [key, deserializer, initialValue]);

  const [value, setValue] = useState<T>(readValue);

  useEffect(() => {
    const storage = safeGetStorage();
    if (!storage) return;

    try {
      storage.setItem(key, serializer(value));
    } catch {
      // ignore write errors (quota, private mode, etc.)
    }
  }, [key, value, serializer]);

  useEffect(() => {
    if (!syncAcrossTabs) return;

    const storage = safeGetStorage();
    if (!storage) return;

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== storage) return;
      if (event.key !== keyRef.current) return;
      if (event.newValue === null) {
        setValue(typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue);
        return;
      }
      try {
        setValue(deserializer(event.newValue));
      } catch {
        setValue(typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [deserializer, initialValue, syncAcrossTabs]);

  const remove = useCallback(() => {
    const storage = safeGetStorage();
    if (!storage) return;
    try {
      storage.removeItem(keyRef.current);
    } catch {
      // ignore remove errors
    }
  }, []);

  const reset = useCallback(() => {
    setValue(typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue);
  }, [initialValue]);

  return [value, setValue, { remove, reset }] as const;
}
