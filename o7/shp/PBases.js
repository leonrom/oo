/* global window, document, console, IntersectionObserver */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!

import { C } from '../index.js'
import { PO5shp } from './PO5shp.js'

const
    opp = { T: 'B', L: 'R', R: 'L', B: 'T' },
    FindAndFill = (aO7, adds) => {
        let bO5, nst, scrls, tag = aO7.cnst.parent
        do {
            let p, c = ' ';
            if (tag.pO5) {               // уже был раньше создан
                scrls = tag.pO5.scrls
                if (scrls.V || scrls.H) {
                    p = tag.pO5
                    c = '+'
                }
            }
            else {
                nst = window.getComputedStyle(tag)
                scrls = PO5shp.Scrls(tag, nst)
                if (scrls.V || scrls.H) {
                    p = new PO5shp(tag, nst)
                    c = '~'
                }
            }
            if (p && !bO5) bO5 = p

            if (C.consts.debug)
                adds.add(c + C.getObjName(tag))

            tag = tag.parentNode
        } while (tag && tag.nodeName !== 'HTML')

        return bO5
    },
    FillPOuts = bO5 => {
        let tag = bO5.cnst.tag, pTop = bO5, pO5;
        const pIncs = new Set([bO5])

        do {
            tag = tag.parentNode
            if (tag && (pO5 = tag.pO5)) {
                for (const pOut of bO5.pOuts)
                    pOut.pOuts.add(pO5)

                if (pO5.pOuts.done) {
                    for (const pOut of pO5.pOuts)
                        for (const pInc of pIncs)
                            pInc.pOuts.add(pOut)

                    break
                }

                pIncs.add(pO5)
                pO5.pOuts.done = true

                pTop = pO5
            }
        } while (tag && tag.nodeName !== 'HTML')
    },
    GetMaxIndex = pbO5 => {
        let zIndex = 0
        for (const pOut of pbO5.pOuts) {
            const aO7 = pOut.cnst.el.aO7shp
            zIndex = Math.max(
                zIndex,
                pOut.cnst.zIndex,
                (aO7 && aO7.act.isfix) ? aO7.cart.style.zIndex : 0)
        }
        return zIndex
    }
/**
* база - скроллируемый контейнер, содержащий общую информацию для подвисабельных объектов
*/
export class PBases {
    static #pbases = new Map()
    static #idn = 0
    tagCuts = new Set()
    aAll = []

    constructor(pO5) {
        this.pO5 = pO5
        this.idn = PBases.#idn++
        this.pBordss = { // список тех из pOut, которые оказались (соотв. стороной) внутри this.pO5
            T: [pO5], L: [pO5], R: [pO5], B: [pO5],
        }
        this.bChgs = { // въезжание вложенных контейнеров
            start: true,
            T: 0, L: 0, R: 0, B: 0,
            zIndex: GetMaxIndex(pO5)
        }

        for (const nam of ['bChgs'])
            Object.seal(this[nam])

        this.bO5s = {}  // списки aO7 в порядке удалённости от соттв. края  (т.е. от 'TLRB')
        for (const m of 'TLRB') {
            this.bO5s[m] = new Set()
            Object.freeze(this.bO5s[m])
        }

        Object.freeze(this.pBordss)
        Object.freeze(this)

        PBases.#pbases.set(pO5, this)
    }
    static #sorters = {   // по возрастанию
        T: (a1, a2) => a1.posO.top - a2.posO.top,
        L: (a1, a2) => a1.posO.left - a2.posO.left,
        R: (a1, a2) => (a2.posO.left + a2.posO.width) - (a1.posO.left + a1.posO.width),
        B: (a1, a2) => (a2.posO.top + a2.posO.height) - (a1.posO.top + a1.posO.height),
    }
    ReorderAOs() {
        for (const aO7 of this.aAll) {
            const p = aO7.shdw.getBoundingClientRect()
            Object.assign(aO7.posO, { top: p.top, left: p.left, height: p.height, width: p.width, right: p.right, bottom: p.bottom })
        }

        for (const m of 'TLRB') {
            this.aAll.sort(PBases.#sorters[m])

            this.bO5s[m].clear()
            for (const aO7 of this.aAll) {
                aO7.aO7s[m].clear()

                const aO = aO7.posO
                let i = this.aAll.indexOf(aO7)

                while (i-- > 0) {
                    const iO5 = this.aAll[i],
                        iO = iO5.posO

                    if ('TB'.includes(m) ? (
                        !(iO.right < aO.left || iO.left > aO.right) &&              // в стороне от aO7
                        (m === 'T' ? (aO.top > iO.bottom) : (aO.bottom < iO.top))   // перекрываются с aO7
                    ) : (
                        !(iO.bottom < aO.top || iO.top > aO.bottom) &&              // в стороне от aO7
                        (m === 'L' ? (aO.left > iO.right) : (aO.right < iO.left))   // перекрываются с aO7
                    ))
                        aO7.aO7s[m].add(iO5)
                }

                if (C.consts.debug > 2)
                    console.log(`${aO7.cnst.id}[${m}]: ` + Array.from(aO7.aO7s[m]).map(a => a.id).join(', '))
                this.bO5s[m].add(aO7)
            }
        }

        if (C.consts.debug > 1) {
            const ra = []
            for (const aO7 of this.aAll) {
                const r = { aO7: aO7.cnst.id }
                for (const m of 'TLRB')
                    r[m] = Array.from(aO7.aO7s[m]).map(a => a.id).join(', ')
                const i = aO7.cnst.id.substr(-1)
                ra[i] = r
            }
            C.ConsoleInfo(`Теги, расположенные с соотв. стороны от aO7  (по удалённости)`, ra.length, ra)
            const rb = []
            for (const m of 'TLRB')
                rb.push({ m: m, aO7s: Array.from(this.bO5s[m]).map(a => a.id).join(', ') })
            C.ConsoleInfo(`Теги, с соотв. стороны в контейнеры (по удалённости)`, rb.length, rb)
        }
    }
    static AddToBase(aO7) {
        let pTop, newPs = 0;
        const
            adds = new Set(),
            bO5 = FindAndFill(aO7, adds)

        if (!bO5) {
            console.error("%c%s", C.consts.fmtErr, ` Тегу ${aO7.name} не найден базовый контейнер — пропускаем`)
            return
        }

        if (C.consts.debug > 1)
            console.log(`AddToBase: ${aO7.name}: ${Array.from(adds).join(', ')} `)

        // подключаем (и создаём) pbase
        let pBase = PBases.#pbases.get(bO5)
        if (!pBase) {
            pBase = new PBases(bO5)   // там же и set()
            FillPOuts(bO5)
            newPs++
        }

        for (const pOut of bO5.pOuts)
            pOut.pBases.add(pBase)

        aO7.pBase = pBase
        if (!pBase.aAll.includes(aO7))
            pBase.aAll.push(aO7)

        return newPs
    }
    static SetBorders(x, pcO5) {
        for (const m of [x, opp[x]]) {
            const isTL = 'TL'.includes(m)

            for (const pBase of pcO5.pBases) {
                const
                    pbO5 = pBase.pO5,
                    pBords = pBase.pBordss[m],
                    tis0 = pbO5.scops.time === 0
                let chg = ''
                if (pbO5.scops.isVisible) {
                    const vb = pbO5.scops[m]

                    for (const pOut of pbO5.pOuts) {
                        if (pOut === pbO5)
                            continue

                        const
                            v = pOut.scops[m],
                            iOut = pBords.indexOf(pOut),
                            inside = isTL ? vb < v : vb >= v

                        // chg: либо было пересечение а теперь граница  pOut стала внутри pbO5; 
                        // либо пересечения не было а pOut вышло из-нутри pbO5
                        if (iOut >= 0) {
                            if (!inside) {
                                chg = `"удалил  '${pOut.name}'"`
                                pBords.splice(iOut, 1)
                            }
                        }
                        else
                            if (inside) {
                                let i = pBords.length
                                while (i-- > 0)
                                    if (isTL ? pBords[i].scops[m] >= v : pBords[i].scops[m] < v)
                                        break

                                pBords.splice(i, 0, pOut)
                                chg = `"добавил '${pOut.name}'"`
                            }
                    }
                    // не вылезла ли граница за пределы?
                    if (!chg) {
                        let v, i = 1, vi = pBords[0].scops[m]
                        while (!chg && i < pBords.length) {
                            v = vi
                            vi = pBords[i].scops[m]
                            if (isTL ? v < vi : v >= vi)
                                chg = `"изменил '${pBords[i].name}'"`
                            i++
                        }
                    }

                    if (chg || tis0)
                        pBords.sort((b1, b2) =>	 // по возрастанию						
                            isTL ? (b2.scops[m] - b1.scops[m]) : (b1.scops[m] - b2.scops[m]))
                }
                pBase.bChgs[m] = chg

                if (C.consts.debug > 1 && (chg || tis0))
                    console.log(
                        `скролл. ${pcO5.name} по [${m}] для ${pBase.pO5.cnst.id} '${chg}'   ` +
                        `${pBase.pBordss[m].map(b => b.name + ':' + ('' + b.scops[m]).padStart(4)).join(', ')}`
                    )
            }
        }
    }
    // делаем класс итерируемым
    static *[Symbol.iterator]() {
        for (const [pO5, pBase] of this.#pbases.entries()) {
            yield { pO5, pBase };
        }
    }
}
