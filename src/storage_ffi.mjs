import { Ok, Error } from "./gleam.mjs";

export function localStorage() {
  try {
    if (
      globalThis.Storage &&
      globalThis.localStorage instanceof globalThis.Storage
    ) {
      return new Ok(globalThis.localStorage);
    } else {
      return new Error(null);
    }
  } catch {
    return new Error(null);
  }
}

export function getItem(storage, keyName) {
  return null_or(storage.getItem(keyName));
}

export function setItem(storage, keyName, keyValue) {
  try {
    storage.setItem(keyName, keyValue);
    return new Ok(null);
  } catch {
    return new Error(null);
  }
}

export function removeItem(storage, keyName) {
  storage.removeItem(keyName);
}

function null_or(val) {
  if (val !== null) {
    return new Ok(val);
  } else {
    return new Error(null);
  }
}

export function removeManyItems(storage, pattern) {
    // Convert glob pattern to regex
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    // Get all keys that match the pattern
    const keysToDelete = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    // Delete matched keys
    keysToDelete.forEach(key => storage.removeItem(key));
    
    return;
  }
  