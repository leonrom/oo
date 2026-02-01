/* global window, console, IntersectionObserver */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

/**
 * @module shp/init
 * Инициализация скроллируемых объектов.
 *
 * Содержит функции:
 * - `Observe(entries)` — обработка появления элементов в области видимости.
 * - `Init()` — первичная инициализация обсерверов.
 */

import { C } from '../index.js'
import { AO7 } from './AO7.js'
import { Frames } from './Frames.js'
import { PBases } from './PBases.js'

let observ;

const
    state = {
        observer: null,
        elements: new Set,
    },
    DebugShowRez = oO5s => {
        const
            head = ` после "${Array.from(oO5s).map(aO7 => aO7.name).join(', ')}"`,
            rez = []

        for (const aO7 of oO5s)
            rez.push({
                aO7: aO7.name,
                tagCut: aO7.frms.tagCut.id,
                base: aO7.pBase.pO5.name,
                frms: Array.from(aO7.frms.frames).map(f => f.pO5.cnst.id).join(', ')
            })
        C.ConsoleInfo(`Обработка ${head}`, rez.length, rez)

        rez.length = 0
        for (const { bO5, pBase } of PBases)
            rez.push({
                base: pBase.pO5.name,
                pOuts: ' ' + (Array.from(pBase.pO5.pOuts)).map(p => p.name).join(', '),
                // pIncs: ' ' + (Array.from(pBase.pO5.pIncs)).map(p => p.name).join(', '),
                aAll: ' ' + pBase.aAll.map(tag => tag.id).join(', ')
            })
        C.ConsoleInfo(`Базы ${head}`, rez.length, rez)

        rez.length = 0
        for (const { bO5, pBase } of PBases)
            for (const pOut of pBase.pO5.pOuts)
                rez.push({
                    base: pBase.pO5.name,
                    pOut: pOut.name,
                    pOuts: ' ' + (Array.from(pOut.pOuts)).map(p => p.name).join(', '),
                    // pIncs: ' ' + (Array.from(pOut.pIncs)).map(p => p.name).join(', ')
                })
        C.ConsoleInfo(`pOuts ${head}`, rez.length, rez)

        rez.length = 0
        for (const { key, frame } of Frames.Frame) {
            rez.push({
                key: key,
                tcn: frame.typ + ':' + frame.cod + ':' + frame.num,
                pO5: frame.pO5.name,
                aOfs: frame.aOfs.map(a => a.name).join(', '),
            })
        }
        C.ConsoleInfo(`Фреймы ${head}`, rez.length, rez)
    },
    ReadCls = (aO7, ss) => {
        const
            errs = [],
            cls = aO7.cls,
            puts = cls.puts,
            mselec = /[A-Z]|a-z]|[+-]?\d+/g

        Object.assign(cls, {           // для повторной инициализации (напр. в тестах)
            level: 0,
            pitch: 'S',
            nofx: false,
            alive: false,
        })
        puts.T = puts.L = puts.R = puts.B = false

        const cs = ss.toUpperCase().match(mselec)
        for (const c of cs)
            switch (c) {
                case 'A': cls.alive = true
                    break
                case 'C':                // сжимает предыдущий
                case 'P':                // сталкивает предыдущий
                case 'S':                // сдвигает предыдущий
                case 'O': cls.pitch = c  // наезжает на предыдущий
                    break
                case 'T':
                case 'L':
                case 'R':
                case 'B': puts[c] = true
                    break
                case 'N': cls.nofx = true; break    // не подвисает, но может сдвигать остальные
                default:
                    if (!isNaN(c)) cls.level = Number(c)
                    else
                        errs.push(`c='${c}' в "${ss}"`)
            }
        if (!puts.T && !puts.L && !puts.R && !puts.B) puts.T = true

        if (errs.length)
            console.error("%c%s", C.consts.fmtErr, `Для ${aO7.name} не опр. квалиф.: ` + errs.join(', '))
    },
    Observe = entries => {
        const newO5s = new Set(),
            reas = new Set()

        for (const entry of entries) {
            const shp = entry.target
            let aO7 = shp.aO7shp,
                ready = aO7 ? aO7.act.ready : 0

            if (entry.isIntersecting) {
                if (!aO7) {
                    const el = observ.getel(shp)
                    aO7 = new AO7(shp, el.quals)
                    aO7.act.observer = state.observer
                    newO5s.add(aO7)
                }

                if (entry.intersectionRatio === 1)  //   && !aO7.act.isfix  (необязательно)
                    // if (!aO7.cls.badtag)
                    aO7.act.ready = true
            }
            else
                if (aO7 && !aO7.act.isfix)
                    aO7.act.ready = false

            if (aO7) {
                shp.classList.toggle('o-isready', aO7.act.ready)
                if (ready !== aO7.act.ready)
                    reas.add(aO7)
            }
        }

        if (newO5s.size > 0) {
            const bBases = new Set()
            let isNew = false
            for (const aO7 of newO5s) {
                if (PBases.AddToBase(aO7))  // если добавилась новая база
                    isNew = true

                ReadAttrs(aO7)
                bBases.add(aO7.pBase)
            }

            for (const bBase of bBases)
                bBase.ReorderAO
            s()

            if (isNew)
                for (const x of 'TL')
                    PBases.SetBorders(x, body.pO5)

            if (C.consts.debug > 1)
                DebugShowRez(newO5s)
        }

        if (newO5s.size > 0 || reas.size > 0)     // для тестирования в frames.html
            window.dispatchEvent(new CustomEvent('o_activate', {
                detail: { reas: reas, newO5s: newO5s }
            }))
        // oO5s.clear()
    }

/**
 * создаёт наблюдателя за элементами
 * @function CreateObserver
 */
function CreateObserver(options) {

    state.observer = new IntersectionObserver(Observe, options)
    C.cleanup.push(() => state.observer.disconnect())

    function getel(tag) {
        for (const el of state.elements)
            if (el.tag === tag)
                return el
    }

    return {
        observe: (tag, quals) => {
            state.elements.add({ tag: tag, quals: quals ? quals.join(':') : '' })
            state.observer.observe(tag)
        },
        unobserve: (tag) => {
            state.observer.unobserve(tag)

            const el = getel(tag)   // заменено!
            state.elements.delete(el)

            if (state.elements.length === 0) {
                state.observer.disconnect()
                state.observer = null
                if (C.consts.debug)
                    console.log("%c%s", C.consts.fmtOK, `observe: `, ` отключено полностью`)
            }
        },
        getel, // экспортируем в объект
        get observedElements() {
            return Array.from(state.elements)
        },
    }
}

export const init = {
    ReadAttrs: aO7 => {
        const aquals = aO7.cls.quals.split(/[:;]/)
        let sclss = 'T', sdivs = '';
        switch (aquals.length) {
            case 0: break
            case 1:
                if (aquals[0].indexOf('=') < 0) sclss = aquals[0]
                else sdivs = aquals[0]
                break
            case 2:
                sclss = aquals[0]
                sdivs = aquals[1]
                break
            default:
                sclss = aquals[0]
                sdivs = aquals.slice(1).join(',')
        }

        ReadCls(aO7, sclss) // разделяющие запятые там просто игнорируются

        Frames.MakeFrames(aO7, sdivs.split(','))
    },
    startObserver: W => {
        let found=0;
        const mtags = C.SelectByClassName(W.clasn, W.modul)
        for (const mtag of mtags) {
            if (
                !mtag.tag.classList.contains('o-none') &&
                !mtag.quals.find(qual => !qual.includes('=') && qual.match(/n/i))
            ) {
                if (!observ)
                    observ = CreateObserver({
                        root: null,
                        threshold: [0, 1],
                        rootMargin: '0px',
                        trackVisibility: false,
                    })
                observ.observe(mtag.tag, mtag.quals)
                found++
            }
        }

        if (!found)
            console.log("%c%s", W.consts.fmtErr, `Отсутствует '${W.clasn}'`,
                `в документе или в его тегах с 'olga-start' (либо вообще, либо без 'o-none' и ':N')`)
    }

}
