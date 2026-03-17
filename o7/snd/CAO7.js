/**
 * CAO7.js
 * 
 * Класс CAO7  - обработка НЕ <audio> тегов
 * - обработка именованных ссылок
 * - обработка квалификаторов класса olga-snd воспроизведение аудио
 * - обработка событий мыши на теге
 * - "искусственный" вызов play() и pause(), при этом нажатие Shift  меняет воспроизведение:
 * 
 * * Нажатие Shift при управлении (любыми, в т.ч. и <audio>) тегами с "olga-snd" меняет воспроизведение:
    - перед началом проигрывания - изменяет скорость на shift_speed (если задано)
    - перед окончанием - если задано back_time то запоминает момент окончание звучания с соотв. обратным сдвигом
 */

import { AO7 } from './AO7.js'
import { Pick } from './Pick.js'
import { Play } from './Play.js'

let C, firstLogCanPlay = true, ca = null, clasn;
const
    logName = 'snd.CAO7: ',
    fillModis = (quals, aO7) => {
        const m = { alive: false, loop: false, over: false, }
        for (let i = 0; i < quals.length - 1; i++)
            for (const c of quals[i])
                switch (c) {
                    case 'A': m.alive = true; break  //звучание не прекращается после увода курсора с тега 
                    case 'L': m.loop = true; break   //звучание зацикливается;
                    case 'O': m.over = true; break   // звучание начинается по наведению курсора.
                    case 'N': aO7.tag.classList.add(CAO7.oNONE); break   //не обрабатывать звучание
                    case 'S': aO7.tag.classList.add(CAO7.oSWING); break  //покачивание при проигрывании (иначе - ореол)
                    default:
                        console.error("%c%s", C.consts.fmtErr, logName,
                            `Непонятное '${c}' в квалификаторе qual='${quals[i]}'`)
                        debugger
                }
        return Object.freeze(m)
    },
    canPlayAfterClick = aO7 => {
        const tt = aO7.titlO

        if (Pick.firstClick.was || Play.firstPlay.was) {
            if (tt.state < 0)
                aO7.tag.title = tt.title

            tt.state = 1
            return true
        }

        if (tt.state === 0) {
            tt.state = -1
            tt.title = aO7.tag.title
            aO7.tag.title = 'чтобы началось звучание - кликните на странице'
            if (firstLogCanPlay) {
                firstLogCanPlay = false
                console.log("%c%s", C.consts.fmtErr, logName, `Необходимо кликнуть на странице чтобы звучало при наведении курсора `)
            }
        }
    }

class CA {
    constructor() {
        this.audio = new Audio()
        this.audio.preload = "none" // сам всё делаю!
        this.audio.crossOrigin = 'anonymous'

        this.audio.aO7snd = null
        if (C.consts.debug)
            this.audio.id = 'o-comm_audio' //   для log'ов
        Play.addListeners(this.audio, 'add')
        Object.seal(this)
    }
    stopO7(e) {
        const
            audio = this.audio,
            oldO7 = audio.aO7snd
        if (!oldO7)
            return

        if (C.consts.debug > 1)
            console.log(logName, `stopO7 по ${e ? e.type : 'playO7'} для '${oldO7.name || '?'}'`)

        Object.assign(oldO7.act, {
            time: e ? (audio.currentTime - Play.mod.back_time) : 0,
            shift: e?.shiftKey || 0
        })

        audio.pause()
        const old = audio.aO7snd
        setTimeout(() => {
            if (audio.aO7snd === old)
                audio.aO7snd = null
        }, 1)
    }
    playO7(e, aO7) {
        const
            audio = this.audio,
            oldO7 = this.audio.aO7snd
        if (C.consts.debug > 1)
            console.log(logName, `playO7 для '${aO7.name}',  oldO7='${oldO7 ? oldO7.name : 'null'}'`)

        audio.currentTime = Math.max(aO7.act.time, 0)
        audio.playbackRate = e?.shiftKey ? Play.mod.shift_speed : 1


        //         if (audio.playbackRate !==1){
        // aO7.tag.dataset.speed = audio.playbackRate.toFixed(1) + "x"

        // setTimeout(()=>{
        //     delete aO7.tag.dataset.speed
        // }, 1100)
        //         }

        if (oldO7 && oldO7 !== aO7)
            this.stopO7()   // без передачи 'e'

        setTimeout(() => {
            audio.aO7snd = aO7
            audio.play()
                .catch(e => {
                    console.error('%c%s', C.consts.fmtErr, logName + ` '${aO7.name}'- `, `ошибка звучания:`, e)
                })
        }, 1)
    }
}

export class CAO7 extends AO7 {
    static oSWING = 'o-swing'
    static oNONE = 'o-none'

    // modis = { alive: false, loop: false, over: false, }
    constructor(tag, quals, ori) {
        super(tag, ori)
        this.modis = fillModis(quals, this)
        this.titlO = Object.seal({ title: '', state: 0 })      // обработка заголовка titlee при наведении курсора

        if (!ca)
            ca = new CA()

        this.tag.dataset.speed = '123xx'
        this.audio = ca.audio
        Object.seal(this)
    }

    onEnter(e) {
        if (this.modis.over
            && (this.titlO.state === 1 || canPlayAfterClick(this))
            && this.stt !== Play.oSOUND
            && this.stt !== Play.oWAIT
        )
            ca.playO7(e, this)
    }

    onLeave(e) {
        if (!this.modis.alive)
            ca.stopO7(e)
    }

    onClick(e) {
        if (ca.audio.aO7snd === this)
            ca.stopO7(e)
        else
            ca.playO7(e, this)
    }
    static prepare(c, clsn) {
        C = c
        clasn = clsn
    }
    erase() {
        super.erase()
    }
    static reset() {
        C.makeForTypName(tag => tag.aO7snd.erase(), 'myclass', clasn)
    }
}