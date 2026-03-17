/**
 * Play.js
 *  Обработка событий проигрывания audio
 * содержит 
    - плейер для аудио-тегов НЕ <audio>
    - проверяет "первый клик" на странице


 */

import { Urls } from './Urls.js'

const logName = 'snd.Play: '

let C, actO7 = null

async function playCheckUrl(aO7) {

    if (aO7.stt === Play.oWAIT) return

    let url = aO7.url
    if (aO7.audio.src !== aO7.urlB) {
        if (C.consts.debug > 1)
            console.log(logName, `- ищется ${url}`)

        aO7.setSTT(Play.oWAIT)

        try {
            const current = aO7
            aO7.urlB =
                await Urls.ensureLoaded(url, aO7)

            if (current !== actO7)
                return

            if (C.consts.debug > 1)
                console.log(logName, `- найден ${aO7.urlB}`)
            aO7.setERROR(false)
            aO7.audio.src = aO7.urlB
            if (!aO7.isAUDIO)  // надо "толкнуть" вручную
                aO7.audio.play()
                    .catch(() => { })
        }
        catch (err) {
            console.log(`Ошибка проигрывания '${err.type}': '${err.message}'`)
            aO7.setERROR(true)
            debugger
        }
    }
}

export const Play = Object.freeze({
    oWAIT: 'o-wait',
    oSOUND: 'o-sound',
    oERROR: 'o-error',
    mod: { shift_speed: 0, back_time: 0 },
    firstPlay: { was: false },
    onPlaying: function (e) {
        const audio = e.target, aO7 = audio.aO7snd
        if (C.consts.debug > 1)
            console.log(logName, `- ${e.type} audio='${audio.id}'`)

        if (!aO7) {
            console.log("%c%s", logName + `'aO7' не определён`)
            debugger
        }
        if (!actO7
            || actO7.stt !== Play.oSOUND
            || actO7.urlB !== aO7.urlB
        ) {
            actO7 = aO7
            aO7.setSTT(Play.oSOUND)
        }
    },

    onPlay: function (e) {
        const audio = e.target, aO7 = audio.aO7snd
        if (C.consts.debug > 1)
            console.log(logName, `- ${e.type}    '${aO7.name}' audio='${audio.id}'`)

        if (actO7 && actO7 !== aO7 && actO7.audio !== aO7.audio)
            actO7.audio.pause()

        if (aO7.isAUDIO)
            Play.firstPlay.was = true

        if (!aO7.isAUDIO)
            setTimeout(() => {
                playCheckUrl(aO7)
            }, 1)
    },

    onPause: function (e) {
        const audio = e.target, aO7 = audio.aO7snd
        if (C.consts.debug > 1)
            console.log(logName, `- ${e.type}    '${aO7.name}' audio='${aO7.audio.id}'`)

        actO7 = null
        aO7.setSTT('')
    },
    onEnded: function (e) {
        const audio = e.target, aO7 = audio.aO7snd
        if (aO7.modis?.loop) {
            audio.play()
        }
    },
    onDblClick: function (e) {
        if (actO7?.audio)
            actO7.audio.pause()
    },

    // setListeners: function (audio, act) {
    //     const op = act + 'EventListener'
    //     audio[op]('playing', this.onPlaying)
    //     audio[op]('pause', this.onPause)
    //     audio[op]('ended', this.onEnded)
    //     audio[op]('play', this.onPlay)

    //     // if (C.consts.debug > 1)
    //     //     console.log(logName, `setListeners ${act} для '${audio.id}'  '${audio.aO7snd ? audio.aO7snd.name : ''}'`)
    // },
    addListeners: function (audio) {
        if (C.consts.debug > 1)
            console.log(logName, `addListeners для '${audio.id}'  '${audio.aO7snd ? audio.aO7snd.name : ''}'`)

        audio.addEventListener('playing', this.onPlaying, true)
        audio.addEventListener('pause', this.onPause, true)
        audio.addEventListener('ended', this.onEnded, true)
        audio.addEventListener('play', this.onPlay, true)
    },
    init: function () {
        this.firstPlay.was = false
    },
    prepare: function (c, W) {
        C = c
        Play.mod.shift_speed = parseFloat(W.consts.shift_speed) || 1
        Play.mod.back_time = parseFloat(W.consts.back_time) || 0

        // делаем однократно и не меняю
        document.addEventListener('dblclick', this.onDblClick)
        this.addListeners(document)
        // document.addEventListener('playing', this.onPlaying, true)
        // document.addEventListener('pause', this.onPause, true)
        // document.addEventListener('ended', this.onEnded, true)
        // document.addEventListener('play', this.onPlay, true)
    },
    reset: function () {
        if (actO7)
            actO7.audio.pause()
    }
})