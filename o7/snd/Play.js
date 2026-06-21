/**
 * Play.js
 * выполняет:
 *  - синхронизацию звучания плейеров
 *  - передает в aO7 состояние для визуализации
 *  - фиксирует firstPlay как второй признак активации сьраницы
скорость проигрывания изменяется при нажатии  e.shiftKey || e.ctrlKey || e.AltKey

доделать
Web Audio API (лучший)

Можно подключить компрессор.

const ctx = new AudioContext()
const source = ctx.createMediaElementSource(audio)

const compressor = ctx.createDynamicsCompressor()

source.connect(compressor)
compressor.connect(ctx.destination)

Он:

снижает пики
поднимает тихие участки

Это похоже на automatic gain control.

 */

const logName = 'snd.Play: '

let C, pO7 = null, lastPlayId = 0, firstPlay;

export const Play = Object.freeze({
    oLOAD: 'o-load',
    oWAIT: 'o-wait',
    oSOUND: 'o-sound',
    mod: { shift_speed: 0, back_time: 0 },

    actO7: () => pO7,
    firstPlay: () => firstPlay,

    init: function () {
        firstPlay = false
    },
    prepare: function (c, W) {
        C = c
        Play.mod.shift_speed = parseFloat(W.consts.shift_speed) || 1
        Play.mod.back_time = parseFloat(W.consts.back_time) || 0

        // делаем однократно и не меняю
        this.addListeners(document, 'document')
        // document.addEventListener('dblclick', onDblClick)
    },
    reset: function () {
        if (pO7)
            pO7.audio.pause()
    },
    eves: {
        play: e => {   // — вызван .play() (ещё не факт, что реально началось)
            const
                audio = e.target,
                aO7 = audio.aO7snd,
                time = Math.max(aO7.act.time, 0)
            if (C.consts.debug > 1)
                console.log(logName + (e ? `${e.type.padEnd(8)}` : `?`).padEnd(12) + ` на '${aO7.name}'`, 'time=' + time.toFixed(3))

            if (aO7.isTAO7)
                firstPlay = true

            aO7.playId = ++lastPlayId
            if (pO7?.audio && pO7.audio !== aO7.audio)
                pO7.audio.pause()

            audio.playbackRate = C.IsKey(e) ? Play.mod.shift_speed : 1  // e?.shiftKey
            audio.currentTime = time
            aO7.setSTT(Play.oWAIT, e)
        },
        playing: e => {    // — реально началось воспроизведение
            const
                aO7 = e.target.aO7snd,
                act = pO7 !== aO7 && aO7.playId === lastPlayId
            if (C.consts.debug > 1)
                console.log(logName + (e ? `${e.type.padEnd(8)}` : `?`).padEnd(12) + ` на '${aO7.name}'`, 'act=' + act, 'time=' + aO7.audio.currentTime.toFixed(3))

            if (act) {
                pO7 = aO7
                aO7.setSTT(Play.oSOUND, e)
            }
        },
        pause: e => {  // — поставлено на паузу
            const
                audio = e.target,
                aO7 = audio.aO7snd

            aO7.act.time = audio.currentTime - Play.mod.back_time
            if (C.consts.debug > 1)
                console.log(logName + (e ? `${e.type.padEnd(8)}` : `?`).padEnd(12) + ` на '${aO7.name}'`, 'time=' + aO7.act.time.toFixed(3))

            // if (pO7 === aO7)   ??????????????????????????????
            pO7 = null
            aO7.setSTT('', e)
        },
        ended: e => {  // — воспроизведение завершено
            const aO7 = e.target.aO7snd
            if (C.consts.debug > 1)
                console.log(logName + (e ? `${e.type.padEnd(8)}` : `?`).padEnd(12) + ` на '${aO7.name}'`, 'loop=' + aO7.loop)

            aO7.act.time = 0
            if (aO7.loop)   //  только для "моих" аудио
                aO7.audio.play()
            aO7.setSTT('', e)
        },
        // waiting: e => {    // — не хватает данных, буферизация
        //     const aO7 = e.target.aO7snd

        //     if (C.consts.debug > 1)
        //         console.log(logName + (e ? `${e.type.padEnd(8)}` : `?`).
        
        // }
    },
    stopSound: must => {
        const oO7 = pO7
        if (pO7?.audio && (pO7.isOlgaSnd || must)) {
            pO7.audio.pause()
            pO7.act.time = 0
            pO7 = null
        }
        return oO7
    },
    addListeners: function (audio, name) {
        if (C.consts.debug > 1)
            console.log(logName, `addListeners для '${name}' `)

        for (const eve in this.eves)
            audio.addEventListener(eve, this.eves[eve], true)   // , false) //
    }
})