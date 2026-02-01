/* global window, console, HTMLMediaElement, CustomEvent, Audio */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { C } from '../index.js'
import { W } from './snd.js'

const
    debug = C.consts.debug,
    SetTitle = (aO7, txt) => {
        aO7.snd.title = txt
        if (aO7.image.play)
            aO7.image.play.title = aO7.snd.title
    },
    setVolume = {
        step: 0.1,
        vmin: 0.2,
        vmax: 1.0,
        SetV: (aO7, add) => {
            if (add == 0) SetTitle(aO7, ``)
            else {
                const audio = aO7.sound.audio,
                    v = audio.volume + add * setVolume.step,
                    txt = `громкость=${parseInt(v * 100)}%`

                audio.volume = v > setVolume.vmax ? setVolume.vmax : (v < setVolume.vmin ? setVolume.vmin : v)
                SetTitle(aO7, txt)
                if (debug > 1)
                    console.log(`${lognam} Изменено: ${txt} для '${aO7.name}' }`)
            }
        }
    },

    errTypes = {
        'неАктивир.': 'звук не проигрывалтся (автоматически) т.к. не активирована страница',
        'неЗагружен': `ошибка в 'audio' (если еще не загружено - повторите)`,
        'неРазрешен': 'прежде проигрывать - активируйтесь на странице (это требование браузера)',
        'ошибкаКода': 'ошибка в коде',
        'естьОшибка': 'ошибка проигрывания',
    },
    GetTargetObj = e => {
        let obj = e.target
        while (obj && !obj.aO7snd) obj = obj.parentElement
        if (obj && obj.aO7snd) return obj
    },
    /*
+ mouseleave  когда курсор манипулятора (обычно мыши) перемещается за границы элемента.
- mouseout    когда курсор покидает границы элемента или одного из его дочерних элементов
+ mouseenter  не отправляется никаким потомкам, когда указатель перемещается из пространства 
- mouseover   отправляется в самый глубокий элемент дерева DOM, затем оно всплывает в иерархии
    */
    eFocus = ['mouseenter', 'focus'],
    eBlurs = ['mouseleave', 'blur']
// eFocus = ['pointerenter', 'focus'],
// eBlurs = ['pointerleave', 'blur'],


export class AO7 {

    modis = Object.seal({ over: false, alive: false, loop: snd.getAttribute('loop'), aplay: '', dspl: snd.style.display, none: false, active: false })
    sound = Object.seal({ audio: null, errIs: { errs: false, }, state: 'stop', eventsAreSet: false, ison: false, shiftKey: 0 })
    parms = Object.seal({ audio_play: '', image_play: '' })
    image = Object.seal({ stop: null, play: null })

    constructor(snd) {
        const aO7 = this
        aO7.snd = snd
        aO7.title = snd.title
        aO7.name = C.MakeObjName(snd)
        aO7.attrs = Object.seal(C.getAttrs(snd.attributes))  // freeze() дам в PrepareSnds
        aO7.srcAtr = snd.hasAttribute('href') ? 'href' : (snd.hasAttribute('src') ? 'src' : '')

        for (const errType in errTypes)
            aO7.sound.errIs[errType] = false

        Object.freeze(aO7)

        if (snd.tagName.match(/img/i))
            aO7.image.stop = snd

        snd.aO7snd = aO7
    }


    SetT(aO7, mrk, err) {
        aO7.sound.errIs[mrk] = err
        const t = aO7.title
        SetTitle(aO7, err ? `Для тега ${t ? ("'" + t + "'") : ''} ошибка: ${errTypes[mrk]}` : t)
    }
    AddError(aO7, mrk, txt) {
        if (!aO7.sound.errIs[mrk]) {
            this.SetT(mrk, true)
            C.ConsoleError(`"${errTypes[mrk]}" (код=${mrk})` + (txt ? ` ${txt}` : '') + ` для '${aO7.name}'`)

            aO7.sound.errIs.errs = true
            if (!aO7.snd.classList.contains(W.sndError))
                aO7.snd.classList.add(W.sndError)
        }
    }
    RemError(aO7, mrk) {
        if (aO7.sound.errIs[mrk]) {
            this.SetT(mrk, false)
            console.log(`${lognam} Устранена ошибка: errTypes.${mrk}`)

            const errIs = aO7.sound.errIs
            for (const erri in errIs)
                if (erri != 'errs' && errIs[erri])
                    return

            aO7.sound.errIs.errs = false
            if (aO7.snd.classList.contains(W.sndError))
                aO7.snd.classList.remove(W.sndError)
        }
    }
}