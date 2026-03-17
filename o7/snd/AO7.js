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
    logName = 'snd.AO7: ',
    getOri = (u, snd) => {
        switch (u.toLowerCase()) {
            case 'href': return snd.getAttribute('href')
            case 'src': return snd.getAttribute('src')
            case 'n': return ''
        }
        return u
    },
    propagate = (el, aO7, add) => {
        for (const ch of el.children) {
            if (add) {
                ch.aO7snd_ref = aO7
                propagate(ch, aO7, add)
            }
            else
                if (ch.aO7snd_ref) {
                    ch.aO7snd_ref = null
                    propagate(ch, aO7, add)
                }
        }
    }

export class AO7 {
    static oPROPAGATE = 'o-propagate'
    titlO = null
    audio = null
    modis = null
    srcTags = null
    isAUDIO = false

    #stt = ''

    get stt() {
        return this.#stt
    }
    setSTT(state) {
        if (this.#stt !== Play.oERROR && state !== this.#stt) {
            const classList = this.tag.classList
            for (const stt of [Play.oWAIT, Play.oSOUND])
                classList.remove(stt)

            if (state)
                classList.add(state)
            this.#stt = state

            if (C.consts.debug > 1)
                console.log(`state='${state}', #stt='${this.#stt}', classList="${classList}"`)
        }
    }
    setERROR(err) {
        this.tag.classList[err ? 'add' : 'remove'](Play.oERROR)
        this.#stt = err ? Play.oERROR : ''
        this.setSTT('')
    }

    constructor(tag, ori) {
        const isOlgaSnd = tag.classList.contains(clasn)
        this.tag = tag
        this.srcReady = false
        this.tag.aO7snd = this
        this.isOlgaSnd = isOlgaSnd
        this.ori = getOri(ori, tag)
        this.name = C.getObjName(tag)

        this.url = new URL
            (ori ? C.decodeUrl(this.ori, this.name) : '',
                document.baseURI   // учитывает <base>
            ).href
        this.urlB = this.url

        this.act = Object.seal({ time: 0, shift: false })

        propagate(tag, this, true)
        Object.seal(this)
    }

    erase() {
        propagate(this.tag, this, false)
        this.act = null
        this.url = null
        this.tag = null
        this.audio = null
        this.tag.aO7snd = null
    }
    static prepare(c, clsn) {
        C = c
        clasn = clsn
    }
}