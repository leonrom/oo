/* global window, document, console */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!!
let C;
// import { C } from '../index.js'
import { PO5shp } from './PO5shp.js'

const
    MakeFrames = (aO7) => {
        const
            errs = [],
            typs = 'cins',
            frms = aO7.frms,
            pBase = aO7.pBase,
            tagBase = pBase.pO5.cnst.tag,
            TagCheck = (t, typ, cod) => {
                switch (typ) {
                    case 'n': return t.nodeName === cod
                    case 'i': return t.id === cod
                    case 'c':
                        for (const c of t.classList)
                            if (c == cod)
                                return true
                }
            }

        // удаляю старое использование
        for (const {key, frame} of Frame) {
            const i = frame.aOfs.indexOf(aO7)
            if (i >= 0) {
                frame.aOfs.splice(i, 1)
                if (frame.aOfs.length === 0)
                    Frame.frames.delete(key)
            }
        }
        // pBase.tagCuts.clear()  // а вот и НЕ надо очищать!
        frms.frames.clear()
        frms.tagCut = null

        // добавляю aO7  к frames
        const ss = aO7.cls.ori.split(',')
        for (const s of ss) {
            if (!s) continue

            let typ = 'i', cuu = s.trim()
            if (s.includes('=')) {
                const cc = s.split('=')
                typ = cc[0].trim().toLowerCase()[0]
                cuu = cc[1].trim()
            }

            const
                uu = cuu.split('/'),
                cod = (uu[0] || '').trim(),
                par = (uu[1] || '').trim(),
                iscut = !!par.match(/c/i),
                isfix = !iscut || par.match(/f/i)

            let num = par.replace(/[fc]/gi, '') || 0 // 'f' уже не используется и игнорируется                    

            if (!typs.includes(typ)) {
                errs.push(`тип ссылки '${typ}' не начинается одним из '${typs}' заменен на 'i'`)
                typ = 'i'
            }
            if (!Number.isInteger(num) || isNaN(num)) {
                errs.push(`непонятное значение для num='${uu[1]}' (после символа '/'). Взято 0`)
                nim = 0
            }

            if (iscut) {
                let tag = frms.tagCut
                if (!tag) {
                    let own = aO7.cnst.parent, n = num
                    if (cod === 'b' || cod === 'B')
                        tag = tagBase
                    else if (cod === 'w' || cod === 'W')
                        tag = body
                    else {
                        do {                        // ищу среди вложенных
                            if (TagCheck(own, typ, cod)) {
                                tag = own
                                if (--n <= 0)
                                    break
                            }
                            if (own === tagBase)
                                break

                            own = own.parentNode
                        }
                        while (own.nodeName !== 'HTML')

                        if (!tag) {
                            own = pBase.pO5.cnst.tag, n = num
                            do {                    // ищу среди  ВСЕХ внешних 
                                if (TagCheck(own, typ, cod)) {
                                    tag = own
                                    if (--n <= 0)
                                        break
                                }
                                own = own.parentNode
                            }
                            while (own.nodeName !== 'HTML')

                            if (tag && tag !== pBase.pO5.cnst.tag)
                                console.log("%c%s", C.consts.fmtErr, `cut-контейнер '${tag.pO5 ? tag.pO5.name : C.getObjName(tag)}' для '${aO7.name}' `, ` найден снаружи базового контейнера '${pBase.pO5.name}'`)
                        }

                        if (!tag) {
                            errs.push(`${aO7.name}: не найден контейнер 'владелец' для "${s}" . Взял '${tagBase.pO5.name}'`)
                            tag = tagBase
                        }
                        else if (n > 0)
                            errs.push(`взял ${n}-й тег (вместо ${n0} для  "${s}") `)
                    }
                    frms.tagCut = tag
                    if (!tag.pO5)
                        new PO5shp(tag, window.getComputedStyle(tag))
                }
                else
                    errs.push(`несколько cut-квалификаторов (т.е. содержащих '/c')`)
            }

            if (isfix) {
                const key = pBase.idn + ':' + typ + ',' + cod + ',' + num
                let frame = Frame.frames.get(key)
                if (!frame) {
                    let own = pBase.pO5.cnst.tag, n = num, tag;
                    if (cod === 'b' || cod === 'B')
                        tag = tagBase
                    else if (cod === 'w' || cod === 'W')
                        tag = body
                    else {
                        do {
                            if (TagCheck(own, typ, cod)) {
                                tag = own
                                if (--n <= 0)
                                    break
                            }
                            own = own.parentNode
                        }
                        while (own.nodeName !== 'HTML')

                        if (!tag) {
                            let found;
                            switch (typ) {
                                case 'n': found = !!document.getElementsByTagName(cod); break
                                case 'i': found = !!document.getElementById(cod); break
                                case 'c': found = !!document.getElementsByClassName(cod)
                            }
                            const txt = found ? `найден НЕ скроллируемый` : `не найден скроллируемый`
                            errs.push(`${aO7.name}: ${txt}` + //  (или хотя  бы overflow: auto; / scroll;)    
                                ` контейнер 'оператор' для typ=${typ} и cod='${cod}'. Взял '${pBase.pO5.name}'`)
                            tag = pBase.pO5.cnst.tag
                        }
                        else if (n > 0)
                            errs.push(`взял ${n}-й тег (вместо ${n0} для typ=${typ} и cod=${cod}) `)
                    }
                    frame = new Frame(key, typ, cod, num, tag.pO5)

                    Frame.frames.set(key, frame)

                    if (C.consts.debug)
                        console.log(`Определил (и добавил в base.frames) фрейм "${key} на ${frame.pO5.name}" `)
                }

                frame.aOfs.push(aO7)
                frms.frames.add(frame)
            }
        }
        if (!frms.tagCut)
            frms.tagCut = tagBase

        pBase.tagCuts.add(frms.tagCut)

        if (errs.length)
            C.ConsoleError(`Ошибки определения фреймов для ${aO7.name}:`, errs.length, errs)
    }


export class Frame {
    static frames = new Map()
    static MakeFrames = MakeFrames
    static prepare(c) {
        C = c
    }

    constructor(key, typ, cod, num, pO5) {
        Object.assign(this, {
            typ: typ,
            cod: cod,
            num: num,
            pO5: pO5,
            aOfs: [], // кто его использует
        })
        Object.seal(this)
    }

    // делаем класс итерируемым
    static *[Symbol.iterator]() {
        for (const [key, frame] of this.frames.entries()) {
            yield { key, frame };
        }
    }
}
