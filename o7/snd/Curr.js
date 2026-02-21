/**
 *  Общий общее проигрывние audio
 * Curr.js
 * 
 * один общий Audio
 * синхронизация со всеми <audio> 
 * безопасный destroy для Blogger
 * без лишних перезагрузок
 * корректное переключение треков
 */

import { Urls } from './Urls.js'
let C;
async function playCheckUrl(aO7) {

    if (aO7.loading) return
    aO7.loading = true

    let url = aO7.url
    if (aO7.audio.src !== url) {
        if (C.consts.debug > 1)
            console.log(`- ищется ${url}`)
        url = await Urls.ensureLoaded(url)
    }
    if (C.consts.debug)
        console.log(`- проигрывается '${aO7.name}' audio='${aO7.audio.id}': ${url}`)
    aO7.loading = false
    aO7.audio.src = url

    //для тегов audio - дальше НЕ надо - само начнёт
    if (!aO7.isAUDIO && (
        !aO7.modis.over ||
        aO7.canPlayAfterClick()
    ))
        aO7.audio.play()
}

export const Curr = {
    aO7: null,             // текущий звучащий audio
    playO7: function (aO7) {
        if (!aO7.url) return

        if (Curr.aO7 !== aO7) {
            if (Curr.aO7 && !Curr.aO7.audio.paused)
                Curr.aO7.audio.pause()
            Curr.aO7 = aO7
        }

        playCheckUrl(aO7)
    },

    reset: function () {
        Curr.aO7?.audio.pause()
        Curr.aO7 = null
    },
    prepare: function (c) {
        C = c
    }

}