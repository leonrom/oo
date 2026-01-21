/* global window, console, HTMLMediaElement, CustomEvent, Audio */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { C } from '../index.js'
import { sndAct } from './sndAct.js'

const
    olga_modul = 'snd',
    modulname = 'AO5snd'

const
    oSndError = 'o-sndError',
    // W = window.o7.find(w => w.modul == olga_modul), // так делать во всех подмодулях 
    
    // lognam = `${olga_modul}/${modulname} `,
    // shift_speed = W.consts.shift_speed < 0.2 ? 0.2 : W.consts.shift_speed,

    debug = C.consts.debug,
    SetTitle = (aO5, txt) => {
        aO5.snd.title = txt
        if (aO5.image.play)
            aO5.image.play.title = aO5.snd.title
    },
    setVolume = {
        step: 0.1,
        vmin: 0.2,
        vmax: 1.0,
        SetV: (aO5, add) => {
            if (add == 0) SetTitle(aO5, ``)
            else {
                const audio = aO5.sound.audio,
                    v = audio.volume + add * setVolume.step,
                    txt = `громкость=${parseInt(v * 100)}%`

                audio.volume = v > setVolume.vmax ? setVolume.vmax : (v < setVolume.vmin ? setVolume.vmin : v)
                SetTitle(aO5, txt)
                if (debug > 1)
                    console.log(`${lognam} Изменено: ${txt} для '${aO5.name}' }`)
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
        while (obj && !obj.aO5snd) obj = obj.parentElement
        if (obj && obj.aO5snd) return obj
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


export class AO5snd {

    // snd = null; title = ''; name = ''; o5attrs = null; srcAtr = null;

    modis = Object.seal({ over: false, alive: false, loop: snd.getAttribute('loop'), aplay: '', dspl: snd.style.display, none: false, activated: false })
    sound = Object.seal({ audio: null, errIs: { errs: false, }, state: sndAct.stop, eventsAreSet: false, ison: false, shiftKey: 0 })
    parms = Object.seal({ audio_play: '', image_play: '' })
    image = Object.seal({ stop: null, play: null })

    constructor(snd) {
        const aO5 = this
        aO5.snd = snd
        aO5.title = snd.title
        aO5.name = C.MakeObjName(snd)
        aO5.attrs = Object.seal(C.GetAttrs(snd.attributes))  // freeze() дам в PrepareSnds
        aO5.srcAtr = snd.hasAttribute('href') ? 'href' : (snd.hasAttribute('src') ? 'src' : '')

        for (const errType in errTypes)
            aO5.sound.errIs[errType] = false

        Object.freeze(aO5)

        if (snd.tagName.match(/img/i))
            aO5.image.stop = snd

        snd.aO5snd = aO5
    }


    SetT(aO5, mrk, err) {
        aO5.sound.errIs[mrk] = err
        const t = aO5.title
        SetTitle(aO5, err ? `Для тега ${t ? ("'" + t + "'") : ''} ошибка: ${errTypes[mrk]}` : t)
    }
    AddError(aO5, mrk, txt) {
        if (!aO5.sound.errIs[mrk]) {
            this.SetT(mrk, true)
            C.ConsoleError(`"${errTypes[mrk]}" (код=${mrk})` + (txt ? ` ${txt}` : '') + ` для '${aO5.name}'`)

            aO5.sound.errIs.errs = true
            if (!aO5.snd.classList.contains(oSndError))
                aO5.snd.classList.add(oSndError)
        }
    }
    RemError(aO5, mrk) {
        if (aO5.sound.errIs[mrk]) {
            this.SetT(mrk, false)
            console.log(`${lognam} Устранена ошибка: errTypes.${mrk}`)

            const errIs = aO5.sound.errIs
            for (const erri in errIs)
                if (erri != 'errs' && errIs[erri])
                    return

            aO5.sound.errIs.errs = false
            if (aO5.snd.classList.contains(oSndError))
                aO5.snd.classList.remove(oSndError)
        }
    }
}


