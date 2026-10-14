// On-device storage for pre-visit packets (spec §6.2). Everything lives in
// IndexedDB under keys namespaced by packet id; nothing here touches the server.
// Every call is wrapped so a blocked or missing IndexedDB (private mode,
// cleared site data, jsdom) degrades to an in-memory map instead of throwing.
// Callers check isPersistent() to show the "data will be lost on refresh" warning.

const DB_NAME = 'previsit'
const STORE = 'kv'

let dbPromise: Promise<IDBDatabase | null> | null = null
const memory = new Map<string, unknown>()
let persistent = true

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        persistent = false
        resolve(null)
        return
      }
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        persistent = false
        resolve(null)
      }
      req.onblocked = () => {
        persistent = false
        resolve(null)
      }
    } catch {
      persistent = false
      resolve(null)
    }
  })
  return dbPromise
}

function fullKey(packetId: string, key: string): string {
  return `${packetId}::${key}`
}

function run<T>(
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        if (!db) {
          reject(new Error('no db'))
          return
        }
        try {
          const req = op(db.transaction(STORE, mode).objectStore(STORE))
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => reject(req.error)
        } catch (err) {
          reject(err)
        }
      }),
  )
}

/** True when data survives a refresh. Only meaningful after the first call. */
export function isPersistent(): boolean {
  return persistent
}

/** Resolves once storage has been probed, then reports persistence. */
export async function checkPersistent(): Promise<boolean> {
  await openDb()
  return persistent
}

export async function getItem<T>(packetId: string, key: string): Promise<T | undefined> {
  const k = fullKey(packetId, key)
  try {
    const value = await run<T>('readonly', (s) => s.get(k) as IDBRequest<T>)
    return value === undefined ? (memory.get(k) as T | undefined) : value
  } catch {
    persistent = false
    return memory.get(k) as T | undefined
  }
}

export async function setItem<T>(packetId: string, key: string, value: T): Promise<void> {
  const k = fullKey(packetId, key)
  memory.set(k, value)
  try {
    await run('readwrite', (s) => s.put(value, k))
  } catch {
    persistent = false
  }
}

export async function removeItem(packetId: string, key: string): Promise<void> {
  const k = fullKey(packetId, key)
  memory.delete(k)
  try {
    await run('readwrite', (s) => s.delete(k))
  } catch {
    persistent = false
  }
}

/** "Erase my data": removes every key for one packet. */
export async function clearPacket(packetId: string): Promise<void> {
  const prefix = `${packetId}::`
  for (const k of [...memory.keys()]) if (k.startsWith(prefix)) memory.delete(k)
  try {
    // '￿' sorts after any real key character, so this bounds the prefix.
    await run('readwrite', (s) => s.delete(IDBKeyRange.bound(prefix, `${prefix}￿`)))
  } catch {
    persistent = false
  }
}

/** Test helper: drop the in-memory map and cached connection. */
export function __resetStorageForTests(): void {
  memory.clear()
  dbPromise = null
  persistent = true
}
