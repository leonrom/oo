/**
 *  контроль загрузки url'ов
 * Urls.js
 * 
 * blob-кэш
 * кэш загрузок по URL (без гонок)
 * без лишних перезагрузок
 */

// const commonAudio = new Audio()  ??   // общий для olga-snd
const blobCache = new Map()         // blob-кэш: url → objectURL
const loadMap = new Map()           // загрузки: url → Promise

let C;

async function ensureLoaded(url) {
    // уже этот же звук и готов
    // if (curUrl === url && commonAudio.readyState >= 2)
    //     return

    // есть в blob-кэше
    if (blobCache.has(url)) {
        // curUrl = url
        // commonAudio.src = blobCache.get(url)
        return blobCache.get(url)
    }

    // уже грузится
    if (loadMap.has(url))
        return loadMap.get(url)

    // новая загрузка
        if (C.consts.debug >1)
            console.log(`- читается в BLOB ${url}`)
    const p = fetch(url)
        .then(r => {
            if (!r.ok)
                throw new Error(`Audio fetch ${r.status}: ${url}`)
            return r.blob()
        })
        .then(blob => {
            const urlBlob = URL.createObjectURL(blob)
            blobCache.set(url, urlBlob)

            // curUrl = url
            // commonAudio.src = objUrl
            return urlBlob
        })
        .finally(() => {
            loadMap.delete(url)
        })

    loadMap.set(url, p)
    return p
}

export const Urls = {
    ensureLoaded:ensureLoaded,

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
        C=c
    }
,
}