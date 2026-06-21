/**
 * Wnd.js
 * модуль pop
 * контроль открытия и закрытия всплывающих окон
 * привязка окна к вызывающему тегу
 * сохранение геометрии окна при закрытии и считывание при открытии  по размерам из тега
 * в авотрском режиме при закрытии при нажатом shift выполняется запись в файл
 * 
 * Нажатие ShiftKey : 
 *  - при открытии окна позиционирует всплывшее окно в исходное (авторское ) положение
 *  - при закрытии окна сохраняет его позицию и размеры
 */

import { FS } from './FS.js'
import { Div } from './Div.js'
import { Drag } from './Drag.js'
import { Link } from './Link.js'

let C, isAuthor, maxWnds, clasW = '', nameAllWndsEvents = '', zIndex = 999 // 2000000000

const
    logName = 'pop.Wnd: ',
    // nosrc = 'about:blank',
    actWs = [],              // открытые окна
    wnds = new Map(),        // url → wnd - все созданные осна
    divEves = Object.freeze({
        UP: 'pointerup',
        DOWN: 'pointerdown',
    }),
    handler = e => {
        const aO7div =                   // Div.aO7div
            // Div.drag?.aO7div ||
            e.target.closest(`.${clasW}`)?.aO7div
        if (aO7div)
            if (e.type === divEves.UP)
                Div.endDrag('handler')       // aO7div)
            else
                if (e.type === divEves.DOWN) {
                    aO7div.wnd.putOnTop(aO7div.wnd.aO7)   // никаких shiftKey - тут размеры не менять!
                    if (e.buttons & 1)
                        aO7div.doAction(e)
                }
    },
    setAllWndsEvents = nameEventListener => {
        if (nameAllWndsEvents === nameEventListener) {
            C.ConsoleAlert(`Повтор в setAllWndsEvents: '${nameAllWndsEvents}'`)
            return
        }
        nameAllWndsEvents = nameEventListener
        if (C.consts.debug)
            console.log(logName, `setAllWndsEvents = '${nameEventListener}'`)
        for (const eve of [...Object.values(divEves)])
            document[nameEventListener](eve, handler)
    }

// --------------------------------------------------
export class Wnd {
    static prepare(c, clasw, maxW) {
        C = c
        maxWnds = maxW
        clasW = clasw
        Link.prepare(C, actWs)
        C.cleanup.push(Wnd.reset)
    }
    static setAuthor(author) {
        isAuthor = author
    }
    static reset() {
        for (const wnd of wnds.values()) {
            if (wnd.aO7)
                wnd.close()
            if (wnd.aO7div.div?.isConnected)
                wnd.aO7div.div.remove()
            wnd.aO7div.div = null
        }
        wnds.clear()

        let i = actWs.length
        while (i-- > 0)
            actWs[i].close(i)
        actWs.length = 0

        if (nameAllWndsEvents !== 'removeEventListener')
            setAllWndsEvents('removeEventListener')
    }
    static init() {
        if (wnds.size)
            Wnd.reset()
    }
    static getWnd(url) {
        return wnds.get(url) ||
            new Wnd(url)
    }
    static isOnTop(wnd) {
        return actWs.length && wnd === actWs.at(-1)
    }

    static setShift(isKey) {
        const fn = isKey ? 'add' : 'remove'
        for (const actW of actWs) {
            const aO7div = actW.aO7div
            aO7div.div.classList[fn](Drag.SHIFT)
            aO7div.isKey = isKey
        }
    }

    constructor(url) {
        // this.url = url
        // const aO7div =            this.aO7div = new Div(this)

        Object.assign(this, {
            url: url,
            aO7: null,
            byClick: false,
            aO7div: new Div(this),
            // div: aO7div.div        // для ускорения доступа
        })

        Object.seal(this)
        wnds.set(url, this)
    }
    #checkErr(op) {
        if ((op && this.aO7) || (!op && !this.aO7)) {
            C.ConsoleAlert(`${op ? 'есть' : 'нет'}  aO7 при ${op ? 'от' : 'за'}крытии окна`)
            // debugger
        }
    }
    open(aO7, byClick, isKey) {
        if (C.consts.debug)
            this.#checkErr(true)

        // this.#setaO7(aO7)
        if (!actWs.length) setAllWndsEvents('addEventListener')

        this.aO7div.activateFrame(aO7)

        this.byClick = byClick

        if (actWs.length > maxWnds) {
            actWs[0].aO7div.close()
            actWs.splice(0, 1)
        }
        actWs.push(this)   // aO7: aO7.name, 


        // if (this.aO7 !== aO7 || isKey)
        //     this.aO7div.calcSize(aO7, actWs)
        const r = Link.attaO7(this, aO7, isKey)
        this.aO7div.setSize(r)

        this.putOnTop(aO7)
    }

    close(isKey) {   // для сохранения в файл в авторском режиме
        if (C.consts.debug)
            this.#checkErr(false)

        if (isKey && isAuthor)
            if (this.aO7.tag.id) FS.toFile(this.aO7)
            else
                C.ConsoleError(`Запись окна в файл для aO7='${this.aO7.name}' НЕ выполнялось - нету 'id'`)

        // this.aO7.saveSize(this.aO7div.div, isKey)
        if (Div.action)
            Div.endDrag('close(isKey)')
        this.aO7div.activateFrame(null)

        Link.detaO7(this)

        const i = actWs.findIndex(actW => actW === this)
        if (i >= 0) actWs.splice(i, 1)
        else
            C.ConsoleAlert(`Не найдено this-окно для close() для ${this.aO7.name}`)

        if (actWs.length === 0) setAllWndsEvents('removeEventListener')
        else
            actWs.at(-1).aO7div.markAsAct(true)
    }
    /**
     * Или добавляем окно в топ видимых
     * или убираем из видимых
     */
    putOnTop(aO7) {
        if (actWs.length > 1) {

            actWs.at(-1).aO7div.markAsAct(false)

            let i = actWs.length
            while (i-- > 0)
                if (actWs[i] === this) {
                    if (i + 1 < actWs.length) {
                        actWs.splice(i, 1)
                        actWs.push(this)
                    }
                    break
                }
        }

        this.aO7div.markAsAct(true)

        const i = zIndex + actWs.length
        this.aO7div.div.style.zIndex = i
        if (actWs.length > 1)
            actWs.at(-2).aO7div.div.style.zIndex = i - 1

        if (C.consts.debug)
            console.log(` putOnTop для ${this.aO7.name} индексы: `,
                actWs.map(actW =>
                    (actW.aO7?.name || '?') + '=' + actW.aO7div.div.style.zIndex
                ).join(', '))
    }
}