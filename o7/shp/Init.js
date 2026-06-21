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

import { AO7 } from './AO7.js'
import { Debug } from './Debug.js'
import { Frame } from './Frame.js'
import { PBases } from './PBases.js'
import { Observ } from './Observ.js'

let C, clasn;

const
    aO7s = [],
    initByClass = tag => {
        // const
        //     atr = C.extractClassAttr(tag, clasn),
        //     quals = atr.quals

        // let sclss = 'T', sdivs = '';
        // switch (quals.length) {
        //     case 0: break
        //     case 1:
        //         if (quals[0].indexOf('=') < 0) sclss = quals[0]
        //         else sdivs = quals[0]
        //         break
        //     case 2:
        //         sclss = quals[0]
        //         sdivs = quals[1]
        //         break
        //     default:
        //         sclss = quals[0]
        //         sdivs = quals.slice(1).join(',')
        // }

        // if (sclss.includes('-')) // тег просто имеет css класса но никак не взаимодействует
        //     return

        // const aO7 = new AO7(tag, sclss)
        // // ReadCls(aO7, sclss) // разделяющие запятые там просто игнорируются

        // Frames.MakeFrames(aO7, sdivs.split(','))

        const atr = C.extractClassAttr(tag, clasn)
        if (atr) { // тег просто имеет css класса но никак не взаимодействуетs)
            if (!Observ.observer)
                Observ.init()

            aO7s.push(new AO7(tag, atr))
            //     PBases.AddToBase(aO7)
            //     aO7.pBase.ReorderAO5s()
            //     for (const x of 'TL')
            //         PBases.SetBorders(x, body.pO5)

            // if (C.consts.debug > 1)
            //     Debug.ShowRez(aO7s)

            // // для тестирования в all.js (и в frames.html ?)
            // window.dispatchEvent(new CustomEvent('o-activated', {
            //     detail: { reas: reas, aO7s: aO7s }

            Observ.add(tag)
        }
    },
    // fillBases = () => {
    //     const bBases = new Set()
    //     let isNew = false
    //     for (const aO7 of aO7s) {
    //         if (PBases.AddToBase(aO7))  // если добавилась новая база
    //             isNew = true

    //         bBases.add(aO7.pBase)
    //     }

    //     for (const bBase of bBases)
    //         bBase.ReorderAO5s()

    //     if (isNew)
    //         for (const x of 'TL')
    //             PBases.SetBorders(x, body.pO5)

    //     if (C.consts.debug > 1)
    //         Debug.ShowRez(aO7s)

    // },
    activateAO7 = aO7 => {
        //     quals = atr.quals

        // let sclss = 'T', sdivs = '';
        // switch (quals.length) {
        //     case 0: break
        //     case 1:
        //         if (quals[0].indexOf('=') < 0) sclss = quals[0]
        //         else sdivs = quals[0]
        //         break
        //     case 2:
        //         sclss = quals[0]
        //         sdivs = quals[1]
        //         break
        //     default:
        //         sclss = quals[0]
        //         const mm = quals.slice(1)
        //         sdivs = quals.slice(1).join(',')
        // }

        // const aO7 = tag.aO7shp

        PBases.AddToBase(aO7)
        Frame.MakeFrames(aO7)  // , atr.ori.split(','))
        aO7.pBase.ReorderAO5s()

        for (const x of 'TL')
            PBases.SetBorders(x, body.pO5)

        // для тестирования в all.js (и в frames.html ?)
        window.dispatchEvent(new CustomEvent('o-activated', {
            detail: { aO7: aO7 }
        }))

        if (C.consts.debug)
            Debug.ShowRez(aO7)
    },
    DblClick = e => {               // расфиксирую этот и все родительские
        let tag = e.currentTarget
        do {
            const aO7 = tag['aO7shp_ref']
            if (!aO7)
                break

            aO7.DoFix()

            if (C.consts.debug > 0)
                console.log("%c%s", C.consts.fmtOK, `расфиксация '${aO7.cnst.id}' по событию '${e.type}'`)
            tag = aO7.parent
        } while (tag)
    }

export const Init = {
    prepare: function (c, clsn) {
        C = c
        clasn = clsn
        Observ.prepare(C, activateAO7)
    },
    init: function () {
        C.makeForTypName(tag => initByClass(tag), 'myclass', clasn)
        // if (aO7s.length)
        //     fillBases()
        // else
        if (aO7s.length)
            document.addEventListener('dblclick', DblClick, true)
        else
            C.ConsoleInfo(`Отсутствует '${clasn}'`,
                `в документе или в его тегах с 'olga-start'`)

    },
    reset: function () {
        if (aO7s.length) {
            document.removeEventListener('dblclick', DblClick, true)
            for (const aO7 of aO7s)
                AO7.observer.unobserve(aO7.tag)
            aO7s.length = 0
        }
        Observ.reset()
    }
}
