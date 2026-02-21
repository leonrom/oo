/**
 * 2. Общий Audio + blob-кэш
 *      вызывается из aO7
 * Cur.js
 * 
 * один общий Audio
 * синхронизация со всеми <audio> через Global
 * blob-кэш
 * кэш загрузок по URL (без гонок)
 * безопасный destroy для Blogger
 * без лишних перезагрузок
 * корректное переключение треков
 */
import { Global } from './Global.js'

export const Cur = (() => {

    // ─────────────────────────────────────────────
    // единый audio
    // ─────────────────────────────────────────────
    const curAudio = new Audio()
    curAudio.preload = 'auto'

    if (!Global.has(curAudio))
        Global.register(curAudio)

    // текущий URL в curAudio
    let curUrl = null

    // blob-кэш: url → objectURL
    const blobCache = new Map()

    // загрузки: url → Promise
    const loadMap = new Map()

    // ─────────────────────────────────────────────
    // загрузка
    // ─────────────────────────────────────────────
    async function ensureLoaded(url) {
        // уже этот же звук и готов
        if (curUrl === url && curAudio.readyState >= 2)
            return

        // есть в blob-кэше
        if (blobCache.has(url)) {
            curUrl = url
            curAudio.src = blobCache.get(url)
            return
        }

        // уже грузится
        if (loadMap.has(url))
            return loadMap.get(url)

        // новая загрузка
        const p = fetch(url)
            .then(r => {
                if (!r.ok)
                    throw new Error(`Audio fetch ${r.status}: ${url}`)
                return r.blob()
            })
            .then(blob => {
                const objUrl = URL.createObjectURL(blob)
                blobCache.set(url, objUrl)

                curUrl = url
                curAudio.src = objUrl
            })
            .finally(() => {
                loadMap.delete(url)
            })

        loadMap.set(url, p)
        return p
    }

    // ─────────────────────────────────────────────
    // play
    // ─────────────────────────────────────────────
    async function play(url) {
        if (url) {
            await ensureLoaded(url)
            return curAudio.play()
        }
    }

    // ─────────────────────────────────────────────
    // toggle
    // ─────────────────────────────────────────────
    function toggle(url) {

        // тот же звук
        if (!curAudio.paused && curUrl === url) {
            curAudio.pause()
            curAudio.currentTime = 0
            return
        }

        // другой звук
        play(url)
    }

    // ─────────────────────────────────────────────
    // destroy (важно для Blogger)
    // ─────────────────────────────────────────────
    function destroy() {

        curAudio.pause()
        curAudio.src = ''
        curUrl = null

        // отменить все загрузки
        loadMap.clear()

        // очистить blob-кэш
        for (const objUrl of blobCache.values())
            URL.revokeObjectURL(objUrl)

        blobCache.clear()

        Global.unregister(curAudio)
    }

    // ─────────────────────────────────────────────
    return {
        play,
        toggle,
        ensureLoaded,
        destroy,
        curAudio
    }

})()
