/**
 * AO7.js
 * модуль pop
 * 
 * Класс AO7 
 * - описание PopUp-тегов,
 * Из квалификатора quals выдираются:
 * - mode - символы (в любом месте quals)
 *      - 'C' - click, 
 *      - 'D' - dblclick, 
 *      - 'O' - при зависании курсора; 
 *      - 'A' - -"- и остаётся после его ухода; 
 * - 'S" - ореол когда всплывшее окно в топе  
 * - geom - число 0-4 указывающая квадрант всплытия окна
 * При этом в quals подстроки C, 12, mod м.б. в любом порядке.
  */

import { OPath } from './OPath.js'

let C, fileName;
const
    logName = 'pop.AO7 : ',
    p_ref = 'aO7pop',
    margaW = 16,
    margaH = 12

async function loadJSON() {
    try {

        console.log(new URL(fileName, location.href).href)
        const response =
            await fetch(fileName)

        if (response.ok)
            return await response.json()
        else
            if (C.consts.debug)
                console.log(`Ошибка открытия '${fileName}': ${response.status} (${response.statusText}) `)
    }
    catch (err) {
        console.error(`Ошибка чтения '${fileName}'`, err)
    }
    return {}
}

export class AO7 {
    #stt = ''
    _geom = NaN
    _show = false  // отмечать активное окно ореолом

    static sizes = null
    static prepare(c, stem) {
        C = c
        fileName = stem + `.json`
        // document.getElementsByTagName('html').aidO7 = 'html'
    }

    static init() {
        // for (const i of [0, 1, 2, 3, 4]) // кентр и 4 квадранта
        //     off[i] = { dx: dx0, dy: dy0 }
    }

    static M = Object.freeze({
        DCLCK: 'D',
        CLICK: 'C',
        oSHOW: 'o_pop-show'
    })

    constructor(tag, quals, ori) {
        this.name = C.getObjName(tag)

        this.aidO7 = OPath.create(tag)
        const el = OPath.getEl(this.aidO7)
        console.log(`name=${this.name}, aidO7=${this.aidO7}`, el)

        this.tag = tag
        this.ori = ori
        this.url = ori.startsWith('#') ? ori
            : new URL
                (ori ? C.decodeUrl(ori, this.name) : '',
                    document.baseURI   // учитывает <base>
                ).href

        const gs = quals.match(/[0-4]+/)
        this._geom = gs?.length ? parseInt(gs[0]) : -1
        this._show = !!((quals.match(/[S]/i) || '')[0])
        this.mode = (quals.match(/[CDOA]/i) || '')[0]?.toUpperCase() || AO7.M.CLICK

        if (this.mode == 'O' || this.mode == 'A')
            tag.classList.add('o-hover')

        const erqs = quals.match(/[^SCDOA\d]/gi)
        if (erqs)
            C.ConsoleError(` у тега '${this.name}' в квалификаторе "${quals}" `,
                ` - ['${erqs.join("', '")}'] - не одно из "SCDOA" и не цифра`)

        this.wsiz = {
            x: NaN, y: NaN, w: NaN, h: NaN,    // текущее положение + архив позиций по квадрантам
            0: { x: NaN, y: NaN },
            1: { x: NaN, y: NaN },
            2: { x: NaN, y: NaN },
            3: { x: NaN, y: NaN },
            4: { x: NaN, y: NaN },
        }
        // this.wpozs = { t: 0, x: 0, y: 0, w: 0, h: 0 }
        this.act = Object.seal({ wnd: null })   // _active: false, 

        tag[p_ref] = this
        C.propagate(tag, this, p_ref, tag[p_ref + C.p_ref] ?? null)
        Object.freeze(this)
    }
    erase() {
        C.propagate(this.tag, null, 'aO7pop', tag['aO7pop' + C.p_ref] ?? null)
        this.act.wnd = null
        this.tag = null
        this.act = null
        this.url = ''
    }
    getStt() {
        return this.#stt
    }
    setSTT(state) {
        if (!this.isOlgaSnd || state === this.#stt)
            return

        if (this.#stt)
            this.tag.classList.remove(this.#stt)
        if (state)
            this.tag.classList.add(state)
        this.#stt = state

        if (C.consts.debug > 1)
            console.log(logName + `'${this.name.padEnd(6)}': ${state ? state : '-'}`)
    }
    // ---------------- геометрия ----------------

    savePos(div) {
        const r = div.getBoundingClientRect()
        Object.assign(this.wsize, {
            t: window.performance.now().toFixed(),
            y: r.top, x: r.left, w: r.width, h: r.height
        })
    }
}