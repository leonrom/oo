/**
 *  DB.js
 * локальное хранение автором труктуры (объекта) инициализации для Author.js
 */

let dbPromise = null, C, DELETE_DB = false

const defDB = {
    version: 1,
    stores: ['common', 'pops'],
}

function openDB() {
    if (!dbPromise)
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open('olga7', defDB.version)
            req.onupgradeneeded = () => {
                const db = req.result
                for (const store of defDB.stores)
                    if (!db.objectStoreNames.contains(store))
                        db.createObjectStore(store)
            }
            req.onblocked = () => {
                console.warn('IndexedDB blocked')
            }
            req.onsuccess = () => { resolve(req.result) }
            req.onerror = () => { reject(req.error) }
        })

    return dbPromise
}

async function deleteDB(name) {
    return new Promise(
        (resolve, reject) => {

            const req =
                indexedDB.deleteDatabase(name)

            req.onsuccess = () => {
                console.log(`deleted DB '${name}'`)
                resolve()
            }
            req.onerror = () => {
                console.error(`ошибка удаления DB '${name}'`, req.error)
                reject(req.error)
            }
            req.onblocked = () => {
                console.error(`ошибка удаления DB '${name}' - заблокирована`)
                reject()
            }
        })
}

export const DB = {
    prepare: function (c) {
        C = c
    },

    dbSet: async function (storeName, key, value) {
        // if (!defDB.stores.includes(storeName))
        //     return Promise.reject(
        //         new Error(`Недопустимый store: ${storeName}`)
        //     )

        const db = await openDB()

        return new Promise((resolve, reject) => {

            const
                tx = db.transaction(storeName, 'readwrite'),
                store = tx.objectStore(storeName),
                req = store.put(value, key)

            tx.oncomplete = () => resolve()

            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)

            req.onerror = () => reject(req.error)
        })
    },

    dbGet: async function (storeName, key) {
        // if (!defDB.stores.includes(storeName))
        //     return Promise.reject(
        //         new Error(`Недопустимый store: ${storeName}`)
        //     )
        if (DELETE_DB) {
            DELETE_DB = false
            if (dbPromise) {
                const db = await dbPromise
                db.close()
                dbPromise = null
            }
            await deleteDB('olga7')
        }
        
        const db = await openDB()

        return new Promise((resolve, reject) => {

            const
                tx = db.transaction(storeName, 'readonly'),
                store = tx.objectStore(storeName),
                req = store.get(key)

            req.onsuccess = () => {
                resolve(req.result)
            }

            req.onerror = () => {
                reject(req.error)
            }
        })
    }
}