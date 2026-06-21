/**
 * контроль загрузки url'ов
 * blob-кэши: для мелких и больших аудио
 */

const tinyBlobs = new Map()   // url → { blobUrl, size }
const bigBlobs = new Map()    // url → blobUrl
const loadMap = new Map()     // url → Promise

const logName = 'snd.Urls  : '

const MAX_TINY_SIZE = 50 * 1024 * 1024   // 50 MB
const MAX_ITEM_RATIO = 0.3               // 30%
const MAX_BIG_NUM = 2

let C, tinysSize = 0

// --- LRU для маленьких ---
function touch(url) {
    const entry = tinyBlobs.get(url)
    tinyBlobs.delete(url)
    tinyBlobs.set(url, entry)
}

// --- освобождение места (tiny) ---
function ensureSpace(newSize) {
    while (tinysSize + newSize > MAX_TINY_SIZE && tinyBlobs.size > 0) {
        const [oldUrl, entry] = tinyBlobs.entries().next().value

        URL.revokeObjectURL(entry.blobUrl)

        tinysSize -= entry.size
        tinyBlobs.delete(oldUrl)
    }
}

// --- ограничение количества больших ---
function ensureBigLimit() {
    while (bigBlobs.size >= MAX_BIG_NUM) {
        const [oldUrl, oldBlob] = bigBlobs.entries().next().value
        URL.revokeObjectURL(oldBlob)
        bigBlobs.delete(oldUrl)
    }
}

// --- загрузка ---
function loadUrl(url, logErr) {
    // // tiny cache
    // if (tinyBlobs.has(url)) {
    //     touch(url)
    //     return Promise.resolve(tinyBlobs.get(url).blobUrl)
    // }

    // // big cache
    // if (bigBlobs.has(url))
    //     return Promise.resolve(bigBlobs.get(url))

    // // already loading
    // if (loadMap.has(url))
    //     return loadMap.get(url)

    const p = fetch(url)
        .then(r => {
            if (!r.ok)
                throw new Error(`Audio fetch ${r.status}: ${url}`)
            return r.blob()
        })
        .then(blob => {
            const size = blob.size
            const blobUrl = URL.createObjectURL(blob)

            const isTiny = size <= MAX_TINY_SIZE * MAX_ITEM_RATIO

            if (isTiny) {
                ensureSpace(size)
                tinyBlobs.set(url, { blobUrl, size })
                tinysSize += size
            } else {
                ensureBigLimit()
                bigBlobs.set(url, blobUrl)
            }

            return blobUrl
        })
        .catch(e => {
            if (logErr && C.consts.debug > 1)
                console.log(logName, `ошибка загрузки: \n` + e.stack)
            return Promise.reject(e)
        })
        .finally(() => {
            loadMap.delete(url)
        })

    loadMap.set(url, p)
    return p
}

// --- получить (с ожиданием, если грузится) ---
function getUrl(url) {
    // tiny cache
    if (tinyBlobs.has(url)) {
        touch(url)
        return Promise.resolve(tinyBlobs.get(url).blobUrl)
    }

    // big cache
    if (bigBlobs.has(url))
        return Promise.resolve(bigBlobs.get(url))

    // already loading
    if (loadMap.has(url))
        return loadMap.get(url)

    return Promise.resolve(undefined)
}

// --- очистка ---
function reset() {
    loadMap.clear()

    for (const { blobUrl } of tinyBlobs.values())
        URL.revokeObjectURL(blobUrl)

    for (const blobUrl of bigBlobs.values())
        URL.revokeObjectURL(blobUrl)

    tinyBlobs.clear()
    bigBlobs.clear()
    tinysSize = 0
}

// --- экспорт ---
export const Urls = Object.freeze({
    oERROR: 'o-error',
    loadUrl,
    getUrl,
    reset,
    init: () => { },
    prepare: c => { C = c }
})