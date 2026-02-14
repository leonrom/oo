/* global window, console, HTMLMediaElement, CustomEvent, Audio */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { C } from '../index.js'
import { W } from './snd.js'

const
    debug = C.consts.debug,
    errTypes = {
        'неАктивир.': 'звук не проигрывалтся (автоматически) т.к. не активирована страница',
        'неЗагружен': `ошибка в 'audio' (если еще не загружено - повторите)`,
        'неРазрешен': 'прежде проигрывать - активируйтесь на странице (это требование браузера)',
        'ошибкаКода': 'ошибка в коде',
        'естьОшибка': 'ошибка проигрывания',
    },
    getOri = (quals, snd) => {
        const u = quals.at(-1)
        switch (u.toLowerCase()) {
            case 'href': return snd.getAttribute('href')
            case 'src': return snd.getAttribute('src')
            case 'n': return ''
        }
        return u
    },
    setState = (aO7, state) => {
        if (debug > 1) console.log(`${lognam} setState (${aO7.name}, '${state}')`)

        const classList = (aO7.image.play ? aO7.image.play : aO7.snd).classList

        if (state == W.state.play) {
            if (aO7.image.play) {
                aO7.image.stop.style.display = 'none'
                aO7.image.play.style.display = aO7.act.dspl
            }
            classList.add(W.clsPlay)
            classList.remove(W.clsPause)
        }
        else if (state == W.state.pause) {
            classList.remove(W.clsPlay)
            classList.add(W.clsPause)
        }
        else if (state == W.state.stop) {
            classList.remove(W.clsPlay)
            classList.remove(W.clsPause)
        }

        aO7.sound.state = state
    },
    fillModis = (modis, qual) => {
        for (const c of qual)
            switch (c) {
                case 'A': modis.alive = true; break
                case 'F': modis.free = true; break
                case 'L': modis.loop = true; break
                case 'O': modis.over = true; break
                case 'N': modis.none = true; break
                default: console.error('%c%s', C.consts.fmtErr,
                    `Непонятныо '${c}'`, `в квалификаторе qual='${qual}'`)
            }
    }

export class AO7 {
    static #snds = new Map()
    static clear() {
        for (const aO7 of AO7.#snds.values()) {
            aO7.act.activated = false // е нужно, но пущай
            aO7.destroy()
        }
        AO7.#snds.clear()
    }
    modis = Object.seal({
        alive: false, //звучание не прекращается после увода курсора с тега 
        free: false, //не использовать встроенный класс olga_snd для отображения тега;
        loop: false, //звучание зацикливается;
        over: false, // звучание начинается по наведению курсора.
        none: false, //не обрабатывать звучание
    })
    act = Object.seal({
        dspl: '',
        activated: false
    })
    sound = Object.seal({ audio: null, errIs: { errs: false, }, state: W.state.stop, eventsAreSet: false, ison: false, shiftKey: 0 })
    parms = Object.seal({ audio_play: '', image_play: '' })
    image = Object.seal({ stop: null, play: null })

    constructor(snd, quals) {
        if (AO7.#snds.has(snd)) {
            console.error('%c%s', C.consts.fmtErr, `Повтор создания aO7`,
                `для snd='${C.makeObjName(snd)}' - игнорируется`)
            this.destroy()
            return
        }
        this.snd = snd
        this.title = snd.title
        this.name = C.getObjName(snd)
        this.attrs = Object.seal(C.getAttrs(snd.attributes))  // freeze() дам в PrepareSnds
        this.srcAtr = snd.hasAttribute('href') ? 'href' : (snd.hasAttribute('src') ? 'src' : '')

        const
            modis = this.modis,
            ori = getOri(quals, snd),
            url = ori ? C.decodeUrl(ori, this.name) : ''

        this.aplay = Object.seal({ ori, url, image: '' })
        if (quals.length > 1)
            fillModis(modis, quals[0].toUpperCase())
        if (!url)
            modis.none = true

        if (modis.free && !snd.classList.contains('o-freeImg')) snd.classList.add('o-freeImg')
        if (modis.none) snd.classList.add('o-none')

        for (const errType in errTypes)
            this.sound.errIs[errType] = false

        Object.freeze(this)


        if (!snd.alt || (snd.alt.trim() == '')) snd.alt = snd.title.trim()

        if (snd.tagName.match(/img/i))
            this.image.stop = snd

        snd.aO7snd = this
        AO7.#snds.set(snd, this)   // можно и через Array
    }

    SetTitle(txt) {
        this.snd.title = txt
        if (this.image.play)
            this.image.play.title = this.snd.title
    }
    #SetT(mrk, err) {
        const t = this.title
        this.SetTitle(err ? `Для тега ${t ? ("'" + t + "'") : ''} ошибка: ${errTypes[mrk]}` : t)
        this.sound.errIs[mrk] = err
    }
    AddError(mrk, txt) {
        if (!this.sound.errIs[mrk]) {
            this.#SetT(mrk, true)
            C.ConsoleError(`"${errTypes[mrk]}" (код=${mrk})` + (txt ? ` ${txt}` : '') + ` для '${this.name}'`)

            this.sound.errIs.errs = true
            if (!this.snd.classList.contains(W.sndError))
                this.snd.classList.add(W.sndError)
        }
    }
    RemError(mrk) {
        if (this.sound.errIs[mrk]) {
            this.#SetT(mrk, false)
            console.log(`${lognam} Устранена ошибка: errTypes.${mrk}`)

            const errIs = this.sound.errIs
            for (const erri in errIs)
                if (erri != 'errs' && errIs[erri])
                    return

            this.sound.errIs.errs = false
            if (this.snd.classList.contains(W.sndError))
                this.snd.classList.remove(W.sndError)
        }
    }
    stopSound() {
        const aO7 = this
        if (debug > 1) console.log(`${lognam}  stopSound (${aO7.name})`)

        // тут его НИЗЗЯ ! window.dispatchEvent(new CustomEvent('o_stopSound', { detail: { tag: aO7.audio, type: 'audio', } }))

        W.act.audio = null

        const image = aO7.image,
            audio = aO7.audio ? aO7.audio : aO7.sound.audio

        audio.pause()
        audio.currentTime = 0
        aO7.sound.state = W.state.stop

        if (image && image.play) {
            image.play.style.display = 'none'
            image.stop.style.display = aO7.act.dspl
        }

        if (audio !== aO7.audio)
            setState(aO7, W.state.stop)
    }
    startSound() {
        const aO7 = this
        const sound = aO7.sound,
            audio = sound.audio,
            Play = (aO7) => {
                if (debug > 1) console.log(`${lognam}   > Play()`)

                if (aO7.modis.over && !W.act.ready)
                    aO7.AddError('неАктивир.')

                if (sound.ison) { // если курсор не ушел
                    if (debug > 1) console.log(`${lognam} --> Play OK`)
                    try {
                        const audio = sound.audio
                        // audio.volume = aO7.sound.volume
                        audio.playbackRate = sound.shiftKey != 0 ? shift_speed : 1.0
                        if (sound.state != W.state.pause) audio.currentTime = 0 // т.е. если перезапуск старого музона	
                        else audio.currentTime = Math.max(audio.currentTime - W.consts.return_time, 0)

                        audio.play()
                    }
                    catch (e) {
                        console.error(`ошибка воспроизведения:`, e.message)
                    }
                }
                else
                    stopSound(aO7)
            }

        if (debug > 1) console.log(`${lognam} --> startSound() из '${aO7.sound.state}'`)

        if (W.act.audio && W.act.audio != audio)
            stopSound(W.act.audio.aO7snd)

        window.dispatchEvent(new CustomEvent('o_stopSound', { detail: { tag: W.act.audio, type: 'audio(moe)', } }))

        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
            Play(aO7)
        else {
            setState(aO7, W.state.pause)
            audio.addEventListener('canplay', () => Play(aO7), { capture: true, once: true })
        }
    }
}