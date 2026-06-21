/**
 * AO7.js
 * 
 * Класс AO7 
 * - описание аудио-тегов,- как "моих", так и <audio> 
 * - для <audio> м.б. задан olga-snd, но квалификаторы игнорируются
 * - обработка событий мыши на теге
 *  - для НЕ <audio> вызываются play() и pause()
 
 */

import { Play } from './Play.js'
let C, clasn;
const
    logName = 'snd.AO7 : ',
p_ref='aO7snd',
    setMode = (aO7, quals) => {
        let loop=false
        for (const c of quals)
            switch (c.toUpperCase()) {
                case 'W': aO7.tag.classList.add(AO7.M.oSWING); break  // покачивание при проигрывании 
                case 'S': aO7.tag.classList.add(AO7.M.oSHOW); break   // ореол при проигрывании 
                case 'C': aO7.mode = AO7.M.CLICK; break  // звучание только после клика (умолчание)
                case 'O': aO7.mode = AO7.M.OVER; break   // звучание при наведении курсора (и по клику).
                case 'A': aO7.mode = AO7.M.AVER; break   // -"- и не прекращается после увода курсора с тега 
                case 'L': loop = true; break     // звучание зацикливается;
                default:
                    console.error("%c%s", C.consts.fmtErr, logName + ` для '${aO7.name}' непонятное '${c}'`, ` в квалификаторе quals='${quals}'`)
                    debugger
            }
        if (loop && !aO7.tag.loop)
            aO7.loop = loop
    }

export class AO7 {
    #stt = ''
    #entered = false

    static M = Object.freeze({ CLICK: 'click', OVER: 'over', AVER: 'over+alive', oSWING: 'o-swing', oSHOW: 'o_sbd-show', })
    static prepare(c, clsn) {
        C = c
        clasn = clsn
    }

    url = ''       //   для TAO7 и CAO7
    playId = 0
    audio = null
    loop = false
    mode = AO7.M.CLICK

    errSrc = false    // были ошибки загрузки src

    constructor(tag, quals) {
        const isOlgaSnd = tag.classList.contains(clasn)

        this.tag = tag
        this.title = tag.title
        this.isOlgaSnd = isOlgaSnd
        this.name = C.getObjName(tag)

        setMode(this, quals)

        this.act = Object.seal({ time: 0, shift: false })

        tag[p_ref] = this
        C.propagate(tag, this, p_ref, tag[p_ref + C.p_ref] ?? null )
        Object.seal(this)
    }

    erase() {
        C.propagate(this.tag, null, p_ref, tag[p_ref + C.p_ref] ?? null )
        this.url = ''
        this.act = null
        this.tag = null
        this.audio = null
        this.tag.aO7snd = null
    }
    getStt() {
        return this.#stt
    }
    setSTT(state, e) {
        if (!this.isOlgaSnd || state === this.#stt)
            return

        if (this.#stt)
            this.tag.classList.remove(this.#stt)
        if (state)
            this.tag.classList.add(state)
        this.#stt = state

        if (C.consts.debug > 1) {
            console.log(logName + `'${this.name.padEnd(6)}': ${state ? state : '-'}`)
            // if (C.consts.debug > 2)
            //     console.trace()
        }
    }

    isEntered() {
        return this.#entered
    }
    onEnter(e) {
        this.#entered = true
        this.act.time = 0
    }
    onLeave(e) {
        this.#entered = false
    }
    onClick(e) {
    }
}