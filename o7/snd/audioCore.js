// audioCore.js
/**
 * 2. Общий Audio + blob-кэш
 */
import { AudioGlobal } from './audioGlobal.js'

export const AudioCore = (() => {

    const audio = new Audio()
    audio.preload = 'auto'

    AudioGlobal.register(audio)

    let currentUrl = null
    let loadPromise = null

    const blobCache = new Map()

    async function ensureLoaded(url) { window.TRACE && console.log('→ ensureLoaded');
        if (!url) return

        if (currentUrl === url && audio.readyState >= 2)
            return

        currentUrl = url

        if (blobCache.has(url)) {
            audio.src = blobCache.get(url)
            return
        }

        if (loadPromise)
            return loadPromise

        loadPromise = fetch(url)
            .then(r => r.blob())
            .then(blob => {
                const objUrl = URL.createObjectURL(blob)
                blobCache.set(url, objUrl)
                audio.src = objUrl
            })
            .finally(() => loadPromise = null)

        return loadPromise
    }

    async function play(url) { window.TRACE && console.log('→ play');
        await ensureLoaded(url)
        return audio.play()
    }

    function toggle(url) { window.TRACE && console.log('→ toggle');
        if (!audio.paused) {
            audio.pause()
            audio.currentTime = 0
        } else {
            play(url)
        }
    }

    function destroy() { window.TRACE && console.log('→ destroy');
        AudioGlobal.unregister(audio)
        audio.pause()
        audio.src = ''
    }

    return {
        play,
        toggle,
        ensureLoaded,
        destroy,
        audio
    }

})()

