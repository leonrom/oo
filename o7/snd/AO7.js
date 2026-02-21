/**
 * 3. Класс AO7 (создаётся при первом hover)
 */
// AO7.js
import { EveTags } from './EveTags.js'
import { Curr } from './Curr.js'

const
    fillModis = (quals) => {
        const m = Object.seal({ alive: false, free: false, loop: false, over: false, none: false, })
        for (let i = 0; i < quals.length - 1; i++)
            for (const c of quals[i])
                switch (c) {
                    case 'A': m.alive = true; break  //звучание не прекращается после увода курсора с тега 
                    case 'F': m.free = true; break  //не использовать встроенный класс olga_snd для отображения тега;
                    case 'L': m.loop = true; break  //звучание зацикливается;
                    case 'O': m.over = true; break  // звучание начинается по наведению курсора.
                    case 'N': m.none = true; break  //не обрабатывать звучание
                    default: console.error(`Непонятныо '${c}'`, `в квалификаторе qual='${quals[i]}'`)
                }
        return Object.freeze(m)
    },
    getOri = (quals, snd) => {
        const u = quals.at(-1) || ''
        switch (u.toLowerCase()) {
            case 'href': return snd.getAttribute('href')
            case 'src': return snd.getAttribute('src')
            case 'n': return ''
        }
        return u
    }

let C;      // , aPlayed;

export class AO7 {
    static prepare(c) { C = c }
    static comm = {}

    tt = { title: '', state: 0 }
    hoverInside = false
    loading = false
    ready = false

    constructor(snd, quals) {
        const isAUDIO = snd.tagName === 'AUDIO'
        this.isAUDIO = isAUDIO
        this.snd = snd
        this.name = C.getObjName(snd)
        this.modis = fillModis(quals)
        this.ori = getOri(quals, snd)
        this.url = this.ori ? C.decodeUrl(this.ori, this.name) : ''

        if (isAUDIO)            this.audio = snd
        else {
            Object.assign(AO7.comm, { audio: new Audio(), })
            AO7.comm.audio.id = 'o-comm_audio'
            this.audio = AO7.comm.audio
        }
        if (!quals.length)
            snd.classList.add('o-none')

        snd.aO7snd = this
        Object.seal(this)
    }

    destroy() {
        this.comm.audio.destroy()
        this.snd = null
    }

    canPlayAfterClick() {
        const t = this.tt
        if (t.state === 1)
            return true

        if (EveTags.hasFirstClick()) {
            if (t.state < 0)
                this.snd.title = t.title

            t.state = 1
            return true
        }

        if (t.state === 0) {
            t.state = -1
            t.title = this.snd.title
            this.snd.title = 'чтобы началось звучание - кликните на странице'
        }
    }

    onEnter() {
        if (this.isAUDIO) {
            if (!this.ready) {
                if (C.getFullUrl(this.snd.src) !== this.url)
                    this.snd.src = this.url
                this.ready
            }
        }
        else {
            this.hoverInside = true
            if (this.hoverInside
                && this.modis.over
                && this.audio.paused
            )
                Curr.playO7(this)
        }
    }

    onLeave() {
        this.hoverInside = false
        if (!this.modis.alive)
            this.audio.pause()
    }

    onClick() {
        if (Curr.aO7 === this
            && !this.audio.paused
        )
            this.audio.pause()
        else
            Curr.playO7(this)
    }
}