/**
 *  контроль загрузки url'ов
 * Urls.js
 * 
 * blob-кэш
 * кэш загрузок по URL (без гонок)
 * без лишних перезагрузок
 */

const blobCache = new Map()         // blob-кэш: url → objectURL
const loadMap = new Map()           // загрузки: url → Promise

const logName = 'snd.Urls: '
let C;

async function ensureLoaded(url, aO7) {
    // есть в blob-кэше
    if (blobCache.has(url)) {
        return blobCache.get(url)
    }

    // уже грузится
    if (loadMap.has(url))
        return loadMap.get(url)

    // новая загрузка
    if (C.consts.debug > 1)
        console.log(logName, `читается из BLOB ${url}`)

    const p = fetch(url)
        .then(r => {
            if (!r.ok)
                throw new Error(`Audio fetch ${r.status}: ${url}`)
            return r.blob()
        })
        .then(blob => {
            const urlBlob = URL.createObjectURL(blob)
            blobCache.set(url, urlBlob)

            aO7.setERROR(false)
            return urlBlob
        })
        .catch(e => {
            aO7.setERROR(true)
            console.error("%c%s", C.consts.fmtErr, logName, `'${aO7.name}': загрузка аудио:`, e.message)
            if (C.consts.debug)
            debugger
    throw e
        })
        .finally(() => {
            loadMap.delete(url)
        })

    loadMap.set(url, p)
    return p
}

export const Urls = Object.freeze({
    ensureLoaded: ensureLoaded,

    init: function () {
        // curUrl = null
    },

    reset: function () {

        loadMap.clear()

        // очистить blob-кэш
        for (const objUrl of blobCache.values())
            URL.revokeObjectURL(objUrl)

        blobCache.clear()
    },
    prepare: function (c) {
        C = c
    }
})